import { useEffect, useState } from 'react'
import { Icon } from '../../Icon'
import { Button } from '../../Button'
import { Input } from '../../Input'
import { getCourseSemester, EMPTY_COURSE_FORM } from '../../../lib/courseUtils'

/**
 * Modal Tambah / Edit mata kuliah. Mengelola state form secara internal dan
 * menyerahkan nilai form terbaru ke `onSubmit(form)` saat disimpan.
 *
 * Reset state internal saat buka/tutup ditangani lewat `key` dari parent
 * (remount), jadi tidak perlu efek samping tambahan.
 */
export default function CourseFormModal({ open, mode, initialForm, saving, errors = [], onClose, onSubmit }) {
  const [form, setForm] = useState(initialForm || EMPTY_COURSE_FORM)

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, saving, onClose])

  if (!open) return null

  function handleKodeMKChange(val) {
    setForm((f) => {
      const derivedSem = getCourseSemester({ kodeMK: val })
      return {
        ...f,
        kodeMK: val,
        ...(derivedSem ? { semester: derivedSem } : {}),
      }
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-4 max-[599px]:items-end max-[599px]:p-0"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low dark:border-outline-variant/15 overflow-hidden animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0">
        <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1 -mx-2 shrink-0">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>
        {/* Header Banner - Rich Full-Width Teal/Emerald Gradient matching the student design system */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-800 p-4 tablet:p-5 text-white shadow-level-1 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-xs">
                <Icon name={mode === 'add' ? 'add_box' : 'edit_document'} size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 className="text-xl tablet:text-2xl font-bold tracking-tight text-white truncate">
                    {mode === 'add' ? 'Tambah Mata Kuliah' : `Edit Mata Kuliah (${form.kodeMK})`}
                  </h3>
                  <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border border-white/25 shadow-2xs">
                    {mode === 'add' ? 'Master MK Baru' : 'Edit Master'}
                  </span>
                </div>
                <p className="text-body-xs text-white/80 font-medium truncate">
                  {mode === 'add' ? 'Daftarkan kode dan nama mata kuliah baru' : 'Perbarui data master mata kuliah'}
                </p>
              </div>
            </div>

            {/* Close Button */}
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 tablet:p-6">
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 tablet:gap-5">
            {/* KIRI — Identitas MK */}
            <div className="space-y-4">
              <Input
                label="Kode MK"
                value={form.kodeMK}
                disabled={mode === 'edit'}
                onChange={(e) => handleKodeMKChange(e.target.value.toUpperCase())}
                placeholder="mis. ARS201 / IF301"
                className="uppercase font-mono font-bold"
              />
              <Input
                label="Nama Mata Kuliah"
                value={form.namaMK}
                onChange={(e) => setForm((f) => ({ ...f, namaMK: e.target.value }))}
                placeholder="Nama mata kuliah"
              />
              <Input
                label="Semester"
                type="number"
                min="1"
                max="14"
                value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: Number(e.target.value) }))}
              />
            </div>
            {/* KANAN — Detail akademik */}
            <div className="space-y-4">
              <Input
                label="Dosen Pengampu"
                value={form.dosen}
                onChange={(e) => setForm((f) => ({ ...f, dosen: e.target.value }))}
                placeholder="Nama lengkap & gelar dosen"
              />
              <Input
                label="Kontak Dosen (No. HP/WA)"
                value={form.kontakDosen}
                onChange={(e) => setForm((f) => ({ ...f, kontakDosen: e.target.value }))}
                placeholder="0812-3456-7890"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Bobot SKS"
                  type="number"
                  min="1"
                  max="6"
                  value={form.sks}
                  onChange={(e) => setForm((f) => ({ ...f, sks: Number(e.target.value) }))}
                />
                <Input
                  label="Durasi (Menit)"
                  type="number"
                  min="30"
                  max="300"
                  step="10"
                  value={form.durasi}
                  onChange={(e) => setForm((f) => ({ ...f, durasi: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="rounded-xl bg-error/10 p-3 text-body-xs font-semibold text-error">
              {errors.map((err) => (
                <p key={err}>{err}</p>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/15 mt-4 col-span-full">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-teal-800 hover:bg-teal-900 text-white font-bold cursor-pointer shadow-xs active:scale-98 transition-all"
            >
              <Icon name="save" size={18} className="mr-1" />
              {saving ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
