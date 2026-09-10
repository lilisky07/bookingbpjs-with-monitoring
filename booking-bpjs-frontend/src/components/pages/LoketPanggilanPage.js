import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const JENIS_LOKET = [
  { prefix: 'A', label: 'Umum', color: '#007AFF' },
  { prefix: 'B', label: 'BPJS', color: '#34C759' },
  { prefix: 'F', label: 'Farmasi', color: '#FF9500' },
];

const btnStyle = (color, disabled) => ({
  padding: '14px 20px', borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
  background: disabled ? '#D1D1D6' : color, color: '#fff', fontWeight: 700, fontSize: 15,
  letterSpacing: '-0.2px', transition: 'transform 0.15s ease', width: '100%',
});

function LoketPanggilanPage() {
  const [namaLoket, setNamaLoket] = useState(() => localStorage.getItem('nama_loket_terakhir') || 'Loket 1');
  const [jenisAktif, setJenisAktif] = useState('A');
  const [menunggu, setMenunggu] = useState([]);
  const [sedangDipanggil, setSedangDipanggil] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState('');

  const fetchMenunggu = useCallback(() => {
    axios.get('/api/antrian-panggilan/menunggu', { params: { prefix: jenisAktif } })
      .then(r => setMenunggu(r.data.success ? r.data.data : []))
      .catch(() => {});
  }, [jenisAktif]);

  useEffect(() => {
    fetchMenunggu();
    const interval = setInterval(fetchMenunggu, 5000);
    return () => clearInterval(interval);
  }, [fetchMenunggu]);

  useEffect(() => {
    localStorage.setItem('nama_loket_terakhir', namaLoket);
  }, [namaLoket]);

  const panggilBerikutnya = () => {
    setLoading(true);
    setPesan('');
    axios.post('/api/antrian-panggilan/panggil-berikutnya', { prefix: jenisAktif, loket: namaLoket })
      .then(r => {
        if (r.data.success) {
          setSedangDipanggil(r.data.data);
          fetchMenunggu();
        }
      })
      .catch(err => setPesan(err.response?.data?.message || 'Tidak ada antrian menunggu'))
      .finally(() => setLoading(false));
  };

  const panggilUlang = () => {
    if (!sedangDipanggil) return;
    axios.post('/api/antrian-panggilan/panggil-ulang', { id: sedangDipanggil.id }).catch(() => {});
  };

  const tandaiSelesai = () => {
    if (!sedangDipanggil) return;
    axios.post('/api/antrian-panggilan/selesai', { id: sedangDipanggil.id })
      .then(() => setSedangDipanggil(null))
      .catch(() => {});
  };

  const jenis = JENIS_LOKET.find(j => j.prefix === jenisAktif);

  return (
    <div style={{ minHeight: '100vh', background: '#F2F2F7', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', padding: 20 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1D1D1F', marginBottom: 16, textAlign: 'center' }}>
          🔔 Panel Panggilan Petugas
        </h1>

        {/* Nama loket */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <label style={{ fontSize: 12, color: '#6E6E73', fontWeight: 600, display: 'block', marginBottom: 6 }}>Nama Loket / Petugas</label>
          <input value={namaLoket} onChange={e => setNamaLoket(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #D1D1D6', fontSize: 14 }} />
        </div>

        {/* Pilih jenis layanan */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {JENIS_LOKET.map(j => (
            <button key={j.prefix} onClick={() => { setJenisAktif(j.prefix); setSedangDipanggil(null); }}
              style={{
                flex: 1, padding: '12px 8px', borderRadius: 12, border: jenisAktif === j.prefix ? `2px solid ${j.color}` : '1px solid #D1D1D6',
                background: jenisAktif === j.prefix ? `${j.color}18` : '#fff', color: jenisAktif === j.prefix ? j.color : '#6E6E73',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
              {j.label}
            </button>
          ))}
        </div>

        {/* Nomor sedang dipanggil */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 14, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 12, color: '#8E8E93', fontWeight: 600, marginBottom: 8 }}>SEDANG DIPANGGIL</div>
          <div style={{ fontSize: 56, fontWeight: 800, color: jenis.color, letterSpacing: '-2px', lineHeight: 1 }}>
            {sedangDipanggil ? sedangDipanggil.kode : '—'}
          </div>
          {sedangDipanggil && <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 6 }}>{namaLoket}</div>}
        </div>

        {pesan && (
          <div style={{ background: '#FFF3CD', color: '#8A6D00', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14, textAlign: 'center' }}>
            {pesan}
          </div>
        )}

        {/* Tombol testing: generate banyak nomor sekaligus */}
        <button
          onClick={() => {
            axios.post('/api/antrian-panggilan/generate-banyak', { prefix: jenisAktif, jumlah: 100 })
              .then(r => { setPesan(r.data.message || 'Berhasil generate'); fetchMenunggu(); })
              .catch(err => setPesan(err.response?.data?.message || 'Gagal generate'));
          }}
          style={{
            width: '100%', padding: '9px', marginBottom: 14, borderRadius: 10, border: '1px dashed #C7C7CC',
            background: '#F9F9FB', color: '#6E6E73', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
          🧪 [Testing] Generate 100 Nomor {jenis.label}
        </button>

        {/* Tombol aksi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <button onClick={panggilBerikutnya} disabled={loading} style={btnStyle(jenis.color, loading)}>
            {loading ? 'Memanggil…' : `📢 Panggil Nomor Berikutnya (${jenis.label})`}
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={panggilUlang} disabled={!sedangDipanggil} style={{ ...btnStyle('#8E8E93', !sedangDipanggil), flex: 1, fontSize: 13, padding: '10px' }}>
              🔁 Panggil Ulang
            </button>
            <button onClick={tandaiSelesai} disabled={!sedangDipanggil} style={{ ...btnStyle('#34C759', !sedangDipanggil), flex: 1, fontSize: 13, padding: '10px' }}>
              ✓ Selesai
            </button>
          </div>
        </div>

        {/* Daftar menunggu */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F', marginBottom: 10 }}>
            Menunggu ({jenis.label}) — {menunggu.length}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {menunggu.length === 0
              ? <div style={{ color: '#8E8E93', fontSize: 13 }}>Tidak ada antrian menunggu</div>
              : menunggu.map(m => (
                <span key={m.id} style={{ padding: '6px 12px', borderRadius: 8, background: '#F2F2F7', fontWeight: 600, fontSize: 13, color: '#1D1D1F' }}>
                  {m.kode}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoketPanggilanPage;