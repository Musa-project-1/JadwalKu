/**
 * Centralized Academic Constants for JadwalKu
 * Single source of truth for programs, semesters, months, and national holidays.
 *
 * PRODIS: fallback legacy — sumber utama prodi sekarang adalah
 * Firestore `kampus/{id}.prodi` via CampusContext/prodiNames.
 * Jangan import PRODIS langsung di komponen baru; pakai useCampus().
 */

export const PRODIS = [
  { label: 'Semua Prodi', value: '', prefix: '' },
  { label: 'Arsitektur (ARS)', value: 'Arsitektur', prefix: 'ARS' },
  { label: 'Bisnis Digital (BD)', value: 'Bisnis Digital', prefix: 'BD' },
  { label: 'Informatika (IF)', value: 'Informatika', prefix: 'IF' },
  { label: 'Kewirausahaan (KW)', value: 'Kewirausahaan', prefix: 'KW' },
  { label: 'Teknik Sipil (TS)', value: 'Teknik Sipil', prefix: 'TS' },
]

export const SEMESTER_OPTIONS = [
  { label: 'Semua Semester', value: '' },
  { label: 'Semester 1', value: '1' },
  { label: 'Semester 2', value: '2' },
  { label: 'Semester 3', value: '3' },
  { label: 'Semester 4', value: '4' },
  { label: 'Semester 5', value: '5' },
  { label: 'Semester 6', value: '6' },
  { label: 'Semester 7', value: '7' },
  { label: 'Semester 8', value: '8' },
]

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export const DAYS_OF_WEEK = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export const STATUS_OPTIONS = [
  { label: 'Semua Status', value: '' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
]

// Curated Indonesian National Holidays Preset (2026 & 2027)
export const NATIONAL_HOLIDAYS_PRESET = {
  2026: [
    { nama: 'Tahun Baru 2026 Masehi', mulai: '2026-01-01', selesai: '2026-01-01', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Isra Mi\'raj Nabi Muhammad SAW', mulai: '2026-01-16', selesai: '2026-01-16', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Tahun Baru Imlek 2577 Kongzili', mulai: '2026-02-17', selesai: '2026-02-17', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Hari Suci Nyepi (Tahun Baru Saka 1948)', mulai: '2026-03-20', selesai: '2026-03-20', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Hari Raya Idul Fitri 1447 H', mulai: '2026-03-21', selesai: '2026-03-22', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Cuti Bersama Idul Fitri 1447 H', mulai: '2026-03-23', selesai: '2026-03-25', tipe: 'kampus', prodi: 'Semua' },
    { nama: 'Wafat Yesus Kristus (Jumat Agung)', mulai: '2026-04-03', selesai: '2026-04-03', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Hari Buruh Internasional', mulai: '2026-05-01', selesai: '2026-05-01', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Kenaikan Yesus Kristus', mulai: '2026-05-14', selesai: '2026-05-14', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Hari Raya Waisak 2570 BE', mulai: '2026-05-31', selesai: '2026-05-31', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Hari Lahir Pancasila', mulai: '2026-06-01', selesai: '2026-06-01', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Hari Raya Idul Adha 1447 H', mulai: '2026-06-17', selesai: '2026-06-17', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Tahun Baru Islam 1448 H', mulai: '2026-07-07', selesai: '2026-07-07', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Hari Kemerdekaan RI Ke-81', mulai: '2026-08-17', selesai: '2026-08-17', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Maulid Nabi Muhammad SAW', mulai: '2026-09-15', selesai: '2026-09-15', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Hari Raya Natal', mulai: '2026-12-25', selesai: '2026-12-25', tipe: 'nasional', prodi: 'Semua' },
  ],
  2027: [
    { nama: 'Tahun Baru 2027 Masehi', mulai: '2027-01-01', selesai: '2027-01-01', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Isra Mi\'raj Nabi Muhammad SAW', mulai: '2027-01-06', selesai: '2027-01-06', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Tahun Baru Imlek 2578 Kongzili', mulai: '2027-02-06', selesai: '2027-02-06', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Hari Suci Nyepi (Tahun Baru Saka 1949)', mulai: '2027-03-09', selesai: '2027-03-09', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Hari Raya Idul Fitri 1448 H', mulai: '2027-03-10', selesai: '2027-03-11', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Wafat Yesus Kristus (Jumat Agung)', mulai: '2027-03-26', selesai: '2027-03-26', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Hari Buruh Internasional', mulai: '2027-05-01', selesai: '2027-05-01', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Kenaikan Yesus Kristus', mulai: '2027-05-06', selesai: '2027-05-06', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Hari Raya Waisak 2571 BE', mulai: '2027-05-20', selesai: '2027-05-20', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Hari Lahir Pancasila', mulai: '2027-06-01', selesai: '2027-06-01', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Hari Raya Idul Adha 1448 H', mulai: '2027-06-06', selesai: '2027-06-06', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Tahun Baru Islam 1449 H', mulai: '2027-06-26', selesai: '2027-06-26', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Hari Kemerdekaan RI Ke-82', mulai: '2027-08-17', selesai: '2027-08-17', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Maulid Nabi Muhammad SAW', mulai: '2027-09-04', selesai: '2027-09-04', tipe: 'nasional', prodi: 'Semua' },
    { nama: 'Hari Raya Natal', mulai: '2027-12-25', selesai: '2027-12-25', tipe: 'nasional', prodi: 'Semua' },
  ],
}
