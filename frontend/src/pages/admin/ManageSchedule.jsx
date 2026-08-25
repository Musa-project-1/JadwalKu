import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { deleteDocument, setDocument, updateDocument } from '../../lib/adminData'
import { appendHistory, publishDocuments, saveSettings } from '../../lib/publishHelpers'
import { deriveTahunAjaran } from '../../lib/tahunAjaran'
import { parseWorkbook } from '../../lib/xlsxParser'
import {
  CLASS_TYPE_CODES,
  DAYS,
  findConflicts,
  findUnmatchedCourseCodes,
  validateCourseEntry,
  validateScheduleEntry,
} from '../../lib/uploadValidator'

const MAX_FILE_BYTES = 10 * 1024 * 1024

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

/** Custom Modern Popover Dropdown for Prodi */
function ProdiFilterDropdown({ prodiOptions, selected, onSelect }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-[12px] font-medium transition-all cursor-pointer ${
          selected
            ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20 font-semibold'
            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'
        }`}
      >
        <Icon name="school" size={14} className={selected ? 'text-primary' : 'text-on-surface-variant'} />
        <span className="max-w-[140px] truncate">{selected || 'Semua Prodi'}</span>
        <Icon
          name="expand_more"
          size={14}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-60 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-2 shadow-2xl dark:bg-surface-container-high animate-fade-up space-y-0.5">
          <button
            type="button"
            onClick={() => {
              onSelect('')
              setOpen(false)
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-[12px] font-medium transition-colors cursor-pointer ${
              !selected
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'
            }`}
          >
            <span>Semua Prodi</span>
            {!selected && <Icon name="check" size={14} className="text-primary" />}
          </button>
          {prodiOptions.map((p) => {
            const isSelected = selected === p
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onSelect(p)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-[12px] font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'
                }`}
              >
                <span>{p}</span>
                {isSelected && <Icon name="check" size={14} className="text-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Custom Modern Popover Dropdown for Semester */
function SemesterFilterDropdown({ selected, onSelect }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const selectedLabel = SEMESTERS.find((s) => s.value === selected)?.label || 'Semua Semester'

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap ${
          selected
            ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20 font-semibold'
            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'
        }`}
      >
        <Icon name="layers" size={14} className={selected ? 'text-primary' : 'text-on-surface-variant'} />
        <span>{selectedLabel}</span>
        <Icon
          name="expand_more"
          size={14}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-68 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-2 shadow-2xl dark:bg-surface-container-high animate-fade-up max-h-72 overflow-y-auto space-y-0.5 custom-scrollbar">
          {SEMESTERS.map((s) => {
            const isSelected = selected === s.value
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  onSelect(s.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-[12px] font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'
                }`}
              >
                <span>{s.label}</span>
                {isSelected && <Icon name="check" size={14} className="text-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Custom Modern Popover Dropdown for Hari */
function HariFilterDropdown({ selected, onSelect }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap ${
          selected
            ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20 font-semibold'
            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'
        }`}
      >
        <Icon name="calendar_today" size={14} className={selected ? 'text-primary' : 'text-on-surface-variant'} />
        <span>{selected || 'Semua Hari'}</span>
        <Icon
          name="expand_more"
          size={14}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-48 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-2 shadow-2xl dark:bg-surface-container-high animate-fade-up space-y-0.5">
          <button
            type="button"
            onClick={() => {
              onSelect('')
              setOpen(false)
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-[12px] font-medium transition-colors cursor-pointer ${
              !selected
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'
            }`}
          >
            <span>Semua Hari</span>
            {!selected && <Icon name="check" size={14} className="text-primary" />}
          </button>
          {DAYS.map((d) => {
            const isSelected = selected === d
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  onSelect(d)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-[12px] font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'
                }`}
              >
                <span>{d}</span>
                {isSelected && <Icon name="check" size={14} className="text-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Custom Modern Popover Dropdown for Status */
function StatusFilterDropdown({ selected, onSelect }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const options = [
    { label: 'Semua Status', value: '', dot: null },
    { label: 'Published', value: 'published', dot: 'bg-emerald-500' },
    { label: 'Draft', value: 'draft', dot: 'bg-amber-500' },
  ]

  const selectedOption = options.find((o) => o.value === selected) || options[0]

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap ${
          selected
            ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20 font-semibold'
            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'
        }`}
      >
        <Icon name="verified" size={14} className={selected ? 'text-primary' : 'text-on-surface-variant'} />
        <span>{selectedOption.label}</span>
        <Icon
          name="expand_more"
          size={14}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1.5 w-48 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-2 shadow-2xl dark:bg-surface-container-high animate-fade-up space-y-0.5">
          {options.map((o) => {
            const isSelected = selected === o.value
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onSelect(o.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-[12px] font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2">
                  {o.dot && <span className={`h-2 w-2 rounded-full ${o.dot}`} />}
                  <span>{o.label}</span>
                </div>
                {isSelected && <Icon name="check" size={14} className="text-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}


export default function ManageSchedule() {
  const { data: rawSchedule, loading: loadingSchedule } = useFirestore('jadwal')
  const { data: courses } = useFirestore('mataKuliah')
  const { data: programs } = useFirestore('prodi')
  const { data: settingsDocs } = useFirestore('settings')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

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

  // List prodi options gabungan
  const prodiOptions = useMemo(() => {
    const fromDb = programs?.map((p) => p.nama || p.id).filter(Boolean) || []
    const combined = [...new Set(['Informatika', 'Bisnis Digital', 'Arsitektur', 'Teknik Sipil', 'Kewirausahaan', ...fromDb])]
    return combined.sort()
  }, [programs])

  // State Banner & Global Loading
  const [banner, setBanner] = useState(null)
  const [busy, setBusy] = useState(false)

  // ── State Upload Spreadsheet ──
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadParsed, setUploadParsed] = useState(null)
  const [uploadFileName, setUploadFileName] = useState('')
  const [uploadError, setUploadError] = useState('')

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

  // ── State Edit Jadwal Modal ──
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_SESSION)
  const [editErrors, setEditErrors] = useState([])

  // ── State Delete Dialog ──
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  // ── Validasi Bentrok Data Database ──
  const conflictMap = useMemo(() => {
    if (!rawSchedule || rawSchedule.length === 0) return new Map()
    const conflicts = findConflicts(rawSchedule)
    const map = new Map()
    for (const c of conflicts) {
      const entryA = rawSchedule[c.a]
      const entryB = rawSchedule[c.b]
      if (entryA?.id) map.set(entryA.id, c.message)
      if (entryB?.id) map.set(entryB.id, c.message)
    }
    return map
  }, [rawSchedule])

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
  }, [rawSchedule, prodiFilter, semesterFilter, hariFilter, statusFilter, search, courseMap])

  // ── Validasi Upload Data ──
  const uploadValidation = useMemo(() => {
    if (!uploadParsed) return null
    const entryErrors = uploadParsed.scheduleEntries
      .map((entry, index) => ({ index, entry, errors: validateScheduleEntry(entry) }))
      .filter((r) => r.errors.length > 0)
    const courseErrors = uploadParsed.courses
      .map((course, index) => ({ index, course, errors: validateCourseEntry(course) }))
      .filter((r) => r.errors.length > 0)
    const conflicts = findConflicts(uploadParsed.scheduleEntries)
    const knownCodes = new Set([
      ...courses.map((c) => c.kodeMK),
      ...uploadParsed.courses.map((c) => c.kodeMK),
    ])
    const unmatched = findUnmatchedCourseCodes(
      uploadParsed.scheduleEntries,
      [...knownCodes].map((kodeMK) => ({ kodeMK })),
    )
    return { entryErrors, courseErrors, conflicts, unmatched }
  }, [uploadParsed, courses])

  const canPublishUpload =
    uploadValidation &&
    uploadValidation.entryErrors.length === 0 &&
    uploadValidation.courseErrors.length === 0 &&
    uploadValidation.conflicts.length === 0 &&
    uploadValidation.unmatched.length === 0

  // ── Handler Upload Spreadsheet ──
  async function handleFile(file) {
    setUploadError('')
    setBanner(null)
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      setUploadError('Ukuran file melebihi batas 10MB.')
      return
    }

    try {
      const buffer = await file.arrayBuffer()
      const result = parseWorkbook(buffer)
      if (
        result.scheduleEntries.length === 0 &&
        result.courses.length === 0 &&
        result.exams.length === 0
      ) {
        setUploadError('Tidak ada data terbaca. Pastikan sheet jadwal atau MK tersedia.')
        return
      }
      setUploadFileName(file.name)
      setUploadParsed(result)
    } catch (err) {
      setUploadError(`Gagal membaca file: ${err?.message ?? err}`)
    }
  }

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

  async function handlePublishUpload() {
    if (!canPublishUpload) return
    setBusy(true)
    const activeTA = currentTA

    // 1. Simpan Master MK
    for (const c of uploadParsed.courses) {
      await setDocument('mataKuliah', c.kodeMK, c, actor)
    }

    // 2. Publikasikan Jadwal
    const scheduleDocs = uploadParsed.scheduleEntries.map((e) => ({
      id: jadwalDocId(e),
      ...e,
      tahunAjaran: activeTA,
      status: 'published',
    }))
    const res = await publishDocuments('jadwal', scheduleDocs, actor)

    // 3. Publikasikan Ujian jika ada
    if (uploadParsed.exams.length > 0) {
      const examDocs = uploadParsed.exams.map((ex) => ({
        id: `${ex.prodi}|${ex.kodeMK}|${ex.jenis}|${ex.tanggal}`.replace(/[/#?[\]]/g, '-'),
        ...ex,
        tahunAjaran: activeTA,
        status: 'published',
      }))
      await publishDocuments('ujian', examDocs, actor)
    }

    setBusy(false)
    if (res.ok) {
      await saveSettings({ lastUpdated: new Date().toISOString() }, actor)
      await appendHistory({
        entitas: 'jadwal',
        field: 'upload_master',
        nilaiLama: null,
        nilaiBaru: { count: scheduleDocs.length, file: uploadFileName },
        aktor: actor,
        detail: `Upload file spreadsheet ${uploadFileName} (${scheduleDocs.length} jadwal)`,
      })
      setBanner({
        ok: true,
        message: `Berhasil mengimpor & mempublikasikan ${scheduleDocs.length} sesi jadwal dari ${uploadFileName}!`,
      })
      setUploadParsed(null)
      setUploadFileName('')
    } else {
      setBanner({ ok: false, message: res.error })
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
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* ── 1. Header & Live Quick Stats ── */}
      <header className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-container/60 text-secondary shadow-xs dark:bg-secondary-container/30">
            <Icon name="edit_calendar" size={26} />
          </span>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-headline-lg font-bold tracking-tight text-on-surface">Kelola & Upload Jadwal</h1>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                <Icon name="event" size={13} />
                TA {currentTA}
              </span>
            </div>
            <p className="text-body-sm font-medium text-on-surface-variant mt-0.5">
              Pusat manajemen jadwal kuliah — unggah spreadsheet master, input sesi baru, atau edit jadwal aktif.
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setManualForm(EMPTY_SESSION)
              setManualErrors([])
              setAddModalOpen(true)
            }}
            className="font-bold shadow-xs cursor-pointer text-body-sm"
          >
            <Icon name="add_circle" size={18} className="mr-1.5" />
            <span>Tambah Sesi Manual</span>
          </Button>
        </div>
      </header>

      {banner && (
        <StatusBanner
          ok={banner.ok}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* ── 2. Top Action Area: Spreadsheet Uploader ── */}
      <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-xs dark:bg-surface-container-low dark:border-outline-variant/15">
        <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant/10 mb-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon name="upload_file" size={20} />
          </span>
          <div>
            <h2 className="text-title-md font-bold tracking-tight text-on-surface">Import Spreadsheet Master</h2>
            <p className="text-body-xs font-medium text-on-surface-variant">Unggah file jadwal resmi (.xlsx / .csv)</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const f = e.dataTransfer.files?.[0]
              if (f) handleFile(f)
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
              dragOver
                ? 'border-primary bg-primary/10'
                : 'border-outline-variant/40 bg-surface-container-low/40 hover:border-primary/60 hover:bg-surface-container-low'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Icon name="cloud_upload" size={26} />
            </div>
            <p className="mt-2.5 text-body-md font-bold text-on-surface">
              {uploadFileName || 'Tarik file spreadsheet ke sini atau klik untuk browse'}
            </p>
            <p className="text-body-xs font-medium text-on-surface-variant mt-0.5">
              Format resmi .xlsx / .csv • Maksimal 10MB
            </p>
          </div>

          {uploadError && (
            <div className="rounded-xl bg-error/10 p-3 text-body-xs font-semibold text-error">
              {uploadError}
            </div>
          )}

          {/* Hasil Parsing File */}
          {uploadParsed && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3 animate-fade-up">
              <div className="flex items-center justify-between">
                <span className="font-mono text-body-xs font-bold text-primary uppercase">
                  Hasil Analisis: {uploadFileName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUploadParsed(null)
                    setUploadFileName('')
                  }}
                  className="text-body-xs text-error hover:underline font-bold cursor-pointer"
                >
                  Batal File
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-surface-container-lowest p-2.5 border border-outline-variant/15 dark:bg-surface-container-low">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-on-surface-variant">Jadwal Sesi</p>
                  <p className="text-title-lg font-bold text-primary mt-0.5">
                    {uploadParsed.scheduleEntries.length}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container-lowest p-2.5 border border-outline-variant/15 dark:bg-surface-container-low">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-on-surface-variant">Master MK</p>
                  <p className="text-title-lg font-bold text-secondary mt-0.5">
                    {uploadParsed.courses.length}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container-lowest p-2.5 border border-outline-variant/15 dark:bg-surface-container-low">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-on-surface-variant">Ujian</p>
                  <p className="text-title-lg font-bold text-tertiary mt-0.5">
                    {uploadParsed.exams.length}
                  </p>
                </div>
              </div>

              {uploadValidation?.conflicts.length > 0 && (
                <div className="rounded-xl bg-amber-500/10 p-2.5 text-body-xs font-semibold text-amber-800 dark:text-amber-300">
                  ⚠️ Terdeteksi {uploadValidation.conflicts.length} bentrok jadwal di dalam file.
                </div>
              )}

              <Button
                onClick={handlePublishUpload}
                disabled={busy || !canPublishUpload}
                className="w-full justify-center font-bold shadow-xs cursor-pointer"
              >
                <Icon name="rocket_launch" size={18} className="mr-1.5" />
                {busy ? 'Mempublikasikan...' : 'Publikasikan Jadwal Spreadsheet'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Live Database Schedule Management ── */}
      <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-xs dark:bg-surface-container-low dark:border-outline-variant/15 space-y-4">
        {/* Header & Filter Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary font-bold">
                <Icon name="table_chart" size={20} />
              </span>
              <div>
                <h2 className="text-title-lg font-bold tracking-tight text-on-surface">Daftar Jadwal Aktif</h2>
                <p className="text-body-xs font-medium text-on-surface-variant">
                  Total {filteredSchedule.length} dari {rawSchedule.length} sesi perkuliahan di database
                </p>
              </div>
            </div>

            {/* Table Header Action Buttons & Bulk Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedIds.size > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-primary/10 px-3 py-1 border border-primary/20 animate-fade-in mr-1">
                  <span className="text-body-xs font-bold text-primary">
                    {selectedIds.size} dipilih:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleBulkStatusChange('published')}
                    className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-body-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25 cursor-pointer transition-colors"
                  >
                    Publish
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStatusChange('draft')}
                    className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-body-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 cursor-pointer transition-colors"
                  >
                    Unpublish
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkDeleteOpen(true)}
                    className="rounded-lg bg-error/15 px-2 py-0.5 text-body-xs font-bold text-error hover:bg-error/25 cursor-pointer transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-outline-variant/30 bg-surface-container-low/60 px-3 py-1.5 text-[12px] font-medium text-on-surface shadow-2xs hover:border-primary hover:text-primary cursor-pointer transition-colors"
                title="Download Template Format Excel"
              >
                <Icon name="download" size={14} className="text-primary" />
                <span>Template Excel</span>
              </button>

              <button
                type="button"
                onClick={exportCurrentSchedule}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-outline-variant/30 bg-surface-container-low/60 px-3 py-1.5 text-[12px] font-medium text-on-surface shadow-2xs hover:border-primary hover:text-primary cursor-pointer transition-colors"
                title="Ekspor Seluruh Jadwal Tampil ke Excel"
              >
                <Icon name="file_download" size={14} className="text-secondary" />
                <span>Ekspor Data</span>
              </button>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-col gap-2.5 tablet:flex-row tablet:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Icon
                name="search"
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari mata kuliah, dosen, ruang, prodi, hari…"
                className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 py-2 pl-10 pr-4 text-body-sm font-medium text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:bg-surface-container rounded-full p-1 cursor-pointer"
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>

            {/* Custom Popover Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
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

              {(search || prodiFilter || semesterFilter || hariFilter || statusFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setProdiFilter('')
                    setSemesterFilter('')
                    setHariFilter('')
                    setStatusFilter('')
                  }}
                  className="inline-flex items-center gap-1 rounded-2xl border border-error/30 bg-error/10 px-3 py-2 text-body-xs font-bold text-error hover:bg-error/20 cursor-pointer transition-colors"
                >
                  <Icon name="refresh" size={14} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Badges */}
          {(prodiFilter || semesterFilter || hariFilter || statusFilter || search) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 animate-fade-in">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mr-1">
                Filter Aktif:
              </span>
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
        </div>

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
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-2xs tablet:block dark:bg-surface-container-low">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/15 bg-surface-container-low/60 dark:bg-surface-container-high/30">
                    <th className="px-4 py-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredSchedule.length && filteredSchedule.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded cursor-pointer"
                        aria-label="Pilih Semua"
                      />
                    </th>
                    <th className="px-4 py-3 text-label-caps uppercase text-on-surface-variant">
                      Hari & Waktu
                    </th>
                    <th className="px-4 py-3 text-label-caps uppercase text-on-surface-variant">
                      Prodi & Sem
                    </th>
                    <th className="px-4 py-3 text-label-caps uppercase text-on-surface-variant">
                      Mata Kuliah & Dosen
                    </th>
                    <th className="px-4 py-3 text-label-caps uppercase text-on-surface-variant">
                      Ruang / Tipe
                    </th>
                    <th className="px-4 py-3 text-label-caps uppercase text-on-surface-variant text-center">
                      Status
                    </th>
                    <th className="px-4 py-3 text-label-caps uppercase text-on-surface-variant text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredSchedule.map((item) => {
                    const course = courseMap.get(item.kodeMK)
                    const isSelected = selectedIds.has(item.id)
                    const clashMsg = conflictMap.get(item.id)

                    return (
                      <tr
                        key={item.id}
                        className={`group transition-colors hover:bg-surface-container-low/50 dark:hover:bg-surface-container-high/20 ${
                          isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                        } ${clashMsg ? 'bg-red-500/5 dark:bg-red-500/10' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(item.id)}
                            className="rounded cursor-pointer"
                          />
                        </td>

                        {/* Hari & Waktu */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="font-bold text-body-md text-on-surface">{item.hari}</p>
                          <p className="font-mono text-body-xs font-semibold text-on-surface-variant">
                            {item.jamMulai} - {item.jamSelesai}
                          </p>
                          {clashMsg && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-error mt-0.5">
                              <Icon name="warning" size={13} />
                              Bentrok
                            </span>
                          )}
                        </td>

                        {/* Prodi & Sem */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="font-semibold text-body-sm text-on-surface">{item.prodi}</p>
                          <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-0.5 text-body-xs font-bold text-indigo-700 dark:text-indigo-300">
                            Sem. {item.semester}
                          </span>
                        </td>

                        {/* Mata Kuliah & Dosen */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-body-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                              {item.kodeMK}
                            </span>
                            <span className="font-bold text-body-md text-on-surface">
                              {course?.namaMK || item.kodeMK}
                            </span>
                          </div>
                          <p className="text-body-xs font-medium text-on-surface-variant mt-0.5 truncate max-w-xs">
                            {course?.dosen || 'Dosen belum ditentukan'}
                          </p>
                        </td>

                        {/* Ruang & Tipe */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="font-bold text-body-sm text-on-surface">{item.ruang || '-'}</p>
                          <span className="rounded-md bg-surface-container px-2 py-0.5 text-body-xs font-bold text-on-surface-variant">
                            Kelas {item.tipeKelas || 'K1'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-body-xs font-bold ${
                              (item.status || 'published') === 'published'
                                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                                : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {item.status || 'published'}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicate(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-secondary/15 hover:text-secondary transition-colors cursor-pointer"
                              title="Duplikat Sesi"
                            >
                              <Icon name="content_copy" size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer"
                              title="Edit Jadwal"
                            >
                              <Icon name="edit" size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer"
                              title="Hapus Jadwal"
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

            {/* Mobile Cards */}
            <div className="space-y-3 tablet:hidden">
              {filteredSchedule.map((item) => {
                const course = courseMap.get(item.kodeMK)
                const isSelected = selectedIds.has(item.id)
                const clashMsg = conflictMap.get(item.id)

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 space-y-2.5 dark:bg-surface-container-low ${
                      isSelected ? 'border-primary' : ''
                    } ${clashMsg ? 'border-red-500/40 bg-red-500/5' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(item.id)}
                          className="rounded"
                        />
                        <div>
                          <span className="font-mono text-body-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md mr-1.5">
                            {item.kodeMK}
                          </span>
                          <span className="font-bold text-body-md text-on-surface">
                            {course?.namaMK || item.kodeMK}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicate(item)}
                          className="p-1 text-on-surface-variant hover:text-secondary"
                          title="Duplikat"
                        >
                          <Icon name="content_copy" size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1 text-on-surface-variant hover:text-primary"
                          title="Edit"
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="p-1 text-on-surface-variant hover:text-error"
                          title="Hapus"
                        >
                          <Icon name="delete" size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-body-xs text-on-surface-variant">
                      <span className="font-bold text-on-surface">{item.hari}, {item.jamMulai} - {item.jamSelesai}</span>
                      <span>•</span>
                      <span>{item.prodi} (Sem. {item.semester})</span>
                      <span>•</span>
                      <span>Ruang: {item.ruang || '-'}</span>
                    </div>

                    {clashMsg && (
                      <p className="text-body-xs font-bold text-error">
                        ⚠️ {clashMsg}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── 3. Modal Dialog Tambah Sesi Jadwal Manual ── */}
      {addModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={() => setAddModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="relative w-full max-w-lg rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 shadow-2xl dark:bg-surface-container-low animate-fade-up">
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
                  <select
                    value={manualForm.hari}
                    onChange={(e) => setManualForm((f) => ({ ...f, hari: e.target.value }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
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
                  <select
                    value={manualForm.tipeKelas}
                    onChange={(e) => setManualForm((f) => ({ ...f, tipeKelas: e.target.value }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                  >
                    {CLASS_TYPE_CODES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Program Studi</label>
                  <select
                    value={manualForm.prodi}
                    onChange={(e) => setManualForm((f) => ({ ...f, prodi: e.target.value }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                  >
                    <option value="">- Pilih Prodi -</option>
                    {prodiOptions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
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
                <select
                  value={manualForm.kodeMK}
                  onChange={(e) => setManualForm((f) => ({ ...f, kodeMK: e.target.value }))}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="">- Pilih Mata Kuliah Terdaftar -</option>
                  {courses.map((c) => (
                    <option key={c.kodeMK} value={c.kodeMK}>
                      {c.kodeMK} — {c.namaMK} ({c.dosen || 'Dosen -'})
                    </option>
                  ))}
                </select>
              </div>

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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={() => setEditingItem(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="relative w-full max-w-lg rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 shadow-2xl dark:bg-surface-container-low animate-fade-up">
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
                  <select
                    value={editForm.hari}
                    onChange={(e) => setEditForm((f) => ({ ...f, hari: e.target.value }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
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
                  <select
                    value={editForm.tipeKelas}
                    onChange={(e) => setEditForm((f) => ({ ...f, tipeKelas: e.target.value }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  >
                    {CLASS_TYPE_CODES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Prodi</label>
                  <select
                    value={editForm.prodi}
                    onChange={(e) => setEditForm((f) => ({ ...f, prodi: e.target.value }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  >
                    {prodiOptions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
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
                  <select
                    value={editForm.kodeMK}
                    onChange={(e) => setEditForm((f) => ({ ...f, kodeMK: e.target.value }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  >
                    {courses.map((c) => (
                      <option key={c.kodeMK} value={c.kodeMK}>
                        {c.kodeMK} — {c.namaMK}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Status Publikasi</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={() => setNewCourseOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="relative w-full max-w-md rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 shadow-2xl dark:bg-surface-container-low animate-fade-up">
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
    </div>
  )
}
