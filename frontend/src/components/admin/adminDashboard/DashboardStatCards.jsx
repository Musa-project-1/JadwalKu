import { Link } from 'react-router-dom'
import { Icon } from '../../Icon'

// Menggunakan token status-kelas yang dark-mode aware (bukan warna Tailwind statis)
const STAT_ITEMS = [
  {
    to: '/admin/pengaturan-akademik',
    key: 'prodi',
    label: 'Prodi Aktif',
    sublabel: 'Program Studi',
    icon: 'school',
    iconClass: 'bg-status-k1-bg text-status-k1 border-status-k1-border',
    accentClass: 'bg-status-k1',
  },
  {
    to: '/admin/mata-kuliah',
    key: 'mk',
    label: 'Mata Kuliah',
    sublabel: 'Master MK',
    icon: 'menu_book',
    iconClass: 'bg-status-k2-bg text-status-k2 border-status-k2-border',
    accentClass: 'bg-status-k2',
  },
  {
    to: '/admin/jadwal',
    key: 'jadwal',
    label: 'Sesi Jadwal',
    sublabel: 'Sesi Kuliah',
    icon: 'calendar_month',
    iconClass: 'bg-status-hb-bg text-status-hb border-status-hb-border',
    accentClass: 'bg-status-hb',
  },
  {
    to: '/admin/ujian',
    key: 'ujian',
    label: 'Jadwal Ujian',
    sublabel: 'Sesi UTS/UAS',
    icon: 'event_note',
    iconClass: 'bg-status-gbk-bg text-status-gbk border-status-gbk-border',
    accentClass: 'bg-status-gbk',
  },
]

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
  const counts = {
    prodi: loadingProdi ? null : programsCount,
    mk: loadingCourses ? null : coursesCount,
    jadwal: loadingSchedules ? null : schedulesCount,
    ujian: loadingExams ? null : examsCount,
  }

  return (
    <section
      className="shrink-0 grid grid-cols-2 desktop:grid-cols-4 gap-3 tablet:gap-4 items-stretch"
      aria-label="Statistik Sistem"
    >
      {STAT_ITEMS.map((item) => (
        <Link
          key={item.key}
          to={item.to}
          className="group relative overflow-hidden rounded-2xl bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/20 p-4 tablet:p-5 shadow-level-1 hover:shadow-level-2 transition-all flex flex-col justify-between"
        >
          {/* Accent bar atas — tipis 2px, muncul saat hover */}
          <div
            className={`absolute top-0 inset-x-0 h-[2px] ${item.accentClass} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
          />

          {/* Label + icon */}
          <div className="flex items-center justify-between gap-1">
            <p className="text-label-caps font-bold text-on-surface-variant tracking-wider truncate">
              {item.label}
            </p>
            <div
              className={`flex h-8 w-8 tablet:h-9 tablet:w-9 shrink-0 items-center justify-center rounded-xl border shadow-level-1 group-hover:scale-105 transition-transform ${item.iconClass}`}
            >
              <Icon name={item.icon} size={18} />
            </div>
          </div>

          {/* Angka + sublabel */}
          <div className="flex items-baseline gap-2 mt-3">
            <h3 className="text-headline-lg-mobile tablet:text-headline-lg font-extrabold text-on-surface tracking-tight">
              {counts[item.key] === null ? (
                <span className="inline-block h-6 w-10 rounded-lg bg-surface-container-high animate-pulse" />
              ) : (
                counts[item.key]
              )}
            </h3>
            <span className="text-label-caps text-on-surface-variant font-semibold">
              {item.sublabel}
            </span>
          </div>
        </Link>
      ))}
    </section>
  )
}
