import React from 'react';

export default function NetworkStatusIndicator() {
  const network = import.meta.env.VITE_STELLAR_NETWORK || 'testnet';
  const isTestnet = network.toLowerCase() === 'testnet';

  return (
    <div 
      className="network-badge" 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px',
        background: isTestnet ? 'rgba(196, 154, 69, 0.08)' : 'rgba(92, 125, 100, 0.08)',
        border: isTestnet ? '1px solid rgba(196, 154, 69, 0.25)' : '1px solid rgba(92, 125, 100, 0.25)',
        padding: '6px 14px',
        borderRadius: '999px',
        color: isTestnet ? '#8f6e29' : 'var(--color-green)',
        fontSize: '0.75rem',
        fontWeight: 600
      }}
    >
      <span 
        className="network-badge-dot" 
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: isTestnet ? 'var(--color-saffron)' : 'var(--color-green)',
          display: 'inline-block'
        }} 
      />
      <span style={{ textTransform: 'capitalize', fontSize: '0.75rem', fontWeight: 700 }}>
        {network}
      </span>
    </div>
  );
}
