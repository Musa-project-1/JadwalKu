import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
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
import { getTodayName, sortByTime, formatRuang, detectClassTransitions } from '../../lib/scheduleUtils'
import {
  TONE_BG_CLASSES,
  TONE_BORDER_CLASSES,
  TONE_TEXT_CLASSES,
  TONE_SUBTEXT_CLASSES,
  TONE_CLASSES,
  TONE_ICONS,
  TONE_CHIP_BG_CLASSES,
  TONE_SHADOW_CLASSES,
  getClassType,
} from '../../lib/classTypes'
import { expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'
import { useCustomSchedule } from '../../hooks/useCustomSchedule'
import { CustomScheduleModal } from '../../components/student/CustomScheduleModal'
import { useAttendance } from '../../hooks/useAttendance'
import { AttendanceOverviewModal } from '../../components/student/AttendanceOverviewModal'
import { AnnouncementBanner } from '../../components/student/AnnouncementBanner'
import { CourseNotesModal } from '../../components/student/CourseNotesModal'
import { PrintScheduleModal } from '../../components/student/PrintScheduleModal'
import { KrsSimulatorModal } from '../../components/student/KrsSimulatorModal'
import { RoomLocationModal } from '../../components/student/RoomLocationModal'

const WEEK_DAYS = DAYS // Senin–Sabtu

function toMin(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function currentMinuteOfDay() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function localDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

function formatWhatsAppUrl(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  const formatted = digits.startsWith('0') ? '62' + digits.slice(1) : digits
  return `https://wa.me/${formatted}`
}

export default function WeeklySchedule() {
  const { program, semester } = useApp()
  const todayName = getTodayName()
  const [selectedDay, setSelectedDay] = useState(todayName)
  const [detailEntry, setDetailEntry] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [viewDays, setViewDays] = useState(() => getItem('jadwal:viewDays', '5'))
  const location = useLocation()

  const activeWeekDays = useMemo(
    () => (viewDays === '5' ? WEEK_DAYS.slice(0, 5) : WEEK_DAYS),
    [viewDays],
  )

  const { data: settingsDocs } = useFirestore('settings', [])

  const calDoc = useMemo(
    () => settingsDocs.find((d) => d.id === 'academicCalendar'),
    [settingsDocs],
  )

  const currentTA = useMemo(
    () => expectedTahunAjaranForSemester(semester, new Date(), calDoc),
    [semester, calDoc],
  )
  const [selectedTA, setSelectedTA] = useState(currentTA)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setSelectedTA(currentTA)
  }, [currentTA])

  const viewingArchive = selectedTA !== currentTA

  const {
    isCustomMode,
    setScheduleMode,
    customScheduleIds,
    setCustomScheduleIds,
  } = useCustomSchedule()
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [krsSimulatorOpen, setKrsSimulatorOpen] = useState(false)

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
  const { data: allPublishedJadwal } = useFirestore('jadwal', [
    ['status', '==', 'published'],
  ])

  const allTAs = useMemo(() => {
    const set = new Set([currentTA])
    const app = settingsDocs.find((d) => d.id === 'app')
    if (Array.isArray(app?.availableTAs)) app.availableTAs.forEach((t) => set.add(String(t)))
    ;[...jadwal, ...archivedJadwal, ...allPublishedJadwal].forEach((e) => {
      const t = String(e.tahunAjaran ?? '').trim()
      if (t) set.add(t)
    })
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [settingsDocs, jadwal, archivedJadwal, allPublishedJadwal, currentTA])

  const { data: mataKuliah } = useFirestore('mataKuliah')

  const useSample = !firebaseReady
  const scheduleSource = useMemo(() => {
    if (loading) return []
    if (isCustomMode) {
      const pool = allPublishedJadwal.length > 0 ? allPublishedJadwal : sampleSchedule
      const customSet = new Set(customScheduleIds)
      const matches = pool.filter((e) => customSet.has(e.id))
      return matches.filter((e) => String(e.tahunAjaran ?? currentTA) === selectedTA)
    }

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
  }, [loading, isCustomMode, allPublishedJadwal, customScheduleIds, jadwal, archivedJadwal, viewingArchive, selectedTA, currentTA, useSample, program, semester])

  useEffect(() => {
    const kode = location.state?.openKodeMK
    if (!kode) return undefined
    const match = scheduleSource.find((e) => e.kodeMK === kode)
    // oxlint-disable-next-line react/set-state-in-effect
    if (match) setDetailEntry(match)
    return undefined
  }, [location.state, scheduleSource])

  const courses = useMemo(
    () => (mataKuliah.length > 0 ? mataKuliah : useSample ? sampleCourses : []),
    [mataKuliah, useSample],
  )
  const courseMap = useMemo(() => new Map(courses.map((c) => [c.kodeMK, c])), [courses])

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

  const allTransitions = useMemo(() => {
    const map = new Map()
    for (const day of WEEK_DAYS) {
      const entries = scheduleSource.filter((e) => e.hari === day)
      const trans = detectClassTransitions(entries)
      trans.forEach((v, k) => map.set(k, v))
    }
    return map
  }, [scheduleSource])

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

  const weekDates = useMemo(() => {
    const now = new Date()
    now.setDate(now.getDate() + weekOffset * 7)
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    return activeWeekDays.map((day, i) => {
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
  }, [weekOffset, activeWeekDays])

  const monthYearLabel = useMemo(() => {
    if (weekDates.length === 0) return ''
    const first = weekDates[0]
    const last = weekDates[weekDates.length - 1]
    const dFirst = new Date(first.iso)
    const dLast = new Date(last.iso)
    const mFirst = dFirst.toLocaleDateString('id-ID', { month: 'long' })
    const mLast = dLast.toLocaleDateString('id-ID', { month: 'long' })
    const y = dLast.getFullYear()
    if (mFirst === mLast) {
      return `${mFirst} ${y}`
    }
    return `${mFirst} – ${mLast} ${y}`
  }, [weekDates])

  const weekRangeLabel = useMemo(() => {
    if (weekDates.length === 0) return ''
    const first = weekDates[0]
    const last = weekDates[weekDates.length - 1]
    if (weekOffset === 0) {
      return `Minggu Ini · ${first.dateNum} - ${last.dateNum} ${last.monthShort}`
    }
    if (first.monthShort === last.monthShort) {
      return `${first.dateNum} - ${last.dateNum} ${last.monthShort}`
    }
    return `${first.dateNum} ${first.monthShort} - ${last.dateNum} ${last.monthShort}`
  }, [weekDates, weekOffset])

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

  const gridScrollRef = useRef(null)
  const gridBodyRef = useRef(null)
  const [gridBodyHeight, setGridBodyHeight] = useState(580)

  useLayoutEffect(() => {
    const el = gridBodyRef.current
    if (!el) return
    const update = () => {
      const h = el.clientHeight
      if (h > 0) setGridBodyHeight(h)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // pxPerHour dinamis: seluruh rentang jam selalu muat penuh di tinggi grid body (non-scroll)
  const pxPerHour = gridBodyHeight / ((rangeEnd - rangeStart) / 60)
  const gridHeight = gridBodyHeight

  function openDetail(entry) {
    setDetailEntry(entry)
  }

  const toolbarButtons = (
    <>
      <div className="flex items-center rounded-xl bg-surface-container-high/60 p-1 border border-outline-variant/30 shrink-0">
        <button
          type="button"
          onClick={() => setScheduleMode('regular')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-body-xs font-bold transition-all cursor-pointer ${
            !isCustomMode
              ? 'bg-surface text-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Icon name="school" size={16} />
          <span>Jadwal Paket</span>
        </button>
        <button
          type="button"
          onClick={() => setScheduleMode('custom')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-body-xs font-bold transition-all cursor-pointer ${
            isCustomMode
              ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 shadow-xs border border-amber-500/30'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Icon name="star" size={16} className={isCustomMode ? 'text-amber-500' : ''} />
          <span>Jadwal Kustom {customScheduleIds.length > 0 ? `(${customScheduleIds.length})` : ''}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setAttendanceModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-body-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
          title="Lihat rekapitulasi kehadiran & sisa jatah absen seluruh mata kuliah"
        >
          <Icon name="fact_check" size={15} />
          <span>Rekap Presensi</span>
        </button>

        <button
          type="button"
          onClick={() => setNotesModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-body-xs font-bold text-amber-900 dark:text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
          title="Lihat seluruh catatan perkuliahan semester ini"
        >
          <Icon name="sticky_note_2" size={15} className="text-amber-600 dark:text-amber-400" />
          <span>Semua Catatan</span>
        </button>

        <button
          type="button"
          onClick={() => setPrintModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-body-xs font-bold text-sky-900 dark:text-sky-300 hover:bg-sky-500/20 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
          title="Cetak jadwal format A4 meja belajar atau kartu saku"
        >
          <Icon name="print" size={15} className="text-sky-600 dark:text-sky-400" />
          <span>Cetak PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setKrsSimulatorOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-body-xs font-bold text-purple-900 dark:text-purple-300 hover:bg-purple-500/20 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
          title="Simulasikan pemilihan KRS & cek bentrok waktu untuk semester baru"
        >
          <Icon name="science" size={15} className="text-purple-600 dark:text-purple-400" />
          <span>Simulator KRS</span>
        </button>

        {isCustomMode ? (
          <div className="flex items-center gap-2">
            <span className="text-body-xs text-on-surface-variant hidden sm:inline">
              {scheduleSource.length} kelas aktif terpilih
            </span>
            <button
              type="button"
              onClick={() => setCustomModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 text-slate-900 px-3 py-1.5 text-body-xs font-bold hover:bg-amber-400 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Icon name="tune" size={15} />
              <span>Atur Matkul Kustom</span>
            </button>
          </div>
        ) : (
          <span className="text-body-xs text-on-surface-variant px-1 hidden sm:inline">
            Sesuai paket {program} Sem. {semester}
          </span>
        )}
      </div>
    </>
  )

  return (
    <div className="space-y-lg w-full max-w-full overflow-x-hidden">
      <header className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Icon name="calendar_month" size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl tablet:text-3xl font-bold tracking-tight text-on-surface">
                Jadwal Mingguan
              </h2>
              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-bold border border-primary/20">
                Aktif
              </span>
            </div>
            <p className="mt-0.5 text-body-sm text-on-surface-variant font-normal">
              {program} · Semester {semester} · TA {selectedTA}
              {viewingArchive && ' · Arsip'}
            </p>
          </div>
        </div>

        {/* Controls Desktop (>=600px) */}
        <div className="hidden tablet:flex items-center gap-2 shrink-0">
          <div className="hidden desktop:inline-flex items-center rounded-full border border-outline-variant/30 bg-surface-container-high/50 p-0.5 shadow-xs shrink-0">
            <button
              type="button"
              onClick={() => {
                setViewDays('5')
                setItem('jadwal:viewDays', '5')
              }}
              className={`rounded-full px-3 py-1 text-[12px] font-bold transition-all ${
                viewDays === '5'
                  ? 'bg-surface shadow-xs text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              5 Hari
            </button>
            <button
              type="button"
              onClick={() => {
                setViewDays('6')
                setItem('jadwal:viewDays', '6')
              }}
              className={`rounded-full px-3 py-1 text-[12px] font-bold transition-all ${
                viewDays === '6'
                  ? 'bg-surface shadow-xs text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              6 Hari
            </button>
          </div>

          {/* Desktop Week Navigator */}
          <div className="flex items-center rounded-full border border-outline-variant/30 bg-surface-container-high/60 px-1 py-1 shadow-xs min-w-0">
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              title="Minggu Sebelumnya"
              aria-label="Minggu Sebelumnya"
              className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors cursor-pointer shrink-0"
            >
              <Icon name="chevron_left" size={18} />
            </button>
            <span className="px-3 text-body-xs font-bold text-on-surface whitespace-nowrap">
              {weekRangeLabel}
            </span>
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              title="Minggu Berikutnya"
              aria-label="Minggu Berikutnya"
              className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors cursor-pointer shrink-0"
            >
              <Icon name="chevron_right" size={18} />
            </button>
            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="ml-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary hover:bg-primary/25 transition-colors shrink-0"
              >
                Hari Ini
              </button>
            )}
          </div>

          {/* TA Selector & Share */}
          <TahunAjaranDropdown
            selectedTA={selectedTA}
            onSelect={(ta) => setSelectedTA(ta)}
            currentTA={currentTA}
            allTAs={allTAs}
          />
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high/60 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-primary border border-outline-variant/20 shadow-xs cursor-pointer"
            title="Bagikan Jadwal"
            aria-label="Bagikan jadwal"
          >
            <Icon name="ios_share" size={18} />
          </button>
        </div>
      </header>

      {/* Broadcast Pengumuman Kampus & Kuliah Pengganti */}
      <AnnouncementBanner currentProgram={program} currentSemester={semester} />

      {/* Mode Switcher & Aksi (Mobile & Tablet) — di desktop toolbar menyatu ke dalam kartu grid */}
      <div className="desktop:hidden">
        <div className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-xs flex-wrap">
          {toolbarButtons}
        </div>
      </div>

      {/* Mobile Controls (<600px): Baris 1 Aligned (Bulan di Kiri, TA & Share di Kanan) */}
      <div className="flex flex-col gap-2 tablet:hidden w-full max-w-full">
        {/* Row 1: Bulan (Kiri) & TA Selector + Share (Kanan) — 100% ALIGNED */}
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-1.5 text-body-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-2xl shadow-2xs shrink-0">
            <Icon name="calendar_month" size={15} />
            <span>{monthYearLabel}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <TahunAjaranDropdown
              selectedTA={selectedTA}
              onSelect={(ta) => setSelectedTA(ta)}
              currentTA={currentTA}
              allTAs={allTAs}
            />
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high/60 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-primary border border-outline-variant/20 shadow-xs cursor-pointer"
              title="Bagikan Jadwal"
              aria-label="Bagikan jadwal"
            >
              <Icon name="ios_share" size={16} />
            </button>
          </div>
        </div>

        {/* Row 2: Week Navigator Pill Lebar Penuh + Tombol Hari Ini jika bergeser */}
        <div className="flex items-center justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-high/60 px-2 py-1.5 shadow-xs w-full">
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            title="Minggu Sebelumnya"
            aria-label="Minggu Sebelumnya"
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <Icon name="chevron_left" size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-body-xs font-bold text-on-surface text-center whitespace-nowrap">
              {weekRangeLabel}
            </span>
            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary hover:bg-primary/25 transition-colors shrink-0"
              >
                Hari Ini
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            title="Minggu Berikutnya"
            aria-label="Minggu Berikutnya"
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <Icon name="chevron_right" size={20} />
          </button>
        </div>
      </div>

      {/* Bar 2: Segmented Day Grid 100% Pas Tanpa Seret Kanan Kiri */}
      <div
        className="grid gap-1.5 desktop:hidden w-full max-w-full"
        style={{ gridTemplateColumns: `repeat(${activeWeekDays.length}, minmax(0, 1fr))` }}
      >
        {weekDates.map(({ day, dateNum }) => {
          const isSelected = selectedDay === day
          const isToday = day === todayName && weekOffset === 0
          const shortDay = day.slice(0, 3)

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 cursor-pointer min-w-0 ${
                isSelected
                  ? 'bg-primary text-on-primary font-bold shadow-xs scale-[1.02]'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high dark:bg-surface-container-high'
              }`}
            >
              <span className="text-[11px] uppercase font-bold tracking-tight">
                {shortDay}
              </span>
              <span className={`text-body-sm font-extrabold mt-0.5 ${isSelected ? 'text-on-primary' : 'text-on-surface'}`}>
                {dateNum}
              </span>
              {isToday && (
                <span className={`h-1 w-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-error animate-pulse'}`} />
              )}
            </button>
          )
        })}
      </div>

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
                note={getItem(`${STORAGE_KEYS.courseNotes}:${entry.kodeMK}`, '')}
                transition={allTransitions.get(entry.id)}
                onClick={() => openDetail(entry)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="hidden desktop:block">
        {!loading && scheduleSource.length === 0 && (
          <div className="mb-md flex items-center gap-sm rounded-2xl bg-info-container/40 px-md py-sm text-body-sm text-info dark:bg-info-container/20">
            <Icon name="info" size={20} className="shrink-0" />
            {isCustomMode
              ? `Belum ada kelas kustom dipilih. Klik "Atur Matkul Kustom" untuk memilih mata kuliah.`
              : viewingArchive
              ? `Belum ada arsip jadwal ${program} · Semester ${semester} untuk TA ${selectedTA}.`
              : `Belum ada jadwal terpublikasi untuk ${program} · Semester ${semester}. Admin dapat mengunggahnya lewat Panel Admin.`}
          </div>
        )}
        <div
          ref={gridScrollRef}
          className="overflow-hidden h-[calc(100vh-210px)] rounded-2xl border border-outline-variant/40 bg-surface-container-lowest dark:bg-surface-container-low shadow-sm relative flex flex-col"
        >
          <div className="min-h-0 flex flex-col w-full">
            {/* Mode Switcher & Aksi (Desktop) — menyatu dengan kartu jadwal */}
            <div className="flex items-center justify-between gap-3 px-2.5 py-2 bg-surface-container-low/40 border-b border-outline-variant/20 flex-wrap shrink-0">
              {toolbarButtons}
            </div>
            <div
              className="grid sticky top-0 z-30 shrink-0 bg-surface-container-lowest dark:bg-surface-container-low shadow-sm border-b border-outline-variant/40"
              style={{ gridTemplateColumns: `64px repeat(${activeWeekDays.length}, minmax(0, 1fr))` }}
            >
              <div className="p-3 text-center text-label-caps font-bold text-on-surface-variant flex items-center justify-center sticky left-0 z-40 bg-surface-container-lowest dark:bg-surface-container-low border-r border-outline-variant/30">
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

            <div
              ref={gridBodyRef}
              className="relative grid flex-1 min-h-0"
              style={{
                gridTemplateColumns: `64px repeat(${activeWeekDays.length}, minmax(0, 1fr))`,
              }}
            >
              {rangeStart <= 690 && rangeEnd >= 780 && (
                <div
                  className="absolute inset-x-0 pointer-events-none bg-surface-container/40 dark:bg-surface-container-high/20 border-y border-dashed border-outline-variant/25 flex items-center justify-end pr-4 z-0"
                  style={{
                    top: ((690 - rangeStart) / 60) * pxPerHour,
                    height: (90 / 60) * pxPerHour,
                  }}
                >
                  <span className="text-[10.5px] font-bold tracking-wider uppercase text-on-surface-variant/40 select-none">
                    Istirahat / Dzuhur (11:30 – 13:00)
                  </span>
                </div>
              )}

              <div className="relative border-r border-outline-variant/40 sticky left-0 z-20 bg-surface-container-lowest/95 dark:bg-surface-container-low/95 backdrop-blur-xs">
                {hourMarks.map((m) => {
                  const isFirst = m === rangeStart
                  return (
                    <span
                      key={m}
                      className={`absolute right-1.5 text-label-caps text-on-surface-variant font-semibold select-none ${
                        isFirst ? 'top-1.5' : '-translate-y-1/2'
                      }`}
                      style={isFirst ? undefined : { top: ((m - rangeStart) / 60) * pxPerHour }}
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
                    {hourMarks.map((m) => (
                      <span
                        key={m}
                        className="absolute inset-x-0 border-t border-outline-variant/30"
                        style={{ top: ((m - rangeStart) / 60) * pxPerHour }}
                      />
                    ))}

                    {!isHoliday &&
                      entries.map((entry) => {
                        const start = toMin(entry.jamMulai)
                        const end = toMin(entry.jamSelesai)
                        const top = ((start - rangeStart) / 60) * pxPerHour
                        const height = Math.max(
                          ((end - start) / 60) * pxPerHour - 4,
                          30,
                        )
                        const course = courseMap.get(entry.kodeMK)
                        const conflicted = conflictedIds.has(entry.id)
                        const noteText = getItem(`${STORAGE_KEYS.courseNotes}:${entry.kodeMK}`, '')
                        const transition = allTransitions.get(entry.id)
                        const classType = getClassType(entry.tipeKelas)
                        const borderClass = TONE_BORDER_CLASSES[classType.tone] ?? TONE_BORDER_CLASSES.neutral
                        const iconName = TONE_ICONS[classType.tone] ?? 'corporate_fare'
                        const chipBg = TONE_CHIP_BG_CLASSES[classType.tone]
                        const shadowClass = TONE_SHADOW_CLASSES[classType.tone]
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => openDetail(entry)}
                            style={{ top: top + 2, height }}
                            className={`absolute inset-x-1 z-10 overflow-hidden rounded-xl p-2 text-left transition duration-200 hover:z-20 hover:scale-[1.01] active:scale-[0.98] border border-outline-variant/10 ${
                              TONE_BG_CLASSES[classType.tone]
                            } ${borderClass} ${shadowClass} ${conflicted ? 'ring-2 ring-error/60' : ''}`}
                            title={`${course?.namaMK ?? entry.kodeMK} · ${entry.jamMulai}-${entry.jamSelesai} · ${formatRuang(entry.ruang, entry.tipeKelas)} · ${course?.dosen || ''}`}
                          >
                            {height > 64 && (
                              <div className="mb-1 flex items-center gap-1.5">
                                <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-[4px] ${chipBg}`}>
                                  <Icon name={iconName} size={11} />
                                </span>
                                <span className={`text-[10px] font-bold tracking-wide ${TONE_TEXT_CLASSES[classType.tone]}`}>
                                  {entry.tipeKelas || 'K1'}
                                </span>
                              </div>
                            )}

                            <p
                              className={`line-clamp-2 text-body-sm font-bold leading-tight ${
                                TONE_TEXT_CLASSES[classType.tone]
                              }`}
                              title={course?.namaMK ?? entry.kodeMK}
                            >
                              {course?.namaMK ?? entry.kodeMK}
                            </p>
                            {height > 40 && (
                              <p className={`text-label-caps font-semibold mt-0.5 ${TONE_SUBTEXT_CLASSES[classType.tone]}`}>
                                {entry.jamMulai} - {entry.jamSelesai}
                              </p>
                            )}
                            {height > 80 && (
                              <p className={`truncate text-body-xs font-semibold mt-0.5 ${TONE_SUBTEXT_CLASSES[classType.tone]}`}>
                                {formatRuang(entry.ruang, entry.tipeKelas)}
                              </p>
                            )}
                            {height > 108 && course?.dosen && (
                              <div className="mt-1.5 pt-1 border-t border-current/10 flex items-center gap-1.5">
                                <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${chipBg}`}>
                                  {course.dosen.charAt(0)}
                                </span>
                                <span
                                  title={course.dosen}
                                  className={`truncate text-[10px] font-medium ${TONE_SUBTEXT_CLASSES[classType.tone]}`}
                                >
                                  {course.dosen}
                                </span>
                              </div>
                            )}
                            {transition && (
                              <span
                                className="absolute left-1 bottom-1 flex h-4 items-center gap-0.5 px-1 rounded-full bg-orange-500/25 text-orange-800 dark:text-orange-200 text-[8.5px] font-bold border border-orange-500/30"
                                title={transition.message}
                              >
                                <Icon name="directions_run" size={9} />
                                <span>{transition.gapMinutes}m</span>
                              </span>
                            )}
                            {noteText && (
                              <span
                                className="absolute right-1 bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/25 text-amber-800 dark:text-amber-200"
                                title={`Catatan: ${noteText}`}
                              >
                                <Icon name="sticky_note_2" size={10} />
                              </span>
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

                    {isTodayCol && (
                      (() => {
                        const clampedMinute = Math.max(rangeStart, Math.min(nowMinute, rangeEnd))
                        const isClampedTop = nowMinute < rangeStart
                        const isClampedBottom = nowMinute > rangeEnd
                        const topPos = isClampedTop
                          ? 6
                          : isClampedBottom
                          ? gridHeight - 6
                          : ((clampedMinute - rangeStart) / 60) * pxPerHour

                        return (
                          <div
                            style={{ top: topPos }}
                            className="pointer-events-none absolute inset-x-0 z-20 transition-all duration-300 ease-out"
                          >
                            <span className="absolute -left-1 -top-[4px] h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20 animate-pulse" />
                            <div className="h-[2px] w-full bg-primary/70 shadow-xs" />
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

      {conflictedIds.size > 0 && (
        <div className="flex items-center gap-sm rounded-2xl bg-error-container/40 p-md text-body-sm text-error">
          <Icon name="warning" size={20} className="shrink-0" />
          Ada jadwal yang bentrok waktunya. Cek kartu bertanda peringatan.
        </div>
      )}

      {detailEntry && (
        <CourseDetailPanel
          entry={detailEntry}
          course={courseMap.get(detailEntry.kodeMK)}
          transition={allTransitions.get(detailEntry.id)}
          onClose={() => setDetailEntry(null)}
        />
      )}

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />

      <CustomScheduleModal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        allSchedules={allPublishedJadwal}
        courses={mataKuliah}
        currentProgram={program}
        currentSemester={semester}
        currentCustomIds={customScheduleIds}
        onSave={(newIds) => setCustomScheduleIds(newIds)}
        onOpenSimulator={() => setKrsSimulatorOpen(true)}
      />

      <AttendanceOverviewModal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        scheduleEntries={scheduleSource}
        courses={courses}
        onSelectCourse={(selectedKode) => {
          const match = scheduleSource.find((s) => s.kodeMK === selectedKode)
          if (match) setDetailEntry(match)
        }}
      />

      <CourseNotesModal
        isOpen={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        courses={courses}
        onOpenCourseDetail={(selectedKode) => {
          const match = scheduleSource.find((s) => s.kodeMK === selectedKode)
          if (match) setDetailEntry(match)
        }}
      />

      <PrintScheduleModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        scheduleEntries={scheduleSource}
        courses={courses}
        program={program}
        semester={semester}
        tahunAjaran={selectedTA}
      />

      <KrsSimulatorModal
        isOpen={krsSimulatorOpen}
        onClose={() => setKrsSimulatorOpen(false)}
        allSchedules={allPublishedJadwal}
        courses={mataKuliah}
        currentProgram={program}
        currentSemester={semester}
        onApplyToSchedule={(ids) => {
          setCustomScheduleIds(ids)
          setScheduleMode('custom')
        }}
      />
    </div>
  )
}

function CourseDetailPanel({ entry, course, transition, onClose }) {
  const { tasks } = useTasks()
  const { getCourseAttendance, setMeetingStatus, quickIncrement, resetCourseAttendance } = useAttendance()
  const kode = entry.kodeMK ?? ''
  const attendanceInfo = getCourseAttendance(kode)
  const [note, setNote] = useState(() => getItem(`${STORAGE_KEYS.courseNotes}:${kode}`, ''))
  const [reminderOn, setReminderOn] = useState(() =>
    getItem(`${STORAGE_KEYS.courseReminders}:${kode}`, true),
  )
  const [copied, setCopied] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const saveTimeoutRef = useRef(null)

  const [links, setLinks] = useState(() =>
    getItem(`${STORAGE_KEYS.courseLinks}:${kode}`, {
      lmsUrl: '',
      meetingUrl: '',
      waGroupUrl: '',
    }),
  )
  const [editingLinks, setEditingLinks] = useState(false)
  const [formLinks, setFormLinks] = useState({
    lmsUrl: links.lmsUrl || '',
    meetingUrl: links.meetingUrl || '',
    waGroupUrl: links.waGroupUrl || '',
  })
  const [roomModalOpen, setRoomModalOpen] = useState(false)

  function handleSaveLinks(e) {
    if (e) e.preventDefault()
    setItem(`${STORAGE_KEYS.courseLinks}:${kode}`, formLinks)
    setLinks(formLinks)
    setEditingLinks(false)
  }

  const relatedTasks = tasks.filter((t) => t.kodeMK === kode)
  const classType = getClassType(entry.tipeKelas || entry.ruang)
  const isOnlineClass =
    classType.label?.toLowerCase().includes('online') ||
    entry.ruang?.toLowerCase().includes('online') ||
    entry.ruang?.toLowerCase().includes('zoom') ||
    entry.tipeKelas === 'K2' ||
    entry.tipeKelas === 'GBK2'

  function handleNoteChange(value) {
    setNote(value)
    setItem(`${STORAGE_KEYS.courseNotes}:${kode}`, value)
    setNoteSaved(true)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => setNoteSaved(false), 2500)
  }

  const QUICK_NOTE_TAGS = [
    '💻 Bawa Laptop',
    '📝 Ada Kuis',
    '📚 Materi Bab Baru',
    '⏰ Jam Khusus',
    '👥 Tugas Kelompok',
  ]

  function appendTag(tag) {
    const next = note ? `${note}\n• ${tag}: ` : `• ${tag}: `
    handleNoteChange(next)
  }

  function handleCopyNote() {
    if (!note) return
    navigator.clipboard.writeText(note)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClearNote() {
    handleNoteChange('')
  }

  function handleReminderToggle() {
    const next = !reminderOn
    setItem(`${STORAGE_KEYS.courseReminders}:${kode}`, next)
    setReminderOn(next)
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] animate-[fade-in_200ms_var(--ease-standard)_both]"
        onClick={onClose}
        role="presentation"
      />
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-surface-container-lowest shadow-2xl animate-[sheet-up_300ms_var(--ease-emphasized)_both] tablet:inset-y-0 tablet:left-auto tablet:right-0 tablet:max-h-none tablet:w-[420px] tablet:animate-[panel-in_250ms_var(--ease-standard)_both] tablet:rounded-l-3xl tablet:rounded-tr-none tablet:border-l tablet:border-outline-variant/30 tablet:shadow-[-16px_0_40px_rgba(0,0,0,0.18)] dark:bg-surface-container-low">
        <div className="sticky top-0 z-10 bg-gradient-to-br from-primary to-primary-container p-lg text-on-primary shadow-level-1">
          <div className="mb-sm flex items-start justify-between">
            <span className="rounded-md bg-white/20 px-2.5 py-1 text-label-caps font-bold tracking-wide">{entry.kodeMK}</span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
            >
              <Icon name="close" size={22} />
            </button>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{course?.namaMK ?? entry.kodeMK}</h2>
          <p className="mt-1 text-body-sm opacity-90 font-medium">
            {entry.hari}, {entry.jamMulai} - {entry.jamSelesai} WIB
          </p>
        </div>

        <div className="space-y-md p-lg">
          {/* Back-to-Back Class Transition Warning */}
          {transition && (
            <div className="rounded-2xl border border-orange-500/35 bg-orange-500/10 p-3.5 space-y-1.5 dark:bg-orange-500/15">
              <div className="flex items-center gap-2 text-orange-950 dark:text-orange-200 font-extrabold text-body-xs">
                <Icon name="directions_run" size={17} className="text-orange-600 dark:text-orange-400 shrink-0" />
                <span>Peringatan Pindah Ruang Berurutan</span>
              </div>
              <p className="text-body-xs text-orange-950 dark:text-orange-100 leading-relaxed font-medium">
                {transition.type === 'incoming' ? (
                  <>
                    Kelas ini dimulai <strong>{transition.gapMinutes === 0 ? 'langsung tanpa jeda' : `${transition.gapMinutes} menit`}</strong> setelah kelas sebelumnya di <strong>{transition.fromRoom}</strong>. Disarankan bersiap lebih awal agar tidak terlambat.
                  </>
                ) : (
                  <>
                    Setelah kelas ini selesai, Anda memiliki kelas berikutnya di <strong>{transition.toRoom}</strong> dengan jeda waktu <strong>{transition.gapMinutes === 0 ? '0 menit (langsung)' : `${transition.gapMinutes} menit`}</strong>.
                  </>
                )}
              </p>
            </div>
          )}

          {/* Tautan Perkuliahan Cepat (LMS, Zoom & WA Grup Kelas) */}
          <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/60 dark:bg-surface-container-high/40 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon name="link" size={16} className="text-primary" />
                <h3 className="text-body-sm font-bold text-on-surface">Tautan Perkuliahan</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormLinks({
                    lmsUrl: links.lmsUrl || '',
                    meetingUrl: links.meetingUrl || '',
                    waGroupUrl: links.waGroupUrl || '',
                  })
                  setEditingLinks(!editingLinks)
                }}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Icon name={editingLinks ? 'close' : 'edit'} size={12} />
                <span>{editingLinks ? 'Tutup' : 'Atur Link'}</span>
              </button>
            </div>

            {editingLinks ? (
              <form onSubmit={handleSaveLinks} className="space-y-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-0.5">
                    🏫 LMS / Classroom / GDrive
                  </label>
                  <input
                    type="url"
                    value={formLinks.lmsUrl}
                    onChange={(e) => setFormLinks((prev) => ({ ...prev, lmsUrl: e.target.value }))}
                    placeholder="https://classroom.google.com/..."
                    className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-0.5">
                    📹 Link Meeting (Zoom / Meet)
                  </label>
                  <input
                    type="url"
                    value={formLinks.meetingUrl}
                    onChange={(e) => setFormLinks((prev) => ({ ...prev, meetingUrl: e.target.value }))}
                    placeholder="https://zoom.us/j/... atau https://meet.google.com/..."
                    className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-0.5">
                    💬 Grup WA Mata Kuliah / Komti
                  </label>
                  <input
                    type="url"
                    value={formLinks.waGroupUrl}
                    onChange={(e) => setFormLinks((prev) => ({ ...prev, waGroupUrl: e.target.value }))}
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingLinks(false)}
                    className="px-3 py-1 rounded-xl text-[11px] font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 rounded-xl bg-primary text-on-primary text-[11px] font-bold shadow-xs hover:bg-primary/90 cursor-pointer"
                  >
                    Simpan Tautan
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 1. LMS / Classroom Link */}
                {links.lmsUrl ? (
                  <a
                    href={links.lmsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-1.5 p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-900 dark:text-blue-200 border border-blue-500/25 transition-all shadow-2xs font-bold text-body-xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon name="school" size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate">LMS / Materi</span>
                    </div>
                    <Icon name="open_in_new" size={11} className="opacity-70 group-hover:opacity-100 shrink-0" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingLinks(true)}
                    className="flex items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary transition-colors text-[10.5px] font-semibold cursor-pointer"
                  >
                    <Icon name="add" size={13} />
                    <span>LMS / Materi</span>
                  </button>
                )}

                {/* 2. Zoom / Meet Link */}
                {links.meetingUrl || isOnlineClass ? (
                  <a
                    href={links.meetingUrl || 'https://zoom.us/join'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-1.5 p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-950 dark:text-indigo-200 border border-indigo-500/25 transition-all shadow-2xs font-bold text-body-xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon name="videocam" size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="truncate">{links.meetingUrl ? 'Zoom / Meet' : 'Buka Zoom'}</span>
                    </div>
                    <Icon name="open_in_new" size={11} className="opacity-70 group-hover:opacity-100 shrink-0" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingLinks(true)}
                    className="flex items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary transition-colors text-[10.5px] font-semibold cursor-pointer"
                  >
                    <Icon name="add" size={13} />
                    <span>Zoom / Meet</span>
                  </button>
                )}

                {/* 3. WhatsApp Group Link */}
                {links.waGroupUrl ? (
                  <a
                    href={links.waGroupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-1.5 p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 border border-emerald-500/25 transition-all shadow-2xs font-bold text-body-xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon name="groups" size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">WA Kelas</span>
                    </div>
                    <Icon name="open_in_new" size={11} className="opacity-70 group-hover:opacity-100 shrink-0" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingLinks(true)}
                    className="flex items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary transition-colors text-[10.5px] font-semibold cursor-pointer"
                  >
                    <Icon name="add" size={13} />
                    <span>Grup WA</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-outline-variant/25 bg-surface-container-low/60 dark:bg-surface-container-high/40 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
              <Icon name="person" size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Dosen Pengampu</p>
              <p className="text-body-sm font-bold text-on-surface mt-0.5">{course?.dosen ?? 'Dosen belum ditentukan'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/60 dark:bg-surface-container-high/40 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                    <Icon name="meeting_room" size={14} className="text-secondary" />
                    <span>Ruangan</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setRoomModalOpen(true)}
                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                    title="Lihat Denah Lantai & Lokasi"
                  >
                    <Icon name="explore" size={12} />
                    <span>Lokasi</span>
                  </button>
                </div>
                <p className="text-body-sm font-bold text-on-surface truncate">
                  {formatRuang(entry.ruang, entry.tipeKelas)}
                </p>
              </div>
              {classType.label && (
                <div className="mt-1.5 flex items-center justify-between">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${TONE_CLASSES[classType.tone] ?? 'bg-surface-container text-on-surface-variant'}`}>
                    {classType.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRoomModalOpen(true)}
                    className="text-[10px] font-bold text-secondary hover:underline cursor-pointer"
                  >
                    Panduan →
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/60 dark:bg-surface-container-high/40 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 mb-1">
                <Icon name="book" size={14} className="text-secondary" />
                Beban SKS
              </p>
              <p className="text-body-sm font-bold text-on-surface">
                {course?.sks ? `${course.sks} SKS` : '2 SKS'}
              </p>
              <span className="inline-block mt-1.5 text-[10px] text-on-surface-variant font-semibold">
                Mata Kuliah Wajib
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/60 dark:bg-surface-container-high/40 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 mb-1.5">
              <Icon name="call" size={14} className="text-secondary" />
              Kontak WhatsApp Dosen
            </p>
            {course?.kontakDosen ? (
              <div className="flex items-center justify-between gap-2">
                <a
                  href={formatWhatsAppUrl(course.kontakDosen)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-body-sm font-bold text-primary hover:underline"
                  title="Buka Chat WhatsApp"
                >
                  <Icon name="chat" size={16} />
                  <span>{course.kontakDosen}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(course.kontakDosen)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="flex h-8 items-center gap-1 px-2.5 rounded-full bg-surface-container-high text-[11px] font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
                  title={copied ? 'Tersalin!' : 'Salin Nomor'}
                >
                  <Icon name={copied ? 'check' : 'content_copy'} size={13} className={copied ? 'text-emerald-500' : ''} />
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            ) : (
              <span className="text-body-sm text-on-surface-variant font-medium">Kontak belum tersedia</span>
            )}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-outline-variant/25 bg-surface-container-low/40 dark:bg-surface-container-high/30 px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <Icon name="notifications_active" size={18} className={reminderOn ? 'text-primary' : 'text-on-surface-variant'} />
              <span className="text-body-sm font-semibold text-on-surface">Pengingat 15 menit sebelum kelas</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reminderOn}
              aria-label={`Pengingat untuk ${course?.namaMK ?? kode}`}
              onClick={handleReminderToggle}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                reminderOn ? 'bg-primary' : 'bg-surface-variant'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all shadow-xs ${
                  reminderOn ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Tracker Presensi & Sisa Jatah Absen */}
          <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/60 dark:bg-surface-container-high/40 p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon name="fact_check" size={18} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-title-sm font-bold text-on-surface">Presensi & Sisa Absen</h3>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  attendanceInfo.statusTier === 'danger'
                    ? 'bg-error text-white shadow-xs'
                    : attendanceInfo.statusTier === 'warning'
                    ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <Icon
                  name={
                    attendanceInfo.statusTier === 'danger'
                      ? 'error'
                      : attendanceInfo.statusTier === 'warning'
                      ? 'warning'
                      : 'check_circle'
                  }
                  size={13}
                />
                <span>
                  {attendanceInfo.statusTier === 'danger'
                    ? 'Jatah Absen Habis (0x)!'
                    : `Sisa Jatah: ${attendanceInfo.remainingAbsences}x lagi`}
                </span>
              </span>
            </div>

            {/* Progress Bar & Rate */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-body-xs font-semibold text-on-surface-variant">
                <span>Kehadiran: <strong>{attendanceInfo.counts.hadir}</strong> / {attendanceInfo.counts.totalFilled || 0} sesi tercatat</span>
                <span className={attendanceInfo.attendancePercent >= 75 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-error font-bold'}>
                  {attendanceInfo.attendancePercent}% (Syarat UAS: 75%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    attendanceInfo.attendancePercent >= 75 ? 'bg-emerald-500' : 'bg-error'
                  }`}
                  style={{ width: `${Math.min(100, attendanceInfo.attendancePercent)}%` }}
                />
              </div>
            </div>

            {/* Quick Increment Action Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => quickIncrement(kode, 'hadir')}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold transition-all cursor-pointer"
              >
                <span className="text-body-xs font-extrabold">+ Hadir</span>
                <span className="text-[10px] opacity-80">{attendanceInfo.counts.hadir}</span>
              </button>
              <button
                type="button"
                onClick={() => quickIncrement(kode, 'izin')}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-bold transition-all cursor-pointer"
              >
                <span className="text-body-xs font-extrabold">+ Izin</span>
                <span className="text-[10px] opacity-80">{attendanceInfo.counts.izin}</span>
              </button>
              <button
                type="button"
                onClick={() => quickIncrement(kode, 'sakit')}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-800 dark:text-amber-300 border border-amber-500/20 font-bold transition-all cursor-pointer"
              >
                <span className="text-body-xs font-extrabold">+ Sakit</span>
                <span className="text-[10px] opacity-80">{attendanceInfo.counts.sakit}</span>
              </button>
              <button
                type="button"
                onClick={() => quickIncrement(kode, 'alpa')}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-error/10 hover:bg-error/20 active:scale-95 text-error border border-error/20 font-bold transition-all cursor-pointer"
              >
                <span className="text-body-xs font-extrabold">+ Alpa</span>
                <span className="text-[10px] opacity-80">{attendanceInfo.counts.alpa}</span>
              </button>
            </div>

            {/* 16-Meeting Grid */}
            <div className="pt-2 border-t border-outline-variant/15">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Grid 16 Pertemuan
                </span>
                {attendanceInfo.counts.totalFilled > 0 && (
                  <button
                    type="button"
                    onClick={() => resetCourseAttendance(kode)}
                    className="text-[11px] font-bold text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {Array.from({ length: 16 }, (_, i) => i + 1).map((num) => {
                  const status = attendanceInfo.sessions[num]
                  let bg = 'bg-surface-container text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-high'
                  let label = num
                  if (status === 'hadir') {
                    bg = 'bg-emerald-500 text-white font-bold shadow-2xs'
                    label = 'H'
                  } else if (status === 'izin') {
                    bg = 'bg-blue-500 text-white font-bold shadow-2xs'
                    label = 'I'
                  } else if (status === 'sakit') {
                    bg = 'bg-amber-500 text-white font-bold shadow-2xs'
                    label = 'S'
                  } else if (status === 'alpa') {
                    bg = 'bg-error text-white font-bold shadow-2xs'
                    label = 'A'
                  }

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        const nextStatus =
                          !status
                            ? 'hadir'
                            : status === 'hadir'
                            ? 'izin'
                            : status === 'izin'
                            ? 'sakit'
                            : status === 'sakit'
                            ? 'alpa'
                            : null
                        setMeetingStatus(kode, num, nextStatus)
                      }}
                      title={`Pertemuan ${num}: ${status ? status.toUpperCase() : 'Belum diisi'} (Klik untuk ubah)`}
                      className={`flex h-8 w-full items-center justify-center rounded-xl text-body-xs font-bold transition-all active:scale-95 cursor-pointer ${bg}`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] text-on-surface-variant text-center mt-1.5">
                Klik nomor sesi: <strong>H (Hadir)</strong> &rarr; <strong>I (Izin)</strong> &rarr; <strong>S (Sakit)</strong> &rarr; <strong>A (Alpa)</strong>
              </p>
            </div>
          </div>

          <section className="pt-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-title-sm font-bold text-on-surface">
                <Icon name="sticky_note_2" size={18} className="text-amber-500" />
                Catatan Sesi Kuliah
              </h3>
              <div className="flex items-center gap-2">
                {noteSaved && (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Icon name="check" size={13} />
                    Tersimpan
                  </span>
                )}
                {note && (
                  <>
                    <button
                      type="button"
                      onClick={handleCopyNote}
                      className="text-[11px] font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center gap-0.5"
                    >
                      <Icon name={copied ? 'check' : 'content_copy'} size={12} />
                      <span>{copied ? 'Tersalin' : 'Salin'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearNote}
                      className="text-[11px] font-bold text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                    >
                      Hapus
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Tag Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                Pintasan:
              </span>
              {QUICK_NOTE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => appendTag(tag)}
                  className="px-2 py-0.5 rounded-lg bg-surface-container text-[10.5px] font-semibold text-on-surface hover:bg-amber-500/20 hover:text-amber-900 dark:hover:text-amber-200 border border-outline-variant/25 transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>

            <textarea
              id="course-note-input"
              name="course-note"
              aria-label="Catatan kuliah"
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Tulis catatan penting perkuliahan, instruksi dosen, tugas, atau kuis..."
              className="min-h-[92px] w-full resize-none rounded-2xl border border-outline-variant/35 bg-surface-container-lowest p-3.5 text-body-sm text-on-surface placeholder:text-outline-variant focus:border-primary focus:outline-none dark:bg-surface-container-high/40 shadow-xs leading-relaxed"
            />
          </section>

          <section className="pt-1">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-title-sm font-bold text-on-surface">
                <Icon name="assignment" size={18} className="text-primary" />
                Tugas Terkait
              </h3>
              <Link
                to="/tugas"
                state={{ createKodeMK: kode }}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 text-[11px] font-bold transition-colors"
              >
                <Icon name="add" size={14} />
                <span>Tambah Tugas</span>
              </Link>
            </div>
            {relatedTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant/40 p-4 text-center">
                <p className="text-body-xs text-on-surface-variant font-medium">
                  Belum ada tugas untuk mata kuliah ini.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {relatedTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-sm rounded-2xl bg-surface-container-high/50 px-3.5 py-2.5 border border-outline-variant/20 shadow-xs"
                  >
                    <span
                      className={`min-w-0 truncate text-body-sm font-medium ${
                        task.selesai
                          ? 'text-outline line-through'
                          : 'text-on-surface'
                      }`}
                    >
                      {task.judul}
                    </span>
                    <span className="shrink-0 text-label-caps font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md">
                      {task.deadline ?? '-'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <RoomLocationModal
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        ruang={entry.ruang}
        tipeKelas={entry.tipeKelas}
        currentCourseName={course?.namaMK ?? entry.kodeMK}
      />
    </>
  )
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
        <Icon name="calendar_month" size={15} className="text-primary shrink-0" />
        <span className="whitespace-nowrap font-bold text-body-xs tablet:text-body-sm">TA {selectedTA}</span>
        <span
          className={`hidden tablet:inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
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
