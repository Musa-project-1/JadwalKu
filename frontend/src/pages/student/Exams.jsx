import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { useFirestore } from '../../hooks/useFirestore'
import { Icon } from '../../components/Icon'
import { Skeleton } from '../../components/Skeleton'
import { expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'
import { downloadExamIcs } from '../../lib/icsExport'
import { RoomLocationModal } from '../../components/student/RoomLocationModal'

const MODE_ICONS = {
  Offline: 'person_outline',
  Online: 'laptop_mac',
  'Take home': 'home_work',
}

export default function Exams() {
  const { program, semester } = useApp()
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

  function handleExportExamIcs() {
    downloadExamIcs(filtered, {
      prodi: program,
      semester,
      jenis,
      courseMap,
    })
  }

  return (
    <div className="space-y-lg w-full max-w-full overflow-x-hidden">
      {/* Header Halaman — Bold, Rich Icon Badge, TA Dropdown & Switcher */}
      <header className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Icon name="quiz" size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl tablet:text-3xl font-bold tracking-tight text-on-surface">
                Jadwal Ujian
              </h2>
              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-bold border border-primary/20">
                {filtered.length} Mata Uji
              </span>
            </div>
            <p className="mt-0.5 text-body-sm text-on-surface-variant font-normal">
              {program || 'Informatika'} · Semester {semester || '1'} · Evaluasi Tengah & Akhir Semester
            </p>
          </div>
        </div>

        {/* Controls: Segmented UTS/UAS + Kalender Export + Tahun Ajaran Selector */}
        <div className="flex items-center justify-between tablet:justify-end gap-2 w-full tablet:w-auto flex-wrap">
          {/* Segmented control */}
          <div className="flex rounded-full border border-outline-variant/30 bg-surface-container-high/50 p-1 shadow-xs shrink-0">
            {['UTS', 'UAS'].map((j) => (
              <button
                key={j}
                type="button"
                onClick={() => setJenis(j)}
                className={`rounded-full px-4 py-1 text-body-xs tablet:text-body-sm font-bold transition-all duration-200 cursor-pointer ${
                  jenis === j
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {j}
              </button>
            ))}
          </div>

          {/* Tombol Ekspor Kalender HP (.ics) */}
          <button
            type="button"
            onClick={handleExportExamIcs}
            disabled={filtered.length === 0}
            title={`Tambahkan Jadwal Ujian ${jenis} ke Kalender Smartphone (.ics)`}
            className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-body-xs font-bold text-primary hover:bg-primary/20 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Icon name="event" size={16} />
            <span>Kalender HP (.ics)</span>
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

      {loading ? (
        <div className="grid grid-cols-1 gap-lg desktop:grid-cols-2">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State — Solid Dashed Card */
        <div className="rounded-3xl border-2 border-dashed border-outline-variant/40 bg-surface-container-lowest/60 dark:bg-surface-container-low/30 p-8 tablet:p-14 text-center max-w-lg mx-auto my-6 shadow-xs animate-fade-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Icon name={jenis === 'UTS' ? 'quiz' : 'school'} size={32} />
          </div>
          <h3 className="text-xl font-bold text-on-surface">Belum ada data ujian {jenis}</h3>
          <p className="mt-1.5 text-body-sm text-on-surface-variant max-w-sm mx-auto">
            Jadwal {jenis === 'UTS' ? 'Ujian Tengah Semester (UTS)' : 'Ujian Akhir Semester (UAS)'} untuk TA {selectedTA} akan ditampilkan setelah dipublikasikan oleh Bagian Akademik.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-lg desktop:grid-cols-2">
          {grouped.map(([dateLabel, exams]) => (
            <section key={dateLabel} className="space-y-sm relative">
              <h3 className="sticky top-0 z-20 py-3 bg-surface/85 dark:bg-surface-container-low/85 text-label-caps text-on-surface font-bold border-b border-outline-variant/30 flex items-center gap-2 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {formatExamDate(dateLabel)}
                <span className="ml-auto text-[11px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                  {exams.length} Ujian
                </span>
              </h3>
              {exams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} onLocation={setRoomModalTarget} />
              ))}
            </section>
          ))}
        </div>
      )}

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

  const borderClass =
    exam.jenis === 'UTS' ? 'border-l-4 border-info' : 'border-l-4 border-warning'

  const badgeStyle =
    exam.jenis === 'UTS'
      ? 'bg-info-container/20 text-info dark:bg-info-container/10'
      : 'bg-warning-container/20 text-warning dark:bg-warning-container/10'

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl bg-surface-container-lowest p-5 shadow-level-1 border border-outline-variant/15 transition-all duration-200 hover:scale-[1.005] hover:shadow-level-2 dark:bg-surface-container-low ${borderClass}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-[18px] font-bold text-on-surface leading-tight group-hover:text-primary transition-colors">
            {exam.namaMK ?? exam.kodeMK}
          </h4>
          <span className="text-body-sm text-on-surface-variant/80 font-medium mt-0.5 block">
            {exam.kodeMK} · Ujian {exam.jenis}
          </span>
        </div>

        <span className={`px-2.5 py-1 rounded-lg flex items-center gap-1 text-[11px] font-bold tracking-wide shadow-sm shrink-0 ${badgeStyle}`}>
          <Icon name="timer" size={13} />
          {countdown}
        </span>
      </div>

      <div className="flex items-center justify-between bg-surface-container-highest/20 dark:bg-surface-container-high/30 rounded-2xl p-3 border border-outline-variant/10 mt-4">
        <div className="flex items-center gap-4 text-xs font-semibold text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <Icon name="schedule" size={16} className="text-primary" />
            {exam.jam} WIB
          </span>
          <button
            type="button"
            onClick={() => onLocation?.(exam)}
            className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
            title="Lihat Denah Lantai & Lokasi Ruang Ujian"
          >
            <Icon name={exam.mode === 'Online' ? 'videocam' : 'location_on'} size={16} className="text-primary" />
            <span className="underline decoration-dotted underline-offset-2">{exam.ruang ?? '-'}</span>
          </button>
        </div>
        <span className="bg-surface-container-lowest text-on-surface px-2.5 py-1 rounded-lg text-[10px] font-bold border border-outline-variant/20 flex items-center gap-1">
          <Icon name={MODE_ICONS[exam.mode] ?? 'help_outline'} size={12} />
          {exam.mode ?? '-'}
        </span>
      </div>
    </div>
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
        className={`group flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-body-sm font-semibold transition-all shadow-xs cursor-pointer ${
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

function groupByDate(exams) {
  const groups = new Map()
  for (const exam of exams) {
    const key = exam.tanggal ?? ''
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(exam)
  }
  return [...groups.entries()].sort(([a], [b]) => {
    if (!a) return 1
    if (!b) return -1
    return a.localeCompare(b)
  })
}

function formatExamDate(isoDate) {
  if (!isoDate) return 'Tanggal belum ditentukan'
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return String(isoDate)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    weekday: 'long',
  }).format(d)
}

function daysUntil(isoDate) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((new Date(isoDate).getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000))
}
