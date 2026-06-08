import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  .badge-purple { background:rgba(175,82,222,0.12); color:#6e1f9c; }

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
  .aw-table tr.row-det td { background:rgba(255,59,48,0.04); }
  .aw-table tr.row-pas td { background:rgba(255,149,0,0.04); }
  .aw-table tr.row-pro td { background:rgba(52,199,89,0.04); }

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

  /* NPS Score gauge bar */
  .nps-gauge-track {
    height:6px; border-radius:99px;
    background:rgba(0,0,0,0.07); overflow:hidden;
  }
  .nps-gauge-fill {
    height:100%; border-radius:99px;
    transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1);
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
  const [dari,    setDari]    = useState('');
  const [sampai,  setSampai]  = useState('');
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState(null);

  // Default range: 30 hari terakhir
  useEffect(() => {
    const now  = new Date();
    const ago  = new Date(); ago.setDate(ago.getDate() - 30);
    setSampai(now.toISOString().split('T')[0]);
    setDari(ago.toISOString().split('T')[0]);
  }, []);

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
        <div style={{ display:'flex', alignItems:'flex-end', gap:12, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:140 }}>
            <label className="aw-label">Dari tanggal</label>
            <input type="date" className="aw-input" value={dari} onChange={e => setDari(e.target.value)} />
          </div>
          <div style={{ flex:1, minWidth:140 }}>
            <label className="aw-label">Sampai tanggal</label>
            <input type="date" className="aw-input" value={sampai} onChange={e => setSampai(e.target.value)} />
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

        {/* ── TAB: LAPORAN NPS ───────────────────────────────────────── */}
        {tab === 'nps' && <NpsLaporan toast={toast} />}

      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}