import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useTasks } from '../../hooks/useTasks'
import { useApp } from '../../hooks/useApp'

const PRIORITY_STRIPE = {
  tinggi: 'bg-error',
  sedang: 'bg-amber-500',
  rendah: 'bg-blue-500',
}

const PRIORITY_LABEL = {
  tinggi: 'Mendesak',
  sedang: 'Segera',
  rendah: 'Masih lama',
}

export default function Tasks() {
  const { program, semester } = useApp()
  const { tasks, addTask, toggleDone, removeTask } = useTasks()
  const location = useLocation()

  const [showForm, setShowForm] = useState(false)
  const [initialKodeMK, setInitialKodeMK] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Filter State
  const [scopeFilter, setScopeFilter] = useState('all') // 'all' | 'prodi' | 'pribadi'
  const [statusFilter, setStatusFilter] = useState('active') // 'all' | 'active' | 'done'
  const [courseFilter, setCourseFilter] = useState('all') // 'all' | kodeMK

  // Check deep link from schedule drawer
  useEffect(() => {
    if (location.state?.createKodeMK) {
      // oxlint-disable-next-line react/set-state-in-effect
      setInitialKodeMK(location.state.createKodeMK)
      setShowForm(true)
    }
  }, [location.state])

  // Unique course codes present in tasks
  const availableCourseCodes = useMemo(() => {
    const set = new Set()
    tasks.forEach((t) => {
      if (t.kodeMK) set.add(t.kodeMK)
    })
    return Array.from(set).sort()
  }, [tasks])

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Scope filter
      if (scopeFilter === 'prodi' && !t.isProdi) return false
      if (scopeFilter === 'pribadi' && t.isProdi) return false

      // Status filter
      if (statusFilter === 'active' && t.selesai) return false
      if (statusFilter === 'done' && !t.selesai) return false

      // Course filter
      if (courseFilter !== 'all' && t.kodeMK !== courseFilter) return false

      return true
    })
  }, [tasks, scopeFilter, statusFilter, courseFilter])

  const { thisWeek, nextWeek, done } = useMemo(() => groupTasks(filteredTasks), [filteredTasks])

  const allActiveCount = useMemo(() => tasks.filter((t) => !t.selesai).length, [tasks])
  const allDoneCount = useMemo(() => tasks.filter((t) => t.selesai).length, [tasks])
  const prodiCount = useMemo(() => tasks.filter((t) => t.isProdi).length, [tasks])
  const personalCount = useMemo(() => tasks.filter((t) => !t.isProdi).length, [tasks])

  const progress = tasks.length > 0 ? Math.round((allDoneCount / tasks.length) * 100) : 0
  const highPriority = useMemo(
    () =>
      tasks
        .filter((t) => !t.selesai && t.prioritas === 'tinggi')
        .sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline))
        .slice(0, 3),
    [tasks],
  )

  return (
    <div className="flex flex-col gap-4 w-full max-w-full overflow-x-hidden animate-fade-in">
      {/* 1. Header Halaman — Structured like WeeklySchedule */}
      <header className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-3 tablet:px-4 tablet:py-3 shadow-level-1 flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between w-full">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-level-1">
            <Icon name="assignment" size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl tablet:text-2xl font-bold tracking-tight text-on-surface">
                Tugas Kuliah
              </h2>
              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-label-caps font-bold border border-primary/20">
                {allActiveCount > 0 ? `${allActiveCount} Aktif` : 'Tuntas'}
              </span>
            </div>
            <p className="mt-0.5 text-body-xs text-on-surface-variant font-medium truncate">
              {program || 'Informatika'} · Semester {semester || '1'} · Manajemen tenggat waktu & tugas
            </p>
          </div>
        </div>

        {/* Controls Desktop & Tablet */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap tablet:flex-nowrap">
          {/* Scope Filter Switcher */}
          <div className="inline-flex items-center rounded-full border border-outline-variant/30 bg-surface-container-high/50 p-0.5 shadow-level-1 shrink-0">
            <button
              type="button"
              onClick={() => setScopeFilter('all')}
              className={`rounded-full px-3 py-1 text-label-caps font-bold transition-all cursor-pointer ${
                scopeFilter === 'all'
                  ? 'bg-surface shadow-level-1 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Semua ({tasks.length})
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('prodi')}
              className={`rounded-full px-3 py-1 text-label-caps font-bold transition-all cursor-pointer ${
                scopeFilter === 'prodi'
                  ? 'bg-surface shadow-level-1 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Prodi ({prodiCount})
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('pribadi')}
              className={`rounded-full px-3 py-1 text-label-caps font-bold transition-all cursor-pointer ${
                scopeFilter === 'pribadi'
                  ? 'bg-surface shadow-level-1 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Pribadi ({personalCount})
            </button>
          </div>

          {/* Primary Add Task Action */}
          <button
            type="button"
            onClick={() => {
              setInitialKodeMK('')
              setShowForm(true)
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl bg-primary text-on-primary text-body-xs tablet:text-body-sm font-bold shadow-level-1 hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
          >
            <Icon name="add" size={16} />
            <span>Tambah Tugas</span>
          </button>
        </div>
      </header>

      {/* 2. Secondary Toolbar: Progress Bar, Status Toggle & Course Filters */}
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-3 tablet:px-4 tablet:py-2.5 shadow-level-1 flex flex-col tablet:flex-row tablet:items-center tablet:justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-xl text-body-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-primary/10 text-primary border border-primary/25 shadow-level-1'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Belum Selesai ({allActiveCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('done')}
            className={`px-3 py-1 rounded-xl text-body-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'done'
                ? 'bg-primary/10 text-primary border border-primary/25 shadow-level-1'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Selesai ({allDoneCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-xl text-body-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-primary/10 text-primary border border-primary/25 shadow-level-1'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Semua Status ({tasks.length})
          </button>
        </div>

        {/* Progress Metric & Course Filter */}
        <div className="flex items-center gap-3 shrink-0 justify-between tablet:justify-end">
          {availableCourseCodes.length > 0 && (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-outline-variant/30 bg-surface-container-low/60 text-body-xs text-on-surface font-semibold focus:outline-none focus:border-primary dark:bg-surface-container-high cursor-pointer"
            >
              <option value="all">Semua Mata Kuliah</option>
              {availableCourseCodes.map((kode) => (
                <option key={kode} value={kode}>
                  {kode}
                </option>
              ))}
            </select>
          )}

          {tasks.length > 0 && (
            <div className="flex items-center gap-2 text-body-xs font-semibold text-on-surface-variant">
              <span>Progres: <strong className="text-on-surface">{progress}%</strong></span>
              <div className="w-16 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Urgent High Priority Banner (If any) */}
      {highPriority.length > 0 && statusFilter !== 'done' && (
        <div className="rounded-2xl border border-error/30 bg-error/10 dark:bg-error/15 p-4 space-y-2 shadow-level-1">
          <div className="flex items-center gap-2 text-error font-extrabold text-body-xs">
            <Icon name="priority_high" size={17} className="shrink-0 animate-bounce" />
            <span>Tugas Mendesak Mendekati Tenggat Waktu</span>
          </div>
          <div className="grid grid-cols-1 tablet:grid-cols-3 gap-2">
            {highPriority.map((t) => (
              <div
                key={t.id}
                onClick={() => toggleDone(t.id)}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container-low border border-error/25 shadow-level-1 cursor-pointer hover:border-error transition-all"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-body-xs font-bold text-on-surface truncate">{t.judul}</p>
                  <p className="text-body-xs text-error font-semibold mt-0.5">{formatDeadline(t.deadline)}</p>
                </div>
                <Icon name="check_circle_outline" size={16} className="text-error shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Task List & Empty State Container */}
      {tasks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container-low p-8 tablet:p-12 text-center shadow-level-1 flex flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary border border-primary/20 shadow-level-1 mb-3">
            <Icon name="assignment" size={36} />
          </div>
          <h3 className="text-title-md font-bold text-on-surface">Belum ada tugas kuliah</h3>
          <p className="mt-1.5 text-body-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Catat tugas individu, PR mingguan, laporan praktikum, atau tugas kelompok bersama prodi agar tidak terlewat tenggat waktu.
          </p>
          <button
            type="button"
            onClick={() => {
              setInitialKodeMK('')
              setShowForm(true)
            }}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-on-primary text-body-sm font-bold shadow-level-1 hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
          >
            <Icon name="add" size={18} />
            <span>Tambah Tugas Baru</span>
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container-low p-8 text-center shadow-level-1">
          <Icon name="filter_list_off" size={36} className="mx-auto text-outline-variant mb-2" />
          <h4 className="text-body-sm font-bold text-on-surface">Tidak ada tugas yang sesuai filter</h4>
          <p className="text-body-xs text-on-surface-variant mt-1">Coba ubah status atau kategori tugas di atas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Minggu Ini */}
          {thisWeek.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-label-caps font-extrabold uppercase tracking-wider text-on-surface-variant">
                  Tenggat Minggu Ini ({thisWeek.length})
                </span>
              </div>
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
                {thisWeek.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleDone}
                    onDelete={(t) => setDeleteTarget(t)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Mendatang */}
          {nextWeek.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-label-caps font-extrabold uppercase tracking-wider text-on-surface-variant">
                  Tenggat Mendatang ({nextWeek.length})
                </span>
              </div>
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
                {nextWeek.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleDone}
                    onDelete={(t) => setDeleteTarget(t)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Selesai */}
          {done.length > 0 && statusFilter !== 'active' && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-label-caps font-extrabold uppercase tracking-wider text-on-surface-variant">
                  Tugas Selesai ({done.length})
                </span>
              </div>
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
                {done.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleDone}
                    onDelete={(t) => setDeleteTarget(t)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Modal Dialog */}
      {showForm && (
        <AddTaskForm
          initialKodeMK={initialKodeMK}
          onSubmit={(data, isProdi) => {
            addTask(data, isProdi)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus Tugas"
        message={`Apakah Anda yakin ingin menghapus tugas "${deleteTarget?.judul}"?`}
        confirmLabel="Hapus"
        danger
        onConfirm={() => {
          if (deleteTarget) {
            removeTask(deleteTarget.id, deleteTarget.isProdi)
            setDeleteTarget(null)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function TaskCard({ task, onToggle, onDelete }) {
  const isPast = daysUntil(task.deadline) < 0 && !task.selesai
  const deadlineLabel = formatDeadline(task.deadline)

  return (
    <div
      className={`relative flex items-start gap-3 rounded-2xl border p-4 shadow-level-1 transition-all ${
        task.selesai
          ? 'border-outline-variant/20 bg-surface-container-low/40 opacity-75 dark:bg-surface-container-high/20'
          : isPast
          ? 'border-error/40 bg-error/5 dark:bg-error/10'
          : 'border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low hover:border-outline-variant/40'
      }`}
    >
      {/* Priority Stripe on Left */}
      <div
        className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${
          PRIORITY_STRIPE[task.prioritas] ?? 'bg-secondary'
        }`}
      />

      {/* Checkbox Button */}
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-all cursor-pointer ${
          task.selesai
            ? 'border-primary bg-primary text-on-primary shadow-level-1'
            : 'border-outline-variant bg-surface-container'
        }`}
      >
        {task.selesai && <Icon name="check" size={14} />}
      </button>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              {task.kodeMK && (
                <span className="font-mono text-label-caps font-extrabold text-primary bg-primary/10 border border-primary/20 px-2 py-0.2 rounded-md">
                  {task.kodeMK}
                </span>
              )}
              <span
                className={`rounded-md px-1.5 py-0.2 text-label-caps font-bold ${
                  task.isProdi
                    ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/25'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {task.isProdi ? 'Tugas Prodi' : 'Pribadi'}
              </span>
            </div>

            <h4
              className={`text-body-sm font-extrabold leading-snug truncate ${
                task.selesai ? 'line-through text-on-surface-variant' : 'text-on-surface'
              }`}
            >
              {task.judul}
            </h4>
          </div>

          {/* Deadline Badge */}
          <span
            className={`shrink-0 rounded-xl px-2.5 py-1 text-label-caps font-extrabold ${
              task.selesai
                ? 'bg-surface-container text-on-surface-variant'
                : isPast
                ? 'bg-error text-white'
                : task.prioritas === 'tinggi'
                ? 'bg-error/15 text-error border border-error/25'
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}
          >
            {deadlineLabel}
          </span>
        </div>

        {task.catatan && (
          <p className="text-label-caps text-on-surface-variant/90 leading-relaxed line-clamp-2 bg-surface-container-low/50 dark:bg-surface-container-high/40 p-2 rounded-xl border border-outline-variant/15 mt-1">
            {task.catatan}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between border-t border-outline-variant/15 pt-1.5">
          <span className="text-body-xs text-on-surface-variant font-medium">
            Prioritas: <strong className="text-on-surface">{PRIORITY_LABEL[task.prioritas] ?? task.prioritas}</strong>
            {task.dibuatOleh && <span className="opacity-70"> · {task.dibuatOleh}</span>}
          </span>
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
            aria-label="Hapus tugas"
          >
            <Icon name="delete" size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

function AddTaskForm({ initialKodeMK = '', onSubmit, onCancel }) {
  const [judul, setJudul] = useState('')
  const [kodeMK, setKodeMK] = useState(initialKodeMK)
  const [deadline, setDeadline] = useState('')
  const [prioritas, setPrioritas] = useState('sedang')
  const [catatan, setCatatan] = useState('')
  const [isProdi, setIsProdi] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Support ESC key to close modal (and close picker first)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (pickerOpen) { setPickerOpen(false); return }
        onCancel?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel, pickerOpen])

  // Helpers for quick deadline presets
  function setOffsetDays(days) {
    const d = new Date()
    d.setDate(d.getDate() + days)
    const iso = d.toISOString().split('T')[0]
    setDeadline(iso)
  }

  const formattedDeadlineInfo = useMemo(() => {
    if (!deadline) return null
    const days = daysUntil(deadline)
    const dateObj = parseLocalDate(deadline)
    const formatted = dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const relative =
      days === 0
        ? 'Hari ini'
        : days === 1
        ? 'Besok'
        : days > 1
        ? `${days} hari lagi`
        : `${Math.abs(days)} hari lewat`
    return { formatted, relative, days }
  }, [deadline])

  function handleSubmit(e) {
    e.preventDefault()
    if (!judul.trim() || !deadline) return
    onSubmit(
      {
        judul: judul.trim(),
        kodeMK: kodeMK.trim(),
        deadline,
        prioritas,
        catatan: catatan.trim(),
        dibuatOleh: isProdi ? 'Komti / Mahasiswa' : 'Pribadi',
      },
      isProdi,
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-6 bg-black/65 backdrop-blur-xs animate-fade-in"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[92vh] tablet:max-h-[88vh] overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-level-3 animate-fade-up flex flex-col"
      >
        {/* Header Modal - Gradient Teal/Indigo Theme */}
        <header className="sticky top-0 z-20 bg-gradient-to-r from-teal-950 via-teal-800 to-indigo-950 p-4 tablet:p-5 text-white shadow-level-1 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-level-1">
                <Icon name="add_task" size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 className="text-xl tablet:text-2xl font-bold tracking-tight text-white truncate">
                    Tambah Tugas Baru
                  </h3>
                  <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-label-caps font-extrabold uppercase tracking-wider border border-white/25 shadow-level-1">
                    Deadline Tracker
                  </span>
                </div>
                <p className="text-body-xs text-white/80 font-medium truncate">
                  Catat tugas kuliah, format pengumpulan, & pantau tenggat waktu
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onCancel}
              aria-label="Tutup modal"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </header>

        {/* Body Content */}
        <div className="p-4 tablet:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* 1. Tipe Tugas: Pribadi vs Bersama Prodi */}
          <div>
            <label className="mb-1.5 block text-label-caps uppercase tracking-wider font-extrabold text-on-surface-variant">
              Tipe Tugas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsProdi(false)}
                className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-3 text-body-xs font-bold transition-all cursor-pointer ${
                  !isProdi
                    ? 'border-primary bg-primary/10 text-primary shadow-level-1 ring-1 ring-primary/25'
                    : 'border-outline-variant/30 bg-surface-container-low/40 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <Icon name="person" size={18} />
                <span>Tugas Pribadi</span>
              </button>
              <button
                type="button"
                onClick={() => setIsProdi(true)}
                className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-3 text-body-xs font-bold transition-all cursor-pointer ${
                  isProdi
                    ? 'border-primary bg-primary/10 text-primary shadow-level-1 ring-1 ring-primary/25'
                    : 'border-outline-variant/30 bg-surface-container-low/40 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <Icon name="corporate_fare" size={18} />
                <span>Bersama Prodi</span>
              </button>
            </div>
            <p className="mt-1.5 text-body-xs text-on-surface-variant font-medium">
              {isProdi
                ? 'Tugas ini akan tersinkronisasi ke seluruh mahasiswa di prodi & semester yang sama.'
                : 'Tugas ini hanya tersimpan di perangkat lokal Anda.'}
            </p>
          </div>

          {/* 2. Judul Tugas */}
          <label className="block">
            <span className="mb-1 block text-label-caps uppercase tracking-wider font-extrabold text-on-surface-variant">
              Judul Tugas *
            </span>
            <input
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              required
              placeholder="Contoh: Makalah Etika Profesi Bab 1-3"
              className="w-full rounded-2xl border border-outline-variant/35 bg-surface-container-low/40 px-4 py-2.5 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none dark:bg-surface-container-high/40 shadow-level-1"
            />
          </label>

          {/* 3. Kode MK & Premium Deadline Selector */}
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-label-caps uppercase tracking-wider font-extrabold text-on-surface-variant">
                Kode Mata Kuliah (Opsional)
              </span>
              <input
                value={kodeMK}
                onChange={(e) => setKodeMK(e.target.value)}
                placeholder="Contoh: IF301"
                className="w-full rounded-2xl border border-outline-variant/35 bg-surface-container-low/40 px-4 py-2.5 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none dark:bg-surface-container-high/40 shadow-level-1"
              />
            </label>

            {/* Premium Tenggat Waktu — Dropdown Date Picker (Premium) */}
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-4 space-y-3 shadow-level-1">
              <div className="flex items-center justify-between">
                <span className="text-label-caps uppercase tracking-wider font-extrabold text-on-surface-variant flex items-center gap-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/15">
                    <Icon name="calendar_month" size={14} />
                  </span>
                  <span>Tenggat Waktu *</span>
                </span>
                {formattedDeadlineInfo && (
                  <span className={`text-body-xs font-extrabold px-2.5 py-1 rounded-full border shadow-level-1 ${
                    formattedDeadlineInfo.days < 0
                      ? 'bg-error/15 text-error border-error/25'
                      : formattedDeadlineInfo.days <= 1
                        ? 'bg-error/10 text-error border-error/20'
                        : formattedDeadlineInfo.days <= 3
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/25'
                          : 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                  }`}>
                    {formattedDeadlineInfo.relative}
                  </span>
                )}
              </div>

              {/* Pintasan — pill premium */}
              <div>
                <span className="mb-1.5 block text-label-caps font-extrabold uppercase tracking-widest text-on-surface-variant/70">Pintasan:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: 'Hari Ini', days: 0 },
                    { label: 'Besok', days: 1 },
                    { label: '+3 Hari', days: 3 },
                    { label: '+1 Minggu', days: 7 },
                    { label: '+2 Minggu', days: 14 },
                  ].map((chip) => {
                    const isActive = (() => {
                      if (!deadline) return false
                      const target = new Date(); target.setDate(target.getDate() + chip.days)
                      const iso = target.toISOString().split('T')[0]
                      return deadline === iso
                    })()
                    return (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => { setOffsetDays(chip.days); setPickerOpen(false) }}
                        className={`px-3 py-1 rounded-full text-label-caps font-bold border transition-all cursor-pointer active:scale-95 ${
                          isActive
                            ? 'bg-primary text-on-primary border-primary shadow-level-1'
                            : 'bg-surface-container-high/70 hover:bg-surface-container-high text-on-surface border-outline-variant/25 hover:border-outline-variant/40'
                        }`}
                      >
                        {chip.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Premium Dropdown Field */}
              <PremiumDeadlineField
                deadline={deadline}
                setDeadline={setDeadline}
                pickerOpen={pickerOpen}
                setPickerOpen={setPickerOpen}
                formattedDeadlineInfo={formattedDeadlineInfo}
              />

              {formattedDeadlineInfo && (
                <p className="text-label-caps text-on-surface-variant font-medium flex items-center gap-1.5">
                  <Icon name="event_available" size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Jatuh tempo: <strong className="text-on-surface">{formattedDeadlineInfo.formatted}</strong> · {formattedDeadlineInfo.relative}</span>
                </p>
              )}
            </div>
          </div>

          {/* 4. Tingkat Prioritas */}
          <fieldset>
            <legend className="mb-1.5 text-label-caps uppercase tracking-wider font-extrabold text-on-surface-variant">
              Tingkat Prioritas
            </legend>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPrioritas('tinggi')}
                className={`rounded-2xl border-2 py-2.5 px-2 text-body-xs font-extrabold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  prioritas === 'tinggi'
                    ? 'border-error bg-error/15 text-error ring-1 ring-error/25 shadow-level-1'
                    : 'border-outline-variant/30 bg-surface-container-low/40 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span>Mendesak</span>
                <span className="text-label-caps opacity-75 font-medium">Prioritas Tinggi</span>
              </button>

              <button
                type="button"
                onClick={() => setPrioritas('sedang')}
                className={`rounded-2xl border-2 py-2.5 px-2 text-body-xs font-extrabold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  prioritas === 'sedang'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500/25 shadow-level-1'
                    : 'border-outline-variant/30 bg-surface-container-low/40 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span>Segera</span>
                <span className="text-label-caps opacity-75 font-medium">Prioritas Sedang</span>
              </button>

              <button
                type="button"
                onClick={() => setPrioritas('rendah')}
                className={`rounded-2xl border-2 py-2.5 px-2 text-body-xs font-extrabold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  prioritas === 'rendah'
                    ? 'border-blue-500 bg-blue-500/15 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500/25 shadow-level-1'
                    : 'border-outline-variant/30 bg-surface-container-low/40 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span>Masih Lama</span>
                <span className="text-label-caps opacity-75 font-medium">Prioritas Rendah</span>
              </button>
            </div>
          </fieldset>

          {/* 5. Catatan / Instruksi Tugas */}
          <label className="block">
            <span className="mb-1 block text-label-caps uppercase tracking-wider font-extrabold text-on-surface-variant">
              Catatan / Instruksi Tugas
            </span>
            <textarea
              id="task-catatan"
              name="task-catatan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder="Tuliskan format pengumpulan, link materi/drive, nomor bab, atau catatan penting..."
              className="w-full resize-none rounded-2xl border border-outline-variant/35 bg-surface-container-low/40 p-3 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none dark:bg-surface-container-high/40 shadow-level-1"
            />
          </label>
        </div>

        {/* Footer Actions */}
        <footer className="flex items-center justify-end gap-2.5 p-4 border-t border-outline-variant/15 bg-surface-container-low/40 shrink-0">
          <Button type="button" variant="secondary" onClick={onCancel} className="px-5 py-2 font-semibold">
            Batal
          </Button>
          <Button type="submit" className="px-6 py-2 font-bold shadow-level-1">
            Simpan Tugas
          </Button>
        </footer>
      </form>
    </div>
  )
}

function groupTasks(tasks) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekMs = 7 * 24 * 60 * 60 * 1000

  const groups = { thisWeek: [], nextWeek: [], done: [] }
  for (const task of tasks) {
    if (task.selesai) {
      groups.done.push(task)
      continue
    }
    const dl = parseLocalDate(task.deadline)
    const diff = dl.getTime() - startOfToday.getTime()
    if (diff <= weekMs) groups.thisWeek.push(task)
    else groups.nextWeek.push(task)
  }
  return groups
}

function daysUntil(isoDate) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((parseLocalDate(isoDate).getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000))
}

function parseLocalDate(isoDate) {
  const m = String(isoDate ?? '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (!m) return new Date(isoDate)
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

function formatDeadline(isoDate) {
  const days = daysUntil(isoDate)
  if (days === 0) return 'Hari ini'
  if (days === 1) return 'Besok'
  if (days > 1) return `${days} hari lagi`
  return `${Math.abs(days)} hari lewat`
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function PremiumDeadlineField({ deadline, setDeadline, pickerOpen, setPickerOpen, formattedDeadlineInfo }) {
  const wrapRef = useRef(null)
  const [viewYear, setViewYear] = useState(() => {
    const base = deadline ? parseLocalDate(deadline) : new Date()
    return base.getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    const base = deadline ? parseLocalDate(deadline) : new Date()
    return base.getMonth()
  })

  useEffect(() => {
    if (deadline) {
      const d = parseLocalDate(deadline)
      if (!Number.isNaN(d.getTime())) {
        // oxlint-disable-next-line react/set-state-in-effect
        setViewYear(d.getFullYear())
        // oxlint-disable-next-line react/set-state-in-effect
        setViewMonth(d.getMonth())
      }
    }
  }, [deadline])

  useEffect(() => {
    if (!pickerOpen) return
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setPickerOpen(false)
    }
    function onEsc(e) {
      if (e.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    window.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('keydown', onEsc)
    }
  }, [pickerOpen, setPickerOpen])

  const displayText = deadline
    ? (() => {
        const d = parseLocalDate(deadline)
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const yyyy = d.getFullYear()
        return `${dd}/${mm}/${yyyy}`
      })()
    : ''

  const todayKey = (() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  })()

  const selectedKey = deadline || null

  const firstDayOffset = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDayOffset; i += 1) {
    const day = daysInPrevMonth - firstDayOffset + 1 + i
    const d = new Date(viewYear, viewMonth - 1, day)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({ day, key, muted: true })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({ day, key, muted: false })
  }
  while (cells.length < 42) {
    const idx = cells.length - (firstDayOffset + daysInMonth)
    const day = idx + 1
    const d = new Date(viewYear, viewMonth + 1, day)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({ day, key, muted: true })
  }
  const visibleCells = cells.slice(0, 35)
  if (visibleCells.filter((c) => !c.muted).length < daysInMonth) {
    // if month spills into 6th week, keep 6 rows
    visibleCells.push(...cells.slice(35, 42))
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const monthLabelEn = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function goPrev() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  function goNext() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }
  function selectDate(key) {
    setDeadline(key)
    setPickerOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      {/* Hidden native input keeps required + form submit handling */}
      <input type="hidden" value={deadline} required readOnly aria-hidden />
      <button
        type="button"
        onClick={() => setPickerOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={pickerOpen}
        className={`w-full flex items-center justify-between gap-3 rounded-xl border bg-white dark:bg-surface-container-high/50 px-4 py-2.5 text-left shadow-level-1 transition-all cursor-pointer ${
          pickerOpen
            ? 'border-primary ring-2 ring-primary/20'
            : deadline
              ? 'border-primary/30 hover:border-primary/40'
              : 'border-outline-variant/30 hover:border-outline-variant/45 hover:bg-surface-container-low/40'
        }`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-sm ${deadline ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20'}`}>
            <Icon name="calendar_today" size={16} />
          </span>
          <span className="min-w-0">
            {deadline ? (
              <>
                <span className="block text-body-sm font-extrabold text-on-surface tracking-tight">{displayText}</span>
                <span className="block text-label-caps font-semibold text-on-surface-variant -mt-0.5 truncate">
                  {formattedDeadlineInfo ? `${formattedDeadlineInfo.formatted} · ${formattedDeadlineInfo.relative}` : ''}
                </span>
              </>
            ) : (
              <>
                <span className="block text-body-sm font-semibold text-outline-variant">dd/mm/yyyy</span>
                <span className="block text-label-caps text-on-surface-variant/70 -mt-0.5">Pilih tanggal tenggat</span>
              </>
            )}
          </span>
        </span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors ${pickerOpen ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-high/60 text-on-surface-variant border-outline-variant/20'}`}>
          <Icon name={pickerOpen ? 'expand_less' : 'calendar_month'} size={18} />
        </span>
      </button>

      {pickerOpen && (
        <div
          role="dialog"
          aria-label="Pilih tanggal tenggat waktu"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-xl border border-outline-variant/20 bg-white dark:bg-surface-container-low shadow-level-3 overflow-hidden animate-fade-up"
        >
          {/* Month header — premium */}
          <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low/60 dark:bg-surface-container-high/30 border-b border-outline-variant/15">
            <div className="flex items-center gap-1">
              <span className="text-body-sm font-extrabold text-on-surface capitalize">{monthLabelEn}</span>
              <span className="text-body-xs text-on-surface-variant font-medium hidden tablet:inline capitalize">· {monthLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={goPrev} aria-label="Bulan sebelumnya" className="h-8 w-8 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                <Icon name="chevron_left" size={18} />
              </button>
              <button type="button" onClick={goNext} aria-label="Bulan berikutnya" className="h-8 w-8 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                <Icon name="chevron_right" size={18} />
              </button>
            </div>
          </div>

          {/* Weekday row */}
          <div className="grid grid-cols-7 gap-0 px-2 pt-2.5">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w} className="text-center text-label-caps font-extrabold tracking-wider text-on-surface-variant/70 py-1">{w}</span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 px-2 pb-2 pt-1">
            {visibleCells.map((cell) => {
              const isSelected = selectedKey === cell.key
              const isToday = todayKey === cell.key
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => selectDate(cell.key)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-body-sm font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0a58ca] text-white shadow-level-1 ring-2 ring-[#0a58ca]/20'
                      : isToday
                        ? 'bg-primary/12 text-primary border border-primary/30 font-extrabold'
                        : cell.muted
                          ? 'text-on-surface-variant/70 hover:bg-surface-container-high/60'
                          : 'text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-surface-container-low/50 dark:bg-surface-container-high/20 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => { setDeadline(''); setPickerOpen(false) }}
              className="text-body-xs font-bold text-[#0a58ca] hover:text-[#084298] px-2 py-1 rounded-lg hover:bg-[#0a58ca]/10 transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const t = new Date()
                const key = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
                setDeadline(key)
                setViewYear(t.getFullYear())
                setViewMonth(t.getMonth())
              }}
              className="text-body-xs font-bold text-[#0a58ca] hover:text-[#084298] px-2 py-1 rounded-lg hover:bg-[#0a58ca]/10 transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
