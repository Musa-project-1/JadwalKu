import { useNavigate } from 'react-router-dom'
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
      iconClass: 'bg-status-k1-bg text-status-k1 border-status-k1-border/50',
      borderHover: 'hover:border-status-k1',
      textClass: 'text-status-k1',
      title: 'Total Program Studi Aktif',
    },
    {
      to: '/admin/mata-kuliah',
      label: 'MK',
      count: counts.mk,
      icon: 'menu_book',
      iconClass: 'bg-status-k2-bg text-status-k2 border-status-k2-border/50',
      borderHover: 'hover:border-status-k2',
      textClass: 'text-status-k2',
      title: 'Total Master Mata Kuliah',
    },
    {
      to: '/admin/jadwal',
      label: 'Jadwal',
      count: counts.jadwal,
      icon: 'calendar_month',
      iconClass: 'bg-status-hb-bg text-status-hb border-status-hb-border/50',
      borderHover: 'hover:border-status-hb',
      textClass: 'text-status-hb',
      title: 'Total Sesi Jadwal Kuliah',
    },
    {
      to: '/admin/ujian',
      label: 'Ujian',
      count: counts.ujian,
      icon: 'event_note',
      iconClass: 'bg-status-gbk-bg text-status-gbk border-status-gbk-border/50',
      borderHover: 'hover:border-status-gbk',
      textClass: 'text-status-gbk',
      title: 'Total Jadwal Ujian (UTS/UAS)',
    },
  ]

  return (
    <header className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 tablet:px-5 tablet:py-3.5 shadow-level-1 flex flex-col tablet:flex-row tablet:items-center tablet:justify-between gap-4 w-full shrink-0">
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
              className={`flex items-center justify-center desktop:justify-start gap-2 rounded-xl bg-surface-container-low dark:bg-surface-container border border-outline-variant/30 px-2.5 tablet:px-3 py-1.5 shadow-2xs cursor-pointer group ${m.borderHover} transition-all`}
              title={m.title}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${m.iconClass} font-bold shrink-0 border`}>
                <Icon name={m.icon} size={15} />
              </span>
              <div className="text-left min-w-0">
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

