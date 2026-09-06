import { Icon } from '../../Icon'
import { formatLongDate } from '../../../lib/scheduleUtils'

export function HomeGreetingHeader({
  greeting,
  isCustomMode,
  scheduleSource,
  program,
  semester,
  dataTA,
  stats,
  language,
  t,
  navigate,
}) {
  return (
    <header className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 tablet:px-5 tablet:py-3.5 shadow-level-1 flex flex-col tablet:flex-row tablet:items-center tablet:justify-between gap-4 w-full">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${greeting.iconBg} shadow-2xs border border-primary/20`}
          aria-hidden="true"
        >
          <Icon name={greeting.icon} size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-headline-lg-mobile tablet:text-headline-lg leading-tight tracking-tight text-on-surface whitespace-nowrap">
              {greeting.text}!
            </h2>
            {isCustomMode ? (
              <button
                type="button"
                onClick={() => navigate('/jadwal')}
                className="inline-flex items-center gap-1 rounded-full bg-status-gbk-bg border border-status-gbk-border px-2.5 py-0.5 text-label-caps font-bold text-status-gbk shadow-2xs hover:opacity-85 transition-opacity cursor-pointer"
                title="Klik untuk melihat atau mengatur Jadwal Kustom"
              >
                <Icon name="star" size={13} className="text-status-gbk" />
                <span>
                  {t
                    ? t('home.custom_schedule', { count: scheduleSource.length })
                    : `Jadwal Kustom (${scheduleSource.length} MK)`}
                </span>
              </button>
            ) : program ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-label-caps font-bold text-primary shadow-2xs">
                <Icon name="school" size={13} className="text-primary shrink-0" />
                <span>
                  {program} · Sem. {semester}
                  {dataTA ? ` · TA ${dataTA}` : ''}
                </span>
              </span>
            ) : null}
          </div>
          <p className="text-body-xs font-medium text-on-surface-variant truncate mt-0.5">
            {formatLongDate(new Date(), language)}
          </p>
        </div>
      </div>

      {/* 3 Metric Pills */}
      <div className="flex items-center gap-2 shrink-0 w-full tablet:w-auto">
        <div className="grid grid-cols-3 gap-1.5 tablet:gap-2 w-full tablet:w-auto tablet:flex tablet:items-center">
          <button
            type="button"
            onClick={() => navigate('/jadwal')}
            className="flex items-center justify-center desktop:justify-start gap-2 tablet:gap-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container border border-status-k1-border/40 px-2 tablet:px-3 py-1.5 shadow-2xs cursor-pointer group hover:border-status-k1 transition-all min-w-0"
            title="Total SKS Semester Ini"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-status-k1-bg text-status-k1 font-bold shrink-0 border border-status-k1-border/50">
              <Icon name="menu_book" size={16} />
            </span>
            <div className="text-left min-w-0 flex-1">
              <p className="text-body-sm font-bold text-on-surface leading-none">{stats.totalSks}</p>
              <p className="text-[10px] tablet:text-label-caps font-bold text-status-k1 uppercase tracking-tight leading-none mt-1 truncate">
                {t ? t('home.metric_sks') : 'SKS'}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate('/jadwal')}
            className="flex items-center justify-center desktop:justify-start gap-2 tablet:gap-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container border border-status-k2-border/40 px-2 tablet:px-3 py-1.5 shadow-2xs cursor-pointer group hover:border-status-k2 transition-all min-w-0"
            title="Total Sesi Kelas Mingguan"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-status-k2-bg text-status-k2 font-bold shrink-0 border border-status-k2-border/50">
              <Icon name="calendar_month" size={16} />
            </span>
            <div className="text-left min-w-0 flex-1">
              <p className="text-body-sm font-bold text-on-surface leading-none">{stats.totalKelas}</p>
              <p className="text-[10px] tablet:text-label-caps font-bold text-status-k2 uppercase tracking-tight leading-none mt-1 truncate">
                {t ? t('home.metric_classes') : 'Kelas'}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate('/tugas')}
            className="flex items-center justify-center desktop:justify-start gap-2 tablet:gap-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container border border-status-hb-border/40 px-2 tablet:px-3 py-1.5 shadow-2xs cursor-pointer group hover:border-status-hb transition-all min-w-0"
            title="Tugas Tertunda"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-status-hb-bg text-status-hb font-bold shrink-0 border border-status-hb-border/50">
              <Icon name="assignment_late" size={16} />
            </span>
            <div className="text-left min-w-0 flex-1">
              <p className="text-body-sm font-bold text-on-surface leading-none">{stats.tugasOpen}</p>
              <p className="text-[10px] tablet:text-label-caps font-bold text-status-hb uppercase tracking-tight leading-none mt-1 truncate">
                {t ? t('home.metric_tasks') : 'Tugas'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
