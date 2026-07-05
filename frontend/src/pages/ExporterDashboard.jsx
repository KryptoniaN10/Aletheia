import React, { useState, useEffect } from 'react';
import DocumentUpload from '../components/DocumentUpload.jsx';
import { AttestationMini } from '../components/ReceivableCard.jsx';
import { receivablesApi, formatUsd } from '../stellar/client.js';

const COMMODITIES = [
  'Black Pepper', 'Cardamom', 'Ginger', 'Turmeric', 'Cloves', 'Nutmeg',
  'White Pepper', 'Frozen Shrimp', 'Frozen Fish', 'Dried Fish',
  'Coconut Products', 'Cashew Nuts', 'Other',
];

const STEPS = ['Upload Document', 'Receivable Details', 'Submit & Track'];

export default function ExporterDashboard({ walletAddress, onConnect }) {
  const [step, setStep] = useState(0);
  const [docFile, setDocFile] = useState(null);
  const [form, setForm] = useState({
    exporter_name: '',
    buyer_name: '',
    buyer_country: '',
    amount_usd: '',
    maturity_date: '',
    iec_code: '',
    commodity: 'Black Pepper',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [myReceivables, setMyReceivables] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Load exporter's receivables
  useEffect(() => {
    if (!walletAddress) return;
    setLoadingList(true);
    receivablesApi.list({ exporter: walletAddress })
      .then(setMyReceivables)
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, [walletAddress, submitted]);

  function updateForm(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit() {
    if (!docFile) { setError('Please upload a document first'); return; }
    if (!walletAddress) { setError('Connect your wallet first'); return; }

    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('document', docFile.file);
      fd.append('exporter_address', walletAddress);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));

      const result = await receivablesApi.register(fd);
      setSubmitted(result);
      setStep(0);
      setDocFile(null);
      setForm({
        exporter_name: '', buyer_name: '', buyer_country: '',
        amount_usd: '', maturity_date: '', iec_code: '', commodity: 'Black Pepper',
      });
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  return (
    <main className="page-content">
      <div className="container">
        {/* ── Page Header ──────────────────────────────────────── */}
        <div style={{ marginBottom: 'var(--space-7)' }}>
          <div className="section-label">Exporter Portal</div>
          <h1 style={{ marginBottom: 'var(--space-3)' }}>
            Turn your receivables into{' '}
            <span className="shine">working capital</span>
          </h1>
          <p className="text-secondary text-ui-lg" style={{ maxWidth: 600 }}>
            Upload your shipping documents. Get paid the same day at a small discount.
            No banks, no paperwork delays.
          </p>
        </div>

        {/* ── Wallet gate ──────────────────────────────────────── */}
        {!walletAddress && (
          <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Connect your Freighter wallet to continue</div>
              <div className="text-ui-sm">You need a Stellar wallet to register receivables and receive funds.</div>
              <button className="btn btn-saffron btn-sm" onClick={onConnect} style={{ marginTop: 'var(--space-3)' }} id="exporter-connect-btn">
                Connect Freighter
              </button>
            </div>
          </div>
        )}

        <div className="grid-2" style={{ gap: 'var(--space-7)', alignItems: 'start' }}>
          {/* ── Register Receivable Form ───────────────────────── */}
          <div>
            <div className="card">
              {/* Step indicator */}
              <div className="flex gap-3 items-center" style={{ marginBottom: 'var(--space-5)' }}>
                {STEPS.map((s, i) => (
                  <React.Fragment key={s}>
                    <button
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center',
                        opacity: step === i ? 1 : 0.4,
                        transition: 'opacity var(--transition-base)',
                      }}
                      onClick={() => setStep(i)}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: step >= i ? 'var(--gradient-brand)' : 'var(--color-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: step >= i ? 'white' : 'var(--color-text-muted)',
                      }}>
                        {step > i ? '✓' : i + 1}
                      </div>
                      <span className="text-ui-xs" style={{ whiteSpace: 'nowrap' }}>{s}</span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 2, background: step > i ? 'var(--gradient-brand)' : 'var(--color-border)', borderRadius: 1 }} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* ── Step 0: Upload Document ─────────────────────── */}
              {step === 0 && (
                <div className="animate-fade-in">
                  <h3 style={{ marginBottom: 'var(--space-3)', fontFamily: 'var(--font-display)' }}>
                    Upload Export Document
                  </h3>
                  <p className="text-ui-sm text-secondary" style={{ marginBottom: 'var(--space-5)' }}>
                    Your Shipping Bill or Bill of Lading will be SHA-256 hashed in your browser and
                    stored on-chain. The actual file goes to IPFS. The bank sees only the hash.
                  </p>
                  <DocumentUpload
                    onFileSelected={setDocFile}
                    label="Shipping Bill / Bill of Lading / Purchase Order"
                    hint="Accepted: PDF, PNG, JPG, TIFF · Max 10 MB"
                  />
                  <button
                    className="btn btn-primary btn-full"
                    style={{ marginTop: 'var(--space-4)' }}
                    disabled={!docFile}
                    onClick={() => setStep(1)}
                    id="doc-next-btn"
                  >
                    Next: Receivable Details →
                  </button>
                </div>
              )}

              {/* ── Step 1: Receivable Details ──────────────────── */}
              {step === 1 && (
                <div className="animate-fade-in">
                  <h3 style={{ marginBottom: 'var(--space-5)', fontFamily: 'var(--font-display)' }}>
                    Receivable Details
                  </h3>
                  <div className="flex flex-col gap-4">
                    <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
                      <div className="form-group">
                        <label className="form-label">Your Business Name</label>
                        <input className="form-input" value={form.exporter_name}
                          onChange={(e) => updateForm('exporter_name', e.target.value)}
                          placeholder="Kerala Spices Ltd."
                          id="exporter-name-input"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Commodity</label>
                        <select className="form-select" value={form.commodity}
                          onChange={(e) => updateForm('commodity', e.target.value)}
                          id="commodity-select"
                        >
                          {COMMODITIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
                      <div className="form-group">
                        <label className="form-label">Buyer Name</label>
                        <input className="form-input" value={form.buyer_name}
                          onChange={(e) => updateForm('buyer_name', e.target.value)}
                          placeholder="Global Spice GmbH"
                          id="buyer-name-input"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Buyer Country</label>
                        <input className="form-input" value={form.buyer_country}
                          onChange={(e) => updateForm('buyer_country', e.target.value)}
                          placeholder="Germany"
                          id="buyer-country-input"
                        />
                      </div>
                    </div>

                    <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
                      <div className="form-group">
                        <label className="form-label">Invoice Amount (USD)</label>
                        <input className="form-input" type="number" value={form.amount_usd}
                          onChange={(e) => updateForm('amount_usd', e.target.value)}
                          placeholder="50000"
                          id="amount-input"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Payment Due Date</label>
                        <input className="form-input" type="date" value={form.maturity_date}
                          onChange={(e) => updateForm('maturity_date', e.target.value)}
                          id="maturity-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">IEC Code (10-digit)</label>
                      <input className="form-input" value={form.iec_code}
                        onChange={(e) => updateForm('iec_code', e.target.value)}
                        placeholder="0123456789"
                        maxLength={10}
                        id="iec-input"
                      />
                      <div className="form-hint">
                        Importer-Exporter Code issued by DGFT. Format validation only — live DGFT integration is Phase 2.
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="alert alert-error" style={{ marginTop: 'var(--space-4)' }}>{error}</div>
                  )}

                  <div className="flex gap-3" style={{ marginTop: 'var(--space-5)' }}>
                    <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      disabled={!form.amount_usd || !form.maturity_date}
                      onClick={() => setStep(2)}
                      id="details-next-btn"
                    >
                      Review & Submit →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2: Review ──────────────────────────────── */}
              {step === 2 && (
                <div className="animate-fade-in">
                  <h3 style={{ marginBottom: 'var(--space-4)', fontFamily: 'var(--font-display)' }}>
                    Review & Submit
                  </h3>

                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)',
                    marginBottom: 'var(--space-4)',
                  }}>
                    {[
                      ['Commodity', form.commodity],
                      ['Buyer', `${form.buyer_name}, ${form.buyer_country}`],
                      ['Invoice Amount', form.amount_usd ? formatUsd(parseFloat(form.amount_usd) * 100) : '—'],
                      ['Due Date', form.maturity_date],
                      ['IEC Code', form.iec_code || 'Not provided'],
                      ['Document', docFile?.file?.name || '—'],
                      ['Doc Hash', docFile?.hash ? `${docFile.hash.slice(0, 20)}…` : '—'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between"
                        style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <span className="text-ui-sm text-muted">{label}</span>
                        <span className="text-ui-sm monospace" style={{ textAlign: 'right' }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="alert alert-info" style={{ marginBottom: 'var(--space-4)' }}>
                    After submission, 2 of 3 attestors (logistics partner + Export Council + NBFC) must
                    sign off before your receivable token is minted. You'll receive same-day payment
                    once the fractional sale closes.
                  </div>

                  {error && (
                    <div className="alert alert-error" style={{ marginBottom: 'var(--space-3)' }}>{error}</div>
                  )}

                  <div className="flex gap-3">
                    <button className="btn btn-ghost" onClick={() => setStep(1)}>← Edit</button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={handleSubmit}
                      disabled={submitting || !walletAddress}
                      id="submit-receivable-btn"
                    >
                      {submitting ? (
                        <><div className="spinner" style={{ width: 16, height: 16 }} /> Submitting...</>
                      ) : (
                        'Register Receivable on Stellar'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Success Banner ─────────────────────────────────── */}
            {submitted && (
              <div className="alert alert-success animate-fade-in" style={{ marginTop: 'var(--space-4)' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    ✓ Receivable registered! ID #{submitted.id}
                  </div>
                  <div className="text-ui-sm">
                    Doc hash: <span className="monospace">{submitted.doc_hash?.slice(0, 20)}…</span>
                    {submitted.ipfs_cid && <> · IPFS: <span className="monospace">{submitted.ipfs_cid}</span></>}
                  </div>
                  <div className="text-ui-sm" style={{ marginTop: 4 }}>
                    Awaiting 2-of-3 attestations. The attestation dashboard is in the Admin panel.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── My Receivables ───────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)' }}>My Receivables</h3>
              {walletAddress && (
                <button className="btn btn-ghost btn-sm" onClick={() =>
                  receivablesApi.list({ exporter: walletAddress }).then(setMyReceivables)
                } id="refresh-receivables-btn">
                  ↻ Refresh
                </button>
              )}
            </div>

            {!walletAddress ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-7)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>👜</div>
                <div className="text-secondary">Connect your wallet to see your receivables</div>
              </div>
            ) : loadingList ? (
              <div className="flex flex-col gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 180 }} />
                ))}
              </div>
            ) : myReceivables.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-7)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>📋</div>
                <div className="text-secondary" style={{ marginBottom: 'var(--space-3)' }}>
                  No receivables yet. Register your first one!
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {myReceivables.map((rec) => (
                  <ExporterReceivableRow key={rec.id} rec={rec} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ExporterReceivableRow({ rec }) {
  const statusColors = {
    pending: 'var(--color-saffron)',
    attested: 'var(--color-green-light)',
    active: 'var(--color-teal-light)',
    settled: '#8fa8ff',
    clawback: '#f08080',
  };

  return (
    <div className="card" style={{ padding: 'var(--space-4)' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
        <div>
          <div className="text-ui-sm" style={{ fontWeight: 700 }}>
            {rec.commodity} — {rec.buyer_name || 'Buyer TBD'}
          </div>
          <div className="text-ui-xs text-muted">#{rec.id} · {rec.buyer_country}</div>
        </div>
        <div>
          <span className="text-ui-lg" style={{ fontWeight: 700, color: 'var(--color-teal-light)' }}>
            {formatUsd(rec.amount_usd * 100)}
          </span>
        </div>
      </div>

      <AttestationMini count={rec.attestation_count || 0} required={2} />

      {rec.token_asset_code && (
        <div className="text-ui-xs text-accent monospace" style={{ marginTop: 'var(--space-2)' }}>
          Token: {rec.token_asset_code}
        </div>
      )}

      <div style={{
        height: 2, background: 'var(--color-border)', borderRadius: 1,
        marginTop: 'var(--space-3)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: statusColors[rec.status] || 'var(--color-border)',
          width: rec.status === 'settled' ? '100%'
            : rec.status === 'active' ? '75%'
            : rec.status === 'attested' ? '50%'
            : rec.attestation_count >= 1 ? '25%' : '0%',
          transition: 'width 0.8s ease',
        }} />
      </div>

      <div className="text-ui-xs text-muted" style={{ marginTop: 'var(--space-2)', textTransform: 'capitalize' }}>
        Status: {rec.status} · Due {rec.maturity_date}
      </div>
    </div>
  );
}
