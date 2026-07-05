import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// ── SVG Decorations ────────────────────────────────────────────
function SpiceParticle({ style }) {
  return (
    <div style={{
      position: 'absolute',
      borderRadius: '50%',
      background: 'var(--color-saffron)',
      opacity: 0.08,
      ...style,
    }} />
  );
}

export default function Landing({ walletAddress, onConnect }) {
  const heroRef = useRef(null);

  // Parallax on mouse move
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const handle = (e) => {
      const { clientX, clientY, currentTarget } = e;
      const { width, height } = currentTarget.getBoundingClientRect();
      const x = (clientX / width - 0.5) * 20;
      const y = (clientY / height - 0.5) * 20;
      hero.style.setProperty('--mouse-x', `${x}px`);
      hero.style.setProperty('--mouse-y', `${y}px`);
    };

    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  const STATS = [
    { value: '$2T+', label: 'Global Trade Finance Gap' },
    { value: '60–90', label: 'Days Exporters Wait' },
    { value: '5s', label: 'Stellar Settlement Time' },
    { value: '<$0.01', label: 'Per Transaction' },
  ];

  const HOW_IT_WORKS = [
    {
      step: '01',
      title: 'Upload & Register',
      desc: 'Exporter uploads a Shipping Bill or Bill of Lading. Document is SHA-256 hashed and pinned to IPFS. Hash goes on-chain.',
      icon: '📋',
      color: 'var(--color-teal)',
    },
    {
      step: '02',
      title: '2-of-3 Attestation',
      desc: 'Logistics partner, Export Council rep, and NBFC sign off. Once threshold is met, a Soroban contract mints the receivable token.',
      icon: '✅',
      color: 'var(--color-saffron)',
    },
    {
      step: '03',
      title: 'Fractional Sale',
      desc: 'Exporter sets a discount rate. KYC-approved investors buy fractional shares in USDC. Exporter receives working capital the same day.',
      icon: '🪙',
      color: 'var(--color-green)',
    },
    {
      step: '04',
      title: 'Pro-rata Settlement',
      desc: 'When the importer pays, an oracle confirms the transaction. The Soroban contract distributes funds pro-rata to all token holders automatically.',
      icon: '💸',
      color: 'var(--color-gold)',
    },
  ];

  const STELLAR_FEATURES = [
    { label: 'Native Asset Issuance', desc: 'Each receivable is a unique Stellar asset. AUTH_REQUIRED enforces KYC at the protocol layer.' },
    { label: 'Soroban Smart Contracts', desc: 'ReceivableRegistry + FractionalSale + SettlementEscrow handle all lifecycle logic on-chain.' },
    { label: 'Real World Assets (RWA)', desc: 'Backed by verifiable export documentation — a real financial instrument, not a synthetic token.' },
    { label: 'Stellar Anchors (SEP-24)', desc: 'INR ↔ USDC on/off-ramp via Anchor protocol. KYC-gated real economy access.' },
    { label: 'Built-in DEX', desc: 'Secondary market for receivable tokens via ManageSellOffer — no custom code, native to Stellar.' },
    { label: 'Sponsored Reserves', desc: 'BeginSponsoringFutureReserves removes XLM barrier for first-time exporters and investors.' },
  ];

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--gradient-hero)',
        }}
      >
        {/* Decorative background glows */}
        <div style={{
          position: 'absolute', top: '20%', right: '10%',
          width: 600, height: 600,
          background: 'var(--gradient-glow-teal)',
          borderRadius: '50%',
          transform: 'translate(calc(var(--mouse-x, 0px) * 0.4), calc(var(--mouse-y, 0px) * 0.4))',
          transition: 'transform 0.3s ease',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '5%',
          width: 400, height: 400,
          background: 'var(--gradient-glow-saffron)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />
        {/* Spice particle dots */}
        <SpiceParticle style={{ width: 120, height: 120, top: '15%', left: '8%' }} />
        <SpiceParticle style={{ width: 60, height: 60, top: '60%', right: '15%' }} />
        <SpiceParticle style={{ width: 200, height: 200, bottom: '5%', right: '5%', background: 'var(--color-teal)' }} />

        {/* Kozhikode coordinates decorative text */}
        <div style={{
          position: 'absolute', top: '50%', right: 'var(--space-7)',
          transform: 'translateY(-50%) rotate(90deg)',
          transformOrigin: 'center',
          fontSize: '0.7rem',
          letterSpacing: '0.2em',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          11.2588° N · 75.7804° E · Kozhikode
        </div>

        <div className="container" style={{ paddingTop: 'var(--nav-height)' }}>
          <div style={{ maxWidth: 780 }}>
            {/* Eyebrow */}
            <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-5)' }}>
              <div className="badge badge-active">
                ◆ Live on Stellar Testnet
              </div>
              <div className="badge badge-kyc">
                ★ Stellar Build Better 2026
              </div>
            </div>

            {/* Headline */}
            <h1
              className="display-xl animate-fade-in"
              style={{ marginBottom: 'var(--space-5)', lineHeight: 1.0 }}
            >
              Trade Finance
              <br />
              <span className="shine">Reimagined</span>
              <br />
              <span style={{ color: 'var(--color-saffron)' }}>from Kozhikode.</span>
            </h1>

            <p
              className="text-ui-lg text-secondary animate-fade-in"
              style={{
                maxWidth: 600, marginBottom: 'var(--space-6)',
                animationDelay: '0.15s',
                lineHeight: 1.75,
              }}
            >
              Kerala's spice and seafood exporters wait 60–90 days to get paid
              under standard trade terms. Malabar Ledger tokenizes export receivables
              on Stellar, turning confirmed purchase orders into investable instruments
              — same-day working capital for exporters, real yield for investors.
            </p>

            {/* CTAs */}
            <div
              className="flex gap-4 animate-fade-in"
              style={{ animationDelay: '0.3s', flexWrap: 'wrap' }}
            >
              <Link to="/exporter" className="btn btn-primary btn-lg" id="hero-exporter-cta">
                I'm an Exporter
              </Link>
              <Link to="/investor" className="btn btn-saffron btn-lg" id="hero-investor-cta">
                I Want to Invest
              </Link>
              {!walletAddress && (
                <button className="btn btn-outline btn-lg" onClick={onConnect} id="hero-wallet-cta">
                  Connect Freighter
                </button>
              )}
            </div>

            {/* Mini stats row */}
            <div
              className="flex gap-5 animate-fade-in"
              style={{ marginTop: 'var(--space-7)', animationDelay: '0.45s', flexWrap: 'wrap' }}
            >
              {STATS.map((s) => (
                <div key={s.label}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: 'var(--color-teal-light)',
                    lineHeight: 1,
                  }}>
                    {s.value}
                  </div>
                  <div className="text-ui-xs text-muted" style={{ marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section style={{ padding: 'var(--space-9) 0', background: 'var(--color-bg-base)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-7)' }}>
            <div className="section-label">The Mechanism</div>
            <h2 className="display-md" style={{ marginBottom: 'var(--space-3)' }}>
              From Purchase Order to Settlement
            </h2>
            <p className="text-secondary text-ui-lg" style={{ maxWidth: 540, margin: '0 auto' }}>
              Four on-chain steps replace a 90-day paper process
            </p>
          </div>

          <div className="grid-4">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="card" style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: 'var(--space-3)',
                  filter: 'drop-shadow(0 0 12px rgba(232,160,32,0.3))',
                }}>
                  {item.icon}
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: item.color,
                  opacity: 0.15,
                  position: 'absolute',
                  top: 'var(--space-3)',
                  right: 'var(--space-4)',
                  lineHeight: 1,
                  userSelect: 'none',
                }}>
                  {item.step}
                </div>
                <h4 style={{ marginBottom: 'var(--space-2)' }}>{item.title}</h4>
                <p className="text-ui-sm text-secondary" style={{ lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stellar Features ──────────────────────────────────── */}
      <section style={{ padding: 'var(--space-9) 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-7)' }}>
            <div className="section-label">Built on Stellar</div>
            <h2 className="display-md" style={{ marginBottom: 'var(--space-3)' }}>
              Every primitive, purposefully chosen
            </h2>
            <p className="text-secondary text-ui-lg" style={{ maxWidth: 580, margin: '0 auto' }}>
              Sub-cent fees make fractionalizing $10,000 receivables viable.
              Five-second settlement means investors see returns in minutes, not months.
            </p>
          </div>

          <div className="grid-3">
            {STELLAR_FEATURES.map((f) => (
              <div key={f.label} className="card card-gold">
                <div style={{
                  width: 40, height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--gradient-brand)',
                  marginBottom: 'var(--space-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem',
                }}>
                  ◆
                </div>
                <h4 style={{ marginBottom: 'var(--space-2)' }}>{f.label}</h4>
                <p className="text-ui-sm text-secondary">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Historical callout ────────────────────────────────── */}
      <section style={{
        padding: 'var(--space-9) 0',
        background: 'linear-gradient(135deg, rgba(13,154,168,0.05) 0%, rgba(232,160,32,0.05) 100%)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div className="container-narrow" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>⚓</div>
          <blockquote style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
            fontStyle: 'italic',
            color: 'var(--color-text-primary)',
            lineHeight: 1.5,
            marginBottom: 'var(--space-4)',
          }}>
            "Kozhikode was the origin point of the modern global spice trade.
            Malabar Ledger makes it the origin point of its reinvention."
          </blockquote>
          <div className="text-ui-sm text-muted">
            Vasco da Gama landed near Kozhikode in 1498. The problem — long payment cycles
            and working capital gaps — started then. The solution starts now.
          </div>
        </div>
      </section>

      {/* ── CTA Footer ────────────────────────────────────────── */}
      <section style={{ padding: 'var(--space-9) 0', textAlign: 'center' }}>
        <div className="container-narrow">
          <h2 className="display-md" style={{ marginBottom: 'var(--space-4)' }}>
            Ready to explore the demo?
          </h2>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-6)' }}>
            Connect your Freighter wallet, register an export receivable, or browse
            available investments — all live on Stellar testnet.
          </p>
          <div className="flex gap-4 justify-center" style={{ flexWrap: 'wrap' }}>
            <Link to="/exporter" className="btn btn-primary btn-lg" id="footer-exporter-cta">
              Exporter Dashboard
            </Link>
            <Link to="/investor" className="btn btn-saffron btn-lg" id="footer-investor-cta">
              Investor Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-5)',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '0.82rem',
      }}>
        Malabar Ledger · Built on Stellar · Stellar Build Better 2026 ·{' '}
        <span style={{ color: 'var(--color-teal-light)' }}>Testnet Only</span>
      </footer>
    </main>
  );
}
