# Jadwal Kampus (frontend)

PWA mahasiswa/admin untuk jadwal kuliah. Fase 1: fondasi Vite + React 18 + Tailwind + routing + Firebase client.

## Menjalankan

```bash
cd frontend
npm install
cp .env.example .env   # isi VITE_FIREBASE_* setelah proyek Firebase dibuat (Fase 2)
npm run dev
```

Build produksi: `npm run build`

Tanpa kredensial Firebase, aplikasi tetap jalan; SDK tidak diinisialisasi sampai `.env` terisi.
