import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../hooks/useApp'
import { useFirestore } from '../../hooks/useFirestore'
import { useTasks } from '../../hooks/useTasks'
import { Icon } from '../../components/Icon'
import { NextClassCard } from '../../components/NextClassCard'
import { ClassTimelineItem } from '../../components/ClassTimelineItem'
import { EmptyState } from '../../components/EmptyState'
import { Skeleton } from '../../components/Skeleton'
import { sampleSchedule, sampleCourses } from '../../data/sampleSchedule'
import { firebaseReady } from '../../lib/firebaseClient'
import {
  findNextClass,
  formatCountdown,
  formatLongDate,
  getGreeting,
  getTodayName,
  minutesUntil,
  sortByTime,
} from '../../lib/scheduleUtils'

import { expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'

export default function Home() {
  const navigate = useNavigate()
  const { program, semester } = useApp()
  const { tasks } = useTasks()
  const todayName = getTodayName()

  const { data: jadwal, loading } = useFirestore('jadwal', [
    ['prodi', '==', program ?? ''],
    ['semester', '==', Number(semester) || 0],
    ['status', '==', 'published'],
  ])
  const { data: mataKuliah } = useFirestore('mataKuliah')

  // Fallback: kalau Firebase belum dikonfigurasi (dev tanpa .env),
  // pakai sample data supaya UI tetap bisa dites.
  const useSample = !firebaseReady
  const scheduleSource = useMemo(() => {
    if (loading) return []
    if (jadwal.length > 0) return jadwal
    if (!useSample) return []
    return sampleSchedule.filter(
      (e) => e.prodi === program && e.semester === Number(semester),
    )
  }, [loading, jadwal, useSample, program, semester])

  const courseMap = useMemo(() => {
    const source = mataKuliah.length > 0 ? mataKuliah : useSample ? sampleCourses : []
    return new Map(source.map((c) => [c.kodeMK, c]))
  }, [mataKuliah, useSample])

  const todayEntries = useMemo(
    () => sortByTime(scheduleSource.filter((e) => e.hari === todayName)),
    [scheduleSource, todayName],
  )

  const next = useMemo(() => findNextClass(todayEntries), [todayEntries])
  // TA ditampilkan = TA di mana semester berjalan berada (via logika
  // tahunAjaran), bukan dari data yang mungkin basi / beragam.
  const dataTA = expectedTahunAjaranForSemester(semester)
  const [nowMinutes, setNowMinutes] = useState(() => currentMinuteOfDay())

  // Tick tiap 30 detik untuk countdown "kelas berikutnya".
  useEffect(() => {
    const id = setInterval(() => setNowMinutes(currentMinuteOfDay()), 30_000)
    return () => clearInterval(id)
  }, [])

  const nextCourse = next ? courseMap.get(next.kodeMK) : null
  const countdownText = next ? formatCountdown(minutesUntil(next.jamMulai)) : null
  const countdownMins = next ? minutesUntil(next.jamMulai) : Infinity
  const countdownUrgent = countdownMins > 0 && countdownMins <= 15

  const [dailyNote, setDailyNote] = useState(() => getDailyNote())
  function handleNoteChange(value) {
    setDailyNote(value)
    saveDailyNote(value)
  }

  const stats = useMemo(() => {
    const sksSet = new Set(scheduleSource.map((e) => e.kodeMK))
    const openTasks = tasks.filter((t) => !t.selesai).length
    return {
      totalSks: sksSet.size * 3,
      totalKelas: scheduleSource.length,
      tugasOpen: openTasks,
    }
  }, [scheduleSource, tasks])

  return (
    <div className="grid grid-cols-1 gap-lg desktop:grid-cols-3">
      <div className="space-y-lg desktop:col-span-2">
        <header className="mb-lg">
          <h2 className="text-display text-on-surface">{getGreeting()}!</h2>
          <p className="mt-xs text-body-lg text-on-surface-variant">
            {formatLongDate()}
          </p>
          {program && (
            <span className="mt-xs inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-label-caps text-primary">
              <Icon name="school" size={14} />
              {program} · Semester {semester}{dataTA ? ` · TA ${dataTA}` : ''}
            </span>
          )}
        </header>

        {loading ? (
          <Skeleton className="h-44 rounded-schedule" />
        ) : (
          next && (
            <section>
              <div className="mb-md flex items-center justify-between">
                <h3 className="text-label-caps uppercase text-on-surface-variant">Kelas Berikutnya</h3>
                <span
                  className={`flex items-center gap-xs rounded-full px-3 py-1 text-body-sm font-medium ${
                    countdownUrgent
                      ? 'animate-[soft-pulse_1.6s_ease-in-out_infinite] bg-error text-on-error'
                      : 'bg-error-container text-error'
                  }`}
                >
                  <Icon name="timer" size={16} />
                  <span
                    key={countdownText}
                    className="inline-block animate-[fade-up_180ms_var(--ease-standard)]"
                  >
                    {countdownText}
                  </span>
                </span>
              </div>
              <NextClassCard
                entry={next}
                course={nextCourse}
                countdownText={countdownText}
                urgent={countdownUrgent}
              />
            </section>
          )
        )}

        <section>
          <h3 className="mb-md text-label-caps uppercase text-on-surface">
            Jadwal Hari Ini - {todayName}
          </h3>
          {loading ? (
            <div className="space-y-sm">
              <Skeleton className="h-24 rounded-schedule" />
              <Skeleton className="h-24 rounded-schedule" />
              <Skeleton className="h-24 rounded-schedule" />
            </div>
          ) : todayEntries.length === 0 ? (
            <EmptyState
              icon="event_busy"
              title="Tidak ada kelas hari ini"
              description="Nikmati harimu, atau cek jadwal mingguan untuk kelas berikutnya."
            />
          ) : (
            <div className="relative pl-6">
              {/* Vertical timeline line */}
              <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-outline-variant/30" />
              {todayEntries.map((entry, i) => {
                const startM = minutesUntil(entry.jamMulai)
                const prevEnded =
                  i === 0 || minutesUntil(todayEntries[i - 1].jamSelesai) <= 0
                const showNow = startM > 0 && prevEnded
                return (
                  <ClassTimelineItem
                    key={entry.id}
                    entry={entry}
                    course={courseMap.get(entry.kodeMK)}
                    index={i}
                    isPast={minutesUntil(entry.jamSelesai) <= 0}
                    showNowBefore={showNow}
                    nowLabel={`${String(Math.floor(nowMinutes / 60)).padStart(2, '0')}:${String(nowMinutes % 60).padStart(2, '0')}`}
                    onNoteClick={() =>
                      navigate('/jadwal', { state: { openKodeMK: entry.kodeMK } })
                    }
                  />
                )
              })}
            </div>
          )}
        </section>
      </div>

      <aside className="desktop:col-span-1 space-y-md">
        <section className="flex flex-col rounded-3xl bg-[#FFE4D6] border-l-4 border-[#D97706] p-md dark:bg-warning-container/20 dark:border-[#D97706]/40 tablet:p-lg">
          <h3 className="mb-md flex items-center gap-sm text-title-md text-[#92400E] dark:text-warning font-semibold">
            <Icon name="edit_note" className="text-[#D97706]" />
            Catatan Hari Ini
          </h3>
          <textarea
            value={dailyNote}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Tulis catatan cepat untuk hari ini..."
            className="min-h-[160px] flex-1 resize-none bg-transparent p-0 text-body-lg text-[#92400E] dark:text-warning placeholder:text-[#92400E]/60 dark:placeholder:text-warning/60 focus:outline-none"
          />
        </section>

        {/* Mini stat chips row */}
        <section className="grid grid-cols-3 gap-sm">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary-container/30 border border-secondary-container/10 p-sm text-center">
            <Icon name="menu_book" className="text-secondary mb-1" size={20} />
            <span className="text-title-md font-bold text-on-secondary-container">{stats.totalSks}</span>
            <span className="text-[11px] text-on-secondary-container opacity-85 uppercase tracking-wide">SKS</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-info-container/30 border border-info-container/10 p-sm text-center">
            <Icon name="calendar_month" className="text-info mb-1" size={20} />
            <span className="text-title-md font-bold text-on-info-container">{stats.totalKelas}</span>
            <span className="text-[11px] text-on-info-container opacity-85 uppercase tracking-wide">Kelas</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-success-container/30 border border-success-container/10 p-sm text-center">
            <Icon name="assignment_late" className="text-success mb-1" size={20} />
            <span className="text-title-md font-bold text-on-success-container">{stats.tugasOpen}</span>
            <span className="text-[11px] text-on-success-container opacity-85 uppercase tracking-wide">Tugas</span>
          </div>
        </section>
      </aside>
    </div>
  )
}

function currentMinuteOfDay() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function dailyNoteKey() {
  const d = new Date()
  // Kunci memakai tanggal LOKAL (WIB), bukan UTC — kalau pakai UTC,
  // catatan "hari ini" baru berganti pada jam 07:00, bukan tengah malam.
  const localIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
  return `${STORAGE_KEYS.dailyNotes}:${localIso}`
}

function getDailyNote() {
  return getItem(dailyNoteKey(), '')
}

function saveDailyNote(value) {
  setItem(dailyNoteKey(), value)
}
