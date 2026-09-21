/** Lightweight calendar bounds derivation – no heavy deps (xlsx/pdf/tesseract) */

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

  // Turunkan Tahun Ajaran dan Semester Aktif
  let minYear = null
  let maxYear = null
  events.forEach((e) => {
    const d = toDate(e.tanggalMulai || e.startDate)
    if (d) {
      const yr = d.getFullYear()
      if (!minYear || yr < minYear) minYear = yr
      if (!maxYear || yr > maxYear) maxYear = yr
    }
  })

  if (minYear) {
    result.tahunAjaran = maxYear && maxYear > minYear ? `${minYear}/${maxYear}` : `${minYear}/${minYear + 1}`
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
