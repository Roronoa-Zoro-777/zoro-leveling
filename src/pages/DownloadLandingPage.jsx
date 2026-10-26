/**
 * DownloadLandingPage.jsx — Standalone Software Company Download Landing Page
 * 
 * Has its own dedicated standalone layout (outside of the main app shell).
 * Zero cloud, 100% offline local storage architecture.
 * Features:
 * - Auto-detects visitor device & OS with large primary CTA
 * - All platforms cards (Windows, macOS, Linux, Android, iOS) with installers, sizes, specs & install steps
 * - Install as Web App (PWA) with live prompt trigger
 * - Privacy & Offline-first features explanation
 * - Comprehensive FAQ (Installation, Backups, Updates, Data safety)
 * - Prominent "← Back to App" navigation
 * - All data sourced from src/config/downloadLinks.js
 */

import React, { useState, useEffect } from 'react';
import { APP_RELEASE_CONFIG } from '../config/downloadLinks';
import { detectDevice } from '../utils/deviceDetection';

export default function DownloadLandingPage({ onBackToApp }) {
  const [deviceInfo, setDeviceInfo] = useState({
    os: 'windows',
    osName: 'Windows',
    arch: 'x64',
    isMobile: false,
    browser: 'Chrome',
    isStandalone: false,
  });

  const [activeTab, setActiveTab] = useState('windows');
  const [copiedChecksum, setCopiedChecksum] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const info = detectDevice();
    setDeviceInfo(info);
    setActiveTab(info.os);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaInstalled(true);
    }
    window.addEventListener('appinstalled', () => setPwaInstalled(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
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
      alert(
        deviceInfo.os === 'ios'
          ? 'On iOS Safari: Tap the Share button (square with arrow) at the bottom, then scroll and tap "Add to Home Screen".'
          : 'To install in this browser: Click the Install icon in the browser address bar (top-right) or open browser settings → "Install ZoroLevel".'
      );
    }
  };

  const copyChecksum = (hash, label) => {
    navigator.clipboard.writeText(hash);
    setCopiedChecksum(label);
    setTimeout(() => setCopiedChecksum(null), 2500);
  };

  const detectedData = APP_RELEASE_CONFIG.platforms[deviceInfo.os] || APP_RELEASE_CONFIG.platforms.windows;

  const faqs = [
    {
      q: 'How do I install ZoroLevel on my computer or phone?',
      a: 'Choose your operating system above and download the appropriate installer. On Windows, run the .exe setup; on macOS, drag ZoroLevel to Applications; on Linux, run the .AppImage or install the .deb package. For Android, download the .apk directly or install as a PWA via your browser.',
    },
    {
      q: 'Where is my data stored? Does anything go to the cloud?',
      a: 'All data is stored 100% locally on your own device. Desktop apps store data in the operating system permanent AppData directory (%APPDATA%\\ZoroLevel on Windows, ~/Library/Application Support/ZoroLevel on macOS). The Web and PWA version uses persistent IndexedDB. ZoroLevel has zero cloud servers, zero analytics, and zero external database connections.',
    },
    {
      q: 'What happens to my data when I update or reinstall?',
      a: 'Your data will never be wiped. The desktop installers are specifically configured with permanent storage persistence (deleteAppDataOnUninstall: false). When you install newer versions, your database remains untouched and versioned migrations safely preserve every single task, habit, and XP record.',
    },
    {
      q: 'How do automated rotating backups work?',
      a: 'ZoroLevel automatically creates a rolling 7-day snapshot backup in a separate offline directory every day you use the app. You can also export complete JSON or spreadsheet CSV backups at any time from Settings > Local Backup.',
    },
    {
      q: 'Can I move my data between my phone and computer?',
      a: 'Yes! Since there is no central cloud server, cross-device sync is completely private and peer-to-peer. Go to Settings on device A, click "Export JSON Backup" or "Export CSV", send the file to device B (via AirDrop, Bluetooth, or USB), and click "Restore Backup" on device B.',
    },
  ];

  return (
    <div className="landing-wrapper" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-deep, #030712)',
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* ── Background Aurora Mesh ─────────────────────────────────────────── */}
      <div className="orb-container" aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div className="orb orb-cyan" />
        <div className="orb orb-violet" />
        <div className="orb orb-magenta" />
        <div className="orb orb-blue" />
        <div className="bg-noise" />
        <div className="bg-vignette" />
      </div>

      {/* ── Sticky Landing Header ─────────────────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        background: 'rgba(3, 7, 18, 0.75)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px 24px',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(167, 139, 250, 0.3) 100%)',
              border: '1px solid rgba(34, 211, 238, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)',
            }}>
              ⚡
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                ZoroLevel
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: 'rgba(34, 211, 238, 0.15)',
                  border: '1px solid rgba(34, 211, 238, 0.4)',
                  color: 'var(--accent-cyan, #22d3ee)',
                  padding: '2px 6px',
                  borderRadius: 6,
                }}>
                  v{APP_RELEASE_CONFIG.version}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)' }}>
                100% Offline Productivity Engine
              </div>
            </div>
          </div>

          {/* Header Action: Return to App */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a
              href="#platforms"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary, #cbd5e1)',
                textDecoration: 'none',
                padding: '8px 14px',
                borderRadius: 10,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary, #cbd5e1)'}
            >
              All Platforms
            </a>
            <a
              href="#features"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary, #cbd5e1)',
                textDecoration: 'none',
                padding: '8px 14px',
                borderRadius: 10,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary, #cbd5e1)'}
            >
              Zero Cloud
            </a>
            <a
              href="#faq"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary, #cbd5e1)',
                textDecoration: 'none',
                padding: '8px 14px',
                borderRadius: 10,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary, #cbd5e1)'}
            >
              FAQ
            </a>

            <button
              id="landing-back-to-app-btn"
              onClick={onBackToApp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 211, 238, 0.25) 0%, rgba(167, 139, 250, 0.25) 100%)';
                e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.6)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
            >
              <span>←</span>
              <span>Back to App</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ────────────────────────────────────────── */}
      <main style={{ position: 'relative', zIndex: 1, flex: 1 }}>
        {/* ── 1. Hero Section ─────────────────────────────────────────────── */}
        <section style={{
          padding: '72px 24px 64px',
          textAlign: 'center',
          maxWidth: 960,
          margin: '0 auto',
        }}>
          {/* Release Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 9999,
            background: 'rgba(34, 211, 238, 0.1)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            marginBottom: 24,
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.15)',
          }}>
            <span style={{ fontSize: 13, color: 'var(--accent-cyan, #22d3ee)', fontWeight: 800 }}>
              ⚡ ZoroLevel Official Release v{APP_RELEASE_CONFIG.version}
            </span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-cyan, #22d3ee)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)' }}>{APP_RELEASE_CONFIG.releaseDate}</span>
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 'clamp(36px, 5.5vw, 64px)',
            fontWeight: 900,
            letterSpacing: '-0.035em',
            lineHeight: 1.1,
            margin: '0 0 18px',
            background: 'linear-gradient(135deg, #ffffff 40%, rgba(255, 255, 255, 0.65) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Your Growth. Your Data.<br />
            Stored Strictly On Your Device.
          </h1>

          {/* One-Line Tagline */}
          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: 'var(--text-secondary, #cbd5e1)',
            maxWidth: 720,
            margin: '0 auto 36px',
            lineHeight: 1.55,
            fontWeight: 400,
          }}>
            Gamified Solo-Leveling productivity with 100% offline local storage, procedural audio, and zero cloud tracking.
          </p>

          {/* Primary Auto-Detected Download CTA Card */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
            border: '1px solid rgba(34, 211, 238, 0.4)',
            borderRadius: 24,
            padding: '32px 28px',
            maxWidth: 620,
            margin: '0 auto',
            backdropFilter: 'blur(24px) saturate(190%)',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.3), 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(34, 211, 238, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>
                Auto-detected your system:
              </span>
              <span style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--accent-cyan, #22d3ee)',
                background: 'rgba(34, 211, 238, 0.15)',
                padding: '3px 10px',
                borderRadius: 8,
                border: '1px solid rgba(34, 211, 238, 0.3)',
              }}>
                {detectedData.icon} {deviceInfo.osName} ({deviceInfo.arch})
              </span>
            </div>

            {/* Big Primary CTA Button */}
            <a
              id="hero-primary-download-btn"
              href={detectedData.primary?.url || '#'}
              download={detectedData.primary?.filename || true}
              onClick={(e) => {
                if (detectedData.primary?.isPwaAction) {
                  e.preventDefault();
                  handlePwaInstall();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '16px 32px',
                borderRadius: 16,
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: '-0.01em',
                boxShadow: '0 0 30px rgba(6, 182, 212, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.5)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                marginBottom: 14,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 40px rgba(6, 182, 212, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.6)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(6, 182, 212, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.5)';
              }}
            >
              <span style={{ fontSize: 22 }}>📥</span>
              <span>Download for {detectedData.name} ({detectedData.primary?.format || '.exe'})</span>
            </a>

            {/* Meta row below hero button */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 16,
              fontSize: 12,
              color: 'var(--text-muted, #94a3b8)',
              flexWrap: 'wrap',
            }}>
              <span>Version {APP_RELEASE_CONFIG.version}</span>
              <span>•</span>
              <span>Size: {detectedData.primary?.size || '~68 MB'}</span>
              <span>•</span>
              <a href="#platforms" style={{ color: 'var(--accent-cyan, #22d3ee)', textDecoration: 'none', fontWeight: 600 }}>
                Other platforms below ↓
              </a>
            </div>

            {/* Checksum quick copy */}
            {detectedData.primary?.sha256 && (
              <div style={{
                marginTop: 16,
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11,
                fontFamily: 'monospace',
                color: 'var(--text-muted, #94a3b8)',
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 440 }}>
                  SHA256: {detectedData.primary.sha256}
                </span>
                <button
                  type="button"
                  onClick={() => copyChecksum(detectedData.primary.sha256, 'hero')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedChecksum === 'hero' ? '#34d399' : 'var(--accent-cyan, #22d3ee)',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 6px',
                    marginLeft: 8,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {copiedChecksum === 'hero' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── 2. All Platforms Section ─────────────────────────────────────── */}
        <section id="platforms" style={{
          padding: '60px 24px 80px',
          maxWidth: 1200,
          margin: '0 auto',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-cyan, #22d3ee)', marginBottom: 8 }}>
              Native Performance & Offline Durability
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Available Across All Your Devices
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary, #cbd5e1)', marginTop: 8 }}>
              Each installer packages the complete offline application. No remote calls, no telemetry.
            </p>
          </div>

          {/* Cards Grid: Windows, macOS, Linux, Android, iOS, PWA */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 24,
          }}>
            {/* Windows Card */}
            <PlatformCard
              platform={APP_RELEASE_CONFIG.platforms.windows}
              isDetected={deviceInfo.os === 'windows'}
              onCopy={copyChecksum}
              copiedChecksum={copiedChecksum}
            />

            {/* macOS Card */}
            <PlatformCard
              platform={APP_RELEASE_CONFIG.platforms.macos}
              isDetected={deviceInfo.os === 'macos'}
              onCopy={copyChecksum}
              copiedChecksum={copiedChecksum}
            />

            {/* Linux Card */}
            <PlatformCard
              platform={APP_RELEASE_CONFIG.platforms.linux}
              isDetected={deviceInfo.os === 'linux'}
              onCopy={copyChecksum}
              copiedChecksum={copiedChecksum}
            />

            {/* Android Card */}
            <PlatformCard
              platform={APP_RELEASE_CONFIG.platforms.android}
              isDetected={deviceInfo.os === 'android'}
              onCopy={copyChecksum}
              copiedChecksum={copiedChecksum}
            />

            {/* iOS Card */}
            <PlatformCard
              platform={APP_RELEASE_CONFIG.platforms.ios}
              isDetected={deviceInfo.os === 'ios'}
              onCopy={copyChecksum}
              copiedChecksum={copiedChecksum}
            />

            {/* PWA Card */}
            <PlatformCard
              platform={APP_RELEASE_CONFIG.platforms.pwa}
              isDetected={pwaInstalled}
              isPwa
              onPwaInstall={handlePwaInstall}
              onCopy={copyChecksum}
              copiedChecksum={copiedChecksum}
            />
          </div>
        </section>

        {/* ── 3. Features: 100% Offline & Zero Cloud Guarantee ─────────────── */}
        <section id="features" style={{
          padding: '60px 24px 80px',
          maxWidth: 1100,
          margin: '0 auto',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: '#a78bfa', marginBottom: 8 }}>
              Engineered For Complete Privacy
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Zero Cloud. Zero Servers. Zero Data Loss.
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
          }}>
            <FeatureBox
              icon="🔒"
              title="100% Offline by Design"
              description="Your tasks, habits, and progress never leave your physical machine. ZoroLevel works without any internet connection."
            />
            <FeatureBox
              icon="💾"
              title="Permanent OS Storage"
              description="Desktop apps store data in permanent OS AppData (%APPDATA% on Windows, Application Support on macOS), never in temp or browser cache."
            />
            <FeatureBox
              icon="🔄"
              title="Automatic 7-Day Backups"
              description="Rotating daily local snapshots are created automatically every day you use the app, allowing instant rollback in 1 click."
            />
            <FeatureBox
              icon="📊"
              title="Full Data Portability"
              description="Export your entire productivity history into clean JSON or spreadsheet-ready CSV at any time from Settings."
            />
          </div>
        </section>

        {/* ── 4. Frequently Asked Questions (FAQ) ─────────────────────────── */}
        <section id="faq" style={{
          padding: '40px 24px 80px',
          maxWidth: 840,
          margin: '0 auto',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800, margin: '0 0 10px' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary, #cbd5e1)', margin: 0 }}>
              Clear answers regarding installation, updates, and your local database.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '18px 20px',
                      background: 'none',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: 15,
                      fontWeight: 700,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: 18, color: 'var(--accent-cyan, #22d3ee)', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: '0 20px 18px',
                      fontSize: 13,
                      lineHeight: 1.65,
                      color: 'var(--text-secondary, #cbd5e1)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      paddingTop: 14,
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 5. Bottom Return to App Banner ───────────────────────────────── */}
        <section style={{
          padding: '60px 24px 80px',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, transparent 0%, rgba(34, 211, 238, 0.04) 100%)',
        }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
              Ready to Resume Your Solo Leveling?
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary, #cbd5e1)', marginBottom: 24 }}>
              Launch your active workspace to track quests, log deep focus sessions, and level up your discipline.
            </p>
            <button
              id="landing-bottom-back-to-app-btn"
              onClick={onBackToApp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '14px 28px',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 0 25px rgba(34, 211, 238, 0.4)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span>← Return to Productivity App</span>
            </button>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{
        padding: '24px',
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--text-muted, #94a3b8)',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        ZoroLevel v{APP_RELEASE_CONFIG.version} • Offline-First Solo-Leveling Engine • Zero Cloud • Local Storage Architecture
      </footer>
    </div>
  );
}

// ─── Subcomponent: Platform Card ─────────────────────────────────────────────
function PlatformCard({ platform, isDetected, isPwa, onPwaInstall, onCopy, copiedChecksum }) {
  const [showSteps, setShowSteps] = useState(false);

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.015) 100%)',
      border: isDetected ? '1px solid rgba(34, 211, 238, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 20,
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: isDetected ? '0 0 30px rgba(34, 211, 238, 0.15)' : 'none',
      position: 'relative',
    }}>
      {/* Detected Badge */}
      {isDetected && (
        <div style={{
          position: 'absolute',
          top: -10,
          right: 20,
          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
          color: '#ffffff',
          fontSize: 10,
          fontWeight: 800,
          padding: '2px 10px',
          borderRadius: 9999,
          boxShadow: '0 0 12px rgba(6, 182, 212, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}>
          Current Device
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
        }}>
          {platform.icon}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
            {platform.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)' }}>
            {platform.osLabel}
          </div>
        </div>
      </div>

      {/* Specs / Meta */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.25)',
        borderRadius: 12,
        padding: '10px 14px',
        fontSize: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Version</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-cyan, #22d3ee)' }}>v{APP_RELEASE_CONFIG.version}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted, #94a3b8)' }}>File Size</span>
          <span style={{ fontWeight: 600 }}>{platform.primary?.size || '~68 MB'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted, #94a3b8)' }}>System</span>
          <span style={{ fontWeight: 500, color: 'var(--text-secondary, #cbd5e1)', textAlign: 'right', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={platform.systemRequirements}>
            {platform.systemRequirements}
          </span>
        </div>
      </div>

      {/* Download Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {isPwa ? (
          <button
            type="button"
            onClick={onPwaInstall}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '12px 18px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)',
            }}
          >
            <span>🌐</span>
            <span>Install ZoroLevel Web App</span>
          </button>
        ) : (
          <a
            href={platform.primary?.url || '#'}
            download={platform.primary?.filename || true}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: isDetected
                ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 100%)',
              color: '#ffffff',
              textDecoration: 'none',
              padding: '12px 18px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              border: isDetected ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: isDetected ? '0 0 15px rgba(6, 182, 212, 0.4)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <span>📥</span>
            <span>{platform.primary?.label || 'Download'}</span>
          </a>
        )}

        {platform.secondary && (
          <a
            href={platform.secondary.url || '#'}
            download={platform.secondary.filename || true}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary, #cbd5e1)',
              textDecoration: 'none',
              padding: '9px 14px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            <span>📦</span>
            <span>{platform.secondary.label} ({platform.secondary.size})</span>
          </a>
        )}
      </div>

      {/* Checksum Button */}
      {platform.primary?.sha256 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          fontFamily: 'monospace',
          color: 'var(--text-muted, #94a3b8)',
          marginBottom: 12,
          padding: '4px 8px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 8,
        }}>
          <span>SHA256: {platform.primary.sha256.slice(0, 14)}...</span>
          <button
            type="button"
            onClick={() => onCopy(platform.primary.sha256, platform.name)}
            style={{
              background: 'none',
              border: 'none',
              color: copiedChecksum === platform.name ? '#34d399' : 'var(--accent-cyan, #22d3ee)',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {copiedChecksum === platform.name ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      )}

      {/* Toggle Install Steps */}
      <div style={{ marginTop: 'auto' }}>
        <button
          type="button"
          onClick={() => setShowSteps(!showSteps)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-cyan, #22d3ee)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>{showSteps ? 'Hide Installation Steps ▲' : 'Installation Steps ▼'}</span>
        </button>

        {showSteps && (
          <ol style={{
            fontSize: 12,
            color: 'var(--text-secondary, #cbd5e1)',
            paddingLeft: 18,
            margin: '8px 0 0',
            lineHeight: 1.6,
          }}>
            {platform.installSteps.map((step, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{step}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

// ─── Subcomponent: Feature Box ───────────────────────────────────────────────
function FeatureBox({ icon, title, description }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 18,
      padding: '22px 20px',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.55 }}>
        {description}
      </div>
    </div>
  );
}
