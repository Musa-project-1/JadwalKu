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

      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Icon name="cloud_sync" size={22} />
            </div>
            <div>
              <h4 className="text-body-sm font-bold text-on-surface">Snapshot Cadangan Koleksi</h4>
              <p className="text-[11.5px] text-on-surface-variant">Jadwal, Mata Kuliah, Ujian, Pengumuman, Ruang, dan Kalender</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBackupRestoreOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-body-xs shadow-level-1 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            Buka Backup & Restore
          </button>
        </div>
      </div>
    </div>
  )
}
