import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../../hooks/useApp'
import { useFirestore } from '../../hooks/useFirestore'
import { useTasks } from '../../hooks/useTasks'
import { Icon } from '../../components/Icon'
import { ClassCard } from '../../components/ClassCard'
import { EmptyState } from '../../components/EmptyState'
import { Skeleton } from '../../components/Skeleton'
import { ShareModal } from '../../components/ShareModal'
import { sampleSchedule, sampleCourses } from '../../data/sampleSchedule'
import { firebaseReady } from '../../lib/firebaseClient'
import { DAYS } from '../../lib/uploadValidator'
import { getTodayName, sortByTime } from '../../lib/scheduleUtils'
import {
  TONE_BG_CLASSES,
  TONE_BORDER_CLASSES,
  TONE_TEXT_CLASSES,
  TONE_SUBTEXT_CLASSES,
  getClassType,
} from '../../lib/classTypes'
import { expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'

const WEEK_DAYS = DAYS // Senin–Sabtu
const PX_PER_HOUR = 88

export default function WeeklySchedule() {
  const { program, semester } = useApp()
  const todayName = getTodayName()
  const [selectedDay, setSelectedDay] = useState(todayName)
  const [detailEntry, setDetailEntry] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)
  const location = useLocation()

  // TA aktif = TA di mana semester yang dipilih berada (kalender kampus:
  // ganjil akhir Sep → awal Feb, genap akhir Mar → awal Jul). Saat libur,
  // semester ganjil sudah mengarah ke TA berikutnya. Pilihan TIDAK
  // dipersistenkan — default selalu dihitung ulang (anti state basi).
  const currentTA = expectedTahunAjaranForSemester(semester)
  const [selectedTA, setSelectedTA] = useState(currentTA)

  const viewingArchive = selectedTA !== currentTA

  // Dua langganan ringan: published (TA berjalan) + archived (TA lampau).
  const { data: jadwal, loading } = useFirestore('jadwal', [
    ['prodi', '==', program ?? ''],
    ['semester', '==', Number(semester) || 0],
    ['status', '==', 'published'],
  ])
  const { data: archivedJadwal } = useFirestore('jadwal', [
    ['prodi', '==', program ?? ''],
    ['semester', '==', Number(semester) || 0],
    ['status', '==', 'archived'],
  ])
  const { data: settingsDocs } = useFirestore('settings', [])

  // Semua TA yang diketahui: settings + data published + data arsip.
  const allTAs = useMemo(() => {
    const set = new Set([currentTA])
    const app = settingsDocs.find((d) => d.id === 'app')
    if (Array.isArray(app?.availableTAs)) app.availableTAs.forEach((t) => set.add(String(t)))
    ;[...jadwal, ...archivedJadwal].forEach((e) => {
      const t = String(e.tahunAjaran ?? '').trim()
      if (t) set.add(t)
    })
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [settingsDocs, jadwal, archivedJadwal, currentTA])

  const { data: mataKuliah } = useFirestore('mataKuliah')

  const useSample = !firebaseReady
  const scheduleSource = useMemo(() => {
    if (loading) return []
    // Cari di KEDUA published + archived — TA lampau bisa saja masih published.
    const pool = [...jadwal, ...archivedJadwal]
    const active = pool.filter(
      (e) => String(e.tahunAjaran ?? currentTA) === selectedTA,
    )
    if (active.length > 0) return active
    if (viewingArchive) return []
    if (!useSample) return []
    return sampleSchedule.filter(
      (e) => e.prodi === program && e.semester === Number(semester),
    )
  }, [loading, jadwal, archivedJadwal, viewingArchive, selectedTA, currentTA, useSample, program, semester])

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
    // Tanpa cleanup yang menghapus history state: menghapusnya di unmount
    // merusak navigasi back ke halaman lain yang membawa deep-link ini.
    return undefined
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
      const d = typeof t.toDate === 'function' ? t.toDate() : new Date(t)
      set.add(localDateKey(d))
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
  const gridScrollRef = useRef(null)

  // Auto-scroll ke posisi "SEKARANG" (sepertiga atas viewport) saat halaman dimuat
  useEffect(() => {
    if (loading || !gridScrollRef.current) return
    const clampedMinute = Math.max(rangeStart, Math.min(nowMinute, rangeEnd))
    const targetY = ((clampedMinute - rangeStart) / 60) * PX_PER_HOUR
    const timer = setTimeout(() => {
      if (gridScrollRef.current) {
        const viewportHeight = gridScrollRef.current.clientHeight || 500
        const scrollTop = Math.max(0, targetY - viewportHeight / 3)
        gridScrollRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' })
      }
    }, 150)
    return () => clearTimeout(timer)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- Auto-scroll hanya dipicu sekali saat mount / ganti TA, bukan tiap tick menit.
  }, [loading, selectedTA, rangeStart, rangeEnd])

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
          <TahunAjaranDropdown
            selectedTA={selectedTA}
            onSelect={(ta) => setSelectedTA(ta)}
            currentTA={currentTA}
            allTAs={allTAs}
          />
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary dark:bg-surface-container-high cursor-pointer"
            title="Bagikan Jadwal"
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
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
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
        <div
          ref={gridScrollRef}
          className="overflow-auto max-h-[calc(100vh-210px)] min-h-[580px] rounded-2xl border border-outline-variant/40 bg-surface-container-lowest dark:bg-surface-container-low shadow-sm"
        >
          <div className="min-w-[720px]">
            {/* Header hari — Sticky on top with solid background and higher z-index */}
            <div
              className="grid sticky top-0 z-30 bg-surface-container-lowest dark:bg-surface-container-low shadow-sm border-b border-outline-variant/40"
              style={{ gridTemplateColumns: `64px repeat(${WEEK_DAYS.length}, 1fr)` }}
            >
              <div className="p-3 text-center text-label-caps font-bold text-on-surface-variant flex items-center justify-center">
                GMT+7
              </div>
              {weekDates.map(({ day, dateNum, monthShort, iso }) => {
                const isTodayCol = day === todayName && iso === todayISO
                const isHoliday = holidayDates.has(iso)
                return (
                  <div
                    key={day}
                    className={`p-3 text-center flex flex-col items-center justify-center border-l border-outline-variant/30 transition-colors ${
                      isHoliday
                        ? 'opacity-60'
                        : isTodayCol
                        ? 'bg-surface-container-low dark:bg-surface-container-high/60 rounded-t-2xl'
                        : ''
                    }`}
                  >
                    {isTodayCol ? (
                      <span className="rounded-full bg-primary text-on-primary px-3.5 py-1 text-label-caps font-bold shadow-sm inline-block">
                        {day}
                      </span>
                    ) : (
                      <span className="text-title-md font-semibold text-on-surface">{day}</span>
                    )}
                    <div className="text-body-sm text-on-surface-variant font-medium mt-0.5">
                      {dateNum} {monthShort}
                      {isHoliday && (
                        <span className="ml-1 font-bold text-error">· LIBUR</span>
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
                gridTemplateColumns: `64px repeat(${WEEK_DAYS.length}, 1fr)`,
                height: gridHeight,
              }}
            >
              {/* Kolom label jam */}
              <div className="relative border-r border-outline-variant/40">
                {hourMarks.map((m) => {
                  const isFirst = m === rangeStart
                  return (
                    <span
                      key={m}
                      className={`absolute right-1.5 text-label-caps text-on-surface-variant font-semibold select-none ${
                        isFirst ? 'top-1.5' : '-translate-y-1/2'
                      }`}
                      style={isFirst ? undefined : { top: ((m - rangeStart) / 60) * PX_PER_HOUR }}
                    >
                      {String(Math.floor(m / 60)).padStart(2, '0')}:00
                    </span>
                  )
                })}
              </div>

              {weekDates.map(({ day, iso }) => {
                const isHoliday = holidayDates.has(iso)
                const isTodayCol = day === todayName && iso === todayISO
                const entries = sortByTime(scheduleSource.filter((e) => e.hari === day))
                return (
                  <div
                    key={day}
                    className={`relative border-l border-outline-variant/40 transition-colors ${
                      isHoliday
                        ? 'holiday-stripes'
                        : isTodayCol
                        ? 'bg-surface-container-low/70 dark:bg-surface-container-high/30'
                        : ''
                    }`}
                  >
                    {isHoliday && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
                        <span className="text-label-caps uppercase tracking-widest text-on-surface-variant/45 -rotate-90 font-bold">
                          LIBUR
                        </span>
                      </div>
                    )}
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
                        const classType = getClassType(entry.tipeKelas)
                        const borderClass = TONE_BORDER_CLASSES[classType.tone] ?? TONE_BORDER_CLASSES.neutral
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => openDetail(entry)}
                            style={{ top: top + 2, height }}
                            className={`absolute inset-x-1 z-10 overflow-hidden rounded-xl p-2 text-left transition-all duration-200 hover:z-20 hover:shadow-level-2 active:scale-[0.98] border border-outline-variant/10 ${
                              TONE_BG_CLASSES[classType.tone]
                            } ${borderClass} ${conflicted ? 'ring-2 ring-error/60' : ''}`}
                            title={`${course?.namaMK ?? entry.kodeMK} · ${entry.jamMulai}-${entry.jamSelesai} · ${entry.ruang}`}
                          >
                            <p
                              className={`line-clamp-2 text-body-sm font-bold leading-tight ${
                                TONE_TEXT_CLASSES[classType.tone]
                              }`}
                              title={course?.namaMK ?? entry.kodeMK}
                            >
                              {course?.namaMK ?? entry.kodeMK}
                            </p>
                            {height > 46 && (
                              <p className={`text-label-caps font-semibold mt-0.5 ${TONE_SUBTEXT_CLASSES[classType.tone]}`}>
                                {entry.jamMulai} - {entry.jamSelesai}
                              </p>
                            )}
                            {height > 66 && (
                              <p className={`truncate text-body-sm font-semibold mt-0.5 ${TONE_SUBTEXT_CLASSES[classType.tone]}`}>
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

                    {/* Garis waktu sekarang — Clamped to edges & one-time entrance animation */}
                    {isTodayCol && (
                      (() => {
                        const clampedMinute = Math.max(rangeStart, Math.min(nowMinute, rangeEnd))
                        const isClampedTop = nowMinute < rangeStart
                        const isClampedBottom = nowMinute > rangeEnd
                        const topPos = isClampedTop
                          ? 6
                          : isClampedBottom
                          ? gridHeight - 6
                          : ((clampedMinute - rangeStart) / 60) * PX_PER_HOUR

                        return (
                          <div
                            className="absolute inset-x-0 z-15 flex items-center pointer-events-none animate-[fade-in_400ms_var(--ease-emphasized)_both]"
                            style={{ top: topPos }}
                            aria-label="Waktu sekarang"
                          >
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-error ring-4 ring-error/25 -ml-1 shadow-sm" />
                            <span className="h-0.5 flex-1 bg-error shadow-sm" />
                            <span className="bg-error text-on-error text-[10px] font-bold px-2 py-0.5 rounded-full mr-1.5 shrink-0 shadow-md">
                              SEKARANG {String(Math.floor(nowMinute / 60)).padStart(2, '0')}:{String(nowMinute % 60).padStart(2, '0')}
                            </span>
                          </div>
                        )
                      })()
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

      {/* Share schedule modal dialog */}
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
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
    const next = !reminderOn
    // Persist dulu di luar updater — updater harus murni (StrictMode
    // bisa memanggilnya dua kali).
    setItem(`${STORAGE_KEYS.courseReminders}:${kode}`, next)
    setReminderOn(next)
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
        <div className="sticky top-0 z-10 bg-gradient-to-br from-primary to-primary-container p-lg text-on-primary shadow-level-1">
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

/** YYYY-MM-DD dari bagian tanggal LOKAL (bukan UTC) — hindari off-by-one WIB. */
function localDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

function TahunAjaranDropdown({ selectedTA, onSelect, currentTA, allTAs }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (open && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const sortedTAs = useMemo(() => {
    const list = [{ ta: currentTA, isCurrent: true }]
    allTAs
      .filter((t) => t !== currentTA)
      .sort((a, b) => b.localeCompare(a))
      .forEach((t) => list.push({ ta: t, isCurrent: false }))
    return list
  }, [currentTA, allTAs])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Pilih tahun ajaran"
        className={`group flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-body-sm font-medium transition-all shadow-sm cursor-pointer ${
          open
            ? 'border-primary bg-surface-container-high text-on-surface shadow-md'
            : 'border-outline-variant/40 bg-surface-container-lowest hover:border-primary/50 hover:bg-surface-container-low text-on-surface dark:bg-surface-container-high'
        }`}
      >
        <Icon name="calendar_month" size={16} className="text-primary shrink-0" />
        <span>TA {selectedTA}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            selectedTA === currentTA
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : 'bg-surface-container-highest text-on-surface-variant'
          }`}
        >
          {selectedTA === currentTA ? 'Berjalan' : 'Arsip'}
        </span>
        <Icon
          name="expand_more"
          size={16}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : 'group-hover:text-on-surface'
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 min-w-[230px] overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/95 backdrop-blur-xl dark:bg-surface-container-high/95 shadow-level-3 p-1.5 animate-fade-up">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 border-b border-outline-variant/15 mb-1">
            Pilih Tahun Ajaran
          </div>
          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {sortedTAs.map(({ ta, isCurrent }) => {
              const isSelected = ta === selectedTA
              return (
                <button
                  key={ta}
                  type="button"
                  onClick={() => {
                    onSelect(ta)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-body-sm font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold dark:bg-primary/20 dark:text-on-primary-container'
                      : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container-highest'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      name={isCurrent ? 'event_available' : 'history'}
                      size={16}
                      className={isSelected ? 'text-primary' : 'text-on-surface-variant'}
                    />
                    <span>TA {ta}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isCurrent
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {isCurrent ? 'Berjalan' : 'Arsip'}
                    </span>
                    {isSelected && <Icon name="check" size={16} className="text-primary" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
