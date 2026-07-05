import React, { useState, useEffect, useRef } from 'react';
import { oracleApi } from '../stellar/client.js';

// ── Live Event Feed using Horizon SSE ─────────────────────────
// Shows real-time on-chain events for a given wallet address.
// Falls back to polling the oracle events endpoint.
export default function LiveFeed({ walletAddress }) {
  const [events, setEvents] = useState([]);
  const feedRef = useRef(null);

  useEffect(() => {
    // Poll oracle events every 5s
    const tick = async () => {
      try {
        const data = await oracleApi.events();
        setEvents(data.slice(0, 20));
      } catch {
        // API not running — show placeholder events
      }
    };

    tick();
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom on new events
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events]);

  const EVENT_ICONS = {
    payment_confirmed: '💸',
    distributed: '🎉',
    clawback: '⚠️',
    registered: '📋',
    attested: '✅',
    minted: '🪙',
  };

  const EVENT_COLORS = {
    payment_confirmed: 'var(--color-saffron)',
    distributed: 'var(--color-green-light)',
    clawback: '#f08080',
    registered: 'var(--color-text-secondary)',
    attested: 'var(--color-teal-light)',
    minted: 'var(--color-gold)',
  };

  return (
    <div>
      <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-3)' }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--color-green-light)',
          animation: 'pulse-saffron 2s ease-in-out infinite',
        }} />
        <span className="section-label" style={{ margin: 0 }}>Live Chain Events</span>
      </div>

      <div className="live-feed" ref={feedRef} id="live-feed">
        {events.length === 0 ? (
          <div style={{
            padding: 'var(--space-5)',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontSize: '0.85rem',
          }}>
            Waiting for on-chain events...
            <br />
            <span style={{ fontSize: '0.75rem' }}>Events will appear here as transactions confirm</span>
          </div>
        ) : (
          events.map((event, idx) => (
            <div key={event.id || idx} className="live-event">
              <div className="live-event-dot" style={{
                background: EVENT_COLORS[event.event_type] || 'var(--color-teal-light)',
              }} />
              <span style={{ fontSize: '1rem' }}>
                {EVENT_ICONS[event.event_type] || '🔔'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  color: EVENT_COLORS[event.event_type] || 'var(--color-text-primary)',
                }}>
                  {formatEventType(event.event_type)}
                </div>
                <div className="text-ui-xs text-muted">
                  Receivable #{event.receivable_id}
                  {event.amount_cents && ` · $${(event.amount_cents / 100).toFixed(2)}`}
                </div>
              </div>
              <div className="text-ui-xs text-muted" style={{ whiteSpace: 'nowrap' }}>
                {formatTime(event.occurred_at)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatEventType(type) {
  const labels = {
    payment_confirmed: 'Payment Confirmed',
    distributed: 'Pro-rata Payout',
    clawback: 'Emergency Clawback',
    registered: 'Receivable Registered',
    attested: 'Attestation Received',
    minted: 'Token Minted',
  };
  return labels[type] || type;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return d.toLocaleTimeString();
}
