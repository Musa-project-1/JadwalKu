import { DAYS } from "../uploadValidator"
import { titleCase, toInt, pad } from "./xlsxHelpers"

const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 }

export const KELAS_FALLBACK = {
  K1: "K1",
  K2: "K2",
  GBK1: "GBK1",
  GBK2: "GBK2",
  HBH: "HBH",
  HBD: "HBD",
  "2-A": "K1",
  "4-A": "K1",
  "2-B": "K2",
  "4-B": "K2",
  "4-E": "K2",
}

export function isUnivFtbLayout(grid) {
  const scan = Math.min(grid.length, 15)
  let hasNoHari = false
  let jamCount = 0
  for (let r = 0; r < scan; r += 1) {
    const row = grid[r] ?? []
    for (let c = 0; c < row.length; c += 1) {
      const v = String(row[c]).trim().toLowerCase()
      if (v === "hari") hasNoHari = true
      if (v === "jam") jamCount += 1
    }
  }
  return hasNoHari && jamCount >= 3
}

export function romanToNumber(text) {
  const m = String(text).match(/semester\s+([IVXivx]+)/i)
  if (!m) return null
  return ROMAN[m[1].toUpperCase()] ?? null
}

export function parseUnivSheet(grid) {
  const warnings = []
  let headerRow = -1
  for (let r = 0; r < Math.min(grid.length, 15); r += 1) {
    const row = grid[r] ?? []
    if (row.some((cell) => String(cell).trim().toLowerCase() === "hari")) {
      headerRow = r
      break
    }
  }
  if (headerRow === -1) {
    warnings.push("Baris header jadwal (kolom Hari) tidak ditemukan")
    return { scheduleEntries: [], courses: [], warnings }
  }

  let tahunAjaran = null
  for (let r = 0; r < headerRow; r += 1) {
    for (const cell of grid[r] ?? []) {
      const text = String(cell).trim()
      const m = text.match(/(?:t\.?a\.?|tahun\s+ajaran|semester\s+genap|semester\s+ganjil)[\s:]*(\d{4}\s*[/-]\s*\d{4})/i)
      if (m) {
        tahunAjaran = m[1].replace(/\s+/g, "").replace("-", "/")
        break
      }
    }
    if (tahunAjaran) break
  }

  const hRow = grid[headerRow] ?? []
  const norm = (s) => String(s).toLowerCase().replace(/\W+/g, " ").trim()
  const findCol = (predicate, after = -1) => {
    for (let c = after + 1; c < hRow.length; c += 1) {
      if (predicate(norm(hRow[c]))) return c
    }
    return -1
  }

  const hariCol = findCol((t) => t === "hari")
  const cKodeProdi = findCol((t) => t.includes("kode prodi"))
  const cProdiName = findCol((t) => t.includes("program studi"), Math.max(cKodeProdi, 0))
  const cKodeMK = findCol((t) => t.includes("kode") && t.includes("mk"), Math.max(cProdiName, 0))
  const cNamaMK = findCol((t) => t.includes("nama mata kuliah"), Math.max(cKodeMK, 0))
  const cNamaDosen = findCol((t) => t.includes("nama dosen"), Math.max(cNamaMK, 0))
  const cKontak = findCol((t) => t.includes("kontak"), Math.max(cNamaDosen, 0))
  const cSks = findCol((t) => t === "sks", Math.max(cKontak, 0))
  const cDurasi = findCol((t) => t.includes("durasi"), Math.max(cSks, 0))

  let jamRow = -1
  let groupStarts = []
  for (let r = headerRow + 1; r < Math.min(grid.length, headerRow + 8); r += 1) {
    const row = grid[r] ?? []
    const jams = []
    for (let c = 0; c < row.length; c += 1) {
      if (String(row[c]).trim().toLowerCase() === "jam") jams.push(c)
    }
    if (jams.length >= 3) {
      jamRow = r
      groupStarts = jams
      break
    }
  }

  const groups = []
  if (jamRow !== -1) {
    const jamRowCells = grid[jamRow] ?? []
    const rowAbove = grid[jamRow - 1] ?? []
    groupStarts.forEach((jamCol, i) => {
      const mkCol = jamCol + 1
      let prodi =
        String(jamRowCells[mkCol] ?? "").trim() ||
        String(rowAbove[mkCol] ?? "").trim() ||
        `Prodi ${i + 1}`
      prodi = titleCase(prodi.split("\n")[0].trim())
      groups.push({ jamCol, mkCol, dpCol: mkCol + 1, kelasCol: mkCol + 2, prodi })
    })
  }
  if (groups.length === 0) {
    warnings.push("Grup kolom prodi tidak ditemukan")
    return { scheduleEntries: [], courses: [], warnings }
  }

  const kelasMap = { ...KELAS_FALLBACK }
  for (let r = headerRow + 1; r < Math.min(grid.length, headerRow + 15); r += 1) {
    const row = grid[r] ?? []
    for (let c = 0; c < row.length; c += 1) {
      const key = String(row[c] ?? "").trim()
      if (!key.includes("/") || key.length > 30) continue
      const desc = String(row[c + 2] ?? "").trim()
      if (!desc) continue
      const lower = desc.toLowerCase()
      let tipe = null
      if (lower.includes("gabungan") && lower.includes("online")) tipe = "GBK2"
      else if (lower.includes("gabungan")) tipe = "GBK1"
      else if (lower.includes("hybrid") && lower.includes("halimah")) tipe = "HBH"
      else if (lower.includes("hybrid")) tipe = "HBD"
      else if (lower.includes("online")) tipe = "K2"
      else if (lower.includes("reguler") || lower.includes("offline")) tipe = "K1"
      if (!tipe) continue
      key.split("/").forEach((k) => {
        kelasMap[k.trim().toUpperCase()] = tipe
      })
    }
  }

  const courses = []
  const semesterByCourse = {}
  if (cKodeMK !== -1 && cNamaMK !== -1) {
    let currentProdi = ""
    let currentSemester = null
    let lastCourseIdx = -1
    const kodeRe = /^[A-Z]{2,4}\s?\d{3}$/
    for (let r = headerRow + 1; r < grid.length; r += 1) {
      const row = grid[r] ?? []
      const kodeVal = String(row[cKodeMK] ?? "").trim()
      const semVal = romanToNumber(kodeVal)
      if (semVal) {
        currentSemester = semVal
        continue
      }
      const prodiVal =
        (cProdiName !== -1 ? String(row[cProdiName] ?? "").trim() : "") ||
        (cKodeProdi !== -1 ? String(row[cKodeProdi] ?? "").trim() : "")
      if (prodiVal && !kodeRe.test(prodiVal.toUpperCase())) {
        currentProdi = titleCase(prodiVal)
      }
      const kode = kodeVal.toUpperCase().replace(/\s+/g, "")
      const nama = cNamaMK !== -1 ? String(row[cNamaMK] ?? "").trim() : ""
      const dosenName = cNamaDosen !== -1 ? String(row[cNamaDosen] ?? "").trim() : ""

      if (!kodeRe.test(kode) && !nama && dosenName && lastCourseIdx !== -1) {
        courses[lastCourseIdx].dosen += ` & ${dosenName}`
        continue
      }

      if (!kodeRe.test(kode) || !nama) continue
      const course = {
        kodeMK: kode,
        namaMK: nama,
        dosen: dosenName,
        kontakDosen: cKontak !== -1 ? String(row[cKontak] ?? "").trim() : "",
        sks: cSks !== -1 ? toInt(row[cSks]) : NaN,
        durasi: cDurasi !== -1 ? toInt(row[cDurasi]) : NaN,
        prodi: currentProdi,
        semester: currentSemester ?? NaN,
      }
      courses.push(course)
      lastCourseIdx = courses.length - 1
      if (currentSemester) semesterByCourse[kode] = currentSemester
    }
  }

  const scheduleEntries = []
  let currentHari = ""
  const dataStartRow = (jamRow !== -1 ? jamRow : headerRow) + 1
  const timeRegex = /(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/

  for (let r = dataStartRow; r < grid.length; r += 1) {
    const row = grid[r] ?? []
    if (hariCol !== -1) {
      const hVal = String(row[hariCol] ?? "").trim()
      if (hVal && DAYS.includes(titleCase(hVal))) {
        currentHari = titleCase(hVal)
      }
    }
    if (!currentHari) continue

    for (const grp of groups) {
      const jamVal = String(row[grp.jamCol] ?? "").trim()
      const tm = jamVal.match(timeRegex)
      if (!tm) continue

      const jamMulai = `${pad(tm[1])}:${tm[2]}`
      const jamSelesai = `${pad(tm[3])}:${tm[4]}`
      const mkRaw = String(row[grp.mkCol] ?? "").trim()
      if (!mkRaw) continue

      const kodeMatch = mkRaw.match(/^([A-Z]{2,4}\s?\d{3})/i)
      const kodeMK = kodeMatch ? kodeMatch[1].toUpperCase().replace(/\s+/g, "") : mkRaw.toUpperCase()
      const kelasRaw = String(row[grp.kelasCol] ?? "").trim().toUpperCase()
      const tipeKelas = kelasMap[kelasRaw] ?? kelasRaw

      let ruang = ""
      const rMatch = mkRaw.match(/\b(R\.\s*\d+|Lab[\w\s]+)\b/i)
      if (rMatch) ruang = rMatch[1].trim()

      scheduleEntries.push({
        hari: currentHari,
        jamMulai,
        jamSelesai,
        prodi: grp.prodi,
        semester: semesterByCourse[kodeMK] ?? NaN,
        kodeMK,
        ruang,
        tipeKelas,
      })
    }
  }

  return { scheduleEntries, courses, tahunAjaran, warnings }
}
