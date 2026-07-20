import React, { useState, useEffect, useCallback } from 'react';
import { getAccountBalances, getPayments } from '../stellar/client.js';

export default function StellarWallet({ walletAddress, onConnect }) {
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [xlmBalance, setXlmBalance] = useState('0');
  const [transactions, setTransactions] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [funding, setFunding] = useState(false);
  const [fundStatus, setFundStatus] = useState({ type: '', message: '' });

  const isDemo = walletAddress && (walletAddress.startsWith('GDEMO') || walletAddress.startsWith('USER_'));

  const refreshData = useCallback(async () => {
    if (!walletAddress) return;
    
    if (isDemo) {
      // Load mock/demo data matching the design spec/screenshots
      setUsdcBalance('0');
      setXlmBalance('0');
      setTransactions([
        {
          id: 'd1',
          type: 'SEND',
          amount: '-5198799.3 USDC',
          date: '7/19/2026, 10:08:43 AM',
          isOutflow: true,
        },
        {
          id: 'd2',
          type: 'FUND',
          amount: '-0 XLM',
          date: '7/19/2026, 5:49:43 AM',
          isOutflow: true,
        }
      ]);
      return;
    }

    setLoadingTx(true);
    try {
      // 1. Fetch Balances
      const rawBalances = await getAccountBalances(walletAddress);
      const usdc = rawBalances.find(b => b.asset_code === 'USDC');
      const xlm = rawBalances.find(b => b.asset_type === 'native');
      
      setUsdcBalance(usdc ? parseFloat(usdc.balance).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 7 }) : '0');
      setXlmBalance(xlm ? parseFloat(xlm.balance).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 7 }) : '0');

      // 2. Fetch Payments / Transactions
      const rawPayments = await getPayments(walletAddress);
      const parsed = rawPayments.map(p => {
        const date = new Date(p.created_at).toLocaleString();
        if (p.type === 'create_account') {
          return {
            id: p.id,
            type: 'FUND',
            amount: `+${parseFloat(p.starting_balance).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 7 })} XLM`,
            date,
            isOutflow: false,
          };
        } else if (p.type === 'payment') {
          const asset = p.asset_code || 'XLM';
          const isOutflow = p.from === walletAddress;
          return {
            id: p.id,
            type: isOutflow ? 'SEND' : 'RECEIVE',
            amount: `${isOutflow ? '-' : '+'}${parseFloat(p.amount).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 7 })} ${asset}`,
            date,
            isOutflow,
          };
        } else {
          return {
            id: p.id,
            type: p.type.toUpperCase().replace('_', ' '),
            amount: '—',
            date,
            isOutflow: false,
          };
        }
      });
      setTransactions(parsed);
    } catch (err) {
      console.error('Error fetching Stellar wallet data:', err);
    } finally {
      setLoadingTx(false);
    }
  }, [walletAddress, isDemo]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleSync = async () => {
    setSyncing(true);
    await refreshData();
    setTimeout(() => setSyncing(false), 800); // UI feedback delay
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    alert('Public address copied to clipboard!');
  };

  const handleFundTestnet = async () => {
    if (!walletAddress) return;
    setFunding(true);
    setFundStatus({ type: '', message: '' });
    
    if (isDemo) {
      // Simulate testnet funding for demo address
      setTimeout(() => {
        setUsdcBalance('10000.0');
        setXlmBalance('10000.0');
        setTransactions(prev => [
          {
            id: `f-${Date.now()}`,
            type: 'FUND',
            amount: '+10000.0 XLM',
            date: new Date().toLocaleString(),
            isOutflow: false,
          },
          ...prev
        ]);
        setFundStatus({ type: 'success', message: 'Demo account funded with 10,000 mock XLM & USDC!' });
        setFunding(false);
      }, 1500);
      return;
    }

    try {
      const response = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(walletAddress)}`);
      if (!response.ok) {
        throw new Error('Friendbot funding request failed. Please try again.');
      }
      setFundStatus({ type: 'success', message: 'Account funded with 10,000 Testnet XLM!' });
      await refreshData();
    } catch (err) {
      console.error(err);
      setFundStatus({ type: 'error', message: err.message || 'Failed to fund account' });
    } finally {
      setFunding(false);
    }
  };

  if (!walletAddress) {
    return (
      <main className="page-content">
        <div className="container">
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center', textAlign: 'center', padding: 'var(--space-7)' }}>
            <span style={{ fontSize: '2.5rem' }}>👛</span>
            <h3>Freighter Wallet Required</h3>
            <p className="text-secondary text-ui-sm" style={{ maxWidth: '400px' }}>
              Connect your Freighter wallet to view your balances and transaction history.
            </p>
            <button className="btn btn-primary" onClick={onConnect}>
              Connect Wallet
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-content">
      <div className="container" style={{ maxWidth: '880px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-6)' }}>
          <div>
            <div className="section-label" style={{ color: 'var(--color-saffron)', letterSpacing: '0.1em', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Settlement Wallet</div>
            <h1 style={{ margin: 'var(--space-1) 0 0 0' }}>
              Stellar <span style={{ color: 'var(--color-teal)' }}>Wallet</span>
            </h1>
            <p className="text-secondary text-ui-sm" style={{ marginTop: '4px' }}>
              Manage Stellar assets, USDC settlement accounts, and transaction history
            </p>
          </div>
          <button 
            className="btn btn-outline" 
            onClick={handleSync}
            disabled={syncing || loadingTx}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 16px', border: '1px solid var(--color-border)' }}
          >
            {syncing ? (
              <>
                <div className="spinner" style={{ width: 12, height: 12, border: '2px solid var(--color-teal)', borderTopColor: 'transparent' }} />
                Syncing...
              </>
            ) : (
              <>Sync Balance</>
            )}
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid-2" style={{ marginBottom: 'var(--space-6)' }}>
          {/* USDC Balance Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>USDC Balance</span>
              <span className="badge" style={{ background: '#E6F4F1', color: '#0D6E6A', borderColor: 'rgba(13, 110, 106, 0.2)' }}>
                ACTIVE
              </span>
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 700, fontFamily: 'var(--font-ui)', color: 'var(--color-text-primary)', margin: 'var(--space-1) 0' }}>
              {usdcBalance} <span style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>USDC</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Settlement asset for trade invoice disbursements
            </div>
          </div>

          {/* XLM Balance Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>XLM Balance</span>
              <span className="badge" style={{ background: '#F0EFEA', color: '#6B6255', borderColor: 'rgba(107, 98, 85, 0.2)' }}>
                GAS ASSET
              </span>
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 700, fontFamily: 'var(--font-ui)', color: 'var(--color-text-primary)', margin: 'var(--space-1) 0' }}>
              {xlmBalance} <span style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>XLM</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Stellar Network Native Asset used for transaction fees
            </div>
          </div>
        </div>

        {/* Public Address Card */}
        <div className="card" style={{ marginBottom: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)' }}>Stellar Public Address</h3>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <input 
              type="text" 
              readOnly 
              value={walletAddress} 
              className="monospace"
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-base)',
                color: 'var(--color-text-primary)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <button 
              className="btn btn-outline" 
              onClick={handleCopy}
              style={{ padding: '8px 16px', fontSize: '0.85rem', border: '1px solid var(--color-border)', background: '#FFFFFF' }}
            >
              Copy
            </button>
            <button 
              className="btn btn-saffron" 
              onClick={handleFundTestnet}
              disabled={funding}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {funding ? (
                <>
                  <div className="spinner" style={{ width: 12, height: 12, border: '2px solid white', borderTopColor: 'transparent' }} />
                  Funding...
                </>
              ) : (
                'Fund Testnet'
              )}
            </button>
          </div>
          {fundStatus.message && (
            <div style={{ 
              fontSize: '0.8rem', 
              color: fundStatus.type === 'success' ? 'var(--color-green)' : 'var(--color-clawback)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {fundStatus.type === 'success' ? '✓' : '✗'} {fundStatus.message}
            </div>
          )}
        </div>

        {/* Recent Transactions Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)' }}>Recent Transactions</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Testnet network activity</span>
          </div>

          {loadingTx ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-6)' }}>
              <div className="spinner" style={{ width: 24, height: 24 }} />
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-5) 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              No transactions found on Testnet for this account.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {transactions.map((tx) => (
                <div 
                  key={tx.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px var(--space-3)', 
                    borderRadius: 'var(--radius-sm)', 
                    background: 'rgba(26, 23, 18, 0.02)',
                    border: '1px solid rgba(26, 23, 18, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div 
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(26, 23, 18, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-secondary)',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}
                    >
                      {tx.isOutflow ? '↑' : '↓'}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{tx.type}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{tx.date}</span>
                    </div>
                  </div>
                  
                  <div 
                    style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 700, 
                      color: tx.isOutflow ? 'var(--color-text-primary)' : 'var(--color-green)' 
                    }}
                  >
                    {tx.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
