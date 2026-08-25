import { useMemo, useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { useFirestore } from '../../hooks/useFirestore'
import { Icon } from '../../components/Icon'
import { EmptyState } from '../../components/EmptyState'
import { Skeleton } from '../../components/Skeleton'

const MODE_ICONS = {
  Offline: 'person_outline',
  Online: 'laptop_mac',
  'Take home': 'home_work',
}

export default function Exams() {
  const { program, semester } = useApp()
  const [jenis, setJenis] = useState('UTS')

  const { data: ujian, loading } = useFirestore('ujian', [
    ['prodi', '==', program ?? ''],
    ['semester', '==', Number(semester) || 0],
    ['status', '==', 'published'],
  ])

  const filtered = useMemo(
    () => ujian.filter((e) => e.jenis === jenis),
    [ujian, jenis],
  )

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  return (
    <div className="space-y-lg">
      <header className="flex flex-col gap-md tablet:flex-row tablet:items-center tablet:justify-between">
        <div>
          <h2 className="text-display text-on-surface">Jadwal Ujian</h2>
          <p className="mt-1 text-body-lg text-on-surface-variant">
            Ujian tengah semester dan akhir semester.
          </p>
        </div>
        {/* Segmented control */}
        <div className="flex rounded-full bg-surface-container p-1 dark:bg-surface-container-high">
          {['UTS', 'UAS'].map((j) => (
            <button
              key={j}
              type="button"
              onClick={() => setJenis(j)}
              className={`rounded-full px-6 py-1.5 text-body-sm font-medium transition-all duration-200 active:scale-95 ${
                jenis === j
                  ? 'bg-primary text-on-primary shadow-level-1'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
              }`}
            >
              {j}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-lg desktop:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="quiz"
          title={`Belum ada data ujian ${jenis}`}
          description="Jadwal ujian akan muncul di sini setelah admin mempublikasikannya."
        />
      ) : (
        <div className="grid grid-cols-1 gap-lg desktop:grid-cols-2">
          {grouped.map(([dateLabel, exams]) => (
            <section key={dateLabel} className="space-y-sm relative">
              <h3 className="sticky top-0 z-20 py-3 bg-surface/80 dark:bg-surface-container-low/80 text-label-caps text-on-surface-variant font-bold border-b border-outline-variant/30 flex items-center gap-2 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {formatExamDate(dateLabel)}
              </h3>
              {exams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function ExamCard({ exam }) {
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
      className={`group relative overflow-hidden rounded-3xl bg-surface-container-lowest p-5 shadow-level-1 border border-outline-variant/15 transition-all duration-200 hover:scale-[1.005] hover:shadow-level-2 ${borderClass}`}
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
          <span className="flex items-center gap-1.5">
            <Icon name={exam.mode === 'Online' ? 'videocam' : 'location_on'} size={16} className="text-primary" />
            {exam.ruang ?? '-'}
          </span>
        </div>
        <span className="bg-surface-container-lowest text-on-surface px-2.5 py-1 rounded-lg text-[10px] font-bold border border-outline-variant/20 flex items-center gap-1">
          <Icon name={MODE_ICONS[exam.mode] ?? 'help_outline'} size={12} />
          {exam.mode ?? '-'}
        </span>
      </div>
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
    if (!a) return 1 // "Tanggal belum ditentukan" di akhir
    if (!b) return -1
    return a.localeCompare(b) // ISO string → urutan kronologis benar
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
