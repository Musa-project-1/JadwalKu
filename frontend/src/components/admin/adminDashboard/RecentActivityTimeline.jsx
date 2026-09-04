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
    <section className="desktop:col-span-7 h-full flex flex-col min-h-0">
      <div className="h-full flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-3.5 tablet:p-4 dark:bg-surface-container-low border border-outline-variant/20 shadow-level-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Panel header */}
          <div className="mb-3 flex items-center justify-between border-b border-outline-variant/15 pb-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-level-1 shrink-0">
                <Icon name="history" size={18} />
              </span>
              <h3 className="text-title-sm text-on-surface font-bold truncate">
                Riwayat Perubahan Data
              </h3>
            </div>
            <span className="text-label-caps font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 shrink-0">
              {history.length} Log
            </span>
          </div>

          {/* Content — scrollable list dengan min-h-0 agar pas 1 layar */}
          {loadingHistory ? (
            <div className="space-y-2 flex-1">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : recentHistory.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon="history"
                title="Belum ada aktivitas tercatat"
                description="Riwayat perubahan akan muncul otomatis saat admin melakukan aksi."
              />
            </div>
          ) : (
            <div className="relative pl-3 flex-1 overflow-y-auto min-h-0 pr-1 space-y-2">
              {/* Timeline bar */}
              <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-outline-variant/30" />
              <ol className="space-y-2">
                {recentHistory.map((entry) => {
                  const badge = getEntityBadge(entry.entitas)
                  return (
                    <li key={entry.id} className="relative">
                      <span
                        aria-hidden="true"
                        className={`absolute -left-[17px] top-3 h-2 w-2 rounded-full border-2 bg-surface-container-lowest ${
                          entry.field === 'hapus'
                            ? 'border-error bg-error/20'
                            : 'border-primary bg-primary/20'
                        }`}
                      />
                      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-2.5 transition-all hover:bg-surface-container-high/40 shadow-2xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border shrink-0 ${badge.cls}`}
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
                            className="inline-flex items-center gap-1 text-label-caps text-on-surface-variant font-medium shrink-0 max-w-[130px] truncate"
                            title={`Oleh: ${entry.aktor || 'Sistem'}`}
                          >
                            <Icon name="person" size={12} className="text-secondary shrink-0 opacity-70" />
                            <span className="truncate">{entry.aktor || 'Sistem'}</span>
                          </span>
                        </div>
                        <p className="break-words text-body-xs font-semibold text-on-surface leading-snug">
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
          <div className="mt-3 border-t border-outline-variant/15 pt-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenFullHistory}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-surface-container-high/50 hover:bg-primary/10 hover:text-primary text-on-surface py-2 text-body-xs font-bold transition-all active:scale-98 cursor-pointer border border-outline-variant/25 shadow-2xs"
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
