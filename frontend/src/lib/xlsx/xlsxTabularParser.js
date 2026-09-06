import { DAYS, CLASS_TYPE_CODES } from "../uploadValidator"
import {
  COURSE_ALIASES,
  EXAM_ALIASES,
  SCHEDULE_FIELD_ALIASES,
  colFor,
  readCell,
  readTimeRange,
  normalizeDate,
  normalizeTimeOfDay,
  normalizeClassType,
  splitProdiSemester,
  matches,
  normalizeHeader,
  normalizeDayName,
  isBlank,
  titleCase,
  toInt,
  pad,
  firstProdiName,
} from "./xlsxHelpers"

export function flatOrMatrix(rows, campusConfig = {}) {
  if (!rows.length) return { scheduleEntries: [], detectedFormat: "empty" }
  const headers = Object.keys(rows[0]).map(normalizeHeader)

  const hasDayCol = headers.some((h) => matches(h, SCHEDULE_FIELD_ALIASES.hari))
  const hasTimeCol = headers.some(
    (h) => matches(h, SCHEDULE_FIELD_ALIASES.jamMulai) || matches(h, SCHEDULE_FIELD_ALIASES.jamRange),
  )

  if (hasDayCol && hasTimeCol) {
    return { scheduleEntries: parseFlat(rows, campusConfig), detectedFormat: "flat" }
  }

  if (!hasDayCol && !hasTimeCol && headers.length >= 3) {
    const matrix = parseMatrix(rows)
    if (matrix.length > 0) return { scheduleEntries: matrix, detectedFormat: "matrix" }
  }

  const twoCol = parseTwoColumn(rows, campusConfig)
  if (twoCol.length > 0) return { scheduleEntries: twoCol, detectedFormat: "two-column" }

  return { scheduleEntries: parseFlatFallback(rows, campusConfig), detectedFormat: "fallback" }
}

export function parseFlat(rows, campusConfig = {}) {
  if (!rows.length) return []
  const headers = Object.keys(rows[0])
  const map = {}
  for (const field of Object.keys(SCHEDULE_FIELD_ALIASES)) {
    map[field] = colFor(headers, SCHEDULE_FIELD_ALIASES[field])
  }

  const prodiDefault = firstProdiName(campusConfig) || "Informatika"

  return rows.flatMap((row) => {
    let { jamMulai, jamSelesai } = readTimeRange(row, map)
    const entry = {
      hari: titleCase(String(readCell(row, map.hari)).trim()),
      jamMulai,
      jamSelesai,
      prodi: String(readCell(row, map.prodi)).trim() || prodiDefault,
      semester: toInt(readCell(row, map.semester)),
      kodeMK: String(readCell(row, map.kodeMK)).trim().toUpperCase(),
      ruang: String(readCell(row, map.ruang)).trim(),
      tipeKelas: normalizeClassType(String(readCell(row, map.tipeKelas)).trim()),
    }
    if (!entry.hari || !entry.jamMulai || !entry.kodeMK) return []
    return [entry]
  })
}

export function parseMatrix(rows) {
  const entries = []
  let currentDay = ""

  for (const row of rows) {
    const values = Object.values(row)
    const first = String(values[0] ?? "").trim()

    if (first && DAYS.includes(titleCase(first)) && values.slice(1).every(isBlank)) {
      currentDay = titleCase(first)
      continue
    }

    const timeMatch = first.match(/(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/)
    if (!currentDay || !timeMatch) continue

    const jamMulai = `${pad(timeMatch[1])}:${timeMatch[2]}`
    const jamSelesai = `${pad(timeMatch[3])}:${timeMatch[4]}`
    const headers = Object.keys(row)

    for (let c = 1; c < Math.min(headers.length, values.length); c += 1) {
      const cellText = String(values[c] ?? "").trim()
      if (!cellText) continue

      const parsed = parseMatrixCell(cellText)
      if (!parsed.kodeMK) continue

      entries.push({
        hari: currentDay,
        jamMulai,
        jamSelesai,
        prodi: splitProdiSemester(headers[c]).prodi,
        semester: splitProdiSemester(headers[c]).semester,
        kodeMK: parsed.kodeMK,
        ruang: parsed.ruang,
        tipeKelas: parsed.tipeKelas,
      })
    }
  }
  return entries
}

export function parseTwoColumn(rows, campusConfig = {}) {
  const entries = []
  let currentDay = ""
  const prodiFromConfig = firstProdiName(campusConfig) || "Informatika"

  for (const row of rows) {
    const values = Object.values(row).map((v) => String(v ?? "").trim())
    const first = values[0] || ""
    const second = values[1] || ""

    const day = normalizeDayName(first)
    if (day) {
      currentDay = day
      continue
    }

    if (!currentDay) continue

    const timeMatch = second.match(/(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/)
    if (!timeMatch) continue

    const kodeMatch = second.match(/\b([A-Z]{2,4}[-\s]?\d{3,4})\b/i)
    const kodeMK = kodeMatch ? kodeMatch[1].toUpperCase().replace(/\s+/g, "") : `MK${entries.length + 1}`
    const namaMK = second.replace(timeMatch[0], "").replace(kodeMatch?.[0] || "", "").replace(/[|\-–]/g, "").trim()

    entries.push({
      hari: currentDay,
      jamMulai: `${pad(timeMatch[1])}:${timeMatch[2]}`,
      jamSelesai: `${pad(timeMatch[3])}:${timeMatch[4]}`,
      prodi: prodiFromConfig,
      semester: NaN,
      kodeMK,
      namaMK,
      ruang: "",
      tipeKelas: "",
    })
  }
  return entries
}

export function parseFlatFallback(rows, campusConfig = {}) {
  if (!rows.length) return []
  const headers = Object.keys(rows[0])
  const map = {}
  for (const field of Object.keys(SCHEDULE_FIELD_ALIASES)) {
    map[field] = colFor(headers, SCHEDULE_FIELD_ALIASES[field])
  }

  const prodiDefault = firstProdiName(campusConfig) || "Informatika"

  return rows.flatMap((row, index) => {
    const hariRaw = readCell(row, map.hari)
    const day = normalizeDayName(hariRaw)
    if (!day) return []

    const { jamMulai, jamSelesai } = readTimeRange(row, map)
    const kodeMK = String(readCell(row, map.kodeMK)).trim().toUpperCase() || `MK${index + 1}`

    return [{
      hari: day,
      jamMulai,
      jamSelesai,
      prodi: String(readCell(row, map.prodi)).trim() || prodiDefault,
      semester: toInt(readCell(row, map.semester)),
      kodeMK,
      ruang: String(readCell(row, map.ruang)).trim(),
      tipeKelas: normalizeClassType(String(readCell(row, map.tipeKelas)).trim()),
    }]
  })
}

export function parseMatrixCell(text) {
  const codeMatch = text.match(/\b([A-Z]{2,4}[-\s]?\d{3,4})\b/i)
  const kodeMK = codeMatch ? codeMatch[1].toUpperCase().replace(/\s+/g, "-") : ""
  const roomMatch = text.match(/\b((?:R\.?|Lab\.?|LAB)[\w\s.-]{1,12})\b/i)
  const tipe = CLASS_TYPE_CODES.find((c) => new RegExp(`\\b${c}\\b`, "i").test(text)) ?? ""
  return { kodeMK, ruang: roomMatch ? roomMatch[1].trim() : "", tipeKelas: tipe }
}

export function parseCourses(rows) {
  if (!rows.length) return []
  const headers = Object.keys(rows[0])
  const map = {}
  for (const field of Object.keys(COURSE_ALIASES)) {
    map[field] = headers.find((h) => matches(normalizeHeader(h), COURSE_ALIASES[field])) ?? null
  }

  return rows
    .map((row) => ({
      kodeMK: String(readCell(row, map.kodeMK)).trim().toUpperCase(),
      namaMK: String(readCell(row, map.namaMK)).trim(),
      dosen: String(readCell(row, map.dosen)).trim(),
      kontakDosen: String(readCell(row, map.kontakDosen)).trim(),
      sks: toInt(readCell(row, map.sks)),
      durasi: toInt(readCell(row, map.durasi)),
    }))
    .filter((c) => c.kodeMK && c.namaMK)
}

export function parseExams(rows) {
  if (!rows.length) return []
  const headers = Object.keys(rows[0])
  const map = {}
  for (const field of Object.keys(EXAM_ALIASES)) {
    map[field] = headers.find((h) => matches(normalizeHeader(h), EXAM_ALIASES[field])) ?? null
  }

  return rows
    .map((row) => ({
      prodi: String(readCell(row, map.prodi)).trim(),
      semester: toInt(readCell(row, map.semester)),
      jenis: /uas/i.test(String(readCell(row, map.jenis))) ? "UAS" : "UTS",
      kodeMK: String(readCell(row, map.kodeMK)).trim().toUpperCase(),
      tanggal: normalizeDate(readCell(row, map.tanggal)),
      jam: normalizeTimeOfDay(readCell(row, map.jam)),
      ruang: String(readCell(row, map.ruang)).trim(),
      mode: String(readCell(row, map.mode)).trim() || "Offline",
    }))
    .filter((e) => e.kodeMK && e.tanggal)
}
