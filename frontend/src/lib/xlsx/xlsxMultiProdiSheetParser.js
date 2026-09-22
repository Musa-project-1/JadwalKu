import { pad, titleCase } from './xlsxHelpers.js'

const DEFAULT_SKS = 2
const DEFAULT_DURASI_MENIT = 100

/**
 * Normalisasi format jam perkuliahan:
 * "13,00-13,50" atau "13.00-13.40" -> { jamMulai: "13:00", jamSelesai: "13:50" }
 */
export function normalizeClockRange(raw) {
  if (!raw) return { jamMulai: '', jamSelesai: '' }
  const s = String(raw).trim()
  const m = s.match(/(\d{1,2})[.:,](\d{2})\s*[-–]\s*(\d{1,2})[.:,](\d{2})/)
  if (m) {
    return {
      jamMulai: `${pad(m[1])}:${m[2]}`,
      jamSelesai: `${pad(m[3])}:${m[4]}`,
    }
  }
  return { jamMulai: '', jamSelesai: '' }
}

/**
 * Normalisasi nama prodi dari nama sheet atau header teks.
 * "S-1 TEKNIK SIPIL" -> "Teknik Sipil"
 * "S-1 ARSITEKTUR" -> "Arsitektur"
 */
export function normalizeProdiName(sheetName, campusConfig = {}) {
  const clean = String(sheetName || '')
    .replace(/^(?:program\s+studi\s+|prodi\s+|s-?1\s+|d-?3\s+|d-?4\s+)/i, '')
    .trim()

  const candidates =
    campusConfig?.prodi?.map((p) => (typeof p === 'string' ? p : p?.nama)).filter(Boolean) || [
      'Informatika',
      'Bisnis Digital',
      'Arsitektur',
      'Teknik Sipil',
      'Kewirausahaan',
    ]

  const found = candidates.find(
    (c) => c.toLowerCase() === clean.toLowerCase() || clean.toLowerCase().includes(c.toLowerCase()),
  )
  if (found) return found
  return titleCase(clean)
}

/**
 * Deteksi apakah sebuah sheet memiliki layout matriks jadwal prodi.
 */
export function isProdiMatrixSheet(grid) {
  if (!Array.isArray(grid) || grid.length < 5) return false
  let hasKodeMK = false
  let dayCount = 0
  const DAYS_LIST = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', "jum'at", 'sabtu', 'minggu']

  for (let r = 0; r < Math.min(grid.length, 10); r += 1) {
    const row = grid[r] || []
    for (let c = 0; c < row.length; c += 1) {
      const v = String(row[c] || '').toLowerCase().replace(/\s+/g, '')
      if (v.includes('kodemk') || v === 'kode') hasKodeMK = true
      const raw = String(row[c] || '').toLowerCase().trim()
      if (DAYS_LIST.some((d) => raw === d || raw.startsWith(d))) {
        dayCount += 1
      }
    }
  }
  return hasKodeMK && dayCount >= 2
}

/**
 * Cek apakah workbook memiliki sheet jadwal per-prodi.
 */
export function isMultiProdiWorkbook(wb, XLSX) {
  if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) return false
  return wb.SheetNames.some((name) => {
    const ws = wb.Sheets[name]
    if (!ws) return false
    const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    return isProdiMatrixSheet(grid)
  })
}

/**
 * Parse seluruh sheet berformat matriks prodi.
 * @returns {{
 *   scheduleEntries: Array<Object>,
 *   courses: Array<Object>,
 *   exams: Array<Object>,
 *   tahunAjaran: string|null,
 *   detectedFormat: string,
 *   warnings: string[]
 * }}
 */
export function parseMultiProdiWorkbook(wb, XLSX, campusConfig = {}) {
  const scheduleEntries = []
  const courses = []
  const warnings = []
  let tahunAjaran = null

  const DAYS_LIST = [
    { key: 'senin', label: 'Senin' },
    { key: 'selasa', label: 'Selasa' },
    { key: 'rabu', label: 'Rabu' },
    { key: 'kamis', label: 'Kamis' },
    { key: 'jumat', label: 'Jumat' },
    { key: "jum'at", label: 'Jumat' },
    { key: 'sabtu', label: 'Sabtu' },
    { key: 'minggu', label: 'Minggu' },
  ]

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    if (!ws) continue
    const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    if (!isProdiMatrixSheet(grid)) continue

    // Deteksi Tahun Ajaran jika belum didapat
    if (!tahunAjaran) {
      for (let r = 0; r < Math.min(grid.length, 5); r += 1) {
        for (const cell of grid[r] || []) {
          const m = String(cell).match(/(?:t\.?a\.?|tahun\s+ajaran)[\s.:]*(\d{4}\s*[/-]\s*\d{4})/i)
          if (m) {
            tahunAjaran = m[1].replace(/\s+/g, '').replace('-', '/')
            break
          }
        }
        if (tahunAjaran) break
      }
    }

    // Temukan baris header utama (memuat Kode MK)
    let headerRow = -1
    for (let r = 0; r < Math.min(grid.length, 10); r += 1) {
      const row = grid[r] || []
      if (row.some((c) => String(c).toLowerCase().replace(/\s+/g, '').includes('kodemk'))) {
        headerRow = r
        break
      }
    }
    if (headerRow === -1) continue

    const prodi = normalizeProdiName(sheetName, campusConfig)

    // Deteksi kolom-kolom hari
    const dayColMap = []
    for (let r = headerRow; r <= headerRow + 2 && r < grid.length; r += 1) {
      const row = grid[r] || []
      row.forEach((cell, c) => {
        const val = String(cell).toLowerCase().trim()
        DAYS_LIST.forEach((d) => {
          if (val === d.key || val.startsWith(d.key)) {
            if (!dayColMap.some((x) => x.day === d.label)) {
              dayColMap.push({ day: d.label, col: c })
            }
          }
        })
      })
    }

    let currentSemester = 1
    let lastCourse = null

    for (let r = headerRow + 1; r < grid.length; r += 1) {
      const row = grid[r] || []
      if (!row || row.every((c) => c === '' || c === null)) continue

      // Semester dari kolom A
      const semCell = row[0]
      if (semCell !== '' && semCell !== null && semCell !== undefined) {
        const num = parseInt(semCell, 10)
        if (!Number.isNaN(num) && num > 0) {
          currentSemester = num
        }
      }

      const kodeMK = String(row[1] || '').trim().toUpperCase().replace(/\s+/g, '')
      const namaMK = String(row[2] || '').trim()
      const dosenRaw = String(row[3] || '').trim()
      const kontak = String(row[4] || '').trim()
      const sksT = parseInt(row[5], 10) || 0
      const sksP = parseInt(row[6], 10) || 0
      const sksTotal = parseInt(row[7], 10) || (sksT + sksP) || DEFAULT_SKS
      const durasi = parseInt(row[8], 10) || DEFAULT_DURASI_MENIT

      // Baris dosen pendamping (team teaching)
      if (!kodeMK && !namaMK && dosenRaw && lastCourse) {
        const cleanedDosen = dosenRaw.replace(/^\d+[.)]\s*/, '').trim()
        if (cleanedDosen) {
          lastCourse.dosen = `${lastCourse.dosen} / ${cleanedDosen}`
        }
        continue
      }

      if (!kodeMK && !namaMK) continue

      const cleanedDosen = dosenRaw.replace(/^\d+[.)]\s*/, '').trim()
      const courseObj = {
        kodeMK: kodeMK || namaMK,
        namaMK: namaMK || kodeMK,
        dosen: cleanedDosen,
        kontakDosen: kontak,
        sks: sksTotal,
        sksTeori: sksT,
        sksPraktik: sksP,
        durasi,
        semester: currentSemester,
        prodi,
      }
      courses.push(courseObj)
      lastCourse = courseObj

      // Ekstrak slot jadwal dari hari
      dayColMap.forEach(({ day, col }) => {
        const jamRaw = row[col]
        const ruangRaw = row[col + 1]
        const { jamMulai, jamSelesai } = normalizeClockRange(jamRaw)
        const ruang = String(ruangRaw || '').trim()

        if (jamMulai && jamSelesai) {
          let tipeKelas = 'K1'
          const rUpper = ruang.toUpperCase()
          if (rUpper.includes('K2') || rUpper.includes('ZOOM') || rUpper.includes('ONLINE') || rUpper.includes('DARING')) {
            tipeKelas = 'K2'
          }

          scheduleEntries.push({
            id: `import_${prodi}_${kodeMK}_${day}_${jamMulai}_${jamSelesai}_${ruang || 'x'}`.replace(/[\s/\\|]/g, '_'),
            hari: day,
            jamMulai,
            jamSelesai,
            kodeMK: kodeMK || namaMK,
            namaMK: namaMK || kodeMK,
            dosen: cleanedDosen,
            ruang: ruang || 'Ruang Kelas',
            tipeKelas,
            prodi,
            semester: currentSemester,
            tahunAjaran: tahunAjaran || null,
            status: 'draft',
          })
        }
      })
    }
  }

  if (!tahunAjaran) {
    warnings.push(
      'Tahun Ajaran tidak terdeteksi otomatis dari berkas. Memakai Tahun Ajaran yang dipilih di langkah unggah — mohon periksa kembali sebelum menyimpan.',
    )
  }

  return {
    scheduleEntries,
    courses,
    exams: [],
    tahunAjaran,
    detectedFormat: 'multi-prodi-matrix',
    warnings,
  }
}
