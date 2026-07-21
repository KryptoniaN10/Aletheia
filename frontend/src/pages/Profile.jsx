import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile({ walletAddress, userRole, onProfileUpdate }) {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId') || '0';

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  // Profile fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(userRole || 'investor');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [profilePic, setProfilePic] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // KYC State
  const [kycStatus, setKycStatus] = useState('checking...');

  useEffect(() => {
    fetchProfile();
    if (!walletAddress) return;

    let isMounted = true;
    const checkKyc = async () => {
      try {
        const res = await fetch(`/api/auth/wallets/${walletAddress}/kyc`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setKycStatus(data.approved ? 'Approved ✓' : data.kyc_status || 'Not Started');
        }
      } catch (err) {
        if (isMounted) setKycStatus('Unknown');
      }
    };

    checkKyc();
    const interval = setInterval(checkKyc, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userId, walletAddress]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUsername(data.username || '');
        setEmail(data.email || '');
        setRole(data.role || userRole || 'investor');
        setFullName(data.full_name || '');
        setCompanyName(data.company_name || '');
        setPhone(data.phone || '');
        setBio(data.bio || '');
        setLocation(data.location || '');
        setProfilePic(data.profile_pic || '');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKycStatus = async () => {
    try {
      const res = await fetch(`/api/auth/wallets/${walletAddress}/kyc`);
      if (res.ok) {
        const data = await res.json();
        setKycStatus(data.approved ? 'Approved ✓' : data.kyc_status || 'Not Started');
      }
    } catch (err) {
      setKycStatus('Unknown');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setProfileMsg({ text: 'Image file size should be less than 2MB', type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ text: '', type: '' });

    try {
      const res = await fetch(`/api/auth/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          company_name: companyName,
          phone,
          bio,
          location,
          profile_pic: profilePic,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfileMsg({ text: 'Profile details updated successfully!', type: 'success' });
      if (onProfileUpdate) {
        onProfileUpdate({ full_name: fullName, profile_pic: profilePic });
      }
    } catch (err) {
      setProfileMsg({ text: err.message, type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: '', type: '' });

    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch(`/api/auth/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPasswordMsg({ text: 'Password changed successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ text: err.message, type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  const getInitial = () => {
    if (fullName) return fullName.charAt(0).toUpperCase();
    if (username) return username.charAt(0).toUpperCase();
    return 'U';
  };

  if (loading) {
    return (
      <div style={{ paddingTop: '100px', minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'var(--color-teal)', fontWeight: 600, fontSize: '1.1rem' }}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) + 32px)', paddingBottom: '64px', minHeight: '100vh', background: 'var(--color-bg-base)' }}>
      <div className="container" style={{ maxWidth: '920px', margin: '0 auto' }}>
        
        {/* Profile Card Header */}
        <div className="card" style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-elevated)',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          {/* Avatar preview */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-teal) 0%, #1E4E7C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#FAF8F5',
              overflow: 'hidden',
              border: '3px solid var(--color-saffron)',
              boxShadow: '0 4px 16px rgba(15, 37, 55, 0.15)'
            }}>
              {profilePic ? (
                <img src={profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                getInitial()
              )}
            </div>
          </div>

          {/* Profile Summary info */}
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.1 }}>
                {fullName || username || 'User Profile'}
              </h1>
              <span style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: role === 'admin' ? 'rgba(181, 102, 88, 0.12)' : role === 'exporter' ? 'rgba(196, 154, 69, 0.15)' : 'rgba(15, 37, 55, 0.08)',
                color: role === 'admin' ? '#B56658' : role === 'exporter' ? '#8F6E29' : 'var(--color-teal)',
                border: `1px solid ${role === 'admin' ? 'rgba(181, 102, 88, 0.3)' : role === 'exporter' ? 'rgba(196, 154, 69, 0.3)' : 'rgba(15, 37, 55, 0.2)'}`
              }}>
                {role}
              </span>
            </div>
            
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', marginBottom: '6px', fontWeight: 500 }}>
              @{username} • {email}
            </div>
            {companyName && (
              <div style={{ color: 'var(--color-saffron-dark)', fontSize: '0.9rem', fontWeight: 600 }}>
                🏢 {companyName}
              </div>
            )}
          </div>

          {/* Wallet & KYC pill */}
          <div style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            fontSize: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>KYC Status: </span>
              <strong style={{ color: kycStatus.includes('Approved') ? 'var(--color-green)' : 'var(--color-saffron-dark)' }}>
                {kycStatus}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Wallet: </span>
              <code style={{ fontFamily: 'monospace', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not Connected'}
              </code>
            </div>
          </div>
        </div>

        {/* Grid layout for Forms */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '28px' }}>
          
          {/* Section 1: Edit Profile Details */}
          <div className="card" style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            boxShadow: 'var(--shadow-card)'
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              👤 Personal Details
            </h2>

            {profileMsg.text && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                fontSize: '0.85rem',
                background: profileMsg.type === 'error' ? 'rgba(181, 102, 88, 0.12)' : 'rgba(92, 125, 100, 0.15)',
                color: profileMsg.type === 'error' ? '#B56658' : 'var(--color-green)',
                border: `1px solid ${profileMsg.type === 'error' ? 'rgba(181, 102, 88, 0.3)' : 'rgba(92, 125, 100, 0.3)'}`
              }}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleProfileSubmit}>
              
              {/* Profile Picture Upload / URL */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Profile Picture
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Or enter Image URL below
                </div>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={profilePic.startsWith('data:') ? '' : profilePic}
                  onChange={(e) => setProfilePic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    marginTop: '6px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-base)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              {/* Full Name */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-base)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Company Name */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="Acro Trading Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-base)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Phone & Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-base)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Singapore"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-base)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              {/* Bio */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Bio / Notes
                </label>
                <textarea
                  rows="3"
                  placeholder="Cross-border trade investor focused on Asian agricultural yield receivables..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-base)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingProfile}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--gradient-brand)',
                  border: '1px solid var(--color-teal)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FAF8F5',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                {savingProfile ? 'Saving Details...' : 'Save Details'}
              </button>
            </form>
          </div>

          {/* Section 2: Change Password & Account Security */}
          <div className="card" style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            boxShadow: 'var(--shadow-card)'
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔒 Account Security
            </h2>

            {passwordMsg.text && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                fontSize: '0.85rem',
                background: passwordMsg.type === 'error' ? 'rgba(181, 102, 88, 0.12)' : 'rgba(92, 125, 100, 0.15)',
                color: passwordMsg.type === 'error' ? '#B56658' : 'var(--color-green)',
                border: `1px solid ${passwordMsg.type === 'error' ? 'rgba(181, 102, 88, 0.3)' : 'rgba(92, 125, 100, 0.3)'}`
              }}>
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              
              {/* Current Password */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-base)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* New Password */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-base)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Confirm New Password */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-base)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingPassword}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--gradient-saffron)',
                  border: '1px solid var(--color-saffron)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FAF8F5',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                {savingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '24px 0' }} />

            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
              ℹ️ Password changes update your secure PBKDF2 hash on the Aletheia authentication service. Your Stellar keypairs and on-chain funds remain secured on-chain.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
