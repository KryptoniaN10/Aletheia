// ============================================================
//  Stellar Info Router — testnet account info & DEX queries
//  GET /api/stellar/account/:address   — account balances
//  GET /api/stellar/dex/offers/:address — open DEX offers
//  POST /api/stellar/sponsor-trustline — create sponsored trustline
// ============================================================

import express from 'express';
import { horizonServer } from '../services/stellar.js';

const router = express.Router();

// ── Account info ──────────────────────────────────────────────
router.get('/account/:address', async (req, res, next) => {
  try {
    const account = await horizonServer.loadAccount(req.params.address);
    res.json({
      address: req.params.address,
      sequence: account.sequenceNumber(),
      balances: account.balances,
      thresholds: account.thresholds,
      flags: account.flags,
    });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'Account not found on testnet' });
    }
    next(err);
  }
});

// ── Open DEX offers for an account ───────────────────────────
router.get('/dex/offers/:address', async (req, res, next) => {
  try {
    const offers = await horizonServer
      .offers()
      .seller(req.params.address)
      .call();
    res.json(offers.records);
  } catch (err) {
    next(err);
  }
});

// ── Orderbook for a receivable asset pair ─────────────────────
router.get('/dex/orderbook', async (req, res, next) => {
  try {
    const { selling_code, selling_issuer, buying_code, buying_issuer } = req.query;
    const orderbook = await horizonServer
      .orderbook(
        { code: selling_code, issuer: selling_issuer },
        { code: buying_code, issuer: buying_issuer }
      )
      .call();
    res.json(orderbook);
  } catch (err) {
    next(err);
  }
});

// ── Horizon event stream endpoint (SSE) ──────────────────────
// Used by the frontend LiveFeed component to show real-time txs
router.get('/stream/payments/:address', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const closeStream = horizonServer
    .payments()
    .forAccount(req.params.address)
    .cursor('now')
    .stream({
      onmessage: (payment) => {
        res.write(`data: ${JSON.stringify(payment)}\n\n`);
      },
      onerror: (err) => {
        console.error('[Stream error]', err.message);
      },
    });

  req.on('close', () => {
    closeStream();
  });
});

export default router;
