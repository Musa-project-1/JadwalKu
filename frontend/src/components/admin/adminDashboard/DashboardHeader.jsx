import { useNavigate } from 'react-router'
import { Icon } from '../../Icon'
import { Button } from '../../Button'
import { deriveTahunAjaran } from '../../../lib/publishHelpers'
import { getGreetingData, formatLongDate } from '../../../lib/scheduleUtils'

export function DashboardHeader({
  onOpenDocs,
  counts,
}) {
  const navigate = useNavigate()
  const greeting = getGreetingData()

  const metricItems = [
    {
      to: '/admin/prodi',
      label: 'Prodi',
      count: counts.prodi,
      icon: 'school',
      iconClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
      pillClass: 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/25 hover:border-emerald-500/40',
      textClass: 'text-emerald-700 dark:text-emerald-300',
      title: 'Total Program Studi Aktif',
    },
    {
      to: '/admin/mata-kuliah',
      label: 'MK',
      count: counts.mk,
      icon: 'menu_book',
      iconClass: 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40',
      pillClass: 'bg-sky-500/5 hover:bg-sky-500/10 border-sky-500/25 hover:border-sky-500/40',
      textClass: 'text-sky-700 dark:text-sky-300',
      title: 'Total Master Mata Kuliah',
    },
    {
      to: '/admin/jadwal',
      label: 'Jadwal',
      count: counts.jadwal,
      icon: 'calendar_month',
      iconClass: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40',
      pillClass: 'bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/25 hover:border-purple-500/40',
      textClass: 'text-purple-700 dark:text-purple-300',
      title: 'Total Sesi Jadwal Kuliah',
    },
    {
      to: '/admin/ujian',
      label: 'Ujian',
      count: counts.ujian,
      icon: 'event_note',
      iconClass: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
      pillClass: 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/25 hover:border-amber-500/40',
      textClass: 'text-amber-700 dark:text-amber-300',
      title: 'Total Jadwal Ujian (UTS/UAS)',
    },
  ]

  return (
    <header className="relative overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 tablet:px-5 tablet:py-3.5 shadow-level-1 flex flex-col tablet:flex-row tablet:items-center tablet:justify-between gap-4 w-full shrink-0">
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
      {/* Kolom Kiri: Greeting + Meta Badges */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${greeting.iconBg} shadow-2xs border border-primary/20`}
          aria-hidden="true"
        >
          <Icon name={greeting.icon} size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-headline-lg-mobile tablet:text-headline-lg leading-tight tracking-tight text-on-surface whitespace-nowrap">
              {greeting.text}, Admin!
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-label-caps font-bold text-primary shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Konsol Utama</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-label-caps font-bold text-primary font-mono shadow-2xs">
              TA {deriveTahunAjaran()}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-body-xs font-medium text-on-surface-variant truncate">
            <span>{formatLongDate(new Date(), 'id')}</span>
            <span className="hidden tablet:inline text-outline-variant">•</span>
            <span className="hidden tablet:inline truncate">Pusat kendali kurikulum, jadwal & ujian kampus</span>
          </div>
        </div>
      </div>

      {/* Kolom Kanan: 4 Metric Pills + Aksi Panduan */}
      <div className="flex items-center gap-2 shrink-0 w-full tablet:w-auto flex-wrap tablet:flex-nowrap justify-between tablet:justify-end">
        <div className="grid grid-cols-4 gap-2 w-full tablet:w-auto tablet:flex tablet:items-center">
          {metricItems.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={() => navigate(m.to)}
              className={`flex flex-col desktop:flex-row items-center desktop:justify-start gap-1 desktop:gap-2 rounded-xl border ${m.pillClass} px-1.5 desktop:px-3 py-1.5 shadow-2xs cursor-pointer group transition-all`}
              title={m.title}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${m.iconClass} font-bold shrink-0 border`}>
                <Icon name={m.icon} size={15} />
              </span>
              <div className="text-center desktop:text-left min-w-0">
                <p className="text-body-sm font-bold text-on-surface leading-none truncate">
                  {m.count === null || m.count === undefined ? (
                    <span className="inline-block h-3.5 w-6 rounded-sm bg-surface-container-high animate-pulse" />
                  ) : (
                    m.count
                  )}
                </p>
                <p className={`text-[10px] font-bold ${m.textClass} uppercase tracking-wider leading-none mt-1 truncate`}>
                  {m.label}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Tombol Panduan Admin */}
        <Button
          variant="secondary"
          onClick={onOpenDocs}
          className="hidden desktop:inline-flex rounded-xl px-3 py-1.5 font-bold shadow-2xs cursor-pointer text-body-xs shrink-0 border border-outline-variant/30 hover:border-primary/40"
          title="Buka Panduan Administrator"
        >
          <Icon name="menu_book" size={15} className="mr-1 text-primary" />
          <span>Panduan</span>
        </Button>
      </div>
    </header>
  )
}

