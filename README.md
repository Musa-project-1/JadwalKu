# JadwalKu

JadwalKu adalah aplikasi web progresif (PWA) untuk manajemen jadwal kuliah, kalender akademik, dan kegiatan mahasiswa yang berjalan secara offline-first dengan sinkronisasi cloud.

---

## Fitur Utama

### Sisi Mahasiswa
- **Beranda Ringkas:** Kartu sesi kelas berikutnya, indikator status perkuliahan hari ini, dan hisab waktu sholat lokal untuk pengingat ibadah.
- **Jadwal Mingguan Zero-Scroll:** Tampilan matriks sesi kuliah per hari tanpa perlu scroll berlebih, filter berbasis prodi dan semester.
- **Cetak Format Resmi:** Ekspor jadwal kuliah ke format cetak A4 landscape lengkap dengan Kop Surat Universitas dan kolom tanda tangan Dekan/Kaprodi.
- **Kalender Akademik:** Sinkronisasi agenda perkuliahan (KRS, masa perkuliahan, minggu tenang, UTS, UAS, yudisium, dan hari libur).
- **Manajemen Tugas & Ujian:** Pencatatan tenggat waktu tugas serta jadwal ujian dengan pengingat otomatis.

### Sisi Administrator
- **Universal Multi-Format Importer (Zero-Click):**
  - **Excel Spreadsheet:** Mendukung berkas matriks jadwal multi-sheet per program studi secara otomatis tanpa pemetaan manual.
  - **Kalender Akademik (Kaldik):** Ekstraksi agenda dari PDF/OCR dengan deteksi layout kolom ganda (gutter detection), perhitungan batas semester, dan penentuan Tahun Ajaran aktif otomatis.
  - **Dokumen Word (.docx) & Gambar/Foto (.png/.jpg via OCR).**
- **Validasi & Deteksi Bentrok:** Pendeteksian bentrok ruangan fisik antar-kelas sekaligus mendukung kelas gabungan (GBK) dan hybrid lintas prodi.
- **Alur Pergantian Tahun Ajaran (SOP TA Baru):** Publikasi jadwal baru otomatis memindahkan jadwal lama ke arsip tanpa menghapus riwayat akademik.
- **Pusat Pengumuman & Direktori Ruangan:** Siaran informasi akademik terarah dan denah/lokasi ruangan kampus.
- **Cadangan & Pemulihan Basis Data:** Ekspor dan impor seluruh data sistem dalam format JSON standar.

---

## Tumpukan Teknologi

- **Antarmuka (Frontend):** React 18, Vite, Tailwind CSS, Lucide / Material Icons.
- **PWA & Offline-First:** Vite PWA Plugin, Workbox Service Worker, LocalStorage.
- **Basis Data & Autentikasi:** Google Firebase (Cloud Firestore & Firebase Authentication).
- **Engine Ekstraksi Berkas:**
  - Spreadsheet: `xlsx` (SheetJS CE)
  - PDF: `pdfjs-dist` (local worker bundle)
  - Dokumen Word: `mammoth`
  - Gambar/OCR: `tesseract.js` (local worker bundle)
- **Pengujian:** Node.js native test runner via `vite-node` (55 automated tests).

---

## Struktur Proyek

```text
JadwalKu/
├── docs/                        # Dokumentasi teknis & SOP sistem
├── frontend/
│   ├── public/                  # Aset statis & manifest PWA
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/           # Komponen portal admin & import modal
│   │   │   ├── schedule/        # Grid timetable & kartu jadwal
│   │   │   └── student/         # Tampilan portal mahasiswa & onboarding
│   │   ├── constants/           # Preset kalender, prodi, dan libur nasional
│   │   ├── context/             # CampusContext, AppContext
│   │   ├── hooks/               # Custom React hooks (auth, firestore, dsb)
│   │   ├── lib/
│   │   │   ├── kaldik/          # Utilitas parser Kalender Akademik
│   │   │   ├── xlsx/            # Utilitas parser spreadsheet & multi-sheet
│   │   │   ├── notificationEngine.js
│   │   │   ├── prayerTimes.js   # Hisab astronomis waktu sholat
│   │   │   └── uploadValidator.js
│   │   └── pages/               # Halaman utama (Home, Schedule, Admin, dsb)
│   ├── test_runner.mjs          # Test runner otomatis (55 test suite)
│   └── vite.config.js           # Konfigurasi build Vite, PWA, dan chunking
├── firestore.rules              # Aturan keamanan Cloud Firestore
└── package.json                 # Workspace root scripts
```

---

## Panduan Menjalankan Proyek

### 1. Prasyarat
- Node.js versi 18 ke atas
- npm versi 9 ke atas

### 2. Instalasi Dependensi
```bash
git clone https://github.com/Musa-project-1/JadwalKu.git
cd JadwalKu/frontend
npm install
```

### 3. Konfigurasi Lingkungan (.env)
Salin contoh berkas konfigurasi di dalam folder `frontend/`:
```bash
cp .env.example .env
```
Isi konfigurasi Firebase pada berkas `.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
*Catatan: Aplikasi tetap dapat berjalan dalam mode demo/lokal tanpa konfigurasi Firebase.*

### 4. Menjalankan Server Pengembangan
```bash
# Dari root proyek
npm run dev

# Atau langsung dari folder frontend
cd frontend
npm run dev
```
Aplikasi akan aktif di `http://localhost:5173`.

### 5. Menjalankan Test Suite
```bash
npm run test
```
Menjalankan 55 pengujian otomatis mencakup modul hisab waktu sholat, normalisasi jadwal, parser kaldik, ekstraksi multi-sheet Excel, hingga ketahanan error boundary.

### 6. Build Produksi
```bash
npm run build
```
Hasil build produksi yang dioptimalkan beserta aset PWA dan Service Worker akan tersimpan di `frontend/dist/`.

---

## Lisensi & Atribusi

Dikembangkan untuk kebutuhan manajemen perkuliahan terintegrasi. Bebas digunakan dan dimodifikasi untuk pengembangan sistem akademik kampus.
