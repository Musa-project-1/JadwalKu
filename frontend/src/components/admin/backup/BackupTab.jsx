import { Icon } from '../../Icon'
import { COLLECTIONS_CONFIG } from './backupConfig'

export function BackupTab({
  selectedBackupCols,
  toggleBackupCol,
  selectAllBackupCols,
  clearAllBackupCols,
  dbCounts,
  loadingStats,
  exporting,
  handleExportBackup,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-body-sm font-bold text-on-surface">Pilih Koleksi untuk Dicadangkan</h3>
          <p className="text-label-caps text-on-surface-variant">
            Pilih modul database yang ingin disertakan ke dalam berkas cadangan JSON
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAllBackupCols}
            className="text-label-caps font-bold text-primary hover:underline cursor-pointer"
          >
            Pilih Semua
          </button>
          <span className="text-outline-variant/40">|</span>
          <button
            type="button"
            onClick={clearAllBackupCols}
            className="text-label-caps font-bold text-on-surface-variant hover:text-error cursor-pointer"
          >
            Kosongkan
          </button>
        </div>
      </div>

      {/* Grid Koleksi */}
      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
        {COLLECTIONS_CONFIG.map((col) => {
          const isChecked = selectedBackupCols.has(col.id)
          const count = dbCounts[col.id] ?? 0

          return (
            <div
              key={col.id}
              onClick={() => toggleBackupCol(col.id)}
              className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                isChecked
                  ? 'border-teal-600 bg-teal-500/10 dark:bg-teal-950/30 ring-1 ring-teal-500/40 shadow-level-1'
                  : 'border-outline-variant/20 bg-surface-container-low/50 hover:bg-surface-container-low dark:bg-surface-container/30'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {}}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-body-xs font-bold text-on-surface flex items-center gap-2">
                    <Icon name={col.icon} size={15} className="text-teal-600 dark:text-teal-400" />
                    <span>{col.label}</span>
                  </p>
                  <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-caps font-extrabold text-on-surface-variant">
                    {loadingStats ? '...' : `${count} Dok`}
                  </span>
                </div>
                <p className="text-body-xs text-on-surface-variant mt-0.5 truncate">
                  {col.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Box Info */}
      <div className="flex items-start gap-2 rounded-2xl bg-teal-500/10 border border-teal-500/20 p-4 text-label-caps text-teal-900 dark:text-teal-200">
        <Icon name="info" size={16} className="shrink-0 mt-0.5 text-teal-600 dark:text-teal-400" />
        <span>
          File JSON yang diunduh mencakup seluruh struktur data, id dokumen, serta stempel waktu ekspor. File ini dapat disimpan di Google Drive / flashdisk sebagai arsip semester.
        </span>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleExportBackup}
          disabled={exporting || selectedBackupCols.size === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-body-xs shadow-level-2 disabled:opacity-50 cursor-pointer transition-all"
        >
          <Icon name={exporting ? 'sync' : 'download'} size={18} className={exporting ? 'animate-spin' : ''} />
          <span>{exporting ? 'Sedang Mengekspor...' : `Unduh Cadangan JSON (${selectedBackupCols.size} Koleksi)`}</span>
        </button>
      </div>
    </div>
  )
}
