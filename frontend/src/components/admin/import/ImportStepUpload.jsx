import { Icon } from '../../Icon'
import { FormSelect } from '../../FormSelect'

export function ImportStepUpload({
  selectedTA,
  setSelectedTA,
  isCustomTA,
  setIsCustomTA,
  customTAInput,
  setCustomTAInput,
  taOptions,
  dragOver,
  setDragOver,
  handleFileSelect,
  fileInputRef,
  fileName,
  loading,
  progressState,
  errorMsg,
}) {
  return (
    <div className="p-5 tablet:p-6 space-y-4">
      {/* Global Batch Settings: Tahun Ajaran */}
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-container-high/40 border border-outline-variant/20 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
            <Icon name="calendar_today" size={18} />
          </div>
          <div>
            <p className="text-body-xs font-bold text-on-surface">
              Tahun Ajaran untuk Berkas Ini:
            </p>
            <p className="text-label-caps font-medium text-on-surface-variant">
              Berlaku serentak untuk seluruh jadwal dalam berkas ini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCustomTA ? (
            <div className="w-60 min-w-[220px]">
              <FormSelect
                value={selectedTA}
                onChange={(val) => {
                  if (val === '__NEW__') {
                    setIsCustomTA(true)
                  } else {
                    setSelectedTA(val)
                  }
                }}
                options={taOptions}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="mis. 2026/2027"
                value={customTAInput}
                onChange={(e) => setCustomTAInput(e.target.value)}
                className="w-36 rounded-xl border border-teal-600 bg-surface-container-lowest p-2 text-body-xs font-bold text-on-surface focus:outline-none dark:bg-surface-container-low shadow-level-1"
              />
              <button
                type="button"
                onClick={() => {
                  setIsCustomTA(false)
                  setCustomTAInput('')
                }}
                className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container cursor-pointer"
                title="Batal TA Baru"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dropzone Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) handleFileSelect(f)
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`group flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-7 text-center transition-all cursor-pointer ${
          dragOver
            ? 'border-primary bg-primary/10 shadow-level-2'
            : 'border-outline-variant/40 bg-surface-container-low/40 hover:border-primary/60 hover:bg-surface-container-low'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.docx,.pdf,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFileSelect(f)
          }}
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors shadow-level-1">
          <Icon name="cloud_upload" size={30} />
        </div>

        <p className="mt-3 text-body-md font-bold text-on-surface">
          {fileName || 'Tarik & lepas file ke sini, atau '}
          <span className="text-primary underline ml-1">Telusuri File</span>
        </p>

        {/* Supported Format Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
          <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-label-caps font-bold text-emerald-800 dark:text-emerald-400">
            📊 Excel .xlsx/.xls
          </span>
          <span className="inline-flex items-center gap-1 rounded-xl bg-teal-500/10 border border-teal-500/25 px-2.5 py-1 text-label-caps font-bold text-teal-800 dark:text-teal-400">
            📋 CSV
          </span>
          <span className="inline-flex items-center gap-1 rounded-xl bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 text-label-caps font-bold text-blue-800 dark:text-blue-400">
            📄 Word .docx
          </span>
          <span className="inline-flex items-center gap-1 rounded-xl bg-red-500/10 border border-red-500/25 px-2.5 py-1 text-label-caps font-bold text-red-800 dark:text-red-400">
            📑 PDF Digital
          </span>
          <span className="inline-flex items-center gap-1 rounded-xl bg-purple-500/10 border border-purple-500/25 px-2.5 py-1 text-label-caps font-bold text-purple-800 dark:text-purple-400">
            📸 Gambar/OCR
          </span>
        </div>
      </div>

      {/* Parsing Progress Bar */}
      {loading && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-body-xs font-bold text-primary">
            <span>{progressState.stage || 'Memproses berkas...'}</span>
            <span>{progressState.progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-primary/15 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressState.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="rounded-2xl bg-error/10 border border-error/25 p-4 text-body-xs font-semibold text-error flex items-start gap-2 animate-fade-in">
          <Icon name="error" size={18} className="shrink-0 mt-0.5" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Information Tips */}
      <div className="rounded-2xl bg-surface-container-high/40 border border-outline-variant/20 p-4 space-y-1.5 text-body-xs text-on-surface-variant">
        <p className="flex items-center gap-2 font-bold text-on-surface">
          <Icon name="lightbulb" size={16} className="text-amber-500 shrink-0" />
          Tips Penggunaan:
        </p>
        <ul className="list-disc list-inside space-y-0.5 text-body-xs pl-1">
          <li>Format Excel resmi kampus Anda akan <strong>otomatis diproses instan</strong> tanpa perlu pemetaan ulang.</li>
          <li>Untuk dokumen <strong>PDF</strong>, pastikan menggunakan format digital resmi (teks dapat diblok/disalin).</li>
          <li>Untuk <strong>foto kertas jadwal</strong>, gunakan resolusi yang tajam dan pencahayaan terang untuk hasil OCR optimal.</li>
        </ul>
      </div>
    </div>
  )
}
