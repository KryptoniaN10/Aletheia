# deploy-contracts.ps1 - Malabar Ledger Contract Deployment
# Compiles all three Soroban contracts to WASM and deploys to testnet.

param()

$ErrorActionPreference = 'Continue'
$Env:Path = "$Env:Path;$HOME\.cargo\bin"

Write-Host "Malabar Ledger - Contract Deployment" -ForegroundColor Yellow
Write-Host "======================================="

# ── Load .env ─────────────────────────────────────────────────
if (Test-Path ".\\.env") {
    Get-Content ".\\.env" | ForEach-Object {
        if ($_ -match '^(?<key>[A-Za-z0-9_]+)=(?<val>.*)$') {
            $key = $Matches.key
            $val = $Matches.val.Trim('"').Trim("'")
            Set-Variable -Name $key -Value $val -Scope Script
        }
    }
} else {
    Write-Error ".env not found. Run .\scripts\setup-testnet.ps1 first."
    exit 1
}

if (-not $ISSUER_PUBLIC_KEY) {
    Write-Error "ISSUER_PUBLIC_KEY is not defined in .env."
    exit 1
}

Write-Host ("Deploying with issuer: " + $ISSUER_PUBLIC_KEY) -ForegroundColor Cyan

# ── Set CARGO_TARGET_DIR to E: drive to avoid C: space issues ──
$Env:CARGO_TARGET_DIR = "E:\cargo-target"

# ── Build all contracts ────────────────────────────────────────
Write-Host "Building contracts..." -ForegroundColor Cyan
Push-Location contracts
$buildOutput = cargo build --target wasm32-unknown-unknown --release 2>&1
$buildOutput | Where-Object { $_ -notmatch '^warning:' } | Write-Host
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to compile contracts. Ensure rustup target wasm32-unknown-unknown is installed."
    Pop-Location
    exit 1
}
Write-Host "  Build complete" -ForegroundColor Green
Pop-Location

# ── Deploy ReceivableRegistry ──────────────────────────────────
Write-Host "Deploying ReceivableRegistry..." -ForegroundColor Cyan
$REGISTRY_ID = (soroban contract deploy `
    --wasm ("E:\cargo-target\wasm32-unknown-unknown\release\receivable_registry.wasm") `
    --source ml-issuer `
    --rpc-url https://soroban-testnet.stellar.org `
    --network-passphrase "Test SDF Network ; September 2015").Trim()
Write-Host ("  Contract ID: " + $REGISTRY_ID)

$null = soroban contract invoke `
    --id $REGISTRY_ID `
    --source ml-issuer `
    --rpc-url https://soroban-testnet.stellar.org `
    --network-passphrase "Test SDF Network ; September 2015" `
    -- initialize `
    --admin $ISSUER_PUBLIC_KEY
Write-Host "  Initialized" -ForegroundColor Green

# ── Deploy FractionalSale ──────────────────────────────────────
Write-Host "Deploying FractionalSale..." -ForegroundColor Cyan
$SALE_ID = (soroban contract deploy `
    --wasm ("E:\cargo-target\wasm32-unknown-unknown\release\fractional_sale.wasm") `
    --source ml-issuer `
    --rpc-url https://soroban-testnet.stellar.org `
    --network-passphrase "Test SDF Network ; September 2015").Trim()
Write-Host ("  Contract ID: " + $SALE_ID)

$null = soroban contract invoke `
    --id $SALE_ID `
    --source ml-issuer `
    --rpc-url https://soroban-testnet.stellar.org `
    --network-passphrase "Test SDF Network ; September 2015" `
    -- initialize `
    --admin $ISSUER_PUBLIC_KEY
Write-Host "  Initialized" -ForegroundColor Green

# ── Deploy SettlementEscrow ────────────────────────────────────
Write-Host "Deploying SettlementEscrow..." -ForegroundColor Cyan
$ESCROW_ID = (soroban contract deploy `
    --wasm ("E:\cargo-target\wasm32-unknown-unknown\release\settlement_escrow.wasm") `
    --source ml-issuer `
    --rpc-url https://soroban-testnet.stellar.org `
    --network-passphrase "Test SDF Network ; September 2015").Trim()
Write-Host ("  Contract ID: " + $ESCROW_ID)

$null = soroban contract invoke `
    --id $ESCROW_ID `
    --source ml-issuer `
    --rpc-url https://soroban-testnet.stellar.org `
    --network-passphrase "Test SDF Network ; September 2015" `
    -- initialize `
    --admin $ISSUER_PUBLIC_KEY
Write-Host "  Initialized" -ForegroundColor Green

# ── Update .env files with contract IDs ───────────────────────
Write-Host "Updating .env files with contract IDs..." -ForegroundColor Cyan
$envFiles = @(".\\.env", ".\\api\\.env", ".\\frontend\\.env")
foreach ($file in $envFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file
        $content = $content -replace '^RECEIVABLE_REGISTRY_CONTRACT_ID=.*', ("RECEIVABLE_REGISTRY_CONTRACT_ID=" + $REGISTRY_ID)
        $content = $content -replace '^FRACTIONAL_SALE_CONTRACT_ID=.*',     ("FRACTIONAL_SALE_CONTRACT_ID=" + $SALE_ID)
        $content = $content -replace '^SETTLEMENT_ESCROW_CONTRACT_ID=.*',    ("SETTLEMENT_ESCROW_CONTRACT_ID=" + $ESCROW_ID)
        $content | Set-Content $file
    }
}
Write-Host "  Contract IDs written to .env files" -ForegroundColor Green

Write-Host ""
Write-Host "Contract deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Contract IDs:"
Write-Host ("  ReceivableRegistry: " + $REGISTRY_ID)
Write-Host ("  FractionalSale:     " + $SALE_ID)
Write-Host ("  SettlementEscrow:   " + $ESCROW_ID)
