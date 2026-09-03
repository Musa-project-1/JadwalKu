import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../Icon'
import { useApp } from '../../hooks/useApp'
import { FEATURE_DOCS_TRANSLATIONS } from '../../data/featureDocsData'

const FEATURE_DOCS_DATA = [
  // ── PILAR A: MAHASISWA ──
  {
    id: 1,
    pilar: 'student',
    title: 'Generator Gambar Jadwal WA',
    icon: 'image',
    color: 'from-pink-500/20 to-rose-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30',
    targetRole: 'Mahasiswa',
    route: '/bagikan',
    routeLabel: 'Buka Menu Bagikan Jadwal',
    summary: 'Membuat poster gambar jadwal beresolusi tinggi, estetik, dan rapi untuk dibagikan ke grup kelas WhatsApp.',
    howTo: [
      'Buka menu "Jadwal" atau "Bagikan" di sidebar.',
      'Pilih kartu "Ekspor Gambar Jadwal" atau tombol "Bagikan Gambar".',
      'Pilih tema tampilan (Light Mode atau Dark Mode).',
      'Klik tombol "Salin Gambar ke Clipboard" untuk langsung di-paste di WhatsApp Web, atau klik "Unduh Gambar PNG" untuk menyimpan di galeri smartphone.',
    ],
    tips: 'Gambar sudah otomatis menyertakan nama program studi, semester, dan waktu pembuatan.',
  },
  {
    id: 2,
    pilar: 'student',
    title: 'Status Kelas Live & Countdown Widget',
    icon: 'timer',
    color: 'from-emerald-500/20 to-teal-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    targetRole: 'Mahasiswa',
    route: '/',
    routeLabel: 'Buka Beranda',
    summary: 'Widget pintar di Beranda yang mendeteksi status perkuliahan hari ini secara otomatis secara real-time.',
    howTo: [
      'Buka halaman Beranda ("Home").',
      'Jika ada kelas sedang berlangsung, kartu live radar berdenyut hijau akan menampilkan sisa menit kuliah dan progress bar.',
      'Jika ada kelas berikutnya, kartu akan menampilkan countdown hitung mundur.',
      'Klik tombol "Detail" pada kartu untuk membuka detail mata kuliah dan nomor kontak dosen.',
    ],
    tips: 'Status otomatis diperbarui setiap 15 detik tanpa perlu me-refresh halaman.',
  },
  {
    id: 3,
    pilar: 'student',
    title: 'Kustomisasi "Jadwal Saya" (Lintas Semester)',
    icon: 'star',
    color: 'from-amber-500/20 to-yellow-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    targetRole: 'Mahasiswa',
    route: '/jadwal',
    routeLabel: 'Buka Jadwal Mingguan',
    summary: 'Mengatur jadwal khusus untuk mahasiswa yang mengambil mata kuliah mengulang atau peminatan lintas semester/prodi.',
    howTo: [
      'Buka menu "Jadwal", lalu klik tombol bintang ⭐ "Jadwal Kustom Saya".',
      'Pilih tombol "Atur Pilihan Matkul".',
      'Centang mata kuliah apa saja yang Anda ambil dari semester atau prodi mana pun.',
      'Gunakan tombol "Salin dari Paket Semester Ini" untuk mengisi cepat draft awal Anda.',
      'Simpan kustomisasi. Jadwal beranda dan mingguan Anda akan otomatis menyesuaikan hanya mata kuliah pilihan Anda.',
    ],
    tips: 'Tersedia kalkulator SKS dinamis dan deteksi tabrakan jam kuliah pada matkul pilihan Anda.',
  },
  {
    id: 4,
    pilar: 'student',
    title: 'Sinkronisasi Kalender Ponsel (.ics)',
    icon: 'calendar_month',
    color: 'from-blue-500/20 to-cyan-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    targetRole: 'Mahasiswa',
    route: '/bagikan',
    routeLabel: 'Buka Menu Bagikan / .ics',
    summary: 'Memasukkan seluruh jadwal kuliah semesteran dan jadwal ujian ke kalender bawaan smartphone (Google Calendar, Apple iCal, Outlook).',
    howTo: [
      'Buka menu "Bagikan" di sidebar atau tombol Kalender HP di halaman Ujian.',
      'Klik opsi "Sinkronisasi Kalender HP (.ics)".',
      'File .ics akan terunduh. Buka file tersebut di smartphone Anda (iPhone / Android) lalu klik "Add All / Tambahkan Semua".',
      'Atau klik "Buka Web Google Calendar" untuk langsung menambahkan event ke akun Google Anda.',
    ],
    tips: 'Sudah dilengkapi alarm otomatis bawaan kalender HP H-30 menit sebelum kuliah dan H-1 hari sebelum ujian.',
  },
  {
    id: 5,
    pilar: 'student',
    title: 'Pencarian & Jadwal Mengajar Dosen',
    icon: 'search',
    color: 'from-indigo-500/20 to-blue-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    targetRole: 'Mahasiswa / Dosen',
    route: '/cari',
    routeLabel: 'Buka Direktori Pencarian',
    summary: 'Melihat jadwal mengajar dosen di minggu ini untuk mempermudah bimbingan skripsi atau konsultasi tugas.',
    howTo: [
      'Buka menu "Pencarian" atau tekan tombol pintas keyboard Cmd+K / Ctrl+K.',
      'Pilih tab "Dosen Pengampu".',
      'Ketik nama dosen yang dicari.',
      'Klik kartu dosen untuk membuka modal ringkasan jadwal mengajar mingguan per hari, jam, mata kuliah, dan ruangan.',
      'Tersedia tombol langsung "Hubungi WhatsApp" dosen bersangkutan.',
    ],
    tips: 'Status mengajar dosen hari ini (Sedang Mengajar / Ada Kelas Nanti / Kosong) tertera jelas.',
  },
  {
    id: 6,
    pilar: 'student',
    title: 'Tracker Presensi & Sisa Jatah Absen',
    icon: 'checklist',
    color: 'from-teal-500/20 to-emerald-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
    targetRole: 'Mahasiswa',
    route: '/jadwal',
    routeLabel: 'Buka Jadwal & Presensi',
    summary: 'Melacak kehadiran per mata kuliah dan menghitung sisa jatah ketidakhadiran agar tidak terkena sanksi larangan ikut UAS (syarat 75%).',
    howTo: [
      'Buka menu "Jadwal", lalu klik tombol "Presensi & Absensi" di toolbar atas.',
      'Klik salah satu sesi pertemuan (Pertemuan 1 s.d. 16) untuk mengganti status: H (Hadir) → I (Izin) → S (Sakit) → A (Alpa).',
      'Perhatikan indikator sisa jatah absen: Hijau (Aman), Kuning (Waspada 1x), Merah (Kritis 0x / Bahaya Tidak Boleh UAS).',
    ],
    tips: 'Data presensi tersimpan otomatis dan privat di penyimpanan browser perangkat Anda.',
  },
  {
    id: 7,
    pilar: 'student',
    title: 'Catatan Cepat per Sesi Kuliah',
    icon: 'sticky_note_2',
    color: 'from-orange-500/20 to-amber-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    targetRole: 'Mahasiswa',
    route: '/jadwal',
    routeLabel: 'Buka Catatan Sesi',
    summary: 'Mencatat tugas, kuis, atau pengumuman dosen langsung menempel pada kartu sesi jadwal terkait.',
    howTo: [
      'Buka menu "Jadwal" lalu klik salah satu kartu mata kuliah.',
      'Di panel detail, ketik catatan pada kolom "Catatan Sesi Perkuliahan".',
      'Gunakan tombol template cepat seperti: 💻 Bawa Laptop, 📝 Ada Kuis, 📚 Bab Baru, ⏰ Jam Khusus, 👥 Tugas Kelompok.',
      'Catatan otomatis tersimpan (*auto-saved*) dan akan muncul sebagai chip oranye di timeline.',
      'Klik tombol "Rekap Catatan" di toolbar untuk melihat seluruh catatan kuliah semester ini dalam 1 jendela.',
    ],
    tips: 'Bisa disalin ke clipboard 1-klik untuk dikirim ke teman.',
  },
  {
    id: 8,
    pilar: 'student',
    title: 'Peringatan Pindah Gedung Berurutan',
    icon: 'directions_run',
    color: 'from-rose-500/20 to-orange-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    targetRole: 'Mahasiswa',
    route: '/jadwal',
    routeLabel: 'Buka Jadwal',
    summary: 'Deteksi otomatis jika Anda memiliki 2 jadwal kuliah berurutan tanpa jeda di gedung yang berbeda.',
    howTo: [
      'Sistem otomatis mendeteksi jika jeda antar 2 kelas berurutan ≤ 15 menit dan berada di ruangan/gedung berbeda.',
      'Badge oranye "🏃 Pindah Ruang (Jeda X mnt)" akan muncul pada kartu jadwal.',
      'Klik kartu untuk membaca rincian gedung asal dan gedung tujuan agar Anda siap berpindah sebelum kelas dimulai.',
    ],
    tips: 'Membantu mahasiswa menghindari keterlambatan saat mobilisasi antar lantai atau gedung kampus.',
  },
  {
    id: 9,
    pilar: 'student',
    title: 'Tautan Cepat Perkuliahan (LMS, Zoom & WA)',
    icon: 'link',
    color: 'from-cyan-500/20 to-blue-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    targetRole: 'Mahasiswa',
    route: '/jadwal',
    routeLabel: 'Buka Tautan Perkuliahan',
    summary: 'Menyimpan dan membuka link Google Classroom/GDrive, Zoom/Google Meet, dan grup WA kelas dalam 1 klik.',
    howTo: [
      'Klik salah satu kartu mata kuliah di Jadwal Mingguan.',
      'Pada bagian "Tautan Perkuliahan", klik "Atur Link".',
      'Masukkan link Google Classroom / LMS, link Zoom / Google Meet, dan link Grup WhatsApp.',
      'Simpan link. Sekarang Anda bisa bergabung kuliah online hanya dengan 1-klik dari Beranda atau Jadwal.',
    ],
    tips: 'Jika link Zoom kosong, sistem menyediakan tombol pintas langsung ke portal Zoom.',
  },
  {
    id: 10,
    pilar: 'student',
    title: 'Cetak PDF Meja Belajar & Kartu Saku',
    icon: 'print',
    color: 'from-violet-500/20 to-purple-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
    targetRole: 'Mahasiswa',
    route: '/jadwal',
    routeLabel: 'Buka Modal Cetak PDF',
    summary: 'Mencetak dokumen jadwal 1 lembar yang rapi, hemat tinta (*ink-saver*), untuk ditempel di meja belajar kos atau dilipat jadi kartu saku.',
    howTo: [
      'Buka menu "Jadwal", lalu klik ikon printer 🖨️ "Cetak PDF" di toolbar atas.',
      'Pilih format: "Tempelan Meja Belajar A4" atau "Kartu Saku Lipat".',
      'Sesuaikan kustomisasi: Nama Mahasiswa, toggle tampilkan dosen/ruangan/catatan/memo target IPK.',
      'Klik tombol "Cetak Dokumen (Ctrl+P)" atau simpan sebagai file PDF.',
    ],
    tips: 'Desain monokrom bersih tanpa latar belakang tebal sehingga sangat hemat tinta printer kos.',
  },
  {
    id: 11,
    pilar: 'student',
    title: 'Simulator & Clash Tester Rencana KRS',
    icon: 'science',
    color: 'from-emerald-500/20 to-teal-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    targetRole: 'Mahasiswa',
    route: '/jadwal',
    routeLabel: 'Buka Simulator KRS',
    summary: 'Menyimulasikan pemilihan paket kelas paralel sebelum mengisi KRS resmi kampus (SIAKAD) agar tidak bentrok.',
    howTo: [
      'Buka menu "Jadwal", lalu klik tombol "Simulator KRS" di toolbar atas.',
      'Pilih tab draft rencana: Plan A (Utama), Plan B (Cadangan), atau Plan C (Alternatif).',
      'Pilih mata kuliah yang ingin Anda ambil pada semester baru.',
      'Sistem akan otomatis mendeteksi jika ada tabrakan jam kuliah (*Clash Detected*) dan menghitung kuota SKS Anda.',
      'Klik "Salin Format SIAKAD" untuk mendapatkan ringkasan teks siap paste saat pengisian KRS resmi.',
      'Klik "Terapkan ke Jadwal Saya" untuk langsung mengaktifkannya sebagai jadwal harian Anda.',
    ],
    tips: 'Sangat berguna untuk persiapan "War KRS" semester baru.',
  },
  {
    id: 12,
    pilar: 'student',
    title: 'Notifikasi Web Push & Local Audio Alarm',
    icon: 'notifications_active',
    color: 'from-amber-500/20 to-orange-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    targetRole: 'Mahasiswa',
    route: '/pengaturan',
    routeLabel: 'Buka Pengaturan Notifikasi',
    summary: 'Memberikan notifikasi pengingat sebelum kelas dimulai dan sebelum batas pengumpulan tugas dengan nada audio alarm.',
    howTo: [
      'Buka menu "Pengaturan" di sidebar.',
      'Pada kartu "Notifikasi & Pengingat Kuliah", klik tombol "Izinkan Notifikasi Browser".',
      'Pilih jendela waktu pengingat kelas: 10 menit, 15 menit, 30 menit, 45 menit, atau 60 menit sebelum kelas.',
      'Aktifkan opsi "Efek Suara Chime" jika ingin mendengar nada instrumen pengingat lembut.',
      'Klik tombol "🧪 Uji Coba Notifikasi Browser" untuk mengetes langsung pada laptop / HP Anda.',
    ],
    tips: 'Notifikasi tetap aktif berjalan saat aplikasi di-install sebagai PWA di HP.',
  },
  {
    id: 13,
    pilar: 'student',
    title: 'Informasi Detail Lokasi Ruangan & Denah Lantai',
    icon: 'explore',
    color: 'from-indigo-500/20 to-purple-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    targetRole: 'Mahasiswa',
    route: '/jadwal',
    routeLabel: 'Buka Jadwal / Info Ruang',
    summary: 'Menampilkan detail gedung kampus, posisi lantai, fasilitas ruangan, panduan arah mahasiswa baru, dan jadwal penggunaan ruangan.',
    howTo: [
      'Klik nama ruangan kuliah di Beranda (kartu kelas berikutnya), di Jadwal Mingguan (kartu ruangan), atau di Jadwal Ujian.',
      'Modal informasi lokasi akan terbuka menampilkan: Nama Gedung Resmi, Posisi Lantai, dan Fasilitas Ruangan (AC, Proyektor, WiFi, PC).',
      'Baca panduan navigasi langkah demi langkah (*Wayfinding*) yang ramah mahasiswa baru.',
      'Lihat jadwal perkuliahan lain yang sedang/akan memakai ruangan tersebut hari ini (*Room Occupancy*).',
      'Klik tombol "Salin Panduan" untuk membagikan petunjuk jalan ke teman sekelas di WhatsApp.',
    ],
    tips: 'Otomatis mendeteksi lantai dari nomor ruangan (misal: R. 204 &rarr; Lantai 2, R. 301 &rarr; Lantai 3).',
  },

  // ── PILAR B: ADMINISTRATOR & DOSEN ──
  {
    id: 14,
    pilar: 'admin',
    title: 'Universal Multi-Format Schedule Importer',
    icon: 'upload_file',
    color: 'from-blue-500/20 to-indigo-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    targetRole: 'Administrator',
    route: '/admin/jadwal',
    routeLabel: 'Buka Impor Jadwal Admin',
    summary: 'Engine impor jadwal cerdas di browser (*Zero-Backend*) yang mendukung format file Excel, Word, PDF digital, dan Foto OCR.',
    howTo: [
      'Masuk ke Panel Admin &rarr; menu "Kelola Jadwal".',
      'Klik tombol "Impor Jadwal" di kanan atas.',
      'Tarik (*drag & drop*) berkas jadwal kampus Anda (.xlsx, .xls, .csv, .docx, .pdf, .png, .jpg).',
      'Pilih Tahun Ajaran target untuk data yang diimpor.',
      'Sistem otomatis memetakan kolom (Hari, Jam, Mata Kuliah, Dosen, Ruang, Prodi, Semester).',
      'Periksa pratinjau tabel live, lalu klik "Simpan ke Database".',
    ],
    tips: 'Format resmi kampus dideteksi otomatis tanpa perlu setting kolom manual (*Zero-Click experience*).',
  },
  {
    id: 15,
    pilar: 'admin',
    title: 'Kalender Akademik Dinamis & Tahun Ajaran',
    icon: 'edit_calendar',
    color: 'from-emerald-500/20 to-green-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    targetRole: 'Administrator',
    route: '/admin/pengaturan-akademik',
    routeLabel: 'Buka Pengaturan Akademik',
    summary: 'Mengatur batas tanggal semester ganjil/genap dan kalender libur kampus agar status tahun ajaran berjalan secara otomatis.',
    howTo: [
      'Masuk ke Panel Admin &rarr; menu "Pengaturan Akademik".',
      'Atur tanggal mulai dan selesai untuk Semester Ganjil, Semester Genap, dan Masa Libur.',
      'Kelola daftar hari libur nasional atau cuti bersama universitas.',
      'Status tahun ajaran (misal TA 2026/2027) di seluruh aplikasi mahasiswa akan otomatis terupdate mengikuti tanggal sistem.',
    ],
    tips: 'Tersedia sakelar Status Jadwal (Published vs Draft) untuk mencegah mahasiswa melihat jadwal yang masih direvisi.',
  },
  {
    id: 16,
    pilar: 'admin',
    title: 'Smart Clash & Ruangan Overlap Detector',
    icon: 'warning',
    color: 'from-red-500/20 to-rose-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    targetRole: 'Administrator',
    route: '/admin/jadwal',
    routeLabel: 'Buka Kelola Jadwal Admin',
    summary: 'Mendeteksi bentrok jadwal secara otomatis saat admin menyusun atau mengedit sesi perkuliahan.',
    howTo: [
      'Buka Panel Admin &rarr; "Kelola Jadwal".',
      'Sistem secara real-time memindai 3 jenis bentrok: (1) Dosen mengajar 2 kelas bersamaan, (2) Ruangan dipakai 2 mata kuliah bersamaan, (3) Rombel mahasiswa bentrok.',
      'Baris yang bentrok akan memiliki badge merah berkedip "BENTROK" dengan keterangan penyebabnya.',
      'Gunakan tombol filter cepat "⚠️ Bentrok (X)" di toolbar untuk menyaring hanya jadwal yang bermasalah.',
      'Saat menambah/mengedit sesi, sistem memberikan peringatan live sebelum data disimpan.',
    ],
    tips: 'Pencegahan bentrok bekerja lintas program studi di seluruh universitas.',
  },
  {
    id: 17,
    pilar: 'admin',
    title: 'Broadcast Pengumuman & Kuliah Pengganti',
    icon: 'campaign',
    color: 'from-amber-500/20 to-orange-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    targetRole: 'Administrator',
    route: '/admin/pengumuman',
    routeLabel: 'Buka Kelola Pengumuman',
    summary: 'Memposting pengumuman resmi, info kuliah pengganti, atau perpindahan ruangan yang langsung muncul di beranda mahasiswa.',
    howTo: [
      'Buka Panel Admin &rarr; menu "Pengumuman".',
      'Klik tombol "Tambah Pengumuman".',
      'Tulis judul dan isi pengumuman.',
      'Pilih kategori: Info (Biru), Penting / Kuliah Pengganti (Kuning), atau Darurat (Merah).',
      'Tentukan target penerima: "Semua Mahasiswa" atau khusus Prodi & Semester tertentu.',
      'Tentukan batas masa berlaku pengumuman.',
      'Simpan pengumuman. Banner akan langsung tampil di Beranda mahasiswa penerima.',
    ],
    tips: 'Mahasiswa dapat menutup (*dismiss*) banner setelah membacanya.',
  },
  {
    id: 18,
    pilar: 'admin',
    title: 'Ekspor PDF / Cetak Mading A4 Landscape Resmi',
    icon: 'picture_as_pdf',
    color: 'from-teal-500/20 to-emerald-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
    targetRole: 'Administrator / Dosen',
    route: '/admin/jadwal',
    routeLabel: 'Buka Cetak Mading Admin',
    summary: 'Mencetak jadwal kuliah resmi format tabel A4 Landscape lengkap dengan Kop Surat Universitas dan kolom tanda tangan Dekan/Kaprodi.',
    howTo: [
      'Buka Panel Admin &rarr; "Kelola Jadwal" &rarr; klik tombol "Cetak Mading A4" di toolbar atas.',
      'Pilih filter: Per Program Studi, Per Semester, Per Hari, atau Per Dosen Pengampu.',
      'Sesuaikan Nama Universitas, Fakultas, dan Nama Pejabat Pengesah (Dekan / Kaprodi).',
      'Periksa pratinjau lembar A4 Landscape di layar.',
      'Klik tombol "Cetak / Simpan PDF" untuk mencetak langsung ke kertas mading kampus.',
    ],
    tips: 'Menggunakan layout CSS @media print terisolasi standar dokumen formal kampus.',
  },
  {
    id: 19,
    pilar: 'admin',
    title: 'Sistem Backup & Restore Data 1-Klik',
    icon: 'cloud_sync',
    color: 'from-violet-500/20 to-indigo-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
    targetRole: 'Administrator',
    route: '/admin/pengaturan-akademik',
    routeLabel: 'Buka Backup & Restore',
    summary: 'Mencadangkan seluruh database jadwal, mata kuliah, dan ujian ke file JSON lokal, serta memulihkannya dengan aman.',
    howTo: [
      'Masuk ke Panel Admin &rarr; Dashboard atau Pengaturan Akademik &rarr; klik tombol "Backup / Restore".',
      'Untuk Mencadangkan: Pilih koleksi yang ingin dibackup (Jadwal, MK, Ujian, Prodi, Libur, Pengumuman, Settings), lalu klik "Unduh Cadangan JSON".',
      'Untuk Memulihkan: Unggah file JSON cadangan pada kotak dropzone restore.',
      'Pilih strategi pemulihan: "Gabungkan / Update (Merge)" atau "Timpa Bersih (Clean Replace)".',
      'Klik tombol "Jalankan Pemulihan Database". Sistem akan mengeksekusi batch Firestore secara aman.',
    ],
    tips: 'File backup terenkode rapi dengan timestamp ISO sehingga aman disimpan di Google Drive atau flashdisk.',
  },
]

export function FeatureDocsModal({ isOpen, onClose, mode = 'student' }) {
  const navigate = useNavigate()
  const { language } = useApp()
  const [activePilar, setActivePilar] = useState(mode === 'all' ? 'all' : mode)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState(mode === 'admin' ? 14 : 1)

  const rawData = useMemo(() => {
    const langKey = language === 'en' ? 'en' : 'id'
    const studentList = FEATURE_DOCS_TRANSLATIONS[langKey] || FEATURE_DOCS_TRANSLATIONS.id
    // Gabungkan dengan fitur admin dari data bawaan jika mode admin/all
    const adminList = FEATURE_DOCS_DATA.filter((i) => i.pilar === 'admin')
    return [...studentList, ...adminList]
  }, [language])

  const baseList = useMemo(() => {
    if (mode === 'student') return rawData.filter((i) => i.pilar === 'student')
    if (mode === 'admin') return rawData.filter((i) => i.pilar === 'admin')
    return rawData
  }, [mode, rawData])

  const filteredFeatures = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return baseList.filter((item) => {
      if (mode === 'all' && activePilar !== 'all' && item.pilar !== activePilar) return false
      if (!q) return true
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.howTo.some((h) => h.toLowerCase().includes(q)) ||
        item.targetRole.toLowerCase().includes(q) ||
        item.tips.toLowerCase().includes(q)
      )
    })
  }, [baseList, mode, activePilar, searchQuery])

  if (!isOpen) return null

  function handleNavigate(route) {
    onClose()
    navigate(route)
  }

  const modalTitle =
    language === 'en'
      ? (mode === 'student' ? 'Student Feature Guides' : mode === 'admin' ? 'Admin Tutorials & Documentation' : 'Feature Documentation & Guides')
      : (mode === 'student'
          ? 'Pusat Panduan Fitur Mahasiswa'
          : mode === 'admin'
          ? 'Pusat Panduan & Tutorial Admin'
          : 'Pusat Panduan & Tutorial Fitur')

  const modalSubtitle =
    language === 'en'
      ? (mode === 'student'
          ? 'Complete interactive documentation and guides for all JadwalKu student features'
          : mode === 'admin'
          ? 'Technical documentation for managing master schedule, conflicts, notices, and database'
          : 'Interactive documentation & comprehensive user guide for all JadwalKu features')
      : (mode === 'student'
          ? 'Dokumentasi & panduan lengkap penggunaan seluruh fitur mahasiswa JadwalKu'
          : mode === 'admin'
          ? 'Dokumentasi teknis pengelolaan master jadwal, bentrok, pengumuman, dan database'
          : 'Dokumentasi interaktif & panduan lengkap penggunaan seluruh fitur aplikasi JadwalKu')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low animate-fade-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 p-5 tablet:p-6 bg-surface-container-lowest/90 dark:bg-surface-container-low/90 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/25 shadow-xs shrink-0">
              <Icon name={mode === 'admin' ? 'admin_panel_settings' : 'menu_book'} size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-title-lg font-bold text-on-surface">{modalTitle}</h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                  {baseList.length} Fitur
                </span>
              </div>
              <p className="text-body-xs text-on-surface-variant mt-0.5">
                {modalSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer shrink-0"
            title="Tutup Panduan"
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        {/* Toolbar: Search + Filter Tabs */}
        <div className="p-4 tablet:p-5 border-b border-outline-variant/15 bg-surface-container-low/40 dark:bg-surface-container-high/30 flex flex-col tablet:flex-row items-stretch tablet:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Icon
              name="search"
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                mode === 'admin'
                  ? 'Cari fitur admin (misal: Impor Excel, Bentrok, Kalender, Pengumuman, Backup)...'
                  : 'Cari tutorial fitur (misal: KRS, Gambar WA, Dosen, Presensi, Kalender HP)...'
              }
              className="w-full pl-10 pr-9 py-2 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest text-body-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary dark:bg-surface-container-high/60 transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>

          {/* Filter Pills (only shown if mode === 'all') */}
          {mode === 'all' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 tablet:pb-0 shrink-0">
              <button
                type="button"
                onClick={() => setActivePilar('all')}
                className={`px-3 py-1.5 rounded-full text-body-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activePilar === 'all'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Semua ({FEATURE_DOCS_DATA.length})
              </button>
              <button
                type="button"
                onClick={() => setActivePilar('student')}
                className={`px-3 py-1.5 rounded-full text-body-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activePilar === 'student'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>🎓 Mahasiswa (13)</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePilar('admin')}
                className={`px-3 py-1.5 rounded-full text-body-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activePilar === 'admin'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>🛡️ Admin & Dosen (6)</span>
              </button>
            </div>
          )}
        </div>

        {/* Feature List Body */}
        <div className="flex-1 overflow-y-auto p-4 tablet:p-6 space-y-3">
          {filteredFeatures.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-on-surface-variant">
                <Icon name="search_off" size={28} />
              </div>
              <h4 className="text-body-md font-bold text-on-surface">Tidak ada tutorial yang cocok</h4>
              <p className="text-body-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                Coba gunakan kata kunci pencarian lain atau pilih tab filter "Semua".
              </p>
            </div>
          ) : (
            filteredFeatures.map((feat) => {
              const isExpanded = expandedId === feat.id
              return (
                <div
                  key={feat.id}
                  className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'border-primary/40 bg-surface-container-low/60 shadow-xs dark:bg-surface-container-high/40'
                      : 'border-outline-variant/20 bg-surface-container-lowest/80 hover:border-outline-variant/40 dark:bg-surface-container-low/30'
                  }`}
                >
                  {/* Card Header (Click to Expand) */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : feat.id)}
                    className="w-full p-4 tablet:p-4.5 flex items-start tablet:items-center justify-between gap-3 text-left cursor-pointer group"
                  >
                    <div className="flex items-start tablet:items-center gap-3.5 min-w-0">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br border ${feat.color} shadow-2xs group-hover:brightness-105 transition-all duration-200`}
                      >
                        <Icon name={feat.icon} size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-label-caps font-extrabold text-primary">
                            #{feat.id}
                          </span>
                          <h4 className="text-body-sm tablet:text-body-md font-bold text-on-surface group-hover:text-primary transition-colors">
                            {feat.title}
                          </h4>
                          <span className="rounded-full bg-surface-container px-2 py-0.5 text-[9.5px] font-bold text-on-surface-variant">
                            {feat.targetRole}
                          </span>
                        </div>
                        <p className="text-body-xs text-on-surface-variant line-clamp-1 mt-0.5">
                          {feat.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-1 tablet:pt-0">
                      <span className="hidden tablet:inline-block text-[11px] font-bold text-primary group-hover:underline">
                        {isExpanded ? 'Tutup Tutorial' : 'Lihat Cara Pakai'}
                      </span>
                      <Icon
                        name="expand_more"
                        size={20}
                        className={`text-on-surface-variant transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-primary' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded Content: Step-by-Step Tutorial */}
                  {isExpanded && (
                    <div className="border-t border-outline-variant/15 p-4 tablet:p-5 bg-surface-container-lowest/90 dark:bg-surface-container-low/70 space-y-4 animate-fade-in">
                      {/* Summary Banner */}
                      <p className="text-body-sm font-medium text-on-surface leading-relaxed">
                        {feat.summary}
                      </p>

                      {/* Step-by-Step Box */}
                      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 dark:bg-surface-container-high/30 p-4 space-y-2.5">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                          <Icon name="format_list_numbered" size={16} />
                          <span>Langkah-Langkah Penggunaan:</span>
                        </h5>
                        <ol className="space-y-2 text-body-xs text-on-surface-variant leading-relaxed">
                          {feat.howTo.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[10.5px] font-bold mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="flex-1 text-on-surface/90">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Pro-Tips & Action Button */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                        {feat.tips && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                            <Icon name="lightbulb" size={15} className="text-amber-500 shrink-0" />
                            <span><strong>Tips:</strong> {feat.tips}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleNavigate(feat.route)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-on-primary hover:brightness-105 active:opacity-80 text-body-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 ml-auto sm:ml-0"
                        >
                          <span>{feat.routeLabel}</span>
                          <Icon name="arrow_forward" size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-outline-variant/20 p-4 tablet:p-5 flex items-center justify-between bg-surface-container-lowest/95 dark:bg-surface-container-low/95">
          <p className="text-body-xs text-on-surface-variant hidden sm:block">
            Aplikasi JadwalKu • 100% Zero-Backend Architecture
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-body-sm transition-colors cursor-pointer ml-auto"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  )
}
