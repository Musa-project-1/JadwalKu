import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import { UniversalImportModal } from '../../components/admin/UniversalImportModal'
import { OfficialNoticeboardModal } from '../../components/admin/OfficialNoticeboardModal'
import { BulkActionBar } from '../../components/admin/BulkActionBar'

// Modularized Components
import { ScheduleHeader } from '../../components/admin/manageSchedule/ScheduleHeader'
import { ScheduleToolbar } from '../../components/admin/manageSchedule/ScheduleToolbar'
import { ScheduleTable } from '../../components/admin/manageSchedule/ScheduleTable'
import { ScheduleCards } from '../../components/admin/manageSchedule/ScheduleCards'
import { ScheduleFormModal } from '../../components/admin/manageSchedule/ScheduleFormModal'
import { GroupEditModal } from '../../components/admin/manageSchedule/GroupEditModal'
import { QuickCourseModal } from '../../components/admin/manageSchedule/QuickCourseModal'

// Hooks & Libs
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { useCampus } from '../../context/CampusContext'
import { deleteDocument, setDocument, updateDocument } from '../../lib/adminData'
import { appendHistory, publishDocuments, saveSettings } from '../../lib/publishHelpers'
import { deriveTahunAjaran, expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'
import { findConflicts, validateCourseEntry, validateScheduleEntry } from '../../lib/uploadValidator'
import {
  buildTaOptions,
  buildSemesterOptions,
  filterSchedule,
  groupSchedule,
  jadwalDocId,
} from '../../lib/scheduleUtils'

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
    for (const pr of programs || []) {
      m.set(String(pr.nama || ''), String(pr.fakultasId || pr.fakultasNama || ''))
    }
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

  // List prodi options — Opsi B: hanya yang ada data (DB + kampus). Fallback 5 default prodi
  const prodiOptions = useMemo(() => {
    const fromDb = programs?.map((p) => p.nama || p.id).filter(Boolean) || []
    const fromCampus = campusProdiNames || []
    const have = [...new Set([...fromCampus, ...fromDb].filter(Boolean))]
    if (have.length > 0) return have.sort()
    return ['Arsitektur', 'Bisnis Digital', 'Informatika', 'Kewirausahaan', 'Teknik Sipil']
  }, [programs, campusProdiNames])

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

  const availableTaOptions = useMemo(() => buildTaOptions(rawSchedule), [rawSchedule])

  useEffect(() => {
    if (!taFilter) return
    const ok = availableTaOptions.some((o) => String(o.value) === String(taFilter))
    if (!ok) setTaFilter('')
  }, [availableTaOptions, taFilter])

  // Opsi B + cascade: kalau TA dipilih, semester cuma yang ada di TA itu
  const availableSemesterOptions = useMemo(
    () => buildSemesterOptions(rawSchedule, taFilter),
    [rawSchedule, taFilter],
  )

  useEffect(() => {
    if (!semesterFilter) return
    if (semesterFilter === 'ganjil' || semesterFilter === 'genap') return
    const ok = availableSemesterOptions.some((o) => String(o.value) === String(semesterFilter))
    if (!ok) setSemesterFilter('')
  }, [availableSemesterOptions, semesterFilter])

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

  // ── State Bulk Selection ──
  const [selectedIds, setSelectedIds] = useState(new Set())

  // ── State UX: Modals & Pagination ──
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [noticeboardModalOpen, setNoticeboardModalOpen] = useState(false)
  const [onlyShowConflicts, setOnlyShowConflicts] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // ── State Edit Jadwal Modal ──
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_SESSION)
  const [editErrors, setEditErrors] = useState([])

  // ── State Group Edit Modal ──
  const [groupEditing, setGroupEditing] = useState(null)

  // ── State Delete Dialog ──
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  // Global ESC key to deselect bulk
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && selectedIds.size > 0) {
        setSelectedIds(new Set())
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIds.size])

  // ── Validasi Bentrok Cerdas Database ──
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
  const filteredSchedule = useMemo(
    () =>
      filterSchedule(
        rawSchedule,
        {
          fakultasFilter,
          prodiFilter,
          semesterFilter,
          taFilter,
          hariFilter,
          statusFilter,
          onlyShowConflicts,
          search,
        },
        { courseMap, prodiFakultasMap, conflictMap },
      ),
    [
      rawSchedule,
      fakultasFilter,
      prodiFilter,
      semesterFilter,
      taFilter,
      hariFilter,
      statusFilter,
      onlyShowConflicts,
      conflictMap,
      search,
      courseMap,
      prodiFakultasMap,
    ],
  )

  // ── Grouping MK Umum: kodeMK+hari+jam+dosen+ruang → 1 baris, badge multi-prodi
  const groupedSchedule = useMemo(
    () => groupSchedule(filteredSchedule, courseMap),
    [filteredSchedule, courseMap],
  )

  const groupingStats = useMemo(() => {
    const totalSesi = filteredSchedule.length
    const totalGrup = groupedSchedule.length
    const hemat = totalSesi - totalGrup
    return { totalSesi, totalGrup, hemat, isGrouped: hemat > 0 }
  }, [filteredSchedule.length, groupedSchedule.length])

  // Paginasi per GRUP
  const totalPages = pageSize === 0 ? 1 : Math.ceil(groupedSchedule.length / pageSize) || 1
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages))
  const paginatedGroups = useMemo(() => {
    if (pageSize === 0) return groupedSchedule
    const start = (safeCurrentPage - 1) * pageSize
    return groupedSchedule.slice(start, start + pageSize)
  }, [groupedSchedule, safeCurrentPage, pageSize])

  // Expand state untuk grup multi-prodi
  const [expandedGroups, setExpandedGroups] = useState(() => new Set())
  function toggleExpandGroup(key) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Reset expand kalau filter berubah
  useEffect(() => {
    setExpandedGroups(new Set())
  }, [
    search,
    fakultasFilter,
    prodiFilter,
    semesterFilter,
    taFilter,
    hariFilter,
    statusFilter,
    onlyShowConflicts,
  ])

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

    // 2. Simpan sesi jadwal ke Firestore
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
    for (const doc of scheduleDocs) {
      const { id, ...data } = doc
      await setDocument('jadwal', id, data, actor)
    }
    const res = await publishDocuments(
      'jadwal',
      scheduleDocs.map((d) => d.id),
      actor,
    )

    // 3. Simpan & publikasikan Ujian jika ada
    if (parsedData.exams && parsedData.exams.length > 0) {
      const examDocs = parsedData.exams.map((ex) => ({
        id: `${ex.prodi}|${ex.kodeMK}|${ex.jenis}|${ex.tanggal}`.replace(/[/#?[\]]/g, '-'),
        ...ex,
        tahunAjaran: targetTA,
        status: 'published',
      }))
      for (const doc of examDocs) {
        const { id, ...data } = doc
        await setDocument('ujian', id, data, actor)
      }
      await publishDocuments(
        'ujian',
        examDocs.map((d) => d.id),
        actor,
      )
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
    const _manualTA =
      expectedTahunAjaranForSemester(
        Number(manualForm.semester) || 1,
        new Date(),
        academicCalendar,
      ) || currentTA
    const docId = jadwalDocId(manualForm, _manualTA)
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
      setBanner({
        ok: true,
        message: `Sesi jadwal ${newDoc.kodeMK} (${newDoc.hari}) berhasil disimpan!`,
      })
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

  // ── Handler Hapus Jadwal (Single / Grup) ──
  async function handleDeleteSingle() {
    if (!deleteTarget) return
    const target = deleteTarget
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
        await appendHistory({
          entitas: 'jadwal',
          field: 'hapus_grup',
          nilaiLama: target._group,
          nilaiBaru: null,
          aktor: actor,
          detail: `Hapus grup ${target._group.items[0]?.kodeMK} (${okCount} sesi)`,
        })
        setBanner({
          ok: true,
          message: `${okCount} sesi grup ${target._group.items[0]?.kodeMK} berhasil dihapus!`,
        })
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

  // ── Bulk Actions Handler (Group-Aware) ──
  const allFilteredIds = filteredSchedule.map((item) => item.id)
  function toggleSelectAll() {
    if (selectedIds.size === allFilteredIds.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allFilteredIds))
    }
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

  async function handleGroupDelete(group) {
    setDeleteTarget({
      _group: group,
      ids: group.items.map((it) => it.id),
      label: `${group.items[0].kodeMK} — ${group.items.length} prodi`,
    })
  }

  // ── Group Edit ──
  function openGroupEditModal(group) {
    const first = group.items[0]
    setGroupEditing({
      group,
      editForm: {
        hari: first.hari,
        jamMulai: first.jamMulai,
        jamSelesai: first.jamSelesai,
        kodeMK: first.kodeMK,
        ruang: first.ruang ?? '',
        tipeKelas: first.tipeKelas ?? 'K1',
        status: first.status ?? 'published',
      },
    })
    setEditErrors([])
  }

  function patchGroupForm(patch) {
    setGroupEditing((s) => (s ? { ...s, editForm: { ...s.editForm, ...patch } } : s))
  }

  async function handleSaveGroupEdit(e) {
    e.preventDefault()
    if (!groupEditing) return
    const errors = validateScheduleEntry({
      ...groupEditing.editForm,
      prodi: groupEditing.group.items[0].prodi,
      semester: groupEditing.group.items[0].semester,
    })
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
      await appendHistory({
        entitas: 'jadwal',
        field: 'edit_grup',
        nilaiLama: groupEditing.group,
        nilaiBaru: groupEditing.editForm,
        aktor: actor,
        detail: `Edit grup ${groupEditing.group.items[0].kodeMK} (${okCount} sesi)`,
      })
      setBanner({
        ok: true,
        message: `Grup ${groupEditing.group.items[0].kodeMK} (${okCount} sesi) berhasil diperbarui!`,
      })
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
      detail: `Menghapus massal ${deletedCount} jadwal`,
    })
    setBanner({
      ok: true,
      message: `Berhasil menghapus ${deletedCount} jadwal dari database!`,
    })
    setSelectedIds(new Set())
  }

  function handleResetFilters() {
    setSearch('')
    setFakultasFilter('')
    setProdiFilter('')
    setSemesterFilter('')
    setTaFilter('')
    setHariFilter('')
    setStatusFilter('')
    setOnlyShowConflicts(false)
  }

  function downloadTemplate() {
    const templateData = [
      {
        Hari: 'Senin',
        'Jam Mulai': '08:00',
        'Jam Selesai': '09:40',
        Prodi: 'Informatika',
        Semester: 1,
        'Kode MK': 'IF101',
        'Nama MK': 'Dasar Pemrograman',
        'Dosen Pengampu': 'Dr. Alan Turing',
        Ruang: 'Lab 1',
        'Tipe Kelas': 'K1',
        SKS: 2,
      },
    ]
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'Template_Jadwal_JadwalKu.xlsx')
  }

  function exportCurrentSchedule() {
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

  const publishedCount = rawSchedule.filter((s) => (s.status || 'published') === 'published').length
  const draftCount = rawSchedule.filter((s) => (s.status || 'published') === 'draft').length

  return (
    <div className="h-full flex flex-col space-y-2.5 tablet:space-y-3 pb-20 tablet:pb-0 animate-fade-in w-full max-w-full overflow-hidden min-h-0 flex-1">
      {/* ── 1. Page Header ── */}
      <ScheduleHeader
        currentTA={currentTA}
        publishedCount={publishedCount}
        draftCount={draftCount}
        conflictCount={conflictMap.size}
        onlyShowConflicts={onlyShowConflicts}
        onToggleOnlyConflicts={() => setOnlyShowConflicts(!onlyShowConflicts)}
        onOpenNoticeboard={() => setNoticeboardModalOpen(true)}
        onOpenImport={() => setImportModalOpen(true)}
        onOpenAddSession={() => {
          setManualForm(EMPTY_SESSION)
          setManualErrors([])
          setAddModalOpen(true)
        }}
      />

      {banner && (
        <div className="shrink-0">
          <StatusBanner
            ok={banner.ok}
            message={banner.message}
            onClose={() => setBanner(null)}
          />
        </div>
      )}

      {/* ── 2. Live Database Schedule Management ── */}
      <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-3.5 tablet:p-4 shadow-xs dark:bg-surface-container-low dark:border-outline-variant/15 flex-1 flex flex-col min-h-0 space-y-2.5">
        <ScheduleToolbar
          search={search}
          setSearch={setSearch}
          fakultasFilter={fakultasFilter}
          setFakultasFilter={setFakultasFilter}
          prodiFilter={prodiFilter}
          setProdiFilter={setProdiFilter}
          semesterFilter={semesterFilter}
          setSemesterFilter={setSemesterFilter}
          taFilter={taFilter}
          setTaFilter={setTaFilter}
          hariFilter={hariFilter}
          setHariFilter={setHariFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onlyShowConflicts={onlyShowConflicts}
          setOnlyShowConflicts={setOnlyShowConflicts}
          availableFakultasOptions={availableFakultasOptions}
          prodiOptions={prodiOptions}
          availableTaOptions={availableTaOptions}
          availableSemesterOptions={availableSemesterOptions}
          conflictsCount={conflictsList.length}
          onResetFilters={handleResetFilters}
          onDownloadTemplate={downloadTemplate}
          onExportExcel={exportCurrentSchedule}
          prodiFakultasMap={prodiFakultasMap}
        />

        {/* ── Table / Cards List ── */}
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
            <ScheduleTable
              paginatedGroups={paginatedGroups}
              courseMap={courseMap}
              conflictMap={conflictMap}
              selectedIds={selectedIds}
              filteredScheduleCount={filteredSchedule.length}
              expandedGroups={expandedGroups}
              onToggleSelectAll={toggleSelectAll}
              onToggleSelectGroup={toggleSelectGroup}
              onToggleExpandGroup={toggleExpandGroup}
              onOpenEdit={openEditModal}
              onOpenGroupEdit={openGroupEditModal}
              onDuplicate={handleDuplicate}
              onDeleteSingle={(item) => setDeleteTarget(item)}
              onDeleteGroup={handleGroupDelete}
            />

            <ScheduleCards
              paginatedGroups={paginatedGroups}
              courseMap={courseMap}
              conflictMap={conflictMap}
              selectedIds={selectedIds}
              expandedGroups={expandedGroups}
              onToggleSelectGroup={toggleSelectGroup}
              onToggleExpandGroup={toggleExpandGroup}
              onOpenEdit={openEditModal}
              onOpenGroupEdit={openGroupEditModal}
              onDuplicate={handleDuplicate}
              onDeleteSingle={(item) => setDeleteTarget(item)}
              onDeleteGroup={handleGroupDelete}
            />

            {/* Pagination Controls */}
            <div className="shrink-0 pt-1.5 border-t border-outline-variant/15 flex flex-wrap items-center justify-between gap-2">
              {groupingStats.isGrouped && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  <Icon name="compress" size={13} />
                  {groupingStats.totalSesi} sesi → {groupingStats.totalGrup} baris (hemat{' '}
                  {groupingStats.hemat})
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

      {/* ── 3. Modal Tambah Sesi Manual ── */}
      <ScheduleFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Tambah Sesi Jadwal Manual"
        subtitle="Input jadwal perkuliahan secara individual"
        icon="add_circle"
        submitLabel="Simpan Sesi ke Database"
        formData={manualForm}
        setFormData={setManualForm}
        onSubmit={handleAddManualSession}
        busy={busy}
        prodiOptions={prodiOptions}
        courses={courses}
        clashWarning={addModalClash}
        errors={manualErrors}
        showStatus={false}
        onCreateCourse={() => setNewCourseOpen(true)}
      />

      {/* ── 4. Modal Edit Jadwal Individual ── */}
      <ScheduleFormModal
        open={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title="Edit Sesi Jadwal"
        subtitle={editingItem ? `${editingItem.kodeMK} — ${editingItem.hari}` : ''}
        icon="edit_calendar"
        submitLabel="Simpan Perubahan"
        formData={editForm}
        setFormData={setEditForm}
        onSubmit={handleSaveEdit}
        busy={busy}
        prodiOptions={prodiOptions}
        courses={courses}
        clashWarning={editModalClash}
        errors={editErrors}
        showStatus={true}
      />

      {/* ── 4b. Modal Edit GRUP (MK Umum) ── */}
      <GroupEditModal
        groupEditing={groupEditing}
        onClose={() => setGroupEditing(null)}
        onSubmit={handleSaveGroupEdit}
        patchGroupForm={patchGroupForm}
        courses={courses}
        busy={busy}
        errors={editErrors}
      />

      {/* ── 5. Modal Buat MK Cepat ── */}
      <QuickCourseModal
        open={newCourseOpen}
        onClose={() => setNewCourseOpen(false)}
        onSubmit={handleSaveNewCourse}
        formData={newCourseForm}
        setFormData={setNewCourseForm}
        saving={savingCourse}
        errors={newCourseErrors}
      />

      {/* ── 6. Dialog Konfirmasi Hapus Single / Grup ── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?._group
            ? `Hapus ${deleteTarget._group.items.length} sesi grup?`
            : 'Hapus sesi jadwal?'
        }
        description={
          deleteTarget?._group
            ? `Grup ${deleteTarget._group.items[0]?.kodeMK} — ${deleteTarget._group.items
                .map((it) => `${it.prodi} S${it.semester}`)
                .join(', ')} — dengan jam ${deleteTarget._group.items[0]?.hari} ${
                deleteTarget._group.items[0]?.jamMulai
              } akan dihapus ${deleteTarget._group.items.length} sesi sekaligus (SEMUA prodi dalam grup).`
            : `Sesi ${deleteTarget?.kodeMK} (${deleteTarget?.hari}, ${deleteTarget?.jamMulai}) akan dihapus permanen dari database.`
        }
        confirmLabel={
          deleteTarget?._group
            ? `Hapus ${deleteTarget._group.items.length} sesi grup`
            : 'Hapus Jadwal'
        }
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

      {/* ── 8. Bulk Action Bar ── */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onPublish={() => handleBulkStatusChange('published')}
        onDelete={() => setBulkDeleteOpen(true)}
        onClear={() => setSelectedIds(new Set())}
        isBusy={busy}
        itemLabel="Sesi"
      />

      {/* ── 9. Universal Schedule Importer & Noticeboard ── */}
      <UniversalImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSave={handleUniversalImportSave}
        prodiOptions={prodiOptions}
        currentTA={currentTA}
        existingTAs={existingTAs}
      />

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
