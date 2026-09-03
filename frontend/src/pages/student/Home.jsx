import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../hooks/useApp'
import { useFirestore } from '../../hooks/useFirestore'
import { useTasks } from '../../hooks/useTasks'
import { Icon } from '../../components/Icon'
import { NextClassCard } from '../../components/NextClassCard'
import { EmptyState } from '../../components/EmptyState'
import { Skeleton } from '../../components/Skeleton'
import { sampleSchedule, sampleCourses } from '../../data/sampleSchedule'
import { firebaseReady } from '../../lib/firebaseClient'
import {
  formatCountdown,
  formatLongDate,
  formatRuang,
  getClassLiveState,
  getGreetingData,
  getTodayName,
  sortByTime,
} from '../../lib/scheduleUtils'

import { expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'
import { useCustomSchedule } from '../../hooks/useCustomSchedule'
import { AnnouncementBanner } from '../../components/student/AnnouncementBanner'
import { RoomLocationModal } from '../../components/student/RoomLocationModal'

function currentMinuteOfDay() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}
function getDailyNote() {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const raw = localStorage.getItem('jadwal-kampus:dailyNotes')
    if (!raw) return ''
    const obj = JSON.parse(raw)
    return obj[today] || ''
  } catch { return '' }
}
function saveDailyNote(v) {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const raw = localStorage.getItem('jadwal-kampus:dailyNotes')
    const obj = raw ? JSON.parse(raw) : {}
    obj[today] = v
    localStorage.setItem('jadwal-kampus:dailyNotes', JSON.stringify(obj))
  } catch {}
}

export default function Home() {
  const navigate = useNavigate()
  const { fakultasId, program, semester, t, formatDay, language } = useApp()
  const { tasks } = useTasks()
  const { isCustomMode, customScheduleIds } = useCustomSchedule()
  const todayName = getTodayName()
  const [roomModalTarget, setRoomModalTarget] = useState(null)

  const { data: settingsDocs } = useFirestore('settings')

  const calDoc = useMemo(
    () => settingsDocs.find((d) => d.id === 'academicCalendar'),
    [settingsDocs],
  )

  const expectedTA = useMemo(
    () => expectedTahunAjaranForSemester(semester, new Date(), calDoc),
    [semester, calDoc],
  )

  const needsTaMigration = useMemo(() => {
    const savedTA = getItem(STORAGE_KEYS.tahunAjaran, null)
    return savedTA && savedTA !== expectedTA
  }, [expectedTA])

  const { data: jadwal, loading, error: jadwalError } = useFirestore('jadwal', [
    ['prodi', '==', program ?? ''],
    ['semester', '==', Number(semester) || 0],
    ['tahunAjaran', '==', expectedTA || ''],
    ['status', '==', 'published'],
  ])
  const { data: allPublishedJadwal } = useFirestore(isCustomMode ? 'jadwal' : '__noop__', isCustomMode ? [['status', '==', 'published']] : [])
  const { data: mataKuliah } = useFirestore('mataKuliah')

  const useSample = !firebaseReady
  const scheduleSource = useMemo(() => {
    const byFakultas = (e) => {
      if (!e.fakultasId) return true
      if (!fakultasId) return true
      return String(e.fakultasId) === String(fakultasId)
    }
    if (loading) return []
    if (isCustomMode) {
      const pool = allPublishedJadwal.length > 0 ? allPublishedJadwal : sampleSchedule
      const customSet = new Set(customScheduleIds)
      return pool.filter((e) => customSet.has(e.id) && byFakultas(e))
    }
    if (jadwal.length > 0) return jadwal.filter(byFakultas)
    if (!useSample) return []
    return sampleSchedule.filter(
      (e) => e.prodi === program && e.semester === Number(semester),
    )
  }, [loading, isCustomMode, allPublishedJadwal, customScheduleIds, jadwal, useSample, program, semester, fakultasId])

  const courseMap = useMemo(() => {
    const source = mataKuliah.length > 0 ? mataKuliah : useSample ? sampleCourses : []
    return new Map(source.map((c) => [c.kodeMK, c]))
  }, [mataKuliah, useSample])

  const todayEntries = useMemo(
    () => sortByTime(scheduleSource.filter((e) => e.hari === todayName)),
    [scheduleSource, todayName],
  )

  const DAYS_LIST = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const todayIndex = new Date().getDay()
  const tomorrowName = DAYS_LIST[(todayIndex + 1) % 7]
  const tomorrowEntries = useMemo(
    () => sortByTime(scheduleSource.filter((e) => e.hari === tomorrowName)),
    [scheduleSource, tomorrowName],
  )

  const upcomingAgenda = useMemo(() => {
    const events = calDoc?.events || []
    if (!Array.isArray(events) || events.length === 0) return []
    const todayStr = new Date().toISOString().slice(0, 10)
    return events
      .filter((e) => (e.tanggalSelesai || e.tanggalMulai || '') >= todayStr)
      .sort((a, b) => (a.tanggalMulai || '').localeCompare(b.tanggalMulai || ''))
      .slice(0, 3)
  }, [calDoc])

  const [nowMinutes, setNowMinutes] = useState(() => currentMinuteOfDay())
  useEffect(() => {
    const id = setInterval(() => setNowMinutes(currentMinuteOfDay()), 15_000)
    return () => clearInterval(id)
  }, [])

  const liveClassState = useMemo(() => {
    return getClassLiveState(todayEntries, nowMinutes)
  }, [todayEntries, nowMinutes])

  const nextEntries = useMemo(() => {
    if (todayEntries.length === 0) return []
    const sorted = sortByTime(todayEntries)
    const idx = liveClassState.entry ? sorted.findIndex((e) => e.id === liveClassState.entry.id) : -1
    if (idx >= 0) return sorted.slice(idx + 1, idx + 4)
    if (liveClassState.status === 'finished' || liveClassState.status === 'empty') return []
    if (idx === -1 && sorted.length > 1) return sorted.slice(1, 4)
    return []
  }, [todayEntries, liveClassState])

  const displayedCount = todayEntries.length === 0 ? 0 : 1 + nextEntries.length
  const hasMoreToday = todayEntries.length > displayedCount

  const dataTA = expectedTA

  const activeEntry = liveClassState.entry
  const activeCourse = activeEntry ? courseMap.get(activeEntry.kodeMK) : null
  const countdownText =
    liveClassState.status === 'upcoming' && liveClassState.minutesToStart != null
      ? formatCountdown(liveClassState.minutesToStart)
      : null

  const [dailyNote, setDailyNote] = useState(() => getDailyNote())
  function handleNoteChange(value) {
    setDailyNote(value)
    saveDailyNote(value)
  }

  const stats = useMemo(() => {
    const sksByKode = new Map()
    scheduleSource.forEach((e) => {
      if (!sksByKode.has(e.kodeMK)) {
        const c = courseMap.get(e.kodeMK)
        sksByKode.set(e.kodeMK, Number(c?.sks) || 2)
      }
    })
    const totalSks = [...sksByKode.values()].reduce((sum, sks) => sum + sks, 0)
    const openTasks = tasks.filter((t) => !t.selesai).length
    return {
      totalSks,
      totalKelas: scheduleSource.length,
      tugasOpen: openTasks,
    }
  }, [scheduleSource, tasks, courseMap])

  const rawGreeting = getGreetingData()
  const greeting = useMemo(() => {
    if (language === 'en') {
      const lower = (rawGreeting.text || '').toLowerCase()
      let enText = 'Good Morning'
      if (lower.includes('siang')) enText = 'Good Afternoon'
      else if (lower.includes('sore')) enText = 'Good Evening'
      else if (lower.includes('malam')) enText = 'Good Night'
      return { ...rawGreeting, text: enText }
    }
    return rawGreeting
  }, [rawGreeting, language])

  return (
    <div className="flex flex-col gap-4 w-full max-w-full overflow-x-hidden min-h-0 animate-fade-in">
      {/* ── 1. Header Banner Greeting & Summary ── */}
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
                  <span>{t ? t('home.custom_schedule', { count: scheduleSource.length }) : `Jadwal Kustom (${scheduleSource.length} MK)`}</span>
                </button>
              ) : program ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-label-caps font-bold text-primary shadow-2xs">
                  <Icon name="school" size={13} className="text-primary shrink-0" />
                  <span>{program} · Sem. {semester}{dataTA ? ` · TA ${dataTA}` : ''}</span>
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
          <div className="grid grid-cols-3 gap-2 w-full tablet:w-auto tablet:flex tablet:items-center">
            <button
              type="button"
              onClick={() => navigate('/jadwal')}
              className="flex items-center justify-center desktop:justify-start gap-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container border border-status-k1-border/40 px-3 py-1.5 shadow-2xs cursor-pointer group hover:border-status-k1 transition-all"
              title="Total SKS Semester Ini"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-status-k1-bg text-status-k1 font-bold shrink-0 border border-status-k1-border/50">
                <Icon name="menu_book" size={16} />
              </span>
              <div className="text-left">
                <p className="text-body-sm font-bold text-on-surface leading-none">{stats.totalSks}</p>
                <p className="text-label-caps font-bold text-status-k1 uppercase tracking-wide leading-none mt-1">{t ? t('home.metric_sks') : 'SKS'}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/jadwal')}
              className="flex items-center justify-center desktop:justify-start gap-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container border border-status-k2-border/40 px-3 py-1.5 shadow-2xs cursor-pointer group hover:border-status-k2 transition-all"
              title="Total Sesi Kelas Mingguan"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-status-k2-bg text-status-k2 font-bold shrink-0 border border-status-k2-border/50">
                <Icon name="calendar_month" size={16} />
              </span>
              <div className="text-left">
                <p className="text-body-sm font-bold text-on-surface leading-none">{stats.totalKelas}</p>
                <p className="text-label-caps font-bold text-status-k2 uppercase tracking-wide leading-none mt-1">{t ? t('home.metric_classes') : 'Kelas'}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/tugas')}
              className="flex items-center justify-center desktop:justify-start gap-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container border border-status-hb-border/40 px-3 py-1.5 shadow-2xs cursor-pointer group hover:border-status-hb transition-all"
              title="Tugas Tertunda"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-status-hb-bg text-status-hb font-bold shrink-0 border border-status-hb-border/50">
                <Icon name="assignment_late" size={16} />
              </span>
              <div className="text-left">
                <p className="text-body-sm font-bold text-on-surface leading-none">{stats.tugasOpen}</p>
                <p className="text-label-caps font-bold text-status-hb uppercase tracking-wide leading-none mt-1">{t ? t('home.metric_tasks') : 'Tugas'}</p>
              </div>
            </button>
          </div>
        </div>
      </header>

      {needsTaMigration && (
        <div className="rounded-2xl border border-status-gbk-border bg-status-gbk-bg px-4 py-2.5 flex items-center justify-between gap-3">
          <p className="text-body-xs font-semibold text-status-gbk">
            {t ? t('home.sync_banner', { semester, ta: expectedTA }) : `Tahun ajaran berubah — jadwal semester ${semester} sekarang TA ${expectedTA}. Tap untuk sinkron.`}
          </p>
          <button type="button" onClick={() => { setItem(STORAGE_KEYS.tahunAjaran, expectedTA); window.location.reload() }} className="shrink-0 rounded-full bg-status-gbk text-white px-3 py-1 text-body-xs font-bold hover:opacity-90 cursor-pointer">
            {t ? t('action.sync') : 'Sinkron'}
          </button>
        </div>
      )}

      {jadwalError && (
        <div role="status" className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-body-sm font-semibold text-error">Gagal memuat jadwal: {String(jadwalError.message || jadwalError.code || jadwalError)}</div>
      )}

      <AnnouncementBanner currentProgram={program} currentSemester={semester} />

      {/* ── 2. Grid Dashboard 2-Kolom Seimbang ── */}
      <div className="grid grid-cols-1 desktop:grid-cols-12 gap-4 desktop:items-stretch">
        {/* Kolom Kiri: Jadwal Kuliah Hari Ini */}
        <section className="desktop:col-span-7 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-4 tablet:p-5 shadow-level-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15 mb-3.5 gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
                  <Icon name="event_available" size={18} />
                </span>
                <h3 className="text-title-sm tablet:text-title-md font-bold text-on-surface truncate">
                  {t ? t('class.today_schedule_title', { day: formatDay ? formatDay(todayName) : todayName }) : `Jadwal Kuliah Hari Ini (${todayName})`}
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

        {/* Kolom Kanan: 3 Widget Berwarna Harmonis */}
        <aside className="desktop:col-span-5 flex flex-col gap-3.5 h-full min-h-0">
          {/* 1. Catatan Hari Ini — Warm Amber Card */}
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

          {/* 2. Tugas Terdekat — Vibrant Violet/Purple Card */}
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

            {tasks.filter((t) => !t.selesai).length === 0 ? (
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
                  .filter((t) => !t.selesai)
                  .slice(0, 2)
                  .map((t) => (
                    <li
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate('/tugas')}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/tugas') } }}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest/80 dark:bg-surface-container-high/70 hover:bg-purple-500/10 cursor-pointer transition-all border border-purple-500/30 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="truncate text-body-xs font-bold text-on-surface">{t.judul}</p>
                        <p className="text-label-caps text-on-surface-variant font-medium flex items-center gap-1 mt-0.5">
                          <Icon name="schedule" size={11} className="text-purple-500" />
                          <span>{t.kodeMK ? `${t.kodeMK} • ` : ''}{t.deadline}</span>
                        </p>
                      </div>
                      <span className="shrink-0 text-label-caps uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shadow-2xs">
                        {t.prioritas}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          {/* 3. Jadwal Besok — Vibrant Blue Card */}
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
                  Agenda: <strong className="text-on-surface font-bold">{upcomingAgenda[0].nama}</strong> ({upcomingAgenda[0].tanggalMulai})
                </span>
              </div>
            )}
          </section>
        </aside>
      </div>

      {roomModalTarget && (
        <RoomLocationModal
          entry={roomModalTarget.entry}
          course={roomModalTarget.course}
          onClose={() => setRoomModalTarget(null)}
        />
      )}
    </div>
  )
}
