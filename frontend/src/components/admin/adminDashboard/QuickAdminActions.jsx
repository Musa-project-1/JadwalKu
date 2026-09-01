import { Link } from 'react-router-dom'
import { Icon } from '../../Icon'

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
    tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  {
    to: '/admin/pengaturan-akademik',
    icon: 'settings_suggest',
    label: 'Master Kalender Akademik',
    description: 'Tahun ajaran, semester, & tanggal libur',
    tone: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
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

export function QuickAdminActions({
  onOpenArchive,
  onOpenBackupRestore,
  busy,
  appSettings,
}) {
  return (
    <section className="desktop:col-span-5 h-full flex flex-col justify-between space-y-3 tablet:space-y-3.5 order-1 desktop:order-2">
      {/* Card 1: Aksi Cepat Administratif */}
      <div className="rounded-3xl bg-surface-container-lowest p-4 tablet:p-5 dark:bg-surface-container-low border border-outline-variant/20 shadow-xs flex-1 flex flex-col justify-between">
        <div>
          <h3 className="mb-3 text-body-sm tablet:text-title-sm text-on-surface font-bold flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
              <Icon name="bolt" size={18} />
            </span>
            <span>Aksi Cepat Administratif</span>
          </h3>
          <nav className="grid grid-cols-1 sm:grid-cols-2 desktop:grid-cols-1 gap-2.5">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-3 p-3 bg-surface-container-low/50 hover:bg-surface-container-high/60 rounded-2xl border border-outline-variant/20 transition-all group hover:border-primary/30 hover:shadow-xs cursor-pointer shadow-2xs"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-2xs ${action.tone}`}
                >
                  <Icon name={action.icon} size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                    {action.label}
                  </p>
                  <p className="text-[11px] text-on-surface-variant font-medium truncate mt-0.5">
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
      <div className="rounded-3xl bg-surface-container-lowest p-4 tablet:p-5 dark:bg-surface-container-low border border-outline-variant/20 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 shadow-2xs">
              <Icon name="sync_alt" size={18} />
            </div>
            <div>
              <h3 className="text-body-xs font-bold text-on-surface">
                Aksi Musiman & Data
              </h3>
              <p className="text-[11px] text-on-surface-variant font-medium">
                Manajemen semester & arsip backup
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onOpenArchive}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 py-2 px-3 text-body-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Icon name="sync_alt" size={15} />
            <span>Semester Baru</span>
          </button>

          <button
            type="button"
            onClick={onOpenBackupRestore}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 py-2 px-3 text-body-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Icon name="cloud_sync" size={15} />
            <span>Backup / Restore</span>
          </button>
        </div>

        {/* Cloud Sync Status Strip */}
        <div className="pt-2.5 border-t border-outline-variant/15 flex items-center justify-between text-body-xs">
          <span className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Firebase Real-time Sync
          </span>
          <span className="text-[10.5px] text-on-surface-variant font-medium">
            {appSettings?.lastPublishedAt
              ? `Update: ${formatDateID(appSettings.lastPublishedAt)}`
              : 'Online'}
          </span>
        </div>
      </div>
    </section>
  )
}
