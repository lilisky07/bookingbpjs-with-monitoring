import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ─────────────────────────────────────────────
// HELPER UTILS
// ─────────────────────────────────────────────
const fmt = (v) => (v === null || v === undefined ? '-' : v);
const fmtTime = (t) => {
  if (!t) return '-';
  return typeof t === 'string' && t.includes(':') ? t.slice(0, 5) : t;
};
const today = () => new Date().toISOString().split('T')[0];

const STATUS_COLOR = {
  'Checkin': { bg: '#dcfce7', text: '#15803d', label: 'Checkin' },
  'Belum':   { bg: '#fef9c3', text: '#92400e', label: 'Belum' },
  'Batal':   { bg: '#fee2e2', text: '#b91c1c', label: 'Batal' },
  'Gagal':   { bg: '#ffedd5', text: '#c2410c', label: 'Gagal' },
};

const Pill = ({ status }) => {
  const s = STATUS_COLOR[status] || { bg: '#f1f5f9', text: '#475569', label: status || '-' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 700,
      background: s.bg,
      color: s.text,
      letterSpacing: '0.3px'
    }}>{s.label}</span>
  );
};

const StatCard = ({ label, value, sub, color = '#2563eb', icon }) => (
  <div style={{
    background: '#fff',
    borderRadius: '14px',
    padding: '20px 22px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    borderLeft: `4px solid ${color}`,
    minWidth: 0,
    flex: '1 1 160px'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
      </div>
      {icon && <div style={{ fontSize: '28px', opacity: 0.3 }}>{icon}</div>}
    </div>
  </div>
);

const SectionTitle = ({ children, icon }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: '15px', fontWeight: 700, color: '#1e40af',
    borderBottom: '2px solid #dbeafe', paddingBottom: 10, marginBottom: 16
  }}>
    {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
    {children}
  </div>
);

const TableWrap = ({ children }) => (
  <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: 700 }}>
      {children}
    </table>
  </div>
);

const TH = ({ children, style = {} }) => (
  <th style={{
    padding: '10px 14px', background: '#eff6ff',
    textAlign: 'left', fontWeight: 700, color: '#1e40af',
    borderBottom: '1px solid #dbeafe', whiteSpace: 'nowrap', ...style
  }}>{children}</th>
);

const TD = ({ children, style = {} }) => (
  <td style={{
    padding: '10px 14px', borderBottom: '1px solid #f1f5f9',
    color: '#374151', ...style
  }}>{children}</td>
);

// ─────────────────────────────────────────────
// SECTION COMPONENTS
// ─────────────────────────────────────────────

// 1. KETERSEDIAAN TEMPAT TIDUR
const TempurTidurSection = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/monitoring/tempat-tidur')
      .then(r => { if (r.data.success) setData(r.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = data.reduce((a, b) => a + (b.total || 0), 0);
  const terisi = data.reduce((a, b) => a + (b.terisi || 0), 0);
  const kosong = total - terisi;

  return (
    <div>
      <SectionTitle icon="🛏️">Ketersediaan Tempat Tidur</SectionTitle>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatCard label="Total TT" value={loading ? '…' : total} color="#2563eb" icon="🏥" />
        <StatCard label="Terisi" value={loading ? '…' : terisi} color="#dc2626" sub={`${total ? Math.round(terisi/total*100) : 0}% BOR`} icon="🛌" />
        <StatCard label="Kosong" value={loading ? '…' : kosong} color="#16a34a" icon="✅" />
      </div>
      {loading ? <p style={{ color: '#94a3b8', textAlign: 'center' }}>Memuat data...</p> : (
        <TableWrap>
          <thead>
            <tr>
              <TH>Ruangan</TH><TH>Kelas</TH><TH>Total TT</TH>
              <TH>Terisi</TH><TH>Kosong</TH><TH>BOR %</TH><TH>Last Update</TH>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><TD style={{ textAlign: 'center', color: '#94a3b8' }} colSpan={7}>Tidak ada data tempat tidur</TD></tr>
            ) : data.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <TD>{fmt(row.nm_bangsal)}</TD>
                <TD>{fmt(row.kelas)}</TD>
                <TD style={{ fontWeight: 700 }}>{fmt(row.total)}</TD>
                <TD style={{ color: '#dc2626', fontWeight: 600 }}>{fmt(row.terisi)}</TD>
                <TD style={{ color: '#16a34a', fontWeight: 600 }}>{fmt(row.kosong)}</TD>
                <TD>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 4, height: 6 }}>
                      <div style={{ width: `${row.total ? Math.min(100, row.terisi/row.total*100) : 0}%`, background: '#2563eb', height: 6, borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {row.total ? Math.round(row.terisi/row.total*100) : 0}%
                    </span>
                  </div>
                </TD>
                <TD style={{ fontSize: 12, color: '#94a3b8' }}>{fmt(row.last_update)}</TD>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
};

// 2. START ANTROL (MJKN vs Manual)
const TASK_LABELS = {
  '3':  { label: 'Tunggu Pelayanan',   color: '#d97706', bg: '#fef9c3', icon: '⏳' },
  '4':  { label: 'Sedang Dilayani',    color: '#2563eb', bg: '#dbeafe', icon: '👨‍⚕️' },
  '5':  { label: 'Pelayanan Selesai',  color: '#059669', bg: '#dcfce7', icon: '✅' },
  '6':  { label: 'Tunggu Farmasi',     color: '#7c3aed', bg: '#ede9fe', icon: '💊' },
  '7':  { label: 'Farmasi Selesai',    color: '#15803d', bg: '#bbf7d0', icon: '🏁' },
  '99': { label: 'Batal',              color: '#dc2626', bg: '#fee2e2', icon: '❌' },
};

const StartAntrolSection = ({ selectedDate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/monitoring/start-antrol', { params: { tanggal: selectedDate } })
      .then(r => { if (r.data.success) setData(r.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedDate]);

  return (
    <div>
      <SectionTitle icon="🎫">Registrasi BPJS & Antrol</SectionTitle>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {/* FIX: field names sesuai controller response */}
        <StatCard label="Total Antrol"       value={loading ? '…' : fmt(data?.total_antrol)}     color="#7c3aed" sub="MJKN + Non-MJKN" icon="📋" />
        <StatCard label="Sudah Registrasi"   value={loading ? '…' : fmt(data?.sudah_registrasi)} color="#059669" sub="Selesai checkin"  icon="✅" />
        <StatCard label="Belum Registrasi"   value={loading ? '…' : fmt(data?.belum_registrasi)} color="#d97706" sub="Belum checkin"    icon="⏳" />
        <StatCard label="Via MJKN"           value={loading ? '…' : fmt(data?.via_mjkn)}         color="#0891b2" sub={`Selesai: ${fmt(data?.mjkn_selesai)}`} icon="📱" />
        <StatCard label="SEP Terbit"         value={loading ? '…' : fmt(data?.sep_terbit)}       color="#2563eb" sub={`RJ: ${fmt(data?.sep_ralan)} | RI: ${fmt(data?.sep_ranap)}`} icon="📄" />
      </div>
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>
          📍 Alur Status Pelayanan
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {['3','4','5','6','7','99'].map((tid, idx, arr) => {
            const t = TASK_LABELS[tid];
            const keyMap = {
              '3': 'tunggu_pelayanan', '4': 'dilayani', '5': 'selesai_dilayani',
              '6': 'tunggu_farmasi',   '7': 'selesai',  '99': 'batal_taskid'
            };
            const val = loading ? '…' : fmt(data?.[keyMap[tid]]);
            return (
              <React.Fragment key={tid}>
                <div style={{
                  background: t.bg, border: `1px solid ${t.color}30`,
                  borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 90
                }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{t.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: t.color }}>{val}</div>
                  <div style={{ fontSize: 10, color: t.color, fontWeight: 600, marginTop: 2 }}>{t.label}</div>
                </div>
                {idx < arr.length - 2 && <div style={{ color: '#cbd5e1', fontSize: 18 }}>→</div>}
                {idx === arr.length - 2 && <div style={{ color: '#fca5a5', fontSize: 14, margin: '0 4px' }}>|</div>}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 3. DETAIL ANTROL TABLE
const DetailAntrolSection = ({ selectedDate }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    setLoading(true);
    setPage(1);
    axios.get('/api/monitoring/detail-antrol', { params: { tanggal: selectedDate, search } })
      .then(r => { if (r.data.success) setData(r.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedDate, search]);

  const filtered = data.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(data.length / perPage);

  const isLate = (jamSep, jamPraktek) => {
    if (!jamSep || !jamPraktek || jamSep === '-' || jamPraktek === '-') return false;
    return jamSep > jamPraktek;
  };

  return (
    <div>
      <SectionTitle icon="📊">Detail Antrol Harian</SectionTitle>
      <div style={{ marginBottom: 12 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama / no RM / no SEP..."
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #dbeafe',
            fontSize: 13, width: '280px', outline: 'none'
          }}
        />
        <span style={{ marginLeft: 12, color: '#64748b', fontSize: 13 }}>
          {data.length} data ditemukan
        </span>
      </div>
      {loading ? <p style={{ color: '#94a3b8', textAlign: 'center' }}>Memuat data...</p> : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <TH>#</TH>
                <TH>No RM</TH>
                <TH>Nama Pasien</TH>
                <TH>No SEP</TH>
                <TH>Poli</TH>
                <TH>Dokter</TH>
                <TH>Jam SEP</TH>
                <TH>Jam Praktek</TH>
                <TH>Kesesuaian</TH>
                <TH>Status Antrol</TH>
                <TH>Status Alur</TH>
                <TH>Waktu Task</TH>
                <TH>Dilayani</TH>
                <TH>Selesai</TH>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={14} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Tidak ada data</td></tr>
              ) : filtered.map((row, i) => {
                const late = isLate(row.jam_sep, row.jam_praktek);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <TD style={{ color: '#94a3b8' }}>{(page - 1) * perPage + i + 1}</TD>
                    <TD style={{ fontFamily: 'monospace' }}>{fmt(row.no_rm)}</TD>
                    <TD style={{ fontWeight: 600 }}>{fmt(row.nama)}</TD>
                    <TD style={{ fontFamily: 'monospace', fontSize: 11 }}>{fmt(row.no_sep)}</TD>
                    <TD>{fmt(row.poli)}</TD>
                    <TD>{fmt(row.dokter)}</TD>
                    <TD style={{ fontWeight: 600 }}>{fmtTime(row.jam_sep)}</TD>
                    <TD>{fmtTime(row.jam_praktek)}</TD>
                    <TD>
                      {row.jam_sep && row.jam_sep !== '-' && row.jam_praktek && row.jam_praktek !== '-' ? (
                        <span style={{
                          padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: late ? '#fee2e2' : '#dcfce7',
                          color: late ? '#b91c1c' : '#15803d'
                        }}>
                          {late ? '⚠️ Telat' : '✅ Sesuai'}
                        </span>
                      ) : '-'}
                    </TD>
                    <TD><Pill status={row.status} /></TD>
                    <TD>
                      {row.last_taskid ? (() => {
                        const t = TASK_LABELS[String(row.last_taskid)];
                        return t ? (
                          <span style={{
                            padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: t.bg, color: t.color, whiteSpace: 'nowrap'
                          }}>
                            {t.icon} {t.label}
                          </span>
                        ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>Task {row.last_taskid}</span>;
                      })() : <span style={{ color: '#cbd5e1', fontSize: 12 }}>-</span>}
                    </TD>
                    <TD style={{ fontSize: 12, color: '#64748b' }}>{fmtTime(row.waktu_task)}</TD>
                    <TD style={{ fontSize: 12 }}>{fmtTime(row.jam_dilayani)}</TD>
                    <TD style={{ fontSize: 12 }}>{fmtTime(row.jam_selesai)}</TD>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #dbeafe', cursor: 'pointer', background: '#fff', color: '#2563eb', fontWeight: 600 }}>
                ← Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => idx + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #dbeafe', cursor: 'pointer',
                    background: page === p ? '#2563eb' : '#fff', color: page === p ? '#fff' : '#2563eb', fontWeight: 600 }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #dbeafe', cursor: 'pointer', background: '#fff', color: '#2563eb', fontWeight: 600 }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// 4. SEP VCLAIM
// FIX: field names sesuai controller: total, rawatJalan, rawatInap, sepKontrol
const SepVclaimSection = ({ selectedDate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/monitoring/sep-vclaim', { params: { tanggal: selectedDate } })
      .then(r => { if (r.data.success) setData(r.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedDate]);

  return (
    <div>
      <SectionTitle icon="📋">SEP VClaim</SectionTitle>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {/* FIX: total bukan total_sep, rawatJalan bukan rawat_jalan, dst */}
        <StatCard label="Total SEP Terbit" value={loading ? '…' : fmt(data?.total)}      color="#2563eb" icon="📄" />
        <StatCard label="Rawat Jalan"       value={loading ? '…' : fmt(data?.rawatJalan)} color="#0891b2" icon="🏃" />
        <StatCard label="Rawat Inap"        value={loading ? '…' : fmt(data?.rawatInap)}  color="#7c3aed" icon="🛌" />
        <StatCard label="SEP Kontrol"       value={loading ? '…' : fmt(data?.sepKontrol)} color="#059669" icon="🔄" sub="Surat kontrol" />
      </div>
    </div>
  );
};

// 5. SURAT KONTROL
const SuratKontrolSection = ({ selectedDate }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tglSep, setTglSep] = useState(selectedDate);
  const [tglRencana, setTglRencana] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = {};
    if (tglSep) params.tgl_sep = tglSep;
    if (tglRencana) params.tgl_rencana = tglRencana;
    axios.get('/api/monitoring/surat-kontrol', { params })
      .then(r => { if (r.data.success) setData(r.data.data); else setData([]); })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [tglSep, tglRencana]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setTglSep(selectedDate); }, [selectedDate]);

  const sesuaiCount = data.filter(r => r.selisih_hari !== null && r.selisih_hari >= 0).length;
  const tidakSesuaiCount = data.filter(r => r.selisih_hari !== null && r.selisih_hari < 0).length;

  return (
    <div>
      <SectionTitle icon="📝">Kesesuaian Surat Kontrol</SectionTitle>
      <div style={{
        display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end',
        marginBottom: 16, padding: '14px 16px',
        background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0'
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Filter Tgl SEP Terbit</div>
          <input type="date" value={tglSep} onChange={e => setTglSep(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #dbeafe', fontSize: 13, outline: 'none' }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Filter Tgl Rencana Kontrol</div>
          <input type="date" value={tglRencana} onChange={e => setTglRencana(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #dbeafe', fontSize: 13, outline: 'none' }} />
        </div>
        <button onClick={() => { setTglSep(''); setTglRencana(''); }}
          style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#64748b' }}>
          Reset Filter
        </button>
        {!loading && data.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <span style={{ padding: '4px 12px', borderRadius: 20, background: '#dcfce7', color: '#15803d', fontSize: 12, fontWeight: 700 }}>✅ Sesuai: {sesuaiCount}</span>
            <span style={{ padding: '4px 12px', borderRadius: 20, background: '#fee2e2', color: '#b91c1c', fontSize: 12, fontWeight: 700 }}>⚠️ Tidak Sesuai: {tidakSesuaiCount}</span>
            <span style={{ padding: '4px 12px', borderRadius: 20, background: '#f1f5f9', color: '#64748b', fontSize: 12, fontWeight: 700 }}>Total: {data.length}</span>
          </div>
        )}
      </div>
      {loading ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: 30 }}>Memuat data...</p> : (
        <TableWrap>
          <thead>
            <tr>
              <TH>No RM</TH><TH>Nama</TH><TH>Poli</TH><TH>Dokter</TH>
              <TH>No Surat Kontrol</TH><TH>Tgl Surat</TH><TH>Tgl Rencana</TH>
              <TH>No SEP</TH><TH>Tgl SEP</TH><TH>Selisih (hari)</TH><TH>Kesesuaian</TH>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Tidak ada data — coba ubah filter tanggal</td></tr>
            ) : data.map((row, i) => {
              const selisih = row.selisih_hari;
              const sesuai = selisih !== null && selisih >= 0;
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <TD style={{ fontFamily: 'monospace', fontSize: 12 }}>{fmt(row.no_rm)}</TD>
                  <TD style={{ fontWeight: 600 }}>{fmt(row.nama)}</TD>
                  <TD style={{ fontSize: 12 }}>{fmt(row.poli)}</TD>
                  <TD style={{ fontSize: 12 }}>{fmt(row.dokter)}</TD>
                  <TD style={{ fontSize: 11, fontFamily: 'monospace' }}>{fmt(row.no_surat)}</TD>
                  <TD>{fmt(row.tgl_surat)}</TD>
                  <TD style={{ fontWeight: 600, color: '#2563eb' }}>{fmt(row.tgl_rencana)}</TD>
                  <TD style={{ fontSize: 11, fontFamily: 'monospace' }}>{fmt(row.no_sep)}</TD>
                  <TD>{fmt(row.tgl_sep)}</TD>
                  <TD style={{ textAlign: 'center', fontWeight: 700, color: selisih < 0 ? '#dc2626' : '#64748b' }}>
                    {selisih !== null ? (selisih < 0 ? `${selisih}` : `+${selisih}`) : '-'}
                  </TD>
                  <TD>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: sesuai ? '#dcfce7' : '#fee2e2',
                      color: sesuai ? '#15803d' : '#b91c1c'
                    }}>
                      {sesuai ? '✅ Sesuai' : selisih === null ? '❓ N/A' : '⚠️ Tidak Sesuai'}
                    </span>
                  </TD>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
};

// 6. JADWAL OPERASI (TMO)
const JadwalOperasiSection = ({ selectedDate }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/monitoring/jadwal-operasi', { params: { tanggal: selectedDate } })
      .then(r => { if (r.data.success) setData(r.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const total = data.length;
  const selesai = data.filter(d => d.status_operasi === 'Selesai').length;
  const proses = data.filter(d => d.status_operasi === 'Proses').length;

  return (
    <div>
      <SectionTitle icon="🔪">Jadwal Operasi (TMO)</SectionTitle>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatCard label="Total TMO" value={loading ? '…' : total} color="#7c3aed" icon="🔪" />
        <StatCard label="Selesai"   value={loading ? '…' : selesai} color="#059669" icon="✅" />
        <StatCard label="Proses"    value={loading ? '…' : proses}  color="#d97706" icon="⏳" />
      </div>
      {loading ? <p style={{ color: '#94a3b8', textAlign: 'center' }}>Memuat data...</p> : (
        <TableWrap>
          <thead>
            <tr>
              <TH>#</TH><TH>No RM</TH><TH>Nama</TH><TH>No Rawat</TH>
              <TH>Tgl Operasi</TH><TH>Jam Mulai</TH><TH>Jenis Operasi</TH>
              <TH>Dokter Operator</TH><TH>Status</TH>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Tidak ada jadwal operasi</td></tr>
            ) : data.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <TD style={{ color: '#94a3b8' }}>{i + 1}</TD>
                <TD style={{ fontFamily: 'monospace' }}>{fmt(row.no_rm)}</TD>
                <TD style={{ fontWeight: 600 }}>{fmt(row.nama)}</TD>
                <TD style={{ fontFamily: 'monospace', fontSize: 11 }}>{fmt(row.no_rawat)}</TD>
                <TD>{fmt(row.tgl_operasi)}</TD>
                <TD style={{ fontWeight: 700 }}>{fmtTime(row.jam_mulai)}</TD>
                <TD>{fmt(row.jenis_operasi)}</TD>
                <TD>{fmt(row.dokter_operator)}</TD>
                <TD>
                  <span style={{
                    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: row.status_operasi === 'Selesai' ? '#dcfce7' : row.status_operasi === 'Proses' ? '#fef9c3' : '#f1f5f9',
                    color: row.status_operasi === 'Selesai' ? '#15803d' : row.status_operasi === 'Proses' ? '#92400e' : '#64748b'
                  }}>
                    {fmt(row.status_operasi)}
                  </span>
                </TD>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────
// TAB ANTROL — Antrian Per Tanggal Mobile JKN
// ─────────────────────────────────────────────
const STATUS_ANTROL = {
  'Checkin':          { bg: '#dcfce7', color: '#15803d', label: 'Checkin' },
  'Belum':            { bg: '#fef9c3', color: '#92400e', label: 'Belum' },
  'Batal':            { bg: '#fee2e2', color: '#b91c1c', label: 'Batal' },
  'Gagal':            { bg: '#ffedd5', color: '#c2410c', label: 'Gagal' },
  'Selesai dilayani': { bg: '#dcfce7', color: '#15803d', label: 'Selesai dilayani' },
  'Belum dilayani':   { bg: '#fef9c3', color: '#92400e', label: 'Belum dilayani' },
};

const TASKID_STATUS = {
  '3': 'Tunggu Pelayanan', '4': 'Sedang Dilayani',
  '5': 'Pelayanan Selesai', '6': 'Tunggu Farmasi',
  '7': 'Farmasi Selesai',  '99': 'Batal',
};

const AntrolTab = ({ selectedDate }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    setLoading(true);
    setPage(1);
    axios.get('/api/monitoring/antrol-pertanggal', {
      params: { tanggal: selectedDate, search, status: filterStatus }
    })
      .then(r => { if (r.data.success) setData(r.data.data); else setData([]); })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [selectedDate, search, filterStatus]);

  const filtered = data.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(data.length / perPage);

  // FIX: status dari API BPJS bisa 'Selesai dilayani' atau 'Checkin', normalkan dulu
  const isSelesai = (r) => r.status === 'Checkin' || r.status === 'Selesai dilayani';
  const isBelum   = (r) => r.status === 'Belum'   || r.status === 'Belum dilayani';

  const totalBelum     = data.filter(isBelum).length;
  const totalSelesai   = data.filter(isSelesai).length;
  const totalBatal     = data.filter(r => r.status === 'Batal').length;
  const sepTerbit      = data.filter(r => r.no_sep && r.no_sep !== '-').length;

  // FIX: sumber dari DB lokal = 'Mobile JKN', dari API = bisa 'Mobile JKN' atau field sumberdata
  const isMjkn = (r) => r.sumber === 'Mobile JKN' || r.sumber === 'MJKN';
  const mjknTotal      = data.filter(isMjkn).length;
  const mjknSelesai    = data.filter(r => isMjkn(r) && isSelesai(r)).length;
  const mjknBelum      = data.filter(r => isMjkn(r) && isBelum(r)).length;
  const nonMjknSelesai = data.filter(r => !isMjkn(r) && isSelesai(r)).length;
  const nonMjknBelum   = data.filter(r => !isMjkn(r) && isBelum(r)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter bar */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: '16px 20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center'
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama / no RM / no booking / NIK..."
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #dbeafe', fontSize: 13, width: 280, outline: 'none' }}
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #dbeafe', fontSize: 13, outline: 'none' }}
        >
          <option value="">Semua Status</option>
          <option value="Belum">Belum</option>
          <option value="Checkin">Checkin</option>
          <option value="Batal">Batal</option>
          <option value="Gagal">Gagal</option>
        </select>
        <span style={{ color: '#64748b', fontSize: 13 }}>{data.length} record</span>
      </div>

      {/* Tabel */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Memuat data...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1200 }}>
              <thead>
                <tr style={{ background: '#eff6ff' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Kode Booking</th>
                  <th style={thStyle}>No RM</th>
                  <th style={thStyle}>Nama</th>
                  <th style={thStyle}>No Kartu</th>
                  <th style={thStyle}>NIK</th>
                  <th style={thStyle}>Poli</th>
                  <th style={thStyle}>Dokter</th>
                  <th style={thStyle}>Jam Praktek</th>
                  <th style={thStyle}>Tgl Periksa</th>
                  <th style={thStyle}>No Antrean</th>
                  <th style={thStyle}>Estimasi Dilayani</th>
                  <th style={thStyle}>Jenis Kunjungan</th>
                  <th style={thStyle}>Sumber</th>
                  <th style={thStyle}>No SEP</th>
                  <th style={thStyle}>Status Antrol</th>
                  <th style={thStyle}>Status Alur</th>
                  <th style={thStyle}>Waktu Booking</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={18} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Tidak ada data</td></tr>
                ) : filtered.map((row, i) => {
                  const stAntrol = STATUS_ANTROL[row.status] || { bg: '#f1f5f9', color: '#64748b', label: row.status || '-' };
                  const tl       = TASK_LABELS[String(row.last_taskid)] || null;
                  const mjkn     = isMjkn(row);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}>{(page-1)*perPage+i+1}</td>
                      {/* FIX: nobooking (DB lokal) atau kodebooking (sudah dinormalize ke nobooking di controller) */}
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{fmt(row.nobooking)}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{fmt(row.no_rm)}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(row.nama)}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{fmt(row.nomorkartu)}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{fmt(row.nik)}</td>
                      <td style={tdStyle}>{fmt(row.nm_poli)}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmt(row.nm_dokter)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{fmt(row.jampraktek)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{fmt(row.tanggalperiksa)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{fmt(row.nomorantrean)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{fmt(row.estimasidilayani)}</td>
                      <td style={{ ...tdStyle, fontSize: 11 }}>{fmt(row.jeniskunjungan)}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: mjkn ? '#ede9fe' : '#f1f5f9',
                          color: mjkn ? '#7c3aed' : '#64748b'
                        }}>
                          {mjkn ? '📱 MJKN' : '🖥️ Loket'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 10 }}>{fmt(row.no_sep)}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: stAntrol.bg, color: stAntrol.color
                        }}>
                          {stAntrol.label}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {tl ? (
                          <span style={{
                            padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: tl.bg, color: tl.color, whiteSpace: 'nowrap'
                          }}>
                            {tl.icon} {tl.label}
                          </span>
                        ) : <span style={{ color: '#cbd5e1' }}>-</span>}
                      </td>
                      <td style={{ ...tdStyle, fontSize: 11, color: '#94a3b8' }}>{fmt(row.waktu_booking)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '12px 0', flexWrap: 'wrap' }}>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
              style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #dbeafe', cursor: 'pointer', background: '#fff', color: '#2563eb' }}>← Prev</button>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, idx) => idx+1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #dbeafe', cursor: 'pointer',
                  background: page===p ? '#2563eb' : '#fff', color: page===p ? '#fff' : '#2563eb', fontWeight: 600 }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
              style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #dbeafe', cursor: 'pointer', background: '#fff', color: '#2563eb' }}>Next →</button>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div style={{
        background: '#1e40af', borderRadius: 14, padding: '14px 20px',
        display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center'
      }}>
        {[
          { label: 'Total Belum',      value: totalBelum,     color: '#fef9c3' },
          { label: 'Total Selesai',    value: totalSelesai,   color: '#bbf7d0' },
          { label: 'Total Batal',      value: totalBatal,     color: '#fecaca' },
          { label: 'SEP Terbit',       value: sepTerbit,      color: '#bfdbfe' },
          { label: 'MJKN Total',       value: mjknTotal,      color: '#ddd6fe' },
          { label: 'MJKN Selesai',     value: mjknSelesai,    color: '#bbf7d0' },
          { label: 'MJKN Belum',       value: mjknBelum,      color: '#fef9c3' },
          { label: 'Non-MJKN Selesai', value: nonMjknSelesai, color: '#bbf7d0' },
          { label: 'Non-MJKN Belum',   value: nonMjknBelum,   color: '#fef9c3' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
        {mjknTotal > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#bbf7d0' }}>
              {Math.round(mjknSelesai/mjknTotal*100)}%
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>MJKN Selesai %</div>
          </div>
        )}
      </div>
    </div>
  );
};

const thStyle = {
  padding: '10px 12px', textAlign: 'left', fontWeight: 700,
  color: '#1e40af', borderBottom: '2px solid #dbeafe',
  whiteSpace: 'nowrap', fontSize: 12
};
const tdStyle = { padding: '9px 12px', color: '#374151' };

// ─────────────────────────────────────────────
// NAV TABS
// ─────────────────────────────────────────────
const TABS = [
  { id: 'overview',      label: 'Overview',           icon: '📊' },
  { id: 'antrol_detail', label: 'Antrol per Tanggal', icon: '🎫' },
  { id: 'tt',            label: 'Tempat Tidur',        icon: '🛏️' },
  { id: 'sep',           label: 'Antrol & SEP',        icon: '📋' },
  { id: 'surat_kontrol', label: 'Surat Kontrol',       icon: '📝' },
  { id: 'operasi',       label: 'Jadwal Operasi',      icon: '🔪' },
];

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
function MonitoringPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState(today());

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f0f7ff 0%, #e8f4fd 50%, #f0fdf4 100%)',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* TOP BAR */}
      <div style={{
        background: 'linear-gradient(90deg, #1e40af, #1d4ed8)',
        color: '#fff', padding: '0 24px',
        boxShadow: '0 4px 20px rgba(30,64,175,0.3)'
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>🏥</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>Monitoring Kepatuhan BPJS</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 1 }}>RS Gladish Medical Centre · Sistem Monitoring Terintegrasi</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ fontSize: 12, opacity: 0.8 }}>Tanggal:</label>
              <input
                type="date" value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{
                  padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, cursor: 'pointer', outline: 'none'
                }}
              />
              <a href="/bookingbpjs" style={{
                padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.3)'
              }}>🎫 Booking Antrol</a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2, marginTop: 16, overflowX: 'auto' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '10px 18px', border: 'none', cursor: 'pointer',
                background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: '#fff', fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 400,
                borderBottom: activeTab === tab.id ? '3px solid #93c5fd' : '3px solid transparent',
                borderRadius: '6px 6px 0 0', whiteSpace: 'nowrap', transition: 'all 0.15s'
              }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <StartAntrolSection selectedDate={selectedDate} />
            </div>
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <SepVclaimSection selectedDate={selectedDate} />
            </div>
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <DetailAntrolSection selectedDate={selectedDate} />
            </div>
          </div>
        )}
        {activeTab === 'tt' && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <TempurTidurSection />
          </div>
        )}
        {activeTab === 'antrol_detail' && <AntrolTab selectedDate={selectedDate} />}
        {activeTab === 'sep' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <StartAntrolSection selectedDate={selectedDate} />
            </div>
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <SepVclaimSection selectedDate={selectedDate} />
            </div>
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <DetailAntrolSection selectedDate={selectedDate} />
            </div>
          </div>
        )}
        {activeTab === 'surat_kontrol' && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <SuratKontrolSection selectedDate={selectedDate} />
          </div>
        )}
        {activeTab === 'operasi' && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <JadwalOperasiSection selectedDate={selectedDate} />
          </div>
        )}
      </div>
    </div>
  );
}

export default MonitoringPage;