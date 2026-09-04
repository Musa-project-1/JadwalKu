import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import {
  ProdiFilterDropdown,
  SemesterFilterDropdown,
  TaFilterDropdown,
  DosenFilterDropdown,
  SksFilterDropdown,
} from '../../components/admin/AdminFilterDropdowns'
import { CourseTable, CourseCards, CourseFormModal } from '../../components/admin/manageCourses'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { useDebounce } from '../../hooks/useDebounce'
import { deleteDocument, setDocument, updateDocument } from '../../lib/adminData'
import { getXLSXExp } from '../../lib/academicExcelExport'
import { appendHistory } from '../../lib/publishHelpers'
import { validateCourseEntry } from '../../lib/uploadValidator'
import { useCampus } from '../../context/useCampus'
import { filterCourses, getCourseSemester, BASE_SEMESTER_GROUPS, EMPTY_COURSE_FORM } from '../../lib/courseUtils'

// Match the SksFilterDropdown's DEFAULT_SKS values (numeric). The filter logic and the
// active-filter chip label both rely on these exact values.
const SKS_OPTIONS = [
  { label: '2 SKS', value: 2 },
  { label: '3 SKS', value: 3 },
  { label: '4 SKS', value: 4 },
  { label: '6 SKS', value: 6 },
]

export default function ManageCourses() {
  const { data: courses, loading } = useFirestore('mataKuliah')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''
  const { campus, prodiNames } = useCampus()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [dosenFilter, setDosenFilter] = useState('')
  const [prodiFilter, setProdiFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [sksFilter, setSksFilter] = useState('')

  // ── State Pagination ──
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit'
  const [modalKey, setModalKey] = useState(0)
  const [form, setForm] = useState(EMPTY_COURSE_FORM)
  const [formErrors, setFormErrors] = useState([])
  const [editingTarget, setEditingTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)

  const lecturers = useMemo(
    () => [...new Set(courses.map((c) => c.dosen).filter(Boolean))].sort(),
    [courses],
  )

  const [taFilter, setTaFilter] = useState('')
  const availableTaOptions = useMemo(() => {
    const tas = [...new Set(courses.map((c) => String(c.tahunAjaran || '').trim()).filter(Boolean))].sort((a, b) => b.localeCompare(a))
    if (tas.length === 0) return [{ label: 'Semua TA', value: '' }]
    return [{ label: 'Semua TA', value: '' }, ...tas.map((ta) => ({ label: `TA ${ta}`, value: ta }))]
  }, [courses])
  useEffect(() => {
    if (!taFilter) return
    if (!availableTaOptions.some((o) => String(o.value) === String(taFilter))) {
      // oxlint-disable-next-line react/set-state-in-effect
      setTaFilter('')
    }
  }, [availableTaOptions, taFilter])

  // Opsi B: semester hanya yang ada data (support >8: 9,10,14 dst) — pool difilter TA dulu biar cascade TA→Semester
  const availableSemesterOptions = useMemo(() => {
    const pool = taFilter ? courses.filter((c) => String(c.tahunAjaran || '').trim() === String(taFilter)) : courses
    const nums = [...new Set(pool.map((c) => getCourseSemester(c)).filter((n) => Number.isInteger(n) && n > 0))].sort((a, b) => a - b)
    return [...BASE_SEMESTER_GROUPS, ...nums.map((n) => ({ label: `Semester ${n}`, value: String(n) }))]
  }, [courses, taFilter])
  useEffect(() => {
    if (!semesterFilter) return
    if (semesterFilter === 'ganjil' || semesterFilter === 'genap') return
    if (!availableSemesterOptions.some((o) => String(o.value) === String(semesterFilter))) {
      // oxlint-disable-next-line react/set-state-in-effect
      setSemesterFilter('')
    }
  }, [availableSemesterOptions, semesterFilter])

  const stats = useMemo(() => {
    const totalSks = courses.reduce((acc, c) => acc + (Number(c.sks) || 0), 0)
    return {
      totalCourses: courses.length,
      totalLecturers: lecturers.length,
      totalSks,
    }
  }, [courses, lecturers])

  const filtered = useMemo(
    () => filterCourses(courses, { search: debouncedSearch, dosenFilter, prodiFilter, semesterFilter, sksFilter, taFilter }, campus),
    [courses, debouncedSearch, dosenFilter, prodiFilter, semesterFilter, sksFilter, taFilter, campus],
  )

  // ── Paginasi Data Mata Kuliah ──
  const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize) || 1
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages))
  const paginatedCourses = useMemo(() => {
    if (pageSize === 0) return filtered
    const start = (safeCurrentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safeCurrentPage, pageSize])

  const hasActiveFilters = Boolean(search || dosenFilter || prodiFilter || semesterFilter || sksFilter || taFilter)

  function resetAllFilters() {
    setSearch('')
    setTaFilter('')
    setDosenFilter('')
    setProdiFilter('')
    setSemesterFilter('')
    setSksFilter('')
  }

  async function exportCoursesToExcel() {
    let __XLSX; try { __XLSX = await getXLSXExp(); } catch (e) { console.warn('[XLSX] dynamic import failed', e); alert('Gagal memuat pustaka export. Periksa koneksi atau coba lagi.'); return; }
    const XLSX = __XLSX.default ?? __XLSX;
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
    setForm(EMPTY_COURSE_FORM)
    setFormErrors([])
    setModalKey((k) => k + 1)
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
    setModalKey((k) => k + 1)
    setModalOpen(true)
  }

  async function submitAdd(form) {
    const kodeMK = form.kodeMK.trim().toUpperCase()
    if (courses.some((c) => c.kodeMK === kodeMK)) {
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
  }

  async function submitEdit(form) {
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

  async function handleFormSubmit(form) {
    const errors = validateCourseEntry(form)
    setFormErrors(errors)
    if (errors.length > 0) return

    setSaving(true)
    try {
      if (modalMode === 'add') {
        await submitAdd(form)
      } else {
        await submitEdit(form)
      }
    } finally {
      setSaving(false)
    }
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
    <div className="h-full flex flex-col space-y-4 tablet:space-y-3 pb-20 tablet:pb-0 animate-fade-in w-full max-w-full overflow-hidden min-h-0 flex-1">
      {/* ── 1. Page Header ── */}
      <header className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-3 tablet:px-4 tablet:py-3 shadow-level-1 flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between w-full shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-level-1">
            <Icon name="menu_book" size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl tablet:text-2xl font-bold tracking-tight text-on-surface">
                Kelola MK & Dosen
              </h1>
              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-label-caps font-bold border border-primary/20">
                Master Kurikulum
              </span>
            </div>
            <p className="mt-0.5 text-body-xs text-on-surface-variant font-medium truncate">
              Master mata kuliah, SKS, semester & dosen pengampu
            </p>
          </div>
        </div>

        {/* Right side: Live Quick Stat Chips + Primary Action Button */}
        <div className="flex items-center gap-2 tablet:gap-2 shrink-0 flex-wrap tablet:flex-nowrap">
          <div className="grid grid-cols-3 tablet:flex tablet:w-auto gap-2 tablet:gap-2">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 shadow-level-1 min-w-0">
              <Icon name="library_books" size={14} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span className="text-label-caps font-bold text-emerald-700 dark:text-emerald-300 truncate">
                {stats.totalCourses} MK
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 shadow-level-1 min-w-0">
              <Icon name="person" size={14} className="text-blue-700 dark:text-blue-400 shrink-0" />
              <span className="text-label-caps font-bold text-blue-700 dark:text-blue-300 truncate">
                {stats.totalLecturers} Dosen
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-3 py-1 shadow-level-1 min-w-0">
              <Icon name="workspace_premium" size={14} className="text-purple-700 dark:text-purple-400 shrink-0" />
              <span className="text-label-caps font-bold text-purple-700 dark:text-purple-300 truncate">
                {stats.totalSks} SKS
              </span>
            </div>
          </div>

          <Button
            onClick={openAddModal}
            className="rounded-full px-4 py-2 font-bold shadow-level-1 cursor-pointer text-body-xs shrink-0 bg-primary text-on-primary"
            title="Tambah Mata Kuliah"
            aria-label="Tambah MK"
          >
            <Icon name="add" size={16} className="mr-1" />
            <span>Tambah MK</span>
          </Button>
        </div>
      </header>

      {banner && (
        <div className="shrink-0">
          <StatusBanner
            ok={banner.ok}
            message={banner.message}
            onClose={() => setBanner(null)}
          />
        </div>
      )}

      {/* ── 2. Live Database Course Management (Unified Card Container) ── */}
      <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 tablet:p-4 shadow-level-1 dark:bg-surface-container-low dark:border-outline-variant/15 flex-1 flex flex-col min-h-0 space-y-4">
        {/* 1-Row Integrated Search & Dropdowns Toolbar (Matching Kelola Jadwal layout) */}
        <div className="flex items-center gap-2 flex-nowrap overflow-x-auto no-scrollbar w-full pb-0.5 overflow-visible">
          {/* Compact Search Bar */}
          <div className="relative flex-1 min-w-[200px] max-w-sm shrink-0 tablet:shrink">
            <Icon
              name="search"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode MK, nama mata kuliah, dosen…"
              aria-label="Cari mata kuliah"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 py-2 pl-8 pr-7 text-body-xs font-medium text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:bg-surface focus:outline-none dark:bg-surface-container-high/30 transition-all shadow-level-1"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:bg-surface-container rounded-full p-0.5 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <Icon name="close" size={12} />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex items-center gap-2 shrink-0">
            <ProdiFilterDropdown
              selected={prodiFilter}
              onSelect={setProdiFilter}
              prodiOptions={prodiNames}
            />

            {availableTaOptions.length > 2 && (
              <TaFilterDropdown
                selected={taFilter}
                onSelect={setTaFilter}
                taOptions={availableTaOptions}
              />
            )}

            <SemesterFilterDropdown
              selected={semesterFilter}
              onSelect={setSemesterFilter}
              semesterOptions={availableSemesterOptions}
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

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-error/30 bg-error/10 px-2 py-1 text-label-caps font-bold text-error hover:bg-error/20 cursor-pointer transition-colors shadow-level-1"
              >
                <Icon name="refresh" size={12} />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={exportCoursesToExcel}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-2.5 py-1 text-label-caps font-bold text-on-surface shadow-level-1 hover:border-primary hover:text-primary cursor-pointer transition-colors"
              title="Ekspor Kurikulum Mata Kuliah ke Excel"
            >
              <Icon name="file_download" size={13} className="text-secondary" />
              <span>Ekspor</span>
            </button>
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
                <span>Semester: {availableSemesterOptions.find((s) => s.value === semesterFilter)?.label}</span>
                <button
                  type="button"
                  onClick={() => setSemesterFilter('')}
                  className="rounded-full p-0.5 hover:bg-indigo-500/20 cursor-pointer"
                >
                  <Icon name="close" size={14} />
                </button>
              </span>
            )}

            {taFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-1 text-teal-700 dark:text-teal-300">
                <span>TA: {taFilter}</span>
                <button
                  type="button"
                  onClick={() => setTaFilter('')}
                  className="rounded-full p-0.5 hover:bg-teal-500/20 cursor-pointer"
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
                <span>SKS: {SKS_OPTIONS.find((s) => String(s.value) === String(sksFilter))?.label || `${sksFilter} SKS`}</span>
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

        {/* Main Course Table / List */}
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-8 dark:bg-surface-container-high/20 my-auto text-center">
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
            {/* Table — Desktop & Tablet */}
            <CourseTable
              courses={paginatedCourses}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
            />

            {/* Cards — Mobile */}
            <CourseCards
              courses={paginatedCourses}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
            />

            {/* Shared Pagination Controls */}
            <div className="shrink-0 pt-1.5 border-t border-outline-variant/15">
              <Pagination
                currentPage={safeCurrentPage}
                totalItems={filtered.length}
                pageSize={pageSize === 0 ? 'Semua' : pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => setPageSize(sz === 'Semua' ? 0 : sz)}
                itemLabel="mata kuliah"
              />
            </div>
          </>
        )}
      </div>

      {/* Modal Dialog Form (Tambah / Edit) */}
      <CourseFormModal
        key={modalKey}
        open={modalOpen}
        mode={modalMode}
        initialForm={form}
        saving={saving}
        errors={formErrors}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFormSubmit}
      />

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
