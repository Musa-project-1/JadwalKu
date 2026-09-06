import { extractKaldikDateRange, normalizeDate } from './kaldikDateUtils.js'
import { normalizeCategory, detectSemester, detectSemesterFromDate } from './kaldikCategories.js'

let _XLSXCal = null
async function getXLSXCal() {
  if (!_XLSXCal) _XLSXCal = await import('xlsx')
  return _XLSXCal
}

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

export async function parseAcademicCalendarFile(file, onProgress = () => {}) {
  const ext = file.name.split('.').pop().toLowerCase()

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
