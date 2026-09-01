import { PRODIS } from '../constants/academicConstants'
import { getProdiByCodePrefix } from './campusConfig'

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
export function filterCourses(courses, filters, campus) {
  const { search, dosenFilter, prodiFilter, semesterFilter, sksFilter, taFilter } = filters
  const q = search.trim().toLowerCase()

  return courses
    .filter((c) => (dosenFilter ? c.dosen === dosenFilter : true))
    .filter((c) => {
      if (!prodiFilter) return true
      // Deteksi prodi dari prefix kode MK via config kampus (fallback PRODIS).
      const prefix = PRODIS.find((item) => item.value === prodiFilter)?.prefix
      if (prefix) {
        return String(c.kodeMK || '').toUpperCase().startsWith(prefix)
      }
      // Bandingkan prodi yang terdeteksi dari kode MK (config kampus).
      return getProdiByCodePrefix(String(c.kodeMK || ''), campus) === prodiFilter
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
