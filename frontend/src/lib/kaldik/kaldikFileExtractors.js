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
    let raw = String(lines[i] || '').trim()
    if (!raw) continue
    const upper = raw.toUpperCase().replace(/\s+/g, ' ')

    // Deteksi seksi
    if (upper.includes('SEMESTER GANJIL')) { currentSection = 'ganjil'; sectionExplicit = true; continue }
    if (upper.includes('SEMESTER GENAP')) { currentSection = 'genap'; sectionExplicit = true; continue }
    if (upper.includes('KETERANGAN') || upper.includes('HARI LIBUR')) { currentSection = 'antar'; sectionExplicit = true; continue }
    if (upper.startsWith('CATATAN') || /^CATATAN\s*:/i.test(raw)) break

    // Lewati baris noise kalender (hari, bulan, grid angka)
    if (/^(MIN|SEN|SEL|RAB|KAM|JUM|SAB)\s/i.test(raw)) continue
    if (/^[A-Z]{3,9}\s+\d{4}$/i.test(raw)) continue
    if (/^[\d\s]+$/.test(raw)) continue
    if (/^[A-Z]{3}$/i.test(raw) && currentSection === 'antar') continue
    if (raw.includes('@') || raw.includes('http://') || raw.includes('https://')) continue

    // Tangani kemungkinan tahun terpisah ke baris berikutnya
    if (i + 1 < lines.length) {
      const nextLine = String(lines[i + 1] || '').trim()
      const nextYearMatch = nextLine.match(/^(\d{4})\b\s*(.*)/)
      if (nextYearMatch && !extractKaldikDateRange(raw)?.raw?.includes(nextYearMatch[1])) {
        raw = `${raw} ${nextYearMatch[1]} ${nextYearMatch[2]}`.trim()
        i += 1
      }
    }

    // Bersihkan tanggal dalam kurung penjelasan (e.g. "(Hari Raya Idul Fitri diperkirakan ... 10 Mar 2027)")
    const cleaned = raw.replace(/\([^)]*?\b(?:diperkirakan|perkiraan|tanggal)\b[^)]*?\)/gi, ' ')

    const dateResult = extractKaldikDateRange(cleaned)
    if (!dateResult) continue

    // Nama event: sisa teks setelah rentang tanggal pada baris yang sama
    let eventName = raw.replace(dateResult.raw, '').trim()
    eventName = eventName.replace(/^[\s:\-–—|•·.,]+|[\s:\-–—|•·.,]+$/g, '').trim()

    // Fallback: jika tidak ada nama di baris yang sama, lihat baris sebelumnya atau berikutnya
    if (!eventName && i > 0) {
      const prevLine = String(lines[i - 1] || '').trim()
      if (prevLine && !isSectionHeader(prevLine) && !extractKaldikDateRange(prevLine) && !/^[\d\s]+$/.test(prevLine)) {
        eventName = prevLine
      }
    }

    let nextIdx = i + 1
    while ((!eventName || eventName.length < 5) && nextIdx < lines.length) {
      const nextLine = String(lines[nextIdx] || '').trim()
      if (!nextLine) { nextIdx += 1; continue }
      if (isSectionHeader(nextLine)) break
      if (extractKaldikDateRange(nextLine)) break
      eventName = eventName ? `${eventName} ${nextLine}` : nextLine
      i = nextIdx
      break
    }

    // Tangani baris lanjutan teks (penutup kurung "Fitri)", teks sambungan)
    if (eventName && i + 1 < lines.length) {
      const nextLine = String(lines[i + 1] || '').trim()
      if (
        nextLine &&
        !isSectionHeader(nextLine) &&
        !extractKaldikDateRange(nextLine) &&
        !/^[\d\s]+$/.test(nextLine) &&
        !nextLine.startsWith('Catatan') &&
        !nextLine.includes('@') &&
        (eventName.endsWith('(') || eventName.endsWith('&') || eventName.endsWith(',') || (/^[a-z)]/i.test(nextLine) && nextLine.length < 35))
      ) {
        eventName = `${eventName} ${nextLine}`.replace(/\s+/g, ' ').trim()
        i += 1
      }
    }

    if (!eventName) continue

    const semester = sectionExplicit
      ? currentSection
      : detectSemesterFromDate(dateResult.start)

    events.push({
      nama: eventName,
      name: eventName,
      tanggalMulai: dateResult.start,
      startDate: dateResult.start,
      tanggalSelesai: dateResult.end,
      endDate: dateResult.end,
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
      name: nama,
      tanggalMulai,
      startDate: tanggalMulai,
      tanggalSelesai,
      endDate: tanggalSelesai,
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
      const nama = String(e.nama || e.name || e.event || e.namaKegiatan || '').trim()
      const tanggalMulai = normalizeDate(e.tanggalMulai || e.startDate || e.mulai || e.start || '')
      const tanggalSelesai =
        normalizeDate(e.tanggalSelesai || e.endDate || e.selesai || e.end || '') || tanggalMulai
      if (!nama || !tanggalMulai) return null
      return {
        nama,
        name: nama,
        tanggalMulai,
        startDate: tanggalMulai,
        tanggalSelesai,
        endDate: tanggalSelesai,
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

    const validItems = textContent.items
      .filter((it) => it.str && it.str.trim())
      .map((it) => ({
        str: it.str.trim(),
        x: it.transform[4],
        y: it.transform[5],
      }))

    if (validItems.length === 0) continue

    const viewport = page.getViewport({ scale: 1.0 })
    const width = viewport.width || 800

    // Deteksi layout multi-kolom halaman (misal: kalender bulanan di kiri, tabel agenda di kanan)
    const numBuckets = Math.ceil(width / 10)
    const bucketCounts = new Array(numBuckets).fill(0)
    for (const it of validItems) {
      const b = Math.floor(it.x / 10)
      if (b >= 0 && b < numBuckets) bucketCounts[b]++
    }

    const minB = Math.floor(numBuckets * 0.25)
    const maxB = Math.floor(numBuckets * 0.75)
    let bestGutter = null
    let inGap = false
    let gapStart = 0
    for (let b = minB; b <= maxB; b++) {
      if (bucketCounts[b] === 0) {
        if (!inGap) {
          inGap = true
          gapStart = b
        }
      } else if (inGap) {
        inGap = false
        const gapWidth = (b - gapStart) * 10
        if (gapWidth >= 20 && (!bestGutter || gapWidth > bestGutter.width)) {
          bestGutter = { splitX: ((gapStart + b) / 2) * 10, width: gapWidth }
        }
      }
    }

    const cols = bestGutter
      ? [validItems.filter((it) => it.x < bestGutter.splitX), validItems.filter((it) => it.x >= bestGutter.splitX)]
      : [validItems]

    for (const colItems of cols) {
      if (colItems.length === 0) continue
      const sorted = [...colItems].sort((a, b) => b.y - a.y)
      const rows = []
      let cur = null
      for (const it of sorted) {
        if (!cur) {
          cur = { minY: it.y, maxY: it.y, items: [it] }
        } else if (cur.minY - it.y <= 13.5) {
          cur.items.push(it)
          cur.minY = Math.min(cur.minY, it.y)
          cur.maxY = Math.max(cur.maxY, it.y)
        } else {
          rows.push(cur)
          cur = { minY: it.y, maxY: it.y, items: [it] }
        }
      }
      if (cur) rows.push(cur)

      for (const r of rows) {
        const dateItems = r.items.filter((it) => it.x < 550).sort((a, b) => b.y - a.y || a.x - b.x)
        const descItems = r.items.filter((it) => it.x >= 550).sort((a, b) => b.y - a.y || a.x - b.x)

        const parts = []
        if (dateItems.length > 0) parts.push(dateItems.map((it) => it.str).join(' '))
        if (descItems.length > 0) parts.push(descItems.map((it) => it.str).join(' '))
        allLines.push(parts.join(' '))
      }
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
