import { useEffect, useMemo, useRef, useState } from 'react'
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
import { appendHistory } from '../../lib/publishHelpers'
import { validateCourseEntry } from '../../lib/uploadValidator'

const EMPTY_FORM = {
  kodeMK: '',
  namaMK: '',
  dosen: '',
  kontakDosen: '',
  sks: 2,
  durasi: 100,
  semester: 1,
}

const PRODIS = [
  { label: 'Semua Prodi', value: '', prefix: '' },
  { label: 'Arsitektur (ARS)', value: 'Arsitektur', prefix: 'ARS' },
  { label: 'Bisnis Digital (BD)', value: 'Bisnis Digital', prefix: 'BD' },
  { label: 'Informatika (IF)', value: 'Informatika', prefix: 'IF' },
  { label: 'Kewirausahaan (KW)', value: 'Kewirausahaan', prefix: 'KW' },
  { label: 'Teknik Sipil (TS)', value: 'Teknik Sipil', prefix: 'TS' },
]

const SKS_OPTIONS = [
  { label: 'Semua SKS', value: '' },
  { label: '1 – 2 SKS', value: '1-2' },
  { label: '3 SKS', value: '3' },
  { label: '4+ SKS', value: '4+' },
]

const SEMESTER_OPTIONS = [
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

/** Custom Modern Popover Dropdown for Dosen with built-in search */
function DosenFilterDropdown({ lecturers, selected, onSelect }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
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

  const filteredLecturers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return lecturers
    return lecturers.filter((name) => name.toLowerCase().includes(q))
  }, [lecturers, search])

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-body-sm font-semibold transition-all cursor-pointer ${
          selected
            ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'
        }`}
      >
        <Icon name="person" size={18} className={selected ? 'text-primary' : 'text-on-surface-variant'} />
        <span className="max-w-[130px] truncate sm:max-w-[160px]">
          {selected || `Dosen (${lecturers.length})`}
        </span>
        <Icon
          name="expand_more"
          size={18}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 sm:w-80 rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-3 shadow-2xl dark:bg-surface-container-high animate-fade-up">
          {/* Search inside lecturer dropdown */}
          <div className="relative mb-2">
            <Icon
              name="search"
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari dosen..."
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/60 py-1.5 pl-9 pr-3 text-body-sm font-medium text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            <button
              type="button"
              onClick={() => {
                onSelect('')
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-body-sm font-semibold transition-colors cursor-pointer ${
                !selected
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span>Semua Dosen</span>
              {!selected && <Icon name="check" size={18} className="text-primary" />}
            </button>

            {filteredLecturers.map((name) => {
              const isSelected = selected === name
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onSelect(name)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-body-sm font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary-container text-[10px] font-bold text-on-secondary-container">
                      {name.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="truncate">{name}</span>
                  </div>
                  {isSelected && <Icon name="check" size={18} className="text-primary shrink-0" />}
                </button>
              )
            })}

            {filteredLecturers.length === 0 && (
              <p className="py-4 text-center text-body-xs text-on-surface-variant font-medium">
                Dosen tidak ditemukan
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Custom Modern Popover Dropdown for Prodi */
function ProdiFilterDropdown({ selected, onSelect }) {
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

  const selectedLabel = PRODIS.find((p) => p.value === selected)?.label || 'Semua Prodi'

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-body-sm font-semibold transition-all cursor-pointer ${
          selected
            ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'
        }`}
      >
        <Icon name="school" size={18} className={selected ? 'text-primary' : 'text-on-surface-variant'} />
        <span className="max-w-[120px] truncate sm:max-w-[150px]">{selectedLabel}</span>
        <Icon
          name="expand_more"
          size={18}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-2 shadow-2xl dark:bg-surface-container-high animate-fade-up space-y-1">
          {PRODIS.map((p) => {
            const isSelected = selected === p.value
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  onSelect(p.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-body-sm font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span>{p.label}</span>
                {isSelected && <Icon name="check" size={18} className="text-primary" />}
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

  const selectedLabel = SEMESTER_OPTIONS.find((s) => s.value === selected)?.label || 'Semua Semester'

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-body-sm font-semibold transition-all cursor-pointer ${
          selected
            ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'
        }`}
      >
        <Icon name="calendar_view_month" size={18} className={selected ? 'text-primary' : 'text-on-surface-variant'} />
        <span className="max-w-[120px] truncate sm:max-w-[150px]">{selectedLabel}</span>
        <Icon
          name="expand_more"
          size={18}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-64 max-h-72 overflow-y-auto rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-2 shadow-2xl dark:bg-surface-container-high animate-fade-up space-y-1 custom-scrollbar">
          {SEMESTER_OPTIONS.map((s) => {
            const isSelected = selected === s.value
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  onSelect(s.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-body-sm font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span>{s.label}</span>
                {isSelected && <Icon name="check" size={18} className="text-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Custom Modern Popover Dropdown for SKS */
function SksFilterDropdown({ selected, onSelect }) {
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

  const selectedLabel = SKS_OPTIONS.find((s) => s.value === selected)?.label || 'Semua SKS'

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-body-sm font-semibold transition-all cursor-pointer ${
          selected
            ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'
        }`}
      >
        <Icon name="workspace_premium" size={18} className={selected ? 'text-primary' : 'text-on-surface-variant'} />
        <span>{selectedLabel}</span>
        <Icon
          name="expand_more"
          size={18}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-2 shadow-2xl dark:bg-surface-container-high animate-fade-up space-y-1">
          {SKS_OPTIONS.map((s) => {
            const isSelected = selected === s.value
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  onSelect(s.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-body-sm font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span>{s.label}</span>
                {isSelected && <Icon name="check" size={18} className="text-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
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

  const hasActiveFilters = Boolean(search || dosenFilter || prodiFilter || semesterFilter || sksFilter)

  function resetAllFilters() {
    setSearch('')
    setDosenFilter('')
    setProdiFilter('')
    setSemesterFilter('')
    setSksFilter('')
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
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header & Quick Stats */}
      <header className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-container/60 text-secondary shadow-sm dark:bg-secondary-container/30">
            <Icon name="menu_book" size={26} />
          </span>
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Kelola MK & Dosen</h1>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Daftar master mata kuliah, bobot SKS, tingkat semester, dan dosen pengampu universitas
            </p>
          </div>
        </div>

        {/* Live Quick Stat Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-3.5 py-2 shadow-xs dark:bg-surface-container-low">
            <Icon name="library_books" size={18} className="text-primary" />
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Total MK</p>
              <p className="text-title-sm font-bold text-on-surface">{stats.totalCourses}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-3.5 py-2 shadow-xs dark:bg-surface-container-low">
            <Icon name="person" size={18} className="text-secondary" />
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Dosen</p>
              <p className="text-title-sm font-bold text-on-surface">{stats.totalLecturers}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-3.5 py-2 shadow-xs dark:bg-surface-container-low">
            <Icon name="workspace_premium" size={18} className="text-tertiary" />
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Total SKS</p>
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

      {/* Modern Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-xs dark:bg-surface-container-low dark:border-outline-variant/15">
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center">
          {/* Main Search Input */}
          <div className="relative flex-1 min-w-0">
            <Icon
              name="search"
              size={20}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode MK, nama mata kuliah, atau dosen…"
              aria-label="Cari mata kuliah"
              className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 py-2.5 pl-11 pr-9 text-body-md font-medium text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:bg-surface focus:outline-none dark:bg-surface-container-high/30 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-on-surface-variant hover:bg-surface-container cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & Add Button */}
          <div className="flex flex-wrap items-center gap-2">
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

            <Button
              onClick={openAddModal}
              className="rounded-2xl px-4 py-2.5 font-bold shadow-sm whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <Icon name="add" size={20} className="mr-1" />
              Tambah MK
            </Button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/15 text-body-xs font-semibold text-on-surface-variant">
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
              className="text-[11px] font-bold text-error hover:underline cursor-pointer ml-auto"
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
          {/* Table — Desktop & Tablet */}
          <div className="hidden overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm tablet:block dark:bg-surface-container-low dark:border-outline-variant/15">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/15 bg-surface-container-low/50 dark:bg-surface-container-high/20">
                  <th className="px-5 py-3.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold text-[11px]">
                    Kode MK
                  </th>
                  <th className="px-5 py-3.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold text-[11px]">
                    Nama Mata Kuliah
                  </th>
                  <th className="px-5 py-3.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold text-[11px]">
                    Semester
                  </th>
                  <th className="px-5 py-3.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold text-[11px]">
                    Dosen Pengampu
                  </th>
                  <th className="px-5 py-3.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold text-[11px]">
                    Kontak
                  </th>
                  <th className="px-5 py-3.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold text-[11px] text-center">
                    Bobot / Durasi
                  </th>
                  <th className="px-5 py-3.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold text-[11px] text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((course) => {
                  const rawPhone = String(course.kontakDosen || '').replace(/[^0-9]/g, '')
                  const waUrl = rawPhone ? `https://wa.me/${rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone}` : null
                  const semester = getCourseSemester(course)
                  return (
                    <tr
                      key={course.id}
                      className="group transition-colors hover:bg-surface-container-low/50 dark:hover:bg-surface-container-high/20"
                    >
                      {/* Kode MK */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-xl bg-primary/10 px-3 py-1 font-mono text-[12px] font-bold text-primary border border-primary/20 dark:bg-primary/20">
                          {course.kodeMK}
                        </span>
                      </td>

                      {/* Nama MK */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-body-md text-on-surface leading-snug">
                          {course.namaMK}
                        </p>
                      </td>

                      {/* Semester */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {semester ? (
                          <span className="inline-flex items-center rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                            Sem. {semester}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant/40 text-body-sm">-</span>
                        )}
                      </td>

                      {/* Dosen */}
                      <td className="px-5 py-4">
                        {course.dosen ? (
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container font-bold text-[11px]">
                              {course.dosen.slice(0, 1).toUpperCase()}
                            </div>
                            <span className="text-body-sm font-semibold text-on-surface-variant">
                              {course.dosen}
                            </span>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant/50 text-body-sm">-</span>
                        )}
                      </td>

                      {/* Kontak */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {course.kontakDosen ? (
                          <a
                            href={waUrl || `tel:${course.kontakDosen}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                            title="Buka Chat WhatsApp"
                          >
                            <Icon name="chat" size={13} className="shrink-0" />
                            <span>{course.kontakDosen}</span>
                          </a>
                        ) : (
                          <span className="text-on-surface-variant/40 text-body-sm">-</span>
                        )}
                      </td>

                      {/* Bobot & Durasi */}
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="rounded-lg bg-surface-container px-2.5 py-1 text-[11px] font-bold text-on-surface">
                            {course.sks} SKS
                          </span>
                          <span className="rounded-lg bg-surface-container-high/60 px-2.5 py-1 text-[11px] font-medium text-on-surface-variant">
                            {course.durasi} mnt
                          </span>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(course)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer"
                            title={`Edit ${course.kodeMK}`}
                          >
                            <Icon name="edit" size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(course)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer"
                            title={`Hapus ${course.kodeMK}`}
                          >
                            <Icon name="delete" size={18} />
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
            {filtered.map((course) => {
              const rawPhone = String(course.kontakDosen || '').replace(/[^0-9]/g, '')
              const waUrl = rawPhone ? `https://wa.me/${rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone}` : null
              const semester = getCourseSemester(course)
              return (
                <div
                  key={course.id}
                  className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-xs dark:bg-surface-container-low space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded-xl bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-primary border border-primary/20">
                          {course.kodeMK}
                        </span>
                        {semester && (
                          <span className="inline-flex items-center rounded-lg bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
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

                  <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                    <Icon name="person" size={16} className="text-secondary shrink-0" />
                    <span className="font-semibold truncate">{course.dosen || 'Dosen belum diisi'}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-outline-variant/10">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-surface-container px-2 py-0.5 text-[11px] font-bold text-on-surface">
                        {course.sks} SKS
                      </span>
                      <span className="rounded-md bg-surface-container-high px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">
                        {course.durasi} mnt
                      </span>
                    </div>

                    {course.kontakDosen && (
                      <a
                        href={waUrl || `tel:${course.kontakDosen}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300"
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
