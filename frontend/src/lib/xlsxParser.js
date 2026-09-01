import * as XLSX from 'xlsx'
import { CLASS_TYPE_CODES, DAYS } from './uploadValidator'

/**
 * Parser file .xlsx/.csv jadwal kampus (client-side, SheetJS).
 *
 * UNIVERSAL & KONFIGURASI-DRIVEN:
 * Sebelumnya parser ini terikat pada SATU layout resmi kampus (FTB) yang
 * hardcoded. Sekarang deteksi layout dilakukan secara heuristik generik dan
 * bisa diteruskan konfigurasi kampus (campusConfig) agar universitas mana pun
 * bisa di-parse otomatis.
 *
 * Strategi deteksi (berurutan):
 *  1. Layout resmi kampus (matriks + legenda + tabel MK) → parseUnivSheet
 *     (tetap dipertahankan sebagai preset, tapi tidak lagi satu-satunya)
 *  2. Layout tabular datar  — kolom: Hari, Jam Mulai, Jam Selesai, Prodi, dst.
 *     (alias kolom fleksibel)
 *  3. Layout matriks kampus — baris hari + rentang jam, kolom per prodi/semester
 *  4. Layout dua kolom (Hari + Jam dalam satu rentang di kolom pertama)
 */

const SHEET_ALIASES = {
  schedule: ['jadwal perkuliahan', 'jadwal', 'schedule'],
  courses: ['daftar mata kuliah', 'mata kuliah', 'mk', 'dosen pengampu', 'courses'],
  exams: ['jadwal ujian', 'ujian', 'exams'],
}

const COURSE_ALIASES = {
  kodeMK: ['kode mk', 'kode', 'kode mata kuliah', 'kode_mk', 'code', 'course code', 'kd mk'],
  namaMK: ['nama mk', 'nama mata kuliah', 'mata kuliah', 'nama', 'name', 'course name'],
  dosen: ['dosen pengampu', 'dosen', 'pengampu', 'lecturer', 'nama dosen'],
  kontakDosen: ['kontak dosen', 'kontak', 'no hp', 'hp/wa', 'telepon', 'whatsapp', 'contact'],
  sks: ['sks', 'bobot', 'credit', 'credits', 'sks*'],
  durasi: ['durasi (menit)', 'durasi', 'menit', 'duration', 'jam pelajaran'],
}

const SCHEDULE_FIELD_ALIASES = {
  hari: ['hari', 'day', 'days'],
  jamMulai: ['jam mulai', 'mulai', 'start', 'start time', 'waktu mulai', 'jam'],
  jamSelesai: ['jam selesai', 'selesai', 'end', 'end time', 'waktu selesai', 'sampai'],
  prodi: ['prodi', 'program studi', 'program', 'study program', 'jurusan'],
  semester: ['semester', 'sem', 'smt'],
  kodeMK: ['kode mk', 'kode', 'kode mata kuliah', 'code'],
  ruang: ['ruang', 'room', 'ruangan', 'lokasi'],
  tipeKelas: ['tipe kelas', 'kelas', 'type', 'class type', 'mode', 'jenis kelas'],
}

const EXAM_ALIASES = {
  ...SCHEDULE_FIELD_ALIASES,
  jenis: ['jenis', 'uts/uas', 'tipe ujian', 'type', 'exam type'],
  tanggal: ['tanggal', 'date', 'tgl'],
  jam: ['jam', 'waktu', 'time', 'pukul'],
  mode: ['mode', 'metode', 'online/offline'],
}

/**
 * @param {ArrayBuffer|Uint8Array} data isi file
 * @param {object} [campusConfig] konfigurasi kampus (prodi, classTypes, dst.)
 * @returns {{
 *   scheduleEntries: Array<object>,
 *   courses: Array<object>,
 *   exams: Array<object>,
 *   programs: Array<{ nama: string, semesterMin: number, semesterMax: number }>,
 *   tahunAjaran: string | null,
 *   warnings: string[],
 *   detectedFormat: string
 * }}
 */
export function parseWorkbook(data, campusConfig = {}) {
  const wb = XLSX.read(data, { type: 'array', cellDates: false })
  const warnings = []

  const scheduleSheet = findSheet(wb, SHEET_ALIASES.schedule)
  const courseSheet = findSheet(wb, SHEET_ALIASES.courses)
  const examSheet = findSheet(wb, SHEET_ALIASES.exams)

  if (!scheduleSheet) warnings.push('Sheet jadwal tidak ditemukan')

  let scheduleEntries = []
  let courses = []
  let exams = []
  let tahunAjaran = null
  let detectedFormat = 'unknown'

  if (scheduleSheet) {
    const grid = XLSX.utils.sheet_to_json(scheduleSheet, { header: 1, defval: '' })

    // Format resmi kampus (matriks + legenda + tabel MK) — kini salah SATU preset.
    if (isUnivFtbLayout(grid)) {
      const univ = parseUnivSheet(grid)
      scheduleEntries = univ.scheduleEntries
      courses = univ.courses
      tahunAjaran = univ.tahunAjaran
      warnings.push(...univ.warnings)
      detectedFormat = 'campus-matrix'
    } else {
      const rows = sheetToRows(scheduleSheet)
      const parsed = flatOrMatrix(rows, campusConfig)
      scheduleEntries = parsed.scheduleEntries
      detectedFormat = parsed.detectedFormat
      courses = courseSheet ? parseCourses(sheetToRows(courseSheet)) : []
    }
  } else if (courseSheet) {
    courses = parseCourses(sheetToRows(courseSheet))
  }

  if (examSheet) exams = parseExams(sheetToRows(examSheet))

  const programs = extractPrograms(scheduleEntries, courses, exams)

  return { scheduleEntries, courses, exams, programs, tahunAjaran, warnings, detectedFormat }
}

function extractPrograms(scheduleEntries = [], courses = [], exams = []) {
  const prodiMap = new Map()
  const register = (prodiRaw, semRaw) => {
    if (!prodiRaw) return
    const name = String(prodiRaw).split('\n')[0].trim()
    if (!name) return
    if (!prodiMap.has(name)) {
      prodiMap.set(name, { nama: name, semesters: new Set() })
    }
    const sem = Number(semRaw)
    if (sem && !Number.isNaN(sem)) {
      prodiMap.get(name).semesters.add(sem)
    }
  }

  scheduleEntries.forEach((e) => register(e.prodi, e.semester))
  exams.forEach((e) => register(e.prodi, e.semester))
  courses.forEach((c) => register(c.prodi, c.semester))

  return Array.from(prodiMap.values())
    .map((p) => {
      const sems = Array.from(p.semesters).sort((a, b) => a - b)
      return {
        nama: p.nama,
        semesterMin: sems.length > 0 ? Math.min(...sems) : 1,
        semesterMax: sems.length > 0 ? Math.max(sems[sems.length - 1], 8) : 8,
      }
    })
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
}

// ──────────────────────────────────────────────────────────────
// Deteksi layout generik (universal)
// ──────────────────────────────────────────────────────────────

/** Deteksi & parse layout flat ATAU matriks. */
function flatOrMatrix(rows, campusConfig = {}) {
  if (!rows.length) return { scheduleEntries: [], detectedFormat: 'empty' }

  const headers = Object.keys(rows[0]).map(normalizeHeader)

  // Punya kolom hari + jam eksplisit/rentang → tabel datar.
  const hasDayCol = headers.some((h) => matches(h, SCHEDULE_FIELD_ALIASES.hari))
  const hasTimeCol = headers.some(
    (h) => matches(h, SCHEDULE_FIELD_ALIASES.jamMulai) || matches(h, SCHEDULE_FIELD_ALIASES.jamRangeAlias || ['jam', 'waktu', 'time', 'sesi', 'pukul']),
  )

  if (hasDayCol && hasTimeCol) {
    return { scheduleEntries: parseFlat(rows, campusConfig), detectedFormat: 'flat' }
  }

  // Matriks kampus: baris hari + rentang jam di kolom awal.
  if (!hasDayCol && !hasTimeCol && headers.length >= 3) {
    const matrix = parseMatrix(rows, campusConfig)
    if (matrix.length > 0) return { scheduleEntries: matrix, detectedFormat: 'matrix' }
  }

  // Fallback: layout dua kolom (Hari | Jam yang berisi rentang gabungan).
  const twoCol = parseTwoColumn(rows, campusConfig)
  if (twoCol.length > 0) return { scheduleEntries: twoCol, detectedFormat: 'two-column' }

  return { scheduleEntries: parseFlatFallback(rows, campusConfig), detectedFormat: 'fallback' }
}

/** Layout dua kolom: kolom pertama Hari, kolom kedua berisi rentang jam + MK. */
function parseTwoColumn(rows, campusConfig = {}) {
  const entries = []
  let currentDay = ''
  let prodiFromConfig = firstProdiName(campusConfig) || 'Informatika'

  for (const row of rows) {
    const values = Object.values(row)
    const first = String(values[0] ?? '').trim()
    const second = String(values[1] ?? '').trim()

    if (!first && !second) continue

    const day = normalizeDayName(first)
    if (day) {
      currentDay = day
      continue
    }

    if (!currentDay) continue

    // Baris berisi jam rentang + info MK/dosen/ruang dalam satu sel
    const timeMatch = second.match(/(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/)
    if (!timeMatch) continue

    const kodeMatch = second.match(/\b([A-Z]{2,4}[-\s]?\d{3,4})\b/i)
    const kodeMK = kodeMatch ? kodeMatch[1].toUpperCase().replace(/\s+/g, '') : `MK${entries.length + 1}`
    const namaMK = second.replace(timeMatch[0], '').replace(kodeMatch?.[0] || '', '').replace(/[|\-–]/g, '').trim()

    entries.push({
      hari: currentDay,
      jamMulai: `${pad(timeMatch[1])}:${timeMatch[2]}`,
      jamSelesai: `${pad(timeMatch[3])}:${timeMatch[4]}`,
      prodi: prodiFromConfig,
      semester: NaN,
      kodeMK,
      ruang: '',
      tipeKelas: '',
    })
  }

  return entries
}

/** Fallback: coba deteksi kolom via alias terluas, isi default untuk kolom kosong. */
function parseFlatFallback(rows, campusConfig = {}) {
  if (!rows.length) return []
  const headers = Object.keys(rows[0])
  const map = {}
  for (const field of Object.keys(SCHEDULE_FIELD_ALIASES)) {
    map[field] = colFor(headers, SCHEDULE_FIELD_ALIASES[field])
  }

  const prodiDefault = firstProdiName(campusConfig) || 'Informatika'

  return rows.flatMap((row, index) => {
    const hariRaw = readCell(row, map.hari)
    const day = normalizeDayName(hariRaw)
    if (!day) return []

    const { jamMulai, jamSelesai } = readTimeRange(row, map)
    const kodeMK = String(readCell(row, map.kodeMK)).trim().toUpperCase() || `MK${index + 1}`

    return [{
      hari: day,
      jamMulai,
      jamSelesai,
      prodi: String(readCell(row, map.prodi)).trim() || prodiDefault,
      semester: toInt(readCell(row, map.semester)),
      kodeMK,
      ruang: String(readCell(row, map.ruang)).trim(),
      tipeKelas: normalizeClassType(String(readCell(row, map.tipeKelas)).trim()),
    }]
  })
}

/** Ambil prodi pertama dari config kampus. */
function firstProdiName(campusConfig = {}) {
  const prodi = campusConfig?.prodi || []
  if (!prodi.length) return ''
  return typeof prodi[0] === 'string' ? prodi[0] : prodi[0]?.nama || ''
}

// ──────────────────────────────────────────────────────────────
// Format resmi kampus (matriks + legenda + tabel MK) — preset lama
// ──────────────────────────────────────────────────────────────

const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 }

/** Peta kelas → tipe bila legenda tidak ditemukan di sheet. */
const KELAS_FALLBACK = {
  K1: 'K1',
  K2: 'K2',
  GBK1: 'GBK1',
  GBK2: 'GBK2',
  HBH: 'HBH',
  HBD: 'HBD',
  '2-A': 'K1',
  '4-A': 'K1',
  '2-B': 'K2',
  '4-B': 'K2',
  '4-E': 'K2',
}

/** Deteksi layout resmi kampus: ada baris "No."+"Hari" dan ≥3 sel "Jam". */
function isUnivFtbLayout(grid) {
  const scan = Math.min(grid.length, 15)
  let hasNoHari = false
  let jamCount = 0
  for (let r = 0; r < scan; r += 1) {
    const row = grid[r] ?? []
    for (let c = 0; c < row.length; c += 1) {
      const v = String(row[c]).trim().toLowerCase()
      if (v === 'hari') hasNoHari = true
      if (v === 'jam') jamCount += 1
    }
  }
  return hasNoHari && jamCount >= 3
}

function romanToNumber(text) {
  const m = String(text).match(/semester\s+([IVXivx]+)/i)
  if (!m) return null
  return ROMAN[m[1].toUpperCase()] ?? null
}

/**
 * Parser sheet resmi kampus: matriks jadwal per prodi + tabel mata kuliah
 * + legenda kelas berdampingan dalam satu sheet.
 */
function parseUnivSheet(grid) {
  const warnings = []
  let headerRow = -1
  for (let r = 0; r < Math.min(grid.length, 15); r += 1) {
    const row = grid[r] ?? []
    if (row.some((v) => String(v).trim().toLowerCase() === 'no.') &&
        row.some((v) => String(v).trim().toLowerCase() === 'hari')) {
      headerRow = r
      break
    }
  }
  if (headerRow === -1) {
    warnings.push('Baris header jadwal tidak ditemukan')
    return { scheduleEntries: [], courses: [], warnings }
  }

  // Tahun ajaran dari judul sheet (mis. "...SEMESTER GENAP 2025/2026")
  let tahunAjaran = null
  for (let r = 0; r < Math.min(grid.length, headerRow + 1); r += 1) {
    const row = grid[r] ?? []
    for (let c = 0; c < Math.min(row.length, 12); c += 1) {
      const m = String(row[c]).match(/(\d{4})\s*\/\s*(\d{4})/)
      if (m && Number(m[2]) === Number(m[1]) + 1) {
        tahunAjaran = `${m[1]}/${m[2]}`
        break
      }
    }
    if (tahunAjaran) break
  }

  const headerCells = grid[headerRow] ?? []
  const findCol = (predicate, from = 0) => {
    for (let c = from; c < headerCells.length; c += 1) {
      if (predicate(String(headerCells[c] ?? '').trim().toLowerCase())) return c
    }
    return -1
  }

  const hariCol = findCol((t) => t === 'hari')
  const cKodeProdi = findCol((t) => t.includes('kode prodi'))
  const cProdiName = findCol((t) => t.includes('program studi'), Math.max(cKodeProdi, 0))
  const cKodeMK = findCol((t) => t.includes('kode') && t.includes('mk'), Math.max(cProdiName, 0))
  const cNamaMK = findCol((t) => t.includes('nama mata kuliah'), Math.max(cKodeMK, 0))
  const cNamaDosen = findCol((t) => t.includes('nama dosen'), Math.max(cNamaMK, 0))
  const cKontak = findCol((t) => t.includes('kontak'), Math.max(cNamaDosen, 0))
  const cSks = findCol((t) => t === 'sks', Math.max(cKontak, 0))
  const cDurasi = findCol((t) => t.includes('durasi'), Math.max(cSks, 0))

  // Grup prodi: baris dengan ≥3 sel "Jam" di bawah header; nama prodi di
  // sel kolom MK pada baris yang sama (merged).
  let jamRow = -1
  let groupStarts = []
  for (let r = headerRow + 1; r < Math.min(grid.length, headerRow + 8); r += 1) {
    const row = grid[r] ?? []
    const jams = []
    for (let c = 0; c < row.length; c += 1) {
      if (String(row[c]).trim().toLowerCase() === 'jam') jams.push(c)
    }
    if (jams.length >= 3) {
      jamRow = r
      groupStarts = jams
      break
    }
  }

  const groups = []
  if (jamRow !== -1) {
    const jamRowCells = grid[jamRow] ?? []
    const rowAbove = grid[jamRow - 1] ?? []
    groupStarts.forEach((jamCol, i) => {
      const mkCol = jamCol + 1
      let prodi =
        String(jamRowCells[mkCol] ?? '').trim() ||
        String(rowAbove[mkCol] ?? '').trim() ||
        `Prodi ${i + 1}`
      prodi = titleCase(prodi.split('\n')[0].trim())
      groups.push({ jamCol, mkCol, dpCol: mkCol + 1, kelasCol: mkCol + 2, prodi })
    })
  }
  if (groups.length === 0) {
    warnings.push('Grup kolom prodi tidak ditemukan')
    return { scheduleEntries: [], courses: [], warnings }
  }

  // Legenda kelas → tipe (kolom legenda: sel berisi "A / B / C" diikuti
  // dua kolom deskripsi). Digabung dengan fallback hardcoded.
  const kelasMap = { ...KELAS_FALLBACK }
  for (let r = headerRow + 1; r < Math.min(grid.length, headerRow + 15); r += 1) {
    const row = grid[r] ?? []
    for (let c = 0; c < row.length; c += 1) {
      const key = String(row[c] ?? '').trim()
      if (!key.includes('/') || key.length > 30) continue
      const desc = String(row[c + 2] ?? '').trim()
      if (!desc) continue
      const lower = desc.toLowerCase()
      let tipe = null
      if (lower.includes('gabungan') && lower.includes('online')) tipe = 'GBK2'
      else if (lower.includes('gabungan')) tipe = 'GBK1'
      else if (lower.includes('hybrid') && lower.includes('halimah')) tipe = 'HBH'
      else if (lower.includes('hybrid')) tipe = 'HBD'
      else if (lower.includes('online')) tipe = 'K2'
      else if (lower.includes('reguler') || lower.includes('offline')) tipe = 'K1'
      if (!tipe) continue
      key.split('/').forEach((k) => {
        kelasMap[k.trim().toUpperCase()] = tipe
      })
    }
  }

  // ── Tabel mata kuliah (blok per prodi + penanda "Semester X" di kolom kode) ──
  const courses = []
  const semesterByCourse = {}
  if (cKodeMK !== -1 && cNamaMK !== -1) {
    let currentProdi = ''
    let currentSemester = null
    let lastCourseIdx = -1
    const kodeRe = /^[A-Z]{2,4}\s?\d{3}$/
    for (let r = headerRow + 1; r < grid.length; r += 1) {
      const row = grid[r] ?? []
      const kodeVal = String(row[cKodeMK] ?? '').trim()
      const semVal = romanToNumber(kodeVal)
      if (semVal) {
        currentSemester = semVal
        continue
      }
      const prodiVal =
        (cProdiName !== -1 ? String(row[cProdiName] ?? '').trim() : '') ||
        (cKodeProdi !== -1 ? String(row[cKodeProdi] ?? '').trim() : '')
      if (prodiVal && !kodeRe.test(prodiVal.toUpperCase())) {
        currentProdi = titleCase(prodiVal)
      }
      const kode = kodeVal.toUpperCase().replace(/\s+/g, '')
      const nama = cNamaMK !== -1 ? String(row[cNamaMK] ?? '').trim() : ''
      const dosenName = cNamaDosen !== -1 ? String(row[cNamaDosen] ?? '').trim() : ''

      // Baris dosen kedua (MK & nama kosong, tapi ada nama dosen) → gabung
      // ke mata kuliah terakhir, jangan buang.
      if (!kodeRe.test(kode) && !nama && dosenName && lastCourseIdx !== -1) {
        courses[lastCourseIdx].dosen += ` & ${dosenName}`
        continue
      }

      if (!kodeRe.test(kode) || !nama) continue
      const course = {
        kodeMK: kode,
        namaMK: nama,
        dosen: dosenName,
        kontakDosen: cKontak !== -1 ? String(row[cKontak] ?? '').trim() : '',
        sks: cSks !== -1 ? toInt(row[cSks]) : NaN,
        durasi: cDurasi !== -1 ? toInt(row[cDurasi]) : NaN,
        prodi: currentProdi,
        semester: currentSemester ?? NaN,
      }
      courses.push(course)
      lastCourseIdx = courses.length - 1
      const key = `${course.prodi}|${course.kodeMK}`
      if (!semesterByCourse[key]) semesterByCourse[key] = course.semester
      if (!semesterByCourse[course.kodeMK]) semesterByCourse[course.kodeMK] = course.semester
    }
  }

  // ── Matriks jadwal ──
  const scheduleEntries = []
  let currentDay = ''
  const matchDay = (val) => {
    const clean = String(val).toLowerCase().replace(/[^a-z]/g, '')
    return DAYS.find((d) => d.toLowerCase() === clean) ?? null
  }
  for (let r = headerRow + 1; r < grid.length; r += 1) {
    const row = grid[r] ?? []
    const hariVal = hariCol !== -1 ? String(row[hariCol] ?? '').trim() : ''
    if (hariVal) {
      const day = matchDay(hariVal)
      if (day) currentDay = day
    }
    if (!currentDay) continue

    for (const g of groups) {
      const jamText = String(row[g.jamCol] ?? '').trim()
      if (!jamText) continue
      const m = jamText.match(/(\d{1,2})[.](\d{2})\s*[-–]\s*(\d{1,2})[.](\d{2})/)
      if (!m) continue
      const kodeMK = String(row[g.mkCol] ?? '').trim().toUpperCase().replace(/\s+/g, '')
      if (!kodeMK) continue
      const kelasRaw = String(row[g.kelasCol] ?? '').trim()
      const kelasKey = kelasRaw.toUpperCase().replace(/\s+/g, '')
      const tipeKelas = kelasMap[kelasKey] ?? normalizeClassType(kelasRaw)
      const prodi = g.prodi
      const semester =
        semesterByCourse[`${prodi}|${kodeMK}`] ??
        semesterByCourse[kodeMK] ??
        NaN

      let resolvedRuang = kelasRaw || tipeKelas
      if (tipeKelas === 'HBH') resolvedRuang = 'Gedung Halimah'
      else if (tipeKelas === 'HBD') resolvedRuang = 'Gedung Dekanat'
      else if (tipeKelas === 'K2' || tipeKelas === 'GBK2') resolvedRuang = 'Online / Zoom'
      else if (tipeKelas === 'GBK1') resolvedRuang = 'Ruang Kelas Gabungan'
      else if (tipeKelas === 'K1') resolvedRuang = kelasRaw && !['K1', 'REGULER'].includes(kelasKey) ? `Ruang Kelas ${kelasRaw}` : 'Ruang Kelas Prodi'

      scheduleEntries.push({
        hari: currentDay,
        jamMulai: `${pad(m[1])}:${m[2]}`,
        jamSelesai: `${pad(m[3])}:${m[4]}`,
        prodi,
        semester,
        kodeMK,
        ruang: resolvedRuang,
        tipeKelas,
      })
    }
  }

  // Cross-check paritas semester vs judul sheet ("SEMESTER GENAP" = genap,
  // "GANJIL" = ganjil). Hanya peringatan, tidak memblokir.
  let titleParity = null
  for (let r = 0; r < Math.min(grid.length, headerRow + 1); r += 1) {
    const m = String(grid[r]?.[0] ?? '').match(/semester\s+(genap|ganjil)/i)
    if (m) {
      titleParity = m[1].toLowerCase()
      break
    }
  }
  if (titleParity) {
    const wantEven = titleParity === 'genap'
    const mismatched = courses.filter(
      (c) => Number.isInteger(c.semester) && Number(c.semester) > 0 && (Number(c.semester) % 2 === 0) !== wantEven,
    )
    if (mismatched.length > 0) {
      warnings.push(
        `${mismatched.length} mata kuliah semesternya ganjil/genap tidak sesuai judul ${titleParity} (contoh: ${mismatched[0].kodeMK} semester ${mismatched[0].semester})`,
      )
    }
  }

  return { scheduleEntries, courses, tahunAjaran, warnings }
}

function findSheet(wb, names) {
  const name = wb.SheetNames.find((n) =>
    names.some((alias) => n.toLowerCase().includes(alias)),
  )
  return name ? wb.Sheets[name] : null
}

function sheetToRows(sheet) {
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true })
}

/** Deteksi layout matriks: tidak ada kolom hari/jam eksplisit tapi banyak kolom isi. */
function isMatrixLayout(rows, campusConfig = {}) {
  if (!rows.length) return false
  const headers = Object.keys(rows[0]).map(normalizeHeader)
  const hasDayCol = headers.some((h) => matches(h, SCHEDULE_FIELD_ALIASES.hari))
  const hasTimeCol = headers.some(
    (h) => matches(h, SCHEDULE_FIELD_ALIASES.jamMulai) || /\d{1,2}[.:]\d{2}/.test(h),
  )
  return !hasDayCol && !hasTimeCol && headers.length >= 3
}

/** Layout tabular datar dengan alias kolom fleksibel. */
function parseFlat(rows, campusConfig = {}) {
  if (!rows.length) return []
  const headers = Object.keys(rows[0])
  const map = {}
  for (const field of Object.keys(SCHEDULE_FIELD_ALIASES)) {
    map[field] = colFor(headers, SCHEDULE_FIELD_ALIASES[field])
  }

  const prodiDefault = firstProdiName(campusConfig) || 'Informatika'

  return rows.flatMap((row) => {
    let { jamMulai, jamSelesai } = readTimeRange(row, map)

    const entry = {
      hari: titleCase(String(readCell(row, map.hari)).trim()),
      jamMulai,
      jamSelesai,
      prodi: String(readCell(row, map.prodi)).trim() || prodiDefault,
      semester: toInt(readCell(row, map.semester)),
      kodeMK: String(readCell(row, map.kodeMK)).trim().toUpperCase(),
      ruang: String(readCell(row, map.ruang)).trim(),
      tipeKelas: normalizeClassType(String(readCell(row, map.tipeKelas)).trim()),
    }
    if (!entry.hari || !entry.jamMulai || !entry.kodeMK) return []
    return [entry]
  })
}

/** Layout matriks kampus: kolom 0 = hari, kolom 1 = rentang jam, sisanya per prodi. */
function parseMatrix(rows, campusConfig = {}) {
  const entries = []
  let currentDay = ''

  for (const row of rows) {
    const values = Object.values(row)
    const first = String(values[0] ?? '').trim()

    // Baris header hari (mis. "SENIN") → simpan sebagai hari aktif.
    if (first && DAYS.includes(titleCase(first)) && values.slice(1).every(isBlank)) {
      currentDay = titleCase(first)
      continue
    }

    const timeMatch = first.match(/(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/)
    if (!currentDay || !timeMatch) continue

    const jamMulai = `${pad(timeMatch[1])}:${timeMatch[2]}`
    const jamSelesai = `${pad(timeMatch[3])}:${timeMatch[4]}`
    const headers = Object.keys(row)

    for (let c = 1; c < Math.min(headers.length, values.length); c += 1) {
      const cellText = String(values[c] ?? '').trim()
      if (!cellText) continue

      const parsed = parseMatrixCell(cellText)
      if (!parsed.kodeMK) continue

      entries.push({
        hari: currentDay,
        jamMulai,
        jamSelesai,
        prodi: splitProdiSemester(headers[c]).prodi,
        semester: splitProdiSemester(headers[c]).semester,
        kodeMK: parsed.kodeMK,
        ruang: parsed.ruang,
        tipeKelas: parsed.tipeKelas,
      })
    }
  }

  return entries
}

/** Isi sel matriks: cari pola kode MK, ruang, dan tipe kelas dalam satu teks. */
function parseMatrixCell(text) {
  const codeMatch = text.match(/\b([A-Z]{2,4}[-\s]?\d{3,4})\b/i)
  const kodeMK = codeMatch ? codeMatch[1].toUpperCase().replace(/\s+/g, '-') : ''
  const roomMatch = text.match(/\b((?:R\.?|Lab\.?|LAB)[\w\s.-]{1,12})\b/i)
  const tipe = CLASS_TYPE_CODES.find((c) => new RegExp(`\\b${c}\\b`, 'i').test(text)) ?? ''
  return { kodeMK, ruang: roomMatch ? roomMatch[1].trim() : '', tipeKelas: tipe }
}

function parseCourses(rows) {
  if (!rows.length) return []
  const headers = Object.keys(rows[0])
  const map = {}
  for (const field of Object.keys(COURSE_ALIASES)) {
    map[field] =
      headers.find((h) => matches(normalizeHeader(h), COURSE_ALIASES[field])) ?? null
  }

  return rows
    .map((row) => ({
      kodeMK: String(readCell(row, map.kodeMK)).trim().toUpperCase(),
      namaMK: String(readCell(row, map.namaMK)).trim(),
      dosen: String(readCell(row, map.dosen)).trim(),
      kontakDosen: String(readCell(row, map.kontakDosen)).trim(),
      sks: toInt(readCell(row, map.sks)),
      durasi: toInt(readCell(row, map.durasi)),
    }))
    .filter((c) => c.kodeMK && c.namaMK)
}

function parseExams(rows) {
  if (!rows.length) return []
  const headers = Object.keys(rows[0])
  const map = {}
  for (const field of Object.keys(EXAM_ALIASES)) {
    map[field] = headers.find((h) => matches(normalizeHeader(h), EXAM_ALIASES[field])) ?? null
  }

  return rows
    .map((row) => ({
      prodi: String(readCell(row, map.prodi)).trim(),
      semester: toInt(readCell(row, map.semester)),
      jenis: /uas/i.test(String(readCell(row, map.jenis))) ? 'UAS' : 'UTS',
      kodeMK: String(readCell(row, map.kodeMK)).trim().toUpperCase(),
      tanggal: normalizeDate(readCell(row, map.tanggal)),
      jam: normalizeTimeOfDay(readCell(row, map.jam)),
      ruang: String(readCell(row, map.ruang)).trim(),
      mode: String(readCell(row, map.mode)).trim() || 'Offline',
    }))
    .filter((e) => e.kodeMK && e.tanggal)
}

// ---------- helpers ----------

function colFor(headers, aliases) {
  return headers.find((h) => matches(normalizeHeader(h), aliases)) ?? null
}

function readCell(row, column) {
  if (!column) return ''
  return row[column]
}

function readTimeRange(row, map) {
  const directStart = normalizeClock(readCell(row, map.jamMulai))
  const directEnd = normalizeClock(readCell(row, map.jamSelesai))
  if (directStart && directEnd) return { jamMulai: directStart, jamSelesai: directEnd }

  // Coba kolom mana pun yang memuat pola rentang.
  for (const value of Object.values(row)) {
    const m = String(value).match(/(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/)
    if (m) return { jamMulai: `${pad(m[1])}:${m[2]}`, jamSelesai: `${pad(m[3])}:${m[4]}` }
  }
  return { jamMulai: directStart, jamSelesai: directEnd }
}

function normalizeClock(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'number') return excelFractionToHHMM(value)
  const m = String(value).match(/^(\d{1,2})[.:](\d{2})$/)
  return m ? `${pad(m[1])}:${m[2]}` : ''
}

function excelFractionToHHMM(fraction) {
  const totalMinutes = Math.round(Number(fraction) % 1 * 24 * 60)
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`
}

function normalizeDate(value) {
  if (value == null || value === '') return ''
  const str = String(value).trim()
  // DD/MM/YYYY atau YYYY-MM-DD → ISO YYYY-MM-DD.
  const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) return `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`
  const slash = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (slash) return `${slash[3]}-${pad(slash[2])}-${pad(slash[1])}`
  const serial = Number(str)
  if (Number.isFinite(serial) && serial > 20000 && serial < 60000) {
    // Serial date Excel (basis 1900).
    const ms = (serial - 25569) * 86400000
    return new Date(ms).toISOString().slice(0, 10)
  }
  return str
}

function normalizeTimeOfDay(value) {
  if (typeof value === 'number') return excelFractionToHHMM(value)
  const m = String(value).match(/(\d{1,2})[.:](\d{2})/)
  return m ? `${pad(m[1])}:${m[2]}` : String(value).trim()
}

function normalizeClassType(value) {
  const upper = String(value).toUpperCase().trim()
  if (/^\d+-A$/i.test(upper) || upper.endsWith('-A')) return 'K1'
  if (/^\d+-[BE]$/i.test(upper) || upper.endsWith('-B') || upper.endsWith('-E')) return 'K2'

  // Longest-first: 'HB' adalah substring 'HBH'/'HBD' — tanpa sorting,
  // input HBH/HBD salah terpetakan ke 'HB'.
  const sorted = [...CLASS_TYPE_CODES].sort((a, b) => b.length - a.length)
  return sorted.find((c) => upper.includes(c)) ?? upper
}

function splitProdiSemester(headerText) {
  const clean = String(headerText).replace(/\n/g, ' ').trim()
  const semMatch = clean.match(/(?:sem(?:ester)?)\s*(\d{1,2})/i)
  const semester = semMatch ? Number(semMatch[1]) : NaN
  let prodi = clean
    .replace(/(?:sem(?:ester)?)\s*\d{1,2}\s*/i, '')
    .replace(/[/-]\s*$/, '')
    .trim()
  if (!prodi || prodi.length < 3) prodi = clean
  return { prodi: titleCase(prodi), semester }
}

function matches(normalized, aliases) {
  return aliases.some((a) => normalized.includes(a))
}

function normalizeHeader(header) {
  return String(header).toLowerCase().replace(/\W+/g, ' ').trim()
}

function normalizeDayName(value) {
  if (!value) return ''
  const clean = String(value).trim().toLowerCase().replace(/[^a-z]/g, '')
  const day = DAYS.find((d) => d.toLowerCase() === clean)
  return day || ''
}

function isBlank(value) {
  return value == null || String(value).trim() === ''
}

function titleCase(str) {
  const s = String(str).trim()
  if (!s) return ''
  if (/^[A-Z][a-z]+( [A-Z][a-z]+)*$/.test(s)) return s
  const lower = s.charAt(0).toLowerCase() + s.slice(1).toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

function toInt(value) {
  if (value == null || value === '') return NaN
  const n = parseInt(String(value).replace(/[^\d]/g, ''), 10)
  return Number.isFinite(n) ? n : NaN
}

function pad(n) {
  return String(n).padStart(2, '0')
}
