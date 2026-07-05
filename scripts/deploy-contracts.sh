#!/bin/bash
# ============================================================
#  deploy-contracts.sh — Malabar Ledger Contract Deployment
#  Compiles all three Soroban contracts to WASM and deploys
#  to testnet. Writes contract IDs back to .env.
#
#  Prerequisites:
#    - rustup with wasm32-unknown-unknown target:
#        rustup target add wasm32-unknown-unknown
#    - soroban CLI:
#        cargo install soroban-cli --features opt
#    - Accounts funded (run setup-testnet.sh first)
#
#  Usage:
#    chmod +x scripts/deploy-contracts.sh
#    ./scripts/deploy-contracts.sh
# ============================================================

set -e

NETWORK="testnet"
CONTRACTS_DIR="contracts"

echo "🦀 Malabar Ledger — Contract Deployment"
echo "========================================"
echo ""

# Source environment
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "❌ .env not found. Run setup-testnet.sh first."
  exit 1
fi

# ── Build all contracts ────────────────────────────────────────
echo "📦 Building contracts..."
cd $CONTRACTS_DIR

cargo build --target wasm32-unknown-unknown --release
echo "  ✓ Build complete"
echo ""

# ── Deploy ReceivableRegistry ──────────────────────────────────
echo "🚀 Deploying ReceivableRegistry..."
REGISTRY_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/receivable_registry.wasm \
  --source ml-issuer \
  --network $NETWORK)
echo "  Contract ID: $REGISTRY_ID"

# Initialize
soroban contract invoke \
  --id $REGISTRY_ID \
  --source ml-issuer \
  --network $NETWORK \
  -- initialize \
  --admin $ISSUER_PUBLIC_KEY
echo "  ✓ Initialized"
echo ""

# ── Deploy FractionalSale ──────────────────────────────────────
echo "🚀 Deploying FractionalSale..."
SALE_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/fractional_sale.wasm \
  --source ml-issuer \
  --network $NETWORK)
echo "  Contract ID: $SALE_ID"

soroban contract invoke \
  --id $SALE_ID \
  --source ml-issuer \
  --network $NETWORK \
  -- initialize \
  --admin $ISSUER_PUBLIC_KEY
echo "  ✓ Initialized"
echo ""

# ── Deploy SettlementEscrow ────────────────────────────────────
echo "🚀 Deploying SettlementEscrow..."
ESCROW_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/settlement_escrow.wasm \
  --source ml-issuer \
  --network $NETWORK)
echo "  Contract ID: $ESCROW_ID"

soroban contract invoke \
  --id $ESCROW_ID \
  --source ml-issuer \
  --network $NETWORK \
  -- initialize \
  --admin $ISSUER_PUBLIC_KEY
echo "  ✓ Initialized"
echo ""

cd ..

# ── Update .env with contract IDs ─────────────────────────────
echo "📄 Updating .env with contract IDs..."
sed -i "s/RECEIVABLE_REGISTRY_CONTRACT_ID=.*/RECEIVABLE_REGISTRY_CONTRACT_ID=$REGISTRY_ID/" .env
sed -i "s/FRACTIONAL_SALE_CONTRACT_ID=.*/FRACTIONAL_SALE_CONTRACT_ID=$SALE_ID/" .env
sed -i "s/SETTLEMENT_ESCROW_CONTRACT_ID=.*/SETTLEMENT_ESCROW_CONTRACT_ID=$ESCROW_ID/" .env
cp .env api/.env
cp .env frontend/.env

echo ""
echo "✅ All contracts deployed!"
echo ""
echo "  ReceivableRegistry: $REGISTRY_ID"
echo "  FractionalSale:     $SALE_ID"
echo "  SettlementEscrow:   $ESCROW_ID"
echo ""
echo "Explorer links:"
echo "  https://stellar.expert/explorer/testnet/contract/$REGISTRY_ID"
echo "  https://stellar.expert/explorer/testnet/contract/$SALE_ID"
echo "  https://stellar.expert/explorer/testnet/contract/$ESCROW_ID"
echo ""
echo "Contract IDs written to .env. Restart the API server to pick up changes."
