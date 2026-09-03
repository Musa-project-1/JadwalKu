import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { useFirestore } from '../../hooks/useFirestore'
import { Icon } from '../../components/Icon'
import { Skeleton } from '../../components/Skeleton'
import { expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'
import { downloadExamIcs } from '../../lib/icsExport'
import { RoomLocationModal } from '../../components/student/RoomLocationModal'
import TahunAjaranDropdown from '../../components/schedule/TahunAjaranDropdown'

const MODE_ICONS = {
  Offline: 'person_outline',
  Online: 'laptop_mac',
  'Take home': 'home_work',
}

const JENIS_STRIPE = {
  UTS: 'bg-blue-500',
  UAS: 'bg-amber-500',
}

export default function Exams() {
  const { program, semester, language, t } = useApp()
  const [jenis, setJenis] = useState('UTS')
  const [roomModalTarget, setRoomModalTarget] = useState(null)

  const { data: settingsDocs } = useFirestore('settings')
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

  const { data: ujian, loading } = useFirestore('ujian', [
    ['prodi', '==', program ?? ''],
    ['semester', '==', Number(semester) || 0],
    ['status', '==', 'published'],
  ])
  const { data: archivedUjian } = useFirestore('ujian', [
    ['prodi', '==', program ?? ''],
    ['semester', '==', Number(semester) || 0],
    ['status', '==', 'archived'],
  ])

  const allTAs = useMemo(() => {
    const set = new Set([currentTA])
    const app = settingsDocs.find((d) => d.id === 'app')
    if (Array.isArray(app?.availableTAs)) app.availableTAs.forEach((t) => set.add(String(t)))
    ;[...ujian, ...archivedUjian].forEach((e) => {
      const t = String(e.tahunAjaran ?? '').trim()
      if (t) set.add(t)
    })
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [settingsDocs, ujian, archivedUjian, currentTA])

  const filtered = useMemo(() => {
    const pool = [...ujian, ...archivedUjian]
    return pool.filter(
      (e) =>
        e.jenis === jenis &&
        String(e.tahunAjaran ?? currentTA) === selectedTA,
    )
  }, [ujian, archivedUjian, jenis, currentTA, selectedTA])

  const { data: mataKuliah } = useFirestore('mataKuliah')
  const courseMap = useMemo(() => {
    return new Map(mataKuliah.map((c) => [c.kodeMK, c]))
  }, [mataKuliah])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  const nextExam = useMemo(() => {
    if (filtered.length === 0) return null
    const upcoming = filtered
      .filter((e) => daysUntil(e.tanggal) >= 0)
      .sort((a, b) => {
        const da = daysUntil(a.tanggal)
        const db = daysUntil(b.tanggal)
        if (da !== db) return da - db
        return String(a.jam ?? '').localeCompare(String(b.jam ?? ''))
      })
    return upcoming[0] ?? null
  }, [filtered])

  const urgentExams = useMemo(() => {
    return filtered
      .filter((e) => {
        const d = daysUntil(e.tanggal)
        return d >= 0 && d <= 3
      })
      .sort((a, b) => daysUntil(a.tanggal) - daysUntil(b.tanggal))
      .slice(0, 3)
  }, [filtered])

  function handleExportExamIcs() {
    downloadExamIcs(filtered, {
      prodi: program,
      semester,
      jenis,
      courseMap,
    })
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-full overflow-x-hidden animate-fade-in">
      {/* 1. Header Halaman — Structured 1:1 like WeeklySchedule & Tasks */}
      <header className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-3 tablet:px-4 tablet:py-3 shadow-level-1 flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between w-full">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-level-1">
            <Icon name="quiz" size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-headline-lg-mobile tablet:text-headline-lg font-bold tracking-tight text-on-surface">
                {t ? t('exams.title') : 'Jadwal Ujian'}
              </h2>
              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-label-caps font-bold border border-primary/20">
                {filtered.length > 0 ? (language === 'en' ? `${filtered.length} Courses` : `${filtered.length} Mata Uji`) : (language === 'en' ? '0 Courses' : '0 Mata Uji')}
              </span>
            </div>
            <p className="mt-0.5 text-body-xs text-on-surface-variant font-medium truncate">
              {t ? t('exams.subtitle') : 'Jadwal UTS & UAS semester aktif'}
            </p>
          </div>
        </div>

        {/* Controls: UTS/UAS Switcher + Export .ics + TA Dropdown — 1:1 with WeeklySchedule/Tasks header controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap tablet:flex-nowrap">
          {/* Segmented Control UTS/UAS */}
          <div className="inline-flex items-center rounded-full border border-outline-variant/30 bg-surface-container-high/50 p-0.5 shadow-level-1 shrink-0">
            {['UTS', 'UAS'].map((j) => (
              <button
                key={j}
                type="button"
                onClick={() => setJenis(j)}
                className={`rounded-full px-4 py-1 text-label-caps font-bold transition-all cursor-pointer ${
                  jenis === j
                    ? 'bg-surface shadow-level-1 text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {j}
              </button>
            ))}
          </div>

          {/* Export Kalender Button */}
          <button
            type="button"
            onClick={handleExportExamIcs}
            disabled={filtered.length === 0}
            title={`Tambahkan Jadwal Ujian ${jenis} ke Kalender Smartphone (.ics)`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary text-body-xs font-bold border border-primary/25 transition-all shadow-level-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Icon name="event" size={15} />
            <span>{t ? t('exams.sync_cal') : 'Kalender HP (.ics)'}</span>
          </button>

          {/* Tahun Ajaran Dropdown */}
          <div className="shrink-0">
            <TahunAjaranDropdown
              selectedTA={selectedTA}
              onSelect={setSelectedTA}
              currentTA={currentTA}
              allTAs={allTAs}
            />
          </div>
        </div>
      </header>

      {/* 2. Secondary Toolbar — 1:1 with Tasks.jsx secondary toolbar (Mode Legend + Next Exam Summary) */}
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-3 tablet:px-4 tablet:py-2.5 shadow-level-1 flex flex-col tablet:flex-row tablet:items-center tablet:justify-between gap-3">
        {/* Left: Mode Legend (mirrors WeeklySchedule Tipe legend) */}
        <div className="flex items-center gap-2.5 tablet:gap-3 shrink-0 text-label-caps font-semibold text-on-surface-variant bg-surface-container/50 dark:bg-surface-container-high/40 px-3 py-1 rounded-xl border border-outline-variant/20 overflow-x-auto no-scrollbar">
          <span className="text-label-caps uppercase font-bold text-on-surface-variant/70 tracking-wider shrink-0">Mode:</span>
          <div className="flex items-center gap-1.5 shrink-0" title="Offline: Ujian tatap muka di ruangan fisik">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-level-1 shrink-0" />
            <span className="text-emerald-950 dark:text-emerald-200 whitespace-nowrap">Offline</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0" title="Online: Ujian daring via Zoom / LMS">
            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-level-1 shrink-0" />
            <span className="text-blue-950 dark:text-blue-200 whitespace-nowrap">Online</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0" title="Take home: Tugas rumah / proyek">
            <span className="h-2 w-2 rounded-full bg-amber-500 shadow-level-1 shrink-0" />
            <span className="text-amber-950 dark:text-amber-200 whitespace-nowrap">Take home</span>
          </div>
          <span className="hidden tablet:inline h-4 w-px bg-outline-variant/30 shrink-0" />
          <span className="hidden tablet:inline text-on-surface-variant/70 whitespace-nowrap">
            {jenis === 'UTS' ? 'Tengah Semester' : 'Akhir Semester'} · {filtered.length} terfilter
          </span>
        </div>

        {/* Right: Next Exam Countdown + Jenis Stripe Legend */}
        <div className="flex items-center gap-2 shrink-0 justify-between tablet:justify-end">
          {nextExam ? (
            <div className="flex items-center gap-2 text-body-xs font-semibold text-on-surface-variant bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl shadow-level-1">
              <Icon name="timer" size={15} className="text-primary shrink-0" />
              <span className="text-on-surface font-bold truncate max-w-[14ch] tablet:max-w-none">
                Terdekat: {nextExam.namaMK ?? nextExam.kodeMK}
              </span>
              <span className="hidden tablet:inline text-primary">·</span>
              <span className="text-primary font-extrabold whitespace-nowrap">
                {(() => {
                  const d = daysUntil(nextExam.tanggal)
                  if (d === 0) return 'Hari ini'
                  if (d === 1) return 'Besok'
                  return `${d} hari lagi`
                })()}
              </span>
            </div>
          ) : (
            <span className="text-body-xs font-semibold text-on-surface-variant">
              {filtered.length > 0 ? `${filtered.length} ujian ${jenis} · TA ${selectedTA}` : `TA ${selectedTA} · ${jenis}`}
            </span>
          )}
          <div className="hidden tablet:flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full shadow-level-1 ${jenis === 'UTS' ? 'bg-blue-500' : 'bg-amber-500'}`} />
            <span className="text-label-caps font-bold text-on-surface-variant">{jenis}</span>
          </div>
        </div>
      </div>

      {/* 3. Urgent Banner — mirrors Tasks.jsx highPriority banner (error/amber) */}
      {urgentExams.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-4 space-y-2 shadow-level-1">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-extrabold text-body-xs">
            <Icon name="priority_high" size={17} className="shrink-0 animate-bounce" />
            <span>Ujian Mendekat — Persiapkan diri!</span>
            <span className="ml-auto rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-label-caps font-extrabold">
              {urgentExams.length} dalam 3 hari
            </span>
          </div>
          <div className="grid grid-cols-1 tablet:grid-cols-3 gap-2">
            {urgentExams.map((exam) => {
              const d = daysUntil(exam.tanggal)
              const label = d === 0 ? 'Hari ini' : d === 1 ? 'Besok' : `${d} hari lagi`
              return (
                <div
                  key={exam.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container-low border border-amber-500/25 shadow-level-1 hover:border-amber-500/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-body-xs font-bold text-on-surface truncate">{exam.namaMK ?? exam.kodeMK}</p>
                    <p className="text-body-xs text-amber-700 dark:text-amber-300 font-semibold mt-0.5">
                      {formatExamDate(exam.tanggal)} · {exam.jam} WIB
                    </p>
                  </div>
                  <span className="shrink-0 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/25 px-2 py-1 text-label-caps font-extrabold flex items-center gap-1">
                    <Icon name="timer" size={13} />
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 4. Content Area: Loading / Empty State / Exam Cards — 1:1 with Tasks.jsx */}
      {loading ? (
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container-low p-8 tablet:p-12 text-center shadow-level-1 flex flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary border border-primary/20 shadow-level-1 mb-3">
            <Icon name={jenis === 'UTS' ? 'quiz' : 'school'} size={36} />
          </div>
          <h3 className="text-title-md font-bold text-on-surface">Belum ada data ujian {jenis}</h3>
          <p className="mt-1.5 text-body-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Jadwal {jenis === 'UTS' ? 'Ujian Tengah Semester (UTS)' : 'Ujian Akhir Semester (UAS)'} untuk TA {selectedTA} akan ditampilkan secara otomatis setelah dipublikasikan oleh Bagian Akademik.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
          {grouped.map(([dateLabel, exams]) => (
            <section key={dateLabel} className="space-y-4">
              <div className="flex items-center justify-between px-1 py-1 border-b border-outline-variant/20">
                <span className="text-label-caps font-extrabold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>{formatExamDate(dateLabel)}</span>
                </span>
                <span className="text-label-caps font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                  {exams.length} Ujian
                </span>
              </div>
              <div className="space-y-3">
                {exams.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} onLocation={setRoomModalTarget} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Auxiliary Room Location Modal */}
      {roomModalTarget && (
        <RoomLocationModal
          isOpen={Boolean(roomModalTarget)}
          onClose={() => setRoomModalTarget(null)}
          ruang={roomModalTarget.ruang}
          tipeKelas={roomModalTarget.mode === 'Online' ? 'K2' : 'K1'}
          currentCourseName={roomModalTarget.namaMK ?? roomModalTarget.kodeMK}
        />
      )}
    </div>
  )
}

function ExamCard({ exam, onLocation }) {
  const days = daysUntil(exam.tanggal)
  const countdown =
    days > 0 ? `${days} hari lagi` : days === 0 ? 'Hari ini' : 'Sudah lewat'

  const isPast = days < 0
  const badgeStyle =
    isPast
      ? 'bg-surface-container text-on-surface-variant border border-outline-variant/30'
      : exam.jenis === 'UTS'
        ? 'bg-blue-500/15 text-blue-800 dark:text-blue-200 border border-blue-500/25'
        : 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/25'

  const stripeColor = JENIS_STRIPE[exam.jenis] ?? 'bg-secondary'

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-surface-container-lowest p-4 shadow-level-1 border border-outline-variant/25 transition-all duration-200 hover:shadow-level-1 hover:border-outline-variant/40 dark:bg-surface-container-low ${isPast ? 'opacity-85' : ''}`}
    >
      {/* Left Stripe — 1:1 with TaskCard priority stripe */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${stripeColor}`} />

      <div className="flex justify-between items-start mb-2.5 gap-2 pl-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="font-mono text-label-caps font-extrabold text-primary bg-primary/10 border border-primary/20 px-2 py-0.2 rounded-md">
              {exam.kodeMK}
            </span>
            <span className="text-body-xs font-bold text-on-surface-variant">
              Ujian {exam.jenis}
            </span>
            {isPast && (
              <span className="text-label-caps font-bold text-on-surface-variant bg-surface-container px-1.5 py-0.2 rounded-md border border-outline-variant/20">
                Selesai
              </span>
            )}
          </div>
          <h4 className="text-body-sm font-extrabold text-on-surface leading-snug truncate group-hover:text-primary transition-colors">
            {exam.namaMK ?? exam.kodeMK}
          </h4>
        </div>

        <span className={`px-2.5 py-1 rounded-xl flex items-center gap-1 text-label-caps font-extrabold shadow-level-1 shrink-0 ${badgeStyle}`}>
          <Icon name="timer" size={13} />
          <span>{countdown}</span>
        </span>
      </div>

      <div className="flex items-center justify-between bg-surface-container-low/60 dark:bg-surface-container-high/30 rounded-xl p-2.5 border border-outline-variant/15 mt-3 ml-2">
        <div className="flex items-center gap-3 text-body-xs font-semibold text-on-surface-variant">
          <span className="flex items-center gap-1 text-on-surface font-bold">
            <Icon name="schedule" size={15} className="text-primary shrink-0" />
            <span>{exam.jam} WIB</span>
          </span>
          <span>·</span>
          <button
            type="button"
            onClick={() => onLocation?.(exam)}
            className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
            title="Lihat Denah Lantai & Lokasi Ruang Ujian"
          >
            <Icon name={exam.mode === 'Online' ? 'videocam' : 'location_on'} size={15} className="text-primary shrink-0" />
            <span className="underline decoration-dotted underline-offset-2">{exam.ruang ?? '-'}</span>
          </button>
        </div>

        <span className="bg-surface-container-lowest dark:bg-surface-container-low text-on-surface px-2 py-0.5 rounded-lg text-body-xs font-bold border border-outline-variant/20 flex items-center gap-1">
          <Icon name={MODE_ICONS[exam.mode] ?? 'help_outline'} size={12} />
          <span>{exam.mode ?? '-'}</span>
        </span>
      </div>
    </div>
  )
}

function groupByDate(exams) {
  const map = new Map()
  exams.forEach((e) => {
    const d = e.tanggal ?? 'Tanpa Tanggal'
    const list = map.get(d) || []
    list.push(e)
    map.set(d, list)
  })
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
}

function formatExamDate(isoDate) {
  if (isoDate === 'Tanpa Tanggal') return 'Jadwal Ditentukan Kemudian'
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function daysUntil(isoDate) {
  if (!isoDate) return 999
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(isoDate + 'T00:00:00')
  return Math.round((target.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000))
}
