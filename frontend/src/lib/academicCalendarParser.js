/**
 * Parser & utilitas Kalender Akademik (Kaldik).
 * Re-exports modularized utilities for backward compatibility.
 */
export {
  normalizeDate,
  extractKaldikDateRange,
  formatEventDateRange,
  getMonthNumber,
  pad2,
  buildISO,
} from './kaldik/kaldikDateUtils.js'

export {
  KATEGORI_VALUES,
  normalizeCategory,
  detectSemester,
  semesterLabel,
  kategoriLabel,
} from './kaldik/kaldikCategories.js'

export {
  parseKaldikLines,
  parseCalendarRows,
  normalizeJsonPreset,
  parseAcademicCalendarFile,
} from './kaldik/kaldikFileExtractors.js'

export { deriveBoundsFromEvents } from './calendarBounds.js'
