import { Icon } from '../../Icon'
import { Button } from '../../Button'
import { classTypeLabel } from '../../../lib/classTypes'
import { validateScheduleEntry } from '../../../lib/uploadValidator'

export function ImportStepPreview({
  fileName,
  effectiveTA,
  onClose,
  setStep,
  previewMetrics,
  parsedData,
  editingRowId,
  setEditingRowId,
  handleUpdateEntry,
  effectiveClassTypeCodes,
  handleDeleteEntry,
  busySaving,
  handleFinalSave,
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Banner - Gradient */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-800 p-4 tablet:p-5 text-white shadow-level-1 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-level-1">
              <Icon name="check_circle" size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 className="text-xl tablet:text-2xl font-bold tracking-tight text-white truncate">
                  Pratinjau & Validasi Impor
                </h3>
                <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-label-caps font-extrabold uppercase tracking-wider border border-white/25 shadow-level-1">
                  TA {effectiveTA}
                </span>
              </div>
              <p className="text-body-xs text-white/80 font-medium truncate">
                {fileName} • {parsedData.scheduleEntries.length} Baris Jadwal Terdeteksi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 p-5 tablet:p-6 space-y-4 overflow-hidden">
        {/* Metrics Chips */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 text-body-xs font-bold text-emerald-800 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>{previewMetrics.valid} Baris Valid</span>
          </div>
          {previewMetrics.review > 0 && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/25 px-2.5 py-1 text-body-xs font-bold text-amber-800 dark:text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>{previewMetrics.review} Perlu Review (OCR)</span>
            </div>
          )}
          {previewMetrics.invalid > 0 && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-error/15 border border-error/25 px-2.5 py-1 text-body-xs font-bold text-error">
              <span className="h-2 w-2 rounded-full bg-error" />
              <span>{previewMetrics.invalid} Error / Tidak Lengkap</span>
            </div>
          )}
          {previewMetrics.conflictsCount > 0 && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/25 px-2.5 py-1 text-body-xs font-bold text-error">
              <Icon name="warning" size={14} />
              <span>{previewMetrics.conflictsCount} Bentrok Terdeteksi</span>
            </div>
          )}
        </div>

        {/* Interactive Live Preview Table */}
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low shadow-level-1">
          <table className="w-full table-fixed text-left border-collapse text-body-xs min-w-[750px]">
            <thead className="sticky top-0 z-10 bg-surface-container-low/95 dark:bg-surface-container-high/95 backdrop-blur-md border-b border-outline-variant/15 shadow-level-1">
              <tr>
                <th className="w-[10%] px-3 py-2 text-label-caps uppercase font-bold text-on-surface-variant">Hari</th>
                <th className="w-[14%] px-3 py-2 text-label-caps uppercase font-bold text-on-surface-variant">Jam</th>
                <th className="w-[23%] px-3 py-2 text-label-caps uppercase font-bold text-on-surface-variant">Mata Kuliah</th>
                <th className="w-[18%] px-3 py-2 text-label-caps uppercase font-bold text-on-surface-variant">Dosen</th>
                <th className="w-[12%] px-3 py-2 text-label-caps uppercase font-bold text-on-surface-variant">Ruang</th>
                <th className="w-[11%] px-3 py-2 text-label-caps uppercase font-bold text-on-surface-variant">Tipe</th>
                <th className="w-[8%] px-2 py-2 text-label-caps uppercase font-bold text-on-surface-variant text-center">Akurasi</th>
                <th className="w-[4%] px-2 py-2 text-label-caps uppercase font-bold text-on-surface-variant text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 font-medium text-on-surface">
              {parsedData.scheduleEntries.map((entry, index) => {
                const isLowConfidence = typeof entry.confidence === 'number' && entry.confidence < 80
                const errors = validateScheduleEntry(entry)
                const isRowEditing = editingRowId === entry.id

                return (
                  <tr
                    key={entry.id || index}
                    className={`group hover:bg-surface-container-low/60 transition-colors ${
                      errors.length > 0
                        ? 'bg-red-500/5 dark:bg-red-500/10'
                        : isLowConfidence
                        ? 'bg-amber-500/5 dark:bg-amber-500/10'
                        : ''
                    }`}
                  >
                    {/* Hari */}
                    <td className="px-3 py-2">
                      {isRowEditing ? (
                        <input
                          type="text"
                          value={entry.hari}
                          onChange={(e) => handleUpdateEntry(index, 'hari', e.target.value)}
                          className="w-full rounded-lg border border-primary bg-surface p-1 text-body-xs font-bold"
                        />
                      ) : (
                        <span onClick={() => setEditingRowId(entry.id)} className="font-bold cursor-text hover:underline">
                          {entry.hari || '–'}
                        </span>
                      )}
                    </td>

                    {/* Jam */}
                    <td className="px-3 py-2 font-mono whitespace-nowrap">
                      {isRowEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={entry.jamMulai}
                            onChange={(e) => handleUpdateEntry(index, 'jamMulai', e.target.value)}
                            className="w-14 rounded-lg border border-primary bg-surface p-1 text-body-xs font-mono font-bold"
                          />
                          <span>-</span>
                          <input
                            type="text"
                            value={entry.jamSelesai}
                            onChange={(e) => handleUpdateEntry(index, 'jamSelesai', e.target.value)}
                            className="w-14 rounded-lg border border-primary bg-surface p-1 text-body-xs font-mono font-bold"
                          />
                        </div>
                      ) : (
                        <span onClick={() => setEditingRowId(entry.id)} className="font-semibold cursor-text hover:underline">
                          {entry.jamMulai} - {entry.jamSelesai}
                        </span>
                      )}
                    </td>

                    {/* Mata Kuliah */}
                    <td className="px-3 py-2">
                      {isRowEditing ? (
                        <input
                          type="text"
                          value={entry.namaMK}
                          onChange={(e) => handleUpdateEntry(index, 'namaMK', e.target.value)}
                          className="w-full rounded-lg border border-primary bg-surface p-1 text-body-xs font-semibold"
                        />
                      ) : (
                        <div onClick={() => setEditingRowId(entry.id)} className="cursor-text">
                          <p className="font-bold text-on-surface truncate leading-tight hover:underline">
                            {entry.namaMK || entry.kodeMK}
                          </p>
                          <span className="font-mono text-label-caps font-bold text-teal-800 dark:text-teal-400 bg-teal-500/15 px-2 py-0.5 rounded-md inline-block mt-0.5">
                            {entry.kodeMK}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Dosen */}
                    <td className="px-3 py-2">
                      {isRowEditing ? (
                        <input
                          type="text"
                          value={entry.dosen}
                          onChange={(e) => handleUpdateEntry(index, 'dosen', e.target.value)}
                          className="w-full rounded-lg border border-primary bg-surface p-1 text-body-xs"
                        />
                      ) : (
                        <span onClick={() => setEditingRowId(entry.id)} className="text-on-surface-variant truncate block cursor-text hover:underline">
                          {entry.dosen || '–'}
                        </span>
                      )}
                    </td>

                    {/* Ruang */}
                    <td className="px-3 py-2">
                      {isRowEditing ? (
                        <input
                          type="text"
                          value={entry.ruang}
                          onChange={(e) => handleUpdateEntry(index, 'ruang', e.target.value)}
                          className="w-full rounded-lg border border-primary bg-surface p-1 text-body-xs font-semibold"
                        />
                      ) : (
                        <span onClick={() => setEditingRowId(entry.id)} className="font-semibold truncate block cursor-text hover:underline">
                          {entry.ruang || '–'}
                        </span>
                      )}
                    </td>

                    {/* Tipe Kelas */}
                    <td className="px-3 py-2">
                      {isRowEditing ? (
                        <select
                          value={entry.tipeKelas || 'K1'}
                          onChange={(e) => handleUpdateEntry(index, 'tipeKelas', e.target.value)}
                          className="w-full rounded-lg border border-primary bg-surface p-1 text-body-xs font-semibold"
                        >
                          {effectiveClassTypeCodes.map((t) => (
                            <option key={t} value={t}>
                              {t} – {classTypeLabel(t)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          onClick={() => setEditingRowId(entry.id)}
                          title={classTypeLabel(entry.tipeKelas)}
                          className="inline-flex items-center rounded-md bg-surface-container-high px-2 py-0.5 text-body-xs font-bold text-on-surface cursor-pointer hover:bg-surface-container-highest"
                        >
                          {entry.tipeKelas || 'K1'}
                        </span>
                      )}
                    </td>

                    {/* Akurasi Status */}
                    <td className="px-2 py-2 text-center">
                      {errors.length > 0 ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-error/15 px-2 py-0.5 text-label-caps font-bold text-error" title={errors.join(', ')}>
                          🔴 Error
                        </span>
                      ) : isLowConfidence ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-label-caps font-bold text-amber-700 dark:text-amber-400" title="Skor kepercayaan OCR sedang">
                          🟡 {entry.confidence}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-label-caps font-bold text-emerald-700 dark:text-emerald-400">
                          🟢 {entry.confidence || 98}%
                        </span>
                      )}
                    </td>

                    {/* Aksi Hapus */}
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(index)}
                        className="rounded-lg p-1 text-on-surface-variant hover:text-error hover:bg-error/10 cursor-pointer transition-colors"
                        title="Hapus Baris Ini"
                      >
                        <Icon name="delete" size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="text-label-caps font-medium text-on-surface-variant shrink-0">
          💡 Klik langsung pada teks di tabel jika ingin mengoreksi salah eja secara cepat.
        </p>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/15 shrink-0">
          <Button type="button" variant="secondary" onClick={() => setStep('upload')} disabled={busySaving}>
            <Icon name="arrow_back" size={16} className="mr-1" />
            Unggah Ulang
          </Button>
          <Button
            type="button"
            onClick={handleFinalSave}
            disabled={busySaving || parsedData.scheduleEntries.length === 0}
            className="font-bold shadow-level-1 cursor-pointer"
          >
            <Icon name="check_circle" size={18} className="mr-1.5" />
            {busySaving ? 'Menyimpan ke Database...' : 'Simpan Jadwal ke Database'}
          </Button>
        </div>
      </div>
    </div>
  )
}
