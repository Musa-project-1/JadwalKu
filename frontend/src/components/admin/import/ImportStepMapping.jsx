import { Icon } from '../../Icon'
import { Button } from '../../Button'
import { FormSelect } from '../../FormSelect'
import { SYSTEM_FIELDS } from './importConfig'

export function ImportStepMapping({
  fileName,
  autoMatchedCount,
  setStep,
  effectiveTA,
  prodiDefault,
  setProdiDefault,
  effectiveProdiOptions,
  semesterDefault,
  setSemesterDefault,
  columnMapping,
  setColumnMapping,
  rawHeaders,
  savePreset,
  setSavePreset,
  handleApplyMapping,
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header Banner */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-800 p-4 tablet:p-5 text-white shadow-level-1 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-level-1">
              <Icon name="tune" size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 className="text-xl tablet:text-2xl font-bold tracking-tight text-white truncate">
                  Petakan Kolom Berkas
                </h3>
                <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-label-caps font-extrabold uppercase tracking-wider border border-white/25 shadow-level-1">
                  {autoMatchedCount} Kolom Cocok
                </span>
              </div>
              <p className="text-body-xs text-white/80 font-medium truncate">
                Berkas: {fileName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep('upload')}
            aria-label="Kembali"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
            title="Kembali ke Upload"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
      </div>

      <div className="p-5 tablet:p-6 space-y-4">
        {/* Global File Settings Badge (Tahun Ajaran, Prodi, Semester) */}
        <div className="p-3 rounded-2xl bg-surface-container-high/40 border border-outline-variant/20 space-y-4">
          <p className="text-label-caps uppercase font-bold text-on-surface-variant">
            Berlaku untuk seluruh berkas ini:
          </p>
          <div className="grid grid-cols-1 tablet:grid-cols-3 gap-2">
            <div>
              <label className="text-label-caps font-semibold text-on-surface-variant block mb-1">
                Tahun Ajaran (TA)
              </label>
              <span className="inline-flex items-center gap-2 font-mono text-body-xs font-bold text-primary bg-primary/10 border border-primary/25 px-2.5 py-2 rounded-xl w-full">
                <Icon name="calendar_today" size={14} />
                TA {effectiveTA}
              </span>
            </div>
            <div>
              <label className="text-label-caps font-semibold text-on-surface-variant block mb-1">
                Default Program Studi
              </label>
              <FormSelect
                value={prodiDefault}
                onChange={setProdiDefault}
                options={effectiveProdiOptions.map((p) => ({ value: p, label: p }))}
              />
            </div>
            <div>
              <label className="text-label-caps font-semibold text-on-surface-variant block mb-1">
                Default Semester
              </label>
              <FormSelect
                value={semesterDefault}
                onChange={(v) => setSemesterDefault(Number(v))}
                options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({ value: s, label: `Semester ${s}` }))}
              />
            </div>
          </div>
        </div>

        {/* Column Mapping Table */}
        <div className="rounded-2xl border border-outline-variant/20 overflow-hidden bg-surface-container-lowest dark:bg-surface-container-low shadow-level-1">
          <div className="divide-y divide-outline-variant/10 max-h-[360px] overflow-y-auto">
            {SYSTEM_FIELDS.map((field) => {
              const isMapped = Boolean(columnMapping[field.key])
              return (
                <div key={field.key} className="flex items-center justify-between p-3 gap-3 hover:bg-surface-container-low/40 transition-colors">
                  <div className="flex items-center gap-2 min-w-[220px]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant shrink-0">
                      <Icon name={field.icon} size={16} />
                    </span>
                    <div>
                      <p className="text-body-sm font-bold text-on-surface leading-tight">{field.label}</p>
                      <p className="text-body-xs font-mono text-on-surface-variant">{field.key}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <select
                      value={columnMapping[field.key] || ''}
                      onChange={(e) => setColumnMapping((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/70 py-2 px-2.5 text-body-xs font-semibold text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/40 cursor-pointer"
                    >
                      <option value="">-- Tidak Dipetakan / Kosong --</option>
                      {rawHeaders.map((header) => (
                        <option key={header} value={header}>
                          Kolom: {header}
                        </option>
                      ))}
                    </select>
                    <span className="shrink-0">
                      {isMapped ? (
                        <span className="inline-flex items-center gap-1 text-label-caps font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          <Icon name="check" size={12} /> Cocok
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-label-caps font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                          Manual
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Checkbox Save Preset */}
        <label className="flex items-center gap-2 text-body-xs font-semibold text-on-surface cursor-pointer select-none">
          <input
            type="checkbox"
            checked={savePreset}
            onChange={(e) => setSavePreset(e.target.checked)}
            className="rounded cursor-pointer text-primary"
          />
          <span>Simpan format pemetaan ini untuk berkas berikutnya</span>
        </label>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/15 shrink-0">
          <Button type="button" variant="secondary" onClick={() => setStep('upload')}>
            <Icon name="arrow_back" size={16} className="mr-1" />
            Unggah Ulang
          </Button>
          <Button type="button" onClick={handleApplyMapping} className="font-bold">
            <span>Lanjut ke Pratinjau</span>
            <Icon name="arrow_forward" size={16} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
