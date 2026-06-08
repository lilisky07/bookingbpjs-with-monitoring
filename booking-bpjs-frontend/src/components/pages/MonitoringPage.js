import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/* ─── GLOBAL APPLE STYLES ─────────────────────────────────────────── */
const appleStyle = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.22); }

  /* ── KEYFRAMES ──────────────────────────────────── */
  @keyframes fadeIn       { from { opacity:0 }                          to { opacity:1 } }
  @keyframes slideUp      { from { transform:translateY(20px);opacity:0 } to { transform:translateY(0);opacity:1 } }
  @keyframes slideDown    { from { transform:translateY(-8px);opacity:0 } to { transform:translateY(0);opacity:1 } }
  @keyframes scaleIn      { from { transform:scale(0.94);opacity:0 }    to { transform:scale(1);opacity:1 } }
  @keyframes spin         { to   { transform:rotate(360deg) } }
  @keyframes shimmer      { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes pulseGlow    { 0%,100%{box-shadow:0 0 0 0 rgba(0,122,255,0)} 50%{box-shadow:0 0 0 6px rgba(0,122,255,0.12)} }
  @keyframes statIn       { from{transform:translateY(10px) scale(0.97);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
  @keyframes rowIn        { from{transform:translateX(-6px);opacity:0} to{transform:translateX(0);opacity:1} }

  /* ── CARDS ─────────────────────────────────────── */
  .apple-card {
    background: rgba(255,255,255,0.78);
    backdrop-filter: blur(24px) saturate(200%);
    -webkit-backdrop-filter: blur(24px) saturate(200%);
    border-radius: 18px;
    border: 0.5px solid rgba(255,255,255,0.9);
    box-shadow: 0 2px 20px rgba(0,0,0,0.055), 0 0 0 0.5px rgba(0,0,0,0.04);
    transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1),
                box-shadow 0.28s cubic-bezier(0.34,1.56,0.64,1),
                border-color 0.2s ease;
  }
  .apple-card:has(.card-interactive):hover,
  .apple-card.hoverable:hover {
    transform: translateY(-3px) scale(1.01);
    box-shadow: 0 12px 36px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
    border-color: rgba(0,122,255,0.2);
  }

  /* stat card hover */
  .stat-card-wrap {
    animation: statIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
    transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
                box-shadow 0.22s ease;
    cursor: default;
  }
  .stat-card-wrap:hover {
    transform: translateY(-4px) scale(1.025);
    box-shadow: 0 14px 36px rgba(0,0,0,0.11), 0 2px 8px rgba(0,0,0,0.05);
  }
  .stat-card-wrap:active { transform: scale(0.98); transition-duration:0.08s; }

  /* ── BUTTONS ────────────────────────────────────── */
  .apple-btn {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
    font-size: 13px;
    font-weight: 500;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    letter-spacing: -0.1px;
    position: relative;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
    transition: transform 0.14s cubic-bezier(0.34,1.56,0.64,1),
                box-shadow 0.18s ease,
                background 0.15s ease,
                opacity 0.15s ease;
  }
  .apple-btn::after {
    content:'';
    position:absolute; inset:0;
    background: rgba(255,255,255,0);
    transition: background 0.14s ease;
    border-radius: inherit;
    pointer-events: none;
  }
  .apple-btn:hover  { transform: scale(1.04); }
  .apple-btn:hover::after { background: rgba(255,255,255,0.10); }
  .apple-btn:active { transform: scale(0.95); transition-duration:0.07s; }
  .apple-btn:active::after { background: rgba(0,0,0,0.06); }
  .apple-btn:disabled { opacity:0.4; cursor:not-allowed; transform:none; }

  .apple-btn-primary  { background:#007AFF; color:#fff; padding:7px 16px; }
  .apple-btn-primary:hover  { box-shadow:0 4px 18px rgba(0,122,255,0.40); }
  .apple-btn-primary:active { box-shadow:none; }

  .apple-btn-secondary {
    background:rgba(120,120,128,0.13); color:#1D1D1F;
    padding:7px 14px; border:0.5px solid rgba(0,0,0,0.09);
  }
  .apple-btn-secondary:hover { background:rgba(120,120,128,0.21); box-shadow:0 2px 8px rgba(0,0,0,0.07); }

  /* ── INPUTS ─────────────────────────────────────── */
  .apple-input {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
    font-size: 13px;
    padding: 8px 12px;
    border-radius: 10px;
    border: 0.5px solid rgba(0,0,0,0.14);
    background: rgba(255,255,255,0.92);
    color: #1D1D1F;
    outline: none;
    letter-spacing: -0.1px;
    transition: border-color 0.18s ease,
                box-shadow 0.22s ease,
                transform 0.14s cubic-bezier(0.34,1.56,0.64,1),
                background 0.15s ease;
  }
  .apple-input:hover  { border-color:rgba(0,0,0,0.26); transform:scale(1.008); }
  .apple-input:focus  {
    border-color:#007AFF;
    box-shadow: 0 0 0 3.5px rgba(0,122,255,0.16);
    transform: scale(1.01);
    background: #fff;
  }

  .apple-select {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
    font-size: 13px;
    padding: 8px 32px 8px 12px;
    border-radius: 10px;
    border: 0.5px solid rgba(0,0,0,0.14);
    background: rgba(255,255,255,0.92);
    color: #1D1D1F;
    outline: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2386868B'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    cursor: pointer;
    transition: border-color 0.18s ease, box-shadow 0.2s ease, transform 0.14s cubic-bezier(0.34,1.56,0.64,1);
  }
  .apple-select:hover { border-color:rgba(0,0,0,0.26); transform:scale(1.008); }
  .apple-select:focus { border-color:#007AFF; box-shadow:0 0 0 3.5px rgba(0,122,255,0.16); }

  /* ── TABLE ROWS ─────────────────────────────────── */
  .apple-table-row {
    transition: background 0.12s ease;
    cursor: pointer;
  }
  .apple-table-row td {
    transition: background 0.12s ease, padding-left 0.15s ease, border-left-color 0.15s ease;
    border-left: 2.5px solid transparent;
  }
  .apple-table-row:hover td {
    background: rgba(0,122,255,0.042) !important;
  }
  .apple-table-row:hover td:first-child {
    border-left-color: #007AFF;
    padding-left: 11.5px !important;
  }
  .apple-table-row:active td { background: rgba(0,122,255,0.08) !important; }

  /* tbody row stagger-in */
  .apple-table-row { animation: rowIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both; }

  /* ── PILLS ──────────────────────────────────────── */
  .pill {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: -0.1px;
    white-space: nowrap;
    transition: transform 0.14s cubic-bezier(0.34,1.56,0.64,1),
                box-shadow 0.14s ease,
                filter 0.14s ease;
  }
  .pill:hover {
    transform: scale(1.07);
    box-shadow: 0 2px 8px rgba(0,0,0,0.10);
    filter: brightness(1.06);
  }
  .pill:active { transform:scale(0.96); transition-duration:0.07s; }

  /* ── MODAL ──────────────────────────────────────── */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.36);
    backdrop-filter: blur(10px) saturate(180%);
    -webkit-backdrop-filter: blur(10px) saturate(180%);
    z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.18s ease;
  }
  .modal-content {
    background: rgba(255,255,255,0.96);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border-radius: 22px;
    padding: 28px;
    min-width: 480px; max-width: 580px;
    max-height: 82vh; overflow-y: auto;
    box-shadow: 0 32px 80px rgba(0,0,0,0.22), 0 0 0 0.5px rgba(0,0,0,0.06);
    animation: scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .modal-close-btn {
    border: none;
    background: rgba(0,0,0,0.06);
    color: #6E6E73;
    border-radius: 8px;
    padding: 5px 10px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    transition: background 0.14s ease, transform 0.12s cubic-bezier(0.34,1.56,0.64,1);
  }
  .modal-close-btn:hover { background:rgba(255,59,48,0.12); color:#FF3B30; transform:scale(1.08); }
  .modal-close-btn:active { transform:scale(0.93); }

  /* ── MINI STAT CARD ─────────────────────────────── */
  .mini-stat-card {
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1),
                box-shadow 0.18s ease,
                filter 0.18s ease;
  }
  .mini-stat-card:hover {
    transform: translateY(-3px) scale(1.04);
    box-shadow: 0 8px 20px rgba(0,0,0,0.10);
    filter: brightness(1.03);
  }
  .mini-stat-card:active { transform:scale(0.97); transition-duration:0.07s; }

  /* ── SECTION HEADER ─────────────────────────────── */
  .section-header {
    font-size: 22px;
    font-weight: 700;
    color: #1D1D1F;
    letter-spacing: -0.5px;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideDown 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  /* ── NAVBAR TAB BUTTON ──────────────────────────── */
  .nav-tab {
    padding: 9px 16px;
    border: none;
    cursor: pointer;
    background: transparent;
    font-size: 13px;
    white-space: nowrap;
    letter-spacing: -0.2px;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
    border-bottom: 2px solid transparent;
    transition: color 0.18s ease,
                border-color 0.18s ease,
                transform 0.14s cubic-bezier(0.34,1.56,0.64,1),
                opacity 0.18s ease;
  }
  .nav-tab:hover:not(.active) { color:#007AFF !important; transform:translateY(-1px); opacity:1 !important; }
  .nav-tab:active { transform:scale(0.96) translateY(0); }

  /* ── STAT GRID ──────────────────────────────────── */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
  }
  .stat-grid .stat-card-wrap:nth-child(1) { animation-delay:0.03s }
  .stat-grid .stat-card-wrap:nth-child(2) { animation-delay:0.07s }
  .stat-grid .stat-card-wrap:nth-child(3) { animation-delay:0.11s }
  .stat-grid .stat-card-wrap:nth-child(4) { animation-delay:0.15s }

  .mini-stat-grid {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  /* ── PROGRESS BAR ───────────────────────────────── */
  .bor-bar {
    height: 5px;
    border-radius: 10px;
    background: #E5E5EA;
    overflow: hidden;
  }
  .bor-fill {
    height: 100%;
    border-radius: 10px;
    background: linear-gradient(90deg, #007AFF, #34AADC);
    transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1);
  }

  /* ── LIST BOX ROWS ──────────────────────────────── */
  .list-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-radius: 12px;
    cursor: pointer;
    border: 0.5px solid transparent;
    transition: background 0.14s ease,
                transform 0.14s cubic-bezier(0.34,1.56,0.64,1),
                border-color 0.14s ease;
  }
  .list-row:hover {
    background: rgba(0,122,255,0.055);
    border-color: rgba(0,122,255,0.14);
    transform: translateX(3px);
  }
  .list-row:active { transform:scale(0.99) translateX(2px); background:rgba(0,122,255,0.09); }

  /* ── PAGE ENTER ANIMATION ───────────────────────── */
  .page-content { animation: fadeIn 0.25s ease both; }

  /* ── FOOTER STATS ITEM ──────────────────────────── */
  .footer-stat {
    transition: transform 0.16s cubic-bezier(0.34,1.56,0.64,1), opacity 0.16s ease;
  }
  .footer-stat:hover { transform:translateY(-2px) scale(1.06); opacity:1 !important; }
`;

/* ─── HELPERS ─────────────────────────────────────────────────────── */
const fmt = (v) => (v === null || v === undefined ? '—' : v);
const fmtTime = (t) => {
  if (!t) return '—';
  return typeof t === 'string' && t.includes(':') ? t.slice(0, 5) : t;
};
const today = () => new Date().toISOString().split('T')[0];

/* ─── STATUS COLOR MAP ────────────────────────────────────────────── */
const STATUS_COLOR = {
  'Checkin': { bg: 'rgba(52,199,89,0.12)',  text: '#1D7A3A', label: 'Checkin' },
  'Belum':   { bg: 'rgba(255,204,0,0.15)',  text: '#B8860B', label: 'Belum' },
  'Batal':   { bg: 'rgba(255,59,48,0.12)',  text: '#C0392B', label: 'Batal' },
  'Gagal':   { bg: 'rgba(255,149,0,0.12)',  text: '#B25000', label: 'Gagal' },
};

/* ─── PILL ────────────────────────────────────────────────────────── */
const Pill = ({ status }) => {
  const s = STATUS_COLOR[status] || { bg: 'rgba(0,0,0,0.06)', text: '#6E6E73', label: status || '—' };
  return <span className="pill" style={{ background: s.bg, color: s.text }}>{s.label}</span>;
};

/* ─── STAT CARD ───────────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, color = '#007AFF', icon }) => (
  <div className="apple-card stat-card-wrap" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 14, right: 16, fontSize: 26, opacity: 0.10, transition: 'opacity 0.2s ease, transform 0.2s ease' }}>{icon}</div>
    <div style={{ fontSize: 12, color: '#86868B', marginBottom: 6, fontWeight: 500, letterSpacing: '-0.1px' }}>{label}</div>
    <div style={{ fontSize: 30, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-1px', lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11.5, color: '#8E8E93', marginTop: 5, letterSpacing: '-0.1px' }}>{sub}</div>}
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: color, opacity: 0.5, borderRadius: '0 0 18px 18px', transition: 'opacity 0.2s ease' }} />
  </div>
);

/* ─── SECTION TITLE ───────────────────────────────────────────────── */
const SectionTitle = ({ children, icon }) => (
  <div className="section-header">
    {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
    <span>{children}</span>
  </div>
);

/* ─── TABLE WRAPPERS ──────────────────────────────────────────────── */
const TableWrap = ({ children }) => (
  <div style={{ overflowX: 'auto', borderRadius: 14, border: '0.5px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.92)' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', minWidth: 700 }}>
      {children}
    </table>
  </div>
);

const TH = ({ children, style = {} }) => (
  <th style={{
    padding: '11px 14px',
    background: 'rgba(246,246,246,0.97)',
    textAlign: 'left',
    fontWeight: 600,
    color: '#6E6E73',
    borderBottom: '0.5px solid rgba(0,0,0,0.07)',
    whiteSpace: 'nowrap',
    fontSize: 11.5,
    letterSpacing: '0.2px',
    textTransform: 'uppercase',
    ...style
  }}>{children}</th>
);

const TD = ({ children, style = {} }) => (
  <td style={{ padding: '10px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.04)', color: '#1D1D1F', fontSize: 12.5, letterSpacing: '-0.1px', ...style }}>
    {children}
  </td>
);

/* ─── LOADING STATE ───────────────────────────────────────────────── */
const LoadingState = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '36px 0', justifyContent: 'center', color: '#8E8E93', animation: 'fadeIn 0.2s ease' }}>
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: 'spin 0.85s linear infinite', flexShrink: 0 }}>
      <circle cx="9" cy="9" r="7.5" stroke="#007AFF" strokeWidth="2" strokeDasharray="22 25" />
    </svg>
    <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.1px' }}>Memuat data…</span>
  </div>
);

/* ─── TASK LABELS ─────────────────────────────────────────────────── */
const TASK_LABELS = {
  '3':  { label: 'Tunggu Pelayanan',  color: '#B25000', bg: 'rgba(255,149,0,0.12)',  icon: '⏳' },
  '4':  { label: 'Sedang Dilayani',   color: '#007AFF', bg: 'rgba(0,122,255,0.10)',  icon: '👨‍⚕️' },
  '5':  { label: 'Pelayanan Selesai', color: '#1D7A3A', bg: 'rgba(52,199,89,0.12)',  icon: '✓' },
  '6':  { label: 'Tunggu Farmasi',    color: '#6E3AED', bg: 'rgba(110,58,237,0.10)', icon: '💊' },
  '7':  { label: 'Farmasi Selesai',   color: '#1D7A3A', bg: 'rgba(52,199,89,0.15)',  icon: '🏁' },
  '99': { label: 'Batal',             color: '#C0392B', bg: 'rgba(255,59,48,0.10)',  icon: '✕' },
};

/* ─── MINI STAT ───────────────────────────────────────────────────── */
const MiniStat = ({ label, value, color = '#1D1D1F', bg = 'rgba(0,0,0,0.04)' }) => (
  <div className="mini-stat-card" style={{
    background: bg, borderRadius: 12, padding: '10px 14px',
    textAlign: 'center', minWidth: 90, flex: '1 1 90px',
    border: '0.5px solid rgba(0,0,0,0.06)',
  }}>
    <div style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: '-0.5px' }}>{value}</div>
    <div style={{ fontSize: 10.5, color: '#6E6E73', marginTop: 3, fontWeight: 500 }}>{label}</div>
  </div>
);

/* ─── APPLE PAGINATION ────────────────────────────────────────────── */
const ApplePagination = ({ page, totalPages, setPage }) => {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap', animation: 'fadeIn 0.2s ease' }}>
      <button className="apple-btn apple-btn-secondary" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
        style={{ padding: '5px 12px', opacity: page===1 ? 0.35 : 1 }}>‹ Prev</button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => idx+1).map(p => (
        <button key={p} className="apple-btn" onClick={() => setPage(p)}
          style={{ padding: '5px 11px', background: page===p ? '#007AFF' : 'rgba(0,0,0,0.05)', color: page===p ? '#fff' : '#1D1D1F', fontWeight: page===p ? 700 : 400, boxShadow: page===p ? '0 2px 8px rgba(0,122,255,0.35)' : 'none' }}>{p}</button>
      ))}
      <button className="apple-btn apple-btn-secondary" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
        style={{ padding: '5px 12px', opacity: page===totalPages ? 0.35 : 1 }}>Next ›</button>
    </div>
  );
};

/* ─── TEMPAT TIDUR ────────────────────────────────────────────────── */
const TempurTidurSection = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/monitoring/tempat-tidur')
      .then(r => { if (r.data.success) setData(r.data.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const total  = data.reduce((a, b) => a + (b.total  || 0), 0);
  const terisi = data.reduce((a, b) => a + (b.terisi || 0), 0);
  const kosong = total - terisi;

  return (
    <div>
      <SectionTitle icon="🛏">Ketersediaan Tempat Tidur</SectionTitle>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <StatCard label="Total TT" value={loading ? '…' : total}  color="#007AFF" icon="🏥" />
        <StatCard label="Terisi"   value={loading ? '…' : terisi} color="#FF3B30" sub={`${total ? Math.round(terisi/total*100) : 0}% BOR`} icon="🛌" />
        <StatCard label="Tersedia" value={loading ? '…' : kosong} color="#34C759" icon="✓" />
      </div>
      {loading ? <LoadingState /> : (
        <TableWrap>
          <thead>
            <tr><TH>Ruangan</TH><TH>Kelas</TH><TH>Total TT</TH><TH>Terisi</TH><TH>Kosong</TH><TH>BOR</TH><TH>Last Update</TH></tr>
          </thead>
          <tbody>
            {data.length === 0
              ? <tr><TD style={{ textAlign: 'center', color: '#8E8E93', padding: 32 }} colSpan={7}>Tidak ada data tempat tidur</TD></tr>
              : data.map((row, i) => (
                <tr key={i} className="apple-table-row" style={{ animationDelay: `${i*0.03}s` }}>
                  <TD>{fmt(row.nm_bangsal)}</TD>
                  <TD><span className="pill" style={{ background: 'rgba(0,122,255,0.1)', color: '#007AFF' }}>{fmt(row.kelas)}</span></TD>
                  <TD style={{ fontWeight: 600 }}>{fmt(row.total)}</TD>
                  <TD style={{ color: '#FF3B30', fontWeight: 600 }}>{fmt(row.terisi)}</TD>
                  <TD style={{ color: '#34C759', fontWeight: 600 }}>{fmt(row.kosong)}</TD>
                  <TD>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="bor-bar" style={{ flex: 1 }}>
                        <div className="bor-fill" style={{ width: `${row.total ? Math.min(100, row.terisi/row.total*100) : 0}%`, background: row.terisi/row.total > 0.8 ? '#FF3B30' : '#34C759' }} />
                      </div>
                      <span style={{ fontSize: 11.5, color: '#6E6E73', fontWeight: 500, minWidth: 30, textAlign: 'right' }}>
                        {row.total ? Math.round(row.terisi/row.total*100) : 0}%
                      </span>
                    </div>
                  </TD>
                  <TD style={{ fontSize: 11, color: '#8E8E93' }}>{fmt(row.last_update)}</TD>
                </tr>
              ))}
          </tbody>
        </TableWrap>
      )}
      {/* ── BOR Target langsung di bawah ── */}
      <BorTargetSection />
    </div>
  );
};

/* ─── BOR TARGET ──────────────────────────────────────────────────── */
const BorTargetSection = () => {
  const [dataBor, setDataBor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tanggal, setTanggal] = useState(today());

  useEffect(() => {
    setLoading(true);
    axios.get('/api/monitoring/bor', { params: { tanggal } })
      .then(r => { if (r.data.success) setDataBor(r.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [tanggal]);

  const t = (key) => dataBor?.targets?.[key] || {};

  return (
    <div style={{ marginTop: 32 }}>
      <SectionTitle icon="📈">Target BOR & Realisasi</SectionTitle>
      {loading ? <LoadingState /> : (
        <>
          <div className="stat-grid">
            <StatCard label="BOR Realisasi" value={`${dataBor?.bor_realisasi || 0}%`}
              sub={`TT: ${dataBor?.total_tempat_tidur || 0} · Terisi: ${dataBor?.total_terisi || 0}`}
              color="#007AFF" icon="📊" />
            {['harian','bulanan','tahunan'].map(k => (
              <StatCard key={k} label={`Target ${k.charAt(0).toUpperCase()+k.slice(1)}`}
                value={`${t(k).target || 0}%`}
                sub={`Selisih: ${t(k).selisih >= 0 ? '+' : ''}${t(k).selisih || 0}%`}
                color={t(k).selisih >= 0 ? '#34C759' : '#FF3B30'} />
            ))}
          </div>
          <TableWrap>
            <thead>
              <tr><TH>Kelas Kamar</TH><TH>Total TT</TH><TH>Terisi</TH><TH>Tersedia</TH><TH>BOR</TH></tr>
            </thead>
            <tbody>
              {dataBor?.bor_harian?.map((item, i) => (
                <tr key={i} className="apple-table-row" style={{ animationDelay: `${i*0.03}s` }}>
                  <TD style={{ fontWeight: 600 }}>{item.namakelas}</TD>
                  <TD style={{ textAlign: 'center', fontWeight: 600 }}>{item.total_tt}</TD>
                  <TD style={{ textAlign: 'center', color: '#FF3B30', fontWeight: 600 }}>{item.terisi}</TD>
                  <TD style={{ textAlign: 'center', color: '#34C759', fontWeight: 600 }}>{item.tersedia}</TD>
                  <TD style={{ textAlign: 'center' }}>
                    <span className="pill" style={{
                      background: item.bor >= 80 ? 'rgba(255,59,48,0.12)' : item.bor >= 60 ? 'rgba(255,204,0,0.15)' : 'rgba(52,199,89,0.12)',
                      color: item.bor >= 80 ? '#C0392B' : item.bor >= 60 ? '#B8860B' : '#1D7A3A'
                    }}>{item.bor}%</span>
                  </TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </>
      )}
    </div>
  );
};

/* ─── START ANTROL ────────────────────────────────────────────────── */
// Props opsional: computedStats + loadingExternal (dipakai overview, dihitung dari data antrol-pertanggal)
// Kalau tidak di-pass, fetch sendiri dari /start-antrol (standalone)
const StartAntrolSection = ({ selectedDate, computedStats, loadingExternal }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const useExternal = computedStats !== undefined;

  useEffect(() => {
    if (useExternal) return;
    setLoading(true);
    axios.get('/api/monitoring/start-antrol', { params: { tanggal: selectedDate } })
      .then(r => { if (r.data.success) setData(r.data.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [selectedDate, useExternal]);

  const isLoading = useExternal ? loadingExternal : loading;
  const src       = useExternal ? computedStats : data;

  const v   = (key) => isLoading ? '…' : fmt(src?.[key]);
  const pct = (a, b) => (!isLoading && src?.[b] > 0) ? ` (${Math.round(src[a] / src[b] * 100)}%)` : '';
  const taskVal = (tid) => {
    const keyMap = { '3':'tunggu_pelayanan','4':'dilayani','5':'selesai_dilayani','6':'tunggu_farmasi','7':'selesai','99':'batal_taskid' };
    return isLoading ? '…' : fmt(src?.[keyMap[tid]]);
  };

  return (
    <div>
      <SectionTitle icon="🎫">Antrian Per Tanggal JKN</SectionTitle>
      <div className="mini-stat-grid">
        <MiniStat label="Total Belum"                                     value={v('total_belum')}    color="#B8860B" bg="rgba(255,204,0,0.1)" />
        <MiniStat label="Total Selesai"                                   value={v('total_selesai')}  color="#1D7A3A" bg="rgba(52,199,89,0.1)" />
        <MiniStat label="SEP Terbit"                                      value={v('sep_terbit')}     color="#007AFF" bg="rgba(0,122,255,0.1)" />
        <MiniStat label={`JKN Belum${pct('jkn_belum','jkn_total')}`}     value={v('jkn_belum')}      color="#B8860B" bg="rgba(255,204,0,0.1)" />
        <MiniStat label={`JKN Selesai${pct('jkn_selesai','jkn_total')}`} value={v('jkn_selesai')}    color="#1D7A3A" bg="rgba(52,199,89,0.1)" />
        <MiniStat label="Non JKN Belum"                                   value={v('non_jkn_belum')}  color="#B8860B" bg="rgba(255,204,0,0.1)" />
        <MiniStat label="Non JKN Selesai"                                 value={v('non_jkn_selesai')}color="#1D7A3A" bg="rgba(52,199,89,0.1)" />
        <MiniStat label={`MJKN Belum${pct('mjkn_belum','mjkn_total')}`}  value={v('mjkn_belum')}     color="#B8860B" bg="rgba(255,204,0,0.1)" />
        <MiniStat label={`MJKN Selesai${pct('mjkn_selesai','mjkn_total')}`} value={v('mjkn_selesai')} color="#1D7A3A" bg="rgba(52,199,89,0.1)" />
        <MiniStat label="Record"                                          value={v('record')}         color="#1D1D1F" bg="rgba(0,0,0,0.05)" />
      </div>
      <div className="mini-stat-grid">
        <MiniStat label="SEP Rawat Jalan"   value={v('sep_ralan')}      color="#0891b2" bg="rgba(8,145,178,0.1)" />
        <MiniStat label="SEP Rawat Inap"    value={v('sep_ranap')}      color="#6E3AED" bg="rgba(110,58,237,0.1)" />
        <MiniStat label="Total Batal"       value={v('total_batal')}    color="#C0392B" bg="rgba(255,59,48,0.1)" />
        <MiniStat label="MJKN Total"        value={v('mjkn_total')}     color="#007AFF" bg="rgba(0,122,255,0.08)" />
        <MiniStat label="JKN (Loket) Total" value={v('jkn_total')}      color="#007AFF" bg="rgba(0,122,255,0.08)" />
        <MiniStat label="Non JKN Total"     value={v('non_jkn_total')}  color="#1D1D1F" bg="rgba(0,0,0,0.05)" />
      </div>
      <div style={{ background: 'rgba(0,0,0,0.022)', borderRadius: 14, padding: '14px 16px', marginTop: 8, border: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 11, color: '#6E6E73', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Alur Status Pelayanan (MJKN Checkin)
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {['3','4','5','6','7','99'].map((tid, idx, arr) => {
            const t = TASK_LABELS[tid];
            return (
              <React.Fragment key={tid}>
                <div className="mini-stat-card" style={{ background: t.bg, borderRadius: 12, padding: '8px 12px', textAlign: 'center', minWidth: 80 }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{t.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: t.color, letterSpacing: '-0.5px' }}>{taskVal(tid)}</div>
                  <div style={{ fontSize: 9.5, color: t.color, fontWeight: 600, marginTop: 2, opacity: 0.8 }}>{t.label}</div>
                </div>
                {idx < arr.length - 2 && <div style={{ color: '#C7C7CC', fontSize: 14, transition: 'color 0.2s ease' }}>›</div>}
                {idx === arr.length - 2 && <div style={{ color: '#FFCDD2', fontSize: 12, margin: '0 2px', opacity: 0.5 }}>|</div>}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ─── DETAIL ANTROL ───────────────────────────────────────────────── */
const DetailAntrolSection = ({ selectedDate }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    setLoading(true); setPage(1);
    axios.get('/api/monitoring/detail-antrol', { params: { tanggal: selectedDate, search } })
      .then(r => { if (r.data.success) setData(r.data.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [selectedDate, search]);

  const filtered   = data.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(data.length / perPage);
  const isLate     = (a, b) => (!a || !b || a === '—' || b === '—') ? false : a > b;

  return (
    <div>
      <SectionTitle icon="📊">Detail Antrol Harian</SectionTitle>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <input className="apple-input" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama / no RM / no SEP…" style={{ width: 280 }} />
        <span style={{ color: '#8E8E93', fontSize: 12.5, fontWeight: 500, animation: 'fadeIn 0.2s ease' }}>{data.length} data</span>
      </div>
      {loading ? <LoadingState /> : (
        <div style={{ animation: 'scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <TableWrap>
            <thead>
              <tr>
                <TH>#</TH><TH>No RM</TH><TH>Nama Pasien</TH><TH>No SEP</TH>
                <TH>Poli</TH><TH>Dokter</TH><TH>Jam SEP</TH><TH>Jam Praktek</TH>
                <TH>Kesesuaian</TH><TH>Status Antrol</TH><TH>Status Alur</TH>
                <TH>Waktu Task</TH><TH>Dilayani</TH><TH>Selesai</TH>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={14} style={{ textAlign: 'center', padding: 36, color: '#8E8E93', fontSize: 13 }}>Tidak ada data</td></tr>
                : filtered.map((row, i) => {
                  const late = isLate(row.jam_sep, row.jam_praktek);
                  const t    = TASK_LABELS[String(row.last_taskid)] || null;
                  return (
                    <tr key={i} className="apple-table-row" style={{ animationDelay: `${i*0.025}s` }}>
                      <TD style={{ color: '#8E8E93' }}>{(page - 1) * perPage + i + 1}</TD>
                      <TD style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11.5 }}>{fmt(row.no_rm)}</TD>
                      <TD style={{ fontWeight: 600 }}>{fmt(row.nama)}</TD>
                      <TD style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{fmt(row.no_sep)}</TD>
                      <TD>{fmt(row.poli)}</TD><TD>{fmt(row.dokter)}</TD>
                      <TD style={{ fontWeight: 600 }}>{fmtTime(row.jam_sep)}</TD>
                      <TD>{fmtTime(row.jam_praktek)}</TD>
                      <TD>
                        {row.jam_sep && row.jam_sep !== '—' && row.jam_praktek && row.jam_praktek !== '—'
                          ? <span className="pill" style={{ background: late ? 'rgba(255,59,48,0.1)' : 'rgba(52,199,89,0.1)', color: late ? '#C0392B' : '#1D7A3A' }}>
                              {late ? '⚠ Telat' : '✓ Sesuai'}
                            </span>
                          : '—'}
                      </TD>
                      <TD><Pill status={row.status} /></TD>
                      <TD>
                        {t ? <span className="pill" style={{ background: t.bg, color: t.color }}>{t.icon} {t.label}</span>
                           : <span style={{ color: '#C7C7CC' }}>—</span>}
                      </TD>
                      <TD style={{ color: '#6E6E73' }}>{fmtTime(row.waktu_task)}</TD>
                      <TD>{fmtTime(row.jam_dilayani)}</TD>
                      <TD>{fmtTime(row.jam_selesai)}</TD>
                    </tr>
                  );
                })}
            </tbody>
          </TableWrap>
          <ApplePagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      )}
    </div>
  );
};

/* ─── SEP VCLAIM ──────────────────────────────────────────────────── */
const SepVclaimSection = ({ selectedDate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/monitoring/sep-vclaim', { params: { tanggal: selectedDate } })
      .then(r => { if (r.data.success) setData(r.data.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [selectedDate]);

  return (
    <div>
      <SectionTitle icon="📋">SEP VClaim</SectionTitle>
      <div className="stat-grid">
        <StatCard label="Total SEP Terbit" value={loading ? '…' : fmt(data?.total)}      color="#007AFF" icon="📄" />
        <StatCard label="Rawat Jalan"       value={loading ? '…' : fmt(data?.rawatJalan)} color="#34AADC" icon="🏃" />
        <StatCard label="Rawat Inap"        value={loading ? '…' : fmt(data?.rawatInap)}  color="#6E3AED" icon="🛌" />
        <StatCard label="SEP Kontrol"       value={loading ? '…' : fmt(data?.sepKontrol)} color="#34C759" icon="↩" sub="Surat kontrol" />
      </div>
    </div>
  );
};

/* ─── SURAT KONTROL ───────────────────────────────────────────────── */
const SuratKontrolSection = ({ selectedDate }) => {
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tglSep, setTglSep]         = useState(selectedDate);
  const [tglRencana, setTglRencana] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = {};
    if (tglSep) params.tgl_sep = tglSep;
    if (tglRencana) params.tgl_rencana = tglRencana;
    axios.get('/api/monitoring/surat-kontrol', { params })
      .then(r => { if (r.data.success) setData(r.data.data); else setData([]); })
      .catch(() => setData([])).finally(() => setLoading(false));
  }, [tglSep, tglRencana]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setTglSep(selectedDate); }, [selectedDate]);

  const sesuaiCount      = data.filter(r => r.selisih_hari !== null && r.selisih_hari > 0).length;
  const tidakSesuaiCount = data.filter(r => r.selisih_hari !== null && r.selisih_hari <= 0).length;

  return (
    <div>
      <SectionTitle icon="📝">Kesesuaian Surat Kontrol</SectionTitle>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 18, padding: '14px 16px', background: 'rgba(0,0,0,0.022)', borderRadius: 14, border: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div>
          <div style={{ fontSize: 11, color: '#6E6E73', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Tgl SEP Terbit</div>
          <input type="date" className="apple-input" value={tglSep} onChange={e => setTglSep(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6E6E73', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Tgl Rencana Kontrol</div>
          <input type="date" className="apple-input" value={tglRencana} onChange={e => setTglRencana(e.target.value)} />
        </div>
        <button className="apple-btn apple-btn-secondary" onClick={() => { setTglSep(''); setTglRencana(''); }}>Reset</button>
        {!loading && data.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', animation: 'fadeIn 0.2s ease' }}>
            <span className="pill" style={{ background: 'rgba(52,199,89,0.12)', color: '#1D7A3A' }}>✓ Sesuai: {sesuaiCount}</span>
            <span className="pill" style={{ background: 'rgba(255,59,48,0.10)', color: '#C0392B' }}>⚠ Tidak Sesuai: {tidakSesuaiCount}</span>
            <span className="pill" style={{ background: 'rgba(0,0,0,0.06)', color: '#6E6E73' }}>Total: {data.length}</span>
          </div>
        )}
      </div>
      {loading ? <LoadingState /> : (
        <div style={{ animation: 'scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <TableWrap>
            <thead>
              <tr><TH>No RM</TH><TH>Nama</TH><TH>Poli</TH><TH>Dokter</TH><TH>No Surat</TH><TH>Tgl Surat</TH><TH>Tgl Rencana</TH><TH>No SEP</TH><TH>Tgl SEP</TH><TH>Selisih</TH><TH>Kesesuaian</TH></tr>
            </thead>
            <tbody>
              {data.length === 0
                ? <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#8E8E93', fontSize: 13 }}>Tidak ada data — coba ubah filter tanggal</td></tr>
                : data.map((row, i) => {
                  const selisih = row.selisih_hari;
                  const sesuai  = selisih !== null && selisih > 0;
                  return (
                    <tr key={i} className="apple-table-row" style={{ animationDelay: `${i*0.025}s` }}>
                      <TD style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11.5 }}>{fmt(row.no_rm)}</TD>
                      <TD style={{ fontWeight: 600 }}>{fmt(row.nama)}</TD>
                      <TD style={{ fontSize: 12 }}>{fmt(row.poli)}</TD>
                      <TD style={{ fontSize: 12 }}>{fmt(row.dokter)}</TD>
                      <TD style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace' }}>{fmt(row.no_surat)}</TD>
                      <TD>{fmt(row.tgl_surat)}</TD>
                      <TD style={{ fontWeight: 600, color: '#007AFF' }}>{fmt(row.tgl_rencana)}</TD>
                      <TD style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace' }}>{fmt(row.no_sep)}</TD>
                      <TD>{fmt(row.tgl_sep)}</TD>
                      <TD style={{ textAlign: 'center', fontWeight: 700, color: selisih < 0 ? '#FF3B30' : '#6E6E73' }}>
                        {selisih !== null ? (selisih < 0 ? `${selisih}` : `+${selisih}`) : '—'}
                      </TD>
                      <TD>
                        <span className="pill" style={{ background: sesuai ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.10)', color: sesuai ? '#1D7A3A' : '#C0392B' }}>
                          {sesuai ? '✓ Sesuai' : selisih === null ? '? N/A' : '⚠ Tidak Sesuai'}
                        </span>
                      </TD>
                    </tr>
                  );
                })}
            </tbody>
          </TableWrap>
        </div>
      )}
    </div>
  );
};

/* ─── JADWAL OPERASI ──────────────────────────────────────────────── */
const JadwalOperasiSection = ({ selectedDate }) => {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/monitoring/jadwal-operasi', { params: { tanggal: selectedDate } })
      .then(r => { if (r.data.success) setData(r.data.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [selectedDate]);

  return (
    <div>
      <SectionTitle icon="🔬">Jadwal Operasi (TMO)</SectionTitle>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <StatCard label="Total TMO" value={loading ? '…' : data.length}                                          color="#6E3AED" icon="🔬" />
        <StatCard label="Selesai"   value={loading ? '…' : data.filter(d => d.status_operasi === 'Selesai').length} color="#34C759" icon="✓" />
        <StatCard label="Proses"    value={loading ? '…' : data.filter(d => d.status_operasi === 'Proses').length}  color="#FF9500" icon="⏳" />
      </div>
      {loading ? <LoadingState /> : (
        <div style={{ animation: 'scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <TableWrap>
            <thead>
              <tr><TH>#</TH><TH>No RM</TH><TH>Nama</TH><TH>No Rawat</TH><TH>Tgl Operasi</TH><TH>Jam Mulai</TH><TH>Jenis Operasi</TH><TH>Dokter Operator</TH><TH>Status</TH></tr>
            </thead>
            <tbody>
              {data.length === 0
                ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: '#8E8E93', fontSize: 13 }}>Tidak ada jadwal operasi</td></tr>
                : data.map((row, i) => (
                  <tr key={i} className="apple-table-row" style={{ animationDelay: `${i*0.025}s` }}>
                    <TD style={{ color: '#8E8E93' }}>{i + 1}</TD>
                    <TD style={{ fontFamily: 'ui-monospace, monospace' }}>{fmt(row.no_rm)}</TD>
                    <TD style={{ fontWeight: 600 }}>{fmt(row.nama)}</TD>
                    <TD style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{fmt(row.no_rawat)}</TD>
                    <TD>{fmt(row.tgl_operasi)}</TD>
                    <TD style={{ fontWeight: 700 }}>{fmtTime(row.jam_mulai)}</TD>
                    <TD>{fmt(row.jenis_operasi)}</TD>
                    <TD>{fmt(row.dokter_operator)}</TD>
                    <TD>
                      <span className="pill" style={{
                        background: row.status_operasi === 'Selesai' ? 'rgba(52,199,89,0.12)' : row.status_operasi === 'Proses' ? 'rgba(255,149,0,0.12)' : 'rgba(0,0,0,0.06)',
                        color: row.status_operasi === 'Selesai' ? '#1D7A3A' : row.status_operasi === 'Proses' ? '#B25000' : '#6E6E73'
                      }}>{fmt(row.status_operasi)}</span>
                    </TD>
                  </tr>
                ))}
            </tbody>
          </TableWrap>
        </div>
      )}
    </div>
  );
};

/* ─── STATUS ANTROL MAP ───────────────────────────────────────────── */
const STATUS_ANTROL = {
  'Checkin':          { bg: 'rgba(52,199,89,0.12)',  color: '#1D7A3A', label: 'Checkin' },
  'Belum':            { bg: 'rgba(255,204,0,0.15)',  color: '#B8860B', label: 'Belum' },
  'Batal':            { bg: 'rgba(255,59,48,0.10)',  color: '#C0392B', label: 'Batal' },
  'Gagal':            { bg: 'rgba(255,149,0,0.12)',  color: '#B25000', label: 'Gagal' },
  'Selesai dilayani': { bg: 'rgba(52,199,89,0.12)',  color: '#1D7A3A', label: 'Selesai dilayani' },
  'Belum dilayani':   { bg: 'rgba(255,204,0,0.15)',  color: '#B8860B', label: 'Belum dilayani' },
};

/* ─── ANTROL TAB ──────────────────────────────────────────────────── */
const AntrolTab = ({ selectedDate, externalData, externalLoading }) => {
  const [internalData, setInternalData]   = useState([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const useExternal = externalData !== undefined;
  const data    = useExternal ? externalData    : internalData;
  const loading = useExternal ? externalLoading : internalLoading;
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage]                 = useState(1);
  const perPage = 20;

  const [modalOpen, setModalOpen]       = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData]       = useState([]);
  const [modalBooking, setModalBooking] = useState('');
  const [modalNama, setModalNama]       = useState('');

  const handleRowClick = (row) => {
    setModalOpen(true);
    setModalLoading(true);
    setModalData([]);
    setModalBooking(row.nobooking);
    setModalNama(row.nama);

    const fetchTaskId = (attempt = 1) => {
      fetch(`/api/monitoring/taskid/${row.nobooking}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            setModalData(data.data);
            setModalLoading(false);
          } else if (attempt < 4) {
            // retry sampai 3x dengan jeda 800ms kalau data masih kosong
            setTimeout(() => fetchTaskId(attempt + 1), 800);
          } else {
            setModalLoading(false);
          }
        })
        .catch(() => {
          if (attempt < 4) setTimeout(() => fetchTaskId(attempt + 1), 800);
          else setModalLoading(false);
        });
    };
    fetchTaskId();
  };

  useEffect(() => {
    if (useExternal) { setPage(1); return; }
    setInternalLoading(true); setPage(1);
    axios.get('/api/monitoring/antrol-pertanggal', {
      params: { tanggal: selectedDate, search, status: filterStatus }
    })
      .then(r => { if (r.data.success) setInternalData(r.data.data); else setInternalData([]); })
      .catch(() => setInternalData([])).finally(() => setInternalLoading(false));
  }, [selectedDate, search, filterStatus, useExternal]);

  const filtered   = data.slice((page-1)*perPage, page*perPage);
  const totalPages = Math.ceil(data.length / perPage);

  const isBatal    = (r) => r.status_antrol === 'Batal' || String(r.last_taskid) === '99';
  const isSelesai  = (r) => r.status_antrol === 'Selesai dilayani' || ['5','7'].includes(String(r.last_taskid));
  const isBelum    = (r) => !isSelesai(r) && !isBatal(r);
  const hasSep     = (r) => r.no_sep && r.no_sep !== '—' && r.no_sep !== null;
  const isMjkn     = (r) => r.sumber === 'Mobile JKN' || r.sumber === 'MJKN';

  const totalSelesai   = data.filter(isSelesai).length;
  const totalBelum     = data.filter(isBelum).length;
  const totalBatal     = data.filter(isBatal).length;
  const sepTerbit      = data.filter(hasSep).length;
  const mjknTotal      = data.filter(isMjkn).length;
  const mjknSelesai    = data.filter(r => isMjkn(r) && isSelesai(r)).length;
  const mjknBelum      = data.filter(r => isMjkn(r) && isBelum(r)).length;
  const nonMjknSelesai = data.filter(r => !isMjkn(r) && isSelesai(r)).length;
  const nonMjknBelum   = data.filter(r => !isMjkn(r) && isBelum(r)).length;

  const thS = { padding:'10px 12px', textAlign:'left', fontWeight:600, color:'#6E6E73', borderBottom:'0.5px solid rgba(0,0,0,0.07)', whiteSpace:'nowrap', fontSize:11, letterSpacing:'0.2px', textTransform:'uppercase', background:'rgba(246,246,246,0.97)' };
  const tdS = { padding:'9px 12px', color:'#1D1D1F', fontSize:12.5, letterSpacing:'-0.1px', borderBottom:'0.5px solid rgba(0,0,0,0.04)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.4px' }}>Detail Task ID</div>
                <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 3 }}>{modalBooking} · {modalNama}</div>
              </div>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            {modalLoading
              ? <LoadingState />
              : modalData.length === 0
                ? <p style={{ textAlign: 'center', color: '#8E8E93', padding: 30, fontSize: 13 }}>Tidak ada data task dari BPJS</p>
                : modalData.map((t, i) => {
                  const tl = TASK_LABELS[String(t.taskid)] || { label: t.taskname, color: '#6E6E73', bg: 'rgba(0,0,0,0.05)', icon: '📌' };
                  const labelStyle = { width: 110, minWidth: 110, color: '#6E6E73', fontWeight: 500, fontSize: 12.5, paddingRight: 4, verticalAlign: 'top' };
                  const sepStyle   = { width: 12, color: '#C7C7CC', fontSize: 12.5, verticalAlign: 'top' };
                  const valStyle   = { fontWeight: 600, fontFamily: 'ui-monospace, monospace', fontSize: 12.5, color: '#1D1D1F', verticalAlign: 'top', wordBreak: 'break-all' };
                  const rows = [
                    { label: 'Waktu RS',     val: t.wakturs || '—',                                         style: {} },
                    { label: 'Waktu',        val: t.waktu   || '—',                                         style: {} },
                    { label: 'Task Name',    val: `${tl.icon} ${t.taskname || '—'}`,                        style: { fontFamily: 'inherit', color: tl.color } },
                    { label: 'Task ID',      val: String(t.taskid ?? '—'),                                  style: {} },
                    { label: 'Kode Booking', val: t.kodebooking || modalBooking || '—',                     style: {} },
                  ];
                  return (
                    <div key={i} style={{ background: tl.bg, borderRadius: 12, padding: '14px 16px', marginBottom: 10, border: `0.5px solid ${tl.color}22`, animation: `rowIn 0.22s cubic-bezier(0.34,1.56,0.64,1) ${i*0.05}s both` }}>
                      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                        <tbody>
                          {rows.map((r, ri) => (
                            <tr key={ri}>
                              <td style={labelStyle}>{r.label}</td>
                              <td style={sepStyle}>:</td>
                              <td style={{ ...valStyle, ...r.style }}>{r.val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="apple-card" style={{ padding: '14px 18px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="apple-input" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama / no RM / no booking / NIK…" style={{ width: 280 }} />
        <select className="apple-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="Belum">Belum Dilayani</option>
          <option value="Checkin">Selesai Dilayani</option>
          <option value="Batal">Batal</option>
          <option value="Gagal">Gagal</option>
        </select>
        <span style={{ color: '#8E8E93', fontSize: 12.5, fontWeight: 500 }}>{data.length} record</span>
        {/* <button className="apple-btn apple-btn-primary" style={{ marginLeft: 'auto' }}
          onClick={() => {
            axios.post('/api/monitoring/sync-taskid', { tanggal: selectedDate })
              .then(r => { console.log('SYNC RESPONSE:', r.data); alert(JSON.stringify(r.data, null, 2)); })
              .catch(err => { console.log('SYNC ERROR:', err); alert('Error: ' + (err.response?.data?.message || err.response?.status || err.message)); });
          }}>
          ↻ Sync Task ID
        </button> */}
      </div>

      {/* Table */}
      <div className="apple-card" style={{ overflow: 'hidden' }}>
        {loading ? <LoadingState /> : (
          <div style={{ overflowX: 'auto', animation: 'scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1200 }}>
              <thead>
                <tr>
                  {['#','Kode Booking','No RM','Nama','No Kartu','NIK','Poli','Dokter','Jam Praktek','Tgl Periksa','No Antrean','Estimasi','Jenis','Sumber','No SEP','Status Antrol','Status Alur','Waktu Booking'].map(h => (
                    <th key={h} style={thS}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={18} style={{ textAlign: 'center', padding: 40, color: '#8E8E93', fontSize: 13 }}>Tidak ada data</td></tr>
                  : filtered.map((row, i) => {
                    const stAntrol  = STATUS_ANTROL[row.status] || { bg: 'rgba(0,0,0,0.05)', color: '#6E6E73', label: row.status || '—' };
                    const tl        = TASK_LABELS[String(row.last_taskid || '')] || null;
                    const mjkn      = isMjkn(row);
                    const alur      = row.status_alur;
                    const alurMap   = {
                      'Tunggu Pelayanan': { bg:'rgba(255,149,0,0.12)',   color:'#B25000', icon:'⏳' },
                      'Sedang Dilayani':  { bg:'rgba(0,122,255,0.10)',   color:'#007AFF', icon:'👨‍⚕️' },
                      'Selesai Dilayani': { bg:'rgba(52,199,89,0.12)',   color:'#1D7A3A', icon:'✓' },
                      'Tunggu Farmasi':   { bg:'rgba(110,58,237,0.10)',  color:'#6E3AED', icon:'💊' },
                      'Selesai':          { bg:'rgba(52,199,89,0.15)',   color:'#1D7A3A', icon:'🏁' },
                      'Batal':            { bg:'rgba(255,59,48,0.10)',   color:'#C0392B', icon:'✕' },
                      'Belum':            { bg:'rgba(255,204,0,0.12)',   color:'#B8860B', icon:'🕐' },
                    };
                    const alurStyle = alurMap[alur];
                    return (
                      <tr key={i} className="apple-table-row" onClick={() => handleRowClick(row)}
                        style={{ cursor: 'pointer', animationDelay: `${i*0.02}s` }}>
                        <td style={{ ...tdS, color:'#8E8E93' }}>{(page-1)*perPage+i+1}</td>
                        <td style={{ ...tdS, fontFamily:'ui-monospace,monospace', fontSize:11 }}>{fmt(row.nobooking)}</td>
                        <td style={{ ...tdS, fontFamily:'ui-monospace,monospace' }}>{fmt(row.no_rm)}</td>
                        <td style={{ ...tdS, fontWeight:600, whiteSpace:'nowrap' }}>{fmt(row.nama)}</td>
                        <td style={{ ...tdS, fontFamily:'ui-monospace,monospace', fontSize:11 }}>{fmt(row.nomorkartu)}</td>
                        <td style={{ ...tdS, fontFamily:'ui-monospace,monospace', fontSize:11 }}>{fmt(row.nik)}</td>
                        <td style={tdS}>{fmt(row.nm_poli)}</td>
                        <td style={{ ...tdS, whiteSpace:'nowrap' }}>{fmt(row.nm_dokter)}</td>
                        <td style={{ ...tdS, textAlign:'center' }}>{fmt(row.jampraktek)}</td>
                        <td style={{ ...tdS, textAlign:'center' }}>{fmt(row.tanggalperiksa)}</td>
                        <td style={{ ...tdS, textAlign:'center', fontWeight:700, color:'#007AFF' }}>{fmt(row.nomorantrean)}</td>
                        <td style={{ ...tdS, textAlign:'center' }}>{fmt(row.estimasidilayani)}</td>
                        <td style={{ ...tdS, fontSize:11 }}>{fmt(row.jeniskunjungan)}</td>
                        <td style={tdS}>
                          <span className="pill" style={{ background: mjkn ? 'rgba(110,58,237,0.1)':'rgba(0,0,0,0.05)', color: mjkn ? '#6E3AED':'#6E6E73' }}>
                            {mjkn ? '📱 MJKN' : '🖥 Loket'}
                          </span>
                        </td>
                        <td style={{ ...tdS, fontFamily:'ui-monospace,monospace', fontSize:10 }}>{fmt(row.no_sep)}</td>
                        <td style={tdS}>
                          <span className="pill" style={{ background:stAntrol.bg, color:stAntrol.color }}>{stAntrol.label}</span>
                        </td>
                        <td style={tdS}>
                          {alurStyle
                            ? <span className="pill" style={{ background:alurStyle.bg, color:alurStyle.color, whiteSpace:'nowrap' }}>{alurStyle.icon} {alur}</span>
                            : <span style={{ color:'#C7C7CC' }}>—</span>}
                        </td>
                        <td style={{ ...tdS, fontSize:11, color:'#8E8E93' }}>{fmt(row.waktu_booking)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
        <ApplePagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>

      {/* Footer stats */}
      <div style={{
        background: 'linear-gradient(135deg, #afafb6 0%, #a3a3d6 100%)',
        borderRadius: 16, padding: '16px 22px',
        display: 'flex', gap: 0, flexWrap: 'wrap',
        boxShadow: '0 8px 28px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.14)',
        animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {[
          { label: 'Total Belum',      value: totalBelum,     color: '#FFD60A' },
          { label: 'Total Selesai',    value: totalSelesai,   color: '#32D74B' },
          { label: 'Total Batal',      value: totalBatal,     color: '#FF453A' },
          { label: 'MJKN Total',       value: mjknTotal,      color: '#BF5AF2' },
          { label: 'MJKN Selesai',     value: mjknSelesai,    color: '#32D74B' },
          { label: 'MJKN Belum',       value: mjknBelum,      color: '#FFD60A' },
          { label: 'Non-MJKN Selesai', value: nonMjknSelesai, color: '#32D74B' },
          { label: 'Non-MJKN Belum',   value: nonMjknBelum,   color: '#FFD60A' },
          { label: 'Record',           value: data.length,    color: '#48484A' },
          ...(mjknTotal > 0 ? [{ label: 'MJKN Selesai %', value: `${Math.round(mjknSelesai/mjknTotal*100)}%`, color: '#32D74B' }] : []),
        ].map((s, i, arr) => (
          <div key={i} className="footer-stat" style={{ textAlign: 'center', flex: '1 1 80px', padding: '4px 0', borderRight: i < arr.length-1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: '-0.5px', transition: 'color 0.2s ease' }}>{s.value}</div>
            <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── OVERVIEW ANTROL SECTION ────────────────────────────────────── */
// Fetch sekali dari antrol-pertanggal, hitung stats, pass ke StartAntrolSection + AntrolTab
const OverviewAntrolSection = ({ selectedDate }) => {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/monitoring/antrol-pertanggal', { params: { tanggal: selectedDate } })
      .then(r => { if (r.data.success) setData(r.data.data); else setData([]); })
      .catch(() => setData([])).finally(() => setLoading(false));
  }, [selectedDate]);

  const isBatal   = (r) => r.status_antrol === 'Batal' || String(r.last_taskid) === '99';
  const isSelesai = (r) => r.status_antrol === 'Selesai dilayani' || ['5','7'].includes(String(r.last_taskid));
  const isBelum   = (r) => !isSelesai(r) && !isBatal(r);
  const hasSep    = (r) => r.no_sep && r.no_sep !== '—' && r.no_sep !== null;
  const isMjkn    = (r) => r.sumber === 'Mobile JKN' || r.sumber === 'MJKN';
  const isLoket   = (r) => !isMjkn(r);

  const totalSelesai   = data.filter(isSelesai).length;
  const totalBelum     = data.filter(isBelum).length;
  const totalBatal     = data.filter(isBatal).length;
  const mjknTotal      = data.filter(isMjkn).length;
  const mjknSelesai    = data.filter(r => isMjkn(r) && isSelesai(r)).length;
  const mjknBelum      = data.filter(r => isMjkn(r) && isBelum(r)).length;
  const loketTotal     = data.filter(isLoket).length;
  const loketSelesai   = data.filter(r => isLoket(r) && isSelesai(r)).length;
  const loketBelum     = data.filter(r => isLoket(r) && isBelum(r)).length;
  const sepTerbit      = data.filter(hasSep).length;

  // Hitung task ID counts untuk alur pelayanan
  const taskCount = (tid) => data.filter(r => String(r.last_taskid) === String(tid)).length;

  const computedStats = {
    total_belum:       totalBelum,
    total_selesai:     totalSelesai,
    total_batal:       totalBatal,
    sep_terbit:        sepTerbit,
    mjkn_total:        mjknTotal,
    mjkn_selesai:      mjknSelesai,
    mjkn_belum:        mjknBelum,
    jkn_total:         loketTotal,
    jkn_selesai:       loketSelesai,
    jkn_belum:         loketBelum,
    non_jkn_total:     loketTotal,
    non_jkn_selesai:   loketSelesai,
    non_jkn_belum:     loketBelum,
    record:            data.length,
    // SEP rawat jalan/inap — field ini dari data row kalau ada, kalau tidak pakai sepTerbit
    sep_ralan:         data.filter(r => hasSep(r) && (r.jenis_kunjungan === 'Rawat Jalan' || !r.jenis_kunjungan)).length || sepTerbit,
    sep_ranap:         data.filter(r => hasSep(r) && r.jenis_kunjungan === 'Rawat Inap').length,
    // Alur task ID
    tunggu_pelayanan:  taskCount('3'),
    dilayani:          taskCount('4'),
    selesai_dilayani:  taskCount('5'),
    tunggu_farmasi:    taskCount('6'),
    selesai:           taskCount('7'),
    batal_taskid:      taskCount('99'),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="apple-card" style={{ padding: '24px 28px', animation: 'scaleIn 0.26s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <StartAntrolSection
          selectedDate={selectedDate}
          computedStats={computedStats}
          loadingExternal={loading}
        />
      </div>
      <AntrolTab selectedDate={selectedDate} externalData={data} externalLoading={loading} />
    </div>
  );
};

/* ─── TABS CONFIG ─────────────────────────────────────────────────── */
const TABS = [
  { id: 'overview',      label: 'Overview',           icon: '⊞' },
  { id: 'antrol_detail', label: 'Antrol per Tanggal', icon: '🎫' },
  { id: 'tt',            label: 'Tempat Tidur',        icon: '🛏' },
  { id: 'sep',           label: 'Antrol & SEP',        icon: '📋' },
  { id: 'surat_kontrol', label: 'Surat Kontrol',       icon: '📝' },
  { id: 'operasi',       label: 'Jadwal Operasi',      icon: '🔬' },
];

/* ─── MAIN PAGE ───────────────────────────────────────────────────── */
function MonitoringPage() {
  const [activeTab, setActiveTab]       = useState('overview');
  const [selectedDate, setSelectedDate] = useState(today());

  const wrap = (children) => (
    <div className="apple-card" style={{ padding: '24px 28px', animation: 'scaleIn 0.26s cubic-bezier(0.34,1.56,0.64,1)' }}>
      {children}
    </div>
  );

  return (
    <>
      <style>{appleStyle}</style>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F2F2F7 0%, #FAFAFA 100%)' }}>

        {/* ── Navbar ── */}
        <div style={{
          background: 'rgba(255,255,255,0.80)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          borderBottom: '0.5px solid rgba(0,0,0,0.09)',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #007AFF, #0055CC)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 3px 10px rgba(0,122,255,0.38)', transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='scale(1.10)'; e.currentTarget.style.boxShadow='0 6px 18px rgba(0,122,255,0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='scale(1)';    e.currentTarget.style.boxShadow='0 3px 10px rgba(0,122,255,0.38)'; }}>🏥</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.4px' }}>Monitoring Kepatuhan BPJS</div>
                  <div style={{ fontSize: 11, color: '#8E8E93', marginTop: 1, letterSpacing: '-0.1px' }}>RS Gladish Medical Centre</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  className="apple-input" style={{ fontSize: 12.5 }} />
                <a href="/bookingbpjs" style={{
                  padding: '7px 14px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #007AFF, #0063CC)',
                  color: '#fff', fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
                  letterSpacing: '-0.1px', boxShadow: '0 3px 10px rgba(0,122,255,0.35)',
                  transition: 'transform 0.14s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease',
                  display: 'inline-block',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform='scale(1.04)'; e.currentTarget.style.boxShadow='0 5px 18px rgba(0,122,255,0.44)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='scale(1)';    e.currentTarget.style.boxShadow='0 3px 10px rgba(0,122,255,0.35)'; }}
                  onMouseDown={e  => { e.currentTarget.style.transform='scale(0.96)'; }}
                  onMouseUp={e    => { e.currentTarget.style.transform='scale(1.04)'; }}>
                  🎫 Booking Antrol
                </a>
              </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 0, marginTop: 10, overflowX: 'auto' }}>
              {TABS.map(tab => (
                <button key={tab.id} className="nav-tab" onClick={() => setActiveTab(tab.id)} style={{
                  color: activeTab === tab.id ? '#007AFF' : '#6E6E73',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  borderBottom: activeTab === tab.id ? '2px solid #007AFF' : '2px solid transparent',
                }}>{tab.icon} {tab.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="page-content" style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {wrap(<SepVclaimSection selectedDate={selectedDate} />)}
              <OverviewAntrolSection selectedDate={selectedDate} />
            </div>
          )}
          {activeTab === 'tt' && wrap(<TempurTidurSection />)}
          {activeTab === 'antrol_detail' && <AntrolTab selectedDate={selectedDate} />}
          {activeTab === 'sep' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {wrap(<SepVclaimSection selectedDate={selectedDate} />)}
              <AntrolTab selectedDate={selectedDate} />
            </div>
          )}
          {activeTab === 'surat_kontrol' && wrap(<SuratKontrolSection selectedDate={selectedDate} />)}
          {activeTab === 'operasi'       && wrap(<JadwalOperasiSection selectedDate={selectedDate} />)}
        </div>
      </div>
    </>
  );
}

export default MonitoringPage;