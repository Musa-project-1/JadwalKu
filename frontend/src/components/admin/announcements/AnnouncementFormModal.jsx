import { Icon } from '../../Icon'
import { Button } from '../../Button'
import { FormSelect } from '../../FormSelect'
import { CustomDatePicker } from '../../CustomDatePicker'

export function AnnouncementFormModal({
  modalOpen,
  setModalOpen,
  editingItem,
  handleSave,
  saving,
  formJudul,
  setFormJudul,
  formIsi,
  setFormIsi,
  formKategori,
  setFormKategori,
  formProdi,
  setFormProdi,
  availableProdis,
  formSemester,
  setFormSemester,
  formBerlakuHingga,
  setFormBerlakuHingga,
  formAktif,
  setFormAktif,
}) {
  if (!modalOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-4 max-[599px]:items-end max-[599px]:p-0"
    >
      <div
        onClick={() => setModalOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-level-3 dark:bg-surface-container-low dark:border-outline-variant/15 overflow-hidden animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0">
        <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1 -mx-2 shrink-0">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        {/* Header Banner */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-800 p-4 tablet:p-5 text-white flex items-center justify-between border-b border-white/10 shrink-0 shadow-level-1">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-level-1 backdrop-blur-md">
              <Icon name={editingItem ? 'edit_note' : 'campaign'} size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base tablet:text-lg font-bold text-white tracking-tight truncate">
                  {editingItem ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
                </h3>
                <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-label-caps font-extrabold uppercase tracking-wide border border-white/25 shadow-level-1 backdrop-blur-md">
                  {editingItem ? 'Update Siaran' : 'Siaran Langsung'}
                </span>
              </div>
              <p className="text-label-caps text-white/80 font-medium truncate mt-0.5">
                {editingItem ? 'Perbarui informasi siaran pengumuman' : 'Siarkan info akademik atau kuliah pengganti ke mahasiswa'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            aria-label="Tutup modal"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all border border-white/20 cursor-pointer"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 tablet:p-6">
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 tablet:gap-5">
            <div className="space-y-4">
              <div>
                <label className="block text-body-xs font-bold text-on-surface mb-1">
                  Judul Pengumuman *
                </label>
                <input
                  type="text"
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Contoh: Kuliah Pengganti Basis Data / Pindah ke Lab 2"
                  required
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-4 py-2 text-body-xs font-semibold text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                />
              </div>

              <div>
                <label className="block text-body-xs font-bold text-on-surface mb-1">
                  Kategori Pengumuman *
                </label>
                <FormSelect
                  value={formKategori}
                  onChange={setFormKategori}
                  options={[
                    { value: 'info', label: '🔵 Info Umum (Akademik/KRS/Umum)' },
                    { value: 'warning', label: '🟡 Penting / Kuliah Pengganti' },
                    { value: 'urgent', label: '🔴 Darurat / Perubahan Ruangan' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-body-xs font-bold text-on-surface mb-1">
                  Isi / Detail Pengumuman
                </label>
                <textarea
                  id="form-isi-pengumuman"
                  name="form-isi-pengumuman"
                  value={formIsi}
                  onChange={(e) => setFormIsi(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan petunjuk jelas, waktu pengganti, atau pesan dosen..."
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-3 text-body-xs text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-body-xs font-bold text-on-surface mb-1">
                    Target Program Studi
                  </label>
                  <FormSelect
                    value={formProdi}
                    onChange={setFormProdi}
                    options={[
                      { value: 'all', label: '🌐 Semua Prodi' },
                      ...availableProdis.map((p) => ({ value: p, label: p })),
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-body-xs font-bold text-on-surface mb-1">
                    Target Semester
                  </label>
                  <FormSelect
                    value={formSemester}
                    onChange={setFormSemester}
                    options={[
                      { value: 'all', label: 'Semua Semester' },
                      ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14].map((s) => ({
                        value: String(s),
                        label: `Semester ${s}`,
                      })),
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-body-xs font-bold text-on-surface mb-1">
                    Berlaku Hingga (Opsional)
                  </label>
                  <CustomDatePicker
                    value={formBerlakuHingga}
                    onChange={setFormBerlakuHingga}
                    placeholder="Pilih batas waktu..."
                  />
                </div>

                <div className="pt-5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chkAktif"
                    checked={formAktif}
                    onChange={(e) => setFormAktif(e.target.checked)}
                    className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="chkAktif" className="text-body-xs font-bold text-on-surface cursor-pointer">
                    Siarkan Langsung (Aktif)
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-4">
                <span className="block text-label-caps font-extrabold text-on-surface-variant uppercase tracking-wider mb-2.5">
                  Pratinjau Tampilan Mahasiswa
                </span>
                <div
                  className={`rounded-2xl border p-4 text-body-xs shadow-level-1 ${
                    formKategori === 'urgent'
                      ? 'bg-error/10 border-error/30 text-error-950 dark:text-error-100'
                      : formKategori === 'warning'
                      ? 'bg-amber-500/15 border-amber-500/35 text-amber-950 dark:text-amber-100'
                      : 'bg-blue-500/10 border-blue-500/25 text-blue-950 dark:text-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon
                      name={formKategori === 'urgent' ? 'error' : formKategori === 'warning' ? 'warning' : 'info'}
                      size={16}
                      className={
                        formKategori === 'urgent'
                          ? 'text-error'
                          : formKategori === 'warning'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-blue-700 dark:text-blue-400'
                      }
                    />
                    <p className="font-extrabold text-body-sm">{formJudul || 'Judul Pengumuman...'}</p>
                  </div>
                  <p className="opacity-90 leading-relaxed">{formIsi || 'Isi pengumuman akan tampil di sini...'}</p>
                </div>
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-end gap-2 pt-4 border-t border-outline-variant/15 mt-5 col-span-full">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="rounded-full px-4 py-2 text-body-xs font-semibold cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-full px-5 py-2 font-bold shadow-level-1 text-body-xs bg-teal-800 hover:bg-teal-900 text-white cursor-pointer active:scale-98 transition-all"
            >
              <Icon name="campaign" size={17} className="mr-1.5" />
              {saving ? 'Menyimpan...' : 'Simpan Pengumuman'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  )
}
