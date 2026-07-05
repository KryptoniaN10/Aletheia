// ============================================================
//  Malabar Ledger — Off-chain Verification API
//  Handles: document upload + hashing, attestation routing,
//  mock KYC/Anchor SEP-24, oracle payment confirmation,
//  and Stellar testnet coordination.
// ============================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db/schema.js';
import receivablesRouter from './routes/receivables.js';
import authRouter from './routes/auth.js';
import oracleRouter from './routes/oracle.js';
import stellarRouter from './routes/stellar.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// ── Health ────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'malabar-ledger-api',
    network: process.env.STELLAR_NETWORK || 'testnet',
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/receivables', receivablesRouter);
app.use('/api/auth', authRouter);
app.use('/api/oracle', oracleRouter);
app.use('/api/stellar', stellarRouter);

// ── Error handler ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[API Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ── Start ─────────────────────────────────────────────────────
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🌊 Malabar Ledger API running on http://localhost:${PORT}`);
    console.log(`   Network: ${process.env.STELLAR_NETWORK || 'testnet'}`);
    console.log(`   Horizon: ${process.env.STELLAR_HORIZON_URL}\n`);
  });
});
