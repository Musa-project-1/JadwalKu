/**
 * Parser & utilitas Kalender Akademik (Kaldik).
 *
 * Satu-satunya sumber untuk:
 *  - Menurunkan batas ganjil/genap dari daftar event (deriveBoundsFromEvents)
 *  - Mengimpor file Kaldik (PDF, PNG/JPG/WebP via OCR, Excel, CSV, JSON)
 *    menjadi daftar event terstruktur.
 *
 * Struktur satu event:
 * {
 *   nama: string,
 *   tanggalMulai: 'YYYY-MM-DD',
 *   tanggalSelesai: 'YYYY-MM-DD',
 *   semester: 'ganjil' | 'genap' | 'antar',
 *   kategori: 'registrasi'|'perkuliahan'|'uts'|'uas'|'ujian'|'yudisium'|'libur'|'kegiatan'|'minggu_tenang',
 * }
 */
let _XLSXCal = null
async function getXLSXCal() { if (!_XLSXCal) _XLSXCal = await import('xlsx'); return _XLSXCal }
// Bundle worker lokal agar tidak bergantung CDN saat runtime (sama seperti universalParser).
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import tesseractWorkerUrl from 'tesseract.js/dist/worker.min.js?url'

let pdfjsLib = null
async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  }
  return pdfjsLib
}

let tesseractModule = null
async function getTesseract() {
  if (!tesseractModule) {
    tesseractModule = await import('tesseract.js')
  }
  return tesseractModule
}

// ────────────────────────────────────────────────────────────
// Pemetaan bulan (nama → kode 01-12)
// ────────────────────────────────────────────────────────────
const MONTH_ALIASES = {
  'jan': '01', 'januari': '01',
  'feb': '02', 'februari': '02',
  'mar': '03', 'maret': '03',
  'apr': '04', 'april': '04',
  'mei': '05', 'may': '05',
  'jun': '06', 'juni': '06',
  'jul': '07', 'juli': '07',
  'agu': '08', 'agustus': '08', 'aug': '08',
  'sep': '09', 'sept': '09', 'september': '09',
  'okt': '10', 'oktober': '10', 'oct': '10',
  'nov': '11', 'november': '11',
  'des': '12', 'desember': '12', 'dec': '12',
}

function getMonthNumber(monthStr) {
  const m = String(monthStr).toLowerCase().trim()
  return MONTH_ALIASES[m] || null
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

// ────────────────────────────────────────────────────────────
// Normalisasi tanggal
// ────────────────────────────────────────────────────────────

function buildISO(day, monthName, year) {
  const month = getMonthNumber(monthName)
  if (!month) return null
  const d = parseInt(day, 10)
  const y = parseInt(year, 10)
  if (!d || !y || d < 1 || d > 31) return null
  return `${y}-${month}-${pad2(d)}`
}

/**
 * Normalisasi berbagai format tanggal menjadi ISO 'YYYY-MM-DD'.
 * Mendukung: Excel serial, 'YYYY-MM-DD', 'DD/MM/YYYY', 'DD-MM-YYYY',
 * 'DD MMM YYYY', dan string tanggal apa pun yang bisa diparse Date().
 */
export function normalizeDate(value) {
  if (value == null || value === '') return ''

  const str = String(value).trim()

  // ISO: YYYY-MM-DD
  const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) return `${iso[1]}-${pad2(iso[2])}-${pad2(iso[3])}`

  // Excel serial date (basis 1900)
  const num = Number(str)
  if (Number.isFinite(num) && num > 20000 && num < 60000) {
    const ms = (num - 25569) * 86400000
    const d = new Date(ms)
    return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
  }

  // DD/MM/YYYY atau DD-MM-YYYY
  const slash = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/)
  if (slash) return `${slash[3]}-${pad2(slash[2])}-${pad2(slash[1])}`

  // DD MMM YYYY
  const word = str.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/)
  if (word) {
    const isoDate = buildISO(word[1], word[2], word[3])
    if (isoDate) return isoDate
  }

  // Fallback: pakai Date() native
  const parsed = new Date(str)
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`
  }

  return str
}

// ────────────────────────────────────────────────────────────
// Deteksi semester & kategori
// ────────────────────────────────────────────────────────────

export const KATEGORI_VALUES = [
  'registrasi',
  'perkuliahan',
  'uts',
  'uas',
  'ujian',
  'yudisium',
  'libur',
  'kegiatan',
  'minggu_tenang',
]

/** Deteksi kategori dari nama event / teks label. */
export function normalizeCategory(name) {
  const s = String(name || '').toLowerCase()
  if (s.includes('registrasi') || s.includes('krs') || s.includes('bimbingan akademik')) return 'registrasi'
  if (s.includes('perkuliahan')) return 'perkuliahan'
  if (s.includes('uts') || s.includes('tengah semester')) return 'uts'
  if (s.includes('uas') || s.includes('akhir semester')) return 'uas'
  if (s.includes('praktikum') || s.includes('praktik lapangan') || s.includes('remedial') || s.includes('ujian')) return 'ujian'
  if (s.includes('yudisium')) return 'yudisium'
  if (s.includes('libur') || s.includes('cuti')) return 'libur'
  if (s.includes('minggu tenang')) return 'minggu_tenang'
  return 'kegiatan'
}

/** Deteksi semester dari string eksplisit / fallback dari bulan tanggal mulai. */
export function detectSemester(semesterRaw, tanggalMulai = '') {
  const s = String(semesterRaw || '').toLowerCase()
  if (s.includes('ganjil')) return 'ganjil'
  if (s.includes('genap')) return 'genap'
  if (s.includes('antar') || s.includes('libur') || s.includes('cuti')) return 'antar'

  // Fallback: infer dari bulan. Sep–Feb → ganjil, Mar–Agu → genap.
  if (tanggalMulai) {
    const month = Number(String(tanggalMulai).split('-')[1])
    if (!Number.isNaN(month)) {
      if (month >= 9 || month <= 2) return 'ganjil'
      return 'genap'
    }
  }
  return 'antar'
}

function detectSemesterFromDate(startISO) {
  return detectSemester('', startISO)
}

// ────────────────────────────────────────────────────────────
// Turunkan batas kalender (ganjil/genap start & end) dari events
// ────────────────────────────────────────────────────────────

function toDate(iso) {
  if (!iso) return null
  const [y, m, d] = String(iso).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/**
 * Turunkan 4 batas { month, day } (month 0-index) dari daftar event.
 * Hanya event dengan semester 'ganjil' / 'genap' yang dipakai.
 * Mengembalikan { ganjilStart?, ganjilEnd?, genapStart?, genapEnd? } atau null.
 */
export { deriveBoundsFromEvents } from './calendarBounds'

// ────────────────────────────────────────────────────────────
// Parser baris Kaldik (untuk PDF & OCR)
// ────────────────────────────────────────────────────────────

/**
 * Ekstrak rentang tanggal dari sebuah baris teks Kaldik.
 * Mendukung pola:
 *   A. "16 Nov 2026 – 02 Jan 2027"
 *   B. "21 Sep – 07 Nov 2026"
 *   C. "10 – 12 Sep 2026"
 *   D. "28 Jan 2027" (single)
 * Mengembalikan { start, end, raw } atau null.
 */
export function extractKaldikDateRange(text) {
  const str = String(text || '').trim().replace(/\s+/g, ' ')
  if (!str) return null

  const dash = '[–\\-—]'

  // Pattern A: DD MMM YYYY – DD MMM YYYY
  let m = str.match(
    new RegExp(`(\\d{1,2})\\s+([A-Za-z]{3,9})\\s+(\\d{4})\\s*${dash}\\s*(\\d{1,2})\\s+([A-Za-z]{3,9})\\s+(\\d{4})`),
  )
  if (m) {
    const start = buildISO(m[1], m[2], m[3])
    const end = buildISO(m[4], m[5], m[6])
    if (start && end) return { start, end, raw: m[0] }
  }

  // Pattern B: DD MMM – DD MMM YYYY
  m = str.match(
    new RegExp(`(\\d{1,2})\\s+([A-Za-z]{3,9})\\s*${dash}\\s*(\\d{1,2})\\s+([A-Za-z]{3,9})\\s+(\\d{4})`),
  )
  if (m) {
    const start = buildISO(m[1], m[2], m[5])
    const end = buildISO(m[3], m[4], m[5])
    if (start && end) return { start, end, raw: m[0] }
  }

  // Pattern C: DD – DD MMM YYYY
  m = str.match(
    new RegExp(`(\\d{1,2})\\s*${dash}\\s*(\\d{1,2})\\s+([A-Za-z]{3,9})\\s+(\\d{4})`),
  )
  if (m) {
    const start = buildISO(m[1], m[3], m[4])
    const end = buildISO(m[2], m[3], m[4])
    if (start && end) return { start, end, raw: m[0] }
  }

  // Pattern D: DD MMM YYYY (single)
  m = str.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/)
  if (m) {
    const start = buildISO(m[1], m[2], m[3])
    const end = start
    if (start) return { start, end, raw: m[0] }
  }

  return null
}

function isSectionHeader(text) {
  const upper = String(text || '').toUpperCase().trim()
  return (
    upper.includes('SEMESTER GANJIL') ||
    upper.includes('SEMESTER GENAP') ||
    upper.includes('KETERANGAN') ||
    upper.includes('HARI LIBUR') ||
    upper.includes('CATATAN')
  )
}

/**
 * Parse kumpulan baris hasil ekstraksi teks PDF / OCR gambar menjadi events.
 */
export function parseKaldikLines(lines = []) {
  const events = []
  let currentSection = 'antar'
  // Tandai apakah seksi sudah ditentukan secara eksplisit oleh header.
  // Jika ya, event di seksi "Keterangan / Hari Libur" tetap 'antar',
  // bukan diturunkan dari bulan (yang bisa jatuh di rentang genap).
  let sectionExplicit = false

  for (let i = 0; i < lines.length; i += 1) {
    const raw = String(lines[i] || '').trim()
    if (!raw) continue
    const upper = raw.toUpperCase().replace(/\s+/g, ' ')

    // Deteksi seksi
    if (upper.includes('SEMESTER GANJIL')) { currentSection = 'ganjil'; sectionExplicit = true; continue }
    if (upper.includes('SEMESTER GENAP')) { currentSection = 'genap'; sectionExplicit = true; continue }
    if (upper.includes('KETERANGAN') || upper.includes('HARI LIBUR')) { currentSection = 'antar'; sectionExplicit = true; continue }

    // Lewati baris noise kalender (hari, bulan, grid angka)
    if (/^(MIN|SEN|SEL|RAB|KAM|JUM|SAB)\s/i.test(raw)) continue
    if (/^[A-Z]{3,9}\s+\d{4}$/i.test(raw)) continue
    if (/^[A-Z]{3}$/i.test(raw) && currentSection === 'antar') continue

    const dateResult = extractKaldikDateRange(raw)
    if (!dateResult) continue

    // Nama event: sisa teks setelah rentang tanggal pada baris yang sama
    let eventName = raw.replace(dateResult.raw, '').trim()
    eventName = eventName.replace(/^[\s:\-–—|•·.,]+/, '').trim()

    // Fallback: jika tidak ada nama di baris yang sama, lihat baris berikutnya
    let nextIdx = i + 1
    while (!eventName && nextIdx < lines.length) {
      const nextLine = String(lines[nextIdx] || '').trim()
      if (!nextLine) { nextIdx += 1; continue }
      if (isSectionHeader(nextLine)) break
      if (extractKaldikDateRange(nextLine)) break
      eventName = nextLine
      i = nextIdx
      break
    }

    if (!eventName) continue

    const semester = sectionExplicit
      ? currentSection
      : detectSemesterFromDate(dateResult.start)

    events.push({
      nama: eventName,
      tanggalMulai: dateResult.start,
      tanggalSelesai: dateResult.end,
      semester,
      kategori: normalizeCategory(eventName),
    })
  }

  return events
}

// ────────────────────────────────────────────────────────────
// Parser spreadsheet (Excel / CSV)
// ────────────────────────────────────────────────────────────

const CALENDAR_COLUMN_ALIASES = {
  nama: ['nama kegiatan', 'kegiatan', 'agenda', 'nama', 'activity', 'nama agenda', 'acara', 'nama event', 'event', 'nama acara'],
  tanggalMulai: ['tanggal mulai', 'mulai', 'start', 'mulai tanggal', 'tgl mulai', 'dari', 'from', 'tanggal'],
  tanggalSelesai: ['tanggal selesai', 'selesai', 'end', 'selesai tanggal', 'tgl selesai', 'sampai', 'to'],
  semester: ['semester', 'periode', 'term', 'sem'],
  kategori: ['kategori', 'jenis', 'category', 'tipe kegiatan', 'tipe'],
}

function findColumn(headers, aliases) {
  const lowerHeaders = headers.map((h) => String(h).toLowerCase().trim())
  for (const alias of aliases) {
    const idx = lowerHeaders.findIndex((h) => h === alias || h.includes(alias))
    if (idx !== -1) return idx
  }
  return -1
}

/** Parse baris spreadsheet menjadi daftar event. */
export function parseCalendarRows(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return []

  const headers = Object.keys(rows[0])
  const col = {}
  for (const field of Object.keys(CALENDAR_COLUMN_ALIASES)) {
    col[field] = findColumn(headers, CALENDAR_COLUMN_ALIASES[field])
  }

  const events = []
  for (const row of rows) {
    const nama = col.nama !== -1 ? String(row[headers[col.nama]] || '').trim() : ''
    const tanggalMulaiRaw = col.tanggalMulai !== -1 ? String(row[headers[col.tanggalMulai]] || '').trim() : ''
    const tanggalSelesaiRaw = col.tanggalSelesai !== -1 ? String(row[headers[col.tanggalSelesai]] || '').trim() : ''
    const semesterRaw = col.semester !== -1 ? String(row[headers[col.semester]] || '').trim() : ''
    const kategoriRaw = col.kategori !== -1 ? String(row[headers[col.kategori]] || '').trim() : ''

    if (!nama || !tanggalMulaiRaw) continue

    const tanggalMulai = normalizeDate(tanggalMulaiRaw)
    if (!tanggalMulai) continue
    const tanggalSelesai = normalizeDate(tanggalSelesaiRaw) || tanggalMulai

    events.push({
      nama,
      tanggalMulai,
      tanggalSelesai,
      semester: detectSemester(semesterRaw, tanggalMulai),
      kategori: normalizeCategory(kategoriRaw || nama),
    })
  }

  return events
}

// ────────────────────────────────────────────────────────────
// Parser JSON (preset / data terstruktur)
// ────────────────────────────────────────────────────────────

function normalizeEvents(rawEvents) {
  if (!Array.isArray(rawEvents)) return []
  return rawEvents
    .map((e) => {
      const nama = String(e.nama || e.event || e.namaKegiatan || '').trim()
      const tanggalMulai = normalizeDate(e.tanggalMulai || e.mulai || e.start || '')
      const tanggalSelesai =
        normalizeDate(e.tanggalSelesai || e.selesai || e.end || '') || tanggalMulai
      if (!nama || !tanggalMulai) return null
      return {
        nama,
        tanggalMulai,
        tanggalSelesai,
        semester: detectSemester(e.semester || '', tanggalMulai),
        kategori: e.kategori || normalizeCategory(nama),
      }
    })
    .filter(Boolean)
}

/** Normalisasi preset JSON (objek ber-events / array events langsung). */
export function normalizeJsonPreset(data) {
  if (Array.isArray(data)) return normalizeEvents(data)
  if (data && Array.isArray(data.events)) return normalizeEvents(data.events)
  return []
}

// ────────────────────────────────────────────────────────────
// Parser file utama
// ────────────────────────────────────────────────────────────

async function extractPdfTextLines(arrayBuffer, onProgress) {
  const pdfjs = await getPdfJs()
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) })
  const pdf = await loadingTask.promise
  const allLines = []
  let hasSelectableText = false

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    if (onProgress) {
      onProgress({
        stage: `Membaca halaman ${pageNum} dari ${pdf.numPages}...`,
        progress: 30 + Math.floor((pageNum / pdf.numPages) * 50),
      })
    }
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    if (textContent.items.length > 0) hasSelectableText = true

    // Kelompokkan kata per baris (y-key), urutkan dari atas ke bawah.
    const lineMap = new Map()
    for (const item of textContent.items) {
      if (!item.str || !item.str.trim()) continue
      const yKey = Math.round(item.transform[5] / 3) * 3
      if (!lineMap.has(yKey)) lineMap.set(yKey, [])
      lineMap.get(yKey).push({ x: item.transform[4], text: item.str.trim() })
    }
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a)
    for (const y of sortedY) {
      const sortedItems = lineMap.get(y).sort((a, b) => a.x - b.x)
      allLines.push(sortedItems.map((it) => it.text).join(' '))
    }
  }

  if (!hasSelectableText || allLines.length === 0) {
    throw new Error(
      'PDF ini tidak memiliki teks digital (kemungkinan hasil scan foto). Silakan konversi ke gambar (PNG/JPG) atau gunakan PDF digital yang dapat difotokopi teksnya.',
    )
  }
  return allLines
}

/**
 * Parse file Kaldik menjadi daftar event.
 * Mendukung: .pdf, .png, .jpg, .jpeg, .webp, .xlsx, .xls, .csv, .json.
 *
 * @param {File} file
 * @param {(p: {stage: string, progress: number}) => void} onProgress
 * @returns {Promise<{events: Array, warnings: string[], fileType: string, detectedFormat: string}>}
 */
export async function parseAcademicCalendarFile(file, onProgress = () => {}) {
  const ext = file.name.split('.').pop().toLowerCase()

  // ── Excel / CSV ──
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    onProgress({ stage: 'Membaca spreadsheet...', progress: 30 })
    const arrayBuffer = await file.arrayBuffer()
    const XLSX = await getXLSXCal()
    const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: false })
    const sheetName =
      wb.SheetNames.find((n) => {
        const s = wb.Sheets[n]
        const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' })
        return rows.length > 1
      }) || wb.SheetNames[0]

    const sheet = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true })
    const events = parseCalendarRows(rows)
    onProgress({ stage: 'Selesai membaca spreadsheet', progress: 100 })
    return {
      events,
      warnings: events.length === 0 ? ['Tidak ada baris event valid yang terdeteksi.'] : [],
      fileType: ext,
      detectedFormat: 'spreadsheet',
    }
  }

  // ── JSON ──
  if (ext === 'json') {
    onProgress({ stage: 'Membaca file JSON...', progress: 40 })
    const text = await file.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error('File JSON tidak valid. Pastikan struktur JSON benar (array events atau objek ber-events).')
    }
    const events = normalizeJsonPreset(data)
    onProgress({ stage: 'Selesai membaca JSON', progress: 100 })
    return {
      events,
      warnings: events.length === 0 ? ['Tidak ada event valid di dalam JSON.'] : [],
      fileType: 'json',
      detectedFormat: 'json',
    }
  }

  // ── PDF ──
  if (ext === 'pdf') {
    onProgress({ stage: 'Mengekstrak teks PDF...', progress: 20 })
    const arrayBuffer = await file.arrayBuffer()
    const lines = await extractPdfTextLines(arrayBuffer, onProgress)
    const events = parseKaldikLines(lines)
    onProgress({ stage: 'Selesai membaca PDF', progress: 100 })
    return {
      events,
      warnings: [
        'Data diambil dari PDF digital. Periksa kembali hasil pratinjau sebelum disimpan.',
        events.length === 0 ? 'Tidak ada event Kaldik terdeteksi. Coba gunakan versi gambar (PNG/JPG).' : null,
      ].filter(Boolean),
      fileType: 'pdf',
      detectedFormat: 'pdf',
    }
  }

  // ── Gambar (OCR) ──
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
    onProgress({ stage: 'Memuat Engine OCR Browser...', progress: 20 })
    const { createWorker } = await getTesseract()
    const worker = await createWorker('ind+eng', 1, {
      workerPath: tesseractWorkerUrl,
    })
    onProgress({ stage: 'Menganalisis teks gambar...', progress: 50 })
    const ret = await worker.recognize(file)
    await worker.terminate()

    const ocrLines = (ret.data.lines || []).map((l) => l.text)
    if (ocrLines.length === 0) {
      throw new Error('Tidak ada teks yang terdeteksi pada gambar ini. Pastikan gambar jelas, terang, dan tidak miring.')
    }

    const events = parseKaldikLines(ocrLines)
    onProgress({ stage: 'Selesai membaca gambar', progress: 100 })
    return {
      events,
      warnings: [
        'Data diproses menggunakan OCR gambar di browser. Periksa kembali hasil pratinjau sebelum disimpan.',
        events.length === 0 ? 'Tidak ada event Kaldik terdeteksi. Coba gambar yang lebih tajam / resolusi tinggi.' : null,
      ].filter(Boolean),
      fileType: ext,
      detectedFormat: 'ocr',
    }
  }

  throw new Error(
    `Format file .${ext} belum didukung. Silakan gunakan .pdf, .png, .jpg, .jpeg, .webp, .xlsx, .xls, .csv, atau .json.`,
  )
}

// ────────────────────────────────────────────────────────────
// Utilitas tambahan untuk UI
// ────────────────────────────────────────────────────────────

export function formatEventDateRange(event) {
  const start = event.tanggalMulai || ''
  const end = event.tanggalSelesai || start
  return start === end ? start : `${start} s.d ${end}`
}

export function semesterLabel(semester) {
  return semester === 'ganjil' ? 'Ganjil' : semester === 'genap' ? 'Genap' : 'Antar / Libur'
}

export function kategoriLabel(kategori) {
  const labels = {
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
  return labels[kategori] || kategori || 'Kegiatan'
}
