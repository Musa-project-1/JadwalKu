import { useEffect } from 'react'
import { Button } from '../../Button'
import { Icon } from '../../Icon'
import { FormSelect } from '../../FormSelect'

const SEMESTER_OPTIONS = Array.from({ length: 14 }, (_, i) => i + 1)

export default function AddProdiModal({
  open,
  onClose,
  nama,
  onNamaChange,
  min,
  onMinChange,
  max,
  onMaxChange,
  error,
  saving,
  onSubmit,
}) {
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, saving, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 max-[599px]:items-end max-[599px]:p-0"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl overflow-hidden animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0">
        <div aria-hidden className="hidden max-[599px]:flex justify-center pt-3 pb-1 shrink-0">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>
        <header className="flex items-center justify-between p-5 border-b border-outline-variant/15 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon name="school" size={20} />
            </span>
            <h3 className="text-title-lg font-bold text-on-surface">Tambah Program Studi</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container cursor-pointer"
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 tablet:p-6">
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 tablet:gap-5">
            <div className="space-y-4">
              <div>
                <label className="text-label-caps uppercase text-on-surface-variant block mb-1">
                  Nama Program Studi
                </label>
                <input
                  type="text"
                  placeholder="mis. Teknik Biomedis"
                  value={nama}
                  onChange={(e) => onNamaChange(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-3 py-2 text-body-sm font-semibold text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">
                    Semester Min
                  </label>
                  <FormSelect
                    value={min}
                    onChange={(val) => onMinChange(Number(val))}
                    options={SEMESTER_OPTIONS.map((s) => ({ value: s, label: String(s) }))}
                  />
                </div>
                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">
                    Semester Max
                  </label>
                  <FormSelect
                    value={max}
                    onChange={(val) => onMaxChange(Number(val))}
                    options={SEMESTER_OPTIONS.map((s) => ({ value: s, label: String(s) }))}
                  />
                </div>
              </div>
            </div>
            {error && (
              <p className="text-body-xs font-semibold text-error col-span-full">{error}</p>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-outline-variant/15 mt-4 shrink-0">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={saving} className="font-bold">
              {saving ? 'Menyimpan...' : 'Simpan Prodi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
