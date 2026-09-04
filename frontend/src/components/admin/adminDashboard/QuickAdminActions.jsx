import { Link } from 'react-router-dom'
import { Icon } from '../../Icon'

// Token-based: primary untuk jadwal, secondary untuk MK, tertiary untuk ujian, on-surface-variant untuk settings
const QUICK_ACTIONS = [
  {
    to: '/admin/jadwal',
    icon: 'upload_file',
    label: 'Upload & Kelola Jadwal',
    description: 'Import Excel / JSON jadwal mingguan',
    tone: 'bg-primary/10 text-primary border-primary/20',
  },
  {
    to: '/admin/mata-kuliah',
    icon: 'person_add',
    label: '+ Tambah MK & Dosen',
    description: 'Master kurikulum, SKS, & kontak dosen',
    tone: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  {
    to: '/admin/ujian',
    icon: 'add_task',
    label: '+ Jadwalkan Ujian',
    description: 'Kelola jadwal UTS dan UAS prodi',
    // Ganti amber statis → token status-gbk
    tone: 'bg-status-gbk-bg text-status-gbk border-status-gbk-border',
  },
  {
    to: '/admin/pengaturan',
    icon: 'settings_suggest',
    label: 'Master Kalender Akademik',
    description: 'Tahun ajaran, semester, & tanggal libur',
    // Ganti purple statis → token status-hb
    tone: 'bg-status-hb-bg text-status-hb border-status-hb-border',
  },
]

function formatDateID(iso) {
  if (!iso) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

export function QuickAdminActions({ onOpenArchive, onOpenBackupRestore, busy, appSettings }) {
  return (
    <section className="desktop:col-span-5 h-full flex flex-col justify-between space-y-3 tablet:space-y-3.5 order-1 desktop:order-2">

      {/* Card 1: Aksi Cepat Administratif */}
      <div className="rounded-2xl bg-surface-container-lowest p-4 tablet:p-5 dark:bg-surface-container-low border border-outline-variant/20 shadow-level-1 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="mb-3 text-title-sm text-on-surface font-bold flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-level-1">
              <Icon name="bolt" size={18} />
            </span>
            <span>Aksi Cepat Administratif</span>
          </h3>
          <nav className="grid grid-cols-1 sm:grid-cols-2 desktop:grid-cols-1 gap-2.5">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-3 p-3 bg-surface-container-low/50 hover:bg-surface-container-high/60 rounded-xl border border-outline-variant/20 transition-all group hover:border-primary/30 hover:shadow-level-1 cursor-pointer"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-level-1 ${action.tone}`}
                >
                  <Icon name={action.icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                    {action.label}
                  </p>
                  <p className="text-label-caps text-on-surface-variant font-medium truncate mt-0.5">
                    {action.description}
                  </p>
                </div>
                <Icon
                  name="chevron_right"
                  size={17}
                  className="text-on-surface-variant/50 group-hover:text-primary transition-colors shrink-0"
                />
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Card 2: Aksi Musiman & Manajemen Data */}
      <div className="rounded-2xl bg-surface-container-lowest p-4 tablet:p-5 dark:bg-surface-container-low border border-outline-variant/20 shadow-level-1 space-y-3">
        <div className="flex items-center gap-2.5">
          {/* Ganti amber statis → on-surface-variant / outline-variant */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant border border-outline-variant/30 shadow-level-1">
            <Icon name="sync_alt" size={18} />
          </div>
          <div>
            <h3 className="text-body-xs font-bold text-on-surface">
              Aksi Musiman &amp; Data
            </h3>
            <p className="text-label-caps text-on-surface-variant font-medium">
              Manajemen semester &amp; arsip backup
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Semester Baru — token status-gbk, bukan amber statis */}
          <button
            type="button"
            onClick={onOpenArchive}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-full border bg-status-gbk-bg text-status-gbk border-status-gbk-border hover:opacity-80 py-2 px-3 text-body-xs font-bold transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Icon name="sync_alt" size={15} />
            <span>Semester Baru</span>
          </button>

          {/* Backup / Restore — pakai token secondary */}
          <button
            type="button"
            onClick={onOpenBackupRestore}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-full border bg-secondary/10 text-secondary border-secondary/25 hover:bg-secondary/20 py-2 px-3 text-body-xs font-bold transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Icon name="cloud_sync" size={15} />
            <span>Backup / Restore</span>
          </button>
        </div>

        {/* Cloud Sync Status Strip — token success bukan emerald statis */}
        <div className="pt-2.5 border-t border-outline-variant/15 flex items-center justify-between text-body-xs">
          <span className="flex items-center gap-1.5 font-bold text-success text-label-caps">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
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
