import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/* ─── GLOBAL STYLES (Apple-style, matching MonitoringPage) ──────── */
const adminStyle = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 10px; }

  @keyframes fadeIn       { from { opacity:0 }                           to { opacity:1 } }
  @keyframes slideUp      { from { transform:translateY(16px);opacity:0 } to { transform:translateY(0);opacity:1 } }
  @keyframes scaleIn      { from { transform:scale(0.96);opacity:0 }      to { transform:scale(1);opacity:1 } }
  @keyframes spin         { to   { transform:rotate(360deg) } }
  @keyframes pulseGreen   { 0%,100%{box-shadow:0 0 0 0 rgba(52,199,89,0)}  50%{box-shadow:0 0 0 5px rgba(52,199,89,0.18)} }
  @keyframes shimmer      { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes toastIn      { from{transform:translateY(16px) scale(0.97);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }

  .aw-card {
    background: rgba(255,255,255,0.82);
    backdrop-filter: blur(24px) saturate(200%);
    -webkit-backdrop-filter: blur(24px) saturate(200%);
    border-radius: 18px;
    border: 0.5px solid rgba(255,255,255,0.9);
    box-shadow: 0 2px 20px rgba(0,0,0,0.055), 0 0 0 0.5px rgba(0,0,0,0.04);
    transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease;
  }
  .aw-card.hoverable:hover {
    transform: translateY(-2px) scale(1.005);
    box-shadow: 0 10px 32px rgba(0,0,0,0.09);
  }

  .aw-btn {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
    font-size: 13px; font-weight: 500; border-radius: 10px;
    border: none; cursor: pointer; letter-spacing: -0.1px;
    transition: transform 0.14s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, opacity 0.15s;
    -webkit-font-smoothing: antialiased;
  }
  .aw-btn:hover  { transform: scale(1.04); }
  .aw-btn:active { transform: scale(0.95); }
  .aw-btn:disabled { opacity:0.4; cursor:not-allowed; transform:none; }
  .aw-btn-primary   { background:#007AFF; color:#fff; padding:8px 18px; }
  .aw-btn-primary:hover { box-shadow:0 4px 16px rgba(0,122,255,0.35); }
  .aw-btn-green     { background:#34C759; color:#fff; padding:8px 18px; }
  .aw-btn-green:hover  { box-shadow:0 4px 16px rgba(52,199,89,0.35); }
  .aw-btn-red       { background:#FF3B30; color:#fff; padding:8px 18px; }
  .aw-btn-red:hover    { box-shadow:0 4px 16px rgba(255,59,48,0.35); }
  .aw-btn-ghost     { background:rgba(120,120,128,0.12); color:#1D1D1F; padding:8px 16px; border:0.5px solid rgba(0,0,0,0.09); }
  .aw-btn-ghost:hover  { background:rgba(120,120,128,0.18); }
  .aw-btn-sm { padding:6px 14px; font-size:12px; }

  .aw-input {
    font-family: inherit; font-size: 14px;
    background: rgba(120,120,128,0.08);
    border: 0.5px solid rgba(0,0,0,0.1);
    border-radius: 10px; padding: 9px 13px;
    outline: none; width: 100%; color: #1D1D1F;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .aw-input:focus {
    border-color: #007AFF;
    box-shadow: 0 0 0 3px rgba(0,122,255,0.12);
    background: rgba(255,255,255,0.95);
  }
  .aw-input::placeholder { color: rgba(60,60,67,0.4); }

  .aw-label {
    font-size:12px; font-weight:600; letter-spacing:-0.1px;
    color: rgba(60,60,67,0.7); margin-bottom:5px; display:block;
    text-transform: uppercase; font-size:11px; letter-spacing:0.3px;
  }

  .aw-badge {
    display:inline-flex; align-items:center; gap:4px;
    font-size:11px; font-weight:600; padding:3px 9px; border-radius:99px;
    letter-spacing:0.1px;
  }
  .badge-green  { background:rgba(52,199,89,0.12);  color:#1a7a35; }
  .badge-orange { background:rgba(255,149,0,0.12);  color:#b25000; }
  .badge-red    { background:rgba(255,59,48,0.12);   color:#c0160c; }
  .badge-blue   { background:rgba(0,122,255,0.1);   color:#0058cc; }
  .badge-gray   { background:rgba(120,120,128,0.12); color:#5a5a63; }

  .aw-tab {
    font-size:13px; font-weight:500; padding:7px 16px;
    border-radius:9px; cursor:pointer; transition:all 0.18s;
    color:rgba(60,60,67,0.7); white-space:nowrap;
    border:none; background:transparent;
  }
  .aw-tab.active {
    background:#fff; color:#007AFF;
    box-shadow:0 2px 8px rgba(0,0,0,0.09), 0 0 0 0.5px rgba(0,0,0,0.06);
  }
  .aw-tab:hover:not(.active) { color:#1D1D1F; background:rgba(120,120,128,0.07); }

  .aw-table { width:100%; border-collapse:collapse; }
  .aw-table th {
    font-size:11px; font-weight:600; color:rgba(60,60,67,0.55);
    text-transform:uppercase; letter-spacing:0.4px;
    padding:9px 14px; text-align:left;
    border-bottom:0.5px solid rgba(0,0,0,0.07);
  }
  .aw-table td {
    font-size:13px; color:#1D1D1F; padding:11px 14px;
    border-bottom:0.5px solid rgba(0,0,0,0.05);
    transition: background 0.12s;
  }
  .aw-table tr:hover td { background:rgba(0,122,255,0.025); }
  .aw-table tr:last-child td { border-bottom:none; }

  .status-dot {
    width:7px; height:7px; border-radius:50%; display:inline-block;
    flex-shrink:0;
  }
  .dot-green  { background:#34C759; animation:pulseGreen 2s infinite; }
  .dot-orange { background:#FF9500; }
  .dot-red    { background:#FF3B30; }
  .dot-gray   { background:#8E8E93; }

  .skeleton {
    background: linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.09) 50%, rgba(0,0,0,0.05) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius:8px;
  }

  .toast-wrap {
    position:fixed; bottom:28px; right:28px; z-index:9999;
    display:flex; flex-direction:column; gap:8px; pointer-events:none;
  }
  .toast {
    animation: toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
    backdrop-filter:blur(20px) saturate(200%);
    -webkit-backdrop-filter:blur(20px) saturate(200%);
    border-radius:14px; padding:12px 18px;
    font-size:13px; font-weight:500; pointer-events:auto;
    border:0.5px solid rgba(255,255,255,0.6);
    box-shadow:0 8px 32px rgba(0,0,0,0.14);
    display:flex; align-items:center; gap:8px;
    min-width:240px; max-width:340px;
  }
  .toast-success { background:rgba(52,199,89,0.92);  color:#fff; }
  .toast-error   { background:rgba(255,59,48,0.92);   color:#fff; }
  .toast-info    { background:rgba(0,122,255,0.92);   color:#fff; }

  .section-enter { animation: slideUp 0.38s cubic-bezier(0.34,1.56,0.64,1) both; }

  .toggle-track {
    width:38px; height:22px; border-radius:11px; position:relative;
    cursor:pointer; transition:background 0.22s;
    flex-shrink:0;
  }
  .toggle-thumb {
    position:absolute; top:2px; left:2px;
    width:18px; height:18px; border-radius:50%; background:#fff;
    box-shadow:0 1px 4px rgba(0,0,0,0.22);
    transition:left 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .toggle-on  { background:#34C759; }
  .toggle-on .toggle-thumb  { left:18px; }
  .toggle-off { background:rgba(120,120,128,0.28); }
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
function StatCard({ icon, label, value, sub, color = '#007AFF', loading }) {
  return (
    <div className="aw-card" style={{ padding: '18px 20px', flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: color + '18', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 16,
        }}>{icon}</div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(60,60,67,0.6)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</span>
      </div>
      {loading
        ? <div className="skeleton" style={{ height: 28, width: '60%', marginBottom: 6 }} />
        : <div style={{ fontSize: 26, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.5px' }}>{value}</div>
      }
      {sub && <div style={{ fontSize: 11, color: 'rgba(60,60,67,0.5)', marginTop: 3 }}>{sub}</div>}
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
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#f0f4f8 0%,#e8edf5 100%)', padding:'28px 24px 60px' }}>
      <style>{adminStyle}</style>

      {/* HEADER */}
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
          <div>
            <h1 style={{ fontSize:26, fontWeight:700, color:'#1D1D1F', letterSpacing:'-0.6px', marginBottom:3 }}>
              📲 Admin Wablas
            </h1>
            <p style={{ fontSize:13, color:'rgba(60,60,67,0.55)' }}>
              Kelola konfigurasi, monitoring, dan trigger WA RSU GMC
            </p>
          </div>

          {/* Status dot */}
          <div className="aw-card" style={{ padding:'9px 16px', display:'flex', alignItems:'center', gap:8 }}>
            <span className={`status-dot ${pingResult?.ok === false ? 'dot-red' : 'dot-green'}`} />
            <span style={{ fontSize:12, fontWeight:500, color:'rgba(60,60,67,0.7)' }}>
              {pingResult?.ok === false ? 'Offline' : 'Online'}
            </span>
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
          <StatCard icon="💬" label="Session Aktif"  value={stats?.active_sessions ?? '—'} sub="percakapan berlangsung" color="#007AFF" loading={statsLoading} />
          <StatCard icon="📨" label="Reminder H-3"   value={stats?.reminder_h3_today ?? '—'} sub="terkirim hari ini" color="#34C759" loading={statsLoading} />
          <StatCard icon="🔔" label="Reminder H-1"   value={stats?.reminder_h1_today ?? '—'} sub="terkirim hari ini" color="#FF9500" loading={statsLoading} />
          <StatCard icon="⭐" label="NPS Terkirim"   value={stats?.nps_today ?? '—'} sub="survei hari ini"   color="#AF52DE" loading={statsLoading} />
        </div>

        {/* TABS */}
        <div className="aw-card" style={{ padding:'5px 6px', display:'inline-flex', gap:3, marginBottom:20 }}>
          {[
            { key:'config',   label:'⚙️  Konfigurasi'  },
            { key:'sessions', label:'💬 Session Aktif'  },
            { key:'trigger',  label:'▶️  Trigger Manual' },
            { key:'test',     label:'🧪 Uji Kirim'      },
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
                  padding:'9px 13px', borderRadius:10, marginBottom:16, fontSize:12,
                  background: pingResult.ok ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)',
                  color: pingResult.ok ? '#1a7a35' : '#c0160c',
                  border: `0.5px solid ${pingResult.ok ? 'rgba(52,199,89,0.3)' : 'rgba(255,59,48,0.3)'}`,
                }}>
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
              {
                cmd: 'reminder:harian',
                icon: '🔔', title: 'Reminder Harian',
                desc: 'Kirim reminder H-3 dan H-1 ke semua pasien yang jadwal kontrolnya sesuai target tanggal hari ini.',
                color: '#007AFF', warn: false,
              },
            //   {
            //     cmd: 'reminder:kontrol',
            //     icon: '📋', title: 'Reminder Kontrol',
            //     desc: 'Kirim reminder surat kontrol BPJS ke pasien yang belum mendapat pengingat.',
            //     color: '#34C759', warn: false,
            //   },
              {
                cmd: 'reminder:surkon',
                icon: '📄', title: 'Reminder Surat Kontrol',
                desc: 'Kirim notifikasi surat kontrol yang akan segera berakhir.',
                color: '#FF9500', warn: false,
              },
              {
                cmd: 'nps:kirim',
                icon: '⭐', title: 'Kirim NPS',
                desc: 'Kirim survei NPS ke semua pasien yang billing sudah closing hari ini (hanya sekali per kunjungan).',
                color: '#AF52DE', warn: true,
              },
            ].map(item => (
              <div key={item.cmd} className="aw-card hoverable" style={{ padding:22 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:16 }}>
                  <div style={{
                    width:42, height:42, borderRadius:12,
                    background: item.color + '15',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0,
                  }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#1D1D1F', letterSpacing:'-0.2px' }}>{item.title}</div>
                    <div style={{ fontSize:12, color:'rgba(60,60,67,0.5)', marginTop:3, lineHeight:1.5 }}>{item.desc}</div>
                  </div>
                </div>

                {item.warn && (
                  <div style={{
                    padding:'8px 12px', borderRadius:9, marginBottom:12, fontSize:11,
                    background:'rgba(255,149,0,0.1)', color:'#b25000',
                    border:'0.5px solid rgba(255,149,0,0.25)',
                  }}>
                    ⚠️ Hati-hati: aksi ini mengirim WA ke pasien nyata
                  </div>
                )}

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <code style={{ fontSize:11, color:'rgba(60,60,67,0.45)', background:'rgba(0,0,0,0.05)', padding:'3px 8px', borderRadius:6 }}>
                    php artisan {item.cmd}
                  </code>
                  <button
                    className="aw-btn aw-btn-sm"
                    style={{ background: item.color, color:'#fff' }}
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
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}