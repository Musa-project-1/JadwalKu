import { useEffect } from 'react'
import { Icon } from '../../Icon'
import { Button } from '../../Button'
import { FormSelect } from '../../FormSelect'
import { CLASS_TYPE_CODES, DAYS } from '../../../lib/uploadValidator'

export function ScheduleFormModal({
  open,
  onClose,
  title,
  subtitle,
  icon = 'edit_calendar',
  submitLabel = 'Simpan Perubahan',
  formData,
  setFormData,
  onSubmit,
  busy,
  prodiOptions,
  courses,
  clashWarning,
  errors = [],
  showStatus = false,
  onCreateCourse,
}) {
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, busy, onClose])

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

      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low overflow-hidden animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0">
        <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1 -mx-2 shrink-0">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        {/* Header Banner - Rich Full-Width Teal/Emerald Gradient matching the student design system */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-800 p-4 tablet:p-5 text-white shadow-level-1 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-xs">
                <Icon name={icon} size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 className="text-xl tablet:text-2xl font-bold tracking-tight text-white truncate">
                    {title}
                  </h3>
                  <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border border-white/25 shadow-2xs">
                    {showStatus ? 'Edit Sesi' : 'Sesi Baru'}
                  </span>
                </div>
                {subtitle && (
                  <p className="text-body-xs text-white/80 font-medium truncate">{subtitle}</p>
                )}
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

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 tablet:p-6">
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 tablet:gap-5">
            {/* KIRI — Waktu & Penempatan */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Hari</label>
                  <FormSelect
                    value={formData.hari}
                    onChange={(val) => setFormData((f) => ({ ...f, hari: val }))}
                    options={DAYS.map((d) => ({ value: d, label: d }))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Jam Mulai</label>
                  <input
                    type="time"
                    value={formData.jamMulai}
                    onChange={(e) => setFormData((f) => ({ ...f, jamMulai: e.target.value }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 font-mono text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Jam Selesai</label>
                  <input
                    type="time"
                    value={formData.jamSelesai}
                    onChange={(e) => setFormData((f) => ({ ...f, jamSelesai: e.target.value }))}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 font-mono text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Tipe Kelas</label>
                  <FormSelect
                    value={formData.tipeKelas}
                    onChange={(val) => setFormData((f) => ({ ...f, tipeKelas: val }))}
                    options={CLASS_TYPE_CODES.map((t) => ({ value: t, label: t }))}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-label-caps uppercase text-on-surface-variant">Program Studi</label>
                <FormSelect
                  value={formData.prodi}
                  onChange={(val) => setFormData((f) => ({ ...f, prodi: val }))}
                  placeholder="- Pilih Prodi -"
                  options={prodiOptions.map((p) => ({ value: p, label: p }))}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-label-caps uppercase text-on-surface-variant">Semester</label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={formData.semester}
                  onChange={(e) => setFormData((f) => ({ ...f, semester: Number(e.target.value) }))}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* KANAN — Identitas MK & Ruang */}
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-label-caps uppercase text-on-surface-variant">Ruangan</label>
                <input
                  type="text"
                  placeholder="mis. Lab 1 / R. 302"
                  value={formData.ruang}
                  onChange={(e) => setFormData((f) => ({ ...f, ruang: e.target.value }))}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-label-caps uppercase text-on-surface-variant">Mata Kuliah</label>
                  {onCreateCourse && (
                    <button
                      type="button"
                      onClick={onCreateCourse}
                      className="text-body-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      + Buat MK Baru
                    </button>
                  )}
                </div>
                <FormSelect
                  value={formData.kodeMK}
                  onChange={(val) => setFormData((f) => ({ ...f, kodeMK: val }))}
                  placeholder="- Pilih Mata Kuliah Terdaftar -"
                  options={courses.map((c) => ({
                    value: c.kodeMK,
                    label: `${c.kodeMK} — ${c.namaMK} (${c.dosen || 'Dosen -'})`,
                  }))}
                />
              </div>

              {showStatus && (
                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Status Publikasi</label>
                  <FormSelect
                    value={formData.status}
                    onChange={(val) => setFormData((f) => ({ ...f, status: val }))}
                    options={[
                      { value: 'published', label: 'Published' },
                      { value: 'draft', label: 'Draft' },
                    ]}
                  />
                </div>
              )}

              {clashWarning && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-500/15 border border-amber-500/30 p-2.5 text-body-xs font-semibold text-amber-900 dark:text-amber-200">
                  <Icon name="warning" size={16} className="shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold">Peringatan Bentrok Jadwal:</p>
                    <p className="text-[11px] mt-0.5">{clashWarning}</p>
                  </div>
                </div>
              )}

              {errors.length > 0 && (
                <div className="rounded-xl bg-error/10 p-2.5 text-body-xs font-semibold text-error">
                  {errors.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

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
              disabled={busy}
              className="bg-teal-800 hover:bg-teal-900 text-white font-bold cursor-pointer shadow-xs active:scale-98 transition-all"
            >
              <Icon name={icon === 'add_circle' ? 'add_circle' : 'save'} size={18} className="mr-1" />
              {busy ? 'Menyimpan...' : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
