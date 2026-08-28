import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useTasks } from '../../hooks/useTasks'
import { useApp } from '../../hooks/useApp'

const PRIORITY_STRIPE = {
  tinggi: 'bg-error',
  sedang: 'bg-tertiary-container',
  rendah: 'bg-secondary',
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
    <div className="space-y-lg w-full max-w-full overflow-x-hidden">
      {/* Header Halaman — Bold, Rich Icon Badge & Action */}
      <header className="flex flex-col gap-4 desktop:flex-row desktop:items-center desktop:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Icon name="assignment" size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl tablet:text-3xl font-bold tracking-tight text-on-surface">
                Tugas Kuliah
              </h2>
              {allActiveCount > 0 && (
                <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-bold border border-primary/20">
                  {allActiveCount} Aktif
                </span>
              )}
            </div>
            <p className="mt-0.5 text-body-sm text-on-surface-variant font-normal">
              {program || 'Informatika'} · Semester {semester || '1'} · Manajemen tenggat waktu & tugas
            </p>
          </div>
        </div>

        {/* Tombol Header — Hanya muncul jika sudah ada tugas */}
        {tasks.length > 0 && (
          <Button
            onClick={() => {
              setInitialKodeMK('')
              setShowForm(true)
            }}
            className="hidden shrink-0 tablet:inline-flex shadow-sm px-4 py-2 text-body-sm font-bold cursor-pointer"
          >
            <Icon name="add" size={18} />
            Tambah Tugas
          </Button>
        )}
      </header>

      {/* Filter Tabs & Toolbar (Hanya muncul jika sudah ada tugas) */}
      {/* P3: di <600px baris filter jadi satu baris scroll (tidak wrap 3-4 baris).
          >=600px tetap flex-wrap + justify-between seperti semula. */}
      {tasks.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/25 pb-3 max-[599px]:flex-nowrap max-[599px]:overflow-x-auto max-[599px]:no-scrollbar w-full max-w-full">
          {/* Scope Tabs (Semua / Tugas Prodi / Tugas Pribadi) */}
          <div className="flex items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-container-high/50 p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setScopeFilter('all')}
              className={`rounded-full px-3.5 py-1 text-body-xs font-bold transition-all cursor-pointer ${
                scopeFilter === 'all'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Semua ({tasks.length})
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('prodi')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-body-xs font-bold transition-all cursor-pointer ${
                scopeFilter === 'prodi'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon name="corporate_fare" size={13} />
              <span>Tugas Prodi ({prodiCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('pribadi')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-body-xs font-bold transition-all cursor-pointer ${
                scopeFilter === 'pribadi'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon name="person" size={13} />
              <span>Pribadi ({personalCount})</span>
            </button>
          </div>

          {/* Status Filter & Course Dropdown */}
          <div className="flex items-center gap-2 max-[599px]:shrink-0">
            {/* Status Segmented Switch */}
            <div className="flex items-center rounded-full border border-outline-variant/30 bg-surface-container-high/40 p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-surface text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Belum Selesai ({allActiveCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('done')}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === 'done'
                    ? 'bg-surface text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Selesai ({allDoneCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-surface text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Semua
              </button>
            </div>

            {/* Mata Kuliah Dropdown */}
            {availableCourseCodes.length > 0 && (
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="rounded-full border border-outline-variant/30 bg-surface-container-high/50 px-3 py-1 text-body-xs font-semibold text-on-surface focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="all">Semua MK</option>
                {availableCourseCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-lg desktop:grid-cols-3">
        <div className={`space-y-lg ${tasks.length > 0 ? 'desktop:col-span-2' : 'desktop:col-span-3'}`}>
          {/* List Sections */}
          <TaskSection
            title="Minggu Ini"
            dotColor="bg-error"
            count={thisWeek.length}
            tasks={thisWeek}
            onToggle={toggleDone}
            onDelete={setDeleteTarget}
          />
          <TaskSection
            title="Minggu Depan & Mendatang"
            dotColor="bg-primary"
            count={nextWeek.length}
            tasks={nextWeek}
            onToggle={toggleDone}
            onDelete={setDeleteTarget}
          />
          {done.length > 0 && (
            <section className="opacity-75 pt-2">
              <h3 className="mb-sm flex items-center gap-sm text-label-caps uppercase text-on-surface-variant font-bold">
                <Icon name="task_alt" size={18} className="text-emerald-500" />
                Selesai
                <span className="ml-2 rounded-full bg-surface-container px-2 py-0.5 text-label-caps text-on-surface-variant dark:bg-surface-container-high">
                  {done.length}
                </span>
              </h3>
              <div className="space-y-sm">
                {done.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={toggleDone} onDelete={setDeleteTarget} />
                ))}
              </div>
            </section>
          )}

          {/* Empty State — Solid Dashed Container */}
          {tasks.length === 0 && (
            <div className="rounded-3xl border-2 border-dashed border-outline-variant/40 bg-surface-container-lowest/60 dark:bg-surface-container-low/30 p-8 tablet:p-14 text-center max-w-xl mx-auto my-4 shadow-xs">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Icon name="assignment" size={32} />
              </div>
              <h3 className="text-xl font-bold text-on-surface">Belum ada tugas kuliah</h3>
              <p className="mt-1.5 text-body-sm text-on-surface-variant max-w-md mx-auto">
                Catat tugas individu, PR, laporan praktikum, atau proyek bersama prodi agar tidak terlewat tenggat waktu.
              </p>
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={() => {
                    setInitialKodeMK('')
                    setShowForm(true)
                  }}
                  className="px-5 py-2.5 shadow-sm text-body-sm font-bold"
                >
                  <Icon name="add" size={18} />
                  Tambah Tugas Baru
                </Button>
              </div>
            </div>
          )}

          {/* Filtered Empty State */}
          {tasks.length > 0 && filteredTasks.length === 0 && (
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/40 p-8 text-center">
              <p className="text-body-sm text-on-surface-variant font-medium">
                Tidak ada tugas yang cocok dengan filter yang dipilih.
              </p>
              <button
                type="button"
                onClick={() => {
                  setScopeFilter('all')
                  setStatusFilter('all')
                  setCourseFilter('all')
                }}
                className="mt-3 text-body-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Reset Semua Filter
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Summary & Prioritas Tinggi (Desktop) */}
        {tasks.length > 0 && (
          <aside className="hidden space-y-lg desktop:block">
            {/* Progress Card */}
            <div className="relative overflow-hidden rounded-3xl bg-primary p-lg text-on-primary shadow-level-1">
              <div className="absolute right-4 top-4 opacity-20 pointer-events-none">
                <Icon name="monitoring" size={64} />
              </div>
              <h3 className="relative z-10 mb-xs text-title-md font-bold">Progres Tugas</h3>
              <p className="relative z-10 mb-md text-body-sm opacity-90">
                Kamu telah menyelesaikan {allDoneCount} dari {tasks.length} tugas.
              </p>
              <div className="relative z-10 mb-2 h-2.5 w-full rounded-full bg-white/25">
                <div
                  className="h-2.5 rounded-full bg-white transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="relative z-10 flex items-center justify-between text-label-caps font-bold opacity-90">
                <span>{progress}% Selesai</span>
                <span>{allActiveCount} Tersisa</span>
              </div>
            </div>

            {/* Prioritas Mendesak */}
            {highPriority.length > 0 && (
              <section className="rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-lg shadow-level-1 dark:bg-surface-container-low">
                <div className="mb-md flex items-center gap-2 text-error">
                  <Icon name="warning" size={20} />
                  <h3 className="text-title-sm font-bold text-on-surface">Prioritas Mendesak</h3>
                </div>
                <ul className="space-y-sm">
                  {highPriority.map((task) => (
                    <li key={task.id} className="flex items-center gap-sm rounded-2xl bg-error-container/20 p-2.5 border border-error/20">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-error/15 text-error">
                        <Icon name="priority_high" size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body-xs font-bold text-on-surface">
                          {task.judul}
                        </p>
                        <p className="text-[11px] text-error font-semibold">
                          {task.kodeMK ? `${task.kodeMK} • ` : ''}
                          {formatDeadline(task.deadline)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        )}
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => {
          setInitialKodeMK('')
          setShowForm(true)
        }}
        aria-label="Tambah tugas"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-level-2 transition-all hover:bg-primary-container active:scale-95 tablet:hidden cursor-pointer"
      >
        <Icon name="add" size={28} />
      </button>

      {/* Modal Add Task */}
      {showForm && (
        <AddTaskForm
          initialKodeMK={initialKodeMK}
          onSubmit={async (data, isProdi) => {
            await addTask(data, isProdi)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Confirm Delete Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Hapus tugas?"
          description={`"${deleteTarget.judul}" akan dihapus.`}
          confirmLabel="Hapus"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            removeTask(deleteTarget.id)
            setDeleteTarget(null)
          }}
        />
      )}
    </div>
  )
}

function TaskSection({ title, dotColor, count, tasks, onToggle, onDelete }) {
  if (count === 0) return null
  return (
    <section>
      <h3 className="mb-sm flex items-center gap-sm text-label-caps uppercase text-on-surface font-bold">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        {title}
        <span className="ml-2 rounded-full bg-surface-container px-2 py-0.5 text-label-caps text-on-surface-variant dark:bg-surface-container-high">
          {count}
        </span>
      </h3>
      <div className="space-y-sm">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </div>
    </section>
  )
}

function TaskCard({ task, onToggle, onDelete }) {
  const daysLeft = daysUntil(task.deadline)

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-level-1 transition-all duration-200 hover:border-primary/40 hover:shadow-level-2 dark:bg-surface-container-low">
      <div className={`absolute bottom-0 left-0 top-0 w-1.5 ${PRIORITY_STRIPE[task.prioritas] ?? 'bg-secondary'}`} />
      <div className="flex items-start gap-md">
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 active:scale-90 cursor-pointer ${
            task.selesai
              ? 'bg-primary border-primary text-on-primary'
              : 'border-outline text-transparent hover:border-primary hover:text-primary'
          }`}
          aria-label={`Tandai ${task.judul} selesai`}
        >
          <Icon name="check" size={14} />
        </button>

        <div className="min-w-0 flex-1">
          {/* Badges Bar: Sumber Tugas + Kode MK + Deadline */}
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {task.isProdi ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                <Icon name="corporate_fare" size={12} />
                <span>Tugas Bersama Prodi</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-container-high px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                <Icon name="person" size={12} />
                <span>Pribadi</span>
              </span>
            )}

            {task.kodeMK && (
              <span className="rounded bg-surface-container-high px-2 py-0.5 text-label-caps uppercase tracking-wider text-on-surface-variant font-bold dark:bg-surface-container-highest">
                {task.kodeMK}
              </span>
            )}

            {!task.selesai && (
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-label-caps font-semibold ${
                  daysLeft <= 2
                    ? 'bg-error-container/50 text-error font-bold'
                    : 'bg-surface-container text-on-surface-variant dark:bg-surface-container-high'
                }`}
              >
                <Icon name="schedule" size={12} />
                {formatDeadline(task.deadline)}
              </span>
            )}
          </div>

          <h4
            className={`text-body-lg font-bold group-hover:text-primary transition-colors leading-snug ${
              task.selesai ? 'line-through text-outline' : 'text-on-surface'
            }`}
          >
            {task.judul}
          </h4>

          {task.catatan && (
            <p className="mt-1.5 line-clamp-2 text-body-sm text-on-surface-variant">
              {task.catatan}
            </p>
          )}

          <div className="mt-2.5 flex items-center justify-between border-t border-outline-variant/15 pt-2">
            <span className="text-[11px] text-on-surface-variant font-medium">
              Prioritas: <strong className="text-on-surface">{PRIORITY_LABEL[task.prioritas] ?? task.prioritas}</strong>
              {task.dibuatOleh && <span className="opacity-70"> · oleh {task.dibuatOleh}</span>}
            </span>
            <button
              type="button"
              onClick={() => onDelete(task)}
              className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error cursor-pointer"
              aria-label="Hapus tugas"
              title="Hapus tugas"
            >
              <Icon name="delete" size={16} />
            </button>
          </div>
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

  // P5: >=600px tetap centered dialog persis seperti sebelumnya;
  //     <600px menjadi bottom sheet (sheet-up + drag handle + tanpa gap samping).
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 max-[599px]:items-end max-[599px]:justify-stretch max-[599px]:p-0">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onCancel} role="presentation" />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 tablet:p-8 shadow-level-3 dark:bg-surface-container-low animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0 max-[599px]:animate-[sheet-up_300ms_var(--ease-emphasized)_both]"
      >
        {/* Drag handle — mobile only */}
        <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-1 pb-2 -mx-2">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon name="add_task" size={20} />
            </div>
            <h3 className="text-title-md text-on-surface font-bold">Tambah Tugas Baru</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Jenis Tugas: Pribadi vs Bersama Prodi */}
        <div className="mb-4">
          <label className="mb-1.5 block text-label-caps font-bold text-on-surface-variant">Tipe Tugas</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsProdi(false)}
              className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-3 text-body-sm font-bold transition-all cursor-pointer ${
                !isProdi
                  ? 'border-primary bg-primary/10 text-primary shadow-xs'
                  : 'border-outline-variant/30 bg-surface-container-low/40 text-on-surface-variant'
              }`}
            >
              <Icon name="person" size={18} />
              <span>Tugas Pribadi</span>
            </button>
            <button
              type="button"
              onClick={() => setIsProdi(true)}
              className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-3 text-body-sm font-bold transition-all cursor-pointer ${
                isProdi
                  ? 'border-primary bg-primary/10 text-primary shadow-xs'
                  : 'border-outline-variant/30 bg-surface-container-low/40 text-on-surface-variant'
              }`}
            >
              <Icon name="corporate_fare" size={18} />
              <span>Bersama Prodi</span>
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-on-surface-variant">
            {isProdi
              ? 'Tugas ini akan tersinkronisasi ke seluruh mahasiswa di prodi & semester yang sama.'
              : 'Tugas ini hanya tersimpan di perangkat lokal Anda.'}
          </p>
        </div>

        <label className="mb-3.5 block">
          <span className="mb-1 block text-label-caps font-bold text-on-surface-variant">Judul Tugas *</span>
          <input
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            required
            placeholder="Contoh: Makalah Etika Profesi Bab 1-3"
            className="w-full rounded-2xl border border-outline-variant/35 bg-surface-container-low/40 px-3.5 py-2.5 text-body-sm text-on-surface placeholder:text-outline-variant focus:border-primary focus:outline-none dark:bg-surface-container-high/40 shadow-xs"
          />
        </label>

        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3 mb-3.5">
          <label className="block">
            <span className="mb-1 block text-label-caps font-bold text-on-surface-variant">Kode Mata Kuliah</span>
            <input
              value={kodeMK}
              onChange={(e) => setKodeMK(e.target.value)}
              placeholder="Contoh: IF301 (opsional)"
              className="w-full rounded-2xl border border-outline-variant/35 bg-surface-container-low/40 px-3.5 py-2.5 text-body-sm text-on-surface placeholder:text-outline-variant focus:border-primary focus:outline-none dark:bg-surface-container-high/40 shadow-xs"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-label-caps font-bold text-on-surface-variant">Tenggat Waktu *</span>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="w-full rounded-2xl border border-outline-variant/35 bg-surface-container-low/40 px-3.5 py-2.5 text-body-sm text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/40 shadow-xs cursor-pointer"
            />
          </label>
        </div>

        <fieldset className="mb-3.5">
          <legend className="mb-1 text-label-caps font-bold text-on-surface-variant">Tingkat Prioritas</legend>
          <div className="grid grid-cols-3 gap-2">
            {['tinggi', 'sedang', 'rendah'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrioritas(p)}
                className={`rounded-2xl border-2 py-2 text-body-xs font-bold capitalize transition-all cursor-pointer ${
                  prioritas === p
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-outline-variant/30 bg-surface-container-low/40 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mb-5 block">
          <span className="mb-1 block text-label-caps font-bold text-on-surface-variant">Catatan / Instruksi Tugas</span>
          <textarea
            id="task-catatan"
            name="task-catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={3}
            placeholder="Tuliskan format pengumpulan, link materi, atau catatan penting..."
            className="w-full resize-none rounded-2xl border border-outline-variant/35 bg-surface-container-low/40 p-3 text-body-sm text-on-surface placeholder:text-outline-variant focus:border-primary focus:outline-none dark:bg-surface-container-high/40 shadow-xs"
          />
        </label>

        <div className="flex gap-2.5">
          <Button type="button" variant="secondary" onClick={onCancel} className="px-5 py-2.5 rounded-full text-body-sm font-semibold">
            Batal
          </Button>
          <Button type="submit" className="flex-1 py-2.5 rounded-full text-body-sm font-bold shadow-sm">
            Simpan Tugas
          </Button>
        </div>
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
