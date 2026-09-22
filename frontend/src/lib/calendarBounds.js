/** Lightweight calendar bounds derivation – no heavy deps (xlsx/pdf/tesseract) */

// Batas paruh tahun pembuka Tahun Ajaran (getMonth 0-index: 7 = Agustus).
// Bulan >= ambang ini membuka TA tahun itu; bulan sebelumnya milik TA yang
// dibuka September tahun sebelumnya.
const TA_START_MONTH = 7

function toDate(iso) {
  if (!iso) return null
  const [y, m, d] = String(iso).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function deriveBoundsFromEvents(events = []) {
  if (!Array.isArray(events) || events.length === 0) return null

  const relevant = events.filter(
    (e) => (e.tanggalMulai || e.startDate) && (e.semester === 'ganjil' || e.semester === 'genap'),
  )
  if (relevant.length === 0) return null

  const ganjilEvents = relevant.filter((e) => e.semester === 'ganjil')
  const genapEvents = relevant.filter((e) => e.semester === 'genap')

  const getRange = (evts) => {
    if (evts.length === 0) return null
    let min = null
    let max = null
    evts.forEach((e) => {
      const start = toDate(e.tanggalMulai || e.startDate)
      const end = toDate(e.tanggalSelesai || e.endDate) || start
      if (!start || !end) return
      if (!min || start < min) min = start
      if (!max || end > max) max = end
    })
    return min && max ? { start: min, end: max } : null
  }

  const ganjilRange = getRange(ganjilEvents)
  const genapRange = getRange(genapEvents)

  const result = {}
  if (ganjilRange) {
    result.ganjilStart = { month: ganjilRange.start.getMonth(), day: ganjilRange.start.getDate() }
    result.ganjilEnd = { month: ganjilRange.end.getMonth(), day: ganjilRange.end.getDate() }
  }
  if (genapRange) {
    result.genapStart = { month: genapRange.start.getMonth(), day: genapRange.start.getDate() }
    result.genapEnd = { month: genapRange.end.getMonth(), day: genapRange.end.getDate() }
  }

  // Turunkan Tahun Ajaran dari anchor semester, BUKAN rentang tahun mentah.
  // TA X/(X+1): ganjil dibuka ~Sep tahun X; genap berjalan ~Mar–Jul tahun X+1 (tetap TA X/(X+1)).
  // Paruh kedua tahun (Agu–Des) membuka TA tahun itu; paruh pertama (Jan–Jul)
  // adalah milik TA yang dibuka September tahun sebelumnya.
  // (min/max mentah salah untuk impor genap-saja: Feb–Jul 2027 -> keliru jadi 2027/2028.)
  const anchorTaStartYear = (date) =>
    date.getMonth() >= TA_START_MONTH ? date.getFullYear() : date.getFullYear() - 1

  const taAnchor = ganjilRange?.start || genapRange?.start
  if (taAnchor) {
    const startYear = anchorTaStartYear(taAnchor)
    result.tahunAjaran = `${startYear}/${startYear + 1}`
  }

  const now = new Date()
  if (ganjilRange && now >= ganjilRange.start && now <= ganjilRange.end) {
    result.activeSemester = 'Ganjil'
  } else if (genapRange && now >= genapRange.start && now <= genapRange.end) {
    result.activeSemester = 'Genap'
  } else if (ganjilRange) {
    result.activeSemester = 'Ganjil'
  } else if (genapRange) {
    result.activeSemester = 'Genap'
  }

  return Object.keys(result).length > 0 ? result : null
}
