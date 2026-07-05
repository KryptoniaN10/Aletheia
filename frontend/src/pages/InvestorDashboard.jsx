import React, { useState, useEffect } from 'react';
import ReceivableCard from '../components/ReceivableCard.jsx';
import SharePurchaseModal from '../components/SharePurchaseModal.jsx';
import LiveFeed from '../components/LiveFeed.jsx';
import { receivablesApi, authApi, formatUsd, daysUntil, formatYield } from '../stellar/client.js';

export default function InvestorDashboard({ walletAddress, onConnect }) {
  const [receivables, setReceivables] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRec, setSelectedRec] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [kycForm, setKycForm] = useState({ name: '', email: '', pan_number: '' });
  const [kycLoading, setKycLoading] = useState(false);
  const [filter, setFilter] = useState('active');

  // Load all receivables
  useEffect(() => {
    setLoading(true);
    receivablesApi.list()
      .then((data) => {
        setReceivables(data);
        // Derive my investments from all receivables
        if (walletAddress) {
          const myInvs = data.flatMap((r) =>
            (r.investments || [])
              .filter((inv) => inv.investor_address === walletAddress)
              .map((inv) => ({ ...inv, receivable: r }))
          );
          setMyInvestments(myInvs);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [walletAddress]);

  // Check KYC status
  useEffect(() => {
    if (!walletAddress) return;
    authApi.checkWalletKyc(walletAddress).then(setKycStatus).catch(() => {});
  }, [walletAddress]);

  async function handleKycSubmit(e) {
    e.preventDefault();
    if (!walletAddress) return;
    setKycLoading(true);
    try {
      const session = await authApi.startKyc({ wallet_address: walletAddress, ...kycForm });
      setKycStatus({ kyc_status: 'pending', session_id: session.session_id });
    } catch (err) {
      alert(err.message);
    }
    setKycLoading(false);
  }

  const filtered = receivables.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  // Portfolio stats
  const totalFaceValue = myInvestments.reduce((s, i) => s + i.share_cents / 100, 0);
  const totalPaid = myInvestments.reduce((s, i) => s + i.payment_cents / 100, 0);
  const expectedReturn = totalFaceValue - totalPaid;

  return (
    <main className="page-content">
      <div className="container">
        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div className="section-label">Investor Portal</div>
          <h1 style={{ marginBottom: 'var(--space-3)' }}>
            Earn real yield from{' '}
            <span className="shine-saffron">Malabar exports</span>
          </h1>
          <p className="text-secondary text-ui-lg" style={{ maxWidth: 580 }}>
            Buy fractional shares of verified export receivables at a discount.
            Backed by real shipping documents. Settled on-chain.
          </p>
        </div>

        {/* ── Wallet gate ────────────────────────────────────────── */}
        {!walletAddress && (
          <div className="card" style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-5)', alignItems: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>👜</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>Connect Your Wallet</h3>
              <p className="text-secondary text-ui-sm">
                You need a Freighter wallet connected to browse and invest in receivables.
                KYC approval is required to receive receivable tokens.
              </p>
            </div>
            <button className="btn btn-primary" onClick={onConnect} id="investor-connect-btn">
              Connect Freighter
            </button>
          </div>
        )}

        <div className="grid-2" style={{ gap: 'var(--space-7)', alignItems: 'start' }}>
          {/* ── Left: Marketplace ─────────────────────────────────── */}
          <div>
            {/* Filter tabs */}
            <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', flex: 1 }}>Receivables Marketplace</h3>
              <div className="flex gap-2">
                {['active', 'attested', 'all'].map((f) => (
                  <button
                    key={f}
                    className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setFilter(f)}
                    id={`filter-${f}-btn`}
                  >
                    {f === 'active' ? 'For Sale' : f === 'attested' ? 'Attested' : 'All'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 220 }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-7)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🌊</div>
                <div className="text-secondary">
                  No {filter === 'active' ? 'open' : filter} receivables at the moment.
                  <br />Check back soon or switch filters.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filtered.map((rec) => (
                  <ReceivableCard
                    key={rec.id}
                    receivable={rec}
                    showInvest
                    onClick={() => setSelectedRec(rec)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Portfolio + KYC + LiveFeed ──────────────────── */}
          <div className="flex flex-col gap-5">
            {/* KYC Panel */}
            <div className="card card-gold">
              <h4 style={{ marginBottom: 'var(--space-3)', fontFamily: 'var(--font-display)' }}>
                KYC Status
              </h4>

              {!walletAddress ? (
                <div className="text-ui-sm text-muted">Connect wallet to see KYC status</div>
              ) : kycStatus?.approved ? (
                <div className="alert alert-success">
                  <div>
                    <div style={{ fontWeight: 700 }}>✓ KYC Approved</div>
                    <div className="text-ui-sm">
                      Your wallet is authorized to hold receivable tokens.
                    </div>
                  </div>
                </div>
              ) : kycStatus?.kyc_status === 'pending' ? (
                <div className="alert alert-warning">
                  <div>
                    <div style={{ fontWeight: 700 }}>⏳ KYC Under Review</div>
                    <div className="text-ui-sm">
                      Your application is being reviewed. An admin will approve shortly.
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleKycSubmit}>
                  <p className="text-ui-sm text-secondary" style={{ marginBottom: 'var(--space-4)' }}>
                    KYC is required (via Anchor SEP-24) to receive receivable tokens.
                    This mock flow collects basic details.
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-input" value={kycForm.name}
                        onChange={(e) => setKycForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Your legal name" required id="kyc-name-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" type="email" value={kycForm.email}
                        onChange={(e) => setKycForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="you@example.com" required id="kyc-email-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">PAN Number (India) / Passport</label>
                      <input className="form-input" value={kycForm.pan_number}
                        onChange={(e) => setKycForm((f) => ({ ...f, pan_number: e.target.value }))}
                        placeholder="ABCDE1234F" id="kyc-pan-input" />
                    </div>
                  </div>
                  <button className="btn btn-primary btn-full"
                    style={{ marginTop: 'var(--space-4)' }}
                    type="submit" disabled={kycLoading} id="kyc-submit-btn">
                    {kycLoading ? 'Submitting...' : 'Start KYC (SEP-24 mock)'}
                  </button>
                </form>
              )}
            </div>

            {/* Portfolio Stats */}
            {walletAddress && myInvestments.length > 0 && (
              <div className="card">
                <h4 style={{ marginBottom: 'var(--space-4)', fontFamily: 'var(--font-display)' }}>
                  My Portfolio
                </h4>
                <div className="grid-3" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  <div className="stat-card" style={{ padding: 0 }}>
                    <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                      {myInvestments.length}
                    </div>
                    <div className="stat-label">Positions</div>
                  </div>
                  <div className="stat-card" style={{ padding: 0 }}>
                    <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--color-saffron)' }}>
                      {formatUsd(totalPaid * 100)}
                    </div>
                    <div className="stat-label">Deployed</div>
                  </div>
                  <div className="stat-card" style={{ padding: 0 }}>
                    <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--color-green-light)' }}>
                      +{formatUsd(expectedReturn * 100)}
                    </div>
                    <div className="stat-label">Expected Return</div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {myInvestments.map((inv, idx) => (
                    <div key={idx} style={{
                      padding: 'var(--space-3)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-ui-sm" style={{ fontWeight: 600 }}>
                            {inv.receivable?.commodity || 'Receivable'} #{inv.receivable_id}
                          </div>
                          <div className="text-ui-xs text-muted">
                            Due: {inv.receivable?.maturity_date}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="text-ui-sm" style={{ fontWeight: 700, color: 'var(--color-teal-light)' }}>
                            {formatUsd(inv.share_cents)}
                          </div>
                          <div className="text-ui-xs text-muted">
                            paid {formatUsd(inv.payment_cents)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Feed */}
            <div className="card">
              <LiveFeed walletAddress={walletAddress} />
            </div>
          </div>
        </div>

        {/* ── Purchase Modal ─────────────────────────────────────── */}
        {selectedRec && (
          <SharePurchaseModal
            receivable={selectedRec}
            investorAddress={walletAddress}
            onClose={() => setSelectedRec(null)}
            onSuccess={() => {
              setSelectedRec(null);
              receivablesApi.list().then(setReceivables);
            }}
          />
        )}
      </div>
    </main>
  );
}
