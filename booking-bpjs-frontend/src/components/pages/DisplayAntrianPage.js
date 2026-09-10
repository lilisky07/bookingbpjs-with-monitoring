import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const WARNA_PREFIX = { A: '#007AFF', B: '#34C759', F: '#FF9500' };

// Bunyi "ding-dong" sebelum suara TTS, kayak PA system di rumah sakit/bank.
// Pakai Web Audio API (oscillator) — gak butuh file audio eksternal.
function bunyikanBell() {
  return new Promise((resolve) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const mainkanNada = (freq, mulai, durasi) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + mulai);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + mulai + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + mulai + durasi);
        osc.start(ctx.currentTime + mulai);
        osc.stop(ctx.currentTime + mulai + durasi + 0.05);
      };
      // Nada "ding" (tinggi) lalu "dong" (rendah) — pola khas bel antrian
      mainkanNada(1046.5, 0, 0.35);    // ding (C6)
      mainkanNada(784.0, 0.28, 0.45);  // dong (G5)

      setTimeout(resolve, 800); // kasih jeda sebelum TTS mulai ngomong
    } catch (e) {
      resolve(); // kalau audio diblokir/gagal, tetap lanjut ke TTS
    }
  });
}

// Ucapkan kode antrian pakai Text-to-Speech browser (Web Speech API — gratis, bawaan browser)
async function ucapkanPanggilan(kode, labelLoket, loket) {
  await bunyikanBell();

  if (!window.speechSynthesis) return; // browser tidak support TTS

  // Pisahkan huruf & angka biar dibaca jelas, misal "A12" -> "A 1 2"
  const match = kode.match(/^([A-Z]+)(\d+)$/i);
  const kodeUcap = match ? `${match[1]} ${match[2].split('').join(' ')}` : kode;

  const teks = `Nomor antrian ${kodeUcap}, ${labelLoket}, silakan menuju ${loket || 'loket yang dipanggil'}`;
  const utter = new SpeechSynthesisUtterance(teks);
  utter.lang = 'id-ID';
  utter.rate = 0.95;
  utter.pitch = 1;

  // Coba pilih voice bahasa Indonesia kalau tersedia di browser/device
  const voices = window.speechSynthesis.getVoices();
  const voiceID = voices.find(v => v.lang === 'id-ID' || v.lang === 'id_ID');
  if (voiceID) utter.voice = voiceID;

  window.speechSynthesis.cancel(); // hentikan ucapan sebelumnya kalau masih jalan
  window.speechSynthesis.speak(utter);
}

function DisplayAntrianPage() {
  const [sedangDipanggil, setSedangDipanggil] = useState([]);
  const [riwayat, setRiwayat] = useState([]);
  const [jam, setJam] = useState(new Date());
  const lastKodePerPrefix = useRef({});
  const sudahInit = useRef(false);

  // Ambil nama loket dari URL, misal /display-antrian?loket=Loket%201
  // Kalau kosong -> layar gabungan semua loket (dashboard utama)
  const loketFilter = new URLSearchParams(window.location.search).get('loket') || '';

  const fetchDisplay = useCallback(() => {
    axios.get('/api/antrian-panggilan/display', { params: loketFilter ? { loket: loketFilter } : {} })
      .then(r => {
        if (r.data.success) {
          const daftarBaru = r.data.sedang_dipanggil || [];
          setSedangDipanggil(daftarBaru);
          setRiwayat(r.data.riwayat || []);

          // Bandingkan tiap prefix pakai timestamp dipanggil_at (bukan kode saja),
          // supaya "Panggil Ulang" pada nomor yang sama tetap terucap lagi
          daftarBaru.forEach(item => {
            const lastWaktu = lastKodePerPrefix.current[item.prefix];
            if (sudahInit.current && lastWaktu !== item.dipanggil_at) {
              ucapkanPanggilan(item.kode, item.label_loket, item.loket);
            }
            lastKodePerPrefix.current[item.prefix] = item.dipanggil_at;
          });
          sudahInit.current = true;
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchDisplay();
    const interval = setInterval(fetchDisplay, 3000);
    const jamInterval = setInterval(() => setJam(new Date()), 1000);
    return () => { clearInterval(interval); clearInterval(jamInterval); };
  }, [fetchDisplay]);

  const [suaraAktif, setSuaraAktif] = useState(false);
  const aktifkanSuara = () => {
    // Trik standar: mainkan bell + ucapkan teks pendek sebagai "izin" dari interaksi
    // user, supaya bell & TTS otomatis berikutnya tidak diblokir browser (autoplay policy)
    bunyikanBell();
    try {
      const utter = new SpeechSynthesisUtterance('Suara antrian aktif');
      utter.lang = 'id-ID';
      utter.volume = 0.6;
      window.speechSynthesis.speak(utter);
    } catch (e) { /* abaikan */ }
    setSuaraAktif(true);
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(180deg, #0B1220 0%, #1A2332 100%)',
      color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      padding: '32px 40px', display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {!suaraAktif && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(11,18,32,0.96)', zIndex: 999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
        }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>🔊 Aktifkan suara panggilan dulu</div>
          <div style={{ fontSize: 14, color: '#AEB6C4', maxWidth: 360, textAlign: 'center' }}>
            Browser memblokir suara otomatis sampai ada interaksi. Klik tombol ini sekali saat layar pertama kali dinyalakan.
          </div>
          <button onClick={aktifkanSuara} style={{
            padding: '14px 28px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: '#007AFF', color: '#fff', fontWeight: 700, fontSize: 16,
          }}>
            Aktifkan Suara
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
          🏥 RS Gladish Medical Centre
          {loketFilter && <span style={{ fontSize: 15, fontWeight: 600, color: '#7C8698', marginLeft: 14 }}>— {loketFilter}</span>}
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>
          {jam.toLocaleTimeString('id-ID')}
        </div>
      </div>

      {/* Nomor sedang dipanggil — grid per loket */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(sedangDipanggil.length, 1)}, 1fr)`, gap: 24, marginBottom: 40 }}>
        {sedangDipanggil.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#5A6578', fontSize: 20 }}>
            Belum ada panggilan hari ini
          </div>
        ) : sedangDipanggil.map(s => (
          <div key={s.prefix} style={{
            background: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: '32px 20px',
            textAlign: 'center', border: `2px solid ${WARNA_PREFIX[s.prefix] || '#fff'}`,
            boxShadow: `0 0 40px ${WARNA_PREFIX[s.prefix] || '#fff'}33`,
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: WARNA_PREFIX[s.prefix] || '#fff', letterSpacing: '1px', marginBottom: 8, textTransform: 'uppercase' }}>
              {s.label_loket}
            </div>
            <div style={{ fontSize: 88, fontWeight: 900, lineHeight: 1, letterSpacing: '-2px' }}>{s.kode}</div>
            <div style={{ fontSize: 17, color: '#AEB6C4', marginTop: 10, fontWeight: 600 }}>{s.loket}</div>
          </div>
        ))}
      </div>

      {/* Riwayat panggilan */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#7C8698', letterSpacing: '1px', marginBottom: 12, textTransform: 'uppercase' }}>
          Riwayat Panggilan
        </div>
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
          {riwayat.map((r, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100,
              opacity: 1 - i * 0.09,
            }}>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{r.kode}</div>
              <div style={{ fontSize: 11, color: '#7C8698', marginTop: 4 }}>{r.loket || '-'}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
      `}</style>
    </div>
  );
}

export default DisplayAntrianPage;