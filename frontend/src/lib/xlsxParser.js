import {
  SHEET_ALIASES,
  findSheet,
  sheetToRows,
  extractPrograms,
} from "./xlsx/xlsxHelpers.js"
import {
  isUnivFtbLayout,
  parseUnivSheet,
} from "./xlsx/xlsxUnivFtbParser.js"
import {
  flatOrMatrix,
  parseCourses,
  parseExams,
} from "./xlsx/xlsxTabularParser.js"
import {
  isMultiProdiWorkbook,
  parseMultiProdiWorkbook,
} from "./xlsx/xlsxMultiProdiSheetParser.js"

let _XLSX = null
async function getXLSX() {
  if (!_XLSX) _XLSX = await import("xlsx")
  return _XLSX
}

export async function parseWorkbook(data, campusConfig = {}) {
  const XLSX = await getXLSX()
  const wb = XLSX.read(data, { type: "array", cellDates: false })
  const warnings = []

  // Prioritas 1: Multi-sheet per prodi (format matriks FTB baru)
  if (isMultiProdiWorkbook(wb, XLSX)) {
    const multi = parseMultiProdiWorkbook(wb, XLSX, campusConfig)
    return {
      scheduleEntries: multi.scheduleEntries,
      courses: multi.courses,
      exams: multi.exams,
      programs: extractPrograms(multi.scheduleEntries, multi.courses, multi.exams),
      tahunAjaran: multi.tahunAjaran,
      warnings: multi.warnings,
      detectedFormat: multi.detectedFormat,
    }
  }

  const scheduleSheet = findSheet(wb, SHEET_ALIASES.schedule)
  const courseSheet = findSheet(wb, SHEET_ALIASES.courses)
  const examSheet = findSheet(wb, SHEET_ALIASES.exams)

  if (!scheduleSheet) warnings.push("Sheet jadwal tidak ditemukan")

  let scheduleEntries = []
  let courses = []
  let exams = []
  let tahunAjaran = null
  let detectedFormat = "unknown"

  if (scheduleSheet) {
    const grid = XLSX.utils.sheet_to_json(scheduleSheet, { header: 1, defval: "" })

    if (isUnivFtbLayout(grid)) {
      const univ = parseUnivSheet(grid)
      scheduleEntries = univ.scheduleEntries
      courses = univ.courses
      tahunAjaran = univ.tahunAjaran
      detectedFormat = "univ-ftb"
      warnings.push(...univ.warnings)
    } else {
      const rows = sheetToRows(scheduleSheet, XLSX)
      const res = flatOrMatrix(rows, campusConfig)
      scheduleEntries = res.scheduleEntries
      detectedFormat = res.detectedFormat
    }
  }

  if (courseSheet && courses.length === 0) {
    courses = parseCourses(sheetToRows(courseSheet, XLSX))
  } else if (courseSheet) {
    courses = parseCourses(sheetToRows(courseSheet, XLSX))
  }

  if (examSheet) exams = parseExams(sheetToRows(examSheet, XLSX))

  const programs = extractPrograms(scheduleEntries, courses, exams)

  return { scheduleEntries, courses, exams, programs, tahunAjaran, warnings, detectedFormat }
}
