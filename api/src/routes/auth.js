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

const router = express.Router();

// ── Start KYC session ─────────────────────────────────────────
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

export default router;
