import { useEffect, useMemo, useRef, useState } from 'react'
import { StatusBanner } from '../../components/StatusBanner'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { BulkActionBar } from '../../components/admin/BulkActionBar'

// Sub-components
import { ExamHeader } from '../../components/admin/manageExams/ExamHeader'
import { ExamToolbar } from '../../components/admin/manageExams/ExamToolbar'
import { ExamFormModal } from '../../components/admin/manageExams/ExamFormModal'
import { ExamTableSection } from '../../components/admin/manageExams/ExamTableSection'

// Hooks & Libs
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { useCampus } from '../../context/useCampus'
import { addDocument, deleteDocument, updateDocument } from '../../lib/adminData'
import { publishDocuments, appendHistory } from '../../lib/publishHelpers'
import { downloadExamTemplate, exportExamsToExcel } from '../../lib/academicExamExport'
import { ExamImportBanner } from '../../components/admin/manageExams/ExamImportBanner'
import { useExamFilters } from '../../components/admin/manageExams/useExamFilters'

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

export default function ManageExams() {
  const { data: exams, loading, error: ujianError } = useFirestore('ujian', [], { limit: 500 })
  const { data: courses } = useFirestore('mataKuliah')
  const { prodiNames } = useCampus()
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

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

  const {
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
    setCurrentPage,
    pageSize,
    setPageSize,
    safeCurrentPage,
    paginatedExams,
  } = useExamFilters(exams, courseMap)

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
    const bulkResults = await Promise.allSettled(ids.map((id) => deleteDocument('ujian', id)))
    const okCount = bulkResults.filter((r) => r.status === 'fulfilled' && r.value?.ok).length
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
      const { parseWorkbook } = await import('../../lib/xlsxParser')
      const parsed = await parseWorkbook(buffer)
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
    const importResults = await Promise.allSettled(imported.map((row) => addDocument('ujian', { ...row, status: 'draft' }, actor)))
    let okCount = 0
    let failCount = 0
    importResults.forEach((r) => {
      if (r.status === 'fulfilled' && r.value?.ok) okCount += 1
      else failCount += 1
    })
    setBusy(false)
    setImported(null)
    setBanner(
      failCount === 0
        ? { ok: true, message: `${okCount} jadwal ujian diimpor sebagai draft.` }
        : { ok: false, message: `${okCount} berhasil, ${failCount} gagal disimpan.` },
    )
  }

  async function handleDownloadTemplate() {
    await downloadExamTemplate()
  }

  async function handleExportExams() {
    const res = await exportExamsToExcel(filtered, courseMap, jenisFilter)
    if (res?.message) {
      setBanner({ ok: false, message: res.message })
    }
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

      {ujianError && <StatusBanner ok={false} message={`Gagal memuat ujian: ${ujianError.message || ujianError.code || 'Unknown error'}`} onClose={() => {}} />}
      {/* Banner */}
      {banner && (
        <StatusBanner
          ok={banner.ok}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* Preview Impor Excel */}
      <ExamImportBanner
        imported={imported}
        confirmImport={confirmImport}
        busy={busy}
        setImported={setImported}
      />

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
          onDownloadTemplate={handleDownloadTemplate}
          onExportExcel={handleExportExams}
          onOpenImport={() => fileInputRef.current?.click()}
        />

        {/* Main Exam Table / Cards / Empty / Pagination */}
        <ExamTableSection
          loading={loading}
          filtered={filtered}
          hasActiveFilters={hasActiveFilters}
          resetAllFilters={resetAllFilters}
          openAdd={openAdd}
          onOpenImport={() => fileInputRef.current?.click()}
          paginatedExams={paginatedExams}
          courseMap={courseMap}
          selectedIds={selectedIds}
          toggleSelectAll={toggleSelectAll}
          toggleSelectOne={toggleSelectOne}
          handlePublish={handlePublish}
          openEdit={openEdit}
          setDeleteTarget={setDeleteTarget}
          safeCurrentPage={safeCurrentPage}
          pageSize={pageSize}
          setCurrentPage={setCurrentPage}
          setPageSize={setPageSize}
        />
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
