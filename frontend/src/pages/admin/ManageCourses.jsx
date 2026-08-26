import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import {
  ProdiFilterDropdown,
  SemesterFilterDropdown,
  DosenFilterDropdown,
  SksFilterDropdown,
} from '../../components/admin/AdminFilterDropdowns'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { deleteDocument, setDocument, updateDocument } from '../../lib/adminData'
import { appendHistory } from '../../lib/publishHelpers'
import { validateCourseEntry } from '../../lib/uploadValidator'
import { PRODIS, SEMESTER_OPTIONS } from '../../constants/academicConstants'
import { parseLecturers, getLecturerInitial, formatWhatsAppUrl } from '../../lib/lecturerUtils'

const EMPTY_FORM = {
  kodeMK: '',
  namaMK: '',
  dosen: '',
  kontakDosen: '',
  sks: 2,
  durasi: 100,
  semester: 1,
}

/** Helper: Dapatkan nomor semester dari field atau auto-ekstrak dari digit pertama kode MK */
function getCourseSemester(course) {
  if (course?.semester != null && !isNaN(Number(course.semester)) && Number(course.semester) > 0) {
    return Number(course.semester)
  }
  const match = String(course?.kodeMK || '').match(/\d/)
  if (match) {
    const d = Number(match[0])
    if (d >= 1 && d <= 8) return d
  }
  return null
}

export default function ManageCourses() {
  const { data: courses, loading } = useFirestore('mataKuliah')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

  const [search, setSearch] = useState('')
  const [dosenFilter, setDosenFilter] = useState('')
  const [prodiFilter, setProdiFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [sksFilter, setSksFilter] = useState('')

  // ── State Pagination ──
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(7)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit'
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState([])
  const [editingTarget, setEditingTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)

  const lecturers = useMemo(
    () => [...new Set(courses.map((c) => c.dosen).filter(Boolean))].sort(),
    [courses],
  )

  const stats = useMemo(() => {
    const totalSks = courses.reduce((acc, c) => acc + (Number(c.sks) || 0), 0)
    return {
      totalCourses: courses.length,
      totalLecturers: lecturers.length,
      totalSks,
    }
  }, [courses, lecturers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return courses
      .filter((c) => (dosenFilter ? c.dosen === dosenFilter : true))
      .filter((c) => {
        if (!prodiFilter) return true
        const p = PRODIS.find((item) => item.value === prodiFilter)
        if (p && p.prefix) {
          return String(c.kodeMK || '').toUpperCase().startsWith(p.prefix)
        }
        return true
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
        if (!sksFilter) return true
        const s = Number(c.sks) || 0
        if (sksFilter === '1-2') return s <= 2
        if (sksFilter === '3') return s === 3
        if (sksFilter === '4+') return s >= 4
        return true
      })
      .filter((c) =>
        q
          ? [c.kodeMK, c.namaMK, c.dosen, c.kontakDosen].some((v) =>
              String(v).toLowerCase().includes(q),
            )
          : true,
      )
      .sort((a, b) => String(a.kodeMK).localeCompare(String(b.kodeMK)))
  }, [courses, search, dosenFilter, prodiFilter, semesterFilter, sksFilter])

  // ── Paginasi Data Mata Kuliah ──
  const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize) || 1
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages))
  const paginatedCourses = useMemo(() => {
    if (pageSize === 0) return filtered
    const start = (safeCurrentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safeCurrentPage, pageSize])

  const hasActiveFilters = Boolean(search || dosenFilter || prodiFilter || semesterFilter || sksFilter)

  function resetAllFilters() {
    setSearch('')
    setDosenFilter('')
    setProdiFilter('')
    setSemesterFilter('')
    setSksFilter('')
  }

  function exportCoursesToExcel() {
    if (filtered.length === 0) {
      setBanner({ ok: false, message: 'Tidak ada data mata kuliah untuk diekspor.' })
      return
    }
    const exportData = filtered.map((c) => {
      const sem = getCourseSemester(c)
      return {
        'Kode MK': c.kodeMK,
        'Nama Mata Kuliah': c.namaMK,
        Semester: sem ? `Semester ${sem}` : '-',
        'Dosen Pengampu': c.dosen || '-',
        'Kontak WhatsApp': c.kontakDosen || '-',
        'Bobot SKS': c.sks || 2,
        'Durasi (Menit)': c.durasi || 100,
      }
    })
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Master_Mata_Kuliah')
    XLSX.writeFile(wb, `Master_Mata_Kuliah_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  function openAddModal() {
    setModalMode('add')
    setEditingTarget(null)
    setForm(EMPTY_FORM)
    setFormErrors([])
    setModalOpen(true)
  }

  function openEditModal(course) {
    setModalMode('edit')
    setEditingTarget(course)
    setForm({
      kodeMK: course.kodeMK,
      namaMK: course.namaMK,
      dosen: course.dosen ?? '',
      kontakDosen: course.kontakDosen ?? '',
      sks: course.sks ?? 2,
      durasi: course.durasi ?? 100,
      semester: getCourseSemester(course) ?? 1,
    })
    setFormErrors([])
    setModalOpen(true)
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    const errors = validateCourseEntry(form)
    setFormErrors(errors)
    if (errors.length > 0) return

    setSaving(true)
    const kodeMK = form.kodeMK.trim().toUpperCase()

    if (modalMode === 'add') {
      if (courses.some((c) => c.kodeMK === kodeMK)) {
        setSaving(false)
        setFormErrors([`Kode MK ${kodeMK} sudah terdaftar. Gunakan tombol Edit untuk mengubahnya.`])
        return
      }
      const result = await setDocument('mataKuliah', kodeMK, { ...form, kodeMK }, actor)
      if (result.ok) {
        await appendHistory({
          entitas: 'mataKuliah',
          field: 'tambah',
          nilaiLama: null,
          nilaiBaru: form,
          aktor: actor,
          detail: `Tambah mata kuliah ${kodeMK} (${form.namaMK})`,
        })
        setBanner({ ok: true, message: `Mata kuliah ${kodeMK} berhasil ditambahkan.` })
        setModalOpen(false)
      } else {
        setBanner({ ok: false, message: result.error })
      }
    } else {
      const result = await updateDocument('mataKuliah', editingTarget.id, form, actor)
      if (result.ok) {
        await appendHistory({
          entitas: 'mataKuliah',
          field: 'edit',
          nilaiLama: editingTarget,
          nilaiBaru: form,
          aktor: actor,
          detail: `Update mata kuliah ${editingTarget.kodeMK}`,
        })
        setBanner({ ok: true, message: `Mata kuliah ${editingTarget.kodeMK} berhasil diperbarui.` })
        setModalOpen(false)
      } else {
        setBanner({ ok: false, message: result.error })
      }
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    const result = await deleteDocument('mataKuliah', target.id)
    setDeleteTarget(null)
    if (result.ok) {
      await appendHistory({
        entitas: 'mataKuliah',
        field: 'hapus',
        nilaiLama: target,
        nilaiBaru: null,
        aktor: actor,
        detail: `Hapus mata kuliah ${target.kodeMK}`,
      })
      setBanner({ ok: true, message: `Mata kuliah ${target.kodeMK} dihapus.` })
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in w-full max-w-full overflow-x-hidden">
      {/* Header & Quick Stats */}
      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span className="flex h-11 w-11 tablet:h-12 tablet:w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-container/60 text-secondary shadow-xs dark:bg-secondary-container/30 mt-0.5">
              <Icon name="menu_book" size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl tablet:text-headline-lg font-bold tracking-tight text-on-surface">
                Kelola MK & Dosen
              </h1>
              <p className="text-body-xs tablet:text-body-sm font-normal text-on-surface-variant mt-0.5">
                Master mata kuliah, SKS, semester & dosen pengampu
              </p>
            </div>
          </div>

          {/* Primary Action Button beside title */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={openAddModal}
              className="rounded-2xl p-2.5 tablet:px-4 tablet:py-2.5 font-bold shadow-xs cursor-pointer text-body-sm shrink-0"
              title="Tambah Mata Kuliah"
              aria-label="Tambah MK"
            >
              <Icon name="add" size={20} className="tablet:mr-1.5" />
              <span className="hidden tablet:inline">Tambah MK</span>
            </Button>
          </div>
        </div>

        {/* Live Quick Stat Chips — 3-Column Grid on Mobile, Flex on Desktop */}
        <div className="grid grid-cols-3 gap-2 w-full tablet:flex tablet:w-auto">
          <div className="flex flex-col tablet:flex-row items-center tablet:items-center text-center tablet:text-left gap-1 tablet:gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-2.5 tablet:px-3.5 tablet:py-2 shadow-xs dark:bg-surface-container-low min-w-0">
            <Icon name="library_books" size={18} className="text-primary shrink-0" />
            <div className="min-w-0 w-full">
              <p className="text-[10px] tablet:text-label-caps uppercase font-bold text-on-surface-variant truncate">Total MK</p>
              <p className="text-title-sm font-bold text-on-surface">{stats.totalCourses}</p>
            </div>
          </div>
          <div className="flex flex-col tablet:flex-row items-center tablet:items-center text-center tablet:text-left gap-1 tablet:gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-2.5 tablet:px-3.5 tablet:py-2 shadow-xs dark:bg-surface-container-low min-w-0">
            <Icon name="person" size={18} className="text-secondary shrink-0" />
            <div className="min-w-0 w-full">
              <p className="text-[10px] tablet:text-label-caps uppercase font-bold text-on-surface-variant truncate">Dosen</p>
              <p className="text-title-sm font-bold text-on-surface">{stats.totalLecturers}</p>
            </div>
          </div>
          <div className="flex flex-col tablet:flex-row items-center tablet:items-center text-center tablet:text-left gap-1 tablet:gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-2.5 tablet:px-3.5 tablet:py-2 shadow-xs dark:bg-surface-container-low min-w-0">
            <Icon name="workspace_premium" size={18} className="text-tertiary shrink-0" />
            <div className="min-w-0 w-full">
              <p className="text-[10px] tablet:text-label-caps uppercase font-bold text-on-surface-variant truncate">Total SKS</p>
              <p className="text-title-sm font-bold text-on-surface">{stats.totalSks}</p>
            </div>
          </div>
        </div>
      </header>

      {banner && (
        <StatusBanner
          ok={banner.ok}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* ── 2. Filter & Search Controls (Unified 1-Row Toolbar) ── */}
      <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-3.5 tablet:p-4 shadow-xs space-y-2.5 dark:bg-surface-container-low">
        {/* Unified Search & Filters in 1 Row on Desktop */}
        <div className="relative z-30 flex flex-col gap-2 tablet:flex-row tablet:items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Icon
              name="search"
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode MK, nama mata kuliah, dosen…"
              aria-label="Cari mata kuliah"
              className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 py-1.5 tablet:py-2 pl-9 pr-8 text-body-xs tablet:text-body-sm font-medium text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:bg-surface focus:outline-none dark:bg-surface-container-high/30 transition-all shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-on-surface-variant hover:bg-surface-container cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <Icon name="close" size={13} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & Actions */}
          <div className="flex items-center gap-1.5 overflow-x-auto tablet:overflow-visible no-scrollbar w-full tablet:w-auto shrink-0 pb-0.5 tablet:pb-0 relative z-30">
            <ProdiFilterDropdown
              selected={prodiFilter}
              onSelect={setProdiFilter}
            />

            <SemesterFilterDropdown
              selected={semesterFilter}
              onSelect={setSemesterFilter}
            />

            <DosenFilterDropdown
              lecturers={lecturers}
              selected={dosenFilter}
              onSelect={setDosenFilter}
            />

            <SksFilterDropdown
              selected={sksFilter}
              onSelect={setSksFilter}
            />

            <button
              type="button"
              onClick={exportCoursesToExcel}
              className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-outline-variant/30 bg-surface-container-low/60 px-2.5 py-1.5 text-body-xs font-semibold text-on-surface shadow-2xs hover:border-primary hover:text-primary cursor-pointer transition-colors"
              title="Ekspor Kurikulum Mata Kuliah ke Excel"
            >
              <Icon name="file_download" size={14} className="text-secondary" />
              <span>Ekspor</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setProdiFilter('')
                  setSemesterFilter('')
                  setDosenFilter('')
                  setSksFilter('')
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-error/30 bg-error/10 px-2.5 py-1.5 text-body-xs font-bold text-error hover:bg-error/20 cursor-pointer transition-colors"
              >
                <Icon name="refresh" size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/15 text-label-caps uppercase font-semibold text-on-surface-variant">
            <span>Filter Aktif:</span>

            {search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-on-surface">
                <span>Keyword: "{search}"</span>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="rounded-full p-0.5 hover:bg-surface-container-highest cursor-pointer"
                >
                  <Icon name="close" size={14} />
                </button>
              </span>
            )}

            {prodiFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                <span>Prodi: {prodiFilter}</span>
                <button
                  type="button"
                  onClick={() => setProdiFilter('')}
                  className="rounded-full p-0.5 hover:bg-primary/20 cursor-pointer"
                >
                  <Icon name="close" size={14} />
                </button>
              </span>
            )}

            {semesterFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-1 text-indigo-700 dark:text-indigo-300">
                <span>Semester: {SEMESTER_OPTIONS.find((s) => s.value === semesterFilter)?.label}</span>
                <button
                  type="button"
                  onClick={() => setSemesterFilter('')}
                  className="rounded-full p-0.5 hover:bg-indigo-500/20 cursor-pointer"
                >
                  <Icon name="close" size={14} />
                </button>
              </span>
            )}

            {dosenFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-secondary">
                <span className="max-w-[140px] truncate">Dosen: {dosenFilter}</span>
                <button
                  type="button"
                  onClick={() => setDosenFilter('')}
                  className="rounded-full p-0.5 hover:bg-secondary/20 cursor-pointer"
                >
                  <Icon name="close" size={14} />
                </button>
              </span>
            )}

            {sksFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-tertiary/10 px-2.5 py-1 text-tertiary">
                <span>SKS: {SKS_OPTIONS.find((s) => s.value === sksFilter)?.label}</span>
                <button
                  type="button"
                  onClick={() => setSksFilter('')}
                  className="rounded-full p-0.5 hover:bg-tertiary/20 cursor-pointer"
                >
                  <Icon name="close" size={14} />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={resetAllFilters}
              className="text-label-caps font-bold text-error hover:underline cursor-pointer ml-auto"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* Main Course Table / List */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-8 dark:bg-surface-container-low">
          <EmptyState
            icon="menu_book"
            title="Tidak ada mata kuliah yang cocok"
            description={
              hasActiveFilters
                ? 'Coba sesuaikan filter atau bersihkan pencarian.'
                : 'Belum ada data mata kuliah. Tekan tombol "+ Tambah MK" untuk membuat master mata kuliah.'
            }
          />
          {hasActiveFilters && (
            <div className="flex justify-center mt-4">
              <Button variant="secondary" onClick={resetAllFilters} className="cursor-pointer">
                <Icon name="refresh" size={18} className="mr-1" />
                Reset Semua Filter
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Table — Desktop & Tablet with Sticky Header & Dynamic Viewport Height */}
          <div className="hidden overflow-x-hidden overflow-y-auto max-h-[calc(100vh-270px)] rounded-3xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm tablet:block dark:bg-surface-container-low dark:border-outline-variant/15 w-full">
            <table className="w-full table-fixed text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-surface-container-low/95 dark:bg-surface-container-high/95 backdrop-blur-md shadow-xs">
                <tr className="border-b border-outline-variant/15">
                  <th className="w-[12%] px-3.5 py-2.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                    Kode MK
                  </th>
                  <th className="w-[27%] px-3.5 py-2.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                    Nama Mata Kuliah
                  </th>
                  <th className="w-[10%] px-3 py-2.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                    Semester
                  </th>
                  <th className="w-[24%] px-3.5 py-2.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                    Dosen Pengampu
                  </th>
                  <th className="w-[12%] px-3 py-2.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                    Kontak
                  </th>
                  <th className="w-[9%] px-3 py-2.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold text-center">
                    Bobot
                  </th>
                  <th className="w-[6%] px-3 py-2.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {paginatedCourses.map((course) => {
                  const waUrl = formatWhatsAppUrl(course.kontakDosen)
                  const semester = getCourseSemester(course)
                  const lecturerList = parseLecturers(course.dosen)

                  return (
                    <tr
                      key={course.id}
                      className="group transition-colors hover:bg-surface-container-low/50 dark:hover:bg-surface-container-high/20"
                    >
                      {/* Kode MK */}
                      <td className="px-3.5 py-2.5">
                        <span className="inline-flex items-center rounded-xl bg-primary/10 px-2 py-0.5 font-mono text-body-xs font-bold text-primary border border-primary/20 dark:bg-primary/20">
                          {course.kodeMK}
                        </span>
                      </td>

                      {/* Nama MK */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-body-md text-on-surface leading-snug break-words">
                          {course.namaMK}
                        </p>
                      </td>

                      {/* Semester */}
                      <td className="px-3 py-3.5">
                        {semester ? (
                          <span className="inline-flex items-center rounded-lg bg-indigo-500/10 px-2 py-0.5 text-label-caps font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                            Sem. {semester}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant/40 text-body-sm">-</span>
                        )}
                      </td>

                      {/* Dosen Pengampu (Smart Multi-Lecturer Formatter) */}
                      <td className="px-4 py-3.5">
                        {lecturerList.length === 0 ? (
                          <span className="text-on-surface-variant/50 text-body-xs">-</span>
                        ) : lecturerList.length === 1 ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container font-bold text-label-caps shadow-2xs">
                              {getLecturerInitial(lecturerList[0])}
                            </div>
                            <span className="text-body-xs font-semibold text-on-surface truncate">
                              {lecturerList[0]}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {/* Avatar stack */}
                              <div className="flex -space-x-1.5 shrink-0">
                                {lecturerList.slice(0, 3).map((docName, idx) => (
                                  <div
                                    key={idx}
                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container font-bold text-[10px] ring-2 ring-surface-container-lowest dark:ring-surface-container-low shadow-2xs"
                                    title={docName}
                                  >
                                    {getLecturerInitial(docName)}
                                  </div>
                                ))}
                              </div>
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-secondary/10 px-1.5 py-0.5 text-[10px] uppercase font-bold text-secondary border border-secondary/20">
                                {lecturerList.length} Dosen
                              </span>
                            </div>
                            <div className="text-body-xs text-on-surface-variant space-y-0.5">
                              {lecturerList.map((docName, idx) => (
                                <p key={idx} className="font-semibold text-on-surface leading-tight truncate">
                                  {idx + 1}. {docName}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Kontak WhatsApp */}
                      <td className="px-3 py-3.5">
                        {course.kontakDosen ? (
                          <a
                            href={waUrl || `tel:${course.kontakDosen}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-label-caps font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors cursor-pointer max-w-full truncate"
                            title={`Buka WhatsApp ${course.kontakDosen}`}
                          >
                            <Icon name="chat" size={12} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span className="truncate">{course.kontakDosen}</span>
                          </a>
                        ) : (
                          <span className="text-on-surface-variant/40 text-body-sm">-</span>
                        )}
                      </td>

                      {/* Bobot & Durasi */}
                      <td className="px-3 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className="rounded-md bg-surface-container px-2 py-0.5 text-label-caps font-bold text-on-surface whitespace-nowrap">
                            {course.sks} SKS
                          </span>
                          <span className="text-[10px] font-medium text-on-surface-variant whitespace-nowrap">
                            {course.durasi} mnt
                          </span>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="px-3 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(course)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer"
                            title={`Edit ${course.kodeMK}`}
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(course)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer"
                            title={`Hapus ${course.kodeMK}`}
                          >
                            <Icon name="delete" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Cards — Mobile */}
          <div className="space-y-3 tablet:hidden">
            {paginatedCourses.map((course) => {
              const waUrl = formatWhatsAppUrl(course.kontakDosen)
              const semester = getCourseSemester(course)
              const lecturerList = parseLecturers(course.dosen)

              return (
                <div
                  key={course.id}
                  className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-xs dark:bg-surface-container-low space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded-xl bg-primary/10 px-2.5 py-0.5 font-mono text-label-caps font-bold text-primary border border-primary/20">
                          {course.kodeMK}
                        </span>
                        {semester && (
                          <span className="inline-flex items-center rounded-lg bg-indigo-500/10 px-2 py-0.5 text-label-caps font-bold text-indigo-700 dark:text-indigo-300">
                            Sem. {semester}
                          </span>
                        )}
                      </div>
                      <h3 className="text-body-md font-bold text-on-surface mt-1.5 leading-snug">
                        {course.namaMK}
                      </h3>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(course)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-primary/10 hover:text-primary cursor-pointer"
                        aria-label="Edit"
                      >
                        <Icon name="edit" size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(course)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-error/10 hover:text-error cursor-pointer"
                        aria-label="Hapus"
                      >
                        <Icon name="delete" size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Lecturer Display */}
                  <div className="text-body-sm text-on-surface-variant">
                    {lecturerList.length === 0 ? (
                      <p className="text-body-xs text-on-surface-variant/50">Dosen belum diisi</p>
                    ) : lecturerList.length === 1 ? (
                      <div className="flex items-center gap-2">
                        <Icon name="person" size={16} className="text-secondary shrink-0" />
                        <span className="font-semibold text-on-surface truncate">{lecturerList[0]}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-secondary font-bold text-body-xs">
                          <Icon name="groups" size={16} />
                          <span>Tim {lecturerList.length} Dosen:</span>
                        </div>
                        <ul className="text-body-xs font-medium text-on-surface pl-5 list-disc space-y-0.5">
                          {lecturerList.map((docName, idx) => (
                            <li key={idx}>{docName}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/10">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-surface-container px-2 py-0.5 text-label-caps font-bold text-on-surface">
                        {course.sks} SKS
                      </span>
                      <span className="rounded-md bg-surface-container-high px-2 py-0.5 text-label-caps font-medium text-on-surface-variant">
                        {course.durasi} mnt
                      </span>
                    </div>

                    {course.kontakDosen && (
                      <a
                        href={waUrl || `tel:${course.kontakDosen}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-label-caps font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
                      >
                        <Icon name="chat" size={12} />
                        <span>{course.kontakDosen}</span>
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Shared Pagination Controls */}
          <Pagination
            currentPage={safeCurrentPage}
            totalItems={filtered.length}
            pageSize={pageSize === 0 ? 'Semua' : pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => setPageSize(sz === 'Semua' ? 0 : sz)}
            itemLabel="mata kuliah"
          />
        </>
      )}

      {/* Modal Dialog Form (Tambah / Edit) */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            onClick={() => setModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Modal Content Card */}
          <div className="relative w-full max-w-lg rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 sm:p-8 shadow-2xl dark:bg-surface-container-low dark:border-outline-variant/15 animate-fade-up">
            <header className="flex items-center justify-between pb-4 border-b border-outline-variant/15 mb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                  <Icon name={modalMode === 'add' ? 'add_box' : 'edit_document'} size={22} />
                </span>
                <div>
                  <h3 className="text-title-lg font-bold text-on-surface">
                    {modalMode === 'add' ? 'Tambah Mata Kuliah' : `Edit Mata Kuliah (${form.kodeMK})`}
                  </h3>
                  <p className="text-body-xs text-on-surface-variant">
                    {modalMode === 'add' ? 'Daftarkan kode dan nama mata kuliah baru' : 'Perbarui data master mata kuliah'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container cursor-pointer"
                aria-label="Tutup"
              >
                <Icon name="close" size={20} />
              </button>
            </header>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Kode MK"
                  value={form.kodeMK}
                  disabled={modalMode === 'edit'}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase()
                    setForm((f) => {
                      const derivedSem = getCourseSemester({ kodeMK: val })
                      return {
                        ...f,
                        kodeMK: val,
                        ...(derivedSem ? { semester: derivedSem } : {}),
                      }
                    })
                  }}
                  placeholder="mis. ARS201 / IF301"
                  className="uppercase font-mono font-bold"
                />
                <Input
                  label="Nama Mata Kuliah"
                  value={form.namaMK}
                  onChange={(e) => setForm((f) => ({ ...f, namaMK: e.target.value }))}
                  placeholder="Nama mata kuliah"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Dosen Pengampu"
                  value={form.dosen}
                  onChange={(e) => setForm((f) => ({ ...f, dosen: e.target.value }))}
                  placeholder="Nama lengkap & gelar dosen"
                />
                <Input
                  label="Kontak Dosen (No. HP/WA)"
                  value={form.kontakDosen}
                  onChange={(e) => setForm((f) => ({ ...f, kontakDosen: e.target.value }))}
                  placeholder="0812-3456-7890"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Semester"
                  type="number"
                  min="1"
                  max="8"
                  value={form.semester}
                  onChange={(e) => setForm((f) => ({ ...f, semester: Number(e.target.value) }))}
                />
                <Input
                  label="Bobot SKS"
                  type="number"
                  min="1"
                  max="8"
                  value={form.sks}
                  onChange={(e) => setForm((f) => ({ ...f, sks: Number(e.target.value) }))}
                />
                <Input
                  label="Durasi (Menit)"
                  type="number"
                  min="30"
                  max="360"
                  step="10"
                  value={form.durasi}
                  onChange={(e) => setForm((f) => ({ ...f, durasi: Number(e.target.value) }))}
                />
              </div>

              {formErrors.length > 0 && (
                <div className="rounded-xl bg-error/10 p-3 text-body-xs font-semibold text-error">
                  {formErrors.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/15">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                  className="cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="font-bold shadow-md cursor-pointer"
                >
                  <Icon name="save" size={18} className="mr-1" />
                  {saving ? 'Menyimpan...' : 'Simpan Data'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus mata kuliah?"
        description={`${deleteTarget?.kodeMK} — ${deleteTarget?.namaMK} akan dihapus dari daftar master. Jadwal yang memakai kode ini akan gagal validasi saat upload berikutnya.`}
        confirmLabel="Hapus Mata Kuliah"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
