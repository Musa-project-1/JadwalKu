import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFirestore } from '../../hooks/useFirestore'
import { Icon } from '../../components/Icon'
import { EmptyState } from '../../components/EmptyState'
import { Skeleton } from '../../components/Skeleton'

const FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'jadwal', label: 'Jadwal Kuliah' },
  { value: 'ujian', label: 'Jadwal Ujian' },
  { value: 'mataKuliah', label: 'Mata Kuliah & Dosen' },
]

export default function ChangeHistory() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const { data: riwayat, loading, error: riwayatError } = useFirestore('riwayat', [], { limit: 100, orderByField: 'timestamp', orderByDir: 'desc' })

  const filtered = useMemo(
    () =>
      [...riwayat]
        .filter((r) => filter === 'all' || r.entitas === filter)
        .sort((a, b) => (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0)),
    [riwayat, filter],
  )

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  return (
    <div className="mx-auto max-w-2xl space-y-lg">
      <header className="flex items-center gap-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
          aria-label="Kembali"
        >
          <Icon name="arrow_back" size={22} />
        </button>
        <div>
          <h2 className="text-display text-on-surface">Riwayat Perubahan</h2>
          <p className="text-body-sm text-on-surface-variant">
            Perubahan jadwal oleh admin
          </p>
        </div>
      </header>

      {/* Filter chips */}
      <div className="flex gap-xs overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-body-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high dark:bg-surface-container-high'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {riwayatError && (
        <div role="status" className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-body-sm font-semibold text-error">
          Gagal memuat riwayat: {String(riwayatError.message || riwayatError.code || riwayatError)}
        </div>
      )}
      {loading ? (
        <div className="space-y-sm">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState
          icon="history"
          title="Belum ada perubahan"
          description="Riwayat perubahan jadwal akan tampil di sini setelah admin melakukan pembaruan."
        />
      ) : (
        <div className="space-y-lg">
          {grouped.map(([dateLabel, entries]) => (
            <section key={dateLabel}>
              <h3 className="mb-sm border-b border-surface-variant pb-xs text-label-caps uppercase tracking-wider text-on-surface-variant">
                {dateLabel}
              </h3>
              <div className="space-y-sm">
                {entries.map((entry) => (
                  <HistoryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryCard({ entry }) {
  const ent = String(entry.entitas ?? '').toLowerCase()
  const chipClass = ent.includes('jadwal')
    ? 'bg-primary/10 text-primary'
    : ent.includes('tugas')
      ? 'bg-tertiary-container/40 text-tertiary'
      : ent.includes('ujian')
        ? 'bg-warning-container/60 text-warning dark:bg-warning-container/30'
        : 'bg-surface-container text-on-surface-variant'
  const accent = ent.includes('hapus')
    ? 'bg-error'
    : ent.includes('jadwal')
      ? 'bg-primary'
      : 'bg-secondary'
  return (
    <div className="flex gap-md overflow-hidden rounded-2xl bg-surface-container-lowest p-md shadow-level-1 dark:bg-surface-container-low">
      <div className={`w-1 shrink-0 rounded-full ${accent}`} />
      <div className="min-w-0 flex-1">
        <div className="mb-xs flex flex-wrap items-center gap-xs">
          <span className={`rounded-full px-2 py-0.5 text-label-caps capitalize ${chipClass}`}>
            {entry.entitas ?? 'perubahan'}
          </span>
          <span className="text-body-sm text-on-surface-variant">{entry.field ?? ''}</span>
        </div>
        <p className="text-body-lg text-on-surface">
          {entry.detail ?? `${entry.entitas}: ${entry.field} diperbarui`}
        </p>
        <div className="mt-xs flex flex-wrap items-center gap-x-sm gap-y-1 text-body-sm">
          {entry.nilaiLama != null && (
            <>
              <span className="line-through text-outline">{String(entry.nilaiLama)}</span>
              <Icon name="arrow_forward" size={14} className="text-outline-variant" />
            </>
          )}
          {entry.nilaiBaru != null && (
            <span className="font-medium text-primary">{String(entry.nilaiBaru)}</span>
          )}
          {entry.aktor && (
            <span className="ml-auto text-label-caps text-outline-variant">oleh {entry.aktor}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function groupByDate(entries) {
  const groups = new Map()
  for (const entry of entries) {
    const ts = entry.timestamp?.toDate ? entry.timestamp.toDate() : null
    const label = ts
      ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(ts)
      : 'Tanpa tanggal'
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push(entry)
  }
  return [...groups.entries()]
}
