import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import { CourseTable, CourseCards, CourseFormModal, CourseHeader, CourseToolbar } from '../../components/admin/manageCourses'
import { AdminPageCard } from '../../components/admin/AdminPageCard'
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
  const { data: schedules } = useFirestore('jadwal')
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

  // Opsi B: semester hanya yang ada data (support >8: 9,10,14 dst) – pool difilter TA dulu biar cascade TA→Semester
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

  const filtered = useMemo(
    () => filterCourses(courses, { search: debouncedSearch, dosenFilter, prodiFilter, semesterFilter, sksFilter, taFilter }, campus, schedules),
    [courses, debouncedSearch, dosenFilter, prodiFilter, semesterFilter, sksFilter, taFilter, campus, schedules],
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
    <div className="flex flex-col space-y-2 pb-16 tablet:pb-0 animate-fade-in w-full max-w-full overflow-hidden">
      {banner && (
        <div className="shrink-0">
          <StatusBanner
            ok={banner.ok}
            message={banner.message}
            onClose={() => setBanner(null)}
          />
        </div>
      )}

      {/* ── Single Unified Card Container (No double rounded corners) ── */}
      <AdminPageCard>
        <CourseHeader
          exportCoursesToExcel={exportCoursesToExcel}
          openAddModal={openAddModal}
        />

        {/* ── 2. Live Database Course Management ── */}
        <div className="p-3 tablet:p-3.5 flex flex-col space-y-2.5 overflow-hidden">
          <CourseToolbar
            search={search}
            setSearch={setSearch}
            prodiFilter={prodiFilter}
            setProdiFilter={setProdiFilter}
            prodiNames={prodiNames}
            taFilter={taFilter}
            setTaFilter={setTaFilter}
            availableTaOptions={availableTaOptions}
            semesterFilter={semesterFilter}
            setSemesterFilter={setSemesterFilter}
            availableSemesterOptions={availableSemesterOptions}
            dosenFilter={dosenFilter}
            setDosenFilter={setDosenFilter}
            lecturers={lecturers}
            sksFilter={sksFilter}
            setSksFilter={setSksFilter}
            sksOptions={SKS_OPTIONS}
            hasActiveFilters={hasActiveFilters}
            resetAllFilters={resetAllFilters}
          />

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
            {/* Table – Desktop & Tablet */}
            <CourseTable
              courses={paginatedCourses}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
            />

            {/* Cards – Mobile */}
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
      </AdminPageCard>

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
        description={`${deleteTarget?.kodeMK} – ${deleteTarget?.namaMK} akan dihapus dari daftar master. Jadwal yang memakai kode ini akan gagal validasi saat upload berikutnya.`}
        confirmLabel="Hapus Mata Kuliah"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
