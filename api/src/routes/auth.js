// ============================================================
//  Auth Router — Mock SEP-24 KYC flow
//  POST /api/auth/kyc/start     — begin KYC session
//  GET  /api/auth/kyc/:session  — check KYC status
//  POST /api/auth/kyc/:session/approve — admin approves (demo)
//  GET  /api/auth/wallets/:address/kyc — check if wallet is KYC'd
// ============================================================

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/schema.js';
import { authorizeInvestorTrustline, createSponsoredTrustline } from '../services/stellar.js';
import crypto from 'crypto';

// ── Password helpers (PBKDF2, no extra packages) ──────────────
const SALT_ROUNDS = 10000;
const KEY_LEN = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, SALT_ROUNDS, KEY_LEN, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, storedHash] = stored.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, SALT_ROUNDS, KEY_LEN, 'sha512').toString('hex');
  return hash === storedHash;
}

const router = express.Router();

// ── Register a new user ───────────────────────────────────────
router.post('/register', (req, res) => {
  const db = getDb();
  const { username, email, password, role, full_name, company_name } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'username, email, password and role are required' });
  }
  if (!['investor', 'exporter'].includes(role)) {
    return res.status(400).json({ error: 'role must be investor or exporter' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(409).json({ error: 'An account with that username or email already exists.' });
  }

  const password_hash = hashPassword(password);
  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash, role, full_name, company_name) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(username, email, password_hash, role, full_name || null, company_name || null);

  res.status(201).json({ id: result.lastInsertRowid, username, email, role, message: 'Account created successfully.' });
});

// ── Login ─────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const db = getDb();
  const { identifier, password, requested_role } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'identifier (username or email) and password are required' });
  }

  // Check admin credentials first (hardcoded, can log in from any portal tab)
  if ((identifier === 'admin' || identifier === 'admin@aletheia.io') && password === 'admin') {
    return res.json({
      id: 0,
      username: 'admin',
      email: 'admin@aletheia.io',
      role: 'admin',
      wallet_address: 'GDEMO5LOGISTICS1PARTNER1ALETHEIA1FREIGHT1111111111111111',
      message: 'Admin login successful.'
    });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(identifier, identifier);

  if (!user) {
    return res.status(401).json({ error: 'No account found with that username or email.' });
  }

  if (!verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  // Enforce portal gate — non-admins must use their registered portal
  if (requested_role && user.role !== 'admin' && user.role !== requested_role) {
    return res.status(403).json({ error: `This account is registered as an ${user.role}. Please use the ${user.role} portal.` });
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    company_name: user.company_name,
    wallet_address: user.wallet_address,
    message: 'Login successful.'
  });
});

// In production: redirect to an Anchor's SEP-24 interactive flow.
// Here: collect basic info and store as pending.
router.post('/kyc/start', (req, res) => {
  const db = getDb();
  const { wallet_address, name, email, pan_number } = req.body;

  if (!wallet_address) return res.status(400).json({ error: 'wallet_address required' });

  // Check if already KYC'd
  const existing = db
    .prepare("SELECT * FROM kyc_sessions WHERE wallet_address = ? AND status = 'approved'")
    .get(wallet_address);
  if (existing) {
    return res.json({ session_id: existing.id, status: 'approved', already_approved: true });
  }

  const sessionId = uuidv4();

  db.prepare(
    'INSERT OR REPLACE INTO kyc_sessions (id, wallet_address, name, email, pan_number) VALUES (?, ?, ?, ?, ?)'
  ).run(sessionId, wallet_address, name, email, pan_number);

  res.status(201).json({
    session_id: sessionId,
    status: 'pending',
    message: 'KYC session started. Awaiting review.',
    // In production: return SEP-24 interactive_url here
    interactive_url: `${process.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/kyc/${sessionId}/interactive`,
  });
});

// ── Get KYC status ────────────────────────────────────────────
router.get('/kyc/:session', (req, res) => {
  const db = getDb();
  const session = db
    .prepare('SELECT * FROM kyc_sessions WHERE id = ?')
    .get(req.params.session);

  if (!session) return res.status(404).json({ error: 'Session not found' });

  res.json({
    session_id: session.id,
    wallet_address: session.wallet_address,
    status: session.status,
    started_at: session.started_at,
    completed_at: session.completed_at,
  });
});

// ── Check KYC by wallet address ───────────────────────────────
router.get('/wallets/:address/kyc', (req, res) => {
  const db = getDb();
  const session = db
    .prepare("SELECT * FROM kyc_sessions WHERE wallet_address = ? ORDER BY started_at DESC LIMIT 1")
    .get(req.params.address);

  if (!session) return res.json({ kyc_status: 'none', approved: false });

  res.json({
    kyc_status: session.status,
    approved: session.status === 'approved',
    session_id: session.id,
    completed_at: session.completed_at,
  });
});

// ── Admin: Approve KYC (demo trigger) ────────────────────────
// In production: the Anchor performs this after reviewing documents.
// For the demo: a judge or admin can click "Approve" in the admin panel.
router.post('/kyc/:session/approve', async (req, res, next) => {
  try {
    const db = getDb();
    const session = db
      .prepare('SELECT * FROM kyc_sessions WHERE id = ?')
      .get(req.params.session);

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'approved') {
      return res.json({ message: 'Already approved', session_id: session.id });
    }

    db.prepare(
      "UPDATE kyc_sessions SET status = 'approved', completed_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(req.params.session);

    let stellarResult = { sponsored_reserve: false, trustline_authorized: false };

    // ── Sponsored Reserve + Trustline Authorization ───────────
    // When ISSUER_SECRET_KEY is set (i.e., contracts are deployed),
    // this sponsors the trustline reserve so the investor doesn't need XLM,
    // and authorizes the trustline so they can receive AUTH_REQUIRED tokens.
    if (process.env.ISSUER_SECRET_KEY && process.env.FRACTIONAL_SALE_CONTRACT_ID) {
      try {
        const { Asset } = await import('@stellar/stellar-sdk');
        const issuerPublicKey = process.env.ISSUER_PUBLIC_KEY;

        // Get all active receivable asset codes so we can authorize each
        const activeReceivables = db
          .prepare("SELECT token_asset_code FROM receivables WHERE status IN ('attested','active') AND token_asset_code IS NOT NULL")
          .all();

        for (const rec of activeReceivables) {
          const asset = new Asset(rec.token_asset_code, issuerPublicKey);
          await authorizeInvestorTrustline(session.wallet_address, asset);
          stellarResult.trustline_authorized = true;
        }
      } catch (stellarErr) {
        // Non-fatal — KYC is approved in the DB regardless
        console.warn('[KYC approve] Stellar trustline step failed (demo mode ok):', stellarErr.message);
      }
    }

    res.json({
      session_id: req.params.session,
      wallet_address: session.wallet_address,
      status: 'approved',
      stellar: stellarResult,
      message: stellarResult.trustline_authorized
        ? 'KYC approved and trustlines authorized on Stellar.'
        : 'KYC approved. Connect Soroban contracts to auto-authorize trustlines.',
    });
  } catch (err) {
    next(err);
  }
});


// ── Admin: Reject KYC ─────────────────────────────────────────
router.post('/kyc/:session/reject', (req, res) => {
  const db = getDb();
  const { reason } = req.body;

  db.prepare(
    "UPDATE kyc_sessions SET status = 'rejected', completed_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(req.params.session);

  res.json({ session_id: req.params.session, status: 'rejected', reason });
});

// ── List all KYC sessions (admin) ────────────────────────────
router.get('/kyc', (_req, res) => {
  const db = getDb();
  const sessions = db
    .prepare('SELECT * FROM kyc_sessions ORDER BY started_at DESC')
    .all();
  res.json(sessions);
});

// ── Link user to wallet address ──────────────────────────────
router.put('/users/:id/wallet', (req, res) => {
  const db = getDb();
  const { wallet_address } = req.body;
  const { id } = req.params;

  if (!wallet_address) {
    return res.status(400).json({ error: 'wallet_address required' });
  }

  db.prepare('UPDATE users SET wallet_address = ? WHERE id = ?').run(wallet_address, id);
  res.json({ message: 'User wallet address updated successfully.', id, wallet_address });
});

// ── Mock SEP-24 Interactive KYC Page ─────────────────────────
// GET /api/auth/kyc/:session/interactive
// In production: this would be the Anchor's hosted KYC form.
// For demo: returns a minimal HTML page that simulates the KYC step.
router.get('/kyc/:session/interactive', (req, res) => {
  const db = getDb();
  const session = db.prepare('SELECT * FROM kyc_sessions WHERE id = ?').get(req.params.session);

  if (!session) {
    return res.status(404).send('<h1>Session not found</h1>');
  }

  const apiBase = process.env.VITE_API_URL || 'http://localhost:3001';

  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aletheia — KYC Verification</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0a1628; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #111c30; border: 1px solid #1e3a5f; border-radius: 16px; padding: 40px; max-width: 480px; width: 100%; }
    .logo { font-size: 1.4rem; font-weight: 800; color: #00c9a7; margin-bottom: 8px; }
    .subtitle { color: #64748b; font-size: 0.85rem; margin-bottom: 32px; }
    h2 { font-size: 1.3rem; margin-bottom: 8px; }
    .field { margin-bottom: 16px; }
    .label { font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px; display: block; }
    .value { font-size: 0.9rem; font-family: monospace; word-break: break-all; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
    .badge-pending { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .badge-approved { background: rgba(0,201,167,0.15); color: #00c9a7; }
    .btn { display: block; width: 100%; padding: 14px; border-radius: 10px; border: none; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; margin-top: 24px; }
    .btn-primary { background: linear-gradient(135deg, #00c9a7, #0098d4); color: #fff; }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .msg { margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 0.85rem; display: none; }
    .msg-success { background: rgba(0,201,167,0.15); color: #00c9a7; border: 1px solid rgba(0,201,167,0.3); }
    .msg-error { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
    .sep { border: none; border-top: 1px solid #1e3a5f; margin: 24px 0; }
    .note { font-size: 0.72rem; color: #475569; text-align: center; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">⚖️ Aletheia</div>
    <div class="subtitle">Investor Identity Verification (Mock SEP-24 KYC)</div>
    <h2>Verify Your Identity</h2>
    <hr class="sep">
    <div class="field">
      <span class="label">Session ID</span>
      <span class="value">${session.id}</span>
    </div>
    <div class="field">
      <span class="label">Wallet Address</span>
      <span class="value">${session.wallet_address}</span>
    </div>
    <div class="field">
      <span class="label">Applicant Name</span>
      <span class="value">${session.name || '—'}</span>
    </div>
    <div class="field">
      <span class="label">Email</span>
      <span class="value">${session.email || '—'}</span>
    </div>
    <div class="field">
      <span class="label">Status</span>
      <span class="badge badge-${session.status === 'approved' ? 'approved' : 'pending'}">${session.status}</span>
    </div>

    ${session.status === 'approved'
      ? `<div class="msg msg-success" id="msg" style="display:block">✓ Your KYC is already approved. You can close this window.</div>`
      : `<button class="btn btn-primary" id="approveBtn" onclick="approve()">
           ✓ Confirm Identity &amp; Proceed
         </button>
         <div class="msg msg-success" id="msgSuccess">✓ Identity verified! KYC approved. You can close this window and return to the app.</div>
         <div class="msg msg-error" id="msgError">Something went wrong. Please try again.</div>`
    }

    <div class="note">
      This is a simulated KYC flow for the Stellar Build Better 2026 hackathon demo.<br>
      In production, this would be a full Anchor-hosted SEP-24 interactive flow.
    </div>
  </div>

  <script>
    async function approve() {
      const btn = document.getElementById('approveBtn');
      btn.disabled = true;
      btn.textContent = 'Verifying…';
      try {
        const res = await fetch('${apiBase}/api/auth/kyc/${req.params.session}/approve', { method: 'POST' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        document.getElementById('msgSuccess').style.display = 'block';
        btn.style.display = 'none';
      } catch(e) {
        document.getElementById('msgError').style.display = 'block';
        btn.disabled = false;
        btn.textContent = '✓ Confirm Identity & Proceed';
      }
    }
  </script>
</body>
</html>`);
});

export default router;
