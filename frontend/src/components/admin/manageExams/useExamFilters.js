import { useState, useMemo, useEffect } from 'react'
import { useDebounce } from '../../../hooks/useDebounce'

const BASE_SEMESTER_GROUPS = [
  { label: 'Semua Semester', value: '' },
  { label: 'Semester Ganjil', value: 'ganjil' },
  { label: 'Semester Genap', value: 'genap' },
]

export function useExamFilters(exams = [], courseMap = new Map()) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [jenisFilter, setJenisFilter] = useState('Semua') // Semua | UTS | UAS
  const [prodiFilter, setProdiFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const availableSemesterOptions = useMemo(() => {
    const nums = [
      ...new Set(exams.map((e) => Number(e.semester)).filter((n) => Number.isInteger(n) && n > 0)),
    ].sort((a, b) => a - b)
    return [
      ...BASE_SEMESTER_GROUPS,
      ...nums.map((n) => ({ label: `Semester ${n}`, value: String(n) })),
    ]
  }, [exams])

  useEffect(() => {
    if (!semesterFilter) return
    if (semesterFilter === 'ganjil' || semesterFilter === 'genap') return
    if (!availableSemesterOptions.some((o) => String(o.value) === String(semesterFilter))) {
      // oxlint-disable-next-line react/set-state-in-effect
      setSemesterFilter('')
    }
  }, [availableSemesterOptions, semesterFilter])

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Live Quick Stats
  const stats = useMemo(() => {
    const total = exams.length
    const uts = exams.filter((e) => e.jenis === 'UTS').length
    const uas = exams.filter((e) => e.jenis === 'UAS').length
    const published = exams.filter((e) => (e.status || 'published') === 'published').length
    const draft = exams.filter((e) => e.status === 'draft').length
    return { total, uts, uas, published, draft }
  }, [exams])

  // Filtered List
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return exams
      .filter((e) => {
        if (jenisFilter !== 'Semua' && e.jenis !== jenisFilter) return false
        if (prodiFilter && e.prodi !== prodiFilter) return false
        if (semesterFilter) {
          const sem = Number(e.semester)
          if (semesterFilter === 'ganjil') {
            if (sem % 2 !== 1) return false
          } else if (semesterFilter === 'genap') {
            if (sem % 2 !== 0) return false
          } else if (String(e.semester) !== semesterFilter) {
            return false
          }
        }
        if (statusFilter && (e.status || 'published') !== statusFilter) return false
        if (q) {
          const course = courseMap.get(String(e.kodeMK).toUpperCase())
          const matchTarget = [
            e.kodeMK,
            e.prodi,
            e.ruang,
            e.tanggal,
            e.jam,
            course?.namaMK,
            course?.dosen,
          ].filter(Boolean)
          return matchTarget.some((val) => String(val).toLowerCase().includes(q))
        }
        return true
      })
      .sort(
        (a, b) =>
          String(a.tanggal).localeCompare(String(b.tanggal)) ||
          String(a.jam).localeCompare(String(b.jam)),
      )
  }, [exams, jenisFilter, prodiFilter, semesterFilter, statusFilter, debouncedSearch, courseMap])

  // Dynamic Pagination
  const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize) || 1
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages))
  const paginatedExams = useMemo(() => {
    if (pageSize === 0) return filtered
    const start = (safeCurrentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safeCurrentPage, pageSize])

  const hasActiveFilters = Boolean(
    search || jenisFilter !== 'Semua' || prodiFilter || semesterFilter || statusFilter,
  )

  function resetAllFilters() {
    setSearch('')
    setJenisFilter('Semua')
    setProdiFilter('')
    setSemesterFilter('')
    setStatusFilter('')
  }

  return {
    search,
    setSearch,
    jenisFilter,
    setJenisFilter,
    prodiFilter,
    setProdiFilter,
    semesterFilter,
    setSemesterFilter,
    statusFilter,
    setStatusFilter,
    availableSemesterOptions,
    hasActiveFilters,
    resetAllFilters,
    stats,
    filtered,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    safeCurrentPage,
    paginatedExams,
  }
}
