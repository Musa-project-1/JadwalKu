import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useTasks } from '../../hooks/useTasks'

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
  const { tasks, addTask, toggleDone, removeTask } = useTasks()
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { thisWeek, nextWeek, done } = useMemo(() => groupTasks(tasks), [tasks])

  const openCount = thisWeek.length + nextWeek.length
  const progress = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0
  const highPriority = useMemo(
    () =>
      [...thisWeek]
        .filter((t) => !t.selesai)
        .sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline))
        .slice(0, 3),
    [thisWeek],
  )

  return (
    <div className="space-y-lg">
      <header className="flex items-end justify-between gap-md">
        <div>
          <h2 className="text-display text-on-surface">Tugas Kuliah</h2>
          <p className="mt-xs text-body-lg text-on-surface-variant">
            Manajemen tenggat waktu dan progres belajar.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="hidden shrink-0 tablet:inline-flex">
          <Icon name="add" size={20} />
          Tambah Tugas
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-lg desktop:grid-cols-3">
        <div className="space-y-lg desktop:col-span-2">
          <TaskSection
            title="Minggu Ini"
            dotColor="bg-error"
            count={thisWeek.length}
            tasks={thisWeek}
            onToggle={toggleDone}
            onDelete={setDeleteTarget}
          />
          <TaskSection
            title="Minggu Depan"
            dotColor="bg-primary"
            count={nextWeek.length}
            tasks={nextWeek}
            onToggle={toggleDone}
            onDelete={setDeleteTarget}
          />
          {done.length > 0 && (
            <section className="opacity-70">
              <h3 className="mb-sm flex items-center gap-sm text-label-caps uppercase text-on-surface-variant">
                <Icon name="task_alt" size={20} />
                Selesai
                <span className="ml-2 rounded-full bg-surface-container px-2 py-1 text-label-caps text-on-surface-variant dark:bg-surface-container-high">
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
          {openCount === 0 && done.length === 0 && (
            <div className="pb-20 tablet:pb-0">
            <EmptyState
              icon="assignment"
              title="Belum ada tugas"
              description="Tambahkan tugas pertamamu dengan tombol + di bawah."
              actionLabel="Tambah Tugas"
              onAction={() => setShowForm(true)}
            />
            </div>
          )}
        </div>

        {/* Progress + prioritas tinggi — desktop */}
        <aside className="hidden space-y-lg desktop:block">
          <div className="relative overflow-hidden rounded-2xl bg-primary-container p-lg text-on-primary-container shadow-level-1">
            <div className="absolute right-4 top-4 opacity-20">
              <Icon name="monitoring" size={64} />
            </div>
            <h3 className="relative z-10 mb-xs text-title-md">Progres Minggu Ini</h3>
            <p className="relative z-10 mb-md text-body-sm opacity-90">
              Kamu telah menyelesaikan {done.length} dari {tasks.length} tugas.
            </p>
            <div className="relative z-10 mb-2 h-2 w-full rounded-full bg-on-primary-container/20">
              <div
                className="h-2 rounded-full bg-primary-fixed-dim transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="relative z-10 text-label-caps opacity-80">{progress}% Selesai</p>
          </div>

          {highPriority.length > 0 && (
            <section className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-lg shadow-level-1 dark:bg-surface-container-high">
              <h3 className="mb-md text-title-md text-on-surface">Prioritas Tinggi</h3>
              <ul className="space-y-sm">
                {highPriority.map((task) => (
                  <li key={task.id} className="flex items-center gap-sm">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-error-container/50 text-error">
                      <Icon name={task.prioritas === 'tinggi' ? 'warning' : 'edit_note'} size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-body-sm font-semibold text-on-surface">
                        {task.judul}
                      </p>
                      <p className="text-label-caps text-on-surface-variant">
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
      </div>

      {/* FAB — mobile */}
      <button
        type="button"
        onClick={() => setShowForm(true)}
        aria-label="Tambah tugas"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-level-2 transition-all hover:bg-primary-container active:scale-95 tablet:hidden"
      >
        <Icon name="add" size={28} />
      </button>

      {showForm && (
        <AddTaskForm
          onSubmit={(data) => {
            addTask(data)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Hapus tugas?"
          description={`"${deleteTarget.judul}" akan dihapus permanen dari perangkat ini.`}
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
      <h3 className="mb-sm flex items-center gap-sm text-label-caps uppercase text-on-surface">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        {title}
        <span className="ml-2 rounded-full bg-surface-container px-2 py-1 text-label-caps text-on-surface-variant dark:bg-surface-container-high">
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
    <div className="relative overflow-hidden rounded-xl border border-surface-variant bg-surface p-sm shadow-level-1 transition-colors hover:border-primary-fixed-dim dark:bg-surface-container-high">
      <div className={`absolute bottom-0 left-0 top-0 w-1 ${PRIORITY_STRIPE[task.prioritas] ?? 'bg-secondary'}`} />
      <div className="flex items-start gap-md pl-xs">
        <input
          type="checkbox"
          checked={task.selesai}
          onChange={() => onToggle(task.id)}
          className="mt-1 h-5 w-5 cursor-pointer rounded accent-[#00685f]"
          aria-label={`Tandai ${task.judul} selesai`}
        />
        <div className="min-w-0 flex-1">
          <div className="mb-xs flex flex-wrap items-center justify-between gap-xs">
            {task.kodeMK && (
              <span className="rounded bg-surface-container-high px-2 py-0.5 text-label-caps uppercase tracking-wider text-on-surface-variant">
                {task.kodeMK}
              </span>
            )}
            {!task.selesai && (
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-label-caps ${
                  daysLeft <= 2
                    ? 'bg-error-container/50 text-error'
                    : 'bg-surface-container text-on-surface-variant dark:bg-surface-container-high'
                }`}
              >
                <Icon name="schedule" size={12} />
                {formatDeadline(task.deadline)}
              </span>
            )}
          </div>
          <h4
            className={`text-title-md ${task.selesai ? 'line-through text-outline' : 'text-on-surface'}`}
          >
            {task.judul}
          </h4>
          {task.catatan && (
            <p className="mt-xs line-clamp-2 text-body-sm text-on-surface-variant">
              {task.catatan}
            </p>
          )}
          <div className="mt-xs flex items-center justify-between">
            <span className="text-label-caps text-on-surface-variant">
              Prioritas: {PRIORITY_LABEL[task.prioritas] ?? task.prioritas}
            </span>
            <button
              type="button"
              onClick={() => onDelete(task)}
              className="rounded p-1 text-on-surface-variant transition-colors hover:text-error"
              aria-label="Hapus tugas"
            >
              <Icon name="delete" size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddTaskForm({ onSubmit, onCancel }) {
  const [judul, setJudul] = useState('')
  const [kodeMK, setKodeMK] = useState('')
  const [deadline, setDeadline] = useState('')
  const [prioritas, setPrioritas] = useState('sedang')
  const [catatan, setCatatan] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!judul.trim() || !deadline) return
    onSubmit({ judul: judul.trim(), kodeMK: kodeMK.trim(), deadline, prioritas, catatan: catatan.trim() })
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onCancel} role="presentation" />
      <form
        onSubmit={handleSubmit}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-surface-container-lowest p-lg shadow-level-2 tablet:inset-y-0 tablet:left-auto tablet:right-0 tablet:max-h-none tablet:w-96 tablet:rounded-l-2xl dark:bg-surface-container-low"
      >
        <div className="mb-lg flex items-center justify-between">
          <h3 className="text-title-md text-on-surface">Tambah Tugas</h3>
          <button type="button" onClick={onCancel} className="text-on-surface-variant hover:text-primary">
            <Icon name="close" size={24} />
          </button>
        </div>

        <label className="mb-md block">
          <span className="mb-xs block text-label-caps text-on-surface-variant">Judul tugas *</span>
          <input
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            required
            placeholder="Contoh: Implementasi Linked List"
            className="w-full rounded-lg border border-outline-variant bg-surface px-sm py-sm text-body-lg text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high"
          />
        </label>

        <label className="mb-md block">
          <span className="mb-xs block text-label-caps text-on-surface-variant">Kode mata kuliah</span>
          <input
            value={kodeMK}
            onChange={(e) => setKodeMK(e.target.value)}
            placeholder="Contoh: IF301 (opsional)"
            className="w-full rounded-lg border border-outline-variant bg-surface px-sm py-sm text-body-lg text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high"
          />
        </label>

        <label className="mb-md block">
          <span className="mb-xs block text-label-caps text-on-surface-variant">Tenggat *</span>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            className="w-full rounded-lg border border-outline-variant bg-surface px-sm py-sm text-body-lg text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high"
          />
        </label>

        <fieldset className="mb-md">
          <legend className="mb-xs text-label-caps text-on-surface-variant">Prioritas</legend>
          <div className="flex gap-sm">
            {['tinggi', 'sedang', 'rendah'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrioritas(p)}
                className={`flex-1 rounded-lg border-2 py-sm text-body-sm capitalize transition-colors ${
                  prioritas === p
                    ? 'border-primary text-primary'
                    : 'border-transparent bg-surface-container text-on-surface-variant dark:bg-surface-container-high'
                }`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mb-lg block">
          <span className="mb-xs block text-label-caps text-on-surface-variant">Catatan</span>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={3}
            placeholder="Detail tugas (opsional)"
            className="w-full resize-none rounded-lg border border-outline-variant bg-surface px-sm py-sm text-body-lg text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high"
          />
        </label>

        <div className="flex gap-sm">
          <Button type="button" variant="secondary" onClick={onCancel} className="px-lg">
            Batal
          </Button>
          <Button type="submit" className="flex-1 py-sm">
            Simpan Tugas
          </Button>
        </div>
      </form>
    </>
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
    const dl = new Date(task.deadline)
    const diff = dl.getTime() - startOfToday.getTime()
    if (diff <= weekMs) groups.thisWeek.push(task)
    else groups.nextWeek.push(task)
  }
  return groups
}

function daysUntil(isoDate) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((new Date(isoDate).getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000))
}

function formatDeadline(isoDate) {
  const days = daysUntil(isoDate)
  if (days === 0) return 'Hari ini'
  if (days === 1) return 'Besok'
  if (days > 1) return `${days} hari lagi`
  return `${Math.abs(days)} hari lewat`
}
