import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import { FormSelect } from '../../components/FormSelect'
import {
  ProdiFilterDropdown,
  SemesterFilterDropdown,
  HariFilterDropdown,
  StatusFilterDropdown,
} from '../../components/admin/AdminFilterDropdowns'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { useCampus } from '../../context/CampusContext'
import { deleteDocument, setDocument, updateDocument } from '../../lib/adminData'
import { appendHistory, publishDocuments, saveSettings } from '../../lib/publishHelpers'
import { deriveTahunAjaran } from '../../lib/tahunAjaran'
import { UniversalImportModal } from '../../components/admin/UniversalImportModal'
import { OfficialNoticeboardModal } from '../../components/admin/OfficialNoticeboardModal'
import {
  CLASS_TYPE_CODES,
  DAYS,
  findConflicts,
  validateCourseEntry,
  validateScheduleEntry,
} from '../../lib/uploadValidator'
import { getClassType, TONE_CLASSES, TONE_DOT_CLASSES } from '../../lib/classTypes'
import { formatRuang } from '../../lib/scheduleUtils'

const EMPTY_SESSION = {
  prodi: '',
  semester: 1,
  hari: 'Senin',
  jamMulai: '',
  jamSelesai: '',
  kodeMK: '',
  ruang: '',
  tipeKelas: 'K1',
}

const EMPTY_COURSE = {
  kodeMK: '',
  namaMK: '',
  dosen: '',
  kontakDosen: '',
  sks: 2,
  durasi: 100,
  semester: 1,
}

const SEMESTERS = [
  { label: 'Semua Semester', value: '' },
  { label: 'Semester Ganjil (1, 3, 5, 7)', value: 'ganjil' },
  { label: 'Semester Genap (2, 4, 6, 8)', value: 'genap' },
  { label: 'Semester 1', value: '1' },
  { label: 'Semester 2', value: '2' },
  { label: 'Semester 3', value: '3' },
  { label: 'Semester 4', value: '4' },
  { label: 'Semester 5', value: '5' },
  { label: 'Semester 6', value: '6' },
  { label: 'Semester 7', value: '7' },
  { label: 'Semester 8', value: '8' },
]

export default function ManageSchedule() {
  const { data: rawSchedule, loading: loadingSchedule } = useFirestore('jadwal')
  const { data: courses } = useFirestore('mataKuliah')
  const { data: programs } = useFirestore('prodi')
  const { data: settingsDocs } = useFirestore('settings')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''
  const { prodiNames: campusProdiNames } = useCampus()

  const academicCalendar = useMemo(
    () => settingsDocs?.find((s) => s.id === 'academicCalendar'),
    [settingsDocs],
  )
  const currentTA = deriveTahunAjaran(new Date(), academicCalendar)

  // Map Mata Kuliah untuk lookup cepat
  const courseMap = useMemo(() => {
    const map = new Map()
    for (const c of courses) {
      map.set(c.kodeMK, c)
    }
    return map
  }, [courses])

  // List prodi options gabungan — prioritaskan config kampus, fallback DB + default.
  const prodiOptions = useMemo(() => {
    const fromDb = programs?.map((p) => p.nama || p.id).filter(Boolean) || []
    const fromCampus = campusProdiNames || []
    const combined = [...new Set([...fromCampus, 'Informatika', 'Bisnis Digital', 'Arsitektur', 'Teknik Sipil', 'Kewirausahaan', ...fromDb])]
    return combined.sort()
  }, [programs, campusProdiNames])

  // List existing Tahun Ajaran in system
  const existingTAs = useMemo(() => {
    const fromSchedule = rawSchedule.map((s) => s.tahunAjaran).filter(Boolean)
    return Array.from(new Set([currentTA, ...fromSchedule]))
  }, [rawSchedule, currentTA])

  // State Banner & Global Loading
  const [banner, setBanner] = useState(null)
  const [busy, setBusy] = useState(false)

  // ── State Input Manual Modal ──
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [manualForm, setManualForm] = useState(EMPTY_SESSION)
  const [manualErrors, setManualErrors] = useState([])

  // ── State Quick MK Modal ──
  const [newCourseOpen, setNewCourseOpen] = useState(false)
  const [newCourseForm, setNewCourseForm] = useState(EMPTY_COURSE)
  const [newCourseErrors, setNewCourseErrors] = useState([])
  const [savingCourse, setSavingCourse] = useState(false)

  // ── State Filter & Pencarian Database ──
  const [search, setSearch] = useState('')
  const [prodiFilter, setProdiFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [hariFilter, setHariFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // ── State Bulk Selection ──
  const [selectedIds, setSelectedIds] = useState(new Set())

  // ── State UX: Import Modal, Conflict Filter & Pagination ──
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [noticeboardModalOpen, setNoticeboardModalOpen] = useState(false)
  const [onlyShowConflicts, setOnlyShowConflicts] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // ── State Edit Jadwal Modal ──
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_SESSION)
  const [editErrors, setEditErrors] = useState([])

  // ── State Delete Dialog ──
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  // Global ESC key to deselect bulk
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (selectedIds.size > 0) setSelectedIds(new Set())
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIds.size])

  // ── Validasi Bentrok Cerdas Database (Rombel, Ruangan Spesifik, & Dosen) ──
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

  // Live Conflict Checking di Modal Tambah & Edit
  const addModalClash = useMemo(() => {
    if (!manualForm.hari || !manualForm.jamMulai || !manualForm.jamSelesai || !manualForm.kodeMK) return null
    const list = findConflicts([...rawSchedule, { ...manualForm, id: 'temp-manual' }], courseMap)
    const found = list.find((c) => c.idA === 'temp-manual' || c.idB === 'temp-manual')
    return found ? found.message : null
  }, [manualForm, rawSchedule, courseMap])

  const editModalClash = useMemo(() => {
    if (!editingItem || !editForm.hari || !editForm.jamMulai || !editForm.jamSelesai || !editForm.kodeMK) return null
    const others = rawSchedule.filter((s) => s.id !== editingItem.id)
    const list = findConflicts([...others, { ...editForm, id: editingItem.id }], courseMap)
    const found = list.find((c) => c.idA === editingItem.id || c.idB === editingItem.id)
    return found ? found.message : null
  }, [editingItem, editForm, rawSchedule, courseMap])

  // ── Filter Data Jadwal Database ──
  const filteredSchedule = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rawSchedule
      .filter((item) => (prodiFilter ? item.prodi === prodiFilter : true))
      .filter((item) => {
        if (!semesterFilter) return true
        const sem = Number(item.semester)
        if (semesterFilter === 'ganjil') return sem % 2 === 1
        if (semesterFilter === 'genap') return sem % 2 === 0
        return sem === Number(semesterFilter)
      })
      .filter((item) => (hariFilter ? item.hari === hariFilter : true))
      .filter((item) => (statusFilter ? (item.status || 'published') === statusFilter : true))
      .filter((item) => (onlyShowConflicts ? conflictMap.has(item.id) : true))
      .filter((item) => {
        if (!q) return true
        const course = courseMap.get(item.kodeMK)
        const matchStr = `${item.kodeMK} ${course?.namaMK ?? ''} ${course?.dosen ?? ''} ${item.prodi} ${item.ruang ?? ''} ${item.hari}`.toLowerCase()
        return matchStr.includes(q)
      })
      .sort((a, b) => {
        const dayOrder = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6, Minggu: 7 }
        const dayDiff = (dayOrder[a.hari] || 99) - (dayOrder[b.hari] || 99)
        if (dayDiff !== 0) return dayDiff
        return String(a.jamMulai).localeCompare(String(b.jamMulai))
      })
  }, [rawSchedule, prodiFilter, semesterFilter, hariFilter, statusFilter, onlyShowConflicts, conflictMap, search, courseMap])

  // ── Paginasi Data Jadwal (Auto-clamped during render) ──
  const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredSchedule.length / pageSize) || 1
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages))
  const paginatedSchedule = useMemo(() => {
    if (pageSize === 0) return filteredSchedule
    const start = (safeCurrentPage - 1) * pageSize
    return filteredSchedule.slice(start, start + pageSize)
  }, [filteredSchedule, safeCurrentPage, pageSize])

  function jadwalDocId(entry) {
    return [
      entry.prodi,
      Number(entry.semester),
      entry.hari,
      entry.jamMulai,
      entry.kodeMK,
      entry.tipeKelas,
    ]
      .join('|')
      .replace(/[/#?[\]]/g, '-')
  }

  // ── Handler Impor Jadwal Universal (Multi-Format & OCR) ──
  async function handleUniversalImportSave(parsedData) {
    setBusy(true)
    const targetTA = parsedData.tahunAjaran || currentTA

    // 1. Simpan Master MK jika ada MK baru
    for (const c of parsedData.courses || []) {
      if (c.kodeMK) {
        await setDocument('mataKuliah', c.kodeMK, c, actor)
      }
    }

    // 2. Publikasikan Jadwal
    const scheduleDocs = (parsedData.scheduleEntries || []).map((e) => ({
      id: jadwalDocId(e),
      ...e,
      tahunAjaran: targetTA,
      status: 'published',
    }))
    const res = await publishDocuments('jadwal', scheduleDocs, actor)

    // 3. Publikasikan Ujian jika ada
    if (parsedData.exams && parsedData.exams.length > 0) {
      const examDocs = parsedData.exams.map((ex) => ({
        id: `${ex.prodi}|${ex.kodeMK}|${ex.jenis}|${ex.tanggal}`.replace(/[/#?[\]]/g, '-'),
        ...ex,
        tahunAjaran: targetTA,
        status: 'published',
      }))
      await publishDocuments('ujian', examDocs, actor)
    }

    setBusy(false)
    if (res.ok) {
      await saveSettings({ lastUpdated: new Date().toISOString() }, actor)
      await appendHistory({
        entitas: 'jadwal',
        field: 'upload_universal',
        nilaiLama: null,
        nilaiBaru: { count: scheduleDocs.length, tahunAjaran: targetTA },
        aktor: actor,
        detail: `Impor jadwal universal TA ${targetTA} (${scheduleDocs.length} jadwal)`,
      })
      setBanner({
        ok: true,
        message: `Berhasil mengimpor & mempublikasikan ${scheduleDocs.length} sesi jadwal untuk TA ${targetTA}!`,
      })
      setImportModalOpen(false)
    } else {
      setBanner({ ok: false, message: res.error || 'Gagal menyimpan berkas jadwal' })
    }
  }

  // ── Handler Tambah Sesi Manual ──
  async function handleAddManualSession(e) {
    e.preventDefault()
    const errors = validateScheduleEntry(manualForm)
    setManualErrors(errors)
    if (errors.length > 0) return

    setBusy(true)
    const docId = jadwalDocId(manualForm)
    const newDoc = {
      ...manualForm,
      semester: Number(manualForm.semester),
      tahunAjaran: currentTA,
      status: 'published',
    }

    const result = await setDocument('jadwal', docId, newDoc, actor)
    setBusy(false)
    if (result.ok) {
      await appendHistory({
        entitas: 'jadwal',
        field: 'tambah_manual',
        nilaiLama: null,
        nilaiBaru: newDoc,
        aktor: actor,
        detail: `Tambah jadwal manual ${newDoc.kodeMK} (${newDoc.hari} ${newDoc.jamMulai})`,
      })
      setBanner({ ok: true, message: `Sesi jadwal ${newDoc.kodeMK} (${newDoc.hari}) berhasil disimpan!` })
      setManualForm(EMPTY_SESSION)
      setManualErrors([])
      setAddModalOpen(false)
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  // ── Handler Buat MK Cepat ──
  async function handleSaveNewCourse(e) {
    e.preventDefault()
    const errors = validateCourseEntry(newCourseForm)
    setNewCourseErrors(errors)
    if (errors.length > 0) return

    setSavingCourse(true)
    const kodeMK = newCourseForm.kodeMK.trim().toUpperCase()
    const result = await setDocument('mataKuliah', kodeMK, { ...newCourseForm, kodeMK }, actor)
    setSavingCourse(false)
    if (result.ok) {
      await appendHistory({
        entitas: 'mataKuliah',
        field: 'tambah',
        nilaiLama: null,
        nilaiBaru: newCourseForm,
        aktor: actor,
        detail: `Tambah MK baru ${kodeMK}`,
      })
      setBanner({ ok: true, message: `Mata kuliah ${kodeMK} berhasil ditambahkan!` })
      setManualForm((f) => ({ ...f, kodeMK }))
      setNewCourseForm(EMPTY_COURSE)
      setNewCourseOpen(false)
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  // ── Handler Edit Jadwal ──
  function openEditModal(item) {
    setEditingItem(item)
    setEditForm({
      prodi: item.prodi,
      semester: item.semester,
      hari: item.hari,
      jamMulai: item.jamMulai,
      jamSelesai: item.jamSelesai,
      kodeMK: item.kodeMK,
      ruang: item.ruang ?? '',
      tipeKelas: item.tipeKelas ?? 'K1',
      status: item.status ?? 'published',
    })
    setEditErrors([])
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    const errors = validateScheduleEntry(editForm)
    setEditErrors(errors)
    if (errors.length > 0) return

    setBusy(true)
    const updatedData = {
      ...editForm,
      semester: Number(editForm.semester),
    }

    const result = await updateDocument('jadwal', editingItem.id, updatedData, actor)
    setBusy(false)
    if (result.ok) {
      await appendHistory({
        entitas: 'jadwal',
        field: 'edit',
        nilaiLama: editingItem,
        nilaiBaru: updatedData,
        aktor: actor,
        detail: `Edit jadwal ${editingItem.kodeMK} (${updatedData.hari} ${updatedData.jamMulai})`,
      })
      setBanner({ ok: true, message: `Jadwal ${editingItem.kodeMK} berhasil diperbarui!` })
      setEditingItem(null)
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  // ── Handler Duplikasi Sesi ──
  function handleDuplicate(item) {
    const nextType = item.tipeKelas === 'K1' ? 'K2' : item.tipeKelas === 'K2' ? 'K3' : 'K1'
    setManualForm({
      prodi: item.prodi,
      semester: item.semester,
      hari: item.hari,
      jamMulai: item.jamMulai,
      jamSelesai: item.jamSelesai,
      kodeMK: item.kodeMK,
      ruang: item.ruang,
      tipeKelas: nextType,
    })
    setManualErrors([])
    setAddModalOpen(true)
  }

  // ── Handler Hapus Jadwal ──
  async function handleDeleteSingle() {
    if (!deleteTarget) return
    const target = deleteTarget
    setBusy(true)
    const result = await deleteDocument('jadwal', target.id)
    setBusy(false)
    setDeleteTarget(null)
    if (result.ok) {
      await appendHistory({
        entitas: 'jadwal',
        field: 'hapus',
        nilaiLama: target,
        nilaiBaru: null,
        aktor: actor,
        detail: `Hapus jadwal ${target.kodeMK} (${target.hari})`,
      })
      setBanner({ ok: true, message: `Jadwal ${target.kodeMK} berhasil dihapus!` })
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  // ── Bulk Actions Handler ──
  function toggleSelectAll() {
    if (selectedIds.size === filteredSchedule.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredSchedule.map((item) => item.id)))
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

  async function handleBulkStatusChange(newStatus) {
    if (selectedIds.size === 0) return
    setBusy(true)
    let successCount = 0
    for (const id of selectedIds) {
      const res = await updateDocument('jadwal', id, { status: newStatus }, actor)
      if (res.ok) successCount += 1
    }
    setBusy(false)
    await appendHistory({
      entitas: 'jadwal',
      field: 'bulk_status',
      nilaiLama: null,
      nilaiBaru: { status: newStatus, count: successCount },
      aktor: actor,
      detail: `Mengubah status ${successCount} jadwal menjadi ${newStatus}`,
    })
    setBanner({
      ok: true,
      message: `Berhasil mengubah status ${successCount} jadwal menjadi ${newStatus}!`,
    })
    setSelectedIds(new Set())
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    setBusy(true)
    let deletedCount = 0
    for (const id of selectedIds) {
      const res = await deleteDocument('jadwal', id)
      if (res.ok) deletedCount += 1
    }
    setBusy(false)
    setBulkDeleteOpen(false)
    await appendHistory({
      entitas: 'jadwal',
      field: 'bulk_delete',
      nilaiLama: null,
      nilaiBaru: { count: deletedCount },
      aktor: actor,
      detail: `Hapus massal ${deletedCount} jadwal`,
    })
    setBanner({ ok: true, message: `Berhasil menghapus ${deletedCount} jadwal terpilih!` })
    setSelectedIds(new Set())
  }

  // ── Template & Export Helpers ──
  function downloadTemplate() {
    const templateData = [
      {
        Prodi: 'Informatika',
        Semester: 2,
        Hari: 'Senin',
        'Jam Mulai': '08:00',
        'Jam Selesai': '10:30',
        'Kode MK': 'IF201',
        'Nama MK': 'Pemrograman Berorientasi Objek',
        Dosen: 'Dr. Ahmad Sutanto, M.Kom.',
        Ruang: 'Lab Komputer 1',
        'Tipe Kelas': 'K1',
      },
      {
        Prodi: 'Informatika',
        Semester: 2,
        Hari: 'Selasa',
        'Jam Mulai': '13:00',
        'Jam Selesai': '15:30',
        'Kode MK': 'IF202',
        'Nama MK': 'Struktur Data & Algoritma',
        Dosen: 'Budi Santoso, M.T.',
        Ruang: 'R. 302',
        'Tipe Kelas': 'K1',
      },
    ]
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Jadwal Perkuliahan')
    XLSX.writeFile(wb, 'Template_Jadwal_Kampus.xlsx')
  }

  function exportCurrentSchedule() {
    if (filteredSchedule.length === 0) {
      setBanner({ ok: false, message: 'Tidak ada data jadwal untuk diekspor.' })
      return
    }
    const exportData = filteredSchedule.map((item) => {
      const course = courseMap.get(item.kodeMK)
      return {
        Hari: item.hari,
        'Jam Mulai': item.jamMulai,
        'Jam Selesai': item.jamSelesai,
        Prodi: item.prodi,
        Semester: item.semester,
        'Kode MK': item.kodeMK,
        'Nama Mata Kuliah': course?.namaMK || item.kodeMK,
        'Dosen Pengampu': course?.dosen || '-',
        Ruang: item.ruang || '-',
        'Tipe Kelas': item.tipeKelas || 'K1',
        Status: item.status || 'published',
        'Tahun Ajaran': item.tahunAjaran || currentTA,
      }
    })
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Jadwal')
    XLSX.writeFile(wb, `Jadwal_Kuliah_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="h-full flex flex-col space-y-2.5 tablet:space-y-3 pb-20 tablet:pb-0 animate-fade-in w-full max-w-full overflow-hidden min-h-0 flex-1">
      {/* ── 1. Page Header (Icon, Title, Stat Chips, Action Buttons) — 1 Horizontal Row on Desktop ── */}
      <header className="flex flex-col gap-2.5 desktop:flex-row desktop:items-center desktop:justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 tablet:h-11 tablet:w-11 shrink-0 items-center justify-center rounded-2xl bg-tertiary/10 text-tertiary shadow-xs">
            <Icon name="calendar_month" size={22} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl tablet:text-2xl font-bold tracking-tight text-on-surface">
                Kelola Jadwal
              </h1>
              <span className="inline-flex items-center gap-1 font-mono text-label-caps font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                TA {currentTA}
              </span>
            </div>
            <p className="text-[11.5px] tablet:text-body-xs font-normal text-on-surface-variant truncate">
              Unggah spreadsheet master, tambah sesi, atau edit jadwal.
            </p>
          </div>
        </div>

        {/* Right side: Stat Chips (Published, Draft, Bentrok) + Import + Tambah Sesi */}
        <div className="flex items-center gap-2 tablet:gap-2.5 shrink-0 flex-wrap tablet:flex-nowrap">
          <div className="grid grid-cols-2 tablet:flex tablet:w-auto gap-1.5 tablet:gap-2">
            <div className="flex items-center gap-1.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 shadow-2xs min-w-0">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-body-xs font-bold text-emerald-700 dark:text-emerald-300 truncate">
                {rawSchedule.filter((s) => (s.status || 'published') === 'published').length} Published
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 shadow-2xs min-w-0">
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
              <span className="text-body-xs font-bold text-amber-700 dark:text-amber-300 truncate">
                {rawSchedule.filter((s) => (s.status || 'published') === 'draft').length} Draft
              </span>
            </div>

            {conflictMap.size > 0 && (
              <button
                type="button"
                onClick={() => setOnlyShowConflicts(!onlyShowConflicts)}
                className={`flex items-center gap-1.5 rounded-2xl border px-2.5 py-1.5 shadow-2xs min-w-0 transition-all cursor-pointer ${
                  onlyShowConflicts
                    ? 'bg-error text-on-error border-error'
                    : 'border-error/30 bg-error/10 text-error hover:bg-error/20'
                }`}
                title={onlyShowConflicts ? 'Tampilkan Semua Jadwal' : 'Klik untuk Hanya Tampilkan Jadwal Bentrok'}
              >
                <Icon name="warning" size={14} className="shrink-0" />
                <span className="text-body-xs font-bold truncate">{conflictMap.size} Bentrok</span>
              </button>
            )}
          </div>

          <Button
            variant="secondary"
            onClick={() => setNoticeboardModalOpen(true)}
            className="rounded-2xl px-3.5 py-2 font-bold shadow-2xs cursor-pointer text-body-xs shrink-0"
            title="Cetak Jadwal Format Mading A4 Landscape Resmi"
            aria-label="Cetak Mading"
          >
            <Icon name="table_chart" size={16} className="mr-1 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden tablet:inline">Cetak Mading</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => setImportModalOpen(true)}
            className="rounded-2xl px-3.5 py-2 font-bold shadow-2xs cursor-pointer text-body-xs shrink-0"
            title="Import Spreadsheet Master (.xlsx / .csv)"
            aria-label="Import Spreadsheet"
          >
            <Icon name="upload_file" size={16} className="mr-1 text-primary" />
            <span className="hidden tablet:inline">Import</span>
          </Button>

          <Button
            onClick={() => {
              setManualForm(EMPTY_SESSION)
              setManualErrors([])
              setAddModalOpen(true)
            }}
            className="rounded-2xl px-3.5 py-2 font-bold shadow-xs cursor-pointer text-body-xs shrink-0"
            title="Tambah Sesi Manual"
            aria-label="Tambah Sesi"
          >
            <Icon name="add" size={16} className="mr-1" />
            <span>Tambah Sesi</span>
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

      {/* ── 2. Live Database Schedule Management (Unified 1-Row Toolbar) ── */}
      <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-3.5 tablet:p-4 shadow-xs dark:bg-surface-container-low dark:border-outline-variant/15 flex-1 flex flex-col min-h-0 space-y-2.5">
        {/* Unified Search & Filters in 1 Row on Desktop */}
        <div className="relative z-30 flex flex-col gap-2 tablet:flex-row tablet:items-center">
          {/* Search Input */}
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
              placeholder="Cari mata kuliah, dosen, ruang, prodi, hari…"
              className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 py-1.5 tablet:py-2 pl-9 pr-8 text-body-xs tablet:text-body-sm font-medium text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:bg-surface focus:outline-none dark:bg-surface-container-high/30 transition-all shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:bg-surface-container rounded-full p-1 cursor-pointer"
              >
                <Icon name="close" size={13} />
              </button>
            )}
          </div>

          {/* Custom Popover Filter Dropdowns + Template & Ekspor */}
          <div className="flex items-center gap-1.5 overflow-x-auto tablet:overflow-visible no-scrollbar w-full tablet:w-auto shrink-0 pb-0.5 tablet:pb-0 relative z-30">
            <ProdiFilterDropdown
              prodiOptions={prodiOptions}
              selected={prodiFilter}
              onSelect={setProdiFilter}
            />

            <SemesterFilterDropdown
              selected={semesterFilter}
              onSelect={setSemesterFilter}
            />

            <HariFilterDropdown
              selected={hariFilter}
              onSelect={setHariFilter}
            />

            <StatusFilterDropdown
              selected={statusFilter}
              onSelect={setStatusFilter}
            />

            {conflictsList.length > 0 && (
              <button
                type="button"
                onClick={() => setOnlyShowConflicts((prev) => !prev)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-body-xs font-bold transition-all cursor-pointer shadow-xs ${
                  onlyShowConflicts
                    ? 'bg-error text-white border-error ring-2 ring-error/30'
                    : 'bg-error/10 text-error border-error/30 hover:bg-error/20'
                }`}
                title="Filter hanya menampilkan jadwal yang bertabrakan / bentrok"
              >
                <Icon name="warning" size={14} />
                <span>Bentrok ({conflictsList.length})</span>
              </button>
            )}

            {(search || prodiFilter || semesterFilter || hariFilter || statusFilter || onlyShowConflicts) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setProdiFilter('')
                  setSemesterFilter('')
                  setHariFilter('')
                  setStatusFilter('')
                  setOnlyShowConflicts(false)
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-error/30 bg-error/10 px-2.5 py-1.5 text-body-xs font-bold text-error hover:bg-error/20 cursor-pointer transition-colors"
              >
                <Icon name="refresh" size={13} />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-outline-variant/30 bg-surface-container-low/60 px-2.5 py-1.5 text-body-xs font-bold text-on-surface shadow-2xs hover:border-primary hover:text-primary cursor-pointer transition-colors"
              title="Download Template Format Excel"
            >
              <Icon name="download" size={14} className="text-primary" />
              <span className="hidden desktop:inline">Template</span>
            </button>

            <button
              type="button"
              onClick={exportCurrentSchedule}
              className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-outline-variant/30 bg-surface-container-low/60 px-2.5 py-1.5 text-body-xs font-bold text-on-surface shadow-2xs hover:border-primary hover:text-primary cursor-pointer transition-colors"
              title="Ekspor Seluruh Jadwal Tampil ke Excel"
            >
              <Icon name="file_download" size={14} className="text-secondary" />
              <span>Ekspor</span>
            </button>
          </div>
        </div>

          {/* Active Filter Badges */}
          {(prodiFilter || semesterFilter || hariFilter || statusFilter || search || onlyShowConflicts) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 animate-fade-in">
              <span className="text-label-caps font-bold uppercase tracking-wider text-on-surface-variant mr-1">
                Filter Aktif:
              </span>
              {onlyShowConflicts && (
                <span className="inline-flex items-center gap-1 rounded-full bg-error/15 px-2.5 py-0.5 text-body-xs font-bold text-error border border-error/30">
                  <span>Hanya Bentrok</span>
                  <button type="button" onClick={() => setOnlyShowConflicts(false)} className="hover:opacity-70 cursor-pointer">
                    <Icon name="close" size={12} />
                  </button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-body-xs font-semibold text-primary">
                  <span>Pencarian: "{search}"</span>
                  <button type="button" onClick={() => setSearch('')} className="hover:opacity-70 cursor-pointer">
                    <Icon name="close" size={12} />
                  </button>
                </span>
              )}
              {prodiFilter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-body-xs font-semibold text-primary">
                  <span>Prodi: {prodiFilter}</span>
                  <button type="button" onClick={() => setProdiFilter('')} className="hover:opacity-70 cursor-pointer">
                    <Icon name="close" size={12} />
                  </button>
                </span>
              )}
              {semesterFilter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-body-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  <span>{SEMESTERS.find((s) => s.value === semesterFilter)?.label || `Sem. ${semesterFilter}`}</span>
                  <button type="button" onClick={() => setSemesterFilter('')} className="hover:opacity-70 cursor-pointer">
                    <Icon name="close" size={12} />
                  </button>
                </span>
              )}
              {hariFilter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-body-xs font-semibold text-secondary">
                  <span>Hari: {hariFilter}</span>
                  <button type="button" onClick={() => setHariFilter('')} className="hover:opacity-70 cursor-pointer">
                    <Icon name="close" size={12} />
                  </button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 text-body-xs font-semibold text-on-surface">
                  <span>Status: {statusFilter}</span>
                  <button type="button" onClick={() => setStatusFilter('')} className="hover:opacity-70 cursor-pointer">
                    <Icon name="close" size={12} />
                  </button>
                </span>
              )}
            </div>
          )}

        {/* ── Table Jadwal Database ── */}
        {loadingSchedule ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : filteredSchedule.length === 0 ? (
          <EmptyState
            icon="calendar_month"
            title="Tidak ada jadwal yang sesuai"
            description="Coba ubah filter pencarian atau buat jadwal baru melalui upload spreadsheet / form manual di atas."
          />
        ) : (
          <>
            {/* Desktop Table with Sticky Header & Dynamic Flex Fit */}
            <div className="hidden overflow-x-auto overflow-y-auto flex-1 min-h-0 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-2xs tablet:block dark:bg-surface-container-low w-full">
              <table className="w-full min-w-[780px] text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-surface-container-low/95 dark:bg-surface-container-high/95 backdrop-blur-md shadow-xs">
                  <tr className="border-b border-outline-variant/15">
                    <th className="w-[4%] px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredSchedule.length && filteredSchedule.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded cursor-pointer"
                        aria-label="Pilih Semua"
                      />
                    </th>
                    <th className="w-[15%] px-3 py-2.5 text-label-caps uppercase text-on-surface-variant font-bold">
                      Hari & Waktu
                    </th>
                    <th className="w-[17%] px-3 py-2.5 text-label-caps uppercase text-on-surface-variant font-bold">
                      Prodi & Sem
                    </th>
                    <th className="w-[31%] px-3.5 py-2.5 text-label-caps uppercase text-on-surface-variant font-bold">
                      Mata Kuliah & Dosen
                    </th>
                    <th className="w-[14%] px-3 py-2.5 text-label-caps uppercase text-on-surface-variant font-bold">
                      Ruang / Tipe
                    </th>
                    <th className="w-[10%] px-2 py-2.5 text-label-caps uppercase text-on-surface-variant text-center font-bold">
                      Status
                    </th>
                    <th className="w-[9%] px-3 py-2.5 text-label-caps uppercase text-on-surface-variant text-right font-bold">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {paginatedSchedule.map((item) => {
                    const course = courseMap.get(item.kodeMK)
                    const isSelected = selectedIds.has(item.id)
                    const clashList = conflictMap.get(item.id) || []

                    return (
                      <tr
                        key={item.id}
                        className={`group transition-colors hover:bg-surface-container-low/50 dark:hover:bg-surface-container-high/20 ${
                          isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                        } ${clashList.length > 0 ? 'bg-red-500/5 dark:bg-red-500/10' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(item.id)}
                            className="rounded cursor-pointer"
                          />
                        </td>

                        {/* Hari & Waktu */}
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-body-md text-on-surface leading-tight">{item.hari}</p>
                          <p className="font-mono text-body-xs font-semibold text-on-surface-variant mt-0.5 whitespace-nowrap">
                            {item.jamMulai} - {item.jamSelesai}
                          </p>
                          {clashList.length > 0 && (
                            <div className="flex flex-col gap-1 mt-1">
                              {clashList.map((c, idx) => (
                                <span
                                  key={idx}
                                  title={c.message}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    c.type === 'room'
                                      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                                      : c.type === 'lecturer'
                                      ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30'
                                      : 'bg-error/15 text-error border border-error/30'
                                  }`}
                                >
                                  <Icon
                                    name={c.type === 'room' ? 'meeting_room' : c.type === 'lecturer' ? 'person' : 'groups'}
                                    size={11}
                                  />
                                  <span>
                                    {c.type === 'room' ? 'Ruang Bentrok' : c.type === 'lecturer' ? 'Dosen Bentrok' : 'Rombel Bentrok'}
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Prodi & Sem */}
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-body-sm text-on-surface truncate leading-tight">{item.prodi}</p>
                          <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">
                            Sem. {item.semester}
                          </span>
                        </td>

                        {/* Mata Kuliah & Dosen */}
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md shrink-0">
                              {item.kodeMK}
                            </span>
                            <span className="font-bold text-body-sm text-on-surface truncate">
                              {course?.namaMK || item.kodeMK}
                            </span>
                          </div>
                          <p className="text-body-xs font-medium text-on-surface-variant mt-0.5 truncate">
                            {course?.dosen || 'Dosen belum ditentukan'}
                          </p>
                        </td>

                        {/* Ruang & Tipe */}
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-body-xs text-on-surface truncate">{formatRuang(item.ruang, item.tipeKelas)}</p>
                          {(() => {
                            const ct = getClassType(item.tipeKelas)
                            return (
                              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold mt-0.5 ${TONE_CLASSES[ct.tone] || 'bg-surface-container text-on-surface-variant'}`}>
                                <span className={`h-1 w-1 rounded-full ${TONE_DOT_CLASSES[ct.tone] || 'bg-surface-variant'}`} />
                                {ct.label}
                              </span>
                            )
                          })()}
                        </td>

                        {/* Status */}
                        <td className="px-2 py-2.5 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase font-bold ${
                              (item.status || 'published') === 'published'
                                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                                : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {item.status || 'published'}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicate(item)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-secondary/15 hover:text-secondary transition-colors cursor-pointer"
                              title="Duplikat Sesi"
                            >
                              <Icon name="content_copy" size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer"
                              title="Edit Jadwal"
                            >
                              <Icon name="edit" size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer"
                              title="Hapus Jadwal"
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

            {/* Mobile Cards */}
            <div className="space-y-3 tablet:hidden">
              {paginatedSchedule.map((item) => {
                const course = courseMap.get(item.kodeMK)
                const isSelected = selectedIds.has(item.id)
                const clashList = conflictMap.get(item.id) || []

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border bg-surface-container-lowest p-4 space-y-3 dark:bg-surface-container-low shadow-xs transition-all ${
                      isSelected ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-outline-variant/20'
                    } ${clashList.length > 0 ? 'border-red-500/40 bg-red-500/5' : ''}`}
                  >
                    {/* Header Row: Checkbox + Kode MK + Mata Kuliah + Action Toolbar */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(item.id)}
                          className="mt-1 rounded cursor-pointer shrink-0"
                          aria-label={`Pilih ${item.kodeMK}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-label-caps font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md shrink-0">
                              {item.kodeMK}
                            </span>
                            <span className="font-bold text-body-sm text-on-surface truncate">
                              {course?.namaMK || item.kodeMK}
                            </span>
                          </div>
                          <p className="text-body-xs font-medium text-on-surface-variant mt-0.5 truncate flex items-center gap-1">
                            <Icon name="person" size={13} className="text-secondary shrink-0" />
                            <span>{course?.dosen || 'Dosen belum ditentukan'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex shrink-0 items-center gap-0.5 rounded-xl bg-surface-container/60 p-0.5 border border-outline-variant/20">
                        <button
                          type="button"
                          onClick={() => handleDuplicate(item)}
                          className="p-1 text-on-surface-variant hover:text-secondary rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
                          title="Duplikat Jadwal"
                          aria-label="Duplikat"
                        >
                          <Icon name="content_copy" size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
                          title="Edit Jadwal"
                          aria-label="Edit"
                        >
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="p-1 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
                          title="Hapus Jadwal"
                          aria-label="Hapus"
                        >
                          <Icon name="delete" size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Details Row: Chips & Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-body-xs pt-1 border-t border-outline-variant/15">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-2 py-1 font-semibold text-on-surface">
                        <Icon name="schedule" size={13} className="text-primary" />
                        <span>{item.hari}, {item.jamMulai} - {item.jamSelesai}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2 py-1 font-semibold text-indigo-700 dark:text-indigo-300">
                        <Icon name="school" size={13} />
                        <span>{item.prodi} (Sem. {item.semester})</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-2 py-1 font-semibold text-on-surface-variant">
                        <Icon name="meeting_room" size={13} />
                        <span>{formatRuang(item.ruang, item.tipeKelas)}</span>
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase font-bold ml-auto ${
                          (item.status || 'published') === 'published'
                            ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {item.status || 'published'}
                      </span>
                    </div>

                    {clashList.length > 0 && (
                      <div className="space-y-1.5 pt-1.5 border-t border-error/20">
                        {clashList.map((c, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start gap-1.5 rounded-xl p-2 text-body-xs font-semibold ${
                              c.type === 'room'
                                ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30'
                                : c.type === 'lecturer'
                                ? 'bg-purple-500/15 text-purple-900 dark:text-purple-200 border border-purple-500/30'
                                : 'bg-error/10 text-error border border-error/20'
                            }`}
                          >
                            <Icon
                              name={c.type === 'room' ? 'meeting_room' : c.type === 'lecturer' ? 'person' : 'groups'}
                              size={15}
                              className="shrink-0 mt-0.5"
                            />
                            <span className="text-[11px] leading-tight">{c.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Shared Pagination Controls */}
            <div className="shrink-0 pt-1.5 border-t border-outline-variant/15">
              <Pagination
                currentPage={safeCurrentPage}
                totalItems={filteredSchedule.length}
                pageSize={pageSize === 0 ? 'Semua' : pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => setPageSize(sz === 'Semua' ? 0 : sz)}
                itemLabel="sesi"
              />
            </div>
          </>
        )}
      </div>

      {/* ── 3. Modal Dialog Tambah Sesi Jadwal Manual ── */}
      {addModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 max-[599px]:items-end max-[599px]:justify-stretch max-[599px]:p-0"
        >
          <div
            onClick={() => setAddModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="relative w-full max-w-lg rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 shadow-2xl dark:bg-surface-container-low animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0 max-[599px]:p-5 max-[599px]:animate-[sheet-up_300ms_var(--ease-emphasized)_both]">
            {/* Drag handle — mobile only */}
            <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pb-2 -mx-2">
              <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
            </div>
            <header className="flex items-center justify-between pb-4 border-b border-outline-variant/15 mb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name="add_circle" size={22} />
                </span>
                <div>
                  <h3 className="text-title-lg font-bold tracking-tight text-on-surface">Tambah Sesi Jadwal Manual</h3>
                  <p className="text-body-xs font-medium text-on-surface-variant">Input jadwal perkuliahan secara individual</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                <Icon name="close" size={20} />
              </button>
            </header>

            <form onSubmit={handleAddManualSession} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Hari</label>
                  <FormSelect
                    value={manualForm.hari}
                    onChange={(val) => setManualForm((f) => ({ ...f, hari: val }))}
                    options={DAYS.map((d) => ({ value: d, label: d }))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Jam Mulai</label>
                  <input
                    type="time"
                    value={manualForm.jamMulai}
                    onChange={(e) => setManualForm((f) => ({ ...f, jamMulai: e.target.value }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 font-mono text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Jam Selesai</label>
                  <input
                    type="time"
                    value={manualForm.jamSelesai}
                    onChange={(e) => setManualForm((f) => ({ ...f, jamSelesai: e.target.value }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 font-mono text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Tipe Kelas</label>
                  <FormSelect
                    value={manualForm.tipeKelas}
                    onChange={(val) => setManualForm((f) => ({ ...f, tipeKelas: val }))}
                    options={CLASS_TYPE_CODES.map((t) => ({ value: t, label: t }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Program Studi</label>
                  <FormSelect
                    value={manualForm.prodi}
                    onChange={(val) => setManualForm((f) => ({ ...f, prodi: val }))}
                    placeholder="- Pilih Prodi -"
                    options={prodiOptions.map((p) => ({ value: p, label: p }))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={manualForm.semester}
                    onChange={(e) => setManualForm((f) => ({ ...f, semester: Number(e.target.value) }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Ruangan</label>
                  <input
                    type="text"
                    placeholder="mis. Lab 1 / R. 302"
                    value={manualForm.ruang}
                    onChange={(e) => setManualForm((f) => ({ ...f, ruang: e.target.value }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-label-caps uppercase text-on-surface-variant">Mata Kuliah</label>
                  <button
                    type="button"
                    onClick={() => setNewCourseOpen(true)}
                    className="text-body-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    + Buat MK Baru
                  </button>
                </div>
                <FormSelect
                  value={manualForm.kodeMK}
                  onChange={(val) => setManualForm((f) => ({ ...f, kodeMK: val }))}
                  placeholder="- Pilih Mata Kuliah Terdaftar -"
                  options={courses.map((c) => ({
                    value: c.kodeMK,
                    label: `${c.kodeMK} — ${c.namaMK} (${c.dosen || 'Dosen -'})`,
                  }))}
                />
              </div>

              {addModalClash && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-500/15 border border-amber-500/30 p-2.5 text-body-xs font-semibold text-amber-900 dark:text-amber-200">
                  <Icon name="warning" size={16} className="shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold">Peringatan Bentrok Jadwal:</p>
                    <p className="text-[11px] mt-0.5">{addModalClash}</p>
                  </div>
                </div>
              )}

              {manualErrors.length > 0 && (
                <div className="rounded-xl bg-error/10 p-2.5 text-body-xs font-semibold text-error">
                  {manualErrors.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/15">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAddModalOpen(false)}
                  className="cursor-pointer"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={busy} className="font-bold cursor-pointer">
                  <Icon name="add_circle" size={18} className="mr-1" />
                  {busy ? 'Menyimpan...' : 'Simpan Sesi ke Database'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 4. Modal Dialog Edit Jadwal ── */}
      {editingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 max-[599px]:items-end max-[599px]:justify-stretch max-[599px]:p-0"
        >
          <div
            onClick={() => setEditingItem(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="relative w-full max-w-lg rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 shadow-2xl dark:bg-surface-container-low animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0 max-[599px]:p-5 max-[599px]:animate-[sheet-up_300ms_var(--ease-emphasized)_both]">
            {/* Drag handle — mobile only */}
            <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pb-2 -mx-2">
              <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
            </div>
            <header className="flex items-center justify-between pb-4 border-b border-outline-variant/15 mb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name="edit_calendar" size={22} />
                </span>
                <div>
                  <h3 className="text-title-lg font-bold tracking-tight text-on-surface">Edit Sesi Jadwal</h3>
                  <p className="text-body-xs font-medium text-on-surface-variant">{editingItem.kodeMK} — {editingItem.hari}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                <Icon name="close" size={20} />
              </button>
            </header>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Hari</label>
                  <FormSelect
                    value={editForm.hari}
                    onChange={(val) => setEditForm((f) => ({ ...f, hari: val }))}
                    options={DAYS.map((d) => ({ value: d, label: d }))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Jam Mulai</label>
                  <input
                    type="time"
                    value={editForm.jamMulai}
                    onChange={(e) => setEditForm((f) => ({ ...f, jamMulai: e.target.value }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 font-mono text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Jam Selesai</label>
                  <input
                    type="time"
                    value={editForm.jamSelesai}
                    onChange={(e) => setEditForm((f) => ({ ...f, jamSelesai: e.target.value }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 font-mono text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Tipe Kelas</label>
                  <FormSelect
                    value={editForm.tipeKelas}
                    onChange={(val) => setEditForm((f) => ({ ...f, tipeKelas: val }))}
                    options={CLASS_TYPE_CODES.map((t) => ({ value: t, label: t }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Prodi</label>
                  <FormSelect
                    value={editForm.prodi}
                    onChange={(val) => setEditForm((f) => ({ ...f, prodi: val }))}
                    placeholder="- Pilih Prodi -"
                    options={prodiOptions.map((p) => ({ value: p, label: p }))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={editForm.semester}
                    onChange={(e) => setEditForm((f) => ({ ...f, semester: Number(e.target.value) }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Ruangan</label>
                  <input
                    type="text"
                    value={editForm.ruang}
                    onChange={(e) => setEditForm((f) => ({ ...f, ruang: e.target.value }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Mata Kuliah</label>
                  <FormSelect
                    value={editForm.kodeMK}
                    onChange={(val) => setEditForm((f) => ({ ...f, kodeMK: val }))}
                    options={courses.map((c) => ({
                      value: c.kodeMK,
                      label: `${c.kodeMK} — ${c.namaMK}`,
                    }))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Status Publikasi</label>
                  <FormSelect
                    value={editForm.status}
                    onChange={(val) => setEditForm((f) => ({ ...f, status: val }))}
                    options={[
                      { value: 'published', label: 'Published' },
                      { value: 'draft', label: 'Draft' },
                    ]}
                  />
                </div>
              </div>

              {editModalClash && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-500/15 border border-amber-500/30 p-2.5 text-body-xs font-semibold text-amber-900 dark:text-amber-200">
                  <Icon name="warning" size={16} className="shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold">Peringatan Bentrok Jadwal:</p>
                    <p className="text-[11px] mt-0.5">{editModalClash}</p>
                  </div>
                </div>
              )}

              {editErrors.length > 0 && (
                <div className="rounded-xl bg-error/10 p-2.5 text-body-xs font-semibold text-error">
                  {editErrors.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/15">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingItem(null)}
                  className="cursor-pointer"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={busy} className="font-bold cursor-pointer">
                  <Icon name="save" size={18} className="mr-1" />
                  {busy ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. Modal Tambah Master MK Cepat ── */}
      {newCourseOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 max-[599px]:items-end max-[599px]:justify-stretch max-[599px]:p-0"
        >
          <div
            onClick={() => setNewCourseOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="relative w-full max-w-md rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 shadow-2xl dark:bg-surface-container-low animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0 max-[599px]:p-5 max-[599px]:animate-[sheet-up_300ms_var(--ease-emphasized)_both]">
            {/* Drag handle — mobile only */}
            <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pb-2 -mx-2">
              <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
            </div>
            <header className="flex items-center justify-between pb-3 border-b border-outline-variant/15 mb-4">
              <h3 className="text-title-md font-bold text-on-surface">Tambah Mata Kuliah Baru</h3>
              <button
                type="button"
                onClick={() => setNewCourseOpen(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                <Icon name="close" size={18} />
              </button>
            </header>

            <form onSubmit={handleSaveNewCourse} className="space-y-3">
              <Input
                label="Kode MK"
                value={newCourseForm.kodeMK}
                onChange={(e) => setNewCourseForm((f) => ({ ...f, kodeMK: e.target.value.toUpperCase() }))}
                placeholder="mis. IF201"
                className="uppercase font-mono font-bold"
              />
              <Input
                label="Nama Mata Kuliah"
                value={newCourseForm.namaMK}
                onChange={(e) => setNewCourseForm((f) => ({ ...f, namaMK: e.target.value }))}
                placeholder="Nama lengkap mata kuliah"
              />
              <Input
                label="Dosen Pengampu"
                value={newCourseForm.dosen}
                onChange={(e) => setNewCourseForm((f) => ({ ...f, dosen: e.target.value }))}
                placeholder="Nama & Gelar Dosen"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <Input
                  label="SKS"
                  type="number"
                  min="1"
                  max="6"
                  value={newCourseForm.sks}
                  onChange={(e) => setNewCourseForm((f) => ({ ...f, sks: Number(e.target.value) }))}
                />
                <Input
                  label="Durasi (menit)"
                  type="number"
                  min="30"
                  max="300"
                  step="10"
                  value={newCourseForm.durasi}
                  onChange={(e) => setNewCourseForm((f) => ({ ...f, durasi: Number(e.target.value) }))}
                />
              </div>

              {newCourseErrors.length > 0 && (
                <div className="rounded-xl bg-error/10 p-2 text-body-xs font-semibold text-error">
                  {newCourseErrors.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="secondary" onClick={() => setNewCourseOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={savingCourse}>
                  {savingCourse ? 'Menyimpan...' : 'Simpan MK'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. Dialog Konfirmasi Hapus Single ── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus sesi jadwal?"
        description={`Sesi ${deleteTarget?.kodeMK} (${deleteTarget?.hari}, ${deleteTarget?.jamMulai}) akan dihapus permanen dari database.`}
        confirmLabel="Hapus Jadwal"
        onConfirm={handleDeleteSingle}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── 7. Dialog Konfirmasi Hapus Massal ── */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Hapus Jadwal Terpilih?"
        description={`Sebanyak ${selectedIds.size} sesi jadwal terpilih akan dihapus permanen dari database.`}
        confirmLabel="Hapus Semua Terpilih"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />

      {/* ── 8. Floating Bulk Actions Bar (Melayang di Bawah Layar) ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/95 dark:bg-surface-container-high/95 backdrop-blur-md px-4 py-2.5 shadow-2xl animate-fade-up max-w-[95vw]">
          <span className="font-bold text-body-sm text-primary flex items-center gap-2">
            <span className="flex h-6 min-w-[24px] px-1.5 items-center justify-center rounded-full bg-primary text-on-primary text-body-xs font-bold shadow-xs">
              {selectedIds.size}
            </span>
            <span className="hidden sm:inline">Sesi Terpilih</span>
          </span>

          <div className="h-5 w-px bg-outline-variant/30" />

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleBulkStatusChange('published')}
              className="flex items-center gap-1 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 px-2.5 py-1.5 text-body-xs font-bold hover:bg-emerald-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Icon name="check_circle" size={15} />
              <span>Publish</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkStatusChange('draft')}
              className="flex items-center gap-1 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25 px-2.5 py-1.5 text-body-xs font-bold hover:bg-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Icon name="pause_circle" size={15} />
              <span>Draft</span>
            </button>

            <button
              type="button"
              onClick={() => setBulkDeleteOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-error/15 text-error border border-error/25 px-2.5 py-1.5 text-body-xs font-bold hover:bg-error/25 active:scale-95 transition-all cursor-pointer"
            >
              <Icon name="delete" size={15} />
              <span>Hapus</span>
            </button>
          </div>

          <div className="h-5 w-px bg-outline-variant/30" />

          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="flex items-center gap-1 text-body-xs font-bold text-on-surface-variant hover:text-on-surface px-2 py-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
            title="Batalkan Pilihan (Esc)"
          >
            <Icon name="close" size={16} />
            <span className="hidden sm:inline">Batal</span>
          </button>
        </div>
      )}

      {/* ── Modal Dialog: Universal Schedule Importer (Multi-Format & OCR) ── */}
      <UniversalImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSave={handleUniversalImportSave}
        prodiOptions={prodiOptions}
        currentTA={currentTA}
        existingTAs={existingTAs}
      />

      {/* ── Modal Dialog: Official Noticeboard Printable (A4 Landscape) ── */}
      <OfficialNoticeboardModal
        isOpen={noticeboardModalOpen}
        onClose={() => setNoticeboardModalOpen(false)}
        allSchedules={rawSchedule}
        courses={courses}
        currentTA={currentTA}
      />
    </div>
  )
}
