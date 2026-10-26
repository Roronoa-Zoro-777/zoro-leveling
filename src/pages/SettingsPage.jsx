import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { DEFAULT_CATEGORIES, THEMES } from '../utils/constants';
import { getStorageEstimate, requestPersistentStorage, db } from '../db/db';
import { hashPin, exportEncryptedBackup, decryptBackupData } from '../utils/crypto';
import {
  exportTasksToCSV,
  importTasksFromCSV,
  getAutoRotatingBackups,
  restoreAutoBackup,
} from '../utils/backupManager';

export default function SettingsPage() {
  const {
    state,
    updateSettings,
    updateProfile,
    exportData,
    importAndReplace,
    importAndMerge,
    restoreFromTrash,
    emptyTrash,
    resetAllData,
  } = useApp();

  const [username, setUsername] = useState(state.settings.username || 'Hero');
  const [newCategory, setNewCategory] = useState('');
  const [saved, setSaved] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ usage: 0, quota: 0, persisted: false });
  const [pendingImportData, setPendingImportData] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // App Lock PIN state
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState('');

  // Encrypted Backup state
  const [encPassword, setEncPassword] = useState('');
  const [showEncExportModal, setShowEncExportModal] = useState(false);
  const [showEncImportModal, setShowEncImportModal] = useState(false);
  const [encImportFileContent, setEncImportFileContent] = useState(null);
  const [encError, setEncError] = useState('');

  // Integrity Check state
  const [integrityReport, setIntegrityReport] = useState(null);

  const fileRef = useRef(null);
  const encFileRef = useRef(null);
  const csvFileRef = useRef(null);
  const [autoBackups, setAutoBackups] = useState([]);
  const customCategories = state.settings.customCategories || [];

  const loadAutoBackups = async () => {
    try {
      const list = await getAutoRotatingBackups();
      setAutoBackups(list);
    } catch (e) {
      console.warn('Failed to fetch rotating backups:', e);
    }
  };

  // Load storage estimates and rotating backups
  useEffect(() => {
    async function checkStorage() {
      try {
        const est = await getStorageEstimate();
        const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : false;
        setStorageInfo({
          usage: est.usage || 0,
          quota: est.quota || 0,
          persisted,
        });
      } catch (err) {
        console.error('Storage check failed:', err);
      }
    }
    checkStorage();
    loadAutoBackups();
  }, [state.tasks]);

  const saveSettings = () => {
    updateSettings({ ...state.settings, username });
    updateProfile({ ...state.profile });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addCategory = () => {
    if (!newCategory.trim() || DEFAULT_CATEGORIES.includes(newCategory) || customCategories.includes(newCategory)) return;
    updateSettings({ ...state.settings, customCategories: [...customCategories, newCategory.trim()] });
    setNewCategory('');
  };

  const removeCategory = (cat) => {
    updateSettings({ ...state.settings, customCategories: customCategories.filter(c => c !== cat) });
  };

  // Regular backup file select
  const onFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed || typeof parsed !== 'object') throw new Error('Invalid format');
        setPendingImportData(parsed);
      } catch {
        alert('Invalid JSON file. Please provide a valid ZoroLevel backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // CSV task file select
  const onCSVFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const importedTasks = importTasksFromCSV(ev.target.result);
        if (!importedTasks.length) {
          alert('No valid tasks found in the selected CSV file.');
          return;
        }
        if (window.confirm(`Found ${importedTasks.length} task(s) in CSV. Merge them into your existing task records?`)) {
          await importAndMerge({ tasks: importedTasks });
          alert(`Successfully imported ${importedTasks.length} tasks from CSV!`);
        }
      } catch (err) {
        alert('CSV Import error: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCSV = () => {
    if (!state.tasks || state.tasks.length === 0) {
      alert('No tasks available to export.');
      return;
    }
    exportTasksToCSV(state.tasks);
  };

  const handleRestoreAutoBackup = async (b) => {
    if (window.confirm(`Restore automatic snapshot from ${b.date} (${new Date(b.timestamp).toLocaleTimeString()})?\n\nThis will safely replace your current records with this local snapshot.`)) {
      const ok = await restoreAutoBackup(b.id, importAndReplace);
      if (ok) {
        alert(`Snapshot from ${b.date} restored successfully!`);
      } else {
        alert('Could not restore snapshot.');
      }
    }
  };

  // Encrypted backup file select
  const onEncFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.salt || !parsed.iv || (!parsed.ciphertext && !parsed.cipherText)) {
          throw new Error('Not an encrypted ZoroLevel file');
        }
        setEncImportFileContent(parsed);
        setShowEncImportModal(true);
      } catch (err) {
        alert('Invalid encrypted backup file. Ensure it was exported with password protection.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleEncryptedExport = async () => {
    if (!encPassword || encPassword.length < 4) {
      setEncError('Password must be at least 4 characters');
      return;
    }
    setEncError('');
    const fullData = {
      tasks: state.tasks,
      goals: state.goals,
      habits: state.habits,
      habitLogs: state.habitLogs,
      focusSessions: state.focusSessions,
      dailyReviews: state.dailyReviews,
      profile: state.profile,
      settings: state.settings,
      dayHistory: state.dayHistory,
      xpHistory: state.xpHistory,
      exportedAt: new Date().toISOString(),
    };

    const encPayload = await exportEncryptedBackup(encPassword, fullData);
    const blob = new Blob([JSON.stringify(encPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zorolevel-encrypted-backup-${state.ui.selectedDate}.zlenc`;
    a.click();
    URL.revokeObjectURL(url);
    setShowEncExportModal(false);
    setEncPassword('');
  };

  const handleEncryptedImport = async () => {
    if (!encPassword) {
      setEncError('Please enter password');
      return;
    }
    setEncError('');
    try {
      const decrypted = await decryptBackupData(encPassword, encImportFileContent);
      await importAndReplace(decrypted);
      setShowEncImportModal(false);
      setEncPassword('');
      alert('✓ Encrypted backup successfully decrypted and restored!');
    } catch (e) {
      setEncError('Decryption failed! Incorrect password.');
    }
  };

  // Set PIN handler
  const handleSavePin = async () => {
    if (pinInput.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }
    if (pinInput !== pinConfirm) {
      setPinError('PINs do not match');
      return;
    }
    const hashed = await hashPin(pinInput);
    updateSettings({
      ...state.settings,
      appLockEnabled: true,
      appLockPinHash: hashed,
    });
    setShowPinModal(false);
    setPinInput('');
    setPinConfirm('');
    setPinError('');
    alert('✓ PIN Lock configured! App will lock after inactivity.');
  };

  // Data Integrity Verification
  const runIntegrityCheck = async () => {
    try {
      const counts = await Promise.all([
        db.table('tasks').count(),
        db.table('goals').count(),
        db.table('habits').count(),
        db.table('habitLogs').count(),
        db.table('focusSessions').count(),
        db.table('dailyReviews').count(),
        db.table('trash').count(),
      ]);

      setIntegrityReport({
        status: 'Optimal',
        tasks: counts[0],
        goals: counts[1],
        habits: counts[2],
        habitLogs: counts[3],
        focusSessions: counts[4],
        dailyReviews: counts[5],
        trash: counts[6],
      });
    } catch (err) {
      setIntegrityReport({ status: 'Error', error: err.message });
    }
  };

  const confirmMerge = async () => {
    if (!pendingImportData) return;
    await importAndMerge(pendingImportData);
    setPendingImportData(null);
    alert('✓ Backup merged successfully with current data!');
  };

  const confirmReplace = async () => {
    if (!pendingImportData) return;
    if (window.confirm('⚠️ Replace All will overwrite existing tasks with this backup. Continue?')) {
      await importAndReplace(pendingImportData);
      setPendingImportData(null);
      alert('✓ Backup restored completely!');
    }
  };

  const clearAllData = async () => {
    if (window.confirm('⚠️ DANGER: Permanently wipe all IndexedDB tables?')) {
      await db.delete();
      localStorage.clear();
      window.location.reload();
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>
          Settings & Local Governance
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Fine-tune transparent liquid glass physics, vivid background presets, procedural audio, and encrypted backups.
        </p>
      </div>

      {/* ── 1. Apple Liquid Glass & Display Control Center ───────────────── */}
      <div className="glass-card liquid-glass-panel" style={{ borderRadius: 24, padding: 24 }}>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>💎</span> Apple Liquid Glass & Display
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Background Presets */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span>Background Refraction Mesh</span>
              <span style={{ color: 'var(--accent-cyan)', textTransform: 'capitalize' }}>
                {state.settings.customWallpaper ? 'Custom Wallpaper' : (state.settings.bgPreset || 'aurora')}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {[
                { id: 'aurora', label: 'Aurora', desc: 'Cyan, violet, pink, amber', gradient: 'linear-gradient(135deg, #22d3ee, #8b5cf6, #ec4899)' },
                { id: 'sunset', label: 'Sunset', desc: 'Orange, pink, purple', gradient: 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)' },
                { id: 'ocean', label: 'Ocean', desc: 'Teal, marine blue, cyan', gradient: 'linear-gradient(135deg, #06b6d4, #14b8a6, #2563eb)' },
                { id: 'midnight', label: 'Midnight', desc: 'Deep obsidian & faint blue', gradient: 'linear-gradient(135deg, #1e3a8a, #4338ca, #0f172a)' },
              ].map(preset => {
                const isActive = !state.settings.customWallpaper && (state.settings.bgPreset || 'aurora') === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => updateSettings({ ...state.settings, bgPreset: preset.id, customWallpaper: null })}
                    style={{
                      background: isActive ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                      border: isActive ? '2px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: 16,
                      padding: '12px 10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? '0 0 16px rgba(34, 211, 238, 0.3)' : 'none',
                    }}
                  >
                    <div style={{ height: 8, borderRadius: 4, background: preset.gradient }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{preset.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{preset.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Custom Wallpaper Upload (Offline IndexedDB) */}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <label className="btn btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span>🖼️ Upload Custom Wallpaper</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        updateSettings({
                          ...state.settings,
                          customWallpaper: ev.target.result,
                          bgPreset: 'custom',
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>

              {state.settings.customWallpaper && (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => updateSettings({ ...state.settings, customWallpaper: null, bgPreset: 'aurora' })}
                >
                  ✕ Clear Wallpaper
                </button>
              )}
            </div>
          </div>

          {/* Adaptive Glass Tint Color */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Glass Tint Color</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { id: 'default', label: 'Clear Crystal', color: 'rgba(255,255,255,0.8)' },
                { id: 'cyan', label: 'Azure Cyan', color: '#22d3ee' },
                { id: 'violet', label: 'Mystic Violet', color: '#8b5cf6' },
                { id: 'amber', label: 'Sunset Amber', color: '#f59e0b' },
                { id: 'emerald', label: 'Jade Emerald', color: '#34d399' },
              ].map(t => {
                const isActive = (state.settings.glassTintColor || 'default') === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => updateSettings({ ...state.settings, glassTintColor: t.id })}
                    className="btn btn-sm"
                    style={{
                      border: isActive ? `2px solid ${t.color}` : '1px solid rgba(255,255,255,0.15)',
                      boxShadow: isActive ? `0 0 12px ${t.color}` : 'none',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transparency (Opacity) Slider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              <span>Glass Fill Opacity (Clarity)</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
                {Math.round((state.settings.glassOpacity ?? 0.06) * 100)}% (Ultra-Clear)
              </span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.20"
              step="0.01"
              value={state.settings.glassOpacity ?? 0.06}
              onChange={e => updateSettings({ ...state.settings, glassOpacity: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          {/* Backdrop Blur Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              <span>Backdrop Light Blur</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>{state.settings.glassBlur ?? 10}px</span>
            </div>
            <input
              type="range"
              min="4"
              max="30"
              value={state.settings.glassBlur ?? 10}
              onChange={e => updateSettings({ ...state.settings, glassBlur: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          {/* Rim Light Brightness Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              <span>Rim Light Edge Brightness</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
                {Math.round((state.settings.glassRim ?? 0.65) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.20"
              max="0.90"
              step="0.05"
              value={state.settings.glassRim ?? 0.65}
              onChange={e => updateSettings({ ...state.settings, glassRim: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          {/* Specular Sheen Strength Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              <span>Dynamic Specular Sheen</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
                {Math.round((state.settings.glassSheen ?? 0.18) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.40"
              step="0.02"
              value={state.settings.glassSheen ?? 0.18}
              onChange={e => updateSettings({ ...state.settings, glassSheen: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          {/* Real Refraction Lensing Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Apple Refraction Effect (Lensing)</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Bends & magnifies light at borders via inline SVG displacement map (Chromium supported)
              </div>
            </div>
            <input
              type="checkbox"
              checked={state.settings.glassRefraction !== false}
              onChange={e => updateSettings({ ...state.settings, glassRefraction: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          {/* Reduce Motion Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Reduce Motion</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Freeze background drifting color orbs</div>
            </div>
            <input
              type="checkbox"
              checked={!!state.settings.reducedMotion}
              onChange={e => updateSettings({ ...state.settings, reducedMotion: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          {/* Live Apple Liquid Glass Specimen Card */}
          <div
            className="glass-card liquid-refract"
            style={{
              padding: 18,
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginTop: 6,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Live Liquid Glass Specimen
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                Notice background visible through glass with bright rim light
              </div>
            </div>
            <button className="btn btn-primary btn-sm">Hover Sheen</button>
          </div>
        </div>
      </div>

      {/* ── Custom Categories & Tags ──────────────────────────────────────── */}
      <div className="glass-card liquid-glass-panel" style={{ borderRadius: 24, padding: 22 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, color: '#ffffff' }}>
          <span>🏷️</span> Custom Categories & Tags
        </div>
        <p style={{ fontSize: 12, color: '#ffffff', opacity: 0.85, marginBottom: 16 }}>
          Manage your organization tags across Tasks, Habits, Goals, and Focus sessions.
        </p>

        {/* Existing categories list */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
            Active Categories
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DEFAULT_CATEGORIES.map(c => (
              <span
                key={c}
                className="chip"
                style={{
                  fontSize: 12,
                  padding: '5px 12px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  fontWeight: 600,
                }}
              >
                {c} <span style={{ fontSize: 10, opacity: 0.6 }}>(Default)</span>
              </span>
            ))}
            {customCategories.map(c => (
              <span
                key={c}
                className="chip"
                style={{
                  fontSize: 12,
                  padding: '5px 12px',
                  borderRadius: 12,
                  background: 'rgba(34, 211, 238, 0.15)',
                  border: '1px solid rgba(34, 211, 238, 0.4)',
                  color: '#22d3ee',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                🏷️ {c}
                <button
                  type="button"
                  onClick={() => removeCategory(c)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f87171',
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: 0,
                    lineHeight: 1,
                  }}
                  title={`Remove ${c}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Add new category input */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Add new category (e.g. Reading, Gym, Finance)..."
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }}
            style={{ color: '#ffffff', flex: 1 }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={addCategory}
            style={{ padding: '10px 18px', whiteSpace: 'nowrap', fontWeight: 700 }}
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* ── 2. Audio & Mobile Haptics ────────────────────────────────────── */}
      <div className="glass-card liquid-glass-panel" style={{ borderRadius: 24, padding: 22 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔊</span> Procedural Audio & Feedback
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Bubble Pop & Zen Bell Audio</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>100% synthesized Web Audio API (zero audio files)</div>
            </div>
            <input
              type="checkbox"
              checked={state.settings.soundEnabled ?? true}
              onChange={e => updateSettings({ ...state.settings, soundEnabled: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Mobile Haptic Vibration</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tactile click feedback on supported mobile devices</div>
            </div>
            <input
              type="checkbox"
              checked={state.settings.hapticsEnabled ?? true}
              onChange={e => updateSettings({ ...state.settings, hapticsEnabled: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-cyan)' }}
            />
          </div>
        </div>
      </div>

      {/* ── 3. App Lock & Security ───────────────────────────────────────── */}
      <div className="glass-card liquid-glass-panel" style={{ borderRadius: 24, padding: 22 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔒</span> Privacy & App Lock
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>PIN Lock Protection</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {state.settings.appLockEnabled ? 'Active (Secured via SHA-256)' : 'Disabled'}
              </div>
            </div>

            {state.settings.appLockEnabled ? (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => updateSettings({ ...state.settings, appLockEnabled: false, appLockPinHash: null })}
              >
                Disable PIN
              </button>
            ) : (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setShowPinModal(true)}
              >
                Set 4-Digit PIN
              </button>
            )}
          </div>

          {state.settings.appLockEnabled && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Auto-Lock Timeout</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Locks workspace after inactivity</div>
              </div>
              <select
                className="form-input"
                style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
                value={state.settings.autoLockMinutes || 5}
                onChange={e => updateSettings({ ...state.settings, autoLockMinutes: Number(e.target.value) })}
              >
                <option value={1}>1 Minute</option>
                <option value={5}>5 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Encrypted & Regular Backups ───────────────────────────────── */}
      <div className="glass-card liquid-glass-panel" style={{ borderRadius: 24, padding: 22 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>💾</span> Local Backup & Web Crypto AES-GCM
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={exportData}>
              📤 Export JSON Backup
            </button>
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              📥 Restore JSON Backup
            </button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={onFileSelect} />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn"
              style={{ background: 'rgba(167, 139, 250, 0.2)', border: '1px solid rgba(167,139,250,0.4)', color: 'var(--accent-violet)' }}
              onClick={() => setShowEncExportModal(true)}
            >
              🔐 Export AES-GCM Encrypted Backup
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => encFileRef.current?.click()}
            >
              🔓 Import Encrypted (.zlenc)
            </button>
            <input ref={encFileRef} type="file" accept=".zlenc,.json" style={{ display: 'none' }} onChange={onEncFileSelect} />
          </div>

          {/* CSV Export & Import */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              style={{ borderColor: 'rgba(34, 211, 238, 0.4)', color: 'var(--accent-cyan)' }}
              onClick={handleExportCSV}
            >
              📊 Export CSV (Spreadsheet)
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => csvFileRef.current?.click()}
            >
              📥 Import Tasks from CSV
            </button>
            <input ref={csvFileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={onCSVFileSelect} />
          </div>

          {/* Automatic Rotating Local Backups (7-Day rolling snapshots) */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: 14,
            marginTop: 4,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  🔄 Automatic Rotating Local Snapshots (7-Day Rolling)
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Stored offline in permanent device storage. Never sent to cloud.
                </div>
              </div>
              <button
                className="btn btn-sm btn-secondary"
                style={{ fontSize: 11, padding: '4px 10px' }}
                onClick={loadAutoBackups}
              >
                Refresh Snapshots
              </button>
            </div>

            {autoBackups.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                No automated snapshots saved yet. Snapshots are recorded daily upon app activity.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {autoBackups.map(b => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>
                        📅 Snapshot for {b.date}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {new Date(b.timestamp).toLocaleString()} • {b.data?.tasks?.length || 0} tasks
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: 11, padding: '3px 10px' }}
                      onClick={() => handleRestoreAutoBackup(b)}
                    >
                      Restore Snapshot
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Import Banner */}
          {pendingImportData && (
            <div style={{ background: 'rgba(34, 211, 238, 0.08)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 14, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                Detected {pendingImportData.tasks?.length || 0} tasks in backup. Restore method:
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-sm btn-primary" onClick={confirmMerge}>
                  Merge (Preserve existing)
                </button>
                <button className="btn btn-sm btn-danger" onClick={confirmReplace}>
                  Replace All
                </button>
                <button className="btn btn-sm" onClick={() => setPendingImportData(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. Recycle Bin (Trash Manager) ───────────────────────────────── */}
      <div className="glass-card liquid-glass-panel" style={{ borderRadius: 24, padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🗑️</span> Recycle Bin ({state.trash.length})
          </div>
          {state.trash.length > 0 && (
            <button className="btn btn-sm btn-danger" onClick={emptyTrash}>
              Empty Bin
            </button>
          )}
        </div>

        {state.trash.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Recycle bin is empty. Deleted tasks are held here for 30 days.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {state.trash.slice(0, 5).map(t => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Deleted: {t.deletedAt ? new Date(t.deletedAt).toLocaleDateString() : 'Recently'}
                  </div>
                </div>

                <button
                  className="btn btn-sm btn-primary"
                  style={{ fontSize: 11, padding: '4px 10px' }}
                  onClick={() => restoreFromTrash(t)}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 6. Data Integrity Check & Diagnostics ────────────────────────── */}
      <div className="glass-card liquid-glass-panel" style={{ borderRadius: 24, padding: 22 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🛠️</span> IndexedDB Health & Diagnostics
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Storage Schema</span>
            <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>Dexie.js v3 (Migrated)</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Disk Footprint</span>
            <span>{formatBytes(storageInfo.usage)}</span>
          </div>

          <button
            className="btn btn-secondary"
            style={{ width: 'fit-content', marginTop: 8 }}
            onClick={runIntegrityCheck}
          >
            Run Integrity Check
          </button>

          {integrityReport && (
            <div style={{ marginTop: 8, padding: 12, borderRadius: 12, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 4 }}>
                ✓ Database Integrity Verified
              </div>
              <div>Tasks: {integrityReport.tasks} | Habits: {integrityReport.habits} | Logs: {integrityReport.habitLogs} | Focus: {integrityReport.focusSessions}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── 7. Danger Zone: Reset All Data & Start From Zero ───────────────── */}
      <div
        className="glass-card liquid-glass-panel"
        style={{
          borderRadius: 24,
          padding: 24,
          border: '1px solid rgba(244, 63, 94, 0.45)',
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(255, 255, 255, 0.02) 50%, rgba(244, 63, 94, 0.04) 100%)',
          boxShadow: 'var(--glass-inner-light), 0 10px 36px rgba(244, 63, 94, 0.15)',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: '#fecdd3' }}>
          <span>⚠️</span> Danger Zone: Reset to Start
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Delete all tasks, subtasks, habits, completion history, focus logs, and reset your level back to Level 1 (0 XP) so you can start completely from scratch.
        </p>

        <button
          className="btn btn-danger"
          style={{
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.28) 0%, rgba(225, 29, 72, 0.28) 100%)',
            borderColor: 'rgba(244, 63, 94, 0.65)',
            color: '#ffffff',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 0 20px rgba(244, 63, 94, 0.25)',
            padding: '10px 22px',
            fontSize: 13,
            fontWeight: 700,
          }}
          onClick={() => setShowResetModal(true)}
        >
          🗑️ Delete Tasks, History & Reset to Start
        </button>
      </div>

      {/* ── Reset Confirmation Modal ─────────────────────────────────────── */}
      {showResetModal && (
        <div className="modal-backdrop" onClick={() => setShowResetModal(false)}>
          <div
            className="modal-glass-card liquid-glass-panel"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 440,
              border: '1px solid rgba(244, 63, 94, 0.55)',
              boxShadow: 'var(--glass-inner-light), 0 20px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(244, 63, 94, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>⚠️</span>
              <h2 style={{ fontSize: 19, fontWeight: 800, color: '#fecdd3', margin: 0 }}>
                Reset Everything to Start?
              </h2>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
              This will permanently wipe your active productivity data and reset your leveling progress:
            </p>

            <div style={{
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: 12,
              lineHeight: 1.8,
              color: '#ffe4e6',
              marginBottom: 18,
            }}>
              <div>❌ Delete all active, pending and completed tasks</div>
              <div>❌ Delete all day history, streaks & heatmap entries</div>
              <div>❌ Delete all habits, focus sessions & reviews</div>
              <div>❌ Empty the recycle bin</div>
              <div>🔄 Reset Level back to <strong>Level 1 (0 XP)</strong></div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                style={{
                  background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.6) 0%, rgba(225, 29, 72, 0.6) 100%)',
                  borderColor: 'rgba(244, 63, 94, 0.9)',
                  color: '#ffffff',
                  fontWeight: 700,
                }}
                onClick={async () => {
                  setShowResetModal(false);
                  await resetAllData();
                }}
              >
                Yes, Delete Everything & Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Set PIN Modal ────────────────────────────────────────────────── */}
      {showPinModal && (
        <div className="modal-backdrop" onClick={() => setShowPinModal(false)}>
          <div className="modal-glass-card liquid-glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Set 4-Digit App PIN</h2>
            {pinError && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 8 }}>{pinError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                className="form-input"
                type="password"
                maxLength={4}
                placeholder="Enter 4-digit PIN"
                value={pinInput}
                onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
              <input
                className="form-input"
                type="password"
                maxLength={4}
                placeholder="Confirm 4-digit PIN"
                value={pinConfirm}
                onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ''))}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-secondary" onClick={() => setShowPinModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSavePin}>Save PIN</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Encrypted Export Modal ───────────────────────────────────────── */}
      {showEncExportModal && (
        <div className="modal-backdrop" onClick={() => setShowEncExportModal(false)}>
          <div className="modal-glass-card liquid-glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Encrypt Backup</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Protect your backup with a password using military-grade PBKDF2 + AES-GCM (256-bit).
            </p>
            {encError && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 8 }}>{encError}</div>}
            <input
              className="form-input"
              type="password"
              placeholder="Enter encryption passphrase"
              value={encPassword}
              onChange={e => setEncPassword(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowEncExportModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEncryptedExport}>Export Encrypted</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Encrypted Import Modal ───────────────────────────────────────── */}
      {showEncImportModal && (
        <div className="modal-backdrop" onClick={() => setShowEncImportModal(false)}>
          <div className="modal-glass-card liquid-glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Decrypt Backup</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Enter the password used when creating this encrypted backup file.
            </p>
            {encError && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 8 }}>{encError}</div>}
            <input
              className="form-input"
              type="password"
              placeholder="Enter decryption password"
              value={encPassword}
              onChange={e => setEncPassword(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowEncImportModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEncryptedImport}>Decrypt & Restore</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
