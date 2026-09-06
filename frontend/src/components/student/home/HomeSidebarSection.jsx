import { Icon } from '../../Icon'

export function HomeSidebarSection({
  dailyNote,
  handleNoteChange,
  tasks,
  tomorrowEntries,
  tomorrowName,
  upcomingAgenda,
  courseMap,
  formatDay,
  t,
  navigate,
}) {
  return (
    <aside className="desktop:col-span-5 flex flex-col gap-3.5 h-full min-h-0">
      {/* 1. Catatan Hari Ini – Warm Amber Card */}
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-3.5 tablet:p-4 shadow-level-1 flex flex-col hover:border-amber-500/45 transition-all">
        <div className="flex items-center justify-between pb-2.5 border-b border-amber-500/35 mb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/35 shadow-2xs">
              <Icon name="edit_note" size={18} />
            </span>
            <h3 className="text-title-sm font-bold text-on-surface">{t ? t('home.note_title') : 'Catatan Hari Ini'}</h3>
          </div>
          <span className="text-label-caps px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/35">
            {t ? t('home.note_badge') : 'Memo'}
          </span>
        </div>
        <textarea
          id="daily-note-input"
          name="daily-note"
          aria-label="Tulis catatan cepat untuk hari ini"
          value={dailyNote}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder={t ? t('home.note_placeholder') : 'Tulis catatan penting atau target belajar hari ini...'}
          className="h-20 w-full resize-none bg-surface-container-lowest/80 dark:bg-surface-container-high/60 rounded-xl p-2.5 text-body-xs text-on-surface placeholder:text-on-surface-variant/50 border border-amber-500/30 focus:border-amber-500 focus:outline-none transition-all"
        />
      </section>

      {/* 2. Tugas Terdekat – Vibrant Violet/Purple Card */}
      <section className="rounded-2xl border border-purple-500/30 bg-purple-500/10 dark:bg-purple-500/15 p-3.5 tablet:p-4 shadow-level-1 flex flex-col hover:border-purple-500/45 transition-all">
        <div className="flex items-center justify-between pb-2.5 border-b border-purple-500/35 mb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/35 shadow-2xs">
              <Icon name="checklist" size={18} />
            </span>
            <h3 className="text-title-sm font-bold text-on-surface">{t ? t('home.tasks_title') : 'Tugas Terdekat'}</h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/tugas')}
            className="inline-flex items-center gap-1 text-label-caps font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
          >
            <span>{t ? t('action.view_all') : 'Lihat Semua'}</span>
            <Icon name="arrow_forward" size={13} />
          </button>
        </div>

        {tasks.filter((task) => !task.selesai).length === 0 ? (
          <div className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-body-xs text-on-surface-variant font-medium bg-surface-container-lowest/70 dark:bg-surface-container-high/50 rounded-xl px-3 border border-purple-500/25">
            <span className="flex items-center gap-1.5 truncate">
              <span>🎉</span>
              <span className="truncate text-on-surface-variant">{t ? t('home.tasks_empty') : 'Tidak ada tugas tertunda'}</span>
            </span>
            <button
              type="button"
              onClick={() => navigate('/tugas')}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-label-caps font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <Icon name="add" size={13} />
              <span>{t ? t('home.tasks_create') : 'Buat Tugas'}</span>
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {tasks
              .filter((task) => !task.selesai)
              .slice(0, 2)
              .map((task) => (
                <li
                  key={task.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate('/tugas')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/tugas') } }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest/80 dark:bg-surface-container-high/70 hover:bg-purple-500/10 cursor-pointer transition-all border border-purple-500/30 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="truncate text-body-xs font-bold text-on-surface">{task.judul}</p>
                    <p className="text-label-caps text-on-surface-variant font-medium flex items-center gap-1 mt-0.5">
                      <Icon name="schedule" size={11} className="text-purple-500" />
                      <span>{task.kodeMK ? `${task.kodeMK} • ` : ''}{task.deadline}</span>
                    </p>
                  </div>
                  <span className="shrink-0 text-label-caps uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shadow-2xs">
                    {task.prioritas}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>

      {/* 3. Jadwal Besok – Vibrant Blue Card */}
      <section className="rounded-2xl border border-blue-500/30 bg-blue-500/10 dark:bg-blue-500/15 p-3.5 tablet:p-4 shadow-level-1 flex flex-col justify-between hover:border-blue-500/45 transition-all">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-blue-500/35 mb-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/35 shadow-2xs">
                <Icon name="next_plan" size={18} />
              </span>
              <h3 className="text-title-sm font-bold text-on-surface">
                {t ? t('home.tomorrow_title', { day: formatDay ? formatDay(tomorrowName) : tomorrowName }) : `Jadwal Besok (${tomorrowName})`}
              </h3>
            </div>
            <span className="text-label-caps font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/35 shadow-2xs">
              {t ? t('class.session_count', { count: tomorrowEntries.length }) : `${tomorrowEntries.length} Sesi`}
            </span>
          </div>

          {tomorrowEntries.length === 0 ? (
            <div className="py-3 text-center text-body-xs text-on-surface-variant font-medium space-y-1 bg-surface-container-lowest/70 dark:bg-surface-container-high/50 rounded-xl p-3 border border-blue-500/25">
              <Icon name="beach_access" size={22} className="mx-auto text-emerald-500" />
              <p className="font-semibold text-on-surface">
                {t ? t('home.tomorrow_empty', { day: formatDay ? formatDay(tomorrowName) : tomorrowName }) : `Tidak ada perkuliahan besok (${tomorrowName})`}
              </p>
              <p className="text-label-caps text-on-surface-variant/80">
                {t ? t('home.tomorrow_empty_sub') : 'Waktu yang baik untuk istirahat & belajar mandiri.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tomorrowEntries.map((item) => {
                const course = courseMap.get(item.kodeMK)
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => navigate('/jadwal', { state: { openKodeMK: item.kodeMK } })}
                    className="w-full text-left p-2.5 rounded-xl bg-surface-container-lowest/80 dark:bg-surface-container-high/70 hover:bg-blue-500/10 border border-blue-500/30 hover:border-blue-500/55 transition-all cursor-pointer shadow-2xs group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="inline-flex items-center rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 px-2 py-0.5 font-mono text-label-caps font-extrabold tracking-wider border border-blue-500/35 shadow-2xs">
                        {item.kodeMK}
                      </span>
                      <span className="text-label-caps font-semibold text-on-surface-variant flex items-center gap-1">
                        <Icon name="schedule" size={12} className="text-blue-500" />
                        <span>{item.jamMulai} - {item.jamSelesai}</span>
                      </span>
                    </div>
                    <p className="text-body-xs font-bold text-on-surface line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {course?.namaMK || item.kodeMK}
                    </p>
                    <div className="flex items-center justify-between text-body-xs text-on-surface-variant mt-1 font-medium gap-2">
                      <span className="flex-1 min-w-0 truncate text-on-surface-variant/90">{course?.dosen || 'Dosen Pengampu'}</span>
                      <span className="shrink-0 font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30 text-label-caps">
                        {item.ruang || 'Online'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {upcomingAgenda.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-blue-500/25 flex items-center gap-2 text-label-caps text-on-surface-variant font-medium truncate">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/35">
              <Icon name="celebration" size={13} />
            </span>
            <span className="truncate">
              {upcomingAgenda[0].nama} ({upcomingAgenda[0].tanggal})
            </span>
          </div>
        )}
      </section>
    </aside>
  )
}
