// ============================================================
//  Receivables Router — Malabar Ledger API
//  POST /api/receivables/register    — upload doc + register on-chain
//  GET  /api/receivables             — list all receivables
//  GET  /api/receivables/:id         — get single receivable
//  POST /api/receivables/:id/attest  — attestor signs off
//  POST /api/receivables/:id/list-sale — exporter lists for fractional sale
//  POST /api/receivables/:id/buy-share — investor purchases fraction
// ============================================================

import express from 'express';
import multer from 'multer';
import { getDb } from '../db/schema.js';
import { sha256, pinToIPFS, validateDocument, validateIEC } from '../services/ipfs.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── List all receivables ──────────────────────────────────────
router.get('/', (req, res) => {
  const db = getDb();
  const { status, exporter } = req.query;

  let sql = 'SELECT * FROM receivables WHERE 1=1';
  const params = [];

  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (exporter) { sql += ' AND exporter_address = ?'; params.push(exporter); }

  sql += ' ORDER BY created_at DESC';

  const rows = db.prepare(sql).all(...params);

  // Attach attestation counts
  const withAttestations = rows.map((r) => {
    const attestations = db
      .prepare('SELECT * FROM attestations WHERE receivable_id = ?')
      .all(r.id);
    const investments = db
      .prepare('SELECT * FROM investments WHERE receivable_id = ?')
      .all(r.id);
    return { ...r, attestations, investments };
  });

  res.json(withAttestations);
});

// ── Get single receivable ─────────────────────────────────────
router.get('/:id', (req, res) => {
  const db = getDb();
  const rec = db
    .prepare('SELECT * FROM receivables WHERE id = ?')
    .get(req.params.id);

  if (!rec) return res.status(404).json({ error: 'Not found' });

  const attestations = db
    .prepare('SELECT * FROM attestations WHERE receivable_id = ?')
    .all(rec.id);
  const investments = db
    .prepare('SELECT * FROM investments WHERE receivable_id = ?')
    .all(rec.id);
  const events = db
    .prepare('SELECT * FROM oracle_events WHERE receivable_id = ? ORDER BY occurred_at DESC')
    .all(rec.id);

  res.json({ ...rec, attestations, investments, events });
});

// ── Register a new receivable ─────────────────────────────────
router.post('/register', upload.single('document'), async (req, res, next) => {
  try {
    const db = getDb();
    const {
      exporter_address,
      exporter_name,
      buyer_name,
      buyer_country,
      amount_usd,
      maturity_date,
      iec_code,
      commodity,
      attestors, // JSON array string
    } = req.body;

    // ── Validation ───────────────────────────────────────────
    if (!req.file) return res.status(400).json({ error: 'Document required' });
    if (!exporter_address) return res.status(400).json({ error: 'exporter_address required' });
    if (!amount_usd || parseFloat(amount_usd) <= 0) {
      return res.status(400).json({ error: 'Valid amount_usd required' });
    }
    if (!maturity_date) return res.status(400).json({ error: 'maturity_date required' });

    // IEC validation (format only — live DGFT API is Phase 2)
    if (iec_code && !validateIEC(iec_code)) {
      return res.status(400).json({
        error: 'IEC code must be a 10-digit number',
        note: 'Live DGFT validation is a Phase 2 feature',
      });
    }

    validateDocument(req.file.buffer, req.file.mimetype);

    // ── Document hash ─────────────────────────────────────────
    const docHash = sha256(req.file.buffer);

    // ── IPFS pin ──────────────────────────────────────────────
    const { cid, hashOnly } = await pinToIPFS(
      req.file.buffer,
      req.file.originalname,
      { exporter: exporter_address, amount_usd }
    );

    // ── Store in DB ───────────────────────────────────────────
    const result = db
      .prepare(
        `INSERT INTO receivables
          (exporter_address, exporter_name, buyer_name, buyer_country,
           amount_usd, maturity_date, doc_hash, ipfs_cid, doc_filename,
           iec_code, commodity, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
      )
      .run(
        exporter_address, exporter_name, buyer_name, buyer_country,
        parseFloat(amount_usd), maturity_date,
        docHash, cid, req.file.originalname,
        iec_code, commodity
      );

    const newId = result.lastInsertRowid;

    // ── TODO: Call on-chain ReceivableRegistry.register_receivable ───
    // When Soroban contracts are deployed, invoke here:
    //   const { txHash, result: chainId } = await invokeContract(
    //     process.env.RECEIVABLE_REGISTRY_CONTRACT_ID,
    //     'register_receivable',
    //     [...args],
    //     process.env.ISSUER_SECRET_KEY
    //   );
    //   db.prepare('UPDATE receivables SET chain_id = ? WHERE id = ?').run(chainId, newId);

    res.status(201).json({
      id: newId,
      doc_hash: docHash,
      ipfs_cid: cid,
      hash_only: hashOnly,
      status: 'pending',
      message: 'Receivable registered. Awaiting 2-of-3 attestations.',
    });
  } catch (err) {
    next(err);
  }
});

// ── Attest a receivable ───────────────────────────────────────
router.post('/:id/attest', async (req, res, next) => {
  try {
    const db = getDb();
    const { attestor_address, attestor_role, tx_hash } = req.body;
    const receivableId = parseInt(req.params.id);

    if (!attestor_address) return res.status(400).json({ error: 'attestor_address required' });

    const rec = db.prepare('SELECT * FROM receivables WHERE id = ?').get(receivableId);
    if (!rec) return res.status(404).json({ error: 'Receivable not found' });
    if (rec.status !== 'pending') {
      return res.status(400).json({ error: 'Receivable is not pending' });
    }

    // Check for duplicate
    const existing = db
      .prepare('SELECT id FROM attestations WHERE receivable_id = ? AND attestor_address = ?')
      .get(receivableId, attestor_address);
    if (existing) return res.status(409).json({ error: 'Already attested' });

    // Record attestation
    db.prepare(
      'INSERT INTO attestations (receivable_id, attestor_address, attestor_role, tx_hash) VALUES (?, ?, ?, ?)'
    ).run(receivableId, attestor_address, attestor_role || 'unknown', tx_hash || null);

    // Count attestations
    const count = db
      .prepare('SELECT COUNT(*) as c FROM attestations WHERE receivable_id = ?')
      .get(receivableId).c;

    db.prepare('UPDATE receivables SET attestation_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(count, receivableId);

    // If 2-of-3 threshold met, move to attested
    if (count >= 2 && rec.status === 'pending') {
      const assetCode = `ML${String(receivableId).padStart(4, '0')}`;
      db.prepare(
        "UPDATE receivables SET status = 'attested', token_asset_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).run(assetCode, receivableId);

      // ── TODO: Call on-chain ReceivableRegistry.attest() ──────
      // Then trigger mint via asset issuance + authorized trustlines

      return res.json({
        attestation_count: count,
        status: 'attested',
        token_asset_code: assetCode,
        message: 'Threshold met — receivable token minted!',
      });
    }

    res.json({
      attestation_count: count,
      status: 'pending',
      message: `${count}/2 attestations received. ${2 - count} more required.`,
    });
  } catch (err) {
    next(err);
  }
});

// ── List receivable for fractional sale ───────────────────────
router.post('/:id/list-sale', async (req, res, next) => {
  try {
    const db = getDb();
    const { discount_bps } = req.body;
    const receivableId = parseInt(req.params.id);

    const rec = db.prepare('SELECT * FROM receivables WHERE id = ?').get(receivableId);
    if (!rec) return res.status(404).json({ error: 'Not found' });
    if (rec.status !== 'attested') {
      return res.status(400).json({ error: 'Receivable must be attested before listing' });
    }

    const bps = parseInt(discount_bps) || 500; // default 5%
    const salePrice = rec.amount_usd * (1 - bps / 10000);

    db.prepare(
      "UPDATE receivables SET status = 'active', discount_bps = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(bps, receivableId);

    // ── TODO: Call FractionalSale.list_for_sale() on-chain ────

    res.json({
      receivable_id: receivableId,
      face_value_usd: rec.amount_usd,
      discount_bps: bps,
      sale_price_usd: salePrice,
      status: 'active',
      message: 'Listed for fractional sale',
    });
  } catch (err) {
    next(err);
  }
});

// ── Buy a fractional share ────────────────────────────────────
router.post('/:id/buy-share', async (req, res, next) => {
  try {
    const db = getDb();
    const { investor_address, share_usd, tx_hash } = req.body;
    const receivableId = parseInt(req.params.id);

    const rec = db.prepare('SELECT * FROM receivables WHERE id = ?').get(receivableId);
    if (!rec) return res.status(404).json({ error: 'Not found' });
    if (rec.status !== 'active') {
      return res.status(400).json({ error: 'Receivable is not open for investment' });
    }

    const shareUsd = parseFloat(share_usd);
    const discountBps = rec.discount_bps || 500;
    const paymentUsd = shareUsd * (1 - discountBps / 10000);

    db.prepare(
      'INSERT INTO investments (receivable_id, investor_address, share_cents, payment_cents, tx_hash) VALUES (?, ?, ?, ?, ?)'
    ).run(
      receivableId, investor_address,
      Math.round(shareUsd * 100),
      Math.round(paymentUsd * 100),
      tx_hash || null
    );

    // ── TODO: Call FractionalSale.buy_share() on-chain ────────

    res.status(201).json({
      receivable_id: receivableId,
      investor_address,
      share_usd: shareUsd,
      payment_usd: paymentUsd,
      discount_bps: discountBps,
      message: 'Share purchased successfully',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
