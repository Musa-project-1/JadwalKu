import { logError } from './errorLogger.js'
import { formatRuang } from './scheduleUtils.js'

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

const isCombinedType = (t) => /^(gbk|gbk1|gbk2|gbk-o|gbk-d|hbh|hbd|hb|hybrid|gabungan)/i.test(String(t || '').trim())

const isGenericDosen = (d) => {
  if (!d) return true
  const str = String(d).trim().toLowerCase()
  return /^(-|tba|dosen|pengampu|\?|belum ada|belum ditentukan|tim dosen|team teaching)$/i.test(str)
}

const isVirtualRoom = (r) => {
  if (!r) return true
  const str = String(r).trim().toLowerCase()
  return /online|daring|zoom|gmeet|meet|teams|virtual|kulon|maya|-/i.test(str)
}

const isGenericProdiRoom = (r) => {
  if (!r) return true
  const str = String(r).trim().toLowerCase()
  return /prodi|kelas|gabungan|teori|kuliah|jurusan/i.test(str)
}

/**
 * Memeriksa apakah 2 sesi jadwal merupakan Kelas Gabungan (GBK) atau Hybrid Lintas Prodi (HBH/HBD/HB)
 * yang sengaja diadakan bersamaan untuk mata kuliah / dosen yang sama di satu ruangan atau sesi online.
 */
function isIntentionalJointClass(a, b, courseMap) {
  // Jika sama prodi & sama semester tapi beda mata kuliah -> bentrok rombel nyata
  if (a.prodi === b.prodi && Number(a.semester) === Number(b.semester) && a.kodeMK !== b.kodeMK) {
    return false
  }

  const isHybridOrGbk = isCombinedType(a.tipeKelas) || isCombinedType(b.tipeKelas)
  const isJointRoom = /gabungan|halimah|dekanat/i.test(String(a.ruang || '')) || /gabungan|halimah|dekanat/i.test(String(b.ruang || ''))

  const courseA = courseMap?.get(a.kodeMK)
  const courseB = courseMap?.get(b.kodeMK)
  const namaA = (courseA?.namaMK || a.namaMK || '').trim().toLowerCase()
  const namaB = (courseB?.namaMK || b.namaMK || '').trim().toLowerCase()
  const dosenA = (courseA?.dosen || a.dosen || '').trim().toLowerCase()
  const dosenB = (courseB?.dosen || b.dosen || '').trim().toLowerCase()

  const sameCode = String(a.kodeMK || '').trim().toUpperCase() === String(b.kodeMK || '').trim().toUpperCase()
  const sameName = Boolean(namaA && namaB && namaA === namaB)
  const sameDosen = Boolean(dosenA && dosenB && !isGenericDosen(dosenA) && dosenA === dosenB)

  // 1. Jika bertipe GBK / Hybrid atau di Ruang Gabungan:
  // Jika nama MK sama (misal Aqidah Islam), dosen sama, atau kode sama -> Sah Kelas Gabungan!
  if (isHybridOrGbk || isJointRoom) {
    if (sameName || sameDosen || sameCode) {
      return true
    }
  }

  // 2. Jika mata kuliah sama (kode atau nama) lintas prodi:
  if ((sameCode || sameName) && (isHybridOrGbk || isJointRoom || a.prodi !== b.prodi)) {
    return true
  }

  // 3. Jika dosen sama mengajar kelas yang sama lintas prodi:
  if (sameDosen && (sameName || sameCode || isHybridOrGbk || isJointRoom)) {
    return true
  }

  return false
}

/**
 * Deteksi bentrok jadwal cerdas dalam 3 dimensi:
 * 1. Bentrok Ruangan Fisik (Room Collision): Ruangan fisik yang sama dipakai 2 mata kuliah berbeda di jam bertabrakan.
 * 2. Bentrok Dosen Pengampu (Lecturer Collision): Dosen yang sama mengajar 2 mata kuliah berbeda di jam bertabrakan.
 * 3. Bentrok Rombel Mahasiswa (Cohort Collision): Mahasiswa di prodi, semester, dan tipe kelas yang sama memiliki 2 jadwal bertabrakan.
 *
 * Catatan: Kelas Gabungan (GBK) & Hybrid Halimah (HBH/HBD/HB) lintas prodi untuk mata kuliah yang sama diakui sebagai sesi bersama, bukan bentrok.
 *
 * @param {Array<Record<string, unknown>>} entries
 * @param {Map<string, object>|Array<object>} [courseSource] - Map atau Array mata kuliah
 * @returns {Array<{ a: number, b: number, idA?: string, idB?: string, type: 'room'|'lecturer'|'cohort', message: string, detail: object }>} daftar bentrok terstruktur
 */
export function findConflicts(entries, courseSource) {
  const conflicts = []
  if (!entries || entries.length < 2) return conflicts

  let courseMap = new Map()
  if (courseSource instanceof Map) {
    courseMap = courseSource
  } else if (Array.isArray(courseSource)) {
    for (const c of courseSource) {
      if (c?.kodeMK) courseMap.set(c.kodeMK, c)
    }
  }

  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const a = entries[i]
      const b = entries[j]

      // Hanya periksa jika hari sama dan jam bertabrakan
      if (a.hari !== b.hari || !a.jamMulai || !a.jamSelesai || !b.jamMulai || !b.jamSelesai) {
        continue
      }

      if (!rangesOverlap(a.jamMulai, a.jamSelesai, b.jamMulai, b.jamSelesai)) {
        continue
      }

      const idA = a.id ?? String(i)
      const idB = b.id ?? String(j)

      // Abaikan jika ini adalah Kelas Gabungan / Hybrid Lintas Prodi (GBK, HBH, HBD, HB) untuk mata kuliah yang sama
      if (isIntentionalJointClass(a, b, courseMap)) {
        continue
      }

      // 1. DIMENSI A: Bentrok Rombel Mahasiswa (Cohort)
      const sameCohort =
        a.prodi === b.prodi &&
        Number(a.semester) === Number(b.semester) &&
        String(a.tipeKelas || 'K1') === String(b.tipeKelas || 'K1')

      if (sameCohort && a.kodeMK !== b.kodeMK) {
        conflicts.push({
          a: i,
          b: j,
          idA,
          idB,
          type: 'cohort',
          message: `Bentrok Rombel: ${a.prodi} Sem ${a.semester} (${a.tipeKelas || 'K1'}) memiliki 2 mata kuliah bersamaan (${a.kodeMK} & ${b.kodeMK}) pada ${a.hari} (${a.jamMulai}-${a.jamSelesai})`,
          detail: { a, b },
        })
        continue // Jika sudah bentrok rombel, tidak perlu cek duplikat ruang/dosen pada pasangan yang sama
      }

      // 2. DIMENSI B: Bentrok Ruangan Fisik (Room)
      const rawRuangA = String(a.ruang ?? '').trim()
      const rawRuangB = String(b.ruang ?? '').trim()
      const ruangA = formatRuang(rawRuangA, a.tipeKelas)
      const ruangB = formatRuang(rawRuangB, b.tipeKelas)

      // Jika ruangan berupa online/zoom atau prodi/gabungan/umum:
      // Bukan merupakan 1 ruangan fisik yang saling berebut
      if (
        isVirtualRoom(ruangA) ||
        isVirtualRoom(ruangB) ||
        isGenericProdiRoom(ruangA) ||
        isGenericProdiRoom(ruangB)
      ) {
        continue
      }

      if (ruangA && ruangB && ruangA !== '-' && ruangA.toLowerCase() === ruangB.toLowerCase()) {
        conflicts.push({
          a: i,
          b: j,
          idA,
          idB,
          type: 'room',
          message: `Bentrok Ruangan: ${ruangA} digunakan bersamaan oleh ${a.kodeMK} (${a.prodi}) dan ${b.kodeMK} (${b.prodi}) pada ${a.hari} (${a.jamMulai}-${a.jamSelesai})`,
          detail: { a, b },
        })
        continue
      }

      // 3. DIMENSI C: Bentrok Dosen Pengampu (Lecturer)
      const dosenA = (courseMap.get(a.kodeMK)?.dosen || a.dosen || '').trim()
      const dosenB = (courseMap.get(b.kodeMK)?.dosen || b.dosen || '').trim()
      if (
        dosenA &&
        dosenB &&
        !isGenericDosen(dosenA) &&
        !isGenericDosen(dosenB) &&
        dosenA.toLowerCase() === dosenB.toLowerCase()
      ) {
        conflicts.push({
          a: i,
          b: j,
          idA,
          idB,
          type: 'lecturer',
          message: `Bentrok Dosen: ${dosenA} dijadwalkan mengajar ${a.kodeMK} (${a.prodi}) dan ${b.kodeMK} (${b.prodi}) di jam yang sama pada ${a.hari} (${a.jamMulai}-${a.jamSelesai})`,
          detail: { a, b },
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
