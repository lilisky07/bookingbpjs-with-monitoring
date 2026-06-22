import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

/* ─── GLOBAL STYLES (Apple-inspired, eye-catching) ──────────────── */
const adminStyle = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.13); border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.22); }

  /* ── KEYFRAMES ─────────────────────────────────────────────── */
  @keyframes fadeIn    { from{opacity:0}                              to{opacity:1} }
  @keyframes slideUp   { from{transform:translateY(20px);opacity:0}  to{transform:translateY(0);opacity:1} }
  @keyframes slideDown { from{transform:translateY(-10px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes scaleIn   { from{transform:scale(0.94);opacity:0}       to{transform:scale(1);opacity:1} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes toastIn   { from{transform:translateX(24px) scale(0.95);opacity:0} to{transform:translateX(0) scale(1);opacity:1} }
  @keyframes pulseGreen{ 0%,100%{box-shadow:0 0 0 0 rgba(52,199,89,0)} 50%{box-shadow:0 0 0 6px rgba(52,199,89,0.2)} }
  @keyframes pulseBlue { 0%,100%{box-shadow:0 0 0 0 rgba(0,122,255,0)} 50%{box-shadow:0 0 0 6px rgba(0,122,255,0.18)} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  @keyframes glow      { 0%,100%{opacity:0.6} 50%{opacity:1} }
  @keyframes statPop   { 0%{transform:translateY(12px) scale(0.96);opacity:0} 60%{transform:translateY(-3px) scale(1.01)} 100%{transform:translateY(0) scale(1);opacity:1} }
  @keyframes ripple    { to{transform:scale(2.5);opacity:0} }

  /* ── CARDS ─────────────────────────────────────────────────── */
  .aw-card {
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(28px) saturate(200%);
    -webkit-backdrop-filter: blur(28px) saturate(200%);
    border-radius: 20px;
    border: 0.5px solid rgba(255,255,255,0.95);
    box-shadow:
      0 2px 1px rgba(255,255,255,0.7) inset,
      0 -1px 1px rgba(0,0,0,0.04) inset,
      0 4px 24px rgba(0,0,0,0.06),
      0 0 0 0.5px rgba(0,0,0,0.05);
    transition:
      transform 0.3s cubic-bezier(0.34,1.56,0.64,1),
      box-shadow 0.3s ease,
      border-color 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  .aw-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
    pointer-events: none;
  }
  .aw-card.hoverable {
    cursor: pointer;
  }
  .aw-card.hoverable:hover {
    transform: translateY(-4px) scale(1.012);
    box-shadow:
      0 2px 1px rgba(255,255,255,0.7) inset,
      0 -1px 1px rgba(0,0,0,0.04) inset,
      0 16px 48px rgba(0,0,0,0.1),
      0 4px 12px rgba(0,0,0,0.06),
      0 0 0 0.5px rgba(0,122,255,0.18);
    border-color: rgba(0,122,255,0.15);
  }
  .aw-card.hoverable:active {
    transform: translateY(-1px) scale(1.004);
    transition-duration: 0.1s;
  }

  /* ── STAT CARD ──────────────────────────────────────────────── */
  .stat-card {
    animation: statPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    position: relative;
    overflow: hidden;
  }
  .stat-card::after {
    content: '';
    position: absolute;
    top: -30%; right: -10%;
    width: 80px; height: 80px;
    border-radius: 50%;
    background: var(--stat-color, #007AFF);
    opacity: 0.06;
    filter: blur(20px);
    pointer-events: none;
  }
  .stat-card:hover {
    transform: translateY(-5px) scale(1.025) !important;
    box-shadow:
      0 2px 1px rgba(255,255,255,0.7) inset,
      0 20px 56px rgba(0,0,0,0.11),
      0 6px 16px rgba(0,0,0,0.06),
      0 0 0 0.5px var(--stat-color, #007AFF) !important;
  }

  /* ── BUTTONS ────────────────────────────────────────────────── */
  .aw-btn {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
    font-size: 13px; font-weight: 500;
    border-radius: 11px;
    border: none; cursor: pointer;
    letter-spacing: -0.1px;
    position: relative; overflow: hidden;
    -webkit-font-smoothing: antialiased;
    transition:
      transform 0.16s cubic-bezier(0.34,1.56,0.64,1),
      box-shadow 0.2s ease,
      background 0.15s ease,
      opacity 0.15s ease;
  }
  .aw-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 60%);
    border-radius: inherit;
    pointer-events: none;
  }
  .aw-btn:hover  { transform: scale(1.05) translateY(-1px); }
  .aw-btn:active { transform: scale(0.94); transition-duration: 0.08s; }
  .aw-btn:disabled { opacity: 0.38; cursor: not-allowed; transform: none !important; }

  .aw-btn-primary {
    background: linear-gradient(180deg, #2196FF 0%, #007AFF 100%);
    color: #fff; padding: 8px 18px;
    box-shadow: 0 2px 8px rgba(0,122,255,0.28), 0 1px 2px rgba(0,122,255,0.2);
  }
  .aw-btn-primary:hover {
    background: linear-gradient(180deg, #3DAAFF 0%, #1A8FFF 100%);
    box-shadow: 0 6px 20px rgba(0,122,255,0.38), 0 2px 6px rgba(0,122,255,0.25);
  }

  .aw-btn-green {
    background: linear-gradient(180deg, #4CD964 0%, #34C759 100%);
    color: #fff; padding: 8px 18px;
    box-shadow: 0 2px 8px rgba(52,199,89,0.3), 0 1px 2px rgba(52,199,89,0.2);
  }
  .aw-btn-green:hover {
    background: linear-gradient(180deg, #60E070 0%, #48D868 100%);
    box-shadow: 0 6px 20px rgba(52,199,89,0.4), 0 2px 6px rgba(52,199,89,0.25);
  }

  .aw-btn-red {
    background: linear-gradient(180deg, #FF5247 0%, #FF3B30 100%);
    color: #fff; padding: 8px 18px;
    box-shadow: 0 2px 8px rgba(255,59,48,0.3), 0 1px 2px rgba(255,59,48,0.2);
  }
  .aw-btn-red:hover {
    box-shadow: 0 6px 20px rgba(255,59,48,0.4);
  }

  .aw-btn-ghost {
    background: rgba(120,120,128,0.1);
    color: #1D1D1F; padding: 8px 16px;
    border: 0.5px solid rgba(0,0,0,0.1);
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .aw-btn-ghost:hover {
    background: rgba(120,120,128,0.17);
    box-shadow: 0 3px 10px rgba(0,0,0,0.09);
    border-color: rgba(0,0,0,0.14);
  }

  .aw-btn-sm { padding: 6px 14px; font-size: 12px; }

  /* ── INPUTS ─────────────────────────────────────────────────── */
  .aw-input {
    font-family: inherit; font-size: 14px;
    background: rgba(120,120,128,0.07);
    border: 1px solid rgba(0,0,0,0.09);
    border-radius: 11px; padding: 9px 13px;
    outline: none; width: 100%; color: #1D1D1F;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .aw-input:hover {
    border-color: rgba(0,0,0,0.16);
    background: rgba(120,120,128,0.09);
  }
  .aw-input:focus {
    border-color: #007AFF;
    box-shadow: 0 0 0 3.5px rgba(0,122,255,0.14);
    background: rgba(255,255,255,0.98);
  }
  .aw-input::placeholder { color: rgba(60,60,67,0.38); }

  .aw-label {
    font-size: 11px; font-weight: 600;
    color: rgba(60,60,67,0.65);
    margin-bottom: 5px; display: block;
    text-transform: uppercase; letter-spacing: 0.35px;
  }

  /* ── BADGES ─────────────────────────────────────────────────── */
  .aw-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 600;
    padding: 3px 9px; border-radius: 99px;
    letter-spacing: 0.1px;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .aw-badge:hover { transform: scale(1.06); }
  .badge-green  { background: rgba(52,199,89,0.13);  color: #1a7a35; box-shadow: 0 1px 4px rgba(52,199,89,0.15); }
  .badge-orange { background: rgba(255,149,0,0.13);  color: #b25000; box-shadow: 0 1px 4px rgba(255,149,0,0.15); }
  .badge-red    { background: rgba(255,59,48,0.13);  color: #c0160c; box-shadow: 0 1px 4px rgba(255,59,48,0.15); }
  .badge-blue   { background: rgba(0,122,255,0.11);  color: #0058cc; box-shadow: 0 1px 4px rgba(0,122,255,0.12); }
  .badge-gray   { background: rgba(120,120,128,0.12);color: #5a5a63; }
  .badge-purple { background: rgba(175,82,222,0.13); color: #6e1f9c; box-shadow: 0 1px 4px rgba(175,82,222,0.15); }

  /* ── TABS ───────────────────────────────────────────────────── */
  .aw-tab {
    font-size: 13px; font-weight: 500; padding: 7px 16px;
    border-radius: 10px; cursor: pointer;
    color: rgba(60,60,67,0.65); white-space: nowrap;
    border: none; background: transparent;
    transition: color 0.18s, background 0.18s, transform 0.18s, box-shadow 0.18s;
    position: relative;
  }
  .aw-tab.active {
    background: #fff; color: #007AFF; font-weight: 600;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1), 0 0 0 0.5px rgba(0,0,0,0.07);
  }
  .aw-tab:hover:not(.active) {
    color: #1D1D1F;
    background: rgba(120,120,128,0.08);
    transform: translateY(-1px);
  }
  .aw-tab:active { transform: scale(0.96); }

  /* ── TABLES ─────────────────────────────────────────────────── */
  .aw-table { width: 100%; border-collapse: collapse; }
  .aw-table th {
    font-size: 11px; font-weight: 600; color: rgba(60,60,67,0.5);
    text-transform: uppercase; letter-spacing: 0.45px;
    padding: 10px 14px; text-align: left;
    border-bottom: 0.5px solid rgba(0,0,0,0.07);
    background: rgba(248,248,248,0.7);
  }
  .aw-table td {
    font-size: 13px; color: #1D1D1F; padding: 12px 14px;
    border-bottom: 0.5px solid rgba(0,0,0,0.045);
    transition: background 0.15s;
  }
  .aw-table tr { transition: background 0.15s; }
  .aw-table tbody tr:hover td {
    background: rgba(0,122,255,0.035);
  }
  .aw-table tr:last-child td { border-bottom: none; }
  .aw-table tr.row-det td { background: rgba(255,59,48,0.04); }
  .aw-table tr.row-pas td { background: rgba(255,149,0,0.04); }
  .aw-table tr.row-pro td { background: rgba(52,199,89,0.04); }
  .aw-table tr.row-det:hover td { background: rgba(255,59,48,0.08) !important; }
  .aw-table tr.row-pas:hover td { background: rgba(255,149,0,0.08) !important; }
  .aw-table tr.row-pro:hover td { background: rgba(52,199,89,0.08) !important; }

  /* ── STATUS DOTS ────────────────────────────────────────────── */
  .status-dot {
    width: 7px; height: 7px; border-radius: 50%;
    display: inline-block; flex-shrink: 0;
  }
  .dot-green  { background: #34C759; animation: pulseGreen 2.2s infinite; }
  .dot-orange { background: #FF9500; }
  .dot-red    { background: #FF3B30; }
  .dot-gray   { background: #8E8E93; }

  /* ── SKELETON ───────────────────────────────────────────────── */
  .skeleton {
    background: linear-gradient(90deg,
      rgba(0,0,0,0.05) 0%,
      rgba(0,0,0,0.09) 40%,
      rgba(0,0,0,0.05) 80%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }

  /* ── TOAST ──────────────────────────────────────────────────── */
  .toast-wrap {
    position: fixed; bottom: 28px; right: 28px; z-index: 9999;
    display: flex; flex-direction: column; gap: 8px;
    pointer-events: none;
  }
  .toast {
    animation: toastIn 0.38s cubic-bezier(0.34,1.56,0.64,1) both;
    backdrop-filter: blur(24px) saturate(200%);
    -webkit-backdrop-filter: blur(24px) saturate(200%);
    border-radius: 16px; padding: 13px 18px;
    font-size: 13px; font-weight: 500;
    pointer-events: auto;
    border: 0.5px solid rgba(255,255,255,0.5);
    box-shadow: 0 12px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1);
    display: flex; align-items: center; gap: 9px;
    min-width: 240px; max-width: 340px;
  }
  .toast-success { background: rgba(47,185,80,0.93);  color: #fff; }
  .toast-error   { background: rgba(242,54,44,0.93);  color: #fff; }
  .toast-info    { background: rgba(0,118,245,0.93);  color: #fff; }

  /* ── SECTION ENTER ──────────────────────────────────────────── */
  .section-enter { animation: slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }

  /* ── TOGGLE ─────────────────────────────────────────────────── */
  .toggle-track {
    width: 40px; height: 24px; border-radius: 12px;
    position: relative; cursor: pointer;
    transition: background 0.25s, box-shadow 0.25s;
    flex-shrink: 0;
  }
  .toggle-track:hover { box-shadow: 0 0 0 4px rgba(52,199,89,0.15); }
  .toggle-thumb {
    position: absolute; top: 3px; left: 3px;
    width: 18px; height: 18px; border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 5px rgba(0,0,0,0.26), 0 0 1px rgba(0,0,0,0.1);
    transition: left 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
  }
  .toggle-on  { background: linear-gradient(135deg, #4CD964, #34C759); }
  .toggle-on .toggle-thumb  { left: 19px; }
  .toggle-off { background: rgba(120,120,128,0.24); }

  /* ── NPS GAUGE ──────────────────────────────────────────────── */
  .nps-gauge-track {
    height: 7px; border-radius: 99px;
    background: rgba(0,0,0,0.07); overflow: hidden;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.06);
  }
  .nps-gauge-fill {
    height: 100%; border-radius: 99px;
    transition: width 0.8s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  /* ── PING RESULT ────────────────────────────────────────────── */
  .ping-ok  { background:linear-gradient(135deg,rgba(52,199,89,0.12),rgba(52,199,89,0.06)); color:#1a7a35; border:0.5px solid rgba(52,199,89,0.28); }
  .ping-err { background:linear-gradient(135deg,rgba(255,59,48,0.12),rgba(255,59,48,0.06)); color:#c0160c; border:0.5px solid rgba(255,59,48,0.28); }

  /* ── TRIGGER CARDS hover glow ───────────────────────────────── */
  .trigger-card { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease; cursor:default; }
  .trigger-card:hover {
    transform: translateY(-5px) scale(1.015);
    box-shadow:
      0 2px 1px rgba(255,255,255,0.7) inset,
      0 20px 52px rgba(0,0,0,0.1),
      0 6px 14px rgba(0,0,0,0.06),
      0 0 0 0.5px var(--glow-color, rgba(0,122,255,0.2));
  }

  /* ── SESSION TABLE ROW ──────────────────────────────────────── */
  .session-row { transition: background 0.15s, transform 0.15s; }
  .session-row:hover { background: rgba(0,122,255,0.03); }

  /* ── ICON ORBS ──────────────────────────────────────────────── */
  .icon-orb {
    display: flex; align-items: center; justify-content: center;
    border-radius: 13px; flex-shrink: 0;
    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
  }
  .aw-card.hoverable:hover .icon-orb,
  .trigger-card:hover .icon-orb {
    transform: scale(1.12) rotate(-4deg);
    box-shadow: 0 4px 14px var(--orb-shadow, rgba(0,122,255,0.25));
  }

  /* ── HEADER PILL ────────────────────────────────────────────── */
  .header-status-pill {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .header-status-pill:hover {
    transform: scale(1.04);
    box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  }
`;

/* ─── HELPERS ───────────────────────────────────────────────────── */
const fmt = (n) => String(n || '').replace(/(\d{2})(\d+)/, '+$1 $2');

/* ─── TOAST ─────────────────────────────────────────────────────── */
function ToastContainer({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ─── TOGGLE ─────────────────────────────────────────────────────── */
function Toggle({ on, onChange }) {
  return (
    <div
      className={`toggle-track ${on ? 'toggle-on' : 'toggle-off'}`}
      onClick={() => onChange(!on)}
    >
      <div className="toggle-thumb" />
    </div>
  );
}

/* ─── STAT CARD ──────────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, color = '#007AFF', loading, delay = 0 }) {
  return (
    <div
      className="aw-card stat-card hoverable"
      style={{
        padding: '20px 22px', flex: 1, minWidth: 160,
        '--stat-color': color,
        animationDelay: delay + 'ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
        <div
          className="icon-orb"
          style={{
            width: 38, height: 38,
            background: `linear-gradient(135deg, ${color}22, ${color}11)`,
            fontSize: 18,
            boxShadow: `0 2px 8px ${color}22`,
            '--orb-shadow': color + '40',
          }}
        >{icon}</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(60,60,67,0.55)', textTransform: 'uppercase', letterSpacing: '0.35px' }}>{label}</span>
      </div>
      {loading
        ? <div className="skeleton" style={{ height: 30, width: '60%', marginBottom: 6 }} />
        : <div style={{ fontSize: 28, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.8px', lineHeight: 1 }}>{value}</div>
      }
      {sub && <div style={{ fontSize: 11, color: 'rgba(60,60,67,0.45)', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

/* ─── NPS MINI DONUT (pure CSS/SVG, no lib needed) ──────────────── */
function NpsDonut({ promoters = 0, passives = 0, detractors = 0 }) {
  const total = promoters + passives + detractors || 1;
  const r = 44, cx = 50, cy = 50, stroke = 10;
  const circ = 2 * Math.PI * r;
  const pctPro = promoters / total;
  const pctPas = passives  / total;
  const pctDet = detractors / total;
  const dashPro = circ * pctPro;
  const dashPas = circ * pctPas;
  const dashDet = circ * pctDet;
  const offPro = 0;
  const offPas = circ - dashPro;
  const offDet = circ - dashPro - dashPas;
  return (
    <svg viewBox="0 0 100 100" width="100" height="100" style={{ transform:'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
      {detractors > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FF3B30"
          strokeWidth={stroke} strokeDasharray={`${dashDet} ${circ}`}
          strokeDashoffset={-offDet} strokeLinecap="round" />
      )}
      {passives > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FF9500"
          strokeWidth={stroke} strokeDasharray={`${dashPas} ${circ}`}
          strokeDashoffset={-offPas} strokeLinecap="round" />
      )}
      {promoters > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#34C759"
          strokeWidth={stroke} strokeDasharray={`${dashPro} ${circ}`}
          strokeDashoffset={-offPro} strokeLinecap="round" />
      )}
    </svg>
  );
}

/* ─── TAB NPS LAPORAN ────────────────────────────────────────────── */
function NpsLaporan({ toast }) {
  const [dari,          setDari]          = useState('');
  const [sampai,        setSampai]        = useState('');
  const [loading,       setLoading]       = useState(false);
  const [data,          setData]          = useState(null);
  const [selectedBulan, setSelectedBulan] = useState(null); // 'YYYY-MM' atau null

  // Default range: 30 hari terakhir
  useEffect(() => {
    const now  = new Date();
    const ago  = new Date(); ago.setDate(ago.getDate() - 30);
    setSampai(now.toISOString().split('T')[0]);
    setDari(ago.toISOString().split('T')[0]);
  }, []);

  // Klik tombol bulan → set dari/sampai ke awal-akhir bulan itu lalu fetch
  const pilihBulan = useCallback((ym) => {
    const [y, m] = ym.split('-').map(Number);
    const awal   = new Date(y, m - 1, 1);
    const akhir  = new Date(y, m, 0);           // hari terakhir bulan
    const fmt    = d => d.toISOString().split('T')[0];
    setDari(fmt(awal));
    setSampai(fmt(akhir));
    setSelectedBulan(ym);
  }, []);

  // Reset selectedBulan kalau user edit manual input tanggal
  const handleDariChange  = (val) => { setDari(val);   setSelectedBulan(null); };
  const handleSampaiChange= (val) => { setSampai(val); setSelectedBulan(null); };

  const fetchLaporan = useCallback(async () => {
    if (!dari || !sampai) { toast('Pilih rentang tanggal terlebih dahulu', 'error'); return; }
    setLoading(true);
    setData(null);
    try {
      const r = await axios.get('/api/nps/laporan', { params: { dari, sampai } });
      setData(r.data);
    } catch (e) {
      toast(e.response?.data?.message ?? 'Gagal mengambil data NPS', 'error');
    } finally {
      setLoading(false);
    }
  }, [dari, sampai, toast]);

  // Auto-fetch saat selectedBulan berubah (setelah dari/sampai terupdate)
  useEffect(() => {
    if (selectedBulan && dari && sampai) fetchLaporan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBulan]);

  /* ── Export PDF (pakai print CSS) ── */
  const handleExportPDF = () => {
    if (!data) { toast('Ambil data dahulu', 'error'); return; }
    const k = data.konklusi;
    const p = data.periode;
    const rows = (data.data || []).map(d => `
      <tr style="background:${d.segmen==='detractor'?'#fff0ef':d.segmen==='passive'?'#fff8ed':'#f0faf2'}">
        <td>${d.nm_pasien||'-'}</td>
        <td>${d.nm_poli||'-'}</td>
        <td>${d.jenis_rawat||'-'}</td>
        <td style="text-align:center;font-weight:600">${d.skor??'-'}</td>
        <td style="text-align:center">${d.segmen==='promoter'?'🟢 Promoter':d.segmen==='passive'?'🟡 Passive':'🔴 Detractor'}</td>
        <td style="font-size:11px">${(d.komentar||'-').substring(0,80)}</td>
        <td style="text-align:center">${d.sudah_direspons_cs?'✅ Ya':'❌ Belum'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Laporan NPS ${p.dari} s/d ${p.sampai}</title>
    <style>
      body{font-family:-apple-system,sans-serif;padding:28px;color:#1D1D1F;font-size:13px}
      h1{font-size:20px;font-weight:700;margin-bottom:4px}
      .sub{color:#666;font-size:12px;margin-bottom:20px}
      .summary{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
      .s-box{border:1px solid #e5e5e5;border-radius:10px;padding:12px 16px;min-width:110px}
      .s-lbl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}
      .s-val{font-size:20px;font-weight:700}
      table{width:100%;border-collapse:collapse}
      th{background:#f5f5f7;font-size:10px;text-transform:uppercase;letter-spacing:.4px;
         color:#666;padding:8px 10px;text-align:left;border-bottom:1px solid #e5e5e5}
      td{padding:8px 10px;border-bottom:0.5px solid #f0f0f0;font-size:12px}
      @media print{body{padding:0}}
    </style></head><body>
    <h1>📊 Laporan NPS — RSU GMC</h1>
    <div class="sub">Periode ${p.dari} s/d ${p.sampai} &nbsp;·&nbsp; Dicetak ${new Date().toLocaleString('id-ID')}</div>
    <div class="summary">
      <div class="s-box"><div class="s-lbl">NPS Score</div><div class="s-val" style="color:${(k.nps_score??0)>=50?'#34C759':(k.nps_score??0)>=0?'#FF9500':'#FF3B30'}">${k.nps_score??'-'}</div></div>
      <div class="s-box"><div class="s-lbl">Rata-rata</div><div class="s-val">${k.rata_rata_skor??'-'}</div></div>
      <div class="s-box"><div class="s-lbl">Total respons</div><div class="s-val">${k.total_respons}</div></div>
      <div class="s-box"><div class="s-lbl">Response rate</div><div class="s-val">${k.response_rate}</div></div>
      <div class="s-box"><div class="s-lbl">🟢 Promoter</div><div class="s-val" style="color:#34C759">${k.promoters}</div></div>
      <div class="s-box"><div class="s-lbl">🟡 Passive</div><div class="s-val" style="color:#FF9500">${k.passives}</div></div>
      <div class="s-box"><div class="s-lbl">🔴 Detractor</div><div class="s-val" style="color:#FF3B30">${k.detractors}</div></div>
    </div>
    <table><thead><tr>
      <th>Nama Pasien</th><th>Unit</th><th>Jenis Rawat</th>
      <th>Skor</th><th>Segmen</th><th>Komentar</th><th>Direspons CS?</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <script>window.onload=()=>{window.print()}<\/script></body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  };

  /* ── Export CSV (untuk Google Sheets) ── */
  const handleExportCSV = () => {
    if (!data) { toast('Ambil data dahulu', 'error'); return; }
    const k = data.konklusi;
    const p = data.periode;
    const lines = [
      ['LAPORAN NPS RSU GMC'],
      [`Periode,${p.dari} s/d ${p.sampai}`],
      [`Dicetak,${new Date().toLocaleString('id-ID')}`],
      [],
      ['RINGKASAN'],
      ['NPS Score', k.nps_score ?? '-'],
      ['Rata-rata skor', k.rata_rata_skor ?? '-'],
      ['Total kirim', k.total_kirim],
      ['Total respons', k.total_respons],
      ['Response rate', k.response_rate],
      ['Promoters', k.promoters],
      ['Passives', k.passives],
      ['Detractors', k.detractors],
      [],
      ['DETAIL PASIEN'],
      ['Nama Pasien','Unit Pelayanan','Jenis Rawat','Skor','Segmen','Komentar','Waktu Skor','Direspons CS?'],
      ...(data.data || []).map(d => [
        d.nm_pasien||'', d.nm_poli||'', d.jenis_rawat||'',
        d.skor??'', d.segmen||'', d.komentar||'',
        d.skor_at||'', d.sudah_direspons_cs?'Ya':'Belum',
      ]),
    ];
    const csv = lines.map(r =>
      Array.isArray(r) ? r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',') : r
    ).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `laporan-nps-${p.dari}-${p.sampai}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('File CSV berhasil diunduh — buka di Google Sheets via File > Import');
  };

  const k = data?.konklusi;
  const npsScore = k ? (k.nps_score ?? null) : null;
  const npsColor = npsScore === null ? '#8E8E93' : npsScore >= 50 ? '#34C759' : npsScore >= 0 ? '#FF9500' : '#FF3B30';
  const gaugeWidth = npsScore === null ? 0 : Math.max(0, Math.min(100, (npsScore + 100) / 2));

  return (
    <div className="section-enter" style={{ display:'grid', gap:16 }}>

      {/* ── Filter tanggal ── */}
      <div className="aw-card" style={{ padding:20 }}>

        {/* Baris tombol bulan */}
        {(() => {
          const now    = new Date();
          const bulanList = [];
          for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            const label = d.toLocaleDateString('id-ID', { month:'short', year:'2-digit' });
            bulanList.push({ ym, label });
          }
          return (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'rgba(60,60,67,0.45)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:8 }}>
                Pilih Bulan
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {bulanList.map(({ ym, label }) => {
                  const isActive = selectedBulan === ym;
                  return (
                    <button
                      key={ym}
                      onClick={() => pilihBulan(ym)}
                      disabled={loading}
                      style={{
                        padding:'5px 11px',
                        borderRadius:8,
                        border: isActive ? '1.5px solid #007AFF' : '1px solid rgba(0,0,0,0.12)',
                        background: isActive ? '#007AFF' : 'rgba(0,0,0,0.03)',
                        color: isActive ? '#fff' : '#1D1D1F',
                        fontSize:12,
                        fontWeight: isActive ? 600 : 400,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1,
                        transition:'all 0.15s ease',
                        letterSpacing:'-0.1px',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Divider */}
        <div style={{ height:'0.5px', background:'rgba(0,0,0,0.07)', margin:'2px 0 14px' }} />

        <div style={{ display:'flex', alignItems:'flex-end', gap:12, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:140 }}>
            <label className="aw-label">Dari tanggal</label>
            <input type="date" className="aw-input" value={dari} onChange={e => handleDariChange(e.target.value)} />
          </div>
          <div style={{ flex:1, minWidth:140 }}>
            <label className="aw-label">Sampai tanggal</label>
            <input type="date" className="aw-input" value={sampai} onChange={e => handleSampaiChange(e.target.value)} />
          </div>
          <button
            className="aw-btn aw-btn-primary"
            onClick={fetchLaporan}
            disabled={loading}
            style={{ flexShrink:0, height:38 }}
          >
            {loading
              ? <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} />
                  Memuat…
                </span>
              : '🔍 Tampilkan'
            }
          </button>
          {data && (
            <>
              <button className="aw-btn aw-btn-ghost aw-btn-sm" onClick={handleExportPDF} style={{ flexShrink:0, height:38 }}>
                📄 Export PDF
              </button>
              <button className="aw-btn aw-btn-ghost aw-btn-sm" onClick={handleExportCSV} style={{ flexShrink:0, height:38 }}>
                📊 Export CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="aw-card" style={{ padding:20 }}>
              <div className="skeleton" style={{ height:14, width:'50%', marginBottom:10 }} />
              <div className="skeleton" style={{ height:28, width:'70%' }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Dashboard NPS ── */}
      {data && !loading && (
        <>
          {/* Baris atas: NPS score besar + ringkasan */}
          <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:16, alignItems:'stretch' }}>

            {/* NPS Score card */}
            <div className="aw-card" style={{ padding:'22px 28px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minWidth:180 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'rgba(60,60,67,0.55)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:8 }}>
                NPS Score
              </div>
              <div style={{ fontSize:56, fontWeight:700, letterSpacing:'-2px', color: npsColor, lineHeight:1 }}>
                {npsScore ?? '—'}
              </div>
              <div style={{ marginTop:14, width:'100%' }}>
                <div className="nps-gauge-track">
                  <div className="nps-gauge-fill" style={{ width: gaugeWidth + '%', background: npsColor }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:10, color:'rgba(60,60,67,0.4)' }}>
                  <span>-100</span><span>0</span><span>+100</span>
                </div>
              </div>
              <div style={{ marginTop:10, fontSize:11, color:'rgba(60,60,67,0.45)' }}>
                {npsScore >= 50 ? '🟢 Excellent' : npsScore >= 0 ? '🟡 Good' : '🔴 Needs work'}
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                { label:'Total kirim',    value: k.total_kirim,    color:'#007AFF', icon:'📤' },
                { label:'Total respons',  value: k.total_respons,  color:'#34C759', icon:'💬' },
                { label:'Response rate',  value: k.response_rate,  color:'#FF9500', icon:'📈' },
                { label:'Promoters 🟢',   value: k.promoters,      color:'#34C759', icon:'' },
                { label:'Passives 🟡',    value: k.passives,       color:'#FF9500', icon:'' },
                { label:'Detractors 🔴',  value: k.detractors,     color:'#FF3B30', icon:'' },
              ].map((s, i) => (
                <div key={i} className="aw-card" style={{ padding:'14px 16px' }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'rgba(60,60,67,0.55)', textTransform:'uppercase', letterSpacing:'0.3px', marginBottom:6 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize:22, fontWeight:700, color: s.color, letterSpacing:'-0.5px' }}>
                    {s.value ?? '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Donut distribusi */}
          <div className="aw-card" style={{ padding:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:24 }}>
              <NpsDonut promoters={k.promoters} passives={k.passives} detractors={k.detractors} />
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { label:'Promoter (9–10)', count:k.promoters, color:'#34C759', pct: k.total_respons ? Math.round(k.promoters/k.total_respons*100) : 0 },
                  { label:'Passive (7–8)',   count:k.passives,  color:'#FF9500', pct: k.total_respons ? Math.round(k.passives/k.total_respons*100)  : 0 },
                  { label:'Detractor (0–6)',count:k.detractors, color:'#FF3B30', pct: k.total_respons ? Math.round(k.detractors/k.total_respons*100): 0 },
                ].map((item, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:item.color, flexShrink:0 }} />
                    <span style={{ fontSize:13, color:'#1D1D1F', minWidth:130 }}>{item.label}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'#1D1D1F', minWidth:30 }}>{item.count}</span>
                    <span className={`aw-badge ${i===0?'badge-green':i===1?'badge-orange':'badge-red'}`}>{item.pct}%</span>
                  </div>
                ))}
              </div>
              <div style={{ marginLeft:'auto', textAlign:'right' }}>
                <div style={{ fontSize:11, color:'rgba(60,60,67,0.45)', marginBottom:4 }}>Periode</div>
                <div style={{ fontSize:13, fontWeight:500, color:'#1D1D1F' }}>
                  {data.periode.dari} s/d {data.periode.sampai}
                </div>
                <div style={{ fontSize:11, color:'rgba(60,60,67,0.4)', marginTop:2 }}>
                  Rata-rata skor: <strong>{k.rata_rata_skor ?? '—'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Tabel detail pasien */}
          <div className="aw-card" style={{ overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'0.5px solid rgba(0,0,0,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <h2 style={{ fontSize:15, fontWeight:600, color:'#1D1D1F', letterSpacing:'-0.2px' }}>Detail Respons Pasien</h2>
                <p style={{ fontSize:12, color:'rgba(60,60,67,0.5)', marginTop:2 }}>
                  {(data.data||[]).length} respons dalam periode ini
                </p>
              </div>
            </div>
            {(data.data||[]).length === 0 ? (
              <div style={{ padding:48, textAlign:'center', color:'rgba(60,60,67,0.4)' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>⭐</div>
                <div style={{ fontSize:14 }}>Belum ada data respons NPS</div>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table className="aw-table">
                  <thead>
                    <tr>
                      <th>Nama Pasien</th>
                      <th>Unit Pelayanan</th>
                      <th>Jenis Rawat</th>
                      <th style={{ textAlign:'center' }}>Skor</th>
                      <th>Segmen</th>
                      <th>Komentar</th>
                      <th>Waktu Skor</th>
                      <th>Direspons CS?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.data||[]).map((d, i) => {
                      const rowCls = d.segmen === 'detractor' ? 'row-det' : d.segmen === 'passive' ? 'row-pas' : 'row-pro';
                      return (
                        <tr key={i} className={rowCls}>
                          <td style={{ fontWeight:500 }}>{d.nm_pasien || '—'}</td>
                          <td>{d.nm_poli || '—'}</td>
                          <td>{d.jenis_rawat || '—'}</td>
                          <td style={{ textAlign:'center' }}>
                            <span style={{
                              display:'inline-flex', alignItems:'center', justifyContent:'center',
                              width:28, height:28, borderRadius:8, fontWeight:700, fontSize:13,
                              background: d.segmen==='promoter'?'rgba(52,199,89,0.14)':d.segmen==='passive'?'rgba(255,149,0,0.14)':'rgba(255,59,48,0.14)',
                              color: d.segmen==='promoter'?'#1a7a35':d.segmen==='passive'?'#b25000':'#c0160c',
                            }}>{d.skor ?? '—'}</span>
                          </td>
                          <td>
                            <span className={`aw-badge ${d.segmen==='promoter'?'badge-green':d.segmen==='passive'?'badge-orange':'badge-red'}`}>
                              {d.segmen==='promoter'?'🟢 Promoter':d.segmen==='passive'?'🟡 Passive':'🔴 Detractor'}
                            </span>
                          </td>
                          <td style={{ fontSize:12, color:'rgba(60,60,67,0.75)', maxWidth:200 }}>
                            {d.komentar || <span style={{ color:'rgba(60,60,67,0.3)' }}>—</span>}
                          </td>
                          <td style={{ fontSize:11, color:'rgba(60,60,67,0.5)', whiteSpace:'nowrap' }}>
                            {d.skor_at ? new Date(d.skor_at).toLocaleString('id-ID', { dateStyle:'short', timeStyle:'short' }) : '—'}
                          </td>
                          <td>
                            {d.sudah_direspons_cs
                              ? <span className="aw-badge badge-green">✓ Sudah</span>
                              : <span className="aw-badge badge-red">✗ Belum</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {!data && !loading && (
        <div className="aw-card" style={{ padding:56, textAlign:'center', color:'rgba(60,60,67,0.4)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
          <div style={{ fontSize:15, fontWeight:500, marginBottom:6 }}>Pilih rentang tanggal</div>
          <div style={{ fontSize:13 }}>Tentukan periode lalu klik Tampilkan untuk melihat laporan NPS</div>
        </div>
      )}
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────── */
export default function AdminWablas() {
  const [tab, setTab] = useState('config');
  const [toasts, setToasts] = useState([]);

  // ── Config state ──────────────────────────────────────────────
  const [config, setConfig] = useState({
    wablas_url:    'https://jogja.wablas.com',
    wablas_token:  'VB8zjsrnjSBJ0ebc9VlnxuRcqM3hUXkGLSW9OeQh466Ht22MDLIm7Rd1UJ6KWNfP',
    wablas_secret: '4vWr3WU7',
    no_gcare:      '628117978776',
    no_pendaftaran:'6281373550684',
    jadwal_img_url:'https://i.ibb.co.com/LDDj1w54/jadwal.jpg',
    reminder_aktif: true,
    nps_aktif:      true,
  });
  const [saving, setSaving]     = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMsg,   setTestMsg]   = useState('Halo, ini pesan uji coba dari Admin Wablas RSU GMC 🏥');
  const [sending,   setSending]   = useState(false);
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult,  setPingResult]  = useState(null);

  // ── Log & session state ───────────────────────────────────────
  const [sessions,     setSessions]     = useState([]);
  const [sessLoading,  setSessLoading]  = useState(false);
  const [stats,        setStats]        = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // ── Trigger state ─────────────────────────────────────────────
  const [triggerLoading, setTriggerLoading] = useState({});

  /* toast helper */
  const toast = useCallback((msg, type = 'success', dur = 3200) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), dur);
  }, []);

  /* load config dari backend */
  const loadConfig = useCallback(async () => {
    try {
      const r = await axios.get('/api/wablas/config');
      if (r.data) setConfig(c => ({ ...c, ...r.data }));
    } catch {/* pakai default */}
  }, []);

  /* load active sessions */
  const loadSessions = useCallback(async () => {
    setSessLoading(true);
    try {
      const r = await axios.get('/api/wablas/sessions');
      setSessions(r.data?.data ?? []);
    } catch { setSessions([]); }
    finally { setSessLoading(false); }
  }, []);

  /* load stats */
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await axios.get('/api/wablas/stats');
      setStats(r.data);
    } catch { setStats(null); }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => {
    loadConfig();
    loadSessions();
    loadStats();
  }, [loadConfig, loadSessions, loadStats]);

  /* simpan config */
  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post('/api/wablas/config', config);
      toast('Konfigurasi berhasil disimpan');
    } catch { toast('Gagal menyimpan konfigurasi', 'error'); }
    finally { setSaving(false); }
  };

  /* ping Wablas */
  const handlePing = async () => {
    setPingLoading(true); setPingResult(null);
    try {
      const r = await axios.post('/api/wablas/ping');
      setPingResult({ ok: true, msg: r.data?.message ?? 'Terhubung' });
      toast('Wablas terhubung ✓', 'success');
    } catch (e) {
      const msg = e.response?.data?.message ?? 'Tidak dapat terhubung';
      setPingResult({ ok: false, msg });
      toast(msg, 'error');
    } finally { setPingLoading(false); }
  };

  /* kirim pesan test */
  const handleTest = async () => {
    if (!testPhone.trim()) { toast('Nomor HP wajib diisi', 'error'); return; }
    setSending(true);
    try {
      await axios.post('/api/wablas/test-send', { phone: testPhone, message: testMsg });
      toast(`Pesan terkirim ke ${fmt(testPhone)}`);
    } catch (e) {
      toast(e.response?.data?.message ?? 'Gagal mengirim pesan', 'error');
    } finally { setSending(false); }
  };

  /* trigger manual */
  const handleTrigger = async (cmd) => {
    setTriggerLoading(p => ({ ...p, [cmd]: true }));
    try {
      const r = await axios.post('/api/wablas/trigger', { command: cmd });
      toast(r.data?.message ?? `${cmd} dijalankan`, 'success');
    } catch (e) {
      toast(e.response?.data?.message ?? `Gagal menjalankan ${cmd}`, 'error');
    } finally {
      setTriggerLoading(p => ({ ...p, [cmd]: false }));
    }
  };

  /* hapus session */
  const handleDeleteSession = async (id) => {
    try {
      await axios.delete(`/api/wablas/sessions/${id}`);
      setSessions(p => p.filter(s => s.id !== id));
      toast('Session dihapus');
    } catch { toast('Gagal menghapus session', 'error'); }
  };

  const stateLabel = {
    awaiting_reschedule_confirmation: { label:'Menunggu Konfirmasi Jadwal', color:'orange' },
    awaiting_new_date:                { label:'Menunggu Tanggal Baru',       color:'blue'   },
    awaiting_nps_score:               { label:'Menunggu Skor NPS',           color:'blue'   },
    awaiting_nps_comment:             { label:'Menunggu Komentar NPS',       color:'blue'   },
  };

  /* ── render ──────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(145deg,#eef2f8 0%,#e5ecf7 40%,#dde7f5 100%)', padding:'28px 24px 60px' }}>
      <style>{adminStyle}</style>

      {/* HEADER */}
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:700, color:'#1D1D1F', letterSpacing:'-0.8px', marginBottom:4 }}>
              📲 Admin Wablas
            </h1>
            <p style={{ fontSize:13, color:'rgba(60,60,67,0.5)', letterSpacing:'-0.1px' }}>
              Kelola konfigurasi, monitoring, dan trigger WA RSU GMC
            </p>
          </div>

          {/* Status pill */}
          <div className="aw-card header-status-pill" style={{ padding:'10px 18px', display:'flex', alignItems:'center', gap:9 }}>
            <span className={`status-dot ${pingResult?.ok === false ? 'dot-red' : 'dot-green'}`} />
            <span style={{ fontSize:13, fontWeight:500, color:'rgba(60,60,67,0.75)', letterSpacing:'-0.1px' }}>
              {pingResult?.ok === false ? 'Offline' : 'Online'}
            </span>
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
          <StatCard icon="💬" label="Session Aktif"  value={stats?.active_sessions ?? '—'} sub="percakapan berlangsung" color="#007AFF" loading={statsLoading} delay={0}   />
          <StatCard icon="📨" label="Reminder H-3"   value={stats?.reminder_h3_today ?? '—'} sub="terkirim hari ini"   color="#34C759" loading={statsLoading} delay={60}  />
          <StatCard icon="🔔" label="Reminder H-1"   value={stats?.reminder_h1_today ?? '—'} sub="terkirim hari ini"   color="#FF9500" loading={statsLoading} delay={120} />
          <StatCard icon="⭐" label="NPS Terkirim"   value={stats?.nps_today ?? '—'}          sub="survei hari ini"     color="#AF52DE" loading={statsLoading} delay={180} />
        </div>

        {/* TABS */}
        <div className="aw-card" style={{ padding:'5px 6px', display:'inline-flex', gap:3, marginBottom:20 }}>
          {[
            { key:'config',   label:'⚙️  Konfigurasi'  },
            { key:'sessions', label:'💬 Session Aktif'  },
            { key:'trigger',  label:'▶️  Trigger Manual' },
            { key:'test',     label:'🧪 Uji Kirim'      },
            { key:'nps',      label:'📊 Laporan NPS'    },
          ].map(t => (
            <button key={t.key} className={`aw-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: KONFIGURASI ───────────────────────────────────── */}
        {tab === 'config' && (
          <div className="section-enter" style={{ display:'grid', gap:16 }}>

            {/* Wablas API */}
            <div className="aw-card" style={{ padding:24 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <div>
                  <h2 style={{ fontSize:15, fontWeight:600, color:'#1D1D1F', letterSpacing:'-0.2px' }}>Wablas API</h2>
                  <p style={{ fontSize:12, color:'rgba(60,60,67,0.5)', marginTop:2 }}>Token dan URL gateway Wablas</p>
                </div>
                <button
                  className="aw-btn aw-btn-ghost aw-btn-sm"
                  onClick={handlePing}
                  disabled={pingLoading}
                >
                  {pingLoading
                    ? <span style={{ display:'inline-block', width:12, height:12, border:'2px solid #007AFF', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                    : '🔌 Ping'
                  }
                </button>
              </div>

              {pingResult && (
                <div style={{
                  padding:'10px 14px', borderRadius:11, marginBottom:16, fontSize:12,
                  fontWeight:500,
                }} className={pingResult.ok ? 'ping-ok' : 'ping-err'}>
                  {pingResult.ok ? '✅' : '❌'} {pingResult.msg}
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label className="aw-label">URL Gateway</label>
                  <input className="aw-input" value={config.wablas_url}
                    onChange={e => setConfig(c => ({ ...c, wablas_url: e.target.value }))} />
                </div>
                <div>
                  <label className="aw-label">Secret Key</label>
                  <input className="aw-input" type="password" value={config.wablas_secret}
                    onChange={e => setConfig(c => ({ ...c, wablas_secret: e.target.value }))} />
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label className="aw-label">Token</label>
                  <input className="aw-input" type="password" value={config.wablas_token}
                    onChange={e => setConfig(c => ({ ...c, wablas_token: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Nomor Penerima */}
            <div className="aw-card" style={{ padding:24 }}>
              <h2 style={{ fontSize:15, fontWeight:600, color:'#1D1D1F', marginBottom:4, letterSpacing:'-0.2px' }}>Nomor Penerima</h2>
              <p style={{ fontSize:12, color:'rgba(60,60,67,0.5)', marginBottom:18 }}>Notifikasi permintaan ubah jadwal diteruskan ke nomor-nomor ini</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label className="aw-label">No. G-Care</label>
                  <input className="aw-input" value={config.no_gcare}
                    onChange={e => setConfig(c => ({ ...c, no_gcare: e.target.value }))}
                    placeholder="628xxxxxxxxx" />
                </div>
                <div>
                  <label className="aw-label">No. Pendaftaran</label>
                  <input className="aw-input" value={config.no_pendaftaran}
                    onChange={e => setConfig(c => ({ ...c, no_pendaftaran: e.target.value }))}
                    placeholder="628xxxxxxxxx" />
                </div>
              </div>
            </div>

            {/* URL Aset & Fitur */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div className="aw-card" style={{ padding:24 }}>
                <h2 style={{ fontSize:15, fontWeight:600, color:'#1D1D1F', marginBottom:4, letterSpacing:'-0.2px' }}>Gambar Jadwal</h2>
                <p style={{ fontSize:12, color:'rgba(60,60,67,0.5)', marginBottom:14 }}>URL gambar jadwal dokter yang dikirim saat pasien minta ubah jadwal</p>
                <label className="aw-label">Image URL</label>
                <input className="aw-input" value={config.jadwal_img_url}
                  onChange={e => setConfig(c => ({ ...c, jadwal_img_url: e.target.value }))} />
                {config.jadwal_img_url && (
                  <img src={config.jadwal_img_url} alt="preview"
                    style={{ marginTop:12, width:'100%', maxHeight:120, objectFit:'cover', borderRadius:10, border:'0.5px solid rgba(0,0,0,0.08)' }}
                    onError={e => e.target.style.display='none'} />
                )}
              </div>

              <div className="aw-card" style={{ padding:24 }}>
                <h2 style={{ fontSize:15, fontWeight:600, color:'#1D1D1F', marginBottom:4, letterSpacing:'-0.2px' }}>Fitur Aktif</h2>
                <p style={{ fontSize:12, color:'rgba(60,60,67,0.5)', marginBottom:18 }}>Aktifkan/matikan pengiriman otomatis</p>
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {[
                    { key:'reminder_aktif', label:'Reminder H-3 & H-1', desc:'Kirim pengingat kontrol ke pasien' },
                    { key:'nps_aktif',      label:'Survei NPS',          desc:'Kirim survei kepuasan setelah kunjungan' },
                  ].map(f => (
                    <div key={f.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:500, color:'#1D1D1F' }}>{f.label}</div>
                        <div style={{ fontSize:11, color:'rgba(60,60,67,0.5)', marginTop:1 }}>{f.desc}</div>
                      </div>
                      <Toggle on={config[f.key]} onChange={v => setConfig(c => ({ ...c, [f.key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Save */}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button className="aw-btn aw-btn-ghost" onClick={loadConfig}>↺ Reset</button>
              <button className="aw-btn aw-btn-primary" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><span style={{ display:'inline-block', width:12, height:12, border:'2px solid rgba(255,255,255,0.5)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', marginRight:6 }} />Menyimpan…</>
                  : '💾 Simpan Konfigurasi'
                }
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: SESSION AKTIF ────────────────────────────────────── */}
        {tab === 'sessions' && (
          <div className="section-enter">
            <div className="aw-card" style={{ overflow:'hidden' }}>
              <div style={{ padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'0.5px solid rgba(0,0,0,0.06)' }}>
                <div>
                  <h2 style={{ fontSize:15, fontWeight:600, color:'#1D1D1F', letterSpacing:'-0.2px' }}>Session Aktif</h2>
                  <p style={{ fontSize:12, color:'rgba(60,60,67,0.5)', marginTop:2 }}>
                    Percakapan yang sedang menunggu balasan pasien
                  </p>
                </div>
                <button className="aw-btn aw-btn-ghost aw-btn-sm" onClick={loadSessions} disabled={sessLoading}>
                  {sessLoading ? '⟳' : '↺ Refresh'}
                </button>
              </div>

              {sessLoading
                ? (
                  <div style={{ padding:24, display:'flex', flexDirection:'column', gap:10 }}>
                    {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:44, borderRadius:10 }} />)}
                  </div>
                )
                : sessions.length === 0
                  ? (
                    <div style={{ padding:48, textAlign:'center', color:'rgba(60,60,67,0.4)' }}>
                      <div style={{ fontSize:32, marginBottom:8 }}>💬</div>
                      <div style={{ fontSize:14 }}>Tidak ada session aktif</div>
                    </div>
                  )
                  : (
                    <div style={{ overflowX:'auto' }}>
                      <table className="aw-table">
                        <thead>
                          <tr>
                            <th>Nomor</th>
                            <th>Pasien</th>
                            <th>State</th>
                            <th>Poli / Dokter</th>
                            <th>Expires</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.map(s => {
                            const st = stateLabel[s.state] || { label: s.state, color:'gray' };
                            const exp = s.expires_at ? new Date(s.expires_at) : null;
                            const expired = exp && exp < new Date();
                            return (
                              <tr key={s.id}>
                                <td>
                                  <span style={{ fontFamily:'ui-monospace,monospace', fontSize:12 }}>
                                    {fmt(s.phone)}
                                  </span>
                                </td>
                                <td style={{ fontWeight:500 }}>{s.nm_pasien || '—'}</td>
                                <td>
                                  <span className={`aw-badge badge-${st.color}`}>{st.label}</span>
                                </td>
                                <td>
                                  <div style={{ fontSize:12 }}>{s.nm_poli || '—'}</div>
                                  <div style={{ fontSize:11, color:'rgba(60,60,67,0.5)' }}>{s.nm_dokter || ''}</div>
                                </td>
                                <td>
                                  <span className={`aw-badge ${expired ? 'badge-red' : 'badge-gray'}`}>
                                    {exp ? exp.toLocaleString('id-ID', { dateStyle:'short', timeStyle:'short' }) : '—'}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="aw-btn aw-btn-ghost aw-btn-sm"
                                    style={{ color:'#FF3B30', fontSize:11 }}
                                    onClick={() => handleDeleteSession(s.id)}
                                  >Hapus</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
              }
            </div>
          </div>
        )}

        {/* ── TAB: TRIGGER MANUAL ───────────────────────────────────── */}
        {tab === 'trigger' && (
          <div className="section-enter" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {[
          { cmd: 'reminder:harian', icon: '🔔', title: 'Reminder Harian',
            desc: 'Kirim reminder H-3 dan H-1 ke semua pasien yang jadwal kontrolnya sesuai target tanggal hari ini.',
            color: '#007AFF', warn: false,
          },
          { cmd: 'reminder:surkon', icon: '📄', title: 'Reminder Surat Kontrol',
            desc: 'Kirim notifikasi surat kontrol yang akan segera berakhir.',
            color: '#FF9500', warn: false,
          },
          { cmd: 'nps:kirim', icon: '⭐', title: 'Kirim NPS',
            desc: 'Kirim survei NPS ke semua pasien yang billing sudah closing hari ini (hanya sekali per kunjungan).',
            color: '#AF52DE', warn: true,
          },
        ].map(item => (
          <div
            key={item.cmd}
            className="aw-card trigger-card"
            style={{ padding:24, '--glow-color': item.color + '33' }}
          >
            <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:18 }}>
              <div
                className="icon-orb"
                style={{
                  width:48, height:48, borderRadius:14,
                  background: `linear-gradient(135deg, ${item.color}20, ${item.color}0d)`,
                  fontSize:22, flexShrink:0,
                  boxShadow: `0 2px 10px ${item.color}25`,
                  '--orb-shadow': item.color + '45',
                }}
              >{item.icon}</div>
              <div style={{ paddingTop:2 }}>
                <div style={{ fontSize:15, fontWeight:600, color:'#1D1D1F', letterSpacing:'-0.2px' }}>{item.title}</div>
                <div style={{ fontSize:12, color:'rgba(60,60,67,0.5)', marginTop:4, lineHeight:1.55 }}>{item.desc}</div>
              </div>
            </div>

            {item.warn && (
              <div style={{
                padding:'9px 13px', borderRadius:10, marginBottom:14, fontSize:11,
                background:'rgba(255,149,0,0.1)', color:'#b25000',
                border:'0.5px solid rgba(255,149,0,0.28)',
              }}>
                ⚠️ Hati-hati: aksi ini mengirim WA ke pasien nyata
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <code style={{ fontSize:11, color:'rgba(60,60,67,0.4)', background:'rgba(0,0,0,0.05)', padding:'4px 9px', borderRadius:7 }}>
                php artisan {item.cmd}
              </code>
              <button
                className="aw-btn aw-btn-sm"
                style={{
                  background: `linear-gradient(135deg, ${item.color}ee, ${item.color})`,
                  color:'#fff',
                  boxShadow: `0 2px 8px ${item.color}40`,
                }}
                disabled={triggerLoading[item.cmd]}
                onClick={() => handleTrigger(item.cmd)}
              >
                {triggerLoading[item.cmd]
                  ? <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
                      <span style={{ width:11, height:11, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} />
                      Running…
                    </span>
                  : '▶ Jalankan'
                }
              </button>
            </div>
          </div>
            ))}
          </div>
        )}

        {/* ── TAB: UJI KIRIM ───────────────────────────────────────── */}
        {tab === 'test' && (
          <div className="section-enter" style={{ display:'grid', gridTemplateColumns:'5fr 4fr', gap:16, alignItems:'start' }}>
            <div className="aw-card" style={{ padding:24 }}>
              <h2 style={{ fontSize:15, fontWeight:600, color:'#1D1D1F', letterSpacing:'-0.2px', marginBottom:4 }}>Uji Kirim Pesan WA</h2>
              <p style={{ fontSize:12, color:'rgba(60,60,67,0.5)', marginBottom:20 }}>Test koneksi dengan mengirim pesan ke nomor tertentu</p>

              <div style={{ marginBottom:14 }}>
                <label className="aw-label">Nomor Tujuan</label>
                <input
                  className="aw-input"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="628xxxxxxxxx"
                />
                <div style={{ fontSize:11, color:'rgba(60,60,67,0.4)', marginTop:4 }}>
                  Format internasional tanpa tanda +. Contoh: 6281234567890
                </div>
              </div>

              <div style={{ marginBottom:20 }}>
                <label className="aw-label">Pesan</label>
                <textarea
                  className="aw-input"
                  rows={4}
                  style={{ resize:'vertical' }}
                  value={testMsg}
                  onChange={e => setTestMsg(e.target.value)}
                />
              </div>

              <button
                className="aw-btn aw-btn-green"
                style={{ width:'100%' }}
                onClick={handleTest}
                disabled={sending || !testPhone.trim()}
              >
                {sending
                  ? <span style={{ display:'inline-flex', alignItems:'center', gap:6, justifyContent:'center' }}>
                      <span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} />
                      Mengirim…
                    </span>
                  : '📤 Kirim Pesan Test'
                }
              </button>
            </div>

            {/* Preview */}
            <div className="aw-card" style={{ padding:24 }}>
              <h2 style={{ fontSize:13, fontWeight:600, color:'rgba(60,60,67,0.6)', letterSpacing:'0.2px', marginBottom:16, textTransform:'uppercase' }}>Preview</h2>
              <div style={{
                background:'#ECE5DD', borderRadius:14, padding:14,
                minHeight:200, position:'relative',
              }}>
                <div style={{
                  background:'#fff', borderRadius:'16px 16px 16px 4px',
                  padding:'10px 14px', maxWidth:'85%', boxShadow:'0 1px 2px rgba(0,0,0,0.1)',
                  fontSize:13, lineHeight:1.55, color:'#1D1D1F', whiteSpace:'pre-wrap',
                }}>
                  {testMsg || <span style={{ color:'rgba(0,0,0,0.3)' }}>Ketik pesan di sebelah kiri…</span>}
                  <div style={{ fontSize:10, color:'rgba(60,60,67,0.5)', textAlign:'right', marginTop:4 }}>
                    {new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })} ✓✓
                  </div>
                </div>
                <div style={{ fontSize:10, color:'rgba(60,60,67,0.5)', marginTop:10, textAlign:'center' }}>
                  {testPhone ? `→ ${fmt(testPhone)}` : 'Isi nomor tujuan'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: LAPORAN NPS ───────────────────────────────────────── */}
        {tab === 'nps' && <NpsLaporan toast={toast} />}

      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}