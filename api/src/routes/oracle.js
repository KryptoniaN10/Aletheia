// ============================================================
//  Oracle Router — Judge-triggerable payment confirmation
//  POST /api/oracle/:id/confirm-payment  — confirm importer payment
//  POST /api/oracle/:id/distribute       — trigger pro-rata payout
//  POST /api/oracle/:id/clawback         — emergency clawback
//  GET  /api/oracle/events               — list all oracle events
// ============================================================

import express from 'express';
import { getDb } from '../db/schema.js';

const router = express.Router();

// ── Confirm importer payment (judge-triggerable) ──────────────
// In production: called by an automated oracle reading SWIFT/SEPA feeds.
// For demo: a button in the Admin Panel calls this endpoint.
router.post('/:id/confirm-payment', async (req, res, next) => {
  try {
    const db = getDb();
    const { confirmed_amount_usd, proof, triggered_by } = req.body;
    const receivableId = parseInt(req.params.id);

    const rec = db.prepare('SELECT * FROM receivables WHERE id = ?').get(receivableId);
    if (!rec) return res.status(404).json({ error: 'Receivable not found' });
    if (rec.status !== 'active') {
      return res.status(400).json({ error: 'Receivable must be active to confirm payment' });
    }

    const amountUsd = parseFloat(confirmed_amount_usd) || rec.amount_usd;
    const paymentProof = proof || `DEMO-CONFIRM-${Date.now()}`;

    // Record oracle event
    db.prepare(
      `INSERT INTO oracle_events
        (receivable_id, event_type, amount_cents, proof, triggered_by)
       VALUES (?, 'payment_confirmed', ?, ?, ?)`
    ).run(receivableId, Math.round(amountUsd * 100), paymentProof, triggered_by || 'oracle');

    // Update receivable status
    db.prepare(
      "UPDATE receivables SET status = 'settled_pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(receivableId);

    // ── TODO: Call SettlementEscrow.confirm_payment() on-chain ──

    res.json({
      receivable_id: receivableId,
      confirmed_amount_usd: amountUsd,
      proof: paymentProof,
      status: 'settled_pending',
      message: 'Payment confirmed. Ready to distribute to investors.',
    });
  } catch (err) {
    next(err);
  }
});

// ── Distribute pro-rata payout ────────────────────────────────
router.post('/:id/distribute', async (req, res, next) => {
  try {
    const db = getDb();
    const receivableId = parseInt(req.params.id);
    const { triggered_by } = req.body;

    const rec = db.prepare('SELECT * FROM receivables WHERE id = ?').get(receivableId);
    if (!rec) return res.status(404).json({ error: 'Not found' });
    if (rec.status !== 'settled_pending') {
      return res.status(400).json({ error: 'Payment must be confirmed first' });
    }

    // Get all investments for this receivable
    const investments = db
      .prepare('SELECT * FROM investments WHERE receivable_id = ?')
      .all(receivableId);

    if (investments.length === 0) {
      return res.status(400).json({ error: 'No investors to pay out' });
    }

    // Calculate pro-rata payouts
    const confirmEvent = db
      .prepare("SELECT * FROM oracle_events WHERE receivable_id = ? AND event_type = 'payment_confirmed' ORDER BY occurred_at DESC LIMIT 1")
      .get(receivableId);

    const totalConfirmedCents = confirmEvent?.amount_cents || Math.round(rec.amount_usd * 100);
    const totalShareCents = investments.reduce((sum, inv) => sum + inv.share_cents, 0);

    const payouts = investments.map((inv, idx) => {
      const isLast = idx === investments.length - 1;
      const paid = investments.slice(0, idx).reduce((s, i) =>
        s + Math.floor(totalConfirmedCents * i.share_cents / totalShareCents), 0);
      const payout = isLast
        ? totalConfirmedCents - paid
        : Math.floor(totalConfirmedCents * inv.share_cents / totalShareCents);

      return {
        investor_address: inv.investor_address,
        share_cents: inv.share_cents,
        payout_cents: payout,
        payout_usd: (payout / 100).toFixed(2),
      };
    });

    // Mark as settled
    db.prepare(
      "UPDATE receivables SET status = 'settled', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(receivableId);

    db.prepare(
      `INSERT INTO oracle_events
        (receivable_id, event_type, amount_cents, proof, triggered_by)
       VALUES (?, 'distributed', ?, 'auto', ?)`
    ).run(receivableId, totalConfirmedCents, triggered_by || 'oracle');

    // ── TODO: Call SettlementEscrow.distribute() on-chain ───────

    res.json({
      receivable_id: receivableId,
      total_distributed_usd: (totalConfirmedCents / 100).toFixed(2),
      investor_count: investments.length,
      payouts,
      status: 'settled',
      message: 'Pro-rata payout complete!',
    });
  } catch (err) {
    next(err);
  }
});

// ── Emergency clawback ────────────────────────────────────────
router.post('/:id/clawback', async (req, res, next) => {
  try {
    const db = getDb();
    const { reason, triggered_by } = req.body;
    const receivableId = parseInt(req.params.id);

    const rec = db.prepare('SELECT * FROM receivables WHERE id = ?').get(receivableId);
    if (!rec) return res.status(404).json({ error: 'Not found' });

    db.prepare(
      "UPDATE receivables SET status = 'clawback', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(receivableId);

    db.prepare(
      `INSERT INTO oracle_events
        (receivable_id, event_type, proof, triggered_by)
       VALUES (?, 'clawback', ?, ?)`
    ).run(receivableId, reason || 'Fraud/dispute', triggered_by || 'admin');

    // ── TODO: Call SettlementEscrow.clawback() + Stellar clawback op

    res.json({
      receivable_id: receivableId,
      status: 'clawback',
      reason: reason || 'Fraud/dispute',
      message: 'Clawback initiated on all receivable tokens',
    });
  } catch (err) {
    next(err);
  }
});

// ── List oracle events ────────────────────────────────────────
router.get('/events', (_req, res) => {
  const db = getDb();
  const events = db
    .prepare('SELECT * FROM oracle_events ORDER BY occurred_at DESC LIMIT 100')
    .all();
  res.json(events);
});

export default router;
