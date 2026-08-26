import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import { FormSelect } from '../../components/FormSelect'
import {
  ProdiFilterDropdown,
  SemesterFilterDropdown,
  StatusFilterDropdown,
} from '../../components/admin/AdminFilterDropdowns'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { addDocument, deleteDocument, updateDocument } from '../../lib/adminData'
import { publishDocuments, appendHistory } from '../../lib/publishHelpers'
import { parseWorkbook } from '../../lib/xlsxParser'
import { PRODIS } from '../../constants/academicConstants'

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

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export default function ManageExams() {
  const { data: exams, loading } = useFirestore('ujian')
  const { data: courses } = useFirestore('mataKuliah')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

  // Filter States
  const [search, setSearch] = useState('')
  const [jenisFilter, setJenisFilter] = useState('Semua') // Semua | UTS | UAS
  const [prodiFilter, setProdiFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

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
        if (semesterFilter && String(e.semester) !== semesterFilter) return false
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
      .sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)) || String(a.jam).localeCompare(String(b.jam)))
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
      if (e.key === 'Escape' && selectedIds.size > 0 && !modalOpen && !deleteTarget && !bulkDeleteOpen) {
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
    if (!Number.isInteger(Number(values.semester)) || values.semester < 1 || values.semester > 14) {
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
        setBanner({ ok: true, message: `Jadwal ujian ${kodeMK} berhasil ditambahkan sebagai draft.` })
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
        setBanner({ ok: false, message: 'Tidak ada baris ujian terbaca dari file spreadsheet tersebut.' })
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

  // Excel Template Download
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

  // Export Exams to Excel
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
    XLSX.writeFile(wb, `Jadwal_Ujian_${jenisFilter}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="space-y-6 pb-16 animate-fade-in w-full max-w-full overflow-x-hidden">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header & Live Quick Stats — 1 Horizontal Row on Desktop */}
      <header className="flex flex-col gap-2.5 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 tablet:h-11 tablet:w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 shadow-xs dark:bg-amber-500/25 dark:text-amber-400">
            <Icon name="event_note" size={22} />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl tablet:text-2xl font-bold tracking-tight text-on-surface">
              Kelola Jadwal Ujian
            </h1>
            <p className="text-[11.5px] tablet:text-body-xs font-normal text-on-surface-variant truncate">
              Jadwal pelaksanaan UTS & UAS per semester, prodi & ruang
            </p>
          </div>
        </div>

        {/* Right side: 3 Stat Chips + Tambah Ujian Button */}
        <div className="flex items-center gap-2 tablet:gap-2.5 shrink-0 flex-wrap tablet:flex-nowrap">
          <div className="grid grid-cols-3 gap-1.5 w-full tablet:flex tablet:w-auto tablet:gap-2">
            <div className="flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-2.5 py-1.5 tablet:px-3 tablet:py-1.5 shadow-2xs dark:bg-surface-container-low min-w-0">
              <Icon name="calendar_month" size={16} className="text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant leading-none">Total</p>
                <p className="text-body-sm font-bold text-on-surface leading-tight mt-0.5">{stats.total}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-2.5 py-1.5 tablet:px-3 tablet:py-1.5 shadow-2xs dark:bg-surface-container-low min-w-0">
              <Icon name="quiz" size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant leading-none">Sesi UTS</p>
                <p className="text-body-sm font-bold text-on-surface leading-tight mt-0.5">{stats.uts}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-2.5 py-1.5 tablet:px-3 tablet:py-1.5 shadow-2xs dark:bg-surface-container-low min-w-0">
              <Icon name="workspace_premium" size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant leading-none">Sesi UAS</p>
                <p className="text-body-sm font-bold text-on-surface leading-tight mt-0.5">{stats.uas}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={openAdd}
            className="rounded-2xl px-3.5 py-2 font-bold shadow-xs cursor-pointer text-body-xs shrink-0"
            title="Tambah Jadwal Ujian"
            aria-label="Tambah Ujian"
          >
            <Icon name="add" size={16} className="mr-1" />
            <span>Tambah Ujian</span>
          </Button>
        </div>
      </header>

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
            <Button onClick={confirmImport} disabled={busy} className="rounded-xl px-4 py-2 font-bold text-body-xs">
              <Icon name="save" size={16} className="mr-1" />
              Ya, Impor Sebagai Draft
            </Button>
            <Button variant="secondary" onClick={() => setImported(null)} className="rounded-xl px-4 py-2 text-body-xs">
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* ── 2. Master Exams Management (Unified Single Card Container) ── */}
      <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-3.5 tablet:p-4 shadow-xs dark:bg-surface-container-low dark:border-outline-variant/15 flex-1 flex flex-col min-h-0 space-y-2.5">
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
              placeholder="Cari kode MK, prodi, ruang, tanggal, mata kuliah…"
              aria-label="Cari jadwal ujian"
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
            {/* Segmented Jenis Ujian Tabs */}
            <div className="flex items-center rounded-2xl border border-outline-variant/25 bg-surface-container-low/60 p-0.5 dark:bg-surface-container-high/30 shrink-0">
              {['Semua', 'UTS', 'UAS'].map((tab) => {
                const active = jenisFilter === tab
                const count = tab === 'Semua' ? stats.total : tab === 'UTS' ? stats.uts : stats.uas
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setJenisFilter(tab)}
                    className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-body-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span>{tab}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        active
                          ? 'bg-on-primary/20 text-on-primary'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            <ProdiFilterDropdown
              selected={prodiFilter}
              onSelect={setProdiFilter}
            />

            <SemesterFilterDropdown
              selected={semesterFilter}
              onSelect={setSemesterFilter}
            />

            <StatusFilterDropdown
              selected={statusFilter}
              onSelect={setStatusFilter}
            />

            <button
              type="button"
              onClick={downloadExamTemplate}
              className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-outline-variant/30 bg-surface-container-low/60 px-2.5 py-1.5 text-body-xs font-semibold text-on-surface shadow-2xs hover:border-primary hover:text-primary cursor-pointer transition-colors"
              title="Unduh Template Excel Ujian (.xlsx)"
            >
              <Icon name="download" size={14} className="text-primary" />
              <span className="hidden desktop:inline">Template</span>
            </button>

            <button
              type="button"
              onClick={exportExamsToExcel}
              className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-outline-variant/30 bg-surface-container-low/60 px-2.5 py-1.5 text-body-xs font-semibold text-on-surface shadow-2xs hover:border-primary hover:text-primary cursor-pointer transition-colors"
              title="Ekspor Jadwal Ujian ke Excel"
            >
              <Icon name="file_download" size={14} className="text-secondary" />
              <span>Ekspor</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-outline-variant/30 bg-surface-container-low/60 px-2.5 py-1.5 text-body-xs font-semibold text-on-surface shadow-2xs hover:border-primary hover:text-primary cursor-pointer transition-colors"
              title="Impor Jadwal Ujian dari CSV/XLSX"
            >
              <Icon name="upload_file" size={14} className="text-primary" />
              <span>Impor</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setJenisFilter('Semua')
                  setProdiFilter('')
                  setSemesterFilter('')
                  setStatusFilter('')
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
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-outline-variant/15 text-label-caps uppercase font-semibold text-on-surface-variant">
            <span>Filter Aktif:</span>

            {search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 text-body-xs font-semibold text-on-surface">
                <span>Keyword: "{search}"</span>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="rounded-full p-0.5 hover:bg-surface-container-highest cursor-pointer"
                >
                  <Icon name="close" size={12} />
                </button>
              </span>
            )}

            {jenisFilter !== 'Semua' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-body-xs font-semibold text-primary">
                <span>Jenis: {jenisFilter}</span>
                <button
                  type="button"
                  onClick={() => setJenisFilter('Semua')}
                  className="rounded-full p-0.5 hover:bg-primary/20 cursor-pointer"
                >
                  <Icon name="close" size={12} />
                </button>
              </span>
            )}

            {prodiFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-body-xs font-semibold text-primary">
                <span>Prodi: {prodiFilter}</span>
                <button
                  type="button"
                  onClick={() => setProdiFilter('')}
                  className="rounded-full p-0.5 hover:bg-primary/20 cursor-pointer"
                >
                  <Icon name="close" size={12} />
                </button>
              </span>
            )}

            {semesterFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-body-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <span>Semester: {SEMESTER_OPTIONS.find((s) => s.value === semesterFilter)?.label}</span>
                <button
                  type="button"
                  onClick={() => setSemesterFilter('')}
                  className="rounded-full p-0.5 hover:bg-indigo-500/20 cursor-pointer"
                >
                  <Icon name="close" size={12} />
                </button>
              </span>
            )}

            {statusFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 text-body-xs font-semibold text-on-surface">
                <span>Status: {statusFilter}</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('')}
                  className="rounded-full p-0.5 hover:bg-surface-container-highest cursor-pointer"
                >
                  <Icon name="close" size={12} />
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

        {/* Main Content Area */}
        {loading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : filtered.length === 0 ? (
          hasActiveFilters ? (
            /* Empty Filter State */
            <div className="py-8 text-center">
              <EmptyState
                icon="search_off"
                title="Tidak ada jadwal ujian yang cocok"
                description="Coba sesuaikan kata kunci pencarian atau reset filter aktif Anda."
              />
              <div className="flex justify-center mt-4">
                <Button variant="secondary" onClick={resetAllFilters} className="cursor-pointer">
                  <Icon name="refresh" size={18} className="mr-1" />
                  Reset Semua Filter
                </Button>
              </div>
            </div>
          ) : (
            /* Empty State when no exams exist */
            <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-3">
              <EmptyState
                icon="quiz"
                title="Belum Ada Jadwal Ujian"
                description="Belum ada agenda ujian yang terdaftar untuk semester aktif ini. Tambahkan jadwal ujian baru atau impor massal dari file spreadsheet."
              />
              <div className="flex items-center justify-center gap-2 pt-1">
                <Button
                  onClick={openAdd}
                  className="rounded-2xl px-3.5 py-2 font-bold shadow-xs cursor-pointer text-body-xs"
                >
                  <Icon name="add" size={16} className="mr-1.5" />
                  <span>+ Tambah Ujian Manual</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl px-3.5 py-2 font-bold shadow-2xs cursor-pointer text-body-xs"
                >
                  <Icon name="upload_file" size={16} className="mr-1.5 text-primary" />
                  <span>Impor CSV/XLSX</span>
                </Button>
              </div>
            </div>
          )
        ) : (
          <>
            {/* Table — Desktop & Tablet with Sticky Header & Dynamic Viewport Height */}
            <div className="hidden overflow-x-hidden overflow-y-auto flex-1 min-h-0 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-2xs tablet:block dark:bg-surface-container-low w-full">
              <table className="w-full table-fixed text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-surface-container-low/95 dark:bg-surface-container-high/95 backdrop-blur-md shadow-xs">
                  <tr className="border-b border-outline-variant/15">
                    <th className="w-[4%] px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="rounded cursor-pointer"
                        aria-label="Pilih semua ujian"
                      />
                    </th>
                    <th className="w-[12%] px-3.5 py-2.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                      Kode MK
                    </th>
                    <th className="w-[24%] px-3.5 py-2.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                      Mata Kuliah & Dosen
                    </th>
                    <th className="w-[14%] px-3 py-2.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                      Prodi & Sem
                    </th>
                    <th className="w-[20%] px-3.5 py-2.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                      Tanggal & Jam
                    </th>
                    <th className="w-[10%] px-3 py-2.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                      Ruang
                    </th>
                    <th className="w-[8%] px-2 py-2.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold text-center">
                      Status
                    </th>
                    <th className="w-[8%] px-3 py-2.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {paginatedExams.map((exam) => {
                    const course = courseMap.get(String(exam.kodeMK).toUpperCase())
                    const isSelected = selectedIds.has(exam.id)
                    const isPublished = (exam.status || 'published') === 'published'

                    return (
                      <tr
                        key={exam.id}
                        className={`group transition-colors hover:bg-surface-container-low/50 dark:hover:bg-surface-container-high/20 ${
                          isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(exam.id)}
                            className="rounded cursor-pointer"
                            aria-label={`Pilih ${exam.kodeMK}`}
                          />
                        </td>

                        {/* Kode MK + Jenis Badge */}
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-body-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg shrink-0 border border-primary/20">
                              {exam.kodeMK}
                            </span>
                            <span
                              className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                                exam.jenis === 'UTS'
                                  ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20'
                                  : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20'
                              }`}
                            >
                              {exam.jenis}
                            </span>
                          </div>
                        </td>

                        {/* Mata Kuliah & Dosen */}
                        <td className="px-3.5 py-2.5">
                          <p className="font-bold text-body-sm text-on-surface truncate">
                            {course?.namaMK || exam.kodeMK}
                          </p>
                          <p className="text-body-xs font-medium text-on-surface-variant truncate mt-0.5">
                            {course?.dosen || 'Dosen pengampu'}
                          </p>
                        </td>

                        {/* Prodi & Semester */}
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-body-xs text-on-surface truncate">{exam.prodi}</p>
                          <span className="inline-flex items-center rounded-md bg-surface-container px-1.5 py-0.2 text-[10px] font-bold text-on-surface-variant mt-0.5">
                            Sem. {exam.semester}
                          </span>
                        </td>

                        {/* Tanggal & Jam */}
                        <td className="px-3.5 py-2.5">
                          <p className="font-semibold text-body-xs text-on-surface">
                            {exam.tanggal ? dateFormatter.format(new Date(`${exam.tanggal}T00:00:00`)) : '-'}
                          </p>
                          <p className="font-mono text-body-xs text-on-surface-variant mt-0.5">
                            {exam.jam}
                          </p>
                        </td>

                        {/* Ruang */}
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-surface-container px-2 py-0.5 text-label-caps font-bold text-on-surface truncate max-w-full">
                            <Icon name="meeting_room" size={12} className="text-on-surface-variant shrink-0" />
                            <span className="truncate">{exam.ruang || 'TBA'}</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-2 py-2.5 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase font-bold ${
                              isPublished
                                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                                : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!isPublished && (
                              <button
                                type="button"
                                onClick={() => handlePublish([exam.id])}
                                className="flex h-7 w-7 items-center justify-center rounded-xl text-primary hover:bg-primary/15 transition-colors cursor-pointer border border-outline-variant/15"
                                title="Publikasikan Ujian"
                              >
                                <Icon name="publish" size={15} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEdit(exam)}
                              className="flex h-7 w-7 items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer border border-outline-variant/15"
                              title={`Edit ${exam.kodeMK}`}
                            >
                              <Icon name="edit" size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(exam)}
                              className="flex h-7 w-7 items-center justify-center rounded-xl text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer border border-outline-variant/15"
                              title={`Hapus ${exam.kodeMK}`}
                            >
                              <Icon name="delete" size={15} />
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
            <div className="space-y-3 tablet:hidden overflow-y-auto flex-1 min-h-0">
              {paginatedExams.map((exam) => {
                const course = courseMap.get(String(exam.kodeMK).toUpperCase())
                const isPublished = (exam.status || 'published') === 'published'

                return (
                  <div
                    key={exam.id}
                    className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-2xs dark:bg-surface-container-low space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center rounded-xl bg-primary/10 px-2.5 py-0.5 font-mono text-label-caps font-bold text-primary border border-primary/20">
                            {exam.kodeMK}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-lg px-2 py-0.5 text-label-caps font-bold ${
                              exam.jenis === 'UTS'
                                ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                                : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {exam.jenis}
                          </span>
                          <span className="rounded-md bg-surface-container px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                            Sem. {exam.semester}
                          </span>
                        </div>
                        <h3 className="text-body-md font-bold text-on-surface mt-1.5 leading-snug">
                          {course?.namaMK || exam.kodeMK}
                        </h3>
                        <p className="text-body-xs text-on-surface-variant mt-0.5">
                          {exam.prodi} • {course?.dosen || 'Dosen pengampu'}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(exam)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary cursor-pointer border border-outline-variant/15"
                          aria-label="Edit"
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(exam)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error cursor-pointer border border-outline-variant/15"
                          aria-label="Hapus"
                        >
                          <Icon name="delete" size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/10 text-body-xs text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <Icon name="schedule" size={14} className="text-primary" />
                        <span>
                          {exam.tanggal ? dateFormatter.format(new Date(`${exam.tanggal}T00:00:00`)) : '-'} • {exam.jam}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md bg-surface-container px-2 py-0.5 text-label-caps font-semibold text-on-surface">
                          {exam.ruang || 'TBA'}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-bold ${
                            isPublished
                              ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                              : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Shared Pagination Controls inside bottom with border-t */}
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

      {/* Floating Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-primary/30 bg-surface-container-highest/95 px-5 py-3 shadow-2xl backdrop-blur-md dark:bg-surface-container-high/95 animate-fade-up">
          <div className="flex items-center gap-2 border-r border-outline-variant/30 pr-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary text-[11px] font-bold">
              {selectedIds.size}
            </span>
            <span className="text-body-xs font-bold text-on-surface">Ujian Terpilih</span>
          </div>

          <button
            type="button"
            onClick={() => handlePublish([...selectedIds])}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-body-xs font-bold text-on-primary shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Icon name="publish" size={16} />
            <span>Publikasikan</span>
          </button>

          <button
            type="button"
            onClick={() => setBulkDeleteOpen(true)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-error/10 px-3 py-1.5 text-body-xs font-bold text-error hover:bg-error/20 transition-all cursor-pointer"
          >
            <Icon name="delete" size={16} />
            <span>Hapus Terpilih</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container cursor-pointer ml-1"
            title="Batalkan Pilihan (Esc)"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
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

          {/* Modal Card */}
          <div className="relative w-full max-w-lg rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 sm:p-8 shadow-2xl dark:bg-surface-container-low dark:border-outline-variant/15 animate-fade-up">
            <header className="flex items-center justify-between pb-4 border-b border-outline-variant/15 mb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                  <Icon name={editingTarget ? 'edit_calendar' : 'add_circle'} size={22} />
                </span>
                <div>
                  <h3 className="text-title-lg font-bold text-on-surface">
                    {editingTarget ? `Edit Jadwal Ujian (${editingTarget.kodeMK})` : 'Tambah Jadwal Ujian'}
                  </h3>
                  <p className="text-body-xs text-on-surface-variant">
                    {editingTarget ? 'Perbarui informasi sesi ujian' : 'Daftarkan jadwal UTS / UAS baru'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                <Icon name="close" size={20} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Jenis & Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-body-xs font-bold text-on-surface mb-1">
                    Jenis Ujian *
                  </label>
                  <FormSelect
                    value={form.jenis}
                    onChange={(val) => setForm((f) => ({ ...f, jenis: val }))}
                    options={[
                      { value: 'UTS', label: 'UTS (Tengah Semester)' },
                      { value: 'UAS', label: 'UAS (Akhir Semester)' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-body-xs font-bold text-on-surface mb-1">
                    Mode Pelaksanaan *
                  </label>
                  <FormSelect
                    value={form.mode}
                    onChange={(val) => setForm((f) => ({ ...f, mode: val }))}
                    options={[
                      { value: 'Offline', label: 'Offline (Tatap Muka)' },
                      { value: 'Online', label: 'Online (Daring)' },
                    ]}
                  />
                </div>
              </div>

              {/* Kode MK */}
              <div>
                <label className="block text-body-xs font-bold text-on-surface mb-1">
                  Kode Mata Kuliah *
                </label>
                <input
                  type="text"
                  value={form.kodeMK}
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase()
                    const matched = courseMap.get(code)
                    setForm((f) => ({
                      ...f,
                      kodeMK: code,
                      prodi: matched?.prodi || f.prodi,
                      semester: matched?.semester || f.semester,
                    }))
                  }}
                  placeholder="mis. IF301"
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3.5 py-2 font-mono text-body-sm font-bold text-on-surface uppercase focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                  required
                />
                {form.kodeMK && courseMap.get(form.kodeMK) && (
                  <p className="text-[11px] font-semibold text-primary mt-1">
                    ✓ {courseMap.get(form.kodeMK).namaMK} ({courseMap.get(form.kodeMK).dosen || 'Dosen'})
                  </p>
                )}
              </div>

              {/* Prodi & Semester */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-body-xs font-bold text-on-surface mb-1">
                    Program Studi *
                  </label>
                  <FormSelect
                    value={form.prodi}
                    onChange={(val) => setForm((f) => ({ ...f, prodi: val }))}
                    placeholder="Pilih Prodi"
                    options={PRODIS.filter((p) => p.value).map((p) => ({
                      value: p.value,
                      label: p.label,
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-body-xs font-bold text-on-surface mb-1">
                    Semester *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={form.semester}
                    onChange={(e) => setForm((f) => ({ ...f, semester: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3.5 py-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                    required
                  />
                </div>
              </div>

              {/* Tanggal, Jam & Ruang */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="block text-body-xs font-bold text-on-surface mb-1">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    value={form.tanggal}
                    onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-2.5 py-2 text-body-xs font-semibold text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-body-xs font-bold text-on-surface mb-1">
                    Waktu / Jam *
                  </label>
                  <input
                    type="text"
                    value={form.jam}
                    onChange={(e) => setForm((f) => ({ ...f, jam: e.target.value }))}
                    placeholder="08:00 - 10:00"
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-2.5 py-2 text-body-xs font-semibold text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-body-xs font-bold text-on-surface mb-1">
                    Ruang
                  </label>
                  <input
                    type="text"
                    value={form.ruang}
                    onChange={(e) => setForm((f) => ({ ...f, ruang: e.target.value }))}
                    placeholder="R. 301 / Lab"
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-2.5 py-2 text-body-xs font-semibold text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                  />
                </div>
              </div>

              {/* Error messages */}
              {formErrors.length > 0 && (
                <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-body-xs text-error">
                  {formErrors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-outline-variant/15">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl text-body-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl px-5 py-2.5 font-bold shadow-sm text-body-xs"
                >
                  <Icon name="save" size={18} className="mr-1.5" />
                  {editingTarget ? 'Simpan Perubahan' : 'Tambah sebagai Draft'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Delete Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Jadwal Ujian?"
        description={`${deleteTarget?.kodeMK} (${deleteTarget?.jenis} • ${deleteTarget?.tanggal}) akan dihapus dari sistem.`}
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Bulk Delete Confirm Dialog */}
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
