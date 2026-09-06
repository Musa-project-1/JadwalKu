import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../Icon'
import { Button } from '../../Button'
import { daysUntil } from '../../../lib/scheduleUtils'
import { useApp } from '../../../hooks/useApp'
import { parseLocalDate, localDateKey } from './taskUtils'
import { PremiumDeadlineField } from './PremiumDeadlineField'

const DEADLINE_CHIPS = [
  { label: 'Hari Ini', days: 0 },
  { label: 'Besok', days: 1 },
  { label: '+3 Hari', days: 3 },
  { label: '+1 Minggu', days: 7 },
  { label: '+2 Minggu', days: 14 },
]

export function AddTaskForm({ initialKodeMK = '', onSubmit, onCancel }) {
  const { t } = useApp()
  const [judul, setJudul] = useState('')
  const [kodeMK, setKodeMK] = useState(initialKodeMK)
  const [deadline, setDeadline] = useState('')
  const [prioritas, setPrioritas] = useState('sedang')
  const [catatan, setCatatan] = useState('')
  const [isProdi, setIsProdi] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Support ESC key to close modal (and close picker first)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (pickerOpen) { setPickerOpen(false); return }
        onCancel?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel, pickerOpen])

  // Helpers for quick deadline presets
  function setOffsetDays(days) {
    const d = new Date()
    d.setDate(d.getDate() + days)
    setDeadline(localDateKey(d))
  }

  const formattedDeadlineInfo = useMemo(() => {
    if (!deadline) return null
    const days = daysUntil(deadline)
    const dateObj = parseLocalDate(deadline)
    const formatted = dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const relative =
      days === 0
        ? 'Hari ini'
        : days === 1
        ? 'Besok'
        : days > 1
        ? `${days} hari lagi`
        : `${Math.abs(days)} hari lewat`
    return { formatted, relative, days }
  }, [deadline])

  function handleSubmit(e) {
    e.preventDefault()
    if (!judul.trim() || !deadline) return
    onSubmit(
      {
        judul: judul.trim(),
        kodeMK: kodeMK.trim(),
        deadline,
        prioritas,
        catatan: catatan.trim(),
        dibuatOleh: isProdi ? 'Komti / Mahasiswa' : 'Pribadi',
      },
      isProdi,
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-6 bg-black/65 backdrop-blur-xs animate-fade-in"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[92vh] tablet:max-h-[88vh] overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-level-3 animate-fade-up flex flex-col"
      >
        {/* Header Modal - Gradient Teal/Indigo Theme */}
        <header className="sticky top-0 z-20 bg-gradient-to-r from-teal-900 via-teal-700 to-indigo-900 p-4 tablet:p-5 text-white shadow-level-1 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-level-1">
                <Icon name="add_task" size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 className="text-xl tablet:text-2xl font-bold tracking-tight text-white truncate">
                    Tambah Tugas Baru
                  </h3>
                  <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-label-caps font-extrabold uppercase tracking-wider border border-white/25 shadow-level-1">
                    Deadline Tracker
                  </span>
                </div>
                <p className="text-body-xs text-white/80 font-medium truncate">
                  Catat tugas kuliah, format pengumpulan, & pantau tenggat waktu
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onCancel}
              aria-label="Tutup modal"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </header>

        {/* Body Content */}
        <div className="p-4 tablet:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* 1. Tipe Tugas: Pribadi vs Bersama Prodi */}
          <div>
            <label className="mb-1.5 block text-label-caps uppercase tracking-wider font-extrabold text-on-surface-variant">
              Tipe Tugas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsProdi(false)}
                className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-3 text-body-xs font-bold transition-all cursor-pointer ${
                  !isProdi
                    ? 'border-primary bg-primary/10 text-primary shadow-level-1 ring-1 ring-primary/25'
                    : 'border-outline-variant/30 bg-surface-container-low/40 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <Icon name="person" size={18} />
                <span>Tugas Pribadi</span>
              </button>
              <button
                type="button"
                onClick={() => setIsProdi(true)}
                className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-3 text-body-xs font-bold transition-all cursor-pointer ${
                  isProdi
                    ? 'border-primary bg-primary/10 text-primary shadow-level-1 ring-1 ring-primary/25'
                    : 'border-outline-variant/30 bg-surface-container-low/40 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <Icon name="corporate_fare" size={18} />
                <span>Bersama Prodi</span>
              </button>
            </div>
            <p className="mt-1.5 text-body-xs text-on-surface-variant font-medium">
              {isProdi
                ? 'Tugas ini akan tersinkronisasi ke seluruh mahasiswa di prodi & semester yang sama.'
                : 'Tugas ini hanya tersimpan di perangkat lokal Anda.'}
            </p>
          </div>

          {/* 2. Judul Tugas */}
          <label className="block">
            <span className="mb-1 block text-label-caps uppercase tracking-wider font-extrabold text-on-surface-variant">
              Judul Tugas *
            </span>
            <input
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              required
              placeholder="Contoh: Makalah Etika Profesi Bab 1-3"
              className="w-full rounded-2xl border border-outline-variant/35 bg-surface-container-low/40 px-4 py-2.5 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none dark:bg-surface-container-high/40 shadow-level-1"
            />
          </label>

          {/* 3. Kode MK & Premium Deadline Selector */}
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-label-caps uppercase tracking-wider font-extrabold text-on-surface-variant">
                Kode Mata Kuliah (Opsional)
              </span>
              <input
                value={kodeMK}
                onChange={(e) => setKodeMK(e.target.value)}
                placeholder="Contoh: IF301"
                className="w-full rounded-2xl border border-outline-variant/35 bg-surface-container-low/40 px-4 py-2.5 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none dark:bg-surface-container-high/40 shadow-level-1"
              />
            </label>

            {/* Premium Tenggat Waktu – Dropdown Date Picker (Premium) */}
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-4 space-y-3 shadow-level-1">
              <div className="flex items-center justify-between">
                <span className="text-label-caps uppercase tracking-wider font-extrabold text-on-surface-variant flex items-center gap-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/15">
                    <Icon name="calendar_month" size={14} />
                  </span>
                  <span>Tenggat Waktu *</span>
                </span>
                {formattedDeadlineInfo && (
                  <span className={`text-body-xs font-extrabold px-2.5 py-1 rounded-full border shadow-level-1 ${
                    formattedDeadlineInfo.days < 0
                      ? 'bg-error/15 text-error border-error/25'
                      : formattedDeadlineInfo.days <= 1
                        ? 'bg-error/10 text-error border-error/20'
                        : formattedDeadlineInfo.days <= 3
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/25'
                          : 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                  }`}>
                    {formattedDeadlineInfo.relative}
                  </span>
                )}
              </div>

              {/* Pintasan – pill premium */}
              <div>
                <span className="mb-1.5 block text-label-caps font-extrabold uppercase tracking-widest text-on-surface-variant/70">Pintasan:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {DEADLINE_CHIPS.map((chip) => {
                    const isActive = (() => {
                      if (!deadline) return false
                      const target = new Date(); target.setDate(target.getDate() + chip.days)
                      return deadline === localDateKey(target)
                    })()
                    return (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => { setOffsetDays(chip.days); setPickerOpen(false) }}
                        className={`px-3 py-1 rounded-full text-label-caps font-bold border transition-all cursor-pointer active:scale-95 ${
                          isActive
                            ? 'bg-primary text-on-primary border-primary shadow-level-1'
                            : 'bg-surface-container-high/70 hover:bg-surface-container-high text-on-surface border-outline-variant/25 hover:border-outline-variant/40'
                        }`}
                      >
                        {chip.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Premium Dropdown Field */}
              <PremiumDeadlineField
                deadline={deadline}
                setDeadline={setDeadline}
                pickerOpen={pickerOpen}
                setPickerOpen={setPickerOpen}
                formattedDeadlineInfo={formattedDeadlineInfo}
              />

              {formattedDeadlineInfo && (
                <p className="text-label-caps text-on-surface-variant font-medium flex items-center gap-1.5">
                  <Icon name="event_available" size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Jatuh tempo: <strong className="text-on-surface">{formattedDeadlineInfo.formatted}</strong> · {formattedDeadlineInfo.relative}</span>
                </p>
              )}
            </div>
          </div>

          {/* 4. Tingkat Prioritas */}
          <fieldset>
            <legend className="mb-1.5 text-label-caps uppercase tracking-wider font-extrabold text-on-surface-variant">
              Tingkat Prioritas
            </legend>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPrioritas('tinggi')}
                className={`rounded-2xl border-2 py-2.5 px-2 text-body-xs font-extrabold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  prioritas === 'tinggi'
                    ? 'border-error bg-error/15 text-error ring-1 ring-error/25 shadow-level-1'
                    : 'border-outline-variant/30 bg-surface-container-low/40 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span>{t ? t('task_form.urgent') : 'Mendesak'}</span>
                <span className="text-label-caps opacity-75 font-medium">{t ? t('task_form.priority_high') : 'Prioritas Tinggi'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPrioritas('sedang')}
                className={`rounded-2xl border-2 py-2.5 px-2 text-body-xs font-extrabold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  prioritas === 'sedang'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500/25 shadow-level-1'
                    : 'border-outline-variant/30 bg-surface-container-low/40 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span>{t ? t('task_form.medium') : 'Segera'}</span>
                <span className="text-label-caps opacity-75 font-medium">{t ? t('task_form.priority_med') : 'Prioritas Sedang'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPrioritas('rendah')}
                className={`rounded-2xl border-2 py-2.5 px-2 text-body-xs font-extrabold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  prioritas === 'rendah'
                    ? 'border-blue-500 bg-blue-500/15 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500/25 shadow-level-1'
                    : 'border-outline-variant/30 bg-surface-container-low/40 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span>{t ? t('task_form.low') : 'Masih Lama'}</span>
                <span className="text-label-caps opacity-75 font-medium">{t ? t('task_form.priority_low') : 'Prioritas Rendah'}</span>
              </button>
            </div>
          </fieldset>

          {/* 5. Catatan / Instruksi Tugas */}
          <label className="block">
            <span className="mb-1 block text-label-caps uppercase tracking-wider font-extrabold text-on-surface-variant">
              Catatan / Instruksi Tugas
            </span>
            <textarea
              id="task-catatan"
              name="task-catatan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder="Tuliskan format pengumpulan, link materi/drive, nomor bab, atau catatan penting..."
              className="w-full resize-none rounded-2xl border border-outline-variant/35 bg-surface-container-low/40 p-3 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none dark:bg-surface-container-high/40 shadow-level-1"
            />
          </label>
        </div>

        {/* Footer Actions */}
        <footer className="flex items-center justify-end gap-2.5 p-4 border-t border-outline-variant/15 bg-surface-container-low/40 shrink-0">
          <Button type="button" variant="secondary" onClick={onCancel} className="px-5 py-2 font-semibold">
            {t ? t('modal.cancel') : 'Batal'}
          </Button>
          <Button type="submit" className="px-6 py-2 font-bold shadow-level-1">
            {t ? t('task_form.save_btn') : 'Simpan Tugas'}
          </Button>
        </footer>
      </form>
    </div>
  )
}
