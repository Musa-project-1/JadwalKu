import { logError } from './errorLogger'

export const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export const CLASS_TYPE_CODES = ['K1', 'K2', 'HB', 'HBH', 'HBD', 'GBK1', 'GBK2']

const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/

/**
 * Validasi satu entri jadwal (dari upload file maupun input manual).
 * Mengembalikan array pesan error (kosong = valid).
 *
 * @param {{
 *   prodi?: string, semester?: unknown, hari?: string,
 *   jamMulai?: string, jamSelesai?: string, kodeMK?: string,
 *   ruang?: string, tipeKelas?: string
 * }} entry
 */
export function validateScheduleEntry(entry) {
  const errors = []

  if (!entry.prodi || typeof entry.prodi !== 'string' || !entry.prodi.trim()) {
    errors.push('Program studi wajib diisi')
  }

  const semester = Number(entry.semester)
  if (!Number.isInteger(semester) || semester < 1 || semester > 14) {
    errors.push('Semester harus angka bulat 1-14')
  }

  if (!DAYS.includes(entry.hari)) {
    errors.push(`Hari harus salah satu dari: ${DAYS.join(', ')}`)
  }

  if (!TIME_PATTERN.test(entry.jamMulai ?? '')) {
    errors.push('Jam mulai tidak valid (format HH:MM)')
  }

  if (!TIME_PATTERN.test(entry.jamSelesai ?? '')) {
    errors.push('Jam selesai tidak valid (format HH:MM)')
  }

  if (TIME_PATTERN.test(entry.jamMulai ?? '') && TIME_PATTERN.test(entry.jamSelesai ?? '')) {
    if (toMinutes(entry.jamMulai) >= toMinutes(entry.jamSelesai)) {
      errors.push('Jam selesai harus lebih besar dari jam mulai')
    }
  }

  if (!entry.kodeMK || typeof entry.kodeMK !== 'string' || !entry.kodeMK.trim()) {
    errors.push('Kode mata kuliah wajib diisi')
  }

  if (!entry.ruang || typeof entry.ruang !== 'string' || !entry.ruang.trim()) {
    errors.push('Ruang wajib diisi')
  }

  if (!CLASS_TYPE_CODES.includes(entry.tipeKelas)) {
    errors.push(`Tipe kelas harus salah satu dari: ${CLASS_TYPE_CODES.join(', ')}`)
  }

  return errors
}

/**
 * Cek tabrakan waktu antar entri dalam satu set jadwal.
 * Dua kelas bentrok jika: hari sama, prodi+semester sama, dan rentang jamnya overlap.
 *
 * @param {Array<Record<string, unknown>>} entries
 * @returns {Array<{ a: number, b: number, message: string }>} daftar pasangan bentrok
 */
export function findConflicts(entries) {
  const conflicts = []

  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const a = entries[i]
      const b = entries[j]

      const sameSlot =
        a.hari === b.hari &&
        a.prodi === b.prodi &&
        Number(a.semester) === Number(b.semester) &&
        // Kelas grup berbeda (K1 vs K2, 2-A vs 2-B) memang berjalan paralel
        // di jam yang sama di data kampus — bukan bentrok.
        String(a.ruang ?? '') === String(b.ruang ?? '') &&
        a.tipeKelas === b.tipeKelas

      if (sameSlot && rangesOverlap(a.jamMulai, a.jamSelesai, b.jamMulai, b.jamSelesai)) {
        conflicts.push({
          a: i,
          b: j,
          message: `Bentrok: ${a.kodeMK} (${a.jamMulai}-${a.jamSelesai}) dan ${b.kodeMK} (${b.jamMulai}-${b.jamSelesai}), ${a.hari}`,
        })
      }
    }
  }

  return conflicts
}

/**
 * Validasi kumpulan kode MK jadwal terhadap daftar mata kuliah yang ada.
 * Mengembalikan daftar kode yang tidak ditemukan (perlu ditambahkan dulu).
 *
 * @param {Array<{ kodeMK: string }>} scheduleEntries
 * @param {Array<{ kodeMK: string }>} courses
 * @returns {string[]} kode MK yang tidak ada di daftar mata kuliah
 */
export function findUnmatchedCourseCodes(scheduleEntries, courses) {
  const known = new Set(courses.map((c) => c.kodeMK))
  const unmatched = new Set()

  for (const entry of scheduleEntries) {
    if (!known.has(entry.kodeMK)) {
      unmatched.add(entry.kodeMK)
    }
  }

  return [...unmatched]
}

/**
 * Validasi satu entri mata kuliah (lookup sheet).
 */
export function validateCourseEntry(course) {
  const errors = []

  if (!course.kodeMK || typeof course.kodeMK !== 'string' || !course.kodeMK.trim()) {
    errors.push('Kode mata kuliah wajib diisi')
  }

  if (!course.namaMK || typeof course.namaMK !== 'string' || !course.namaMK.trim()) {
    errors.push('Nama mata kuliah wajib diisi')
  }

  if (!course.dosen || typeof course.dosen !== 'string' || !course.dosen.trim()) {
    errors.push('Nama dosen wajib diisi')
  }

  const sks = Number(course.sks)
  if (!Number.isInteger(sks) || sks < 1 || sks > 6) {
    errors.push('SKS harus angka bulat 1-6')
  }

  const durasi = Number(course.durasi)
  if (!Number.isInteger(durasi) || durasi < 30 || durasi > 300) {
    errors.push('Durasi harus angka menit 30-300')
  }

  return errors
}

/**
 * Validasi menyeluruh untuk satu batch hasil parsing file upload.
 * Mengembalikan objek ringkasan yang siap ditampilkan di UI preview admin.
 *
 * @param {Array<Record<string, unknown>>} scheduleEntries
 * @param {Array<Record<string, unknown>>} courses
 */
export function validateUploadBatch(scheduleEntries, courses) {
  const entryErrors = scheduleEntries.map((entry, index) => ({
    index,
    errors: validateScheduleEntry(entry),
  }))

  const courseErrors = courses.map((course, index) => ({
    index,
    errors: validateCourseEntry(course),
  }))

  const conflicts = findConflicts(scheduleEntries)
  const unmatchedCodes = findUnmatchedCourseCodes(scheduleEntries, courses)

  const summary = {
    valid: false,
    entryErrors: entryErrors.filter((e) => e.errors.length > 0),
    courseErrors: courseErrors.filter((e) => e.errors.length > 0),
    conflicts,
    unmatchedCodes,
    stats: {
      totalEntries: scheduleEntries.length,
      totalCourses: courses.length,
      invalidEntries: entryErrors.filter((e) => e.errors.length > 0).length,
      invalidCourses: courseErrors.filter((e) => e.errors.length > 0).length,
    },
  }

  summary.valid =
    summary.entryErrors.length === 0 &&
    summary.courseErrors.length === 0 &&
    conflicts.length === 0 &&
    unmatchedCodes.length === 0

  if (!summary.valid) {
    // Fire-and-forget: kegagalan logging tidak boleh mengganggu alur validasi.
    logError({
      type: 'validation',
      detail: `Upload batch invalid: ${summary.stats.invalidEntries} entri jadwal, ${summary.stats.invalidCourses} mata kuliah, ${conflicts.length} bentrok, ${unmatchedCodes.length} kode MK tak dikenal`,
      context: { unmatchedCodes: unmatchedCodes.slice(0, 20) },
    })
  }

  return summary
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function rangesOverlap(startA, endA, startB, endB) {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA)
}
