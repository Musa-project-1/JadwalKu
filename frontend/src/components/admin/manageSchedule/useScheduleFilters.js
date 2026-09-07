import { useState, useMemo } from 'react'
import { useDebounce } from '../../../hooks/useDebounce'
import { findConflicts } from '../../../lib/uploadValidator'
import {
  buildTaOptions,
  buildSemesterOptions,
  filterSchedule,
  groupSchedule,
} from '../../../lib/scheduleUtils'

export function useScheduleFilters({
  rawSchedule,
  courseMap,
  fakultasDocs,
  programs,
  prodiFakultasMap,
}) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [fakultasFilter, setFakultasFilter] = useState('')
  const [prodiFilter, setProdiFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [hariFilter, setHariFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [taFilter, setTaFilter] = useState('')
  const [onlyShowConflicts, setOnlyShowConflicts] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const availableTaOptions = useMemo(() => buildTaOptions(rawSchedule), [rawSchedule])
  if (taFilter && !availableTaOptions.some((o) => String(o.value) === String(taFilter))) {
    setTaFilter('')
  }

  const availableSemesterOptions = useMemo(
    () => buildSemesterOptions(rawSchedule, taFilter),
    [rawSchedule, taFilter],
  )
  if (
    semesterFilter &&
    semesterFilter !== 'ganjil' &&
    semesterFilter !== 'genap' &&
    !availableSemesterOptions.some((o) => String(o.value) === String(semesterFilter))
  ) {
    setSemesterFilter('')
  }

  const availableFakultasOptions = useMemo(() => {
    const map = new Map()
    ;(fakultasDocs || []).forEach((f) => {
      const id = String(f.id || f.fakultasId || '')
      if (id && !map.has(id)) map.set(id, { label: String(f.nama || f.singkatan || id), value: id })
    })
    if (map.size === 0) {
      ;(programs || []).forEach((pr) => {
        const fid = String(pr.fakultasId || '').trim()
        if (fid && !map.has(fid)) map.set(fid, { label: fid, value: fid })
      })
    }
    return [
      { label: 'Semua Fakultas', value: '' },
      ...[...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'id')),
    ]
  }, [fakultasDocs, programs])

  // Validasi Bentrok Cerdas Database
  const { conflictsList, conflictMap } = useMemo(() => {
    if (!rawSchedule || rawSchedule.length === 0) {
      return { conflictsList: [], conflictMap: new Map() }
    }
    const list = findConflicts(rawSchedule, courseMap)
    const map = new Map()
    for (const c of list) {
      const entryA = rawSchedule[c.a]
      const entryB = rawSchedule[c.b]
      if (entryA?.id) {
        const arr = map.get(entryA.id) || []
        arr.push(c)
        map.set(entryA.id, arr)
      }
      if (entryB?.id) {
        const arr = map.get(entryB.id) || []
        arr.push(c)
        map.set(entryB.id, arr)
      }
    }
    return { conflictsList: list, conflictMap: map }
  }, [rawSchedule, courseMap])

  // Filter Schedule Data
  const filteredSchedule = useMemo(() => {
    return filterSchedule(
      rawSchedule,
      {
        fakultasFilter,
        prodiFilter,
        semesterFilter,
        taFilter,
        hariFilter,
        statusFilter,
        onlyShowConflicts,
        search: debouncedSearch,
      },
      { courseMap, prodiFakultasMap, conflictMap },
    )
  }, [
    rawSchedule,
    fakultasFilter,
    prodiFilter,
    semesterFilter,
    taFilter,
    hariFilter,
    statusFilter,
    onlyShowConflicts,
    conflictMap,
    debouncedSearch,
    courseMap,
    prodiFakultasMap,
  ])

  // Grouping MK Umum
  const groupedSchedule = useMemo(() => {
    return groupSchedule(filteredSchedule, courseMap)
  }, [filteredSchedule, courseMap])

  // Paginasi per GRUP
  const totalPages = pageSize === 0 ? 1 : Math.ceil(groupedSchedule.length / pageSize) || 1
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages))
  const paginatedGroups = useMemo(() => {
    if (pageSize === 0) return groupedSchedule
    const start = (safeCurrentPage - 1) * pageSize
    return groupedSchedule.slice(start, start + pageSize)
  }, [groupedSchedule, safeCurrentPage, pageSize])

  // Stats Metrics
  const stats = useMemo(() => {
    let published = 0
    let draft = 0
    for (const s of rawSchedule) {
      if (s.status === 'draft') draft++
      else published++
    }
    return {
      total: rawSchedule.length,
      published,
      draft,
      conflictsCount: conflictsList.length,
    }
  }, [rawSchedule, conflictsList])

  const [expandedGroups, setExpandedGroups] = useState(() => new Set())
  function toggleExpandGroup(key) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const filterSignature = `${debouncedSearch}|${fakultasFilter}|${prodiFilter}|${semesterFilter}|${taFilter}|${hariFilter}|${statusFilter}|${onlyShowConflicts}`
  const [prevFilterSignature, setPrevFilterSignature] = useState(filterSignature)
  if (filterSignature !== prevFilterSignature) {
    setPrevFilterSignature(filterSignature)
    setExpandedGroups(new Set())
  }

  function resetFilters() {
    setSearch('')
    setFakultasFilter('')
    setProdiFilter('')
    setSemesterFilter('')
    setHariFilter('')
    setStatusFilter('')
    setTaFilter('')
    setOnlyShowConflicts(false)
    setCurrentPage(1)
  }

  const hasActiveFilters = Boolean(
    search ||
    fakultasFilter ||
    prodiFilter ||
    semesterFilter ||
    hariFilter ||
    statusFilter ||
    taFilter ||
    onlyShowConflicts
  )

  return {
    search,
    setSearch,
    debouncedSearch,
    fakultasFilter,
    setFakultasFilter,
    prodiFilter,
    setProdiFilter,
    semesterFilter,
    setSemesterFilter,
    hariFilter,
    setHariFilter,
    statusFilter,
    setStatusFilter,
    taFilter,
    setTaFilter,
    onlyShowConflicts,
    setOnlyShowConflicts,
    availableTaOptions,
    availableSemesterOptions,
    availableFakultasOptions,
    conflictsList,
    conflictMap,
    filteredSchedule,
    groupedSchedule,
    paginatedGroups,
    stats,
    totalPages,
    safeCurrentPage,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    expandedGroups,
    toggleExpandGroup,
    resetFilters,
    hasActiveFilters,
  }
}
