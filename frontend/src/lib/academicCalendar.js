import { getTermLabel } from './tahunAjaran'

/**
 * Compute Minggu Efektif Kuliah (MEK) stats for the active term.
 *
 * startDate / endDate derive from the active semester's calendar bounds. Holiday
 * date-only strings are parsed as LOCAL dates so they compare on the same calendar
 * day as startDate/endDate — `new Date('YYYY-MM-DD')` is parsed as UTC, which shifts
 * it forward in time and can drop a holiday that falls exactly on endDate out of the
 * inclusive range.
 */
export function computeMekStats({ customCal, currentComputedTerm, holidays }) {
  const isGanjil = currentComputedTerm === 'ganjil'
  const startM = isGanjil ? customCal.ganjilStartMonth : customCal.genapStartMonth
  const startD = isGanjil ? customCal.ganjilStartDay : customCal.genapStartDay
  const endM = isGanjil ? customCal.ganjilEndMonth : customCal.genapEndMonth
  const endD = isGanjil ? customCal.ganjilEndDay : customCal.genapEndDay

  const curYear = new Date().getFullYear()
  const startDate = new Date(curYear, startM, startD)
  let endDate = new Date(curYear, endM, endD)
  if (endDate < startDate) {
    endDate = new Date(curYear + 1, endM, endD)
  }

  const totalDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)))
  const totalWeeks = Math.floor(totalDays / 7)

  const periodHolidays = holidays.filter((h) => {
    if (!h.mulai) return false
    const [hy, hm, hd] = h.mulai.split('-').map(Number)
    const hDate = new Date(hy, hm - 1, hd)
    return hDate >= startDate && hDate <= endDate
  })

  // Estimated teaching weeks (standard 14 weeks + 2 exam weeks)
  const effectiveWeeks = Math.max(12, Math.min(totalWeeks, 16))

  return {
    totalDays,
    totalWeeks,
    holidayCount: periodHolidays.length,
    effectiveWeeks,
    termLabel: getTermLabel(currentComputedTerm),
  }
}
