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
  TaFilterDropdown,
  FakultasFilterDropdown,
  HariFilterDropdown,
  StatusFilterDropdown,
} from '../../components/admin/AdminFilterDropdowns'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { useCampus } from '../../context/CampusContext'
import { deleteDocument, setDocument, updateDocument } from '../../lib/adminData'
import { appendHistory, publishDocuments, saveSettings } from '../../lib/publishHelpers'
import { deriveTahunAjaran, expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'
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

const BASE_SEMESTER_GROUPS = [
  { label: 'Semua Semester', value: '' },
  { label: 'Semester Ganjil', value: 'ganjil' },
  { label: 'Semester Genap', value: 'genap' },
]

export default function ManageSchedule() {
  const { data: rawSchedule, loading: loadingSchedule } = useFirestore('jadwal')
  const { data: courses } = useFirestore('mataKuliah')
  const { data: programs } = useFirestore('prodi')
  const { data: fakultasDocs } = useFirestore('fakultas')
  const { data: settingsDocs } = useFirestore('settings')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''
  const { prodiNames: campusProdiNames } = useCampus()

  const academicCalendar = useMemo(
    () => settingsDocs?.find((s) => s.id === 'academicCalendar'),
    [settingsDocs],
  )
  const currentTA = deriveTahunAjaran(new Date(), academicCalendar)

  // Map prodi -> fakultasId (untuk denorm ke jadwal)
  const prodiFakultasMap = useMemo(() => {
    const m = new Map()
    for (const pr of programs || []) m.set(String(pr.nama || ''), String(pr.fakultasId || pr.fakultasNama || ''))
    return m
  }, [programs])

  // Map Mata Kuliah untuk lookup cepat
  const courseMap = useMemo(() => {
    const map = new Map()
    for (const c of courses) {
      map.set(c.kodeMK, c)
    }
    return map
  }, [courses])

  // List prodi options — Opsi B: hanya yang ada data (DB + kampus). Hardcode 5 hanya kalau keduanya kosong.
  const prodiOptions = useMemo(() => {
    const fromDb = programs?.map((p) => p.nama || p.id).filter(Boolean) || []
    const fromCampus = campusProdiNames || []
    const have = [...new Set([...fromCampus, ...fromDb].filter(Boolean))]
    if (have.length > 0) return have.sort()
    return ['Arsitektur', 'Bisnis Digital', 'Informatika', 'Kewirausahaan', 'Teknik Sipil']
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
  const [fakultasFilter, setFakultasFilter] = useState('')
  const [prodiFilter, setProdiFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [hariFilter, setHariFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [taFilter, setTaFilter] = useState('')
  const availableTaOptions = useMemo(() => {
    const tas = [...new Set(rawSchedule.map((s) => String(s.tahunAjaran || '').trim()).filter(Boolean))].sort((a, b) => b.localeCompare(a))
    const opts = [{ label: 'Semua TA', value: '' }, ...tas.map((ta) => ({ label: `TA ${ta}`, value: ta }))]
    return opts
  }, [rawSchedule])
  useEffect(() => {
    if (!taFilter) return
    const ok = availableTaOptions.some((o) => String(o.value) === String(taFilter))
    if (!ok) setTaFilter('')
  }, [availableTaOptions, taFilter])

  // Opsi B + cascade: kalau TA dipilih, semester cuma yang ada di TA itu
  const availableSemesterOptions = useMemo(() => {
    const pool = taFilter ? rawSchedule.filter((s) => String(s.tahunAjaran || '').trim() === String(taFilter)) : rawSchedule
    const nums = [...new Set(pool.map((s) => Number(s.semester)).filter((n) => Number.isInteger(n) && n > 0))].sort((a, b) => a - b)
    const numeric = nums.map((n) => ({ label: `Semester ${n}`, value: String(n) }))
    return [...BASE_SEMESTER_GROUPS, ...numeric]
  }, [rawSchedule, taFilter])
  // Auto-reset filter kalau pilihan aktif jadi tidak tersedia lagi
  useEffect(() => {
    if (!semesterFilter) return
    if (semesterFilter === 'ganjil' || semesterFilter === 'genap') return
    const ok = availableSemesterOptions.some((o) => String(o.value) === String(semesterFilter))
    if (!ok) setSemesterFilter('')
  }, [availableSemesterOptions, semesterFilter])

  const availableFakultasOptions = useMemo(() => {
    // Prefer fakultas collection for labels, fallback to distinct prodi fakultasId
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
    const opts = [{ label: 'Semua Fakultas', value: '' }, ...[...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'id'))]
    return opts
  }, [fakultasDocs, programs])

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
      .filter((item) => (fakultasFilter ? String(item.fakultasId || prodiFakultasMap.get(String(item.prodi || '')) || '') === String(fakultasFilter) : true))
      .filter((item) => (prodiFilter ? item.prodi === prodiFilter : true))
      .filter((item) => {
        if (!semesterFilter) return true
        const sem = Number(item.semester)
        if (semesterFilter === 'ganjil') return sem % 2 === 1
        if (semesterFilter === 'genap') return sem % 2 === 0
        return sem === Number(semesterFilter)
      })
      .filter((item) => (taFilter ? String(item.tahunAjaran || '') === String(taFilter) : true))
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
  }, [rawSchedule, fakultasFilter, prodiFilter, semesterFilter, taFilter, hariFilter, statusFilter, onlyShowConflicts, conflictMap, search, courseMap])

  // ── Grouping MK Umum (spec): kodeMK+hari+jam+dosen+ruang → 1 baris, badge multi-prodi
  // Spec persis: komb unik kode MK + hari + jam + dosen + ruangan.
  // Semester/TA/tipeKelas/status TIDAK masuk key — biar MKWK202 lintas prodi yang jam/dosen/ruang identik
  // tetap collapse meski SKS/sem berbeda; badge S1/S3 tetap tampil bila sem berbeda dalam 1 grup.
  // Jika butuh strict per-TA/sem, aktifkan filter TA/Semester dulu — grouping akan run di pool terfilter.
  const groupedSchedule = useMemo(() => {
    const groups = new Map()
    for (const item of filteredSchedule) {
      const course = courseMap.get(item.kodeMK)
      const dosenKey = String(course?.dosen ?? item.dosen ?? '').trim().toLowerCase()
      const ruangKey = String(item.ruang ?? '').trim().toLowerCase()
      const key = [
        String(item.kodeMK ?? '').trim().toUpperCase(),
        String(item.hari ?? ''),
        String(item.jamMulai ?? ''),
        String(item.jamSelesai ?? ''),
        dosenKey,
        ruangKey,
      ].join('|')
      if (!groups.has(key)) groups.set(key, { key, items: [], course })
      groups.get(key).items.push(item)
    }
    const arr = [...groups.values()]
    const dayOrder = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6, Minggu: 7 }
    arr.sort((a, b) => {
      const ra = a.items[0], rb = b.items[0]
      const da = (dayOrder[ra.hari] || 99) - (dayOrder[rb.hari] || 99)
      if (da !== 0) return da
      return String(ra.jamMulai).localeCompare(String(rb.jamMulai))
    })
    return arr
  }, [filteredSchedule, courseMap])

  // info ringkas: 101 sesi → N grup (hemat M baris)
  const groupingStats = useMemo(() => {
    const totalSesi = filteredSchedule.length
    const totalGrup = groupedSchedule.length
    const hemat = totalSesi - totalGrup
    return { totalSesi, totalGrup, hemat, isGrouped: hemat > 0 }
  }, [filteredSchedule.length, groupedSchedule.length])

  // Paginasi per GRUP (bukan per sesi)
  const totalPages = pageSize === 0 ? 1 : Math.ceil(groupedSchedule.length / pageSize) || 1
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages))
  const paginatedGroups = useMemo(() => {
    if (pageSize === 0) return groupedSchedule
    const start = (safeCurrentPage - 1) * pageSize
    return groupedSchedule.slice(start, start + pageSize)
  }, [groupedSchedule, safeCurrentPage, pageSize])

  // expand state untuk grup multi-prodi
  const [expandedGroups, setExpandedGroups] = useState(() => new Set())
  function toggleExpandGroup(key) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  // reset expand kalau filter berubah biar gak expand nyangkut
  useEffect(() => { setExpandedGroups(new Set()) }, [search, fakultasFilter, prodiFilter, semesterFilter, taFilter, hariFilter, statusFilter, onlyShowConflicts])

  function jadwalDocId(entry, ta) {
    const taStr = String(ta || entry.tahunAjaran || '').trim().replace(/[/#?[\]]/g, '-')
    return [
      entry.prodi,
      Number(entry.semester),
      entry.hari,
      entry.jamMulai,
      entry.kodeMK,
      entry.tipeKelas,
      taStr || 'tanpaTA',
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
    const scheduleDocs = (parsedData.scheduleEntries || []).map((e) => {
      const _fId = String(prodiFakultasMap.get(String(e.prodi || '')) || '').trim() || null
      return {
        ...e,
        id: jadwalDocId(e, targetTA),
        fakultasId: _fId,
        tahunAjaran: targetTA,
        status: 'published',
      }
    })
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
    const _manualTA = expectedTahunAjaranForSemester(Number(manualForm.semester) || 1, new Date(), academicCalendar) || currentTA; const docId = jadwalDocId(manualForm, _manualTA)
    const newDoc = {
      ...manualForm,
      semester: Number(manualForm.semester),
      fakultasId: String(prodiFakultasMap.get(String(manualForm.prodi || '')) || '').trim() || null,
      tahunAjaran: _manualTA,
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

  // ── Handler Hapus Jadwal (support grup MKWK: _group) ──
  async function handleDeleteSingle() {
    if (!deleteTarget) return
    const target = deleteTarget
    // Grup: hapus semua sesi dalam grup
    if (target._group) {
      const ids = target._group.items.map((it) => it.id)
      setBusy(true)
      let okCount = 0
      for (const id of ids) {
        const r = await deleteDocument('jadwal', id)
        if (r.ok) okCount += 1
      }
      setBusy(false)
      setDeleteTarget(null)
      if (okCount > 0) {
        await appendHistory({ entitas: 'jadwal', field: 'hapus_grup', nilaiLama: target._group, nilaiBaru: null, aktor: actor, detail: `Hapus grup ${target._group.items[0]?.kodeMK} (${okCount} sesi)` })
        setBanner({ ok: true, message: `${okCount} sesi grup ${target._group.items[0]?.kodeMK} berhasil dihapus!` })
      } else {
        setBanner({ ok: false, message: 'Gagal menghapus grup.' })
      }
      return
    }
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

  // ── Bulk Actions Handler (group-aware) ──
  const allFilteredIds = filteredSchedule.map((item) => item.id)
  function toggleSelectAll() {
    if (selectedIds.size === allFilteredIds.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allFilteredIds))
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

  function toggleSelectGroup(group) {
    const ids = group.items.map((it) => it.id)
    const allSelected = ids.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  async function handleGroupEdit(group) {
    // G01: edit berlaku untuk SEMUA prodi dalam grup (jam/dosen/ruang/kodeMK yang identik).
    // Ambil first item sebagai wakil; save akan update SEMUA ids di grup dengan data yang sama.
    openGroupEditModal(group)
  }

  async function handleGroupDelete(group) {
    // Hapus semua sesi di grup (MKWK umum)
    setDeleteTarget({ _group: group, ids: group.items.map((it) => it.id), label: `${group.items[0].kodeMK} — ${group.items.length} prodi` })
  }

  // ── Group Edit (MK Umum): edit 1x, update semua sesi dalam grup ──
  const [groupEditing, setGroupEditing] = useState(null) // { group, editForm }
  function openGroupEditModal(group) {
    const first = group.items[0]
    setGroupEditing({ group, editForm: { hari: first.hari, jamMulai: first.jamMulai, jamSelesai: first.jamSelesai, kodeMK: first.kodeMK, ruang: first.ruang ?? '', tipeKelas: first.tipeKelas ?? 'K1', status: first.status ?? 'published' } })
    setEditErrors([])
  }
  function patchGroupForm(patch) {
    setGroupEditing((s) => s ? { ...s, editForm: { ...s.editForm, ...patch } } : s)
  }
  async function handleSaveGroupEdit(e) {
    e.preventDefault()
    if (!groupEditing) return
    const errors = validateScheduleEntry({ ...groupEditing.editForm, prodi: groupEditing.group.items[0].prodi, semester: groupEditing.group.items[0].semester })
    setEditErrors(errors)
    if (errors.length > 0) return
    setBusy(true)
    let okCount = 0
    for (const item of groupEditing.group.items) {
      const r = await updateDocument('jadwal', item.id, { ...groupEditing.editForm }, actor)
      if (r.ok) okCount += 1
    }
    setBusy(false)
    if (okCount > 0) {
      await appendHistory({ entitas: 'jadwal', field: 'edit_grup', nilaiLama: groupEditing.group, nilaiBaru: groupEditing.editForm, aktor: actor, detail: `Edit grup ${groupEditing.group.items[0].kodeMK} (${okCount} sesi)` })
      setBanner({ ok: true, message: `Grup ${groupEditing.group.items[0].kodeMK} (${okCount} sesi) berhasil diperbarui!` })
      setGroupEditing(null)
    } else {
      setBanner({ ok: false, message: 'Gagal menyimpan edit grup.' })
    }
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
        {/* Unified Search & Filters — 2 rows ke bawah biar muat: baris atas search, baris bawah chips; filter yang cuma 1 opsi auto-hide */}
        <div className="relative z-30 flex flex-col gap-2">
          {/* Baris 1: Search full width */}
          <div className="relative w-full">
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

          {/* Baris 2: Chips — wrap, auto-hide kalau cuma 1 opsi */}
          <div className="flex flex-wrap items-center gap-1.5 relative z-30">
            {availableFakultasOptions.length > 2 && (
              <FakultasFilterDropdown
                selected={fakultasFilter}
                onSelect={(v) => { setFakultasFilter(v); if (v && prodiFilter) { const fid = String(prodiFakultasMap.get(String(prodiFilter)) || ''); if (fid && fid !== String(v)) setProdiFilter('') } }}
                fakultasOptions={availableFakultasOptions}
              />
            )}

            <ProdiFilterDropdown
              prodiOptions={prodiOptions}
              selected={prodiFilter}
              onSelect={setProdiFilter}
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

            {(search || fakultasFilter || prodiFilter || semesterFilter || taFilter || hariFilter || statusFilter || onlyShowConflicts) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setFakultasFilter('')
                  setProdiFilter('')
                  setSemesterFilter('')
                  setTaFilter('')
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
                  <span>{availableSemesterOptions.find((s) => s.value === semesterFilter)?.label || `Sem. ${semesterFilter}`}</span>
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
                  {paginatedGroups.map((group) => {
                    const item = group.items[0]
                    const course = courseMap.get(item.kodeMK)
                    const groupIds = group.items.map((it) => it.id)
                    const allSelected = groupIds.every((id) => selectedIds.has(id))
                    const someSelected = groupIds.some((id) => selectedIds.has(id))
                    const anyClash = group.items.some((it) => conflictMap.has(it.id))
                    const isExpanded = expandedGroups.has(group.key)

                    return (
                      <tr
                        key={group.key}
                        className={`group transition-colors hover:bg-surface-container-low/50 dark:hover:bg-surface-container-high/20 ${
                          someSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                        } ${anyClash ? 'bg-red-500/5 dark:bg-red-500/10' : ''}`}
                      >
                        {/* Checkbox (grup: centang semua) */}
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => { if (el) el.indeterminate = !allSelected && someSelected }}
                            onChange={() => toggleSelectGroup(group)}
                            className="rounded cursor-pointer"
                            aria-label={`Pilih grup ${item.kodeMK}`}
                          />
                        </td>

                        {/* Hari & Waktu */}
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-body-md text-on-surface leading-tight">{item.hari}</p>
                          <p className="font-mono text-body-xs font-semibold text-on-surface-variant mt-0.5 whitespace-nowrap">
                            {item.jamMulai} - {item.jamSelesai}
                          </p>
                          {(() => { const clashList = group.items.flatMap((it) => conflictMap.get(it.id) || []); return clashList.length > 0 && (
                            <div className="flex flex-col gap-1 mt-1">
                              {[...new Map(group.items.flatMap((it) => conflictMap.get(it.id) || []).map((cc) => [cc.message, cc])).values()].map((c, idx) => (
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
                          )})()}
                        </td>

                        {/* Prodi & Sem — badge multi-prodi, wrap di dalam sel */}
                        <td className="px-3 py-2.5 max-w-[170px]">
                          <div className="flex flex-wrap gap-1 items-center">
                            {(() => {
                              const MAX_BADGES = 3
                              const visible = isExpanded ? group.items : group.items.slice(0, MAX_BADGES)
                              const hiddenCount = group.items.length - visible.length
                              return (
                                <>
                                  {visible.map((it) => (
                                    <span key={it.id} title={`${it.prodi} — Sem. ${it.semester}`} className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-500/15 whitespace-nowrap">
                                      <Icon name="school" size={10} className="shrink-0" />
                                      {it.prodi}
                                      <span className="font-mono font-normal opacity-70 text-[9px]">S{it.semester}</span>
                                    </span>
                                  ))}
                                  {hiddenCount > 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); toggleExpandGroup(group.key) }}
                                      className="inline-flex items-center rounded-md bg-surface-container px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-high cursor-pointer"
                                      title={group.items.slice(MAX_BADGES).map((it) => `${it.prodi} S${it.semester}`).join(', ')}
                                    >
                                      +{hiddenCount} lainnya
                                    </button>
                                  )}
                                  {isExpanded && group.items.length > MAX_BADGES && (
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandGroup(group.key)}
                                      className="inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[10px] font-bold text-primary hover:underline cursor-pointer"
                                    >
                                      <Icon name="expand_less" size={11} /> ciutkan
                                    </button>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                          {group.items.length > 1 && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/20">
                              <Icon name="groups" size={10} /> {group.items.length} prodi bergabung
                            </span>
                          )}
                          {isExpanded && group.items.length > 1 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {group.items.map((it) => (
                                <span key={it.id} className="inline-flex items-center gap-1 rounded-lg bg-surface-container border border-outline-variant/20 px-2 py-1 text-[11px]">
                                  <span className="font-semibold">{it.prodi} S{it.semester}</span>
                                  <button type="button" onClick={() => openEditModal(it)} className="rounded p-0.5 text-primary hover:bg-primary/10 cursor-pointer" title={`Edit ${it.prodi} saja`}><Icon name="edit" size={12} /></button>
                                  <button type="button" onClick={() => setDeleteTarget(it)} className="rounded p-0.5 text-error hover:bg-error/10 cursor-pointer" title={`Hapus ${it.prodi} saja`}><Icon name="delete" size={12} /></button>
                                </span>
                              ))}
                            </div>
                          )}
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
                          <p className="text-body-xs font-medium text-on-surface-variant mt-1 whitespace-normal break-words leading-snug">
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

                        {/* Aksi — grup: edit/hapus berlaku SEMUA prodi dalam grup; expand untuk per-prodi */}
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicate(item)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-secondary/15 hover:text-secondary transition-colors cursor-pointer"
                              title="Duplikat (jadi sesi baru dari wakil grup)"
                            >
                              <Icon name="content_copy" size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openGroupEditModal(group)}
                              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors cursor-pointer ${group.items.length > 1 ? 'text-primary bg-primary/10 hover:bg-primary/20 ring-1 ring-primary/20' : 'text-on-surface-variant hover:bg-primary/15 hover:text-primary'}`}
                              title={group.items.length > 1 ? `Edit GRUP (${group.items.length} prodi sekaligus) — jam/dosen/ruang` : 'Edit Jadwal'}
                            >
                              <Icon name={group.items.length > 1 ? 'edit_note' : 'edit'} size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGroupDelete(group)}
                              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors cursor-pointer ${group.items.length > 1 ? 'text-error bg-error/10 hover:bg-error/20 ring-1 ring-error/20' : 'text-on-surface-variant hover:bg-error/15 hover:text-error'}`}
                              title={group.items.length > 1 ? `Hapus GRUP (${group.items.length} prodi sekaligus)` : 'Hapus Jadwal'}
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

            {/* Mobile Cards — grup MKWK (badge multi-prodi, expand + per-prodi actions) */}
            <div className="space-y-3 tablet:hidden">
              {paginatedGroups.map((group) => {
                const item = group.items[0]
                const course = courseMap.get(item.kodeMK)
                const groupIds = group.items.map((it) => it.id)
                const allSelected = groupIds.every((id) => selectedIds.has(id))
                const isExpanded = expandedGroups.has(group.key)
                const anyClash = group.items.some((it) => conflictMap.get(it.id))
                const MAX_BADGES_M = 3

                return (
                  <div
                    key={group.key}
                    className={`rounded-2xl border bg-surface-container-lowest p-4 space-y-3 dark:bg-surface-container-low shadow-xs transition-all ${
                      allSelected ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-outline-variant/20'
                    } ${anyClash ? 'border-red-500/40 bg-red-500/5' : ''}`}
                  >
                    {/* Header Row: Checkbox + Kode MK + Mata Kuliah + Action Toolbar */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => toggleSelectGroup(group)}
                          className="mt-1 rounded cursor-pointer shrink-0"
                          aria-label={`Pilih grup ${item.kodeMK} (${group.items.length} prodi)`}
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
                          <p className="text-body-xs font-medium text-on-surface-variant mt-1 whitespace-normal break-words leading-snug flex items-start gap-1">
                            <Icon name="person" size={13} className="text-secondary shrink-0 mt-0.5" />
                            <span className="min-w-0">{course?.dosen || 'Dosen belum ditentukan'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex shrink-0 items-center gap-0.5 rounded-xl bg-surface-container/60 p-0.5 border border-outline-variant/20">
                        <button
                          type="button"
                          onClick={() => handleDuplicate(item)}
                          className="p-1 text-on-surface-variant hover:text-secondary rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
                          title="Duplikat (wakil grup)"
                          aria-label="Duplikat"
                        >
                          <Icon name="content_copy" size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openGroupEditModal(group)}
                          className={`p-1 rounded-lg transition-colors cursor-pointer ${group.items.length > 1 ? 'text-primary bg-primary/10 ring-1 ring-primary/20' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'}`}
                          title={group.items.length > 1 ? `Edit GRUP (${group.items.length} prodi sekaligus)` : 'Edit'}
                          aria-label="Edit grup"
                        >
                          <Icon name={group.items.length > 1 ? 'edit_note' : 'edit'} size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGroupDelete(group)}
                          className={`p-1 rounded-lg transition-colors cursor-pointer ${group.items.length > 1 ? 'text-error bg-error/10 ring-1 ring-error/20' : 'text-on-surface-variant hover:text-error hover:bg-surface-container-high'}`}
                          title={group.items.length > 1 ? `Hapus GRUP (${group.items.length} prodi)` : 'Hapus'}
                          aria-label="Hapus grup"
                        >
                          <Icon name="delete" size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Details Row: Chips & Badges (grup: badges + expand + per-prodi) */}
                    <div className="flex flex-wrap items-center gap-1.5 text-body-xs pt-1 border-t border-outline-variant/15">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-2 py-1 font-semibold text-on-surface">
                        <Icon name="schedule" size={13} className="text-primary" />
                        <span>{item.hari}, {item.jamMulai} - {item.jamSelesai}</span>
                      </span>
                      <span className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-indigo-500/10 px-2 py-1 font-semibold text-indigo-700 dark:text-indigo-300">
                        <Icon name="school" size={13} className="shrink-0" />
                        <span className="flex flex-wrap gap-1 items-center">
                          {(isExpanded ? group.items : group.items.slice(0, MAX_BADGES_M)).map((it) => (
                            <span key={it.id} className="inline-flex items-center gap-0.5 rounded-md bg-white/80 dark:bg-surface-container-high px-1.5 py-0.5 text-[11px] border border-indigo-500/15 whitespace-nowrap">{it.prodi} S{it.semester}</span>
                          ))}
                          {group.items.length > MAX_BADGES_M && !isExpanded && (
                            <button type="button" onClick={() => toggleExpandGroup(group.key)} className="rounded-md bg-surface-container px-1.5 py-0.5 text-[11px] border border-outline-variant/30 cursor-pointer">+{group.items.length - MAX_BADGES_M} lainnya</button>
                          )}
                          {isExpanded && group.items.length > MAX_BADGES_M && (
                            <button type="button" onClick={() => toggleExpandGroup(group.key)} className="text-primary underline text-[11px] cursor-pointer inline-flex items-center gap-0.5"><Icon name="expand_less" size={11} />ciutkan</button>
                          )}
                        </span>
                        {group.items.length > 1 && <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1"><Icon name="groups" size={11} />{group.items.length} prodi</span>}
                      </span>
                      {/* Expand: per-prodi individual actions (edit/duplicate/hapus per sesi) */}
                      {isExpanded && group.items.length > 1 && (
                        <div className="w-full flex flex-wrap gap-1 pt-1">
                          {group.items.map((it) => (
                            <span key={it.id} className="inline-flex items-center gap-1 rounded-lg bg-surface-container-low border border-outline-variant/20 px-2 py-1 text-[11px]">
                              <span className="font-semibold">{it.prodi} S{it.semester}</span>
                              <button type="button" onClick={() => openEditModal(it)} className="rounded p-0.5 text-primary hover:bg-primary/10 cursor-pointer" title={`Edit ${it.prodi} saja`}><Icon name="edit" size={12} /></button>
                              <button type="button" onClick={() => setDeleteTarget(it)} className="rounded p-0.5 text-error hover:bg-error/10 cursor-pointer" title={`Hapus ${it.prodi} saja`}><Icon name="delete" size={12} /></button>
                            </span>
                          ))}
                        </div>
                      )}
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

                    {(() => {
                      const _clashList = [...new Map(group.items.flatMap((it) => conflictMap.get(it.id) || []).map((cc) => [cc.message, cc])).values()]
                      if (_clashList.length === 0) return null
                      return (
                      <div className="space-y-1.5 pt-1.5 border-t border-error/20">
                        {_clashList.map((c, idx) => (
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
                      )
                    })()}
                  </div>
                )
              })}
            </div>

            {/* Shared Pagination Controls (grup = 1 baris = MKWK umum lintas prodi) */}
            <div className="shrink-0 pt-1.5 border-t border-outline-variant/15 flex flex-wrap items-center justify-between gap-2">
              {groupingStats.isGrouped && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  <Icon name="compress" size={13} />
                  {groupingStats.totalSesi} sesi → {groupingStats.totalGrup} baris (hemat {groupingStats.hemat})
                </span>
              )}
              <div className="ml-auto">
              <Pagination
                currentPage={safeCurrentPage}
                totalItems={groupedSchedule.length}
                pageSize={pageSize === 0 ? 'Semua' : pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => setPageSize(sz === 'Semua' ? 0 : sz)}
                itemLabel="grup"
              />
              </div>
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

          <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low overflow-hidden animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0">
            <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1 -mx-2 shrink-0">
              <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
            </div>
            <header className="flex items-center justify-between p-5 border-b border-outline-variant/15 shrink-0">
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

            <form onSubmit={handleAddManualSession} className="flex-1 overflow-y-auto p-5 tablet:p-6">
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 tablet:gap-5">
                {/* KIRI — Waktu & penempatan */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
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
                </div>

                {/* KANAN — Identitas MK & ruang */}
                <div className="space-y-4">
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
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/15 mt-4 col-span-full">
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

          <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low overflow-hidden animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0">
            <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1 -mx-2 shrink-0">
              <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
            </div>
            <header className="flex items-center justify-between p-5 border-b border-outline-variant/15 shrink-0">
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

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-5 tablet:p-6">
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 tablet:gap-5">
                {/* KIRI — Waktu & penempatan */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
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

                  <div className="flex flex-col gap-1">
                    <label className="text-label-caps uppercase text-on-surface-variant">Program Studi</label>
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
                </div>

                {/* KANAN — Identitas MK & ruang */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-label-caps uppercase text-on-surface-variant">Ruangan</label>
                    <input
                      type="text"
                      value={editForm.ruang}
                      onChange={(e) => setEditForm((f) => ({ ...f, ruang: e.target.value }))}
                      className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>

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
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/15 mt-4 col-span-full">
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

      {/* ── 4b. Modal Edit GRUP (MK umum: 1x edit → update semua sesi dalam grup) ── */}
      {groupEditing && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 max-[599px]:items-end max-[599px]:justify-stretch max-[599px]:p-0">
          <div onClick={() => setGroupEditing(null)} className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in" />
          <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low overflow-hidden animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none">
            <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1 -mx-2 shrink-0"><span className="h-1 w-10 rounded-full bg-outline-variant/60" /></div>
            <header className="flex items-start justify-between p-5 border-b border-outline-variant/15 shrink-0 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300"><Icon name="edit_note" size={22} /></span>
                <div className="min-w-0">
                  <h3 className="text-title-lg font-bold tracking-tight text-on-surface">Edit Grup ({groupEditing.group.items.length} sesi)</h3>
                  <p className="text-body-xs font-medium text-on-surface-variant truncate">{groupEditing.group.items[0].kodeMK} — {groupEditing.group.items.map((it) => it.prodi).join(', ')}</p>
                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 mt-0.5">Aksi ini berlaku untuk SEMUA prodi dalam grup sekaligus. Untuk edit 1 prodi saja: expand baris → edit per-prodi.</p>
                </div>
              </div>
              <button type="button" onClick={() => setGroupEditing(null)} className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container cursor-pointer shrink-0"><Icon name="close" size={20} /></button>
            </header>
            <form onSubmit={handleSaveGroupEdit} className="flex-1 overflow-y-auto p-5 tablet:p-6">
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 tablet:gap-5">
                {/* KIRI — Ringkasan grup */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3.5">
                    <p className="text-label-caps uppercase font-bold text-amber-800 dark:text-amber-300 mb-2">Grup — {groupEditing.group.items.length} sesi terhubung</p>
                    <div className="flex flex-wrap gap-1.5">
                      {groupEditing.group.items.map((it) => (
                        <span key={it.id} className="inline-flex items-center rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">{it.prodi} S{it.semester}</span>
                      ))}
                    </div>
                    <p className="text-[11px] font-medium text-amber-800/80 dark:text-amber-200/80 mt-2">Kode, jam, dosen & ruang yang identik — perubahan di kanan akan diterapkan ke semua prodi ini.</p>
                  </div>
                </div>
                {/* KANAN — Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1"><label className="text-label-caps uppercase text-on-surface-variant">Hari</label><FormSelect value={groupEditing.editForm.hari} onChange={(val) => patchGroupForm({ hari: val })} options={DAYS.map((d) => ({ value: d, label: d }))} /></div>
                <div className="flex flex-col gap-1"><label className="text-label-caps uppercase text-on-surface-variant">Jam Mulai</label><input type="time" value={groupEditing.editForm.jamMulai} onChange={(e) => patchGroupForm({ jamMulai: e.target.value })} className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 font-mono text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none" /></div>
                <div className="flex flex-col gap-1"><label className="text-label-caps uppercase text-on-surface-variant">Jam Selesai</label><input type="time" value={groupEditing.editForm.jamSelesai} onChange={(e) => patchGroupForm({ jamSelesai: e.target.value })} className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 font-mono text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none" /></div>
                <div className="flex flex-col gap-1"><label className="text-label-caps uppercase text-on-surface-variant">Tipe Kelas</label><FormSelect value={groupEditing.editForm.tipeKelas} onChange={(val) => patchGroupForm({ tipeKelas: val })} options={CLASS_TYPE_CODES.map((t) => ({ value: t, label: t }))} /></div>
              </div>
                  <div className="flex flex-col gap-1"><label className="text-label-caps uppercase text-on-surface-variant">Mata Kuliah</label><FormSelect value={groupEditing.editForm.kodeMK} onChange={(val) => patchGroupForm({ kodeMK: val })} options={courses.map((cc) => ({ value: cc.kodeMK, label: `${cc.kodeMK} — ${cc.namaMK}` }))} /></div>
                  <div className="flex flex-col gap-1"><label className="text-label-caps uppercase text-on-surface-variant">Ruangan</label><input type="text" value={groupEditing.editForm.ruang} onChange={(e) => patchGroupForm({ ruang: e.target.value })} className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none" /></div>
                  <div className="flex flex-col gap-1"><label className="text-label-caps uppercase text-on-surface-variant">Status</label><FormSelect value={groupEditing.editForm.status} onChange={(val) => patchGroupForm({ status: val })} options={[{ value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }]} /></div>
                  {editErrors.length > 0 && (<div className="rounded-xl bg-error/10 p-2.5 text-body-xs font-semibold text-error">{editErrors.map((err) => (<p key={err}>{err}</p>))}</div>)}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/15 mt-4 col-span-full">
                <Button type="button" variant="secondary" onClick={() => setGroupEditing(null)} className="cursor-pointer">Batal</Button>
                <Button type="submit" disabled={busy} className="font-bold cursor-pointer"><Icon name="save" size={18} className="mr-1" />{busy ? 'Menyimpan...' : `Simpan Grup (${groupEditing.group.items.length} sesi)`}</Button>
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

          <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low overflow-hidden animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0">
            <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1 -mx-2 shrink-0">
              <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
            </div>
            <header className="flex items-center justify-between p-5 border-b border-outline-variant/15 shrink-0">
              <h3 className="text-title-md font-bold text-on-surface">Tambah Mata Kuliah Baru</h3>
              <button
                type="button"
                onClick={() => setNewCourseOpen(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                <Icon name="close" size={18} />
              </button>
            </header>

            <form onSubmit={handleSaveNewCourse} className="flex-1 overflow-y-auto p-5 tablet:p-6">
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 tablet:gap-5">
                <div className="space-y-3">
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
                </div>
                <div className="space-y-3">
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
                  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3.5">
                    <p className="text-label-caps uppercase font-bold text-primary mb-1">Tips</p>
                    <p className="text-body-xs font-medium leading-relaxed text-on-surface-variant">MK baru akan langsung tersedia di dropdown “Pilih Mata Kuliah” tanpa reload. Kode MK jadi key unik.</p>
                  </div>
                </div>
              </div>

              {newCourseErrors.length > 0 && (
                <div className="rounded-xl bg-error/10 p-2 text-body-xs font-semibold text-error">
                  {newCourseErrors.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant/15 mt-4 col-span-full">
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

      {/* ── 6. Dialog Konfirmasi Hapus Single / Grup (MK umum: hapus SEMUA sesi dalam grup) ── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?._group ? `Hapus ${deleteTarget._group.items.length} sesi grup?` : 'Hapus sesi jadwal?'}
        description={
          deleteTarget?._group
            ? `Grup ${deleteTarget._group.items[0]?.kodeMK} — ${deleteTarget._group.items.map((it) => it.prodi + ' S' + it.semester).join(', ')} — dengan jam ${deleteTarget._group.items[0]?.hari} ${deleteTarget._group.items[0]?.jamMulai} akan dihapus ${deleteTarget._group.items.length} sesi sekaligus (SEMUA prodi dalam grup). Batalkan salah satu jika hanya ingin hapus 1 prodi: expand baris → hapus per-prodi.`
            : `Sesi ${deleteTarget?.kodeMK} (${deleteTarget?.hari}, ${deleteTarget?.jamMulai}) akan dihapus permanen dari database.`
        }
        confirmLabel={deleteTarget?._group ? `Hapus ${deleteTarget._group.items.length} sesi grup` : 'Hapus Jadwal'}
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
              className="flex items-center gap-1 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 px-2.5 py-1.5 text-body-xs font-bold hover:bg-emerald-500/25 active:opacity-80 transition-all cursor-pointer"
            >
              <Icon name="check_circle" size={15} />
              <span>Publish</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkStatusChange('draft')}
              className="flex items-center gap-1 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25 px-2.5 py-1.5 text-body-xs font-bold hover:bg-amber-500/25 active:opacity-80 transition-all cursor-pointer"
            >
              <Icon name="pause_circle" size={15} />
              <span>Draft</span>
            </button>

            <button
              type="button"
              onClick={() => setBulkDeleteOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-error/15 text-error border border-error/25 px-2.5 py-1.5 text-body-xs font-bold hover:bg-error/25 active:opacity-80 transition-all cursor-pointer"
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
