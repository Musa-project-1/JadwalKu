import { useApp } from '../../../hooks/useApp'

export function TasksToolbar({
  tasks,
  statusFilter,
  setStatusFilter,
  courseFilter,
  setCourseFilter,
  availableCourseCodes,
  allActiveCount,
  allDoneCount,
  progress,
}) {
  const { language, t } = useApp()

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-3 tablet:px-4 tablet:py-2.5 shadow-level-1 flex flex-col tablet:flex-row tablet:items-center tablet:justify-between gap-3">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={`px-3 py-1 rounded-full text-body-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-primary/10 text-primary border border-primary/25 shadow-level-1'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          {language === 'en' ? 'Pending' : 'Belum Selesai'} ({allActiveCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('done')}
          className={`px-3 py-1 rounded-full text-body-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'done'
              ? 'bg-primary/10 text-primary border border-primary/25 shadow-level-1'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          {language === 'en' ? 'Completed' : 'Selesai'} ({allDoneCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1 rounded-full text-body-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-primary/10 text-primary border border-primary/25 shadow-level-1'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          {language === 'en' ? 'All' : 'Semua'} ({tasks.length})
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
            <option value="all">{t ? t('tasks.all_courses') : 'Semua Mata Kuliah'}</option>
            {availableCourseCodes.map((kode) => (
              <option key={kode} value={kode}>
                {kode}
              </option>
            ))}
          </select>
        )}

        {tasks.length > 0 && (
          <div className="flex items-center gap-2 text-body-xs font-semibold text-on-surface-variant">
            <span>{t ? t('tasks.progress_label') : 'Progres'}: <strong className="text-on-surface">{progress}%</strong></span>
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
  )
}
