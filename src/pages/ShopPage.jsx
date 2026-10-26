import React from 'react';
import { useApp } from '../context/AppContext';
import { THEMES, AVATAR_FRAMES, getLevelFromXP, getRankTitle } from '../utils/constants';

export default function ShopPage() {
  const { state, claimQuestReward, purchaseShopItem, updateProfile } = useApp();

  const profile = state?.profile || {};
  const totalXP = profile.totalXP || 0;
  const spentXP = profile.spentXP || 0;
  const availableXP = Math.max(0, totalXP - spentXP);
  const currentLevel = getLevelFromXP(totalXP);
  const currentRank = getRankTitle(currentLevel);
  const rankTitle = typeof currentRank === 'object' ? (currentRank.title || 'Beginner') : (currentRank || 'Beginner');

  const purchased = profile.purchasedItems || ['theme_midnight', 'frame_bronze'];
  const equippedTheme = profile.equippedTheme || 'midnight';
  const equippedFrame = profile.equippedFrame || 'bronze';
  const quests = state?.quests || [];

  const THEME_CATALOG = [
    { id: 'theme_midnight', name: 'Obsidian Midnight', type: 'theme', value: 'midnight', cost: 0, desc: 'Deep cosmic obsidian liquid glass with cyan specular reflections.' },
    { id: 'theme_aurora', name: 'Neon Aurora', type: 'theme', value: 'aurora', cost: 150, desc: 'Ethereal northern lights emerald & violet glowing glass.' },
    { id: 'theme_ember', name: 'Fiery Ember', type: 'theme', value: 'ember', cost: 200, desc: 'Molten crimson & amber liquid glass aesthetic.' },
    { id: 'theme_mono', name: 'Monochrome Stealth', type: 'theme', value: 'mono', cost: 100, desc: 'High-contrast black & pure titanium liquid crystal.' },
  ];

  const FRAME_CATALOG = [
    { id: 'frame_bronze', name: 'Bronze Novice', type: 'frame', value: 'bronze', cost: 0, border: '#cd7f32' },
    { id: 'frame_silver', name: 'Silver Vanguard', type: 'frame', value: 'silver', cost: 100, border: '#c0c0c0' },
    { id: 'frame_gold', name: 'Golden Champion', type: 'frame', value: 'gold', cost: 250, border: '#fbbf24' },
    { id: 'frame_shadow', name: 'Shadow Monarch', type: 'frame', value: 'shadow', cost: 400, border: '#a78bfa' },
    { id: 'frame_dragon', name: 'Dragon Conqueror', type: 'frame', value: 'dragon', cost: 750, border: '#ef4444' },
  ];

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header & Balance Banner */}
      <div
        className="glass-card liquid-glass-panel"
        style={{
          borderRadius: 28,
          padding: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          border: '1px solid rgba(34, 211, 238, 0.25)',
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(139, 92, 246, 0.08) 100%)',
        }}
      >
        <div>
          <span className="chip chip-category" style={{ fontSize: 11, marginBottom: 6 }}>
            LEVEL {currentLevel} • {String(rankTitle).toUpperCase()}
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, margin: 0 }}>
            Quests & XP Vault
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Spend available XP on cosmetics & streak shields. <b>Your player level never decreases!</b>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Available XP
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent-cyan)', textShadow: '0 0 15px rgba(34,211,238,0.4)' }}>
              💎 {availableXP.toLocaleString()}
            </div>
          </div>

          <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Streak Freezes
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-amber)' }}>
              ❄️ {profile.streakFreezes || 0}
            </div>
          </div>
        </div>
      </div>

      {/* ── Daily & Weekly Quests ─────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚔️</span> Active Bounties & Quests
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {quests.map(quest => {
            const current = quest.currentCount || 0;
            const target = quest.targetCount || 1;
            const pct = Math.min(100, Math.round((current / target) * 100));
            const isDone = current >= target;
            const isClaimed = quest.claimed && isDone;

            return (
              <div
                key={quest.id}
                className="glass-card liquid-glass-panel"
                style={{
                  borderRadius: 20,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  border: isDone && !isClaimed ? '1px solid var(--accent-emerald)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="chip" style={{ fontSize: 10, padding: '2px 6px', background: quest.type === 'weekly' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255,255,255,0.06)' }}>
                      {quest.type === 'weekly' ? '🌟 WEEKLY' : 'DAILY'}
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                      {quest.title}
                    </div>
                  </div>

                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-cyan)' }}>
                    +{quest.rewardXP} XP
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>Progress</span>
                    <span>{current} / {target} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-cyan)', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                {/* Action button */}
                {!isDone ? (
                  <button className="btn btn-sm btn-secondary" disabled style={{ fontSize: 11, opacity: 0.65 }}>
                    In Progress... ({current}/{target})
                  </button>
                ) : isClaimed ? (
                  <button className="btn btn-sm" disabled style={{ opacity: 0.5, fontSize: 11 }}>
                    ✓ Claimed
                  </button>
                ) : (
                  <button
                    className="btn btn-sm"
                    style={{ background: 'var(--accent-emerald)', color: '#000', fontWeight: 700, fontSize: 11 }}
                    onClick={() => claimQuestReward(quest)}
                  >
                    🎉 Claim +{quest.rewardXP} XP!
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── XP Shop: Themes ──────────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🎨</span> Liquid Glass Theme Packs
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {THEME_CATALOG.map(t => {
            const isPurchased = purchased.includes(t.id);
            const isEquipped = equippedTheme === t.value;

            return (
              <div
                key={t.id}
                className="glass-card liquid-glass-panel"
                style={{
                  borderRadius: 20,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  border: isEquipped ? '2px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{t.name}</div>
                  {isEquipped && (
                    <span className="chip" style={{ background: 'rgba(34, 211, 238, 0.2)', color: 'var(--accent-cyan)', fontSize: 10 }}>
                      EQUIPPED
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>
                  {t.desc}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-cyan)' }}>
                    {t.cost === 0 ? 'Free' : `${t.cost} XP`}
                  </span>

                  {isEquipped ? (
                    <button className="btn btn-sm" disabled style={{ opacity: 0.6, fontSize: 11 }}>
                      Active
                    </button>
                  ) : isPurchased ? (
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: 11 }}
                      onClick={() => updateProfile({ equippedTheme: t.value })}
                    >
                      Equip
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: 11 }}
                      onClick={() => purchaseShopItem(t)}
                    >
                      Unlock ({t.cost} XP)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── XP Shop: Avatar Frames ───────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>👑</span> Prestige Avatar Frames
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {FRAME_CATALOG.map(f => {
            const isPurchased = purchased.includes(f.id);
            const isEquipped = equippedFrame === f.value;

            return (
              <div
                key={f.id}
                className="glass-card liquid-glass-panel"
                style={{
                  borderRadius: 20,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'center',
                  border: isEquipped ? `2px solid ${f.border}` : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {/* Frame Preview */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    border: `3px solid ${f.border}`,
                    boxShadow: `0 0 16px ${f.border}66`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    background: 'rgba(255,255,255,0.04)',
                  }}
                >
                  ⚡
                </div>

                <div style={{ fontSize: 14, fontWeight: 700 }}>{f.name}</div>

                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-cyan)' }}>
                    {f.cost === 0 ? 'Free' : `${f.cost} XP`}
                  </span>

                  {isEquipped ? (
                    <button className="btn btn-sm" disabled style={{ opacity: 0.6, fontSize: 10 }}>
                      Active
                    </button>
                  ) : isPurchased ? (
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: 10 }}
                      onClick={() => updateProfile({ equippedFrame: f.value })}
                    >
                      Equip
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: 10 }}
                      onClick={() => purchaseShopItem(f)}
                    >
                      Unlock
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Streak Shields ───────────────────────────────────────────────── */}
      <div
        className="glass-card liquid-glass-panel"
        style={{
          borderRadius: 24,
          padding: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          border: '1px solid rgba(251, 191, 36, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 32 }}>❄️</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Streak Freeze Shield</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Protects your hard-earned streak if you miss a day. Current inventory: {state.profile.streakFreezes || 0}
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ padding: '10px 20px', borderRadius: 16, fontSize: 13 }}
          onClick={() => purchaseShopItem({ id: 'freeze_item', name: 'Streak Freeze', type: 'freeze', cost: 50 })}
        >
          Buy Freeze (50 XP)
        </button>
      </div>
    </div>
  );
}
