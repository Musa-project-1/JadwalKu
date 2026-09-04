import { getProdiByCodePrefix, getProdiPrefix } from './campusConfig.js'

export const EMPTY_COURSE_FORM = {
  kodeMK: '',
  namaMK: '',
  dosen: '',
  kontakDosen: '',
  sks: 2,
  durasi: 100,
  semester: 1,
}

export const BASE_SEMESTER_GROUPS = [
  { label: 'Semua Semester', value: '' },
  { label: 'Semester Ganjil', value: 'ganjil' },
  { label: 'Semester Genap', value: 'genap' },
]

/** Helper: Dapatkan nomor semester dari field atau auto-ekstrak dari digit pertama kode MK (support >8: 9,10,12,14) */
export function getCourseSemester(course) {
  if (course?.semester != null && !isNaN(Number(course.semester)) && Number(course.semester) > 0) {
    return Number(course.semester)
  }
  // extract angka semester dari kodeMK: ambil angka terakhir/terpanjang (mis BD6405 -> 4? tapi fallback angka >0)
  // prioritas: digit 1-2 angka setelah prefix huruf
  const m = String(course?.kodeMK || '').match(/\d+/)
  if (m) {
    // ambil digit pertama sebagai semester legacy, tapi kalau angka 9-14 tetap valid
    const d = Number(m[0][0])
    if (d >= 1) return d
  }
  return null
}

/** Terapkan seluruh filter mata kuliah dalam satu pass. */
export function filterCourses(courses, filters, campus, schedules = []) {
  const { search, dosenFilter, prodiFilter, semesterFilter, sksFilter, taFilter } = filters
  const q = search.trim().toLowerCase()

  // Bangun set kodeMK yang diajarkan untuk prodiFilter dari jadwal riil jika ada
  const scheduleCodesForProdi = new Set()
  if (prodiFilter && Array.isArray(schedules) && schedules.length > 0) {
    const cleanPf = String(prodiFilter).trim().toLowerCase()
    for (const s of schedules) {
      if (s.prodi && String(s.prodi).trim().toLowerCase() === cleanPf && s.kodeMK) {
        scheduleCodesForProdi.add(String(s.kodeMK).trim().toUpperCase())
      }
    }
  }

  return courses
    .filter((c) => (dosenFilter ? c.dosen === dosenFilter : true))
    .filter((c) => {
      if (!prodiFilter) return true
      const cKode = String(c.kodeMK || '').trim().toUpperCase()

      // 1. Jika kodeMK ini ada di jadwal untuk prodi ini -> PASTI cocok!
      if (scheduleCodesForProdi.has(cKode)) {
        return true
      }

      // 2. Jika dokumen course punya field prodi eksplisit, gunakan langsung
      if (c.prodi && String(c.prodi).trim()) {
        return String(c.prodi).trim().toLowerCase() === String(prodiFilter).trim().toLowerCase()
      }

      // 3. Deteksi prodi dari prefix kode MK via config kampus (derive fallback).
      const prefix = getProdiPrefix(prodiFilter, campus)
      if (prefix && cKode.startsWith(prefix)) {
        return true
      }

      // 4. Bandingkan prodi yang terdeteksi dari kode MK (config kampus).
      const detected = getProdiByCodePrefix(cKode, campus)
      if (detected && detected.toLowerCase() === String(prodiFilter).toLowerCase()) {
        return true
      }

      // 5. Fallback cerdas: cek jika nama prodi atau kode mengandung kecocokan
      const cleanFilter = String(prodiFilter).toLowerCase()
      if (cleanFilter.includes('informatika') && (cKode.startsWith('IF') || cKode.startsWith('TIF') || cKode.startsWith('INF'))) {
        return true
      }
      if (cleanFilter.includes('arsitektur') && (cKode.startsWith('ARS') || cKode.startsWith('AR'))) {
        return true
      }
      if (cleanFilter.includes('sipil') && (cKode.startsWith('TS') || cKode.startsWith('SIP'))) {
        return true
      }
      if (cleanFilter.includes('digital') && (cKode.startsWith('BD') || cKode.startsWith('MB'))) {
        return true
      }
      if (cleanFilter.includes('wirausaha') && (cKode.startsWith('KW') || cKode.startsWith('PKK'))) {
        return true
      }

      return false
    })
    .filter((c) => {
      if (!semesterFilter) return true
      const sem = getCourseSemester(c)
      if (!sem) return false
      if (semesterFilter === 'ganjil') return sem % 2 === 1
      if (semesterFilter === 'genap') return sem % 2 === 0
      return sem === Number(semesterFilter)
    })
    .filter((c) => {
      if (sksFilter === '' || sksFilter == null) return true
      return (Number(c.sks) || 0) === Number(sksFilter)
    })
    .filter((c) => (taFilter ? String(c.tahunAjaran || '').trim() === String(taFilter) : true))
    .filter((c) =>
      q
        ? [c.kodeMK, c.namaMK, c.dosen, c.kontakDosen].some((v) =>
            String(v).toLowerCase().includes(q),
          )
        : true,
    )
    .sort((a, b) => String(a.kodeMK).localeCompare(String(b.kodeMK)))
}
