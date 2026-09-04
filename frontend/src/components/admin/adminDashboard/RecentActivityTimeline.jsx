import { Icon } from '../../Icon'
import { Skeleton } from '../../Skeleton'
import { EmptyState } from '../../EmptyState'

function formatDateID(iso) {
  if (!iso) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

// Semua badge menggunakan token status-kelas — dark-mode aware
function getEntityBadge(entity = '') {
  const lower = entity.toLowerCase()
  if (lower.includes('jadwal') && !lower.includes('ujian')) {
    return {
      label: 'JADWAL',
      cls: 'bg-status-k1-bg text-status-k1 border-status-k1-border',
    }
  }
  if (lower.includes('mk') || lower.includes('mata kuliah') || lower.includes('dosen')) {
    return {
      label: 'MATA KULIAH',
      cls: 'bg-status-k2-bg text-status-k2 border-status-k2-border',
    }
  }
  if (lower.includes('ujian') || lower.includes('uts') || lower.includes('uas')) {
    return {
      label: 'UJIAN',
      cls: 'bg-status-gbk-bg text-status-gbk border-status-gbk-border',
    }
  }
  if (lower.includes('prodi') || lower.includes('program studi')) {
    return {
      label: 'PRODI',
      cls: 'bg-status-hb-bg text-status-hb border-status-hb-border',
    }
  }
  return {
    label: entity.toUpperCase() || 'SISTEM',
    cls: 'bg-status-sys-bg text-status-sys border-status-sys-border',
  }
}

export function RecentActivityTimeline({
  history,
  recentHistory,
  loadingHistory,
  onOpenFullHistory,
}) {
  return (
    <section className="desktop:col-span-12 h-full flex flex-col">
      <div className="h-full flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-4 tablet:p-5 dark:bg-surface-container-low border border-outline-variant/20 shadow-level-1">
        <div>
          {/* Panel header */}
          <div className="mb-3.5 flex items-center justify-between border-b border-outline-variant/15 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-level-1">
                <Icon name="history" size={18} />
              </span>
              <h3 className="text-title-sm text-on-surface font-bold">
                Riwayat Perubahan Data
              </h3>
            </div>
            <span className="text-label-caps font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
              {history.length} Log
            </span>
          </div>

          {/* Content */}
          {loadingHistory ? (
            <div className="space-y-2.5">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : recentHistory.length === 0 ? (
            <EmptyState
              icon="history"
              title="Belum ada aktivitas tercatat"
              description="Riwayat perubahan akan muncul otomatis saat admin melakukan upload, edit, atau publish."
            />
          ) : (
            <div className="relative pl-3.5">
              {/* Timeline bar — pakai token bukan warna statis */}
              <div className="absolute left-[6px] top-2.5 bottom-2.5 w-0.5 bg-outline-variant/30" />
              <ol className="space-y-2.5">
                {recentHistory.map((entry) => {
                  const badge = getEntityBadge(entry.entitas)
                  return (
                    <li key={entry.id} className="relative">
                      <span
                        aria-hidden="true"
                        className={`absolute -left-[18px] top-3.5 h-2.5 w-2.5 rounded-full border-2 bg-surface-container-lowest ${
                          entry.field === 'hapus'
                            ? 'border-error bg-error/20'
                            : 'border-primary bg-primary/20'
                        }`}
                      />
                      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/50 p-3 transition-all duration-200 hover:shadow-level-1 dark:bg-surface-container-high/30 shadow-level-1">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`text-label-caps uppercase font-bold px-2 py-0.5 rounded-full border shrink-0 ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                            <span className="text-label-caps text-on-surface-variant font-medium truncate">
                              {entry.timestamp?.toDate
                                ? formatDateID(entry.timestamp.toDate().toISOString())
                                : formatDateID(entry.timestamp)}
                            </span>
                          </div>
                          <span
                            className="inline-flex items-center gap-1 text-label-caps text-on-surface-variant font-medium shrink-0 max-w-[160px] truncate"
                            title={`Oleh: ${entry.aktor || 'Sistem'}`}
                          >
                            <Icon name="person" size={13} className="text-secondary shrink-0 opacity-70" />
                            <span className="truncate">{entry.aktor || 'Sistem'}</span>
                          </span>
                        </div>
                        <p className="break-words text-body-xs font-semibold text-on-surface">
                          {entry.detail ??
                            `${entry.field}: ${entry.nilaiLama ?? '∅'} → ${entry.nilaiBaru ?? '∅'}`}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="mt-3.5 border-t border-outline-variant/15 pt-3">
            <button
              type="button"
              onClick={onOpenFullHistory}
              className="w-full flex items-center justify-center gap-1.5 rounded-full bg-surface-container-high/50 hover:bg-primary/10 hover:text-primary text-on-surface py-2 text-body-xs font-bold transition-all active:scale-98 cursor-pointer border border-outline-variant/25 shadow-level-1"
            >
              <Icon name="read_more" size={16} />
              <span>Lihat Semua Log Aktivitas ({history.length}) →</span>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
