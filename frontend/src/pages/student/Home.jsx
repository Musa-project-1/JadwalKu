import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../hooks/useApp'
import { useFirestore } from '../../hooks/useFirestore'
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

import { deriveTahunAjaran } from '../../lib/publishHelpers'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'

export default function Home() {
  const navigate = useNavigate()
  const { program, semester } = useApp()
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
  // TA yang ditampilkan = TA milik data (bukan tanggal hari ini).
  // Ambil TA paling sering muncul; bila beragam, pilih yang terbaru —
  // jangan asal ambil entri pertama.
  const dataTA = useMemo(() => {
    const counts = new Map()
    scheduleSource.forEach((e) => {
      const t = String(e.tahunAjaran ?? '').trim()
      if (t) counts.set(t, (counts.get(t) ?? 0) + 1)
    })
    if (counts.size === 0) return deriveTahunAjaran()
    return [...counts.entries()].sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return String(b[0]).localeCompare(String(a[0]))
    })[0][0]
  }, [scheduleSource])
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
            Jadwal Hari Ini — {todayName}
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
            <div className="space-y-sm">
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

      <aside className="desktop:col-span-1">
        <section className="flex h-full min-h-[240px] flex-col rounded-3xl border border-tertiary/10 bg-tertiary-fixed/25 p-md dark:border-tertiary/10 dark:bg-tertiary-fixed/10 tablet:p-lg">
          <h3 className="mb-md flex items-center gap-sm text-title-md text-on-surface">
            <Icon name="edit_note" className="text-tertiary" />
            Catatan Hari Ini
          </h3>
          <textarea
            value={dailyNote}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Tulis catatan cepat untuk hari ini..."
            className="min-h-[160px] flex-1 resize-none bg-transparent p-0 text-body-lg text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
          />
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
