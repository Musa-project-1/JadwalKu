import { DAYS, CLASS_TYPE_CODES } from "../uploadValidator"

export const SHEET_ALIASES = {
  schedule: ["jadwal perkuliahan", "jadwal", "schedule"],
  courses: ["daftar mata kuliah", "mata kuliah", "mk", "dosen pengampu", "courses"],
  exams: ["jadwal ujian", "ujian", "exams"],
}

export const COURSE_ALIASES = {
  kodeMK: ["kode mk", "kode", "kode mata kuliah", "kode_mk", "code", "course code", "kd mk"],
  namaMK: ["nama mk", "nama mata kuliah", "mata kuliah", "nama", "name", "course name"],
  dosen: ["dosen pengampu", "dosen", "pengampu", "lecturer", "nama dosen"],
  kontakDosen: ["kontak dosen", "kontak", "no hp", "hp/wa", "telepon", "whatsapp", "contact"],
  sks: ["sks", "bobot", "credit", "credits", "sks*"],
  durasi: ["durasi (menit)", "durasi", "menit", "duration", "jam pelajaran"],
}

export const SCHEDULE_FIELD_ALIASES = {
  hari: ["hari", "day", "days"],
  jamMulai: ["jam mulai", "mulai", "start", "start time", "waktu mulai", "jam"],
  jamRange: ["jam", "waktu", "time", "sesi", "pukul", "jam pelajaran"],
  jamSelesai: ["jam selesai", "selesai", "end", "end time", "waktu selesai", "sampai"],
  prodi: ["prodi", "program studi", "program", "study program", "jurusan"],
  semester: ["semester", "sem", "smt"],
  kodeMK: ["kode mk", "kode", "kode mata kuliah", "code"],
  ruang: ["ruang", "room", "ruangan", "lokasi"],
  tipeKelas: ["tipe kelas", "kelas", "type", "class type", "mode", "jenis kelas"],
}

export const EXAM_ALIASES = {
  ...SCHEDULE_FIELD_ALIASES,
  jenis: ["jenis", "uts/uas", "tipe ujian", "type", "exam type"],
  tanggal: ["tanggal", "date", "tgl"],
  jam: ["jam", "waktu", "time", "pukul"],
  mode: ["mode", "metode", "online/offline"],
}

export function findSheet(wb, names) {
  const name = wb.SheetNames.find((n) =>
    names.some((alias) => n.toLowerCase().includes(alias)),
  )
  return name ? wb.Sheets[name] : null
}

export function sheetToRows(sheet, XLSX) {
  if (!XLSX) throw new Error("XLSX belum dimuat – panggil parseWorkbook terlebih dahulu")
  return XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true })
}

export function colFor(headers, aliases) {
  return headers.find((h) => matches(normalizeHeader(h), aliases)) ?? null
}

export function readCell(row, column) {
  if (!column) return ""
  return row[column]
}

export function readTimeRange(row, map) {
  const directStart = normalizeClock(readCell(row, map.jamMulai))
  const directEnd = normalizeClock(readCell(row, map.jamSelesai))
  if (directStart && directEnd) return { jamMulai: directStart, jamSelesai: directEnd }

  for (const value of Object.values(row)) {
    const m = String(value).match(/(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/)
    if (m) return { jamMulai: `${pad(m[1])}:${m[2]}`, jamSelesai: `${pad(m[3])}:${m[4]}` }
  }
  return { jamMulai: directStart, jamSelesai: directEnd }
}

export function normalizeClock(value) {
  if (value == null || value === "") return ""
  if (typeof value === "number") return excelFractionToHHMM(value)
  const m = String(value).match(/^(\d{1,2})[.:](\d{2})$/)
  return m ? `${pad(m[1])}:${m[2]}` : ""
}

export function excelFractionToHHMM(fraction) {
  const totalMinutes = Math.round(Number(fraction) % 1 * 24 * 60)
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`
}

export function normalizeDate(value) {
  if (value == null || value === "") return ""
  const str = String(value).trim()
  const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) return `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`
  const slash = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (slash) return `${slash[3]}-${pad(slash[2])}-${pad(slash[1])}`
  const serial = Number(str)
  if (Number.isFinite(serial) && serial > 20000 && serial < 60000) {
    const ms = (serial - 25569) * 86400000
    return new Date(ms).toISOString().slice(0, 10)
  }
  return str
}

export function normalizeTimeOfDay(value) {
  if (typeof value === "number") return excelFractionToHHMM(value)
  const m = String(value).match(/(\d{1,2})[.:](\d{2})/)
  return m ? `${pad(m[1])}:${m[2]}` : String(value).trim()
}

export function normalizeClassType(value) {
  const upper = String(value).toUpperCase().trim()
  if (/^\d+-A$/i.test(upper) || upper.endsWith("-A")) return "K1"
  if (/^\d+-[BE]$/i.test(upper) || upper.endsWith("-B") || upper.endsWith("-E")) return "K2"

  const sorted = [...CLASS_TYPE_CODES].sort((a, b) => b.length - a.length)
  return sorted.find((c) => upper.includes(c)) ?? upper
}

export function splitProdiSemester(headerText) {
  const clean = String(headerText).replace(/\n/g, " ").trim()
  const semMatch = clean.match(/(?:sem(?:ester)?)\s*(\d{1,2})/i)
  const semester = semMatch ? Number(semMatch[1]) : NaN
  let prodi = clean
    .replace(/(?:sem(?:ester)?)\s*\d{1,2}\s*/i, "")
    .replace(/[/-]\s*$/, "")
    .trim()
  if (!prodi || prodi.length < 3) prodi = clean
  return { prodi: titleCase(prodi), semester }
}

export function matches(normalized, aliases) {
  return aliases.some((a) => normalized.includes(a))
}

export function normalizeHeader(header) {
  return String(header).toLowerCase().replace(/\W+/g, " ").trim()
}

export function normalizeDayName(value) {
  if (!value) return ""
  const clean = String(value).trim().toLowerCase().replace(/[^a-z]/g, "")
  const day = DAYS.find((d) => d.toLowerCase() === clean)
  return day || ""
}

export function isBlank(value) {
  return value == null || String(value).trim() === ""
}

export function titleCase(str) {
  const s = String(str).trim()
  if (!s) return ""
  if (/^[A-Z][a-z]+( [A-Z][a-z]+)*$/.test(s)) return s
  const lower = s.charAt(0).toLowerCase() + s.slice(1).toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export function toInt(value) {
  if (value == null || value === "") return NaN
  const n = parseInt(String(value).replace(/[^\d]/g, ""), 10)
  return Number.isFinite(n) ? n : NaN
}

export function pad(n) {
  return String(n).padStart(2, "0")
}

export function firstProdiName(campusConfig = {}) {
  const prodi = campusConfig?.prodi || []
  if (!prodi.length) return ""
  return typeof prodi[0] === "string" ? prodi[0] : prodi[0]?.nama || ""
}

export function extractPrograms(scheduleEntries = [], courses = [], exams = []) {
  const prodiMap = new Map()
  const register = (prodiRaw, semRaw) => {
    if (!prodiRaw) return
    const name = String(prodiRaw).split("\n")[0].trim()
    if (!name) return
    if (!prodiMap.has(name)) {
      prodiMap.set(name, { nama: name, semesters: new Set() })
    }
    const sem = Number(semRaw)
    if (sem && !Number.isNaN(sem)) {
      prodiMap.get(name).semesters.add(sem)
    }
  }

  scheduleEntries.forEach((e) => register(e.prodi, e.semester))
  exams.forEach((e) => register(e.prodi, e.semester))
  courses.forEach((c) => register(c.prodi, c.semester))

  return Array.from(prodiMap.values())
    .map((p) => {
      const sems = Array.from(p.semesters).sort((a, b) => a - b)
      return {
        nama: p.nama,
        semesterMin: sems.length > 0 ? Math.min(...sems) : 1,
        semesterMax: sems.length > 0 ? Math.max(sems[sems.length - 1], 8) : 8,
      }
    })
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"))
}
