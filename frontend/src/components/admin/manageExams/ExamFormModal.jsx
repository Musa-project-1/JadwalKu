import { useEffect, useMemo } from 'react'
import { Icon } from '../../Icon'
import { Button } from '../../Button'
import { FormSelect } from '../../FormSelect'
import { CustomDatePicker } from '../../CustomDatePicker'
import { useCampus } from '../../../context/CampusContext'

export function ExamFormModal({
  open,
  onClose,
  editingTarget,
  form,
  setForm,
  onSubmit,
  busy,
  courseMap,
  errors = [],
}) {
  const { prodiNames } = useCampus()
  const prodiOptions = useMemo(
    () => prodiNames.filter(Boolean).map((nama) => ({ value: nama, label: nama })),
    [prodiNames],
  )
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
        <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-950 via-teal-800 to-emerald-900 p-4 tablet:p-5 text-white flex items-center justify-between border-b border-white/10 shrink-0 shadow-level-1">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-xs backdrop-blur-md">
              <Icon name={editingTarget ? 'edit_calendar' : 'add_circle'} size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base tablet:text-lg font-bold text-white tracking-tight truncate">
                  {editingTarget ? `Edit Jadwal Ujian (${editingTarget.kodeMK})` : 'Tambah Jadwal Ujian'}
                </h3>
                <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border border-white/25 shadow-2xs backdrop-blur-md">
                  {editingTarget ? 'Update Ujian' : 'Draft Ujian Baru'}
                </span>
              </div>
              <p className="text-[11.5px] text-white/80 font-medium truncate mt-0.5">
                {editingTarget ? 'Perbarui informasi sesi ujian' : 'Daftarkan jadwal UTS / UAS baru ke database'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all border border-white/20 cursor-pointer"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 tablet:p-6">
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 tablet:gap-5">
            {/* KIRI — Identitas ujian */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-body-xs font-bold text-on-surface mb-1">
                    Jenis Ujian *
                  </label>
                  <FormSelect
                    value={form.jenis}
                    onChange={(val) => setForm((f) => ({ ...f, jenis: val }))}
                    options={[
                      { value: 'UTS', label: 'UTS (Tengah Semester)' },
                      { value: 'UAS', label: 'UAS (Akhir Semester)' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-body-xs font-bold text-on-surface mb-1">
                    Mode Pelaksanaan *
                  </label>
                  <FormSelect
                    value={form.mode}
                    onChange={(val) => setForm((f) => ({ ...f, mode: val }))}
                    options={[
                      { value: 'Offline', label: 'Offline (Tatap Muka)' },
                      { value: 'Online', label: 'Online (Daring)' },
                    ]}
                  />
                </div>
              </div>

              {/* Kode MK */}
              <div>
                <label className="block text-body-xs font-bold text-on-surface mb-1">
                  Kode Mata Kuliah *
                </label>
                <input
                  type="text"
                  value={form.kodeMK}
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase()
                    const matched = courseMap.get(code)
                    setForm((f) => ({
                      ...f,
                      kodeMK: code,
                      prodi: matched?.prodi || f.prodi,
                      semester: matched?.semester || f.semester,
                    }))
                  }}
                  placeholder="mis. IF301"
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3.5 py-2 font-mono text-body-sm font-bold text-on-surface uppercase focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                  required
                />
                {form.kodeMK && courseMap.get(form.kodeMK) && (
                  <p className="text-[11px] font-semibold text-primary mt-1">
                    ✓ {courseMap.get(form.kodeMK).namaMK} ({courseMap.get(form.kodeMK).dosen || 'Dosen'})
                  </p>
                )}
              </div>

              {/* Prodi & Semester */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-body-xs font-bold text-on-surface mb-1">
                    Program Studi *
                  </label>
                  <FormSelect
                    value={form.prodi}
                    onChange={(val) => setForm((f) => ({ ...f, prodi: val }))}
                    placeholder="Pilih Prodi"
                    options={prodiOptions}
                  />
                </div>

                <div>
                  <label className="block text-body-xs font-bold text-on-surface mb-1">
                    Semester *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={form.semester}
                    onChange={(e) => setForm((f) => ({ ...f, semester: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3.5 py-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                    required
                  />
                </div>
              </div>
            </div>

            {/* KANAN — Waktu & Tempat */}
            <div className="space-y-4">
              <div>
                <label className="block text-body-xs font-bold text-on-surface mb-1">
                  Tanggal *
                </label>
                <CustomDatePicker
                  value={form.tanggal}
                  onChange={(val) => setForm((f) => ({ ...f, tanggal: val }))}
                  placeholder="Pilih tanggal ujian..."
                />
              </div>

              <div>
                <label className="block text-body-xs font-bold text-on-surface mb-1">
                  Waktu / Jam *
                </label>
                <input
                  type="text"
                  value={form.jam}
                  onChange={(e) => setForm((f) => ({ ...f, jam: e.target.value }))}
                  placeholder="08:00 - 10:00"
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3.5 py-2 text-body-xs font-semibold text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                  required
                />
              </div>

              <div>
                <label className="block text-body-xs font-bold text-on-surface mb-1">
                  Ruang
                </label>
                <input
                  type="text"
                  value={form.ruang}
                  onChange={(e) => setForm((f) => ({ ...f, ruang: e.target.value }))}
                  placeholder="R. 301 / Lab"
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3.5 py-2 text-body-xs font-semibold text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                />
              </div>
            </div>

            {/* Error List */}
            {errors.length > 0 && (
              <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-body-xs text-error col-span-full">
                {errors.map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-outline-variant/15 mt-4 col-span-full">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-body-xs font-semibold cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="rounded-full px-5 py-2 font-bold shadow-xs text-body-xs bg-teal-800 hover:bg-teal-900 text-white cursor-pointer active:scale-98 transition-all"
            >
              <Icon name="save" size={17} className="mr-1.5" />
              {editingTarget ? 'Simpan Perubahan' : 'Tambah sebagai Draft'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
