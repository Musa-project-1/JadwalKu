import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../hooks/useApp'
import { useFirestore } from '../../hooks/useFirestore'
import { useTasks } from '../../hooks/useTasks'
import { Icon } from '../../components/Icon'
import { ClassCard } from '../../components/ClassCard'
import { EmptyState } from '../../components/EmptyState'
import { Skeleton } from '../../components/Skeleton'
import { sampleSchedule, sampleCourses } from '../../data/sampleSchedule'
import { firebaseReady } from '../../lib/firebaseClient'
import { DAYS } from '../../lib/uploadValidator'
import { getTodayName, sortByTime } from '../../lib/scheduleUtils'
import {
  TONE_BG_CLASSES,
  TONE_TEXT_CLASSES,
  getClassType,
} from '../../lib/classTypes'
import { deriveTahunAjaran } from '../../lib/publishHelpers'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'

const WEEK_DAYS = DAYS // Senin–Sabtu
const PX_PER_HOUR = 64

export default function WeeklySchedule() {
  const navigate = useNavigate()
  const { program, semester } = useApp()
  const todayName = getTodayName()
  const [selectedDay, setSelectedDay] = useState(todayName)
  const [detailEntry, setDetailEntry] = useState(null)
  const location = useLocation()

  // TA aktif = dari tanggal hari ini; TA lain = arsip tahun-tahun sebelumnya.
  const currentTA = deriveTahunAjaran()
  const [selectedTA, setSelectedTA] = useState(() =>
    getItem(STORAGE_KEYS.tahunAjaran, deriveTahunAjaran()),
  )

  function handleTAChange(value) {
    setSelectedTA(value)
    setItem(STORAGE_KEYS.tahunAjaran, value)
  }

  const viewingArchive = selectedTA !== currentTA

  const { data: jadwal, loading } = useFirestore('jadwal', [
    ['prodi', '==', program ?? ''],
    ['semester', '==', Number(semester) || 0],
    // TA berjalan → published; TA lampau → arsip
    viewingArchive ? ['status', '==', 'archived'] : ['status', '==', 'published'],
  ])
  // Arsip dipakai untuk mengisi daftar TA yang pernah ada di dropdown.
  const { data: archivedJadwal } = useFirestore('jadwal', [
    ['prodi', '==', program ?? ''],
    ['semester', '==', Number(semester) || 0],
    ['status', '==', 'archived'],
  ])
  const { data: mataKuliah } = useFirestore('mataKuliah')

  const useSample = !firebaseReady
  const scheduleSource = useMemo(() => {
    if (loading) return []
    const fetched = jadwal.filter(
      (e) => String(e.tahunAjaran ?? (viewingArchive ? '' : currentTA)) === selectedTA,
    )
    if (fetched.length > 0) return fetched
    if (viewingArchive) return []
    if (!useSample) return []
    return sampleSchedule.filter(
      (e) => e.prodi === program && e.semester === Number(semester),
    )
  }, [loading, jadwal, viewingArchive, selectedTA, currentTA, useSample, program, semester])

  // Daftar TA lampau (dari arsip) untuk dropdown.
  const pastTAs = useMemo(() => {
    const set = new Set()
    archivedJadwal.forEach((e) => {
      const t = String(e.tahunAjaran ?? '').trim()
      if (t && t !== currentTA) set.add(t)
    })
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [archivedJadwal, currentTA])

  // Buka panel detail otomatis saat diarahkan dari layar lain
  // (mis. tombol catatan pada timeline Home). Effect ini menyinkronkan
  // state router (location.state deep-link) ke state UI panel detail;
  // match baru tersedia setelah data jadwal selesai dimuat.
  useEffect(() => {
    const kode = location.state?.openKodeMK
    if (!kode) return undefined
    const match = scheduleSource.find((e) => e.kodeMK === kode)
    // oxlint-disable-next-line react/set-state-in-effect -- sinkronisasi deep-link router → state UI; harus menunggu data jadwal termuat.
    if (match) setDetailEntry(match)
    return () => window.history.replaceState({}, '')
  }, [location.state, scheduleSource])

  const courseMap = useMemo(() => {
    const source = mataKuliah.length > 0 ? mataKuliah : useSample ? sampleCourses : []
    return new Map(source.map((c) => [c.kodeMK, c]))
  }, [mataKuliah, useSample])

  // Deteksi bentrok per hari (hari sama + jam overlap + grup kelas sama)
  // → id dokumen yang terlibat. Grup berbeda (K1/K2, 2-A/2-B) memang paralel.
  const conflictedIds = useMemo(() => {
    const ids = new Set()
    for (const day of WEEK_DAYS) {
      const dayEntries = scheduleSource.filter((e) => e.hari === day)
      for (let i = 0; i < dayEntries.length; i += 1) {
        for (let j = i + 1; j < dayEntries.length; j += 1) {
          if (
            toMin(dayEntries[i].jamMulai) < toMin(dayEntries[j].jamSelesai) &&
            toMin(dayEntries[j].jamMulai) < toMin(dayEntries[i].jamSelesai) &&
            dayEntries[i].tipeKelas === dayEntries[j].tipeKelas &&
            String(dayEntries[i].ruang ?? '') === String(dayEntries[j].ruang ?? '')
          ) {
            ids.add(dayEntries[i].id)
            ids.add(dayEntries[j].id)
          }
        }
      }
    }
    return ids
  }, [scheduleSource])

  const dayEntries = useMemo(
    () =>
      sortByTime(scheduleSource.filter((e) => e.hari === selectedDay)),
    [scheduleSource, selectedDay],
  )

  // ── Data untuk grid kalender jam (desktop) ──
  const { data: libur } = useFirestore('libur', [])
  const holidayDates = useMemo(() => {
    const set = new Set()
    libur.forEach((l) => {
      const t = l?.tanggal
      if (!t) return
      const iso = typeof t.toDate === 'function' ? t.toDate().toISOString() : String(t)
      set.add(iso.slice(0, 10))
    })
    return set
  }, [libur])

  const [nowMinute, setNowMinute] = useState(() => currentMinuteOfDay())
  useEffect(() => {
    const id = setInterval(() => setNowMinute(currentMinuteOfDay()), 60_000)
    return () => clearInterval(id)
  }, [])

  const todayISO = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`
  }, [])

  // Tanggal Senin–Sabtu minggu berjalan
  const weekDates = useMemo(() => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    return WEEK_DAYS.map((day, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return {
        day,
        dateNum: d.getDate(),
        monthShort: d.toLocaleDateString('id-ID', { month: 'short' }),
        iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate(),
        ).padStart(2, '0')}`,
      }
    })
  }, [])

  // Rentang jam dinamis (clamp 06:00–22:00)
  const [rangeStart, rangeEnd] = useMemo(() => {
    let min = 8 * 60
    let max = 17 * 60
    scheduleSource.forEach((e) => {
      min = Math.min(min, toMin(e.jamMulai))
      max = Math.max(max, toMin(e.jamSelesai))
    })
    const startH = Math.max(6, Math.floor(min / 60))
    const endH = Math.min(22, Math.max(Math.ceil(max / 60), startH + 1))
    return [startH * 60, endH * 60]
  }, [scheduleSource])

  const hourMarks = useMemo(() => {
    const arr = []
    for (let m = rangeStart; m <= rangeEnd; m += 60) arr.push(m)
    return arr
  }, [rangeStart, rangeEnd])

  const gridHeight = ((rangeEnd - rangeStart) / 60) * PX_PER_HOUR

  function openDetail(entry) {
    setDetailEntry(entry)
  }

  return (
    <div className="space-y-lg">
      <header className="flex items-end justify-between gap-md">
        <div>
          <h2 className="text-display text-on-surface">Jadwal Mingguan</h2>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {program} · Semester {semester} · TA {selectedTA}
            {viewingArchive && ' · Arsip'}
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <select
            value={selectedTA}
            onChange={(e) => handleTAChange(e.target.value)}
            aria-label="Pilih tahun ajaran"
            className="rounded-full border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface transition-colors focus:border-primary focus:outline-none dark:bg-surface-container-high"
          >
            <option value={currentTA}>TA {currentTA}</option>
            {pastTAs.map((t) => (
              <option key={t} value={t}>
                TA {t} (arsip)
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => navigate('/bagikan')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high dark:bg-surface-container-high"
            aria-label="Bagikan jadwal"
          >
            <Icon name="ios_share" size={20} />
          </button>
        </div>
      </header>

      {/* Day tabs — mobile & tablet */}
      <div className="-mx-md flex gap-xs overflow-x-auto px-md pb-1 desktop:hidden no-scrollbar">
        {WEEK_DAYS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setSelectedDay(day)}
            className={`shrink-0 rounded-full px-4 py-2 text-body-sm font-medium transition-colors ${
              selectedDay === day
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high dark:bg-surface-container-high'
            }`}
          >
            {day}
            {day === todayName && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-error" />}
          </button>
        ))}
      </div>

      {/* Day list — mobile & tablet */}
      <div className="desktop:hidden">
        {loading ? (
          <div className="space-y-sm">
            <Skeleton className="h-24 rounded-schedule" />
            <Skeleton className="h-24 rounded-schedule" />
          </div>
        ) : dayEntries.length === 0 ? (
          <EmptyState
            icon="event_available"
            title={`Tidak ada kelas hari ${selectedDay}`}
            description="Pilih tab hari lain untuk melihat jadwal."
          />
        ) : (
          <div className="space-y-sm">
            {dayEntries.map((entry) => (
              <ClassCard
                key={entry.id}
                entry={entry}
                course={courseMap.get(entry.kodeMK)}
                conflicted={conflictedIds.has(entry.id)}
                onClick={() => openDetail(entry)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Full week calendar grid — desktop (sumbu jam, sesuai referensi) */}
      <div className="hidden desktop:block">
        {!loading && scheduleSource.length === 0 && (
          <div className="mb-md flex items-center gap-sm rounded-2xl bg-info-container/40 px-md py-sm text-body-sm text-info dark:bg-info-container/20">
            <Icon name="info" size={20} className="shrink-0" />
            {viewingArchive
              ? `Belum ada arsip jadwal ${program} · Semester ${semester} untuk TA ${selectedTA}.`
              : `Belum ada jadwal terpublikasi untuk ${program} · Semester ${semester}. Admin dapat mengunggahnya lewat Panel Admin.`}
          </div>
        )}
        <div className="overflow-x-auto no-scrollbar rounded-xl border border-outline-variant/40 bg-surface-container-lowest dark:bg-surface-container-low">
          <div className="min-w-[620px]">
            {/* Header hari */}
            <div
              className="grid"
              style={{ gridTemplateColumns: `56px repeat(${WEEK_DAYS.length}, 1fr)` }}
            >
              <div className="border-b border-outline-variant/40 p-2 text-center text-label-caps text-on-surface-variant">
                GMT+7
              </div>
              {weekDates.map(({ day, dateNum, monthShort, iso }) => {
                const isTodayCol = day === todayName && iso === todayISO
                const isHoliday = holidayDates.has(iso)
                return (
                  <div
                    key={day}
                    className={`border-b border-outline-variant/40 p-2 text-center ${
                      isHoliday ? 'opacity-60' : ''
                    }`}
                  >
                    {isTodayCol ? (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-label-caps font-medium text-primary">
                        {day}
                      </span>
                    ) : (
                      <span className="text-title-md font-medium text-on-surface">{day}</span>
                    )}
                    <div className="text-body-sm text-on-surface-variant">
                      {dateNum} {monthShort}
                      {isHoliday && (
                        <span className="ml-1 font-medium text-error">· LIBUR</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Sumbu jam + kolam event */}
            <div
              className="relative grid"
              style={{
                gridTemplateColumns: `56px repeat(${WEEK_DAYS.length}, 1fr)`,
                height: gridHeight,
              }}
            >
              {/* Kolom label jam */}
              <div className="relative border-r border-outline-variant/40">
                {hourMarks.map((m) => (
                  <span
                    key={m}
                    className="absolute right-1.5 -translate-y-1/2 text-label-caps text-on-surface-variant"
                    style={{ top: ((m - rangeStart) / 60) * PX_PER_HOUR }}
                  >
                    {String(Math.floor(m / 60)).padStart(2, '0')}:00
                  </span>
                ))}
              </div>

              {weekDates.map(({ day, iso }) => {
                const isHoliday = holidayDates.has(iso)
                const isTodayCol = day === todayName && iso === todayISO
                const entries = sortByTime(scheduleSource.filter((e) => e.hari === day))
                return (
                  <div
                    key={day}
                    className={`relative border-l border-outline-variant/40 ${
                      isHoliday ? 'holiday-stripes' : isTodayCol ? 'bg-primary/5' : ''
                    }`}
                  >
                    {/* Garis jam horizontal */}
                    {hourMarks.map((m) => (
                      <span
                        key={m}
                        className="absolute inset-x-0 border-t border-outline-variant/30"
                        style={{ top: ((m - rangeStart) / 60) * PX_PER_HOUR }}
                      />
                    ))}

                    {/* Blok kelas diposisikan berdasarkan jam */}
                    {!isHoliday &&
                      entries.map((entry) => {
                        const start = toMin(entry.jamMulai)
                        const end = toMin(entry.jamSelesai)
                        const top = ((start - rangeStart) / 60) * PX_PER_HOUR
                        const height = Math.max(
                          ((end - start) / 60) * PX_PER_HOUR - 4,
                          30,
                        )
                        const course = courseMap.get(entry.kodeMK)
                        const conflicted = conflictedIds.has(entry.id)
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => openDetail(entry)}
                            style={{ top: top + 2, height }}
                            className={`absolute inset-x-1 z-10 overflow-hidden rounded-lg p-1.5 text-left transition-all duration-200 hover:z-20 hover:shadow-level-2 active:scale-[0.98] ${
                              TONE_BG_CLASSES[getClassType(entry.tipeKelas).tone]
                            } ${conflicted ? 'ring-2 ring-error/60' : ''}`}
                            title={`${course?.namaMK ?? entry.kodeMK} · ${entry.jamMulai}-${entry.jamSelesai} · ${entry.ruang}`}
                          >
                            <p
                              className={`truncate text-body-sm font-medium ${
                                TONE_TEXT_CLASSES[getClassType(entry.tipeKelas).tone]
                              }`}
                            >
                              {course?.namaMK ?? entry.kodeMK}
                            </p>
                            {height > 46 && (
                              <p className="text-label-caps text-on-surface-variant">
                                {entry.jamMulai} - {entry.jamSelesai}
                              </p>
                            )}
                            {height > 66 && (
                              <p className="truncate text-body-sm text-on-surface-variant">
                                {entry.ruang}
                              </p>
                            )}
                            {conflicted && (
                              <Icon
                                name="warning"
                                size={14}
                                className="absolute right-1 top-1 text-error"
                              />
                            )}
                          </button>
                        )
                      })}

                    {/* Garis waktu sekarang */}
                    {isTodayCol && nowMinute >= rangeStart && nowMinute <= rangeEnd && (
                      <div
                        className="absolute inset-x-0 z-30 flex items-center"
                        style={{ top: ((nowMinute - rangeStart) / 60) * PX_PER_HOUR }}
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full bg-error" />
                        <span className="h-0.5 flex-1 bg-error" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Conflict banner */}
      {conflictedIds.size > 0 && (
        <div className="flex items-center gap-sm rounded-lg bg-error-container px-md py-sm text-body-sm text-error">
          <Icon name="warning" size={20} />
          Ada jadwal yang bentrok waktunya. Cek kartu bertanda peringatan.
        </div>
      )}

      {/* Course detail bottom sheet (mobile) / side panel (desktop) */}
      {detailEntry && (
        <CourseDetailPanel entry={detailEntry} course={courseMap.get(detailEntry.kodeMK)} onClose={() => setDetailEntry(null)} />
      )}
    </div>
  )
}

function CourseDetailPanel({ entry, course, onClose }) {
  const { tasks } = useTasks()
  const kode = entry.kodeMK ?? ''
  const [note, setNote] = useState(() => getItem(`${STORAGE_KEYS.courseNotes}:${kode}`, ''))
  const [reminderOn, setReminderOn] = useState(() =>
    getItem(`${STORAGE_KEYS.courseReminders}:${kode}`, true),
  )
  const relatedTasks = tasks.filter((t) => t.kodeMK === kode)

  function handleNoteChange(value) {
    setNote(value)
    setItem(`${STORAGE_KEYS.courseNotes}:${kode}`, value)
  }

  function handleReminderToggle() {
    setReminderOn((prev) => {
      setItem(`${STORAGE_KEYS.courseReminders}:${kode}`, !prev)
      return !prev
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 animate-[fade-in_200ms_var(--ease-standard)_both]"
        onClick={onClose}
        role="presentation"
      />
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface-container-lowest shadow-level-2 animate-[sheet-up_300ms_var(--ease-emphasized)_both] tablet:inset-y-0 tablet:left-auto tablet:right-0 tablet:max-h-none tablet:w-96 tablet:animate-[panel-in_250ms_var(--ease-standard)_both] tablet:rounded-l-2xl tablet:rounded-tr-none dark:bg-surface-container-low">
        <div className="sticky top-0 z-10 bg-primary p-lg text-on-primary">
          <div className="mb-sm flex items-start justify-between">
            <span className="rounded bg-white/20 px-2 py-1 text-label-caps">{entry.kodeMK}</span>
            <button type="button" onClick={onClose} className="text-white/80 hover:text-white">
              <Icon name="close" size={24} />
            </button>
          </div>
          <h2 className="text-headline-lg">{course?.namaMK ?? entry.kodeMK}</h2>
          <p className="mt-1 text-body-sm opacity-80">
            {entry.hari}, {entry.jamMulai} - {entry.jamSelesai}
          </p>
        </div>
        <div className="space-y-lg p-lg">
          <InfoRow icon="person" label="Dosen Pengampu" value={course?.dosen ?? '-'} />
          <InfoRow icon="book" label="SKS" value={course?.sks ? `${course.sks} SKS` : '-'} />
          <InfoRow icon="meeting_room" label="Ruangan" value={entry.ruang} />
          <InfoRow icon="call" label="Kontak Dosen" value={course?.kontakDosen ?? '-'} />

          {/* Toggle pengingat per mata kuliah */}
          <div className="flex items-center justify-between rounded-lg bg-surface-container px-md py-sm dark:bg-surface-container-high">
            <span className="flex items-center gap-sm text-body-lg text-on-surface">
              <Icon name="notifications_active" size={20} className="text-primary" />
              Pengingat kelas
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={reminderOn}
              aria-label={`Pengingat untuk ${course?.namaMK ?? kode}`}
              onClick={handleReminderToggle}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                reminderOn ? 'bg-primary' : 'bg-surface-variant'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  reminderOn ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Catatan pribadi per mata kuliah */}
          <section>
            <h3 className="mb-sm flex items-center gap-sm text-title-md text-on-surface">
              <Icon name="sticky_note_2" size={20} className="text-primary" />
              Catatan Pribadi
            </h3>
            <textarea
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Tulis catatan untuk mata kuliah ini..."
              className="min-h-[96px] w-full resize-none rounded-lg border border-outline-variant bg-surface-container-lowest p-md text-body-sm text-on-surface placeholder:text-outline-variant focus:border-primary focus:outline-none dark:bg-surface-container-low"
            />
          </section>

          {/* Tugas terkait mata kuliah ini */}
          <section>
            <h3 className="mb-sm flex items-center gap-sm text-title-md text-on-surface">
              <Icon name="assignment" size={20} className="text-primary" />
              Tugas Terkait
            </h3>
            {relatedTasks.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">
                Belum ada tugas untuk mata kuliah ini.
              </p>
            ) : (
              <ul className="space-y-xs">
                {relatedTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-sm rounded-lg bg-surface-container px-md py-sm dark:bg-surface-container-high"
                  >
                    <span
                      className={`min-w-0 truncate text-body-sm ${
                        task.selesai
                          ? 'text-outline line-through'
                          : 'text-on-surface'
                      }`}
                    >
                      {task.judul}
                    </span>
                    <span className="shrink-0 text-label-caps text-on-surface-variant">
                      {task.deadline ?? '-'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container dark:bg-surface-container-high">
        <Icon name={icon} size={18} className="text-secondary" />
      </div>
      <div className="min-w-0">
        <p className="text-label-caps text-on-surface-variant">{label}</p>
        <p className="truncate text-body-sm text-on-surface">{value}</p>
      </div>
    </div>
  )
}

function toMin(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + m
}

function currentMinuteOfDay() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}
