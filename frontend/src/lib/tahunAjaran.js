/**
 * Logika tahun ajaran & semester untuk kalender akademik Universitas.
 * SATU-SATUNYA sumber kebenaran untuk penurunan TA / term / semester.
 *
 * Kalender akademik (geser dari standar Agustus–Juli):
 *  - Ganjil : akhir Sep → awal Feb   (semester ganjil: 1, 3, 5, 7)
 *  - Genap  : akhir Mar → awal Jul   (semester genap : 2, 4, 6, 8)
 *  - Libur  : awal Jul  → akhir Sep  (antara tahun ajaran)
 *
 * Tahun ajaran X/(X+1) dimulai saat ganjil dimulai (akhir Sep tahun X).
 * Jadi pada 25 Agu 2026 kita masih berada dalam TA 2025/2026 (libur),
 * sedangkan TA 2026/2027 (ganjil) dimulai akhir Sep 2026.
 */

// Batas term (bulan 0-index: Jan = 0 ... Sep = 8). Ubah di sini bila
// kalender kampus berubah.
export const ACADEMIC_CALENDAR = {
  ganjilStart: { month: 8, day: 25 }, // akhir Sep
  ganjilEnd: { month: 1, day: 5 }, // awal Feb (tahun berikutnya)
  genapStart: { month: 2, day: 25 }, // akhir Mar (tahun berikutnya)
  genapEnd: { month: 6, day: 5 }, // awal Jul (tahun berikutnya)
}

function toDate(year, { month, day }) {
  return new Date(year, month, day)
}

/**
 * Tahun ajaran berjalan: TA Y/(Y+1) dimulai saat ganjil mulai (akhir Sep Y)
 * dan berakhir sebelum ganjil berikutnya (akhir Sep Y+1).
 */
export function deriveTahunAjaran(date = new Date()) {
  const y = date.getFullYear()
  const { ganjilStart } = ACADEMIC_CALENDAR
  // "akhir Sep tahun Y" → TA Y/(Y+1). Sebelumnya → TA (Y-1)/Y.
  if (date >= toDate(y, ganjilStart)) {
    return `${y}/${y + 1}`
  }
  return `${y - 1}/${y}`
}

/**
 * Term aktif pada sebuah tanggal: 'ganjil' | 'genap' | 'libur'.
 */
export function deriveTerm(date = new Date()) {
  const startYear = Number(deriveTahunAjaran(date).split('/')[0])
  const { ganjilStart, ganjilEnd, genapStart, genapEnd } = ACADEMIC_CALENDAR

  const ganjilFrom = toDate(startYear, ganjilStart)
  const ganjilTo = toDate(startYear + 1, ganjilEnd)
  const genapFrom = toDate(startYear + 1, genapStart)
  const genapTo = toDate(startYear + 1, genapEnd)

  if (date >= ganjilFrom && date <= ganjilTo) return 'ganjil'
  if (date >= genapFrom && date <= genapTo) return 'genap'
  return 'libur'
}

/** Term milik sebuah semester: semester ganjil → 'ganjil', genap → 'genap'. */
export function termForSemester(semester) {
  return Number(semester) % 2 === 0 ? 'genap' : 'ganjil'
}

/** Tahun ajaran berikutnya: "2025/2026" → "2026/2027". */
export function nextTahunAjaran(ta) {
  const start = Number(String(ta).split('/')[0])
  return `${start + 1}/${start + 2}`
}

/** Tahun ajaran sebelumnya: "2025/2026" → "2024/2025". */
export function prevTahunAjaran(ta) {
  const start = Number(String(ta).split('/')[0])
  return `${start - 1}/${start}`
}

/**
 * Tahun ajaran di mana jadwal semester `semester` berada (untuk display &
 * default dropdown). Selama term aktif, semua semester berbagi satu TA
 * (kedua belahan satu tahun). Saat libur, dibedakan dua jenis libur:
 *
 *  1. Libur setelah genap, sebelum ganjil berikutnya (awal Jul → akhir Sep):
 *     semester genap (2,4,6) baru selesai di TA berjalan; semester ganjil
 *     (1,3,5) akan dimulai di TA berikutnya.
 *  2. Libur setelah ganjil, sebelum genap (awal Feb → akhir Mar): masih
 *     dalam satu TA — kedua belahan milik TA berjalan.
 */
export function expectedTahunAjaranForSemester(semester, date = new Date()) {
  const currentTA = deriveTahunAjaran(date)
  const currentTerm = deriveTerm(date)

  if (currentTerm !== 'libur') return currentTA

  const startYear = Number(currentTA.split('/')[0])
  const isBetweenYears = date >= toDate(startYear + 1, ACADEMIC_CALENDAR.genapEnd)
  if (isBetweenYears) {
    return termForSemester(semester) === 'ganjil'
      ? nextTahunAjaran(currentTA)
      : currentTA
  }
  return currentTA
}

/** Label term ramah bahasa: 'Ganjil' | 'Genap' | 'Libur'. */
export function getTermLabel(term) {
  return term === 'ganjil' ? 'Ganjil' : term === 'genap' ? 'Genap' : 'Libur'
}
