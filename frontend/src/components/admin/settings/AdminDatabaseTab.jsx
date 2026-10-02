import { Icon } from '../../Icon'

export function AdminDatabaseTab({
  language,
  setBackupRestoreOpen,
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-title-sm font-bold text-on-surface">
          {language === 'en' ? 'Database & Cloud Storage' : 'Cadangan & Pemulihan Database'}
        </h3>
        <p className="text-body-xs text-on-surface-variant mt-0.5">
          {language === 'en'
            ? 'Export full backup snapshots or restore schedules safely'
            : 'Unduh berkas JSON cadangan seluruh koleksi atau pulihkan jadwal secara aman'}
        </p>
      </div>

      <div className="rounded-2xl border border-outline-variant/30 dark:border-outline-variant/40 bg-surface-container-lowest dark:bg-surface-container-low p-4 tablet:p-5 space-y-4 shadow-level-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Icon name="cloud_sync" size={22} />
            </div>
            <div className="min-w-0">
              <h4 className="text-body-sm font-bold text-on-surface truncate">Snapshot Cadangan Koleksi</h4>
              <p className="text-[11.5px] text-on-surface-variant">Jadwal, Mata Kuliah, Ujian, Pengumuman, Ruang, dan Kalender</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBackupRestoreOpen(true)}
            className="flex h-8 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 text-body-xs font-bold text-on-primary shadow-level-1 hover:bg-primary/90 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <span>Buka Backup & Restore</span>
          </button>
        </div>
      </div>
    </div>
  )
}
