import { Icon } from '../../Icon'
import { Button } from '../../Button'

export function ExamHeader({
  stats,
  onOpenAdd,
}) {
  return (
    <header className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-3 tablet:px-4 tablet:py-3 shadow-xs flex flex-col gap-3.5 tablet:flex-row tablet:items-center tablet:justify-between w-full shrink-0">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-xs dark:bg-amber-500/10 dark:text-amber-400">
          <Icon name="event_note" size={24} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl tablet:text-2xl font-bold tracking-tight text-on-surface">
              Kelola Jadwal Ujian
            </h1>
            <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 text-[11px] font-bold border border-amber-500/20">
              Evaluasi Semester
            </span>
          </div>
          <p className="mt-0.5 text-body-xs text-on-surface-variant font-medium truncate">
            Jadwal pelaksanaan UTS & UAS per semester, prodi & ruang
          </p>
        </div>
      </div>

      {/* Right side: 3 Stat Chips + Tambah Ujian Button */}
      <div className="flex items-center gap-2 tablet:gap-2.5 shrink-0 flex-wrap tablet:flex-nowrap">
        <div className="grid grid-cols-3 gap-1.5 w-full tablet:flex tablet:w-auto tablet:gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 shadow-2xs min-w-0">
            <Icon name="calendar_month" size={14} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="text-[11.5px] font-bold text-emerald-700 dark:text-emerald-400 truncate">
              {stats.total} Total
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 shadow-2xs min-w-0">
            <Icon name="quiz" size={14} className="text-indigo-700 dark:text-indigo-400 shrink-0" />
            <span className="text-[11.5px] font-bold text-indigo-700 dark:text-indigo-400 truncate">
              {stats.uts} UTS
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 shadow-2xs min-w-0">
            <Icon name="workspace_premium" size={14} className="text-amber-700 dark:text-amber-400 shrink-0" />
            <span className="text-[11.5px] font-bold text-amber-700 dark:text-amber-400 truncate">
              {stats.uas} UAS
            </span>
          </div>
        </div>

        <Button
          onClick={onOpenAdd}
          className="rounded-full px-4 py-1.5 font-bold shadow-xs cursor-pointer text-body-xs shrink-0 bg-primary text-on-primary"
          title="Tambah Jadwal Ujian"
          aria-label="Tambah Ujian"
        >
          <Icon name="add" size={16} className="mr-1" />
          <span>Tambah Ujian</span>
        </Button>
      </div>
    </header>
  )
}
