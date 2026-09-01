import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../../hooks/useApp'
import { useFirestore } from '../../hooks/useFirestore'
import { Icon } from '../../components/Icon'
import { ClassCard } from '../../components/ClassCard'
import ClassDetailPanel from '../../components/schedule/ClassDetailPanel'
import TahunAjaranDropdown from '../../components/schedule/TahunAjaranDropdown'
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
  TONE_ICONS,
  TONE_CHIP_BG_CLASSES,
  TONE_SHADOW_CLASSES,
  TONE_CARD_BORDER_CLASSES,
  TONE_TIME_PILL_CLASSES,
  TONE_ICON_COLOR_CLASSES,
  getClassType,
} from '../../lib/classTypes'
import { expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'
import { useCustomSchedule } from '../../hooks/useCustomSchedule'
import { CustomScheduleModal } from '../../components/student/CustomScheduleModal'
import { AttendanceOverviewModal } from '../../components/student/AttendanceOverviewModal'
import { AnnouncementBanner } from '../../components/student/AnnouncementBanner'
import { CourseNotesModal } from '../../components/student/CourseNotesModal'
import { PrintScheduleModal } from '../../components/student/PrintScheduleModal'
import { KrsSimulatorModal } from '../../components/student/KrsSimulatorModal'

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
    const byFakultas = (e) => {
      // Hierarki TA->Ganjil/Genap->Semester: fakultasId is optional for legacy docs
      // If doc has fakultasId and user has fakultasId, must match; otherwise allow (legacy fallback)
      if (!e.fakultasId) return true
      if (!fakultasId) return true
      return String(e.fakultasId) === String(fakultasId)
    }
    if (loading) return []
    if (isCustomMode) {
      const pool = allPublishedJadwal.length > 0 ? allPublishedJadwal : sampleSchedule
      const customSet = new Set(customScheduleIds)
      const matches = pool.filter((e) => customSet.has(e.id))
      return matches.filter((e) => String(e.tahunAjaran ?? currentTA) === selectedTA && byFakultas(e))
    }

    const pool = [...jadwal, ...archivedJadwal]
    const active = pool.filter(
      (e) => String(e.tahunAjaran ?? currentTA) === selectedTA && byFakultas(e),
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
    return `${mFirst} - ${mLast} ${y}`
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
  const [gridBodyHeight, setGridBodyHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return Math.max(380, window.innerHeight - 320)
    }
    return 580
  })

  useLayoutEffect(() => {
    const el = gridBodyRef.current
    if (!el) return
    const update = () => {
      const h = el.clientHeight
      if (h > 50) setGridBodyHeight(h)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  // pxPerHour dinamis: proporsional sempurna pas dengan tinggi viewport (availableHeight / totalHours) tanpa scrollbar
  const totalHours = Math.max(1, (rangeEnd - rangeStart) / 60)
  const safeGridHeight = gridBodyHeight > 50 ? gridBodyHeight : (typeof window !== 'undefined' ? Math.max(380, window.innerHeight - 320) : 580)
  const pxPerHour = Math.max(28, safeGridHeight / totalHours)
  const gridHeight = safeGridHeight

  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const sampleStart = 480 // 08:00
    const sampleEnd = 580   // 09:40
    console.log('[WeeklySchedule Debug Grid]', {
      containerHeight: gridBodyHeight,
      safeGridHeight,
      totalHours,
      pxPerHour,
      sampleCard: {
        jam: '08:00 - 09:40',
        top: ((sampleStart - rangeStart) / 60) * pxPerHour,
        height: Math.max(((sampleEnd - sampleStart) / 60) * pxPerHour - 4, 48),
      }
    })
  }

  function openDetail(entry) {
    setDetailEntry(entry)
  }

  const toolbarContent = (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-surface-container-low/50 dark:bg-surface-container-high/20 border-b border-outline-variant/20 flex-nowrap overflow-x-auto no-scrollbar shrink-0 w-full">
      {/* Left: Mode Switcher & 4 Action Icon-Only Buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Mode Switcher */}
        <div className="flex items-center rounded-xl bg-surface-container-high/70 dark:bg-surface-container-highest/40 p-0.5 border border-outline-variant/30 shrink-0">
          <button
            type="button"
            onClick={() => setScheduleMode('regular')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-body-xs font-bold transition-all cursor-pointer ${
              !isCustomMode
                ? 'bg-surface shadow-xs text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon name="school" size={15} />
            <span>Jadwal Paket</span>
          </button>
          <button
            type="button"
            onClick={() => setScheduleMode('custom')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-body-xs font-bold transition-all cursor-pointer ${
              isCustomMode
                ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 shadow-xs border border-amber-500/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon name="star" size={15} className={isCustomMode ? 'text-amber-500' : ''} />
            <span>Jadwal Kustom {customScheduleIds.length > 0 ? `(${customScheduleIds.length})` : ''}</span>
          </button>
        </div>

        {isCustomMode && (
          <button
            type="button"
            onClick={() => setCustomModalOpen(true)}
            className="flex items-center gap-1 rounded-xl bg-amber-500 text-slate-900 px-2.5 py-1 text-body-xs font-bold hover:bg-amber-400 active:opacity-80 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Icon name="tune" size={14} />
            <span>Atur Matkul</span>
          </button>
        )}

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-outline-variant/30 shrink-0" />

        {/* 4 Action Buttons (Kotak 32x32px, Icon Saja, Tooltip saat hover, warna ikon berbeda) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setAttendanceModalOpen(true)}
            title="Rekap Presensi — Lihat rekapitulasi kehadiran & sisa jatah absen seluruh mata kuliah"
            aria-label="Rekap Presensi"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 active:opacity-80 transition-all shadow-2xs cursor-pointer"
          >
            <Icon name="fact_check" size={16} />
          </button>

          <button
            type="button"
            onClick={() => setNotesModalOpen(true)}
            title="Semua Catatan — Lihat seluruh catatan perkuliahan semester ini"
            aria-label="Semua Catatan"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 active:opacity-80 transition-all shadow-2xs cursor-pointer"
          >
            <Icon name="sticky_note_2" size={16} />
          </button>

          <button
            type="button"
            onClick={() => setPrintModalOpen(true)}
            title="Cetak PDF — Unduh atau cetak jadwal format meja belajar / kartu saku"
            aria-label="Cetak PDF"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 active:opacity-80 transition-all shadow-2xs cursor-pointer"
          >
            <Icon name="print" size={16} />
          </button>

          <button
            type="button"
            onClick={() => setKrsSimulatorOpen(true)}
            title="Simulator KRS — Simulasikan pemilihan KRS & cek bentrok waktu semester baru"
            aria-label="Simulator KRS"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 active:opacity-80 transition-all shadow-2xs cursor-pointer"
          >
            <Icon name="science" size={16} />
          </button>
        </div>
      </div>

      {/* Right: Legend Acuan Warna Tipe Kelas (4 dot warna + label) */}
      <div className="flex items-center gap-2.5 tablet:gap-3 shrink-0 text-[11px] font-semibold text-on-surface-variant bg-surface-container/50 dark:bg-surface-container-high/40 px-3 py-1 rounded-xl border border-outline-variant/20">
        <span className="text-[10px] uppercase font-bold text-on-surface-variant/70 tracking-wider">Tipe:</span>
        <div className="flex items-center gap-1.5" title="K1: Kelas Reguler / Offline di Ruangan Fisik">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-2xs" />
          <span className="text-emerald-950 dark:text-emerald-200">K1 (Offline)</span>
        </div>
        <div className="flex items-center gap-1.5" title="K2: Kelas Karyawan / Online (Zoom/Google Meet)">
          <span className="h-2 w-2 rounded-full bg-blue-500 shadow-2xs" />
          <span className="text-blue-950 dark:text-blue-200">K2 (Online)</span>
        </div>
        <div className="flex items-center gap-1.5" title="HB: Hybrid (Kombinasi tatap muka & daring)">
          <span className="h-2 w-2 rounded-full bg-violet-500 shadow-2xs" />
          <span className="text-violet-950 dark:text-violet-200">HB (Hybrid)</span>
        </div>
        <div className="flex items-center gap-1.5" title="GBK: Kelas Gabungan Lintas Prodi/Angkatan">
          <span className="h-2 w-2 rounded-full bg-amber-500 shadow-2xs" />
          <span className="text-amber-950 dark:text-amber-200">GBK (Gabung)</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-3 w-full max-w-full overflow-x-hidden">
      <header className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-3 tablet:px-4 tablet:py-3 shadow-xs flex flex-col gap-3.5 tablet:flex-row tablet:items-center tablet:justify-between w-full">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Icon name="calendar_month" size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl tablet:text-2xl font-bold tracking-tight text-on-surface">
                Jadwal Mingguan
              </h2>
              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-bold border border-primary/20">
                Aktif
              </span>
            </div>
            <p className="mt-0.5 text-body-xs text-on-surface-variant font-medium truncate">
              {program} · Semester {semester} · TA {selectedTA}
              {viewingArchive && ' · Arsip'}
            </p>
          </div>
        </div>

        {/* Controls Desktop & Tablet */}
        <div className="hidden tablet:flex items-center gap-2 shrink-0">
          <div className="hidden desktop:inline-flex items-center rounded-full border border-outline-variant/30 bg-surface-container-high/50 p-0.5 shadow-xs shrink-0">
            <button
              type="button"
              onClick={() => {
                setViewDays('5')
                setItem('jadwal:viewDays', '5')
              }}
              className={`rounded-full px-3 py-1 text-[11.5px] font-bold transition-all cursor-pointer ${
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
              className={`rounded-full px-3 py-1 text-[11.5px] font-bold transition-all cursor-pointer ${
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
              className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors cursor-pointer shrink-0"
            >
              <Icon name="chevron_left" size={17} />
            </button>
            <span className="px-2.5 text-[11.5px] font-bold text-on-surface whitespace-nowrap">
              {weekRangeLabel}
            </span>
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              title="Minggu Berikutnya"
              aria-label="Minggu Berikutnya"
              className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors cursor-pointer shrink-0"
            >
              <Icon name="chevron_right" size={17} />
            </button>
            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary hover:bg-primary/25 transition-colors shrink-0 cursor-pointer"
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-high/60 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-primary border border-outline-variant/25 shadow-xs cursor-pointer"
            title="Bagikan / Ekspor Jadwal"
            aria-label="Bagikan atau ekspor jadwal"
          >
            <Icon name="ios_share" size={17} />
          </button>
        </div>
      </header>

      {/* Broadcast Pengumuman Kampus & Kuliah Pengganti */}
      <AnnouncementBanner currentProgram={program} currentSemester={semester} />

      {/* Mobile & Tablet View (<1024px) */}
      <div className="desktop:hidden flex flex-col gap-3 w-full">
        {/* Mode Switcher & Aksi */}
        <div className="rounded-2xl bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/20 shadow-xs overflow-hidden">
          {toolbarContent}
        </div>

        {/* Mobile Controls (<600px): Baris 1 Aligned (Bulan di Kiri, TA & Share di Kanan) */}
        <div className="flex flex-col gap-2 tablet:hidden w-full max-w-full">
          {/* Row 1: Bulan (Kiri) & TA Selector + Share (Kanan) */}
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

        {/* Bar 2: Segmented Day Grid */}
        <div
          className="grid gap-1.5 w-full max-w-full"
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
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
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

        <div>
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
      </div>

      {/* Desktop Calendar View (>=1024px) */}
      <div className="hidden desktop:block w-full">
        {!loading && scheduleSource.length === 0 && (
          <div className="mb-3 flex items-center gap-sm rounded-2xl bg-info-container/40 px-md py-sm text-body-sm text-info dark:bg-info-container/20">
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
          className="overflow-hidden h-[calc(100vh-190px)] min-h-[460px] rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-sm relative flex flex-col"
        >
          {/* Mode Switcher, Actions & Legend (Desktop) */}
          {toolbarContent}
            <div
              className="grid sticky top-0 z-30 shrink-0 bg-surface-container-lowest dark:bg-surface-container-low shadow-sm border-b border-outline-variant/40"
              style={{ gridTemplateColumns: `64px repeat(${activeWeekDays.length}, minmax(0, 1fr))` }}
            >
              <div className="p-3 text-center text-[10.5px] font-bold uppercase tracking-wider text-on-surface-variant/60 flex items-center justify-center sticky left-0 z-40 bg-surface-container-lowest dark:bg-surface-container-low border-r border-outline-variant/30 select-none">
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

            <div className="flex-1 min-h-0 overflow-hidden relative">
              <div
                ref={gridBodyRef}
                className="relative grid h-full w-full"
                style={{
                  gridTemplateColumns: `64px repeat(${activeWeekDays.length}, minmax(0, 1fr))`
                }}
              >
                <div className="relative border-r border-outline-variant/30 sticky left-0 z-20 bg-surface-container-lowest/95 dark:bg-surface-container-low/95 backdrop-blur-xs select-none">
                  {hourMarks.map((m) => {
                    const isFirst = m === rangeStart
                    const top = ((m - rangeStart) / 60) * pxPerHour
                    return (
                      <div
                        key={m}
                        className={`absolute inset-x-0 flex items-center justify-end pr-2.5 pointer-events-none ${
                          isFirst ? 'top-1.5' : '-translate-y-1/2'
                        }`}
                        style={isFirst ? undefined : { top }}
                      >
                        <span className="text-[11.5px] font-normal text-on-surface-variant/65 tabular-nums leading-none tracking-tight">
                          {String(Math.floor(m / 60)).padStart(2, '0')}:00
                        </span>
                      </div>
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
                          const durationHeight = ((end - start) / 60) * pxPerHour - 4
                          // Opsi 1: min-height 92px berbasis konten aktual (badge + 2 baris judul + ruangan + padding)
                          const height = Math.max(durationHeight, 92)
                          const course = courseMap.get(entry.kodeMK)
                          const conflicted = conflictedIds.has(entry.id)
                          const noteText = getItem(`${STORAGE_KEYS.courseNotes}:${entry.kodeMK}`, '')
                          const transition = allTransitions.get(entry.id)
                          const classType = getClassType(entry.tipeKelas)
                          const borderClass = TONE_CARD_BORDER_CLASSES[classType.tone] ?? TONE_CARD_BORDER_CLASSES.neutral
                          const iconName = TONE_ICONS[classType.tone] ?? 'corporate_fare'
                          const shadowClass = TONE_SHADOW_CLASSES[classType.tone]
                          const timePillClass = TONE_TIME_PILL_CLASSES[classType.tone]
                          const iconColor = TONE_ICON_COLOR_CLASSES[classType.tone]
                          const text = TONE_TEXT_CLASSES[classType.tone]
                          const subtext = TONE_SUBTEXT_CLASSES[classType.tone]
                          const isOnline =
                            entry.tipeKelas === 'K2' ||
                            String(entry.ruang || '').toLowerCase().includes('zoom') ||
                            String(entry.ruang || '').toLowerCase().includes('online')

                          return (
                            <button
                              key={entry.id}
                              type="button"
                              onClick={() => openDetail(entry)}
                              style={{ top: top + 2, minHeight: height, height: 'auto' }}
                              className={`absolute inset-x-1 z-10 rounded-2xl p-2.5 text-left transition-shadow duration-200 hover:z-30 hover:shadow-lg flex flex-col justify-between cursor-pointer ${
                                TONE_BG_CLASSES[classType.tone]
                              } ${borderClass} ${shadowClass} ${conflicted ? 'ring-2 ring-error/60' : ''}`}
                              title={`${course?.namaMK ?? entry.kodeMK} · ${entry.jamMulai}-${entry.jamSelesai} · ${formatRuang(entry.ruang, entry.tipeKelas)}`}
                            >
                              {/* 1. Baris Pertama: Ikon tipe kelas di kiri & Badge Jam (pill solid) di kanan */}
                              <div className="flex items-center justify-between w-full shrink-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Icon name={iconName} size={16} className={iconColor} />
                                  <span className={`text-[11px] font-bold uppercase tracking-wider ${iconColor}`}>
                                    {entry.tipeKelas || 'K1'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {transition && (
                                    <span
                                      className="flex h-4 items-center gap-0.5 px-1 rounded-full bg-orange-500/20 text-orange-800 dark:text-orange-300 text-[9px] font-bold border border-orange-500/30"
                                      title={transition.message}
                                    >
                                      <Icon name="directions_run" size={9} />
                                    </span>
                                  )}
                                  {noteText && (
                                    <span
                                      className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                      title={`Catatan: ${noteText}`}
                                    >
                                      <Icon name="sticky_note_2" size={9} />
                                    </span>
                                  )}
                                  {conflicted && <Icon name="warning" size={13} className="shrink-0 text-error" />}
                                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight shadow-xs ${timePillClass}`}>
                                    {entry.jamMulai} - {entry.jamSelesai}
                                  </span>
                                </div>
                              </div>

                              {/* 2. Baris Kedua: Nama Mata Kuliah Rata Tengah (14-15px font-bold, 2 baris wrap tanpa tertimpa) */}
                              <h3 className={`my-auto py-1 text-center text-[13.5px] tablet:text-[14.5px] font-bold tracking-tight leading-snug whitespace-normal break-words line-clamp-2 ${text}`}>
                                {course?.namaMK ?? entry.kodeMK}
                              </h3>

                              {/* 3. Baris Terakhir: Ikon Lokasi + Nama Ruang Kelas */}
                              <div className={`flex items-center justify-center gap-1 text-[11.5px] font-normal leading-tight opacity-90 shrink-0 ${subtext}`}>
                                <Icon name={isOnline ? 'videocam' : 'location_on'} size={12} className="shrink-0" />
                                <span className="truncate">{formatRuang(entry.ruang, entry.tipeKelas)}</span>
                              </div>
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
        <ClassDetailPanel
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
