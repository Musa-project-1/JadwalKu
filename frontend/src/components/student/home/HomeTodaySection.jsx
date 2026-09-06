import { Icon } from '../../Icon'
import { Skeleton } from '../../Skeleton'
import { EmptyState } from '../../EmptyState'
import { NextClassCard } from '../../NextClassCard'
import { formatRuang } from '../../../lib/scheduleUtils'

export function HomeTodaySection({
  todayName,
  todayEntries,
  loading,
  liveClassState,
  activeCourse,
  activeEntry,
  countdownText,
  nextEntries,
  courseMap,
  hasMoreToday,
  setRoomModalTarget,
  formatDay,
  t,
  navigate,
}) {
  return (
    <section className="desktop:col-span-7 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-4 tablet:p-5 shadow-level-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15 mb-3.5 gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
              <Icon name="event_available" size={18} />
            </span>
            <h3 className="text-title-sm tablet:text-title-md font-bold text-on-surface truncate">
              {t
                ? t('class.today_schedule_title', { day: formatDay ? formatDay(todayName) : todayName })
                : `Jadwal Kuliah Hari Ini (${todayName})`}
            </h3>
          </div>
          <span className="text-label-caps font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
            {t ? t('class.session_count', { count: todayEntries.length }) : `${todayEntries.length} Sesi`}
          </span>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : todayEntries.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <EmptyState
              icon="beach_access"
              title={t ? t('class.no_classes_today') : 'Tidak ada perkuliahan hari ini'}
              description={t ? t('class.no_classes_today_sub') : 'Nikmati harimu atau cek materi untuk perkuliahan besok.'}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <NextClassCard
              liveState={liveClassState}
              course={activeCourse}
              countdownText={countdownText}
              urgent={liveClassState.urgent}
              onDetail={() =>
                activeEntry &&
                navigate('/jadwal', { state: { openKodeMK: activeEntry.kodeMK } })
              }
              onLocation={(entry, course) => setRoomModalTarget({ entry, course })}
              onViewSchedule={() => navigate('/jadwal')}
            />
            {nextEntries.map((entry, i) => {
              const c = courseMap.get(entry.kodeMK)
              const nextLabelKey = i === 0 ? 'class.next_label_0' : i === 1 ? 'class.next_label_1' : 'class.next_label_2'
              const nextLabelDefault = i === 0 ? 'Selanjutnya' : i === 1 ? 'Setelah itu' : 'Berikutnya'
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => navigate('/jadwal', { state: { openKodeMK: entry.kodeMK } })}
                  className="w-full text-left rounded-xl border border-outline-variant/20 bg-surface-container-low/60 hover:bg-surface-container-high/70 p-3 flex items-center justify-between gap-3 transition-colors cursor-pointer shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-label-caps font-bold uppercase text-primary">
                      {t ? t(nextLabelKey) : nextLabelDefault}
                    </p>
                    <p className="text-body-xs font-bold text-on-surface truncate mt-0.5">
                      {c?.namaMK ?? entry.kodeMK}
                    </p>
                    <p className="text-label-caps text-on-surface-variant flex items-center gap-1 truncate mt-0.5">
                      <Icon name="schedule" size={12} className="shrink-0 text-primary" />
                      <span>{entry.jamMulai} - {entry.jamSelesai} · {formatRuang(entry.ruang, entry.tipeKelas)}</span>
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center rounded-lg bg-surface-container-high border border-outline-variant/20 px-2 py-1 font-mono text-label-caps font-bold text-on-surface">
                    {entry.kodeMK}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer Nav Link */}
      {!loading && hasMoreToday && (
        <div className="pt-3.5 border-t border-outline-variant/15 mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/jadwal')}
            className="inline-flex items-center gap-1.5 text-body-xs font-bold text-primary hover:underline underline-offset-4 cursor-pointer"
          >
            <span>{t ? t('class.view_all_today') : 'Lihat semua jadwal hari ini'}</span>
            <Icon name="arrow_forward" size={15} />
          </button>
        </div>
      )}
      {!loading && todayEntries.length === 0 && (
        <div className="pt-3.5 border-t border-outline-variant/15 mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/jadwal')}
            className="inline-flex items-center gap-1.5 text-body-xs font-semibold text-on-surface-variant hover:text-primary hover:underline underline-offset-4 cursor-pointer"
          >
            <span>{t ? t('class.view_weekly_fallback') : 'Lihat jadwal mingguan'}</span>
            <Icon name="arrow_forward" size={15} />
          </button>
        </div>
      )}
    </section>
  )
}
