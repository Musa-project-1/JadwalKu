import { Icon } from '../../Icon'
import { Button } from '../../Button'

export function KaldikUploadSidebar({
  fileInputRef,
  dragOver,
  setDragOver,
  handleFileSelect,
  fileName,
  loadMadaniPreset,
  loading,
  progressState,
  errorMsg,
  derivedBounds,
}) {
  return (
    <div className="tablet:col-span-5 flex flex-col space-y-4 p-4 tablet:p-5 border-b tablet:border-b-0 tablet:border-r border-outline-variant/15 bg-surface-container-low/40 dark:bg-surface-container-high/20 overflow-y-auto custom-scrollbar">
      {/* Card 1: File Dropzone */}
      <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-4 space-y-3 shadow-level-1">
        <div className="flex items-center justify-between">
          <label className="block text-body-xs font-bold text-on-surface uppercase tracking-wider">
            Unggah Berkas Kaldik
          </label>
          <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
            Zero-Backend
          </span>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer.files?.[0]
            if (f) handleFileSelect(f)
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-all cursor-pointer ${
            dragOver
              ? 'border-primary bg-primary/10 shadow-level-2'
              : 'border-outline-variant/40 bg-surface-container-lowest dark:bg-surface-container-low hover:border-primary/60 hover:bg-surface-container-low'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFileSelect(f)
            }}
          />
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 group-hover:scale-105 transition-all shadow-level-1">
            <Icon name="cloud_upload" size={24} />
          </div>
          <p className="mt-2 text-body-xs font-bold text-on-surface leading-snug">
            {fileName || 'Tarik & lepas file Kaldik, atau '}
            <span className="text-teal-700 dark:text-teal-400 underline ml-1">Telusuri File</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/25 px-2 py-0.5 text-label-caps font-extrabold text-red-800 dark:text-red-400">
              <Icon name="picture_as_pdf" size={11} /> PDF
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 text-label-caps font-extrabold text-purple-800 dark:text-purple-400">
              <Icon name="image" size={11} /> OCR/Foto
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-label-caps font-extrabold text-emerald-800 dark:text-emerald-400">
              <Icon name="table_view" size={11} /> Excel/CSV
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 border border-teal-500/25 px-2 py-0.5 text-label-caps font-extrabold text-teal-800 dark:text-teal-400">
              <Icon name="data_object" size={11} /> JSON
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Preset Contoh Madani */}
      <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-4 space-y-2 shadow-level-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25">
            <Icon name="auto_awesome" size={16} />
          </div>
          <div className="min-w-0">
            <h4 className="text-body-xs font-bold text-on-surface leading-tight">Preset Contoh Kampus</h4>
            <p className="text-body-xs text-on-surface-variant font-medium">Kalender Universitas Madani T.A. 2026/2027</p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={loadMadaniPreset}
          className="w-full justify-center rounded-full py-2 text-body-xs font-bold border border-outline-variant/30 hover:border-primary cursor-pointer shadow-level-1"
        >
          <Icon name="download" size={14} className="mr-1 text-primary" />
          Muat Preset Madani
        </Button>
      </div>

      {/* Parsing Progress */}
      {loading && (
        <div className="rounded-2xl border border-teal-500/25 bg-teal-500/10 p-4 space-y-2 animate-fade-in shadow-level-1">
          <div className="flex items-center justify-between text-body-xs font-bold text-teal-900 dark:text-teal-200">
            <span>{progressState.stage || 'Menganalisis berkas Kaldik...'}</span>
            <span>{progressState.progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-teal-500/20 overflow-hidden">
            <div
              className="h-full bg-teal-700 dark:bg-teal-400 rounded-full transition-all duration-300"
              style={{ width: `${progressState.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error / Warnings */}
      {errorMsg && (
        <div className="rounded-2xl bg-error/10 border border-error/25 p-3 text-body-xs font-semibold text-error flex items-start gap-2 animate-fade-in shadow-level-1">
          <Icon name="error" size={16} className="shrink-0 mt-0.5" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Derived Bounds Preview Card */}
      {derivedBounds && (
        <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-4 space-y-2 shadow-level-1">
          <span className="block text-body-xs font-extrabold uppercase tracking-wider text-on-surface-variant">
            Kalkulasi TA & Semester Otomatis
          </span>
          <div className="grid grid-cols-2 gap-2 text-label-caps">
            <div className="p-2 rounded-xl bg-surface-container-low border border-outline-variant/15">
              <p className="text-on-surface-variant font-bold text-label-caps">T.A. AKTIF</p>
              <p className="font-extrabold text-primary">{derivedBounds.tahunAjaran || '-'}</p>
            </div>
            <div className="p-2 rounded-xl bg-surface-container-low border border-outline-variant/15">
              <p className="text-on-surface-variant font-bold text-label-caps">SEMESTER</p>
              <p className="font-extrabold text-on-surface uppercase">{derivedBounds.activeSemester || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
