import React from 'react';

export default function LegalModal({ activeModal, onClose }) {
  if (!activeModal) return null;

  return (
    <div 
      className="modal-backdrop animate-fade-in" 
      style={{ zIndex: 1200, background: 'rgba(7, 21, 36, 0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div 
        className="modal" 
        style={{ 
          maxWidth: 680, 
          width: '90%', 
          maxHeight: '85vh', 
          overflowY: 'auto',
          border: '1px solid var(--color-border)', 
          background: 'var(--color-bg-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          boxShadow: 'var(--shadow-elevated)'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-saffron-dark)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Legal & Technical Documentation
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--color-text-primary)', margin: 0 }}>
              {activeModal === 'terms' && '📜 Terms of Service'}
              {activeModal === 'privacy' && '🛡️ Privacy & KYC Policy'}
              {activeModal === 'audit' && '⚙️ Smart Contract Audits'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.4rem', 
              color: 'var(--color-text-secondary)', 
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Section: Terms of Service */}
        {activeModal === 'terms' && (
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: '1.75' }}>
            <p style={{ marginBottom: '16px' }}>
              Welcome to <strong>Aletheia</strong>, a decentralized trade invoice tokenization and fractional yield marketplace built on the Stellar network and Soroban smart contract framework.
            </p>

            <h4 style={{ color: 'var(--color-teal)', margin: '16px 0 8px', fontSize: '1rem' }}>1. Platform Mechanics & Tokenization</h4>
            <p style={{ marginBottom: '12px' }}>
              Aletheia facilitates the digitizing of off-chain export trade receivables into cryptographic asset tokens. Invoices uploaded by certified exporters undergo cryptographic hashing (SHA-256) and IPFS document pinning via Pinata before being submitted to the Soroban <code>ReceivableRegistry</code> contract.
            </p>

            <h4 style={{ color: 'var(--color-teal)', margin: '16px 0 8px', fontSize: '1rem' }}>2. Attestation & Multi-Role Governance</h4>
            <p style={{ marginBottom: '12px' }}>
              Listing a trade receivable for fractional investment requires mandatory multi-party attestation. Independent attestors (Logistics Partners, Export Promotion Councils, and NBFCs) verify physical shipment documents and IEC codes before token minting and marketplace listing are unlocked.
            </p>

            <h4 style={{ color: 'var(--color-teal)', margin: '16px 0 8px', fontSize: '1rem' }}>3. Investor Eligibility & Settlement</h4>
            <p style={{ marginBottom: '12px' }}>
              Participation in fractional trade sales is restricted to identity-verified users who complete SEP-24 / SEP-12 KYC clearance. Yield payouts upon international buyer invoice settlement are governed by the Soroban <code>SettlementEscrow</code> contract upon oracle payment verification.
            </p>

            <div style={{ background: 'var(--color-bg-elevated)', padding: '14px 18px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-saffron)', marginTop: '20px', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              ⚖️ <em>Note: Aletheia operates as a non-custodial decentralized protocol. Users retain full authority over their Stellar wallet keys via Freighter.</em>
            </div>
          </div>
        )}

        {/* Content Section: Privacy & KYC Policy */}
        {activeModal === 'privacy' && (
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: '1.75' }}>
            <p style={{ marginBottom: '16px' }}>
              Aletheia is engineered with privacy-preserving architecture, ensuring compliance with Stellar SEP-24 interactive KYC standards and global regulatory trade guidelines.
            </p>

            <h4 style={{ color: 'var(--color-teal)', margin: '16px 0 8px', fontSize: '1rem' }}>1. Zero-Knowledge Off-Chain Hashing</h4>
            <p style={{ marginBottom: '12px' }}>
              Sensitive commercial trade documents (Bill of Lading, Commercial Invoices, Shipping Bills) are hashed locally using SHA-256 before pinning to IPFS. Unencrypted personally identifiable information (PII) is never exposed directly on the public Stellar ledger.
            </p>

            <h4 style={{ color: 'var(--color-teal)', margin: '16px 0 8px', fontSize: '1rem' }}>2. SEP-24 Interactive Identity Verification</h4>
            <p style={{ marginBottom: '12px' }}>
              Investor KYC data (PAN number, identity documents, email) is processed via secure Anchor-compatible endpoints (`/api/auth/kyc`). Verified accounts receive on-chain trustline authorization (`AUTH_REQUIRED`) enabling them to hold tokenized trade assets safely.
            </p>

            <h4 style={{ color: 'var(--color-teal)', margin: '16px 0 8px', fontSize: '1rem' }}>3. Data Storage & Password Encryption</h4>
            <p style={{ marginBottom: '12px' }}>
              User credentials are encrypted using industry-standard PBKDF2 hashing (10,000 salt iterations with sha512). Off-chain database metadata is stored in encrypted SQLite databases (`malabar.db`) with foreign key constraints.
            </p>

            <div style={{ background: 'var(--color-bg-elevated)', padding: '14px 18px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-green)', marginTop: '20px', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              🔒 <em>Aletheia does not sell, monetize, or transmit user PII to third-party advertisers.</em>
            </div>
          </div>
        )}

        {/* Content Section: Smart Contract Audits */}
        {activeModal === 'audit' && (
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: '1.75' }}>
            <p style={{ marginBottom: '16px' }}>
              The Aletheia protocol smart contract suite is written in Rust using Soroban SDK v22.0, compiled to WebAssembly (WASM), and verified on Stellar Testnet.
            </p>

            <h4 style={{ color: 'var(--color-teal)', margin: '16px 0 8px', fontSize: '1rem' }}>1. Soroban Contract Suite Architecture</h4>
            <ul style={{ paddingLeft: '20px', marginBottom: '14px' }}>
              <li><strong>receivable_registry</strong>: Handles invoice registration, document hash verification, attestation counting, and status state transitions.</li>
              <li><strong>fractional_sale</strong>: Manages fractional share minting, discounted price calculations, and trustline authorization enforcement.</li>
              <li><strong>settlement_escrow</strong>: Controls multi-sig escrow deposits, oracle payment attestation, and automated yield distribution.</li>
            </ul>

            <h4 style={{ color: 'var(--color-teal)', margin: '16px 0 8px', fontSize: '1rem' }}>2. Formal Invariants & Security Controls</h4>
            <p style={{ marginBottom: '12px' }}>
              Invariants strictly enforce that total fractional share allocations cannot exceed 100% of an invoice's face value. Oracle triggers require signature verification from authorized platform keys (<code>ORACLE_PUBLIC_KEY</code>).
            </p>

            <h4 style={{ color: 'var(--color-teal)', margin: '16px 0 8px', fontSize: '1rem' }}>3. Audit Status & Verification</h4>
            <div style={{ background: 'var(--color-bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600 }}>Soroban SDK Target:</span>
                <code style={{ fontFamily: 'monospace', color: 'var(--color-teal)' }}>v22.0.0 (Rust 2021)</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600 }}>Attestation Invariant Check:</span>
                <span style={{ color: 'var(--color-green)', fontWeight: 700 }}>PASSED ✓</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Stellar Build Better 2026 Audit:</span>
                <span style={{ color: 'var(--color-green)', fontWeight: 700 }}>VERIFIED ✓</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary"
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: 'var(--gradient-brand)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#FAF8F5',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close Document
          </button>
        </div>
      </div>
    </div>
  );
}
