import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router'
import { Icon } from '../../components/Icon'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { daysUntil } from '../../lib/scheduleUtils'
import { useTasks } from '../../hooks/useTasks'
import { useApp } from '../../hooks/useApp'
import { TaskCard } from '../../components/student/tasks/TaskCard'
import { AddTaskForm } from '../../components/student/tasks/AddTaskForm'
import { TasksToolbar } from '../../components/student/tasks/TasksToolbar'
import { groupTasks, formatDeadline } from '../../components/student/tasks/taskUtils'

export default function Tasks() {
  const { language, t } = useApp()
  const { tasks, addTask, toggleDone, removeTask } = useTasks()
  const location = useLocation()

  const [showForm, setShowForm] = useState(false)
  const [initialKodeMK, setInitialKodeMK] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  // Filter State
  const [scopeFilter, setScopeFilter] = useState('all') // 'all' | 'prodi' | 'personal'
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
    tasks.forEach((task) => {
      if (task.kodeMK) set.add(task.kodeMK)
    })
    return Array.from(set).sort()
  }, [tasks])

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Scope filter
      if (scopeFilter === 'prodi' && !task.isProdi) return false
      if (scopeFilter === 'personal' && task.isProdi) return false

      // Status filter
      if (statusFilter === 'active' && task.selesai) return false
      if (statusFilter === 'done' && !task.selesai) return false

      // Course filter
      if (courseFilter !== 'all' && task.kodeMK !== courseFilter) return false

      return true
    })
  }, [tasks, scopeFilter, statusFilter, courseFilter])

  const { thisWeek, nextWeek, done } = useMemo(() => groupTasks(filteredTasks), [filteredTasks])

  const allActiveCount = useMemo(() => tasks.filter((task) => !task.selesai).length, [tasks])
  const allDoneCount = useMemo(() => tasks.filter((task) => task.selesai).length, [tasks])

  const progress = tasks.length > 0 ? Math.round((allDoneCount / tasks.length) * 100) : 0
  const highPriority = useMemo(
    () =>
      tasks
        .filter((task) => !task.selesai && task.prioritas === 'tinggi')
        .sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline))
        .slice(0, 3),
    [tasks],
  )

  function openAddForm() {
    setInitialKodeMK('')
    setShowForm(true)
  }

  async function handleAddSubmit(data, isProdi) {
    const res = await addTask(data, isProdi)
    if (!res?.ok) {
      setActionError(res?.error || 'Gagal menyimpan tugas')
      setTimeout(() => setActionError(''), 4000)
      if (res?.fallback) {
        setActionSuccess('Disimpan lokal karena gagal sync cloud')
        setTimeout(() => setActionSuccess(''), 3000)
        setShowForm(false)
      }
      return
    }
    setActionSuccess(isProdi ? 'Tugas Prodi tersinkron ke cloud' : 'Tugas berhasil ditambahkan')
    setTimeout(() => setActionSuccess(''), 2500)
    setShowForm(false)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    const res = await removeTask(deleteTarget.id)
    if (res?.ok === false) {
      setActionError(res?.error || 'Gagal menghapus tugas')
      setTimeout(() => setActionError(''), 4000)
    } else {
      setActionSuccess('Tugas dihapus')
      setTimeout(() => setActionSuccess(''), 2500)
    }
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-full overflow-x-hidden animate-fade-in">
      {/* 1. Header Halaman – Structured like WeeklySchedule */}
      <header className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-3 tablet:px-4 tablet:py-3 shadow-level-1 flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between w-full">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-level-1">
            <Icon name="assignment" size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl tablet:text-2xl font-bold tracking-tight text-on-surface">
                {t ? t('tasks.title') : 'Tugas Kuliah'}
              </h2>
              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-label-caps font-bold border border-primary/20">
                {allActiveCount > 0 ? (language === 'en' ? `${allActiveCount} Active` : `${allActiveCount} Aktif`) : (language === 'en' ? 'Completed' : 'Tuntas')}
              </span>
            </div>
            <p className="mt-0.5 text-body-xs text-on-surface-variant font-medium truncate">
              {t ? t('tasks.subtitle') : 'Kelola tugas kuliah, kuis, dan deadline proyek'}
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
              {language === 'en' ? 'All' : 'Semua'} ({tasks.length})
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('personal')}
              className={`rounded-full px-3 py-1 text-label-caps font-bold transition-all cursor-pointer ${
                scopeFilter === 'personal'
                  ? 'bg-surface shadow-level-1 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {language === 'en' ? 'Personal' : 'Pribadi'} ({tasks.filter((task) => !task.isProdi).length})
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
              {language === 'en' ? 'Program' : 'Prodi'} ({tasks.filter((task) => task.isProdi).length})
            </button>
          </div>

          {/* Primary Add Task Action */}
          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl bg-primary text-on-primary text-body-xs tablet:text-body-sm font-bold shadow-level-1 hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
          >
            <Icon name="add" size={16} />
            <span>{t ? t('tasks.add_task') : 'Tambah Tugas'}</span>
          </button>
        </div>
      </header>

      {/* 2. Secondary Toolbar: Progress Bar, Status Toggle & Course Filters */}
      <TasksToolbar
        tasks={tasks}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        courseFilter={courseFilter}
        setCourseFilter={setCourseFilter}
        availableCourseCodes={availableCourseCodes}
        allActiveCount={allActiveCount}
        allDoneCount={allDoneCount}
        progress={progress}
      />

      {/* 3. Urgent High Priority Banner (If any) */}
      {highPriority.length > 0 && statusFilter !== 'done' && (
        <div className="rounded-2xl border border-error/30 bg-error/10 dark:bg-error/15 p-4 space-y-2 shadow-level-1">
          <div className="flex items-center gap-2 text-error font-extrabold text-body-xs">
            <Icon name="priority_high" size={17} className="shrink-0 animate-bounce" />
            <span>{t ? t('tasks.urgent_banner') : 'Tugas Mendesak Mendekati Tenggat Waktu'}</span>
          </div>
          <div className="grid grid-cols-1 tablet:grid-cols-3 gap-2">
            {highPriority.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleDone(task.id)}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container-low border border-error/25 shadow-level-1 cursor-pointer hover:border-error transition-all"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-body-xs font-bold text-on-surface truncate">{task.judul}</p>
                  <p className="text-body-xs text-error font-semibold mt-0.5">{formatDeadline(task.deadline)}</p>
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
          <h3 className="text-title-md font-bold text-on-surface">{t ? t('tasks.empty_title') : 'Belum ada tugas kuliah'}</h3>
          <p className="mt-1.5 text-body-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
            {t ? t('tasks.empty_desc') : 'Catat tugas individu, PR mingguan, laporan praktikum, atau tugas kelompok bersama prodi agar tidak terlewat tenggat waktu.'}
          </p>
          <button
            type="button"
            onClick={openAddForm}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-on-primary text-body-sm font-bold shadow-level-1 hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
          >
            <Icon name="add" size={18} />
            <span>{t ? t('tasks.add_modal_title') : 'Tambah Tugas Baru'}</span>
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container-low p-8 text-center shadow-level-1">
          <Icon name="filter_list_off" size={36} className="mx-auto text-outline-variant mb-2" />
          <h4 className="text-body-sm font-bold text-on-surface">{t ? t('tasks.empty_filter_title') : 'Tidak ada tugas yang sesuai filter'}</h4>
          <p className="text-body-xs text-on-surface-variant mt-1">{t ? t('tasks.empty_filter_desc') : 'Coba ubah status atau kategori tugas di atas.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Minggu Ini */}
          {thisWeek.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-label-caps font-extrabold uppercase tracking-wider text-on-surface-variant">
                  {t ? t('tasks.due_this_week', { count: thisWeek.length }) : `Tenggat Minggu Ini (${thisWeek.length})`}
                </span>
              </div>
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
                {thisWeek.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleDone}
                    onDelete={(target) => setDeleteTarget(target)}
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
                    onDelete={(target) => setDeleteTarget(target)}
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
                    onDelete={(target) => setDeleteTarget(target)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Feedback */}
      {actionError && (
        <div role="status" className="rounded-2xl border border-error/30 bg-error/10 dark:bg-error/15 px-4 py-3 flex items-start justify-between gap-3">
          <span className="flex items-center gap-2 text-body-sm font-semibold text-error"><span className="text-error">{actionError}</span></span>
          <button type="button" onClick={() => setActionError('')} className="shrink-0 rounded-full p-1 hover:bg-error/15"><span className="text-error">×</span></button>
        </div>
      )}
      {actionSuccess && (
        <div role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-start justify-between gap-3">
          <span className="text-body-sm font-semibold text-emerald-800 dark:text-emerald-200">{actionSuccess}</span>
          <button type="button" onClick={() => setActionSuccess('')} className="shrink-0 rounded-full p-1 hover:bg-emerald-500/15">×</button>
        </div>
      )}
      {showForm && (
        <AddTaskForm
          initialKodeMK={initialKodeMK}
          onSubmit={handleAddSubmit}
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
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
