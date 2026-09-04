import { Icon } from '../../Icon'

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

export function QuickAdminActions({ onOpenArchive, onOpenBackupRestore, busy, appSettings }) {
  return (
    <section className="desktop:col-span-5 h-full flex flex-col justify-start order-1 desktop:order-2">
      {/* Card Aksi Musiman & Manajemen Data */}
      <div className="rounded-2xl bg-surface-container-lowest p-4 tablet:p-5 dark:bg-surface-container-low border border-outline-variant/20 shadow-level-1 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-outline-variant/15 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-level-1">
            <Icon name="sync_alt" size={18} />
          </div>
          <div>
            <h3 className="text-title-sm font-bold text-on-surface">
              Aksi Musiman &amp; Data
            </h3>
            <p className="text-label-caps text-on-surface-variant font-medium">
              Manajemen semester &amp; arsip backup
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Semester Baru */}
          <button
            type="button"
            onClick={onOpenArchive}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-xl border bg-status-gbk-bg text-status-gbk border-status-gbk-border hover:opacity-80 py-2.5 px-3 text-body-xs font-bold transition-all cursor-pointer active:scale-98 disabled:opacity-50 shadow-2xs"
          >
            <Icon name="sync_alt" size={16} />
            <span>Semester Baru</span>
          </button>

          {/* Backup / Restore */}
          <button
            type="button"
            onClick={onOpenBackupRestore}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-xl border bg-secondary/10 text-secondary border-secondary/25 hover:bg-secondary/20 py-2.5 px-3 text-body-xs font-bold transition-all cursor-pointer active:scale-98 disabled:opacity-50 shadow-2xs"
          >
            <Icon name="cloud_sync" size={16} />
            <span>Backup / Restore</span>
          </button>
        </div>

        {/* Cloud Sync Status Strip */}
        <div className="pt-3 border-t border-outline-variant/15 flex items-center justify-between text-body-xs">
          <span className="flex items-center gap-1.5 font-bold text-success text-label-caps">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Firebase Real-time Sync
          </span>
          <span className="text-label-caps text-on-surface-variant font-medium">
            {appSettings?.lastPublishedAt
              ? `Update: ${formatDateID(appSettings.lastPublishedAt)}`
              : 'Online'}
          </span>
        </div>
      </div>
    </section>
  )
}
