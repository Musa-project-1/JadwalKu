import { Icon } from '../../Icon'
import { COLLECTIONS_CONFIG } from './backupConfig'

export function RestoreTab({
  restoreFile,
  restoreData,
  restoreError,
  restoreSuccess,
  selectedRestoreCols,
  toggleRestoreCol,
  restoreMode,
  setRestoreMode,
  restoring,
  restoreProgress,
  handleDrop,
  handleFileSelected,
  fileInputRef,
  resetRestoreFile,
  handleExecuteRestore,
  dbCounts,
}) {
  return (
    <div className="space-y-4">
      {/* Dropzone File */}
      {!restoreFile ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-outline-variant/40 bg-surface-container-low/40 hover:bg-surface-container-low hover:border-teal-500/50 transition-all cursor-pointer text-center group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelected}
            className="hidden"
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 mb-3 group-hover:bg-teal-500/20 transition-colors">
            <Icon name="upload_file" size={28} />
          </div>
          <h4 className="text-body-sm font-bold text-on-surface">
            Tarik & Lepas File Cadangan JSON di sini
          </h4>
          <p className="text-label-caps text-on-surface-variant mt-1">
            atau klik untuk memilih berkas dari komputer Anda (.json)
          </p>
        </div>
      ) : (
        /* File Loaded Preview */
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl border border-teal-500/30 bg-teal-500/10 dark:bg-teal-950/30">
            <div className="flex items-center gap-3">
              <Icon name="description" size={24} className="text-teal-600 dark:text-teal-400" />
              <div>
                <p className="text-body-xs font-bold text-on-surface">{restoreFile.name}</p>
                <p className="text-label-caps text-on-surface-variant">
                  {(restoreFile.size / 1024).toFixed(1)} KB · Terbaca oleh sistem
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetRestoreFile}
              className="text-body-xs font-bold text-error hover:underline cursor-pointer"
            >
              Ganti File
            </button>
          </div>

          {restoreError && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-error/10 border border-error/25 text-error text-body-xs font-semibold">
              <Icon name="warning" size={16} />
              <span>{restoreError}</span>
            </div>
          )}

          {restoreSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-400 text-body-xs font-bold">
              <Icon name="check_circle" size={16} />
              <span>{restoreSuccess}</span>
            </div>
          )}

          {restoreData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                  Pilih Koleksi yang Ingin Dipulihkan
                </p>
                <span className="text-label-caps font-bold text-teal-700 dark:text-teal-400">
                  {selectedRestoreCols.size} Koleksi Dipilih
                </span>
              </div>

              {/* Koleksi Table in Backup File */}
              <div className="rounded-2xl border border-outline-variant/25 overflow-hidden">
                <table className="w-full text-left text-body-xs">
                  <thead className="bg-surface-container border-b border-outline-variant/20">
                    <tr>
                      <th className="py-2.5 px-3 w-[40px] text-center">Pilih</th>
                      <th className="py-2.5 px-3">Koleksi</th>
                      <th className="py-2.5 px-3 text-center">Data di File</th>
                      <th className="py-2.5 px-3 text-center">Data di Database</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 bg-surface-container-lowest">
                    {COLLECTIONS_CONFIG.map((config) => {
                      const sourceCols = restoreData.collections || restoreData
                      const fileDocs = sourceCols[config.id] || []
                      if (!Array.isArray(fileDocs) || fileDocs.length === 0) return null

                      const isChecked = selectedRestoreCols.has(config.id)
                      const dbCount = dbCounts[config.id] ?? 0

                      return (
                        <tr
                          key={config.id}
                          onClick={() => toggleRestoreCol(config.id)}
                          className={`cursor-pointer hover:bg-surface-container-low/50 transition-colors ${
                            isChecked ? 'bg-teal-500/5' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-bold text-on-surface flex items-center gap-2">
                            <Icon name={config.icon} size={15} className="text-teal-600 dark:text-teal-400" />
                            <span>{config.label}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-teal-700 dark:text-teal-400">
                            {fileDocs.length} Dokumen
                          </td>
                          <td className="py-2.5 px-3 text-center text-on-surface-variant font-medium">
                            {dbCount} Dokumen
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Restore Strategy Selector */}
              <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/50 p-4 space-y-4">
                <p className="text-body-xs font-bold text-on-surface">Metode Pemulihan Data (Strategy):</p>
                <div className="grid grid-cols-1 tablet:grid-cols-2 gap-2">
                  <label
                    onClick={() => setRestoreMode('merge')}
                    className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      restoreMode === 'merge'
                        ? 'border-teal-600 bg-teal-500/10 dark:bg-teal-950/30 ring-1 ring-teal-500/40'
                        : 'border-outline-variant/20 bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <input
                      type="radio"
                      name="restoreMode"
                      checked={restoreMode === 'merge'}
                      onChange={() => setRestoreMode('merge')}
                      className="mt-0.5 text-teal-600 cursor-pointer"
                    />
                    <div>
                      <p className="text-body-xs font-bold text-on-surface">Gabungkan & Update</p>
                      <p className="text-body-xs text-on-surface-variant mt-0.5">
                        Menambah atau menimpa dokumen yang sama tanpa menghapus data lain.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setRestoreMode('replace')}
                    className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      restoreMode === 'replace'
                        ? 'border-error bg-error/10 ring-1 ring-error/40'
                        : 'border-outline-variant/20 bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <input
                      type="radio"
                      name="restoreMode"
                      checked={restoreMode === 'replace'}
                      onChange={() => setRestoreMode('replace')}
                      className="mt-0.5 text-error cursor-pointer"
                    />
                    <div>
                      <p className="text-body-xs font-bold text-error">Timpa Bersih (Replace)</p>
                      <p className="text-body-xs text-on-surface-variant mt-0.5">
                        Menghapus data koleksi lama terlebih dahulu, lalu memasukkan data backup.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Progress Bar saat Restore */}
              {restoring && (
                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 space-y-2 animate-pulse">
                  <div className="flex items-center justify-between text-body-xs font-bold text-teal-900 dark:text-teal-200">
                    <span>Memulihkan Koleksi: {restoreProgress.collection}</span>
                    <span>{restoreProgress.current} / {restoreProgress.total} Dokumen</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-teal-500/20 overflow-hidden">
                    <div
                      className="h-full bg-teal-600 transition-all duration-300"
                      style={{
                        width: `${restoreProgress.total > 0 ? (restoreProgress.current / restoreProgress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  disabled={restoring || selectedRestoreCols.size === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-body-xs shadow-level-2 disabled:opacity-50 cursor-pointer transition-all"
                >
                  <Icon name={restoring ? 'sync' : 'restore'} size={18} className={restoring ? 'animate-spin' : ''} />
                  <span>{restoring ? 'Sedang Memulihkan...' : `Jalankan Pemulihan (${selectedRestoreCols.size} Koleksi)`}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
