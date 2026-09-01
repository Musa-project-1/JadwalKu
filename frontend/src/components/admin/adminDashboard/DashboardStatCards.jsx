import { Link } from 'react-router-dom'
import { Icon } from '../../Icon'

export function DashboardStatCards({
  loadingProdi,
  programsCount,
  loadingCourses,
  coursesCount,
  loadingSchedules,
  schedulesCount,
  loadingExams,
  examsCount,
}) {
  return (
    <section className="shrink-0 grid grid-cols-2 desktop:grid-cols-4 gap-3 tablet:gap-4 items-stretch" aria-label="Statistik Sistem">
      {/* Stat 1: Total Prodi */}
      <Link
        to="/admin/pengaturan-akademik"
        className="group relative overflow-hidden rounded-3xl bg-surface-container-lowest border-l-4 border-l-emerald-500 border border-outline-variant/20 p-4 tablet:p-5 shadow-xs hover:shadow-md transition-all dark:bg-surface-container-low flex flex-col justify-between min-h-[105px]"
      >
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11px] uppercase font-bold text-on-surface-variant tracking-wider truncate">Prodi Aktif</p>
          <div className="flex h-8 w-8 tablet:h-9 tablet:w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform border border-emerald-500/20 shadow-2xs">
            <Icon name="school" size={19} />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <h3 className="text-2xl tablet:text-3xl font-extrabold text-on-surface tracking-tight">{loadingProdi ? '...' : programsCount}</h3>
          <span className="text-[11.5px] text-on-surface-variant font-medium">Program Studi</span>
        </div>
      </Link>

      {/* Stat 2: Total Mata Kuliah */}
      <Link
        to="/admin/mata-kuliah"
        className="group relative overflow-hidden rounded-3xl bg-surface-container-lowest border-l-4 border-l-blue-500 border border-outline-variant/20 p-4 tablet:p-5 shadow-xs hover:shadow-md transition-all dark:bg-surface-container-low flex flex-col justify-between min-h-[105px]"
      >
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11px] uppercase font-bold text-on-surface-variant tracking-wider truncate">Mata Kuliah</p>
          <div className="flex h-8 w-8 tablet:h-9 tablet:w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform border border-blue-500/20 shadow-2xs">
            <Icon name="menu_book" size={19} />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <h3 className="text-2xl tablet:text-3xl font-extrabold text-on-surface tracking-tight">{loadingCourses ? '...' : coursesCount}</h3>
          <span className="text-[11.5px] text-on-surface-variant font-medium">Master MK</span>
        </div>
      </Link>

      {/* Stat 3: Sesi Jadwal Aktif */}
      <Link
        to="/admin/jadwal"
        className="group relative overflow-hidden rounded-3xl bg-surface-container-lowest border-l-4 border-l-purple-500 border border-outline-variant/20 p-4 tablet:p-5 shadow-xs hover:shadow-md transition-all dark:bg-surface-container-low flex flex-col justify-between min-h-[105px]"
      >
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11px] uppercase font-bold text-on-surface-variant tracking-wider truncate">Sesi Jadwal</p>
          <div className="flex h-8 w-8 tablet:h-9 tablet:w-9 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform border border-purple-500/20 shadow-2xs">
            <Icon name="calendar_month" size={19} />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <h3 className="text-2xl tablet:text-3xl font-extrabold text-on-surface tracking-tight">{loadingSchedules ? '...' : schedulesCount}</h3>
          <span className="text-[11.5px] text-on-surface-variant font-medium">Sesi Kuliah</span>
        </div>
      </Link>

      {/* Stat 4: Jadwal Ujian */}
      <Link
        to="/admin/ujian"
        className="group relative overflow-hidden rounded-3xl bg-surface-container-lowest border-l-4 border-l-amber-500 border border-outline-variant/20 p-4 tablet:p-5 shadow-xs hover:shadow-md transition-all dark:bg-surface-container-low flex flex-col justify-between min-h-[105px]"
      >
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11px] uppercase font-bold text-on-surface-variant tracking-wider truncate">Jadwal Ujian</p>
          <div className="flex h-8 w-8 tablet:h-9 tablet:w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform border border-amber-500/20 shadow-2xs">
            <Icon name="event_note" size={19} />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <h3 className="text-2xl tablet:text-3xl font-extrabold text-on-surface tracking-tight">{loadingExams ? '...' : examsCount}</h3>
          <span className="text-[11.5px] text-on-surface-variant font-medium">Sesi UTS/UAS</span>
        </div>
      </Link>
    </section>
  )
}
