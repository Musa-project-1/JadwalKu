import { useEffect } from 'react'
import { Icon } from '../../Icon'
import { Button } from '../../Button'
import { Input } from '../../Input'

export function QuickCourseModal({
  open,
  onClose,
  onSubmit,
  formData,
  setFormData,
  saving,
  errors = [],
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 max-[599px]:items-end max-[599px]:justify-stretch max-[599px]:p-0"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low overflow-hidden animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0">
        <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1 -mx-2 shrink-0">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>
        <header className="flex items-center justify-between p-5 border-b border-outline-variant/15 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon name="menu_book" size={22} />
            </span>
            <div>
              <h3 className="text-title-md font-bold text-on-surface">Tambah Mata Kuliah Baru</h3>
              <p className="text-body-xs font-medium text-on-surface-variant">Buat master mata kuliah instan</p>
            </div>
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
            <div className="space-y-3">
              <Input
                label="Kode MK"
                value={formData.kodeMK}
                onChange={(e) => setFormData((f) => ({ ...f, kodeMK: e.target.value.toUpperCase() }))}
                placeholder="mis. IF201"
                className="uppercase font-mono font-bold"
              />
              <Input
                label="Nama Mata Kuliah"
                value={formData.namaMK}
                onChange={(e) => setFormData((f) => ({ ...f, namaMK: e.target.value }))}
                placeholder="Nama lengkap mata kuliah"
              />
              <Input
                label="Dosen Pengampu"
                value={formData.dosen}
                onChange={(e) => setFormData((f) => ({ ...f, dosen: e.target.value }))}
                placeholder="Nama & Gelar Dosen"
              />
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <Input
                  label="SKS"
                  type="number"
                  min="1"
                  max="6"
                  value={formData.sks}
                  onChange={(e) => setFormData((f) => ({ ...f, sks: Number(e.target.value) }))}
                />
                <Input
                  label="Durasi (menit)"
                  type="number"
                  min="30"
                  max="300"
                  step="10"
                  value={formData.durasi}
                  onChange={(e) => setFormData((f) => ({ ...f, durasi: Number(e.target.value) }))}
                />
              </div>
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3.5">
                <p className="text-label-caps uppercase font-bold text-primary mb-1">Tips</p>
                <p className="text-body-xs font-medium leading-relaxed text-on-surface-variant">
                  MK baru akan langsung tersedia di dropdown “Pilih Mata Kuliah” tanpa reload. Kode MK jadi key unik.
                </p>
              </div>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="rounded-xl bg-error/10 p-2 text-body-xs font-semibold text-error mt-4">
              {errors.map((err) => (
                <p key={err}>{err}</p>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant/15 mt-4 col-span-full">
            <Button type="button" variant="secondary" onClick={onClose} className="cursor-pointer">
              Batal
            </Button>
            <Button type="submit" disabled={saving} className="font-bold cursor-pointer">
              <Icon name="add" size={18} className="mr-1" />
              {saving ? 'Menyimpan...' : 'Simpan MK'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
