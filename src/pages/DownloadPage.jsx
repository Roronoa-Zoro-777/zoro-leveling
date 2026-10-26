import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { APP_RELEASE_CONFIG } from '../config/downloadLinks';
import { detectDevice } from '../utils/deviceDetection';

export default function DownloadPage() {
  const { setPage } = useApp();
  const [deviceInfo, setDeviceInfo] = useState({
    os: 'windows',
    osName: 'Windows',
    arch: 'x64',
    isMobile: false,
    browser: 'Chrome',
    isStandalone: false,
  });

  const [selectedPlatform, setSelectedPlatform] = useState('windows');
  const [expandedInstructions, setExpandedInstructions] = useState(null);
  const [copiedChecksum, setCopiedChecksum] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  useEffect(() => {
    const info = detectDevice();
    setDeviceInfo(info);
    setSelectedPlatform(info.os);

    // Capture beforeinstallprompt if fired
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaInstalled(true);
    }
    window.addEventListener('appinstalled', () => setPwaInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Guide user based on browser/OS
      alert(
        deviceInfo.os === 'ios'
          ? 'On iOS Safari: Tap the Share button (square with arrow) at the bottom, then scroll and select "Add to Home Screen".'
          : 'To install in this browser: Click the Install icon in the browser address bar (top right) or open browser settings → "Install ZoroLevel".'
      );
    }
  };

  const copyChecksum = (hash, label) => {
    navigator.clipboard.writeText(hash);
    setCopiedChecksum(label);
    setTimeout(() => setCopiedChecksum(null), 2500);
  };

  const detectedPlatformData = APP_RELEASE_CONFIG.platforms[deviceInfo.os] || APP_RELEASE_CONFIG.platforms.windows;
  const activePlatformData = APP_RELEASE_CONFIG.platforms[selectedPlatform] || detectedPlatformData;

  const platformsList = [
    { key: 'windows', ...APP_RELEASE_CONFIG.platforms.windows },
    { key: 'macos', ...APP_RELEASE_CONFIG.platforms.macos },
    { key: 'linux', ...APP_RELEASE_CONFIG.platforms.linux },
    { key: 'android', ...APP_RELEASE_CONFIG.platforms.android },
    { key: 'ios', ...APP_RELEASE_CONFIG.platforms.ios },
    { key: 'pwa', ...APP_RELEASE_CONFIG.platforms.pwa },
  ];

  return (
    <div className="page-container" style={{ maxWidth: 1080, margin: '0 auto', paddingBottom: 60 }}>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 9999, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--accent-cyan)', fontWeight: 700 }}>
            ⚡ ZoroLevel Desktop & Mobile v{APP_RELEASE_CONFIG.version}
          </span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-cyan)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{APP_RELEASE_CONFIG.releaseDate}</span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 10 }}>
          Download ZoroLevel for Every Device
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
          100% offline, zero-cloud productivity tracker. Your database resides permanently on your own device with zero tracking, zero accounts, and zero subscriptions.
        </p>
      </div>

      {/* ── Hero: Auto-Detected Primary Download Card ────────────────────────── */}
      <div
        className="glass-card liquid-glass-panel"
        style={{
          borderRadius: 28,
          padding: '32px 28px',
          marginBottom: 36,
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.08) 0%, rgba(139, 92, 246, 0.06) 50%, rgba(255, 255, 255, 0.03) 100%)',
          border: '1px solid rgba(34, 211, 238, 0.35)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="chip" style={{ background: 'rgba(34,211,238,0.18)', color: 'var(--accent-cyan)', borderColor: 'rgba(34,211,238,0.4)', fontWeight: 700, fontSize: 12 }}>
                ✓ Auto-Detected System
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {detectedPlatformData.icon} {deviceInfo.osName} ({deviceInfo.arch.toUpperCase()})
              </span>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              {detectedPlatformData.primary.label}
            </h2>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <span>📦 Format: <strong style={{ color: '#fff' }}>{detectedPlatformData.primary.format}</strong></span>
              <span>💾 Size: <strong style={{ color: '#fff' }}>{detectedPlatformData.primary.size}</strong></span>
              <span>🔒 Storage: <strong style={{ color: 'var(--accent-emerald)' }}>Offline Permanent</strong></span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 260 }}>
            {detectedPlatformData.primary.isPwaAction ? (
              <button
                className="btn btn-primary"
                onClick={handlePwaInstall}
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  padding: '16px 28px',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 8px 30px rgba(34, 211, 238, 0.35)',
                }}
              >
                <span>📲</span>
                <span>{pwaInstalled ? 'Open Installed PWA' : 'Install as Web App'}</span>
              </button>
            ) : detectedPlatformData.primary.isStore ? (
              <a
                href={detectedPlatformData.primary.url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  padding: '16px 28px',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  textDecoration: 'none',
                  boxShadow: '0 8px 30px rgba(34, 211, 238, 0.35)',
                }}
              >
                <span>{detectedPlatformData.icon}</span>
                <span>Open in App Store</span>
              </a>
            ) : (
              <a
                href={detectedPlatformData.primary.url}
                download={detectedPlatformData.primary.filename}
                className="btn btn-primary"
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  padding: '16px 28px',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  textDecoration: 'none',
                  boxShadow: '0 8px 30px rgba(34, 211, 238, 0.35)',
                }}
              >
                <span>⚡</span>
                <span>Download Installer (.exe)</span>
              </a>
            )}

            {/* Secondary Option / Alternative format */}
            {detectedPlatformData.secondary && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <a
                  href={detectedPlatformData.secondary.url}
                  download={detectedPlatformData.secondary.filename}
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Looking for {detectedPlatformData.secondary.label}? ({detectedPlatformData.secondary.size})
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Checksum quick verify */}
        {detectedPlatformData.primary.sha256 && (
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: 11 }}>
            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🛡️ SHA-256 Checksum:</span>
              <code style={{ background: 'rgba(0,0,0,0.3)', padding: '3px 8px', borderRadius: 6, color: 'var(--accent-cyan)' }}>
                {detectedPlatformData.primary.sha256.slice(0, 24)}...{detectedPlatformData.primary.sha256.slice(-8)}
              </code>
            </div>
            <button
              onClick={() => copyChecksum(detectedPlatformData.primary.sha256, 'hero')}
              className="btn btn-sm"
              style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(255,255,255,0.06)' }}
            >
              {copiedChecksum === 'hero' ? '✓ Copied' : 'Copy Checksum'}
            </button>
          </div>
        )}
      </div>

      {/* ── Platform Switcher Tabs ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
            All Platforms & Installers
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Choose any operating system below to download or view install steps.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
          {platformsList.map(p => (
            <button
              key={p.key}
              onClick={() => setSelectedPlatform(p.key)}
              style={{
                background: selectedPlatform === p.key ? 'rgba(34,211,238,0.18)' : 'transparent',
                color: selectedPlatform === p.key ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                border: selectedPlatform === p.key ? '1px solid rgba(34,211,238,0.3)' : '1px solid transparent',
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Active Selected Platform Details Card ───────────────────────────── */}
      <div
        className="glass-card liquid-glass-panel"
        style={{
          borderRadius: 24,
          padding: 24,
          marginBottom: 36,
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 36 }}>{activePlatformData.icon}</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
                ZoroLevel for {activePlatformData.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {activePlatformData.osLabel}
              </div>
            </div>
          </div>

          <span className="chip" style={{ background: 'rgba(52,211,153,0.12)', color: 'var(--accent-emerald)', borderColor: 'rgba(52,211,153,0.3)', fontSize: 11 }}>
            ✓ Verified Stable Build
          </span>
        </div>

        {/* Buttons Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 24 }}>
          {/* Primary Action */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>PRIMARY INSTALLER</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              {activePlatformData.primary.label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Format: {activePlatformData.primary.format} • {activePlatformData.primary.size}
            </div>

            {activePlatformData.primary.isPwaAction ? (
              <button className="btn btn-primary" onClick={handlePwaInstall} style={{ width: '100%', fontSize: 13, padding: '10px 16px' }}>
                📲 {pwaInstalled ? 'PWA Installed' : 'Install PWA App'}
              </button>
            ) : activePlatformData.primary.isStore ? (
              <a href={activePlatformData.primary.url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: '100%', fontSize: 13, padding: '10px 16px', textDecoration: 'none', textAlign: 'center' }}>
                ↗ Open Store Listing
              </a>
            ) : (
              <a href={activePlatformData.primary.url} download={activePlatformData.primary.filename} className="btn btn-primary" style={{ width: '100%', fontSize: 13, padding: '10px 16px', textDecoration: 'none', textAlign: 'center' }}>
                📥 Download {activePlatformData.primary.format}
              </a>
            )}
          </div>

          {/* Secondary Action if available */}
          {activePlatformData.secondary && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>ALTERNATIVE OPTION</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                {activePlatformData.secondary.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
                Format: {activePlatformData.secondary.format} • {activePlatformData.secondary.size}
              </div>

              {activePlatformData.secondary.isPwaAction ? (
                <button className="btn btn-secondary" onClick={handlePwaInstall} style={{ width: '100%', fontSize: 13, padding: '10px 16px' }}>
                  📲 Install as PWA
                </button>
              ) : activePlatformData.secondary.isStore ? (
                <a href={activePlatformData.secondary.url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ width: '100%', fontSize: 13, padding: '10px 16px', textDecoration: 'none', textAlign: 'center' }}>
                  ↗ Open Google Play
                </a>
              ) : (
                <a href={activePlatformData.secondary.url} download={activePlatformData.secondary.filename} className="btn btn-secondary" style={{ width: '100%', fontSize: 13, padding: '10px 16px', textDecoration: 'none', textAlign: 'center' }}>
                  📥 Download {activePlatformData.secondary.format}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Step-by-Step Instructions */}
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: 18, border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📋</span> Installation Instructions:
          </div>
          <ol style={{ paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {activePlatformData.installSteps.map((step, idx) => (
              <li key={idx} style={{ marginBottom: 4 }}>{step}</li>
            ))}
          </ol>
          {activePlatformData.systemRequirements && (
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              <strong>System Requirements:</strong> {activePlatformData.systemRequirements}
            </div>
          )}
        </div>
      </div>

      {/* ── 5 Platform Grid Overview ─────────────────────────────────────────── */}
      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
        Platform Quick Reference
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 36 }}>
        {platformsList.map(p => (
          <div
            key={p.key}
            className="glass-card"
            style={{
              borderRadius: 20,
              padding: 20,
              background: 'rgba(255,255,255,0.02)',
              border: selectedPlatform === p.key ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{p.icon}</span>
                <span className="chip" style={{ fontSize: 11 }}>v{APP_RELEASE_CONFIG.version}</span>
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                {p.name}
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
                {p.osLabel}
              </p>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                Primary: {p.primary.filename} ({p.primary.size})
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedPlatform(p.key)}
                style={{ width: '100%', fontSize: 12, padding: '8px 12px' }}
              >
                Select & View Options →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Part 3: Local Storage & Zero Data Loss Guarantee Banner ─────────── */}
      <div
        className="glass-card liquid-glass-panel"
        style={{
          borderRadius: 24,
          padding: 24,
          background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>🔒</span>
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-emerald)' }}>
              Zero Cloud Architecture • Guaranteed Local Data Ownership
            </h4>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              How ZoroLevel stores and protects your productivity data across every platform
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, fontSize: 12, color: 'var(--text-secondary)' }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 14 }}>
            <strong style={{ color: '#fff', display: 'block', marginBottom: 4 }}>🖥️ Desktop (Windows/Mac/Linux)</strong>
            Permanent SQLite / IndexedDB partition in OS user directory (<code style={{ color: 'var(--accent-cyan)' }}>%APPDATA%</code> or <code style={{ color: 'var(--accent-cyan)' }}>~/Library</code>). Never wiped on update.
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 14 }}>
            <strong style={{ color: '#fff', display: 'block', marginBottom: 4 }}>📱 Mobile (Android & iOS)</strong>
            App-sandboxed private SQLite/WebView storage. Survives reboots, updates, and airplane mode with zero sync delay.
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 14 }}>
            <strong style={{ color: '#fff', display: 'block', marginBottom: 4 }}>🌐 Web App (PWA)</strong>
            Hardware-backed IndexedDB with <code style={{ color: 'var(--accent-cyan)' }}>navigator.storage.persist()</code> requested. Immune to browser cache purges.
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 14 }}>
            <strong style={{ color: '#fff', display: 'block', marginBottom: 4 }}>🔄 Backup & Recovery</strong>
            7-day rotating local snapshot ring, JSON/CSV exports, AES-GCM password encryption, and 30-day soft trash retention.
          </div>
        </div>
      </div>
    </div>
  );
}
