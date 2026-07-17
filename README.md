# Aletheia

**Tokenized trade receivables on Stellar for Kerala's spice and seafood exporters.**

Kerala's exporters wait 60–90 days to get paid under standard trade terms. Aletheia turns confirmed export receivables into Stellar assets — investors buy fractional shares at a discount, exporters receive same-day working capital, and settlement distributes automatically when the importer pays.

> Built for Stellar Build Better 2026 · Deployed on Stellar Testnet

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  LAYER 4: React + Freighter / Wallet Kit         │
│  Exporter Dashboard · Investor Dashboard · Admin │
├─────────────────────────────────────────────────┤
│  LAYER 3: Node.js API (off-chain verification)  │
│  Doc upload + SHA-256 · KYC mock · Oracle feed  │
├─────────────────────────────────────────────────┤
│  LAYER 2: Soroban Smart Contracts               │
│  ReceivableRegistry · FractionalSale · Escrow   │
├─────────────────────────────────────────────────┤
│  LAYER 1: Stellar Primitives                    │
│  Native Assets · Anchors · DEX · SAC            │
└─────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- Rust + Cargo (for contract compilation)
- Soroban CLI ([install guide](https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli))
- Freighter browser extension ([freighter.app](https://www.freighter.app/))

### 1. Clone & setup environment

```bash
git clone <repo>
cd malabar-ledger
cp .env.example .env
```

### 2. Setup testnet accounts (optional — needs soroban CLI)

```bash
chmod +x scripts/setup-testnet.sh
bash scripts/setup-testnet.sh
```

This generates keypairs, funds them via Friendbot, and writes `.env`.

### 3. Start the API

```bash
cd api
npm install
npm run dev
# → http://localhost:3001
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 5. (Optional) Compile & deploy Soroban contracts

**Requires WSL/Linux with Rust and Soroban CLI:**

```bash
# Install Rust wasm target
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install soroban-cli --features opt

# Build + deploy
chmod +x scripts/deploy-contracts.sh
bash scripts/deploy-contracts.sh
```

Contract IDs will be written back to `.env` automatically.

---

## Demo Flow (for judges)

Open `http://localhost:5173` and follow these steps to see the full loop:

### Step 1 — Exporter registers a receivable
1. Go to **Exporter** tab
2. Connect Freighter (or use demo mode — no wallet required for API demo)
3. Upload any PDF (try a sample invoice)
4. Fill in: commodity = "Black Pepper", amount = $50,000, buyer = "Global Spice GmbH, Germany"
5. Submit → note the SHA-256 doc hash stored on-chain

### Step 2 — Attestation (Admin Panel)
1. Go to **Admin** tab
2. Find the receivable (status: Pending)
3. Click **✓ logistics**, then **✓ export_council** → watch status flip to "Attested"
4. Click **List →** to open the receivable for fractional sale (set 5% discount)

### Step 3 — Investor buys a share
1. Go to **Investor** tab
2. Fill in mock KYC form and submit
3. Back in **Admin**, approve the KYC session
4. Browse the marketplace → click the receivable → drag the slider → **Pay USDC**

### Step 4 — Oracle confirms payment & distributes
1. Back in **Admin** → find the receivable (status: Active)
2. Click **💸 Confirm Importer Payment** (simulates bank oracle)
3. Click **🎉 Distribute Pro-rata Payout**
4. Watch the **Live Feed** show the settlement events
5. Check investor portfolio — balance updated

---

## Stellar Primitives Used

| Primitive | Purpose |
|---|---|
| **Native Asset Issuance** | Each receivable is a unique `ML####` Stellar asset |
| **AUTH_REQUIRED + AUTH_REVOCABLE** | KYC-gated trustlines — only approved investors can hold tokens |
| **CLAWBACK_ENABLED** | Issuer can recover tokens in fraud cases (native Stellar op) |
| **Soroban Smart Contracts** | Registry, sale logic, and settlement escrow — all on-chain |
| **Stellar Anchors (SEP-24)** | KYC gate + INR ↔ USDC on/off-ramp (mocked for demo) |
| **Built-in DEX** | `ManageSellOffer` for secondary market exit — zero custom code |
| **Sponsored Reserves** | `BeginSponsoringFutureReserves` removes XLM friction for new users |
| **Stellar Asset Contract** | Bridge between classic Stellar assets and Soroban contracts |

---

## Project Structure

```
malabar-ledger/
├── contracts/                    # Soroban smart contracts (Rust)
│   ├── receivable_registry/      # Register + 2-of-3 attest + mint
│   ├── fractional_sale/          # List + buy shares + close
│   └── settlement_escrow/        # Oracle confirm + pro-rata distribute + clawback
├── api/                          # Off-chain verification service (Node.js)
│   ├── src/routes/               # receivables, auth, oracle, stellar
│   ├── src/services/             # stellar.js (SDK), ipfs.js (Pinata)
│   └── src/db/schema.js          # SQLite schema
├── frontend/                     # React + Vite dashboard
│   ├── src/pages/                # Landing, ExporterDashboard, InvestorDashboard, AdminPanel
│   ├── src/components/           # ReceivableCard, DocumentUpload, SharePurchaseModal, LiveFeed
│   └── src/stellar/client.js     # SDK wrapper + API helpers
└── scripts/
    ├── setup-testnet.sh          # Generate & fund testnet accounts
    └── deploy-contracts.sh       # Build + deploy Soroban contracts
```

---

## Roadmap (Post-Hackathon)

- **Phase 2**: Live DGFT API integration for IEC code verification
- **Phase 2**: Live Anchor integration (ICICI / Yes Bank) for INR ↔ USDC
- **Phase 2**: Spices Board + MPEDA registration number validation
- **Phase 3**: Cross-chain bridge for diaspora investors (USDC on other chains)
- **Phase 3**: Insurance oracle integration (ECGC credit risk)
- **Phase 3**: Secondary DEX market depth analytics dashboard

---

## Background

Kozhikode (Calicut) was the center of the global spice trade when Vasco da Gama arrived in 1498 — the origin point of the first true globalization of commerce. The problem this project solves — exporters waiting months to access payment on goods already shipped — is as old as the trade itself.

Aletheia makes Kozhikode the origin point of the solution.

---

*Built on [Stellar](https://stellar.org) · Testnet only — not for production use*
