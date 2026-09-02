import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import { BulkActionBar } from '../../components/admin/BulkActionBar'

// Sub-components
import { ExamHeader } from '../../components/admin/manageExams/ExamHeader'
import { ExamToolbar } from '../../components/admin/manageExams/ExamToolbar'
import { ExamTable } from '../../components/admin/manageExams/ExamTable'
import { ExamCards } from '../../components/admin/manageExams/ExamCards'
import { ExamFormModal } from '../../components/admin/manageExams/ExamFormModal'

// Hooks & Libs
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { useCampus } from '../../context/useCampus'
import { addDocument, deleteDocument, updateDocument } from '../../lib/adminData'
import { publishDocuments, appendHistory } from '../../lib/publishHelpers'
import { parseWorkbook } from '../../lib/xlsxParser'

const EMPTY_FORM = {
  jenis: 'UTS',
  prodi: '',
  semester: 1,
  kodeMK: '',
  tanggal: '',
  jam: '',
  ruang: '',
  mode: 'Offline',
}

const BASE_SEMESTER_GROUPS = [
  { label: 'Semua Semester', value: '' },
  { label: 'Semester Ganjil', value: 'ganjil' },
  { label: 'Semester Genap', value: 'genap' },
]

export default function ManageExams() {
  const { data: exams, loading } = useFirestore('ujian')
  const { data: courses } = useFirestore('mataKuliah')
  const { prodiNames } = useCampus()
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

  // Filter States
  const [search, setSearch] = useState('')
  const [jenisFilter, setJenisFilter] = useState('Semua') // Semua | UTS | UAS
  const [prodiFilter, setProdiFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Opsi B: semester hanya yang ada data
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

  // Selection & Modal States
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [form, setForm] = useState(EMPTY_FORM)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState(null)
  const [formErrors, setFormErrors] = useState([])
  const [banner, setBanner] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [imported, setImported] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef(null)

  // Map Courses for lookup
  const courseMap = useMemo(() => {
    const map = new Map()
    for (const c of courses) {
      map.set(String(c.kodeMK).toUpperCase(), c)
    }
    return map
  }, [courses])

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
    const q = search.trim().toLowerCase()
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
  }, [exams, jenisFilter, prodiFilter, semesterFilter, statusFilter, search, courseMap])

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

  // Keyboard shortcut: Esc to clear selection
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        e.key === 'Escape' &&
        selectedIds.size > 0 &&
        !modalOpen &&
        !deleteTarget &&
        !bulkDeleteOpen
      ) {
        setSelectedIds(new Set())
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIds.size, modalOpen, deleteTarget, bulkDeleteOpen])

  // Bulk Selection Handlers
  function toggleSelectAll() {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((item) => item.id)))
    }
  }

  function toggleSelectOne(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Form Validation & Modal
  function validate(values) {
    const errors = []
    if (!values.kodeMK.trim()) errors.push('Kode MK wajib diisi')
    if (!values.prodi.trim()) errors.push('Program studi wajib diisi')
    if (
      !Number.isInteger(Number(values.semester)) ||
      values.semester < 1 ||
      values.semester > 14
    ) {
      errors.push('Semester harus angka bulat 1-14')
    }
    if (!values.tanggal) errors.push('Tanggal ujian wajib dipilih')
    if (!values.jam) errors.push('Jam ujian wajib diisi')
    return errors
  }

  function openAdd() {
    setEditingTarget(null)
    setForm(EMPTY_FORM)
    setFormErrors([])
    setModalOpen(true)
  }

  function openEdit(exam) {
    setEditingTarget(exam)
    setForm({
      jenis: exam.jenis || 'UTS',
      prodi: exam.prodi ?? '',
      semester: Number(exam.semester) || 1,
      kodeMK: exam.kodeMK ?? '',
      tanggal: String(exam.tanggal ?? '').slice(0, 10),
      jam: exam.jam ?? '',
      ruang: exam.ruang ?? '',
      mode: exam.mode ?? 'Offline',
    })
    setFormErrors([])
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = validate(form)
    setFormErrors(errors)
    if (errors.length > 0) return

    setBusy(true)
    const kodeMK = form.kodeMK.trim().toUpperCase()
    const data = {
      ...form,
      semester: Number(form.semester),
      kodeMK,
    }

    if (editingTarget) {
      const result = await updateDocument('ujian', editingTarget.id, data, actor)
      if (result.ok) {
        await appendHistory({
          entitas: 'ujian',
          field: 'edit',
          nilaiLama: editingTarget,
          nilaiBaru: data,
          aktor: actor,
          detail: `Update jadwal ujian ${kodeMK} (${data.jenis})`,
        })
        setBanner({ ok: true, message: `Jadwal ujian ${kodeMK} berhasil diperbarui.` })
        setModalOpen(false)
      } else {
        setBanner({ ok: false, message: result.error })
      }
    } else {
      const result = await addDocument('ujian', { ...data, status: 'draft' }, actor)
      if (result.ok) {
        await appendHistory({
          entitas: 'ujian',
          field: 'tambah',
          nilaiLama: null,
          nilaiBaru: data,
          aktor: actor,
          detail: `Tambah jadwal ujian ${kodeMK} (${data.jenis} - Draft)`,
        })
        setBanner({
          ok: true,
          message: `Jadwal ujian ${kodeMK} berhasil ditambahkan sebagai draft.`,
        })
        setModalOpen(false)
      } else {
        setBanner({ ok: false, message: result.error })
      }
    }
    setBusy(false)
  }

  async function handlePublish(ids) {
    setBusy(true)
    const result = await publishDocuments('ujian', ids, actor)
    setBusy(false)
    if (result.ok) {
      setBanner({ ok: true, message: `${result.publishedCount} jadwal ujian dipublikasikan.` })
      setSelectedIds(new Set())
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    const result = await deleteDocument('ujian', target.id)
    setDeleteTarget(null)
    if (result.ok) {
      await appendHistory({
        entitas: 'ujian',
        field: 'hapus',
        nilaiLama: target,
        nilaiBaru: null,
        aktor: actor,
        detail: `Hapus jadwal ujian ${target.kodeMK} (${target.jenis})`,
      })
      setBanner({ ok: true, message: `Jadwal ujian ${target.kodeMK} dihapus.` })
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    setBusy(true)
    let okCount = 0
    for (const id of ids) {
      const res = await deleteDocument('ujian', id)
      if (res.ok) okCount += 1
    }
    setBusy(false)
    setBulkDeleteOpen(false)
    setSelectedIds(new Set())
    setBanner({ ok: true, message: `${okCount} jadwal ujian berhasil dihapus.` })
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      const buffer = await file.arrayBuffer()
      const parsed = parseWorkbook(buffer)
      if (parsed.exams.length === 0) {
        setBanner({
          ok: false,
          message: 'Tidak ada baris ujian terbaca dari file spreadsheet tersebut.',
        })
        return
      }
      setImported(parsed.exams)
    } catch (err) {
      setBanner({ ok: false, message: `Gagal membaca file: ${err?.message ?? err}` })
    }
  }

  async function confirmImport() {
    if (!imported) return
    setBusy(true)
    let okCount = 0
    let failCount = 0
    for (const row of imported) {
      const result = await addDocument('ujian', { ...row, status: 'draft' }, actor)
      if (result.ok) okCount += 1
      else failCount += 1
    }
    setBusy(false)
    setImported(null)
    setBanner(
      failCount === 0
        ? { ok: true, message: `${okCount} jadwal ujian diimpor sebagai draft.` }
        : { ok: false, message: `${okCount} berhasil, ${failCount} gagal disimpan.` },
    )
  }

  function downloadExamTemplate() {
    const templateData = [
      {
        jenis: 'UTS',
        prodi: 'Informatika',
        semester: 3,
        kodeMK: 'IF301',
        tanggal: '2026-10-15',
        jam: '08:00 - 10:00',
        ruang: 'Lab Komputer 1',
        mode: 'Offline',
      },
      {
        jenis: 'UAS',
        prodi: 'Bisnis Digital',
        semester: 1,
        kodeMK: 'BD102',
        tanggal: '2026-12-20',
        jam: '10:30 - 12:30',
        ruang: 'R. 302',
        mode: 'Offline',
      },
    ]
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Ujian')
    XLSX.writeFile(wb, 'Template_Jadwal_Ujian.xlsx')
  }

  function exportExamsToExcel() {
    if (filtered.length === 0) {
      setBanner({ ok: false, message: 'Tidak ada data jadwal ujian untuk diekspor.' })
      return
    }
    const exportData = filtered.map((e) => {
      const course = courseMap.get(String(e.kodeMK).toUpperCase())
      return {
        'Jenis Ujian': e.jenis,
        'Program Studi': e.prodi,
        Semester: e.semester,
        'Kode MK': e.kodeMK,
        'Nama Mata Kuliah': course?.namaMK || '-',
        'Dosen Pengampu': course?.dosen || '-',
        Tanggal: e.tanggal,
        Waktu: e.jam,
        Ruangan: e.ruang || '-',
        Mode: e.mode || 'Offline',
        Status: (e.status || 'published').toUpperCase(),
      }
    })
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Jadwal_Ujian')
    XLSX.writeFile(
      wb,
      `Jadwal_Ujian_${jenisFilter}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    )
  }

  return (
    <div className="h-full flex flex-col gap-4 tablet:gap-4 pb-20 tablet:pb-0 w-full max-w-full overflow-x-hidden min-h-0 flex-1 animate-fade-in">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── 1. Page Header ── */}
      <ExamHeader
        stats={stats}
        onOpenAdd={openAdd}
      />

      {/* Banner */}
      {banner && (
        <StatusBanner
          ok={banner.ok}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* Preview Impor Excel */}
      {imported && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-primary/30 bg-primary/10 p-5 dark:bg-primary/15 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary font-bold">
              <Icon name="upload_file" size={22} />
            </span>
            <div>
              <p className="text-title-sm font-bold text-on-surface">
                {imported.length} Baris Jadwal Ujian Terbaca
              </p>
              <p className="text-body-xs text-on-surface-variant">
                Simpan semua baris di atas sebagai draft untuk diperiksa sebelum dirilis.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={confirmImport}
              disabled={busy}
              className="rounded-xl px-4 py-2 font-bold text-body-xs"
            >
              <Icon name="save" size={16} className="mr-1" />
              Ya, Impor Sebagai Draft
            </Button>
            <Button
              variant="secondary"
              onClick={() => setImported(null)}
              className="rounded-xl px-4 py-2 text-body-xs"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* ── 2. Master Exams Management ── */}
      <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 tablet:p-4 shadow-level-1 dark:bg-surface-container-low dark:border-outline-variant/15 flex-1 flex flex-col min-h-0 space-y-4">
        <ExamToolbar
          search={search}
          setSearch={setSearch}
          jenisFilter={jenisFilter}
          setJenisFilter={setJenisFilter}
          prodiFilter={prodiFilter}
          setProdiFilter={setProdiFilter}
          semesterFilter={semesterFilter}
          setSemesterFilter={setSemesterFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          stats={stats}
          availableSemesterOptions={availableSemesterOptions}
          hasActiveFilters={hasActiveFilters}
          prodiOptions={prodiNames}
          onResetFilters={resetAllFilters}
          onDownloadTemplate={downloadExamTemplate}
          onExportExcel={exportExamsToExcel}
          onOpenImport={() => fileInputRef.current?.click()}
        />

        {/* Main Content Area */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : filtered.length === 0 ? (
          hasActiveFilters ? (
            <div className="py-8 text-center">
              <EmptyState
                icon="search_off"
                title="Tidak ada jadwal ujian yang cocok"
                description="Coba sesuaikan kata kunci pencarian atau reset filter aktif Anda."
              />
              <div className="flex justify-center mt-4">
                <Button
                  variant="secondary"
                  onClick={resetAllFilters}
                  className="cursor-pointer"
                >
                  <Icon name="refresh" size={18} className="mr-1" />
                  Reset Semua Filter
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-3">
              <EmptyState
                icon="quiz"
                title="Belum Ada Jadwal Ujian"
                description="Belum ada agenda ujian yang terdaftar untuk semester aktif ini. Tambahkan jadwal ujian baru atau impor massal dari file spreadsheet."
              />
              <div className="flex items-center justify-center gap-2 pt-1">
                <Button
                  onClick={openAdd}
                  className="rounded-2xl px-4 py-2 font-bold shadow-level-1 cursor-pointer text-body-xs"
                >
                  <Icon name="add" size={16} className="mr-1.5" />
                  <span>Tambah Ujian Manual</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl px-4 py-2 font-bold shadow-level-1 cursor-pointer text-body-xs"
                >
                  <Icon name="upload_file" size={16} className="mr-1.5 text-primary" />
                  <span>Impor CSV/XLSX</span>
                </Button>
              </div>
            </div>
          )
        ) : (
          <>
            <ExamTable
              paginatedExams={paginatedExams}
              courseMap={courseMap}
              selectedIds={selectedIds}
              filteredCount={filtered.length}
              onToggleSelectAll={toggleSelectAll}
              onToggleSelectOne={toggleSelectOne}
              onPublish={handlePublish}
              onOpenEdit={openEdit}
              onDeleteTarget={(exam) => setDeleteTarget(exam)}
            />

            <ExamCards
              paginatedExams={paginatedExams}
              courseMap={courseMap}
              onOpenEdit={openEdit}
              onDeleteTarget={(exam) => setDeleteTarget(exam)}
            />

            {/* Shared Pagination Controls */}
            <div className="shrink-0 pt-1.5 border-t border-outline-variant/15">
              <Pagination
                currentPage={safeCurrentPage}
                totalItems={filtered.length}
                pageSize={pageSize === 0 ? 'Semua' : pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => setPageSize(sz === 'Semua' ? 0 : sz)}
                itemLabel="sesi ujian"
              />
            </div>
          </>
        )}
      </div>

      {/* ── Floating Bulk Actions Bar ── */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onPublish={() => handlePublish([...selectedIds])}
        onDelete={() => setBulkDeleteOpen(true)}
        onClear={() => setSelectedIds(new Set())}
        isBusy={busy}
        itemLabel="Ujian"
      />

      {/* ── Modal Dialog Form (Tambah / Edit) ── */}
      <ExamFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingTarget={editingTarget}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        busy={busy}
        courseMap={courseMap}
        errors={formErrors}
      />

      {/* ── Single Delete Confirm Dialog ── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Jadwal Ujian?"
        description={`${deleteTarget?.kodeMK} (${deleteTarget?.jenis} • ${deleteTarget?.tanggal}) akan dihapus dari sistem.`}
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Bulk Delete Confirm Dialog ── */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Hapus Semua Ujian Terpilih?"
        description={`Anda akan menghapus ${selectedIds.size} sesi ujian sekaligus. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Semua"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  )
}
