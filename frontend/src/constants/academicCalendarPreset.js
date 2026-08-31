/**
 * Preset Kalender Akademik — data terstruktur sebuah tahun ajaran.
 *
 * Sumber kebenaran fase kegiatan (bukan hanya 4 batas tanggal) agar
 * kalender kampus seperti pada gambar "Universitas Madani" bisa direpresentasikan
 * dan diimpor ulang. Dipakai oleh fitur "Import Kalender Akademik".
 *
 * Struktur satu event:
 * {
 *   nama: string,
 *   tanggalMulai: 'YYYY-MM-DD',
 *   tanggalSelesai: 'YYYY-MM-DD',
 *   semester: 'ganjil' | 'genap' | 'antar',   // antar = di luar ganjil/genap (libur tahun ajaran)
 *   kategori: 'registrasi'|'perkuliahan'|'uts'|'uas'|'ujian'|'yudisium'|'libur'|'kegiatan'|'minggu_tenang',
 *   tipe: 'akademik' | 'nasional' | 'kampus' | 'semester',
 *   prodi: 'Semua',
 * }
 */

export const KATEGORI_LABELS = {
  registrasi: 'Registrasi / KRS',
  perkuliahan: 'Perkuliahan',
  uts: 'UTS',
  uas: 'UAS',
  ujian: 'Ujian / Praktikum',
  yudisium: 'Yudisium',
  libur: 'Libur',
  kegiatan: 'Kegiatan',
  minggu_tenang: 'Minggu Tenang',
}

export const KATEGORI_OPTIONS = [
  { value: 'registrasi', label: 'Registrasi / KRS / Bimbingan' },
  { value: 'perkuliahan', label: 'Perkuliahan' },
  { value: 'uts', label: 'Ujian Tengah Semester (UTS)' },
  { value: 'uas', label: 'Ujian Akhir Semester (UAS)' },
  { value: 'ujian', label: 'Ujian / Praktikum / Remedial' },
  { value: 'yudisium', label: 'Yudisium' },
  { value: 'libur', label: 'Libur / Cuti' },
  { value: 'kegiatan', label: 'Kegiatan Kampus' },
  { value: 'minggu_tenang', label: 'Minggu Tenang' },
]

export const SEMESTER_AKADEMIK_LABELS = {
  ganjil: 'Semester Ganjil',
  genap: 'Semester Genap',
  antar: 'Antar Tahun Ajaran / Libur',
}

/** Warna badge per kategori (dipakai UI pratinjau & daftar). */
export const KATEGORI_TONE = {
  registrasi: 'blue',
  perkuliahan: 'emerald',
  uts: 'amber',
  uas: 'red',
  ujian: 'orange',
  yudisium: 'violet',
  libur: 'rose',
  kegiatan: 'teal',
  minggu_tenang: 'slate',
}

/**
 * Preset Kalender Akademik — contoh nyata dari gambar
 * "Universitas Madani — Kalender Pendidikan T.A. 2026/2027
 *  Fakultas Teknik dan Bisnis — Program Sarjana".
 */
export const MADANI_CALENDAR_PRESET = {
  nama: 'Universitas Madani — T.A. 2026/2027',
  tahunAjaran: '2026/2027',
  fakultas: 'Fakultas Teknik dan Bisnis',
  prodi: 'Program Sarjana',
  events: [
    // ── SEMESTER GANJIL ──
    { nama: 'Kegiatan Mahasiswa Baru & Lama ke Asrama', tanggalMulai: '2026-09-10', tanggalSelesai: '2026-09-12', semester: 'ganjil', kategori: 'kegiatan' },
    { nama: 'Registrasi, KRS & Bimbingan Akademik I', tanggalMulai: '2026-09-14', tanggalSelesai: '2026-09-19', semester: 'ganjil', kategori: 'registrasi' },
    { nama: 'Pengenalan Kehidupan Kampus bagi Mahasiswa Baru (PKKMB) T.A. 2026/2027', tanggalMulai: '2026-09-15', tanggalSelesai: '2026-09-18', semester: 'ganjil', kategori: 'kegiatan' },
    { nama: 'Perkuliahan Termin 1', tanggalMulai: '2026-09-21', tanggalSelesai: '2026-11-07', semester: 'ganjil', kategori: 'perkuliahan' },
    { nama: 'Penulisan SSP, Pengesahan Kartu Ujian, & Bimbingan Akademik II', tanggalMulai: '2026-11-02', tanggalSelesai: '2026-11-07', semester: 'ganjil', kategori: 'registrasi' },
    { nama: 'Ujian Tengah Semester (UTS)', tanggalMulai: '2026-11-09', tanggalSelesai: '2026-11-14', semester: 'ganjil', kategori: 'uts' },
    { nama: 'Perkuliahan Termin II', tanggalMulai: '2026-11-16', tanggalSelesai: '2027-01-02', semester: 'ganjil', kategori: 'perkuliahan' },
    { nama: 'Penulisan SSP, Pengesahan Kartu Ujian, & Bimbingan Akademik III', tanggalMulai: '2026-12-28', tanggalSelesai: '2027-01-02', semester: 'ganjil', kategori: 'registrasi' },
    { nama: 'Ujian Akhir Semester (UAS)', tanggalMulai: '2027-01-11', tanggalSelesai: '2027-01-16', semester: 'ganjil', kategori: 'uas' },
    { nama: 'Ujian Akhir Praktikum & Praktik Lapangan', tanggalMulai: '2027-01-18', tanggalSelesai: '2027-01-23', semester: 'ganjil', kategori: 'ujian' },
    { nama: 'Ujian Remidial', tanggalMulai: '2027-01-25', tanggalSelesai: '2027-01-27', semester: 'ganjil', kategori: 'ujian' },
    { nama: 'Kuliah Pakar/Seminar/Webinar Regional', tanggalMulai: '2027-01-28', tanggalSelesai: '2027-01-28', semester: 'ganjil', kategori: 'kegiatan' },
    { nama: 'Bimbingan Akademik IV (KHS)', tanggalMulai: '2027-01-29', tanggalSelesai: '2027-01-30', semester: 'ganjil', kategori: 'registrasi' },
    { nama: 'Pra Yudisium Semester Ganjil', tanggalMulai: '2027-02-01', tanggalSelesai: '2027-02-01', semester: 'ganjil', kategori: 'yudisium' },
    { nama: 'Yudisium Semester Ganjil', tanggalMulai: '2027-02-02', tanggalSelesai: '2027-02-02', semester: 'ganjil', kategori: 'yudisium' },
    { nama: 'Sarasehan/ Capacity Building Civitas Akademika', tanggalMulai: '2027-02-20', tanggalSelesai: '2027-02-20', semester: 'ganjil', kategori: 'kegiatan' },

    // ── SEMESTER GENAP ──
    { nama: 'Registrasi, KRS & Bimbingan Akademik I', tanggalMulai: '2027-02-17', tanggalSelesai: '2027-02-20', semester: 'genap', kategori: 'registrasi' },
    { nama: 'Perkuliahan Termin I (Pre & Post Libur Idul Fitri)', tanggalMulai: '2027-02-22', tanggalSelesai: '2027-03-06', semester: 'genap', kategori: 'perkuliahan' },
    { nama: 'Libur Idul Fitri (Hari Raya Idul Fitri diperkirakan tanggal 10 Mar 2027)', tanggalMulai: '2027-03-07', tanggalSelesai: '2027-03-27', semester: 'genap', kategori: 'libur' },
    { nama: 'Perkuliahan Termin II', tanggalMulai: '2027-03-29', tanggalSelesai: '2027-05-01', semester: 'genap', kategori: 'perkuliahan' },
    { nama: 'Penulisan SSP, Pengesahan Kartu Ujian, & Bimbingan Akademik II', tanggalMulai: '2027-04-26', tanggalSelesai: '2027-05-01', semester: 'genap', kategori: 'registrasi' },
    { nama: 'Ujian Tengah Semester (UTS)', tanggalMulai: '2027-05-03', tanggalSelesai: '2027-05-08', semester: 'genap', kategori: 'uts' },
    { nama: 'Perkuliahan Termin II (Post Libur Idul Adha)', tanggalMulai: '2027-05-10', tanggalSelesai: '2027-05-15', semester: 'genap', kategori: 'perkuliahan' },
    { nama: 'Libur Idul Adha (Hari Raya Idul Adha diperkirakan tanggal 17 Mei 2027)', tanggalMulai: '2027-05-16', tanggalSelesai: '2027-05-22', semester: 'genap', kategori: 'libur' },
    { nama: 'Penulisan SSP, Pengesahan Kartu Ujian, & Bimbingan Akademik III', tanggalMulai: '2027-05-24', tanggalSelesai: '2027-05-30', semester: 'genap', kategori: 'registrasi' },
    { nama: 'Perkuliahan Termin III', tanggalMulai: '2027-06-28', tanggalSelesai: '2027-07-03', semester: 'genap', kategori: 'perkuliahan' },
    { nama: 'Ujian Akhir Semester (UAS)', tanggalMulai: '2027-07-05', tanggalSelesai: '2027-07-10', semester: 'genap', kategori: 'uas' },
    { nama: 'Ujian Akhir Praktikum & Praktik Lapangan', tanggalMulai: '2027-07-12', tanggalSelesai: '2027-07-17', semester: 'genap', kategori: 'ujian' },
    { nama: 'Ujian Remidial', tanggalMulai: '2027-07-20', tanggalSelesai: '2027-07-20', semester: 'genap', kategori: 'ujian' },
    { nama: 'Kuliah Pakar/Seminar/Webinar Regional', tanggalMulai: '2027-07-21', tanggalSelesai: '2027-07-21', semester: 'genap', kategori: 'kegiatan' },
    { nama: 'Pra Yudisium Semester Genap', tanggalMulai: '2027-07-23', tanggalSelesai: '2027-07-23', semester: 'genap', kategori: 'yudisium' },
    { nama: 'Yudisium Semester Genap', tanggalMulai: '2027-07-24', tanggalSelesai: '2027-07-24', semester: 'genap', kategori: 'yudisium' },
    { nama: 'Bimbingan Akademik IV (KHS)', tanggalMulai: '2027-07-23', tanggalSelesai: '2027-07-24', semester: 'genap', kategori: 'registrasi' },

    // ── KETERANGAN & HARI LIBUR (antar tahun ajaran / umum) ──
    { nama: 'Minggu Tenang', tanggalMulai: '2027-01-04', tanggalSelesai: '2027-01-09', semester: 'antar', kategori: 'minggu_tenang' },
    { nama: 'Libur Mahasiswa Semester Ganjil 2026/2027', tanggalMulai: '2027-02-03', tanggalSelesai: '2027-02-03', semester: 'antar', kategori: 'libur' },
    { nama: 'Minggu Tenang', tanggalMulai: '2027-02-15', tanggalSelesai: '2027-02-17', semester: 'antar', kategori: 'minggu_tenang' },
    { nama: 'Libur Mahasiswa Semester Ganjil 2026/2027', tanggalMulai: '2027-02-16', tanggalSelesai: '2027-02-16', semester: 'antar', kategori: 'libur' },
    { nama: 'Ketidakhadiran Mahasiswa ke Asrama', tanggalMulai: '2027-03-26', tanggalSelesai: '2027-03-27', semester: 'antar', kategori: 'kegiatan' },
    { nama: 'Ketidakhadiran Mahasiswa ke Asrama', tanggalMulai: '2027-05-22', tanggalSelesai: '2027-05-23', semester: 'antar', kategori: 'kegiatan' },
    { nama: 'Libur Mahasiswa Semester Genap 2026/2027', tanggalMulai: '2027-07-26', tanggalSelesai: '2027-08-29', semester: 'antar', kategori: 'libur' },
    { nama: 'Darurah (Istiqomah / Syahrul Qur\'an)', tanggalMulai: '2027-08-30', tanggalSelesai: '2027-09-04', semester: 'antar', kategori: 'kegiatan' },
  ],
}

/**
 * Buat event kosong (untuk template import manual / JSON baru).
 */
export function createEmptyCalendarPreset() {
  return {
    nama: 'Kalender Akademik Baru',
    tahunAjaran: '',
    fakultas: '',
    prodi: 'Program Sarjana',
    events: [],
  }
}
