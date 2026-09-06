import { DAYS } from './uploadValidator'
import { CLASS_TYPE_CODES } from './classTypes'

const DAY_ALIASES = {
  senin: 'Senin',
  monday: 'Senin',
  selasa: 'Selasa',
  tuesday: 'Selasa',
  rabu: 'Rabu',
  wednesday: 'Rabu',
  kamis: 'Kamis',
  thursday: 'Kamis',
  jumat: 'Jumat',
  "jum'at": 'Jumat',
  friday: 'Jumat',
  sabtu: 'Sabtu',
  saturday: 'Sabtu',
}

function normalizeDay(raw) {
  if (raw == null) return ''
  const str = String(raw).trim()
  if (!str) return ''
  if (DAYS.includes(str)) return str
  const lower = str.toLowerCase().replace(/['.]/g, '').trim()
  for (const day of DAYS) {
    if (day.toLowerCase() === lower) return day
  }
  if (DAY_ALIASES[lower]) return DAY_ALIASES[lower]
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1)
  return DAYS.includes(capitalized) ? capitalized : str
}

function normalizeTime(raw) {
  if (raw == null) return ''
  const str = String(raw).trim()
  if (!str) return ''
  const m = str.match(/(\d{1,2})[:.](\d{2})/)
  if (m) {
    const hh = String(Math.min(23, Number(m[1]))).padStart(2, '0')
    return `${hh}:${m[2]}`
  }
  const bare = str.match(/^(\d{1,2})$/)
  if (bare) return `${bare[1].padStart(2, '0')}:00`
  return str
}

function splitTimeRange(raw) {
  const str = String(raw ?? '').trim()
  if (!str) return ['', '']
  const parts = str.split(/\s*[-\u2013\u2014]\s*|\s+s\.d\.?\s+|\s+sd\s+/i)
  if (parts.length >= 2) return [normalizeTime(parts[0]), normalizeTime(parts[1])]
  return [normalizeTime(str), '']
}

const CLASS_TYPE_ALIASES = {
  k1: 'K1',
  reguler: 'K1',
  offline: 'K1',
  k2: 'K2',
  online: 'K2',
  daring: 'K2',
  hb: 'HB',
  hybrid: 'HB',
  hbh: 'HBH',
  hbd: 'HBD',
  gbk1: 'GBK1',
  gbk2: 'GBK2',
  gbk: 'GBK1',
}

function normalizeClassType(raw) {
  if (raw == null) return 'K1'
  const str = String(raw).trim()
  if (!str) return 'K1'
  const upper = str.toUpperCase()
  if (CLASS_TYPE_CODES.includes(upper)) return upper
  const lower = str.toLowerCase()
  if (CLASS_TYPE_ALIASES[lower]) return CLASS_TYPE_ALIASES[lower]
  return 'K1'
}

function normalizeSemester(raw, fallback) {
  if (raw == null || String(raw).trim() === '') return fallback ?? 0
  const num = Number(String(raw).replace(/[^\d]/g, ''))
  if (!Number.isFinite(num) || num <= 0) return fallback ?? 0
  return num
}

function getCell(row, columnMapping, fieldKey) {
  const colIndex = columnMapping?.[fieldKey]
  if (colIndex == null || colIndex === '' || colIndex < 0) return ''
  if (Array.isArray(row)) return row[colIndex] ?? ''
  return row[colIndex] ?? ''
}

export function normalizeParsedEntries(rawRows, columnMapping, defaults = {}) {
  const { prodiDefault = '', semesterDefault = 0, tahunAjaran = '' } = defaults
  const rows = Array.isArray(rawRows) ? rawRows : []
  const entries = []

  rows.forEach((row, index) => {
    const hari = normalizeDay(getCell(row, columnMapping, 'hari'))
    let jamMulai = normalizeTime(getCell(row, columnMapping, 'jamMulai'))
    let jamSelesai = normalizeTime(getCell(row, columnMapping, 'jamSelesai'))

    if (!jamMulai || !jamSelesai) {
      const rangeRaw = getCell(row, columnMapping, 'jamRange')
      if (rangeRaw) {
        const [start, end] = splitTimeRange(rangeRaw)
        if (!jamMulai) jamMulai = start
        if (!jamSelesai) jamSelesai = end
      }
    }

    const namaMK = String(getCell(row, columnMapping, 'namaMK') ?? '').trim()
    let kodeMK = String(getCell(row, columnMapping, 'kodeMK') ?? '').trim()
    if (!kodeMK && namaMK) kodeMK = namaMK

    const dosen = String(getCell(row, columnMapping, 'dosen') ?? '').trim()
    const ruang = String(getCell(row, columnMapping, 'ruang') ?? '').trim()
    const tipeKelas = normalizeClassType(getCell(row, columnMapping, 'tipeKelas'))
    const prodi = String(getCell(row, columnMapping, 'prodi') ?? '').trim() || prodiDefault
    const semester = normalizeSemester(getCell(row, columnMapping, 'semester'), semesterDefault)

    // Skip rows that carry no schedule signal at all
    if (!hari && !jamMulai && !namaMK && !kodeMK) return

    entries.push({
      id: `import_${index}_${kodeMK || 'row'}`,
      hari,
      jamMulai,
      jamSelesai,
      kodeMK,
      namaMK,
      dosen,
      ruang,
      tipeKelas,
      prodi,
      semester,
      tahunAjaran,
      status: 'draft',
    })
  })

  return entries
}
