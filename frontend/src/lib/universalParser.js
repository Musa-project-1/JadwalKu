let _XLSX2 = null
async function getXLSX2() {
  if (!_XLSX2) _XLSX2 = await import('xlsx')
  return _XLSX2
}
let _mammoth = null
async function getMammoth() {
  if (!_mammoth) {
    const mod = await import('mammoth')
    _mammoth = mod.default || mod
  }
  return _mammoth
}
// Bundle worker lokal (dari node_modules) agar tidak bergantung CDN (unpkg/jsdelivr)
// saat runtime. Vite akan menyalin file ini ke dist/assets dan mengembalikan URL lokal.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import tesseractWorkerUrl from 'tesseract.js/dist/worker.min.js?url'

let pdfjsLib = null
async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist')
    // Worker PDF di-bundle lokal — tidak lagi dari unpkg.com.
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

export const DAY_MAP = {
  senin: 'Senin',
  monday: 'Senin',
  mon: 'Senin',
  selasa: 'Selasa',
  tuesday: 'Selasa',
  tue: 'Selasa',
  rabu: 'Rabu',
  wednesday: 'Rabu',
  wed: 'Rabu',
  kamis: 'Kamis',
  thursday: 'Kamis',
  thu: 'Kamis',
  jumat: 'Jumat',
  "jum'at": 'Jumat',
  friday: 'Jumat',
  fri: 'Jumat',
  sabtu: 'Sabtu',
  saturday: 'Sabtu',
  sat: 'Sabtu',
  minggu: 'Minggu',
  sunday: 'Minggu',
  sun: 'Minggu',
}

export function normalizeDay(dayRow) {
  if (!dayRow) return ''
  const clean = String(dayRow).trim().toLowerCase().replace(/[^a-z']/g, '')
  return DAY_MAP[clean] || (dayRow ? String(dayRow).trim() : '')
}

export function normalizeTimeRange(timeRaw) {
  if (!timeRaw) return { jamMulai: '', jamSelesai: '' }
  const str = String(timeRaw).trim()
  const match = str.match(/(\d{1,2})[:.](\d{2})\s*(?:-|–|—|s\/d|sd|sampai|to)\s*(\d{1,2})[:.](\d{2})/i)
  if (match) {
    const jamMulai = `${match[1].padStart(2, '0')}:${match[2]}`
    const jamSelesai = `${match[3].padStart(2, '0')}:${match[4]}`
    return { jamMulai, jamSelesai }
  }
  const single = str.match(/(\d{1,2})[:.](\d{2})/)
  if (single) {
    return { jamMulai: `${single[1].padStart(2, '0')}:${single[2]}`, jamSelesai: '' }
  }
  return { jamMulai: str, jamSelesai: '' }
}

export function normalizeClassType(typeRaw, campusConfig = {}) {
  if (!typeRaw) return 'K1'
  const str = String(typeRaw).trim().toUpperCase()

  // Baca daftar tipe kelas valid dari config kampus (jika ada).
  const campusTypes = (campusConfig?.classTypes || [])
    .map((t) => (typeof t === 'string' ? t : t?.code))
    .filter(Boolean)
  if (campusTypes.length > 0) {
    // Longest-first agar 'HBH'/'HBD' tidak tertangkap 'HB'.
    const sorted = [...campusTypes].sort((a, b) => b.length - a.length)
    const match = sorted.find((c) => c === str || c.includes(str) || str.includes(c))
    if (match) return match
  }

  if (['K1', 'REGULER', 'OFFLINE', 'TATAP MUKA', 'LURING'].includes(str)) return 'K1'
  if (['K2', 'ONLINE', 'DARING', 'ZOOM', 'MEET'].includes(str)) return 'K2'
  if (['GBK1', 'GABUNGAN OFFLINE', 'GABUNGAN REGULER'].includes(str)) return 'GBK1'
  if (['GBK2', 'GABUNGAN ONLINE', 'GABUNGAN DARING'].includes(str)) return 'GBK2'
  if (['HBH', 'HYBRID HALIMAH', 'HYBRID OFFLINE'].includes(str)) return 'HBH'
  if (['HBD', 'HYBRID DEKANAT'].includes(str)) return 'HBD'
  return str
}

export async function parseUniversalFile(file, onProgress = () => {}, campusConfig = {}) {
  const ext = file.name.split('.').pop().toLowerCase()
  const arrayBuffer = await file.arrayBuffer()

  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    onProgress({ stage: 'Membaca spreadsheet...', progress: 30 })
    const XLSX = await getXLSX2()
    const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: false })
    const { parseWorkbook } = await import('./xlsxParser')
    const campusParsed = await parseWorkbook(arrayBuffer, campusConfig)
    const hasCampusFormat = campusParsed.detectedFormat === 'campus-matrix'

    const firstSheetName = wb.SheetNames[0]
    const sheet = wb.Sheets[firstSheetName]
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    const rawHeaders = rawRows.length > 0 ? Object.keys(rawRows[0]) : []

    onProgress({ stage: 'Selesai membaca', progress: 100 })
    return {
      isCampusFormat: hasCampusFormat,
      parsed: hasCampusFormat ? campusParsed : null,
      rawHeaders,
      rawRows,
      fileType: ext,
      warnings: campusParsed.warnings || [],
      detectedFormat: campusParsed.detectedFormat || 'unknown',
    }
  }

  if (ext === 'docx') {
    onProgress({ stage: 'Mengekstrak tabel Word...', progress: 40 })
    const mammoth = await getMammoth()
    const result = await mammoth.convertToHtml({ arrayBuffer })
    const html = result.value
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const table = doc.querySelector('table')
    if (!table) throw new Error('Tidak ditemukan tabel jadwal di dalam dokumen Word (.docx) ini.')
    const trs = Array.from(table.querySelectorAll('tr'))
    if (trs.length < 2) throw new Error('Tabel Word tidak memiliki baris data yang cukup.')
    const headerCells = Array.from(trs[0].querySelectorAll('th, td')).map((c, i) => c.textContent.trim() || `Kolom ${i + 1}`)
    const rawRows = trs.slice(1).map((tr) => {
      const cells = Array.from(tr.querySelectorAll('td'))
      const row = {}
      headerCells.forEach((header, i) => {
        row[header] = cells[i] ? cells[i].textContent.trim() : ''
      })
      return row
    }).filter((r) => Object.values(r).some((v) => Boolean(v)))
    onProgress({ stage: 'Selesai mengekstrak tabel Word', progress: 100 })
    return {
      isCampusFormat: false,
      parsed: null,
      rawHeaders: headerCells,
      rawRows,
      fileType: 'docx',
      warnings: result.messages.map((m) => m.message),
      detectedFormat: 'docx-table',
    }
  }

  if (ext === 'pdf') {
    onProgress({ stage: 'Mengekstrak teks PDF digital...', progress: 30 })
    const pdfjs = await getPdfJs()
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) })
    const pdf = await loadingTask.promise
    const allLines = []
    let hasSelectableText = false
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      onProgress({ stage: `Membaca halaman ${pageNum} dari ${pdf.numPages}...`, progress: 30 + Math.floor((pageNum / pdf.numPages) * 50) })
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
        const lineTokens = sortedItems.map((it) => it.text)
        if (lineTokens.length > 0) allLines.push(lineTokens)
      }
    }
    if (!hasSelectableText || allLines.length === 0) {
      throw new Error('PDF ini tidak memiliki teks digital (kemungkinan hasil scan foto). Silakan gunakan PDF digital resmi atau konversi/unggah sebagai file gambar (PNG/JPG) untuk diproses via OCR.')
    }
    const rawHeaders = allLines[0].map((t, i) => t || `Kolom ${i + 1}`)
    const rawRows = allLines.slice(1).map((line) => {
      const row = {}
      rawHeaders.forEach((h, i) => { row[h] = line[i] || '' })
      return row
    })
    onProgress({ stage: 'Selesai membaca PDF', progress: 100 })
    return { isCampusFormat: false, parsed: null, rawHeaders, rawRows, fileType: 'pdf', warnings: [], detectedFormat: 'pdf' }
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
    const ocrLines = ret.data.lines || []
    if (ocrLines.length === 0) throw new Error('Tidak ada teks atau angka yang berhasil dideteksi pada gambar ini.')
    const rawHeaders = ['Hari', 'Jam', 'Mata Kuliah', 'Dosen', 'Ruang', 'Tipe Kelas']
    const rawRows = []
    for (const line of ocrLines) {
      const text = line.text.trim()
      if (!text) continue
      const dayMatch = Object.keys(DAY_MAP).find((d) => text.toLowerCase().includes(d))
      const timeMatch = text.match(/(\d{1,2})[:.](\d{2})\s*(?:-|–|—|s\/d|sd)\s*(\d{1,2})[:.](\d{2})/i)
      if (dayMatch || timeMatch) {
        rawRows.push({
          Hari: dayMatch ? DAY_MAP[dayMatch] : '',
          Jam: timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]} - ${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}` : '',
          'Mata Kuliah': text.replace(/(\d{1,2})[:.](\d{2})\s*(?:-|–|—|s\/d|sd)\s*(\d{1,2})[:.](\d{2})/i, '').trim(),
          Dosen: '',
          Ruang: '',
          'Tipe Kelas': 'K1',
          _confidence: Math.round(line.confidence || 70),
        })
      }
    }
    onProgress({ stage: 'Selesai membaca gambar', progress: 100 })
    return {
      isCampusFormat: false,
      parsed: null,
      rawHeaders,
      rawRows: rawRows.length > 0 ? rawRows : [{ 'Teks Terbaca': ret.data.text, _confidence: Math.round(ret.data.confidence || 60) }],
      fileType: ext,
      warnings: ['File diproses menggunakan OCR gambar di browser. Pastikan memeriksa kembali data pada tabel pratinjau.'],
      detectedFormat: 'ocr',
    }
  }

  throw new Error(`Format file .${ext} belum didukung. Silakan gunakan .xlsx, .xls, .csv, .docx, .pdf, atau gambar (.png/.jpg).`)
}

export function applyColumnMapping(rawRows = [], mapping = {}, prodiDefault = 'Informatika', semesterDefault = 2) {
  return rawRows.map((row, index) => {
    const hariRaw = mapping.hari ? row[mapping.hari] : row['Hari'] || row['hari'] || ''
    const hari = normalizeDay(hariRaw) || 'Senin'
    let jamMulai = ''
    let jamSelesai = ''
    if (mapping.jamRange && row[mapping.jamRange]) {
      const normalized = normalizeTimeRange(row[mapping.jamRange])
      jamMulai = normalized.jamMulai
      jamSelesai = normalized.jamSelesai
    } else {
      jamMulai = mapping.jamMulai ? String(row[mapping.jamMulai] || '').trim() : ''
      jamSelesai = mapping.jamSelesai ? String(row[mapping.jamSelesai] || '').trim() : ''
      if (jamMulai && jamMulai.includes('.')) jamMulai = jamMulai.replace('.', ':')
      if (jamSelesai && jamSelesai.includes('.')) jamSelesai = jamSelesai.replace('.', ':')
    }
    const kodeMK = mapping.kodeMK && row[mapping.kodeMK] ? String(row[mapping.kodeMK]).trim().toUpperCase() : `MK${index + 1}`
    const namaMK = mapping.namaMK && row[mapping.namaMK] ? String(row[mapping.namaMK]).trim() : `Mata Kuliah ${index + 1}`
    const dosen = mapping.dosen && row[mapping.dosen] ? String(row[mapping.dosen]).trim() : ''
    const ruang = mapping.ruang && row[mapping.ruang] ? String(row[mapping.ruang]).trim() : 'Ruang Kelas'
    const tipeKelas = mapping.tipeKelas && row[mapping.tipeKelas] ? normalizeClassType(row[mapping.tipeKelas]) : 'K1'
    const prodi = mapping.prodi && row[mapping.prodi] ? String(row[mapping.prodi]).trim() : prodiDefault
    const semester = mapping.semester && row[mapping.semester] ? Number(row[mapping.semester]) || semesterDefault : semesterDefault
    const confidence = typeof row._confidence === 'number' ? row._confidence : 95
    return {
      id: `session_${Date.now()}_${index}`,
      hari,
      jamMulai: jamMulai || '08:00',
      jamSelesai: jamSelesai || '09:40',
      kodeMK,
      namaMK,
      dosen,
      ruang,
      tipeKelas,
      prodi,
      semester,
      status: 'published',
      confidence,
    }
  }).filter((item) => Boolean(item.hari && (item.namaMK || item.kodeMK)))
}
