import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/* ─── APPLE STYLE (sama seperti MonitoringPage, biar konsisten) ────── */
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

  @keyframes fadeIn    { from { opacity:0 }                          to { opacity:1 } }
  @keyframes slideDown { from { transform:translateY(-8px);opacity:0 } to { transform:translateY(0);opacity:1 } }
  @keyframes scaleIn   { from { transform:scale(0.94);opacity:0 }    to { transform:scale(1);opacity:1 } }
  @keyframes spin      { to   { transform:rotate(360deg) } }
  @keyframes statIn    { from{transform:translateY(10px) scale(0.97);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
  @keyframes rowIn     { from{transform:translateX(-6px);opacity:0} to{transform:translateX(0);opacity:1} }

  .apple-card {
    background: rgba(255,255,255,0.78);
    backdrop-filter: blur(24px) saturate(200%);
    -webkit-backdrop-filter: blur(24px) saturate(200%);
    border-radius: 18px;
    border: 0.5px solid rgba(255,255,255,0.9);
    box-shadow: 0 2px 20px rgba(0,0,0,0.055), 0 0 0 0.5px rgba(0,0,0,0.04);
  }

  .apple-btn {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
    font-size: 13px; font-weight: 500; border-radius: 10px; border: none; cursor: pointer;
    letter-spacing: -0.1px; transition: transform 0.14s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, background 0.15s ease;
  }
  .apple-btn:hover  { transform: scale(1.04); }
  .apple-btn:active { transform: scale(0.95); }
  .apple-btn-primary   { background:#007AFF; color:#fff; padding:7px 16px; }
  .apple-btn-secondary { background:rgba(120,120,128,0.13); color:#1D1D1F; padding:7px 14px; border:0.5px solid rgba(0,0,0,0.09); }

  .apple-input, .apple-select {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
    font-size: 13px; padding: 8px 12px; border-radius: 10px;
    border: 0.5px solid rgba(0,0,0,0.14); background: rgba(255,255,255,0.92); color: #1D1D1F;
    outline: none; letter-spacing: -0.1px;
    transition: border-color 0.18s ease, box-shadow 0.22s ease;
  }
  .apple-input:focus, .apple-select:focus { border-color:#007AFF; box-shadow: 0 0 0 3.5px rgba(0,122,255,0.16); }

  .apple-table-row { transition: background 0.12s ease; animation: rowIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both; }
  .apple-table-row td { transition: background 0.12s ease; border-left: 2.5px solid transparent; }
  .apple-table-row:hover td { background: rgba(0,122,255,0.042) !important; }
  .apple-table-row:hover td:first-child { border-left-color: #007AFF; }

  .pill {
    display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px;
    font-size: 11.5px; font-weight: 600; letter-spacing: -0.1px; white-space: nowrap;
  }

  .section-header {
    font-size: 22px; font-weight: 700; color: #1D1D1F; letter-spacing: -0.5px;
    margin-bottom: 18px; display: flex; align-items: center; gap: 10px;
    animation: slideDown 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .stat-card-wrap { animation: statIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }

  .page-content { animation: fadeIn 0.25s ease both; }
`;

/* ─── GLASS THEME (menimpa sebagian appleStyle) ───────────────────── */
const glassStyle = `
  .mon-scene { min-height: 100vh; position: relative; }
  .mon-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(55% 45% at 12% 8%,  rgba(255,170,130,0.55), transparent 70%),
      radial-gradient(50% 45% at 92% 18%, rgba(120,150,255,0.50), transparent 70%),
      radial-gradient(60% 50% at 62% 100%, rgba(190,140,255,0.45), transparent 70%),
      linear-gradient(160deg, #f6e9e3, #e8e6f7 55%, #dfeaf6);
  }
  .mon-wrap { position: relative; z-index: 1; max-width: 1600px; margin: 0 auto; padding: 18px 24px 48px 100px; }

  /* kartu kaca: kalau terasa berat, hapus 2 baris backdrop-filter */
  .apple-card {
    background: rgba(255,255,255,0.58);
    -webkit-backdrop-filter: blur(12px) saturate(160%);
    backdrop-filter: blur(12px) saturate(160%);
    border-radius: 26px;
    border: 1px solid rgba(255,255,255,0.85);
    box-shadow: 0 10px 30px rgba(80,70,140,0.12), inset 0 1px 0 rgba(255,255,255,0.9);
  }

  /* header */
  .mon-head { display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 22px; animation: slideDown 0.4s cubic-bezier(0.22,1,0.36,1) both; }
  .mon-brand { display: flex; align-items: center; gap: 14px; }
  .mon-logo {
    width: 52px; height: 52px; border-radius: 18px; display: grid; place-items: center; font-size: 24px;
    background: linear-gradient(140deg, #5b9bff, #7a5cf0); box-shadow: 0 8px 22px rgba(91,120,255,0.38);
    transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
  }
  .mon-logo:hover { transform: scale(1.08) rotate(-4deg); }
  .mon-brand h1 { font-size: clamp(18px, 2.4vw, 26px); font-weight: 700; color: #1D1D1F; letter-spacing: -0.6px; }
  .mon-brand p  { font-size: 12.5px; color: #6E6E73; margin-top: 2px; }
  .mon-link {
    padding: 9px 16px; border-radius: 99px; font-size: 12.5px; font-weight: 600; text-decoration: none; color: #1D1D1F;
    background: rgba(255,255,255,0.65); border: 1px solid rgba(255,255,255,0.9); display: inline-block;
    transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease;
  }
  .mon-link:hover  { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(80,70,140,0.16); }
  .mon-link:active { transform: scale(0.95); }

  /* dock kiri (link antar halaman) */
  .mon-dock {
    position: fixed; left: 16px; top: 50%; transform: translateY(-50%); z-index: 90;
    display: flex; flex-direction: column; gap: 6px; padding: 8px; border-radius: 99px;
    background: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.9);
    box-shadow: 0 12px 30px rgba(80,70,140,0.18);
    -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
    animation: fadeIn 0.5s ease both;
  }
  .mon-dock a {
    position: relative; width: 44px; height: 44px; border-radius: 50%; text-decoration: none; color: #1D1D1F;
    font-size: 18px; display: grid; place-items: center;
    transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), background 0.25s ease, box-shadow 0.25s ease;
  }
  .mon-dock a:hover { transform: scale(1.14); background: rgba(255,255,255,0.8); }
  .mon-dock a:active { transform: scale(0.94); }
  .mon-dock a.on { background: #fff; box-shadow: 0 6px 16px rgba(80,70,140,0.25); }
  .mon-dock a::after {
    content: attr(data-tip); position: absolute; left: 56px; white-space: nowrap; font-size: 12px; font-weight: 600;
    padding: 6px 12px; border-radius: 99px; background: rgba(30,28,40,0.88); color: #fff;
    opacity: 0; transform: translateX(-4px); pointer-events: none;
    transition: opacity 0.2s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1);
  }
  .mon-dock a:hover::after { opacity: 1; transform: none; }

  @media (max-width: 900px) {
    .mon-wrap { padding: 14px 14px 100px; }
    .mon-dock { top: auto; bottom: 14px; left: 50%; transform: translateX(-50%); flex-direction: row; max-width: calc(100vw - 24px); overflow-x: auto; }
    .mon-dock a::after { display: none; }
  }
`;

/* ─── HELPERS ─────────────────────────────────────────────────────── */
const fmt = (v) => (v === null || v === undefined || v === '' ? '—' : v);
const today = () => new Date().toISOString().split('T')[0];
const currentMonth = () => new Date().toISOString().slice(0, 7);
const fmtDetik = (totalDetik) => {
  if (totalDetik === null || totalDetik === undefined) return '—';
  const sign = totalDetik < 0 ? '-' : '';
  const abs = Math.abs(totalDetik);
  const jam   = Math.floor(abs / 3600);
  const menit = Math.floor((abs % 3600) / 60);
  const detik = abs % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${sign}${pad(jam)}:${pad(menit)}:${pad(detik)}`;
};
const fmtJamSaja = (waktuStr) => {
  if (!waktuStr) return '—';
  // waktuStr format 'YYYY-MM-DD HH:MM:SS' -> ambil jam:menit:detik saja
  const parts = waktuStr.split(' ');
  return parts.length > 1 ? parts[1] : waktuStr;
};

const LoadingState = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '36px 0', justifyContent: 'center', color: '#8E8E93', animation: 'fadeIn 0.2s ease' }}>
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: 'spin 0.85s linear infinite', flexShrink: 0 }}>
      <circle cx="9" cy="9" r="7.5" stroke="#007AFF" strokeWidth="2" strokeDasharray="22 25" />
    </svg>
    <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.1px' }}>Memuat data…</span>
  </div>
);

const SectionTitle = ({ children, icon }) => (
  <div className="section-header">
    {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
    <span>{children}</span>
  </div>
);

const StatCard = ({ label, value, sub, color = '#007AFF', icon }) => (
  <div className="apple-card stat-card-wrap" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 14, right: 16, fontSize: 26, opacity: 0.10 }}>{icon}</div>
    <div style={{ fontSize: 12, color: '#86868B', marginBottom: 6, fontWeight: 500, letterSpacing: '-0.1px' }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-1px', lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11.5, color: '#8E8E93', marginTop: 5, letterSpacing: '-0.1px' }}>{sub}</div>}
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: color, opacity: 0.5, borderRadius: '0 0 18px 18px' }} />
  </div>
);

const TableWrap = ({ children }) => (
  <div style={{ overflowX: 'auto', borderRadius: 14, border: '0.5px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.92)' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', minWidth: 700 }}>{children}</table>
  </div>
);
const TH = ({ children, style = {} }) => (
  <th style={{ padding: '11px 14px', background: 'rgba(246,246,246,0.97)', textAlign: 'left', fontWeight: 600, color: '#6E6E73', borderBottom: '0.5px solid rgba(0,0,0,0.07)', whiteSpace: 'nowrap', fontSize: 11.5, letterSpacing: '0.2px', textTransform: 'uppercase', ...style }}>{children}</th>
);
const TD = ({ children, style = {} }) => (
  <td style={{ padding: '10px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.04)', color: '#1D1D1F', fontSize: 12.5, letterSpacing: '-0.1px', ...style }}>{children}</td>
);

const TASK_STAGE_LABELS = {
  '1-2': 'Task 1 → 2', '2-3': 'Task 2 → 3', '3-4': 'Task 3 → 4',
  '4-5': 'Task 4 → 5', '5-6': 'Task 5 → 6', '6-7': 'Task 6 → 7',
};

/* ─── FILTER BAR (tanggal / bulan toggle) ────────────────────────── */
const FilterBar = ({ mode, setMode, bulan, setBulan, tanggalAwal, setTanggalAwal, tanggalAkhir, setTanggalAkhir, onRefresh, loading }) => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 18, padding: '14px 16px', background: 'rgba(0,0,0,0.022)', borderRadius: 14, border: '0.5px solid rgba(0,0,0,0.06)' }}>
    <div>
      <div style={{ fontSize: 11, color: '#6E6E73', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Filter</div>
      <select className="apple-select" value={mode} onChange={e => setMode(e.target.value)}>
        <option value="tanggal">Per Tanggal</option>
        <option value="bulan">Per Bulan</option>
      </select>
    </div>
    {mode === 'tanggal' && (
      <>
        <div>
          <div style={{ fontSize: 11, color: '#6E6E73', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Dari Tanggal</div>
          <input type="date" className="apple-input" value={tanggalAwal} onChange={e => setTanggalAwal(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6E6E73', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Sampai Tanggal</div>
          <input type="date" className="apple-input" value={tanggalAkhir} onChange={e => setTanggalAkhir(e.target.value)} />
        </div>
      </>
    )}
    {mode === 'bulan' && (
      <div>
        <div style={{ fontSize: 11, color: '#6E6E73', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Bulan</div>
        <input type="month" className="apple-input" value={bulan} onChange={e => setBulan(e.target.value)} />
      </div>
    )}
    <button className="apple-btn apple-btn-primary" onClick={onRefresh} disabled={loading}>
      {loading ? 'Memuat…' : '🔄 Refresh'}
    </button>
  </div>
);

/* ─── DURASI TASK ID SECTION ─────────────────────────────────────── */
const TaskIdDurasiSection = ({ params }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    axios.get('/api/monitoring/taskid-durasi', { params })
      .then(r => setData(r.data.success ? r.data : null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [params]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const perTahap = data?.per_tahap || {};
  const tungguPoli = data?.waktu_tunggu_poli_2_4;

  return (
    <div>
      <SectionTitle icon="⏱">Durasi Antar Task ID</SectionTitle>
      {loading ? <LoadingState /> : !data ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#8E8E93', fontSize: 13 }}>Gagal memuat data</div>
      ) : (
        <div style={{ animation: 'scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span className="pill" style={{ background: 'rgba(0,0,0,0.06)', color: '#6E6E73' }}>Total Pasien: {fmt(data.total_pasien)}</span>
            <span className="pill" style={{ background: 'rgba(0,122,255,0.10)', color: '#007AFF' }}>{data.filter}</span>
          </div>

          <TableWrap>
            <thead>
              <tr><TH>Tahap</TH><TH>Jumlah Sampel</TH><TH>Rata-rata (jj:mm:dd)</TH><TH>Terlama (jj:mm:dd)</TH><TH>Rentang Waktu Terlama</TH><TH>No Rawat</TH></tr>
            </thead>
            <tbody>
              {Object.entries(perTahap).map(([key, v], i) => (
                <tr key={key} className="apple-table-row" style={{ animationDelay: `${i * 0.03}s` }}>
                  <TD style={{ fontWeight: 600 }}>{TASK_STAGE_LABELS[key] || key}</TD>
                  <TD>{fmt(v.jumlah_sampel)}</TD>
                  <TD style={{ fontWeight: 600, color: '#007AFF', fontFamily: 'ui-monospace, monospace' }}>{fmtDetik(v.rata_rata_detik)}</TD>
                  <TD style={{ fontWeight: 600, color: v.terlama_detik > 3600 ? '#FF3B30' : '#1D1D1F', fontFamily: 'ui-monospace, monospace' }}>{fmtDetik(v.terlama_detik)}</TD>
                  <TD style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11.5, color: '#6E6E73' }}>
                    {v.terlama_waktu_awal ? `${fmtJamSaja(v.terlama_waktu_awal)} - ${fmtJamSaja(v.terlama_waktu_akhir)}` : '—'}
                  </TD>
                  <TD style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{fmt(v.terlama_no_rawat)}</TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>

          {tungguPoli && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginBottom: 10 }}>Waktu Tunggu Poli (Task 2 → 4)</div>
              <div className="stat-grid">
                <StatCard label="Jumlah Sampel" value={fmt(tungguPoli.jumlah_sampel)} icon="👥" color="#6E3AED" />
                <StatCard label="Rata-rata Tunggu" value={fmtDetik(tungguPoli.rata_rata_detik)} icon="⏳" color="#007AFF" />
                <StatCard
                  label="Terlama"
                  value={fmtDetik(tungguPoli.terlama_detik)}
                  icon="⚠"
                  color="#FF3B30"
                  sub={tungguPoli.terlama_waktu_awal ? `${fmtJamSaja(tungguPoli.terlama_waktu_awal)} - ${fmtJamSaja(tungguPoli.terlama_waktu_akhir)}` : undefined}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── KETEPATAN DOKTER SECTION ────────────────────────────────────── */
const KetepatanDokterSection = ({ params }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    axios.get('/api/monitoring/ketepatan-dokter', { params })
      .then(r => setData(r.data.success ? r.data.data : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [params]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalJadwal = data.reduce((s, d) => s + d.jumlah_jadwal, 0);
  const totalPraktek = data.reduce((s, d) => s + d.jumlah_praktek, 0);
  const totalSesuai  = data.reduce((s, d) => s + d.jumlah_sesuai, 0);
  const totalTidak   = data.reduce((s, d) => s + d.jumlah_tidak_sesuai, 0);
  const totalBelumAdaData = data.reduce((s, d) => s + (d.jumlah_belum_ada_data || 0), 0);

  return (
    <div>
      <SectionTitle icon="👨‍⚕️">Ketepatan Waktu Dokter</SectionTitle>
      {loading ? <LoadingState /> : (
        <div style={{ animation: 'scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span className="pill" style={{ background: 'rgba(0,0,0,0.06)', color: '#6E6E73' }}>Total Booking Dokter: {fmt(totalJadwal)}</span>
          </div>
          <div className="stat-grid">
            <StatCard label="Sesuai Jadwal" value={totalSesuai} icon="✓" color="#34C759" sub={totalPraktek ? `${Math.round(totalSesuai / totalPraktek * 100)}% dari yg ada data` : '—'} />
            <StatCard label="Tidak Sesuai" value={totalTidak} icon="⚠" color="#FF3B30" sub={totalPraktek ? `${Math.round(totalTidak / totalPraktek * 100)}% dari yg ada data` : '—'} />
            <StatCard label="Belum Ada Data" value={totalBelumAdaData} icon="❔" color="#8E8E93" sub="ada booking, belum bisa dinilai" />
          </div>

          <TableWrap>
            <thead>
              <tr><TH>Dokter</TH><TH>Jml Booking</TH><TH>Sesuai (≤45 mnt)</TH><TH>Tidak Sesuai</TH><TH>Belum Ada Data</TH><TH>% Sesuai</TH></tr>
            </thead>
            <tbody>
              {data.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#8E8E93', fontSize: 13 }}>Tidak ada data — coba ubah filter</td></tr>
                : data.map((row, i) => {
                  const persen = row.jumlah_praktek ? Math.round(row.jumlah_sesuai / row.jumlah_praktek * 100) : null;
                  return (
                    <tr key={row.kd_dokter} className="apple-table-row" style={{ animationDelay: `${i * 0.025}s` }}>
                      <TD style={{ fontWeight: 600 }}>{fmt(row.nama_dokter)}</TD>
                      <TD>{fmt(row.jumlah_jadwal)}</TD>
                      <TD style={{ color: '#1D7A3A', fontWeight: 600 }}>{fmt(row.jumlah_sesuai)}</TD>
                      <TD style={{ color: '#C0392B', fontWeight: 600 }}>{fmt(row.jumlah_tidak_sesuai)}</TD>
                      <TD style={{ color: '#8E8E93' }}>{fmt(row.jumlah_belum_ada_data)}</TD>
                      <TD>
                        {persen === null
                          ? <span className="pill" style={{ background: 'rgba(0,0,0,0.05)', color: '#8E8E93' }}>—</span>
                          : <span className="pill" style={{ background: persen >= 80 ? 'rgba(52,199,89,0.12)' : persen >= 50 ? 'rgba(255,204,0,0.15)' : 'rgba(255,59,48,0.10)', color: persen >= 80 ? '#1D7A3A' : persen >= 50 ? '#B8860B' : '#C0392B' }}>
                              {persen}%
                            </span>
                        }
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

/* ─── MAIN PAGE ───────────────────────────────────────────────────── */
function AntrolPertanggalPage() {
  const [mode, setMode]       = useState('tanggal'); // 'tanggal' (selalu rentang, dari=sampai kalau cuma 1 hari) | 'bulan'
  const [bulan, setBulan]     = useState(currentMonth());
  const [tanggalAwal, setTanggalAwal] = useState(today());
  const [tanggalAkhir, setTanggalAkhir] = useState(today());
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const params = mode === 'tanggal'
    ? { tanggal_awal: tanggalAwal, tanggal_akhir: tanggalAkhir }
    : { bulan };
  // refreshKey dipakai supaya tombol Refresh bisa memaksa re-fetch walau params sama
  const effectiveParams = { ...params, _r: refreshKey };

  return (
    <>
      <style>{appleStyle + glassStyle}</style>
      <div className="mon-scene">
        <div className="mon-bg" />

        <nav className="mon-dock">
          <a href="/monitoring" data-tip="Monitoring" aria-label="Monitoring">⊞</a>
          <a href="/antrolpertanggal" data-tip="Analitik Task ID" aria-label="Analitik Task ID" className="on">⏱</a>
          <a href="/bookingbpjs" data-tip="Booking Antrol" aria-label="Booking Antrol">🎫</a>
        </nav>

        <div className="mon-wrap">
          {/* ── Header ── */}
          <header className="mon-head">
            <div className="mon-brand">
              <div className="mon-logo">⏱</div>
              <div>
                <h1>Antrol Per Tanggal — Analitik Task ID</h1>
                <p>Durasi alur & ketepatan dokter</p>
              </div>
            </div>
            <a href="/monitoring" className="mon-link">← Kembali ke Monitoring</a>
          </header>

          {/* ── Content ── */}
          <div className="page-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="apple-card" style={{ padding: '20px 28px 4px' }}>
                <FilterBar
                  mode={mode} setMode={setMode}
                  bulan={bulan} setBulan={setBulan}
                  tanggalAwal={tanggalAwal} setTanggalAwal={setTanggalAwal}
                  tanggalAkhir={tanggalAkhir} setTanggalAkhir={setTanggalAkhir}
                  onRefresh={() => setRefreshKey(k => k + 1)}
                  loading={loading}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 18, alignItems: 'start' }}>
                <div className="apple-card" style={{ padding: '24px 28px' }}>
                  <TaskIdDurasiSection params={effectiveParams} />
                </div>

                <div className="apple-card" style={{ padding: '24px 28px' }}>
                  <KetepatanDokterSection params={effectiveParams} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AntrolPertanggalPage;