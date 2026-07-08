// ============================================================
//  Stellar client — Malabar Ledger Frontend
//  Wraps Stellar SDK operations and provides a simulation layer
//  that mirrors the exact contract API surface. When real
//  contract IDs are deployed, swap the simulation calls for
//  real Soroban invocations — the API surface is identical.
// ============================================================

import { Horizon, Networks, Asset } from '@stellar/stellar-sdk';

const NETWORK = import.meta.env.VITE_STELLAR_NETWORK || 'testnet';
const HORIZON_URL = import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const horizonServer = new Horizon.Server(HORIZON_URL);

// ── Freighter wallet integration ──────────────────────────────

export async function connectFreighter() {
  // @stellar/freighter-api
  if (typeof window === 'undefined') return null;

  try {
    const { isConnected, getPublicKey, requestAccess } =
      await import('@stellar/freighter-api');

    const connected = await isConnected();
    if (!connected.isConnected) {
      const access = await requestAccess();
      if (access.error) throw new Error(access.error);
    }

    const { publicKey } = await getPublicKey();
    return publicKey;
  } catch (err) {
    // Freighter not installed — return null; UI handles this case
    console.warn('[Freighter] Not available:', err.message);
    return null;
  }
}

export async function getFreighterPublicKey() {
  try {
    const { getPublicKey } = await import('@stellar/freighter-api');
    const { publicKey } = await getPublicKey();
    return publicKey;
  } catch {
    return null;
  }
}

// ── Horizon queries ───────────────────────────────────────────

export async function getAccountBalances(publicKey) {
  try {
    const account = await horizonServer.loadAccount(publicKey);
    return account.balances;
  } catch {
    return [];
  }
}

export async function getTransactions(publicKey, limit = 10) {
  try {
    const txs = await horizonServer
      .transactions()
      .forAccount(publicKey)
      .limit(limit)
      .order('desc')
      .call();
    return txs.records;
  } catch {
    return [];
  }
}

// ── API helpers ───────────────────────────────────────────────

async function apiCall(path, method = 'GET', body = null, isFormData = false) {
  const opts = {
    method,
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    body: body
      ? isFormData
        ? body
        : JSON.stringify(body)
      : null,
  };
  const res = await fetch(`${API_URL}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Receivable API ────────────────────────────────────────────

export const receivablesApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/api/receivables${qs ? `?${qs}` : ''}`);
  },

  get: (id) => apiCall(`/api/receivables/${id}`),

  register: (formData) =>
    apiCall('/api/receivables/register', 'POST', formData, true),

  attest: (id, body) =>
    apiCall(`/api/receivables/${id}/attest`, 'POST', body),

  listSale: (id, body) =>
    apiCall(`/api/receivables/${id}/list-sale`, 'POST', body),

  buyShare: (id, body) =>
    apiCall(`/api/receivables/${id}/buy-share`, 'POST', body),
};

// ── KYC / Auth API ────────────────────────────────────────────

export const authApi = {
  startKyc: (body) => apiCall('/api/auth/kyc/start', 'POST', body),
  getKycStatus: (sessionId) => apiCall(`/api/auth/kyc/${sessionId}`),
  checkWalletKyc: (address) => apiCall(`/api/auth/wallets/${address}/kyc`),
  approveKyc: (sessionId) => apiCall(`/api/auth/kyc/${sessionId}/approve`, 'POST'),
  rejectKyc: (sessionId, body) => apiCall(`/api/auth/kyc/${sessionId}/reject`, 'POST', body),
  listSessions: () => apiCall('/api/auth/kyc'),
};

// ── Oracle API ────────────────────────────────────────────────

export const oracleApi = {
  confirmPayment: (id, body) =>
    apiCall(`/api/oracle/${id}/confirm-payment`, 'POST', body),
  distribute: (id, body) =>
    apiCall(`/api/oracle/${id}/distribute`, 'POST', body),
  clawback: (id, body) =>
    apiCall(`/api/oracle/${id}/clawback`, 'POST', body),
  events: () => apiCall('/api/oracle/events'),
};

// ── Stellar info API ──────────────────────────────────────────

export const stellarApi = {
  getAccount: (address) => apiCall(`/api/stellar/account/${address}`),
  getOffers:  (address) => apiCall(`/api/stellar/dex/offers/${address}`),
  getOrderbook: (params) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/api/stellar/dex/orderbook?${qs}`);
  },
  createDexListing: (body) => apiCall('/api/stellar/dex/list', 'POST', body),
  sponsorTrustline: (body) => apiCall('/api/stellar/sponsor-trustline', 'POST', body),
};

// ── Utilities ─────────────────────────────────────────────────

/**
 * Format a Stellar public key for display: GABCD...WXYZ
 */
export function formatAddress(address, chars = 4) {
  if (!address) return '';
  return `${address.slice(0, chars + 1)}...${address.slice(-chars)}`;
}

/**
 * Format USD cents to "$X,XXX.XX"
 */
export function formatUsd(cents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Format a receivable's yield: discount_bps → "5.00% discount / X.X% APY"
 */
export function formatYield(discountBps, daysToMaturity) {
  const discount = discountBps / 100;
  const apy = daysToMaturity
    ? ((discountBps / 10000) / (daysToMaturity / 365)) * 100
    : null;
  return {
    discount: `${discount.toFixed(2)}%`,
    apy: apy ? `${apy.toFixed(1)}% APY` : null,
  };
}

/**
 * Days until maturity
 */
export function daysUntil(dateStr) {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}

/**
 * Status → badge class mapping
 */
export const STATUS_BADGE = {
  pending:  'badge-pending',
  attested: 'badge-attested',
  active:   'badge-active',
  settled:  'badge-settled',
  settled_pending: 'badge-active',
  clawback: 'badge-clawback',
};

export const STATUS_LABEL = {
  pending:  'Pending',
  attested: 'Attested',
  active:   'For Sale',
  settled_pending: 'Payout Ready',
  settled:  'Settled',
  clawback: 'Clawback',
};
