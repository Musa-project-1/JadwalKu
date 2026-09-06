const MONTH_ALIASES = {
  jan: '01',
  januari: '01',
  feb: '02',
  februari: '02',
  mar: '03',
  maret: '03',
  apr: '04',
  april: '04',
  mei: '05',
  may: '05',
  jun: '06',
  juni: '06',
  jul: '07',
  juli: '07',
  agu: '08',
  agustus: '08',
  aug: '08',
  sep: '09',
  sept: '09',
  september: '09',
  okt: '10',
  oktober: '10',
  oct: '10',
  nov: '11',
  november: '11',
  des: '12',
  desember: '12',
  dec: '12',
}

export function getMonthNumber(monthStr) {
  const m = String(monthStr).toLowerCase().trim()
  return MONTH_ALIASES[m] || null
}

export function pad2(n) {
  return String(n).padStart(2, '0')
}

export function buildISO(day, monthName, year) {
  const month = getMonthNumber(monthName)
  if (!month) return null
  const d = parseInt(day, 10)
  const y = parseInt(year, 10)
  if (!d || !y || d < 1 || d > 31) return null
  return `${y}-${month}-${pad2(d)}`
}

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

export function formatEventDateRange(event) {
  const start = event?.tanggalMulai || ''
  const end = event?.tanggalSelesai || start
  return start === end ? start : `${start} s.d ${end}`
}
