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

const STRIPE_COLORS = {
  UTS: 'bg-primary',
  UAS: 'bg-tertiary',
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
        <div className="flex rounded-lg border border-surface-variant bg-surface-container p-1 shadow-sm dark:bg-surface-container-high">
          {['UTS', 'UAS'].map((j) => (
            <button
              key={j}
              type="button"
              onClick={() => setJenis(j)}
              className={`rounded-md px-6 py-2 text-title-md transition-all ${
                jenis === j
                  ? 'bg-surface-container-lowest text-primary shadow-sm dark:bg-surface-container-highest'
                  : 'text-on-surface-variant hover:text-on-surface'
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
            <section key={dateLabel} className="space-y-sm">
              <h3 className="sticky top-0 z-10 border-b border-surface-variant bg-background/90 py-2 text-label-caps uppercase text-on-surface-variant backdrop-blur dark:bg-background/90">
                {dateLabel}
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

  return (
    <div className="relative flex gap-md overflow-hidden rounded-3xl bg-tertiary-container/15 p-md transition-shadow hover:shadow-level-2 dark:bg-tertiary-container/10">
      <div className={`absolute bottom-0 left-0 top-0 w-1 ${STRIPE_COLORS[exam.jenis] ?? 'bg-primary'}`} />
      <div className="min-w-0 flex-1 pl-xs">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-xs">
          <span className="rounded-full bg-tertiary-container/40 px-2 py-1 text-label-caps text-tertiary">
            {exam.kodeMK}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-label-caps text-primary">
            <Icon name="timer" size={14} />
            {countdown}
          </span>
          <span className="ml-auto flex items-center gap-1 rounded-md bg-surface-container px-2 py-1 text-label-caps text-on-surface-variant dark:bg-surface-container-high">
            <Icon name={MODE_ICONS[exam.mode] ?? 'help_outline'} size={14} />
            {exam.mode ?? '-'}
          </span>
        </div>
        <h3 className="mb-1 text-title-md text-on-surface">
          {exam.namaMK ?? exam.kodeMK}
        </h3>
        <p className="mb-4 text-body-sm text-on-surface-variant">
          {exam.kodeMK} · Ujian {exam.jenis}
        </p>
        <div className="flex flex-wrap gap-lg text-body-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <Icon name="schedule" size={16} />
            {exam.jam}
          </span>
          <span className="flex items-center gap-1">
            <Icon name={exam.mode === 'Online' ? 'link' : 'location_on'} size={16} />
            {exam.ruang ?? '-'}
          </span>
        </div>
      </div>
    </div>
  )
}

function groupByDate(exams) {
  const groups = new Map()
  for (const exam of exams) {
    const label = formatExamDate(exam.tanggal)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push(exam)
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
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
