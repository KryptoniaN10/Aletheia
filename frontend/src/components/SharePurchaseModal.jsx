import React, { useState } from 'react';
import { receivablesApi, formatUsd, formatYield, daysUntil } from '../stellar/client.js';

// ── Share Purchase Modal ───────────────────────────────────────
// Investor selects how much of a receivable to buy.
// Shows real-time cost calculation with discount applied.
export default function SharePurchaseModal({ receivable, investorAddress, onClose, onSuccess }) {
  const { id, commodity, amount_usd, discount_bps, maturity_date, investments = [] } = receivable;

  const discountBps = discount_bps || 500;
  const totalInvested = investments.reduce((s, i) => s + i.share_cents / 100, 0);
  const remaining = Math.max(0, amount_usd - totalInvested);

  const MIN_SHARE = 100;        // $100 minimum
  const [shareUsd, setShareUsd] = useState(Math.min(remaining, 1000));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const discountAmt = shareUsd * (discountBps / 10000);
  const paymentUsd = shareUsd - discountAmt;
  const days = daysUntil(maturity_date);
  const { apy } = formatYield(discountBps, days);

  async function handleBuy() {
    setLoading(true);
    setError(null);
    try {
      const result = await receivablesApi.buyShare(id, {
        investor_address: investorAddress,
        share_usd: shareUsd,
      });
      setSuccess(result);
      onSuccess?.(result);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🎉</div>
          <h3 style={{ marginBottom: 'var(--space-3)', fontFamily: 'var(--font-display)' }}>
            Share Purchased!
          </h3>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-5)' }}>
            You invested <strong style={{ color: 'var(--color-saffron)' }}>{formatUsd(paymentUsd * 100)}</strong> for a
            face value of <strong style={{ color: 'var(--color-teal-light)' }}>{formatUsd(shareUsd * 100)}</strong>.
            Payout will occur when the importer's payment clears.
          </p>
          <div className="alert alert-success" style={{ marginBottom: 'var(--space-5)', textAlign: 'left' }}>
            Receivable tokens will be transferred to your wallet once the issuer authorizes your trustline.
            {apy && ` Estimated yield: ${apy}.`}
          </div>
          <button className="btn btn-primary btn-full" onClick={onClose} id="purchase-done-btn">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 2 }}>
              Invest in Receivable
            </h3>
            <div className="text-ui-xs text-muted">
              {commodity || 'Export Receivable'} · #{id}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} id="purchase-modal-close">✕</button>
        </div>

        {/* Available capacity */}
        <div className="alert alert-info" style={{ marginBottom: 'var(--space-5)' }}>
          <span className="text-ui-sm">
            Available: <strong>{formatUsd(remaining * 100)}</strong> of {formatUsd(amount_usd * 100)} face value
          </span>
        </div>

        {/* Slider */}
        <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
          <label className="form-label">
            Your Share — Face Value
          </label>
          <input
            type="range"
            min={MIN_SHARE}
            max={remaining}
            step={100}
            value={shareUsd}
            onChange={(e) => setShareUsd(Number(e.target.value))}
            id="share-slider"
          />
          <div className="flex items-center justify-between" style={{ marginTop: 'var(--space-2)' }}>
            <span className="text-ui-xs text-muted">${MIN_SHARE}</span>
            <span className="text-ui-lg" style={{ fontWeight: 700, color: 'var(--color-teal-light)' }}>
              {formatUsd(shareUsd * 100)}
            </span>
            <span className="text-ui-xs text-muted">{formatUsd(remaining * 100)}</span>
          </div>
        </div>

        {/* Cost breakdown */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-5)',
        }}>
          <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>Cost Breakdown</div>

          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
            <span className="text-ui-sm text-secondary">Face value acquired</span>
            <span className="text-ui-sm" style={{ fontWeight: 600 }}>{formatUsd(shareUsd * 100)}</span>
          </div>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
            <span className="text-ui-sm text-secondary">Discount ({(discountBps / 100).toFixed(1)}%)</span>
            <span className="text-ui-sm" style={{ color: 'var(--color-green-light)', fontWeight: 600 }}>
              −{formatUsd(discountAmt * 100)}
            </span>
          </div>
          <div className="divider" style={{ margin: 'var(--space-3) 0' }} />
          <div className="flex items-center justify-between">
            <span style={{ fontWeight: 700 }}>You pay today</span>
            <span style={{ fontWeight: 700, color: 'var(--color-saffron)', fontSize: '1.15rem' }}>
              {formatUsd(paymentUsd * 100)} USDC
            </span>
          </div>
          {apy && (
            <div className="text-ui-xs text-muted" style={{ marginTop: 'var(--space-2)' }}>
              Implied annualized yield: {apy} over {days} days
            </div>
          )}
        </div>

        {/* Wallet info */}
        {!investorAddress ? (
          <div className="alert alert-warning" style={{ marginBottom: 'var(--space-4)' }}>
            Connect your wallet to invest
          </div>
        ) : (
          <div className="alert alert-info" style={{ marginBottom: 'var(--space-4)' }}>
            <span className="text-ui-sm">
              Investing from: <span className="monospace">{investorAddress.slice(0,6)}...{investorAddress.slice(-4)}</span>
              {' '}· KYC required to receive receivable tokens
            </span>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button className="btn btn-ghost btn-full" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-saffron btn-full"
            onClick={handleBuy}
            disabled={loading || !investorAddress || shareUsd < MIN_SHARE}
            id="confirm-purchase-btn"
          >
            {loading ? (
              <><div className="spinner" style={{ width: 16, height: 16 }} /> Purchasing...</>
            ) : (
              `Pay ${formatUsd(paymentUsd * 100)} USDC`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
