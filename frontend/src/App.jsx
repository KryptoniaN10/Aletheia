import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import ExporterDashboard from './pages/ExporterDashboard.jsx';
import InvestorDashboard from './pages/InvestorDashboard.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import { connectFreighter, getFreighterPublicKey, formatAddress } from './stellar/client.js';

export default function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const location = useLocation();

  // Restore wallet on mount
  useEffect(() => {
    getFreighterPublicKey().then(setWalletAddress);
  }, []);

  async function handleConnect() {
    setConnecting(true);
    try {
      const address = await connectFreighter();
      setWalletAddress(address);
    } catch (err) {
      console.error('Wallet connect error', err);
    }
    setConnecting(false);
  }

  const isLanding = location.pathname === '/';

  return (
    <>
      {/* ── Navigation ──────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="navbar-logo">
            <div className="navbar-logo-mark">M</div>
            <span className="navbar-logo-text">
              Malabar <span>Ledger</span>
            </span>
          </NavLink>

          <ul className="navbar-links">
            <li>
              <NavLink
                to="/exporter"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                Exporter
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/investor"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                Invest
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                Admin
              </NavLink>
            </li>
          </ul>

          <div className="flex items-center gap-3">
            <div className="network-badge">
              <div className="network-badge-dot" />
              Testnet
            </div>

            {walletAddress ? (
              <div className="flex items-center gap-2">
                <div
                  className="btn btn-outline btn-sm"
                  title={walletAddress}
                >
                  {formatAddress(walletAddress, 4)}
                </div>
              </div>
            ) : (
              <button
                id="connect-wallet-btn"
                className="btn btn-primary btn-sm"
                onClick={handleConnect}
                disabled={connecting}
              >
                {connecting ? (
                  <><div className="spinner" style={{ width: 14, height: 14 }} /> Connecting</>
                ) : (
                  'Connect Wallet'
                )}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Routes ──────────────────────────────────────────── */}
      <Routes>
        <Route path="/" element={<Landing walletAddress={walletAddress} onConnect={handleConnect} />} />
        <Route path="/exporter" element={<ExporterDashboard walletAddress={walletAddress} onConnect={handleConnect} />} />
        <Route path="/investor" element={<InvestorDashboard walletAddress={walletAddress} onConnect={handleConnect} />} />
        <Route path="/admin" element={<AdminPanel walletAddress={walletAddress} />} />
      </Routes>
    </>
  );
}
