import { useEffect } from 'react'
import { Icon } from '../../Icon'
import { Button } from '../../Button'
import { FormSelect } from '../../FormSelect'
import { CLASS_TYPE_CODES, DAYS } from '../../../lib/uploadValidator'

export function GroupEditModal({
  groupEditing,
  onClose,
  onSubmit,
  patchGroupForm,
  courses,
  busy,
  errors = [],
}) {
  useEffect(() => {
    if (!groupEditing) return
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [groupEditing, busy, onClose])

  if (!groupEditing) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 max-[599px]:items-end max-[599px]:justify-stretch max-[599px]:p-0"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
      />
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low overflow-hidden animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none">
        <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1 -mx-2 shrink-0">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>
        <header className="flex items-start justify-between p-5 border-b border-outline-variant/15 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
              <Icon name="edit_note" size={22} />
            </span>
            <div className="min-w-0">
              <h3 className="text-title-lg font-bold tracking-tight text-on-surface">
                Edit Grup ({groupEditing.group.items.length} sesi)
              </h3>
              <p className="text-body-xs font-medium text-on-surface-variant truncate">
                {groupEditing.group.items[0].kodeMK} —{' '}
                {groupEditing.group.items.map((it) => it.prodi).join(', ')}
              </p>
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                Aksi ini berlaku untuk SEMUA prodi dalam grup sekaligus. Untuk edit 1 prodi saja: expand baris → edit per-prodi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container cursor-pointer shrink-0"
          >
            <Icon name="close" size={20} />
          </button>
        </header>
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 tablet:p-6">
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 tablet:gap-5">
            {/* KIRI — Ringkasan grup */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3.5">
                <p className="text-label-caps uppercase font-bold text-amber-800 dark:text-amber-300 mb-2">
                  Grup — {groupEditing.group.items.length} sesi terhubung
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {groupEditing.group.items.map((it) => (
                    <span
                      key={it.id}
                      className="inline-flex items-center rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300"
                    >
                      {it.prodi} S{it.semester}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] font-medium text-amber-800/80 dark:text-amber-200/80 mt-2">
                  Kode, jam, dosen & ruang yang identik — perubahan di kanan akan diterapkan ke semua prodi ini.
                </p>
              </div>
            </div>
            {/* KANAN — Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Hari</label>
                  <FormSelect
                    value={groupEditing.editForm.hari}
                    onChange={(val) => patchGroupForm({ hari: val })}
                    options={DAYS.map((d) => ({ value: d, label: d }))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Jam Mulai</label>
                  <input
                    type="time"
                    value={groupEditing.editForm.jamMulai}
                    onChange={(e) => patchGroupForm({ jamMulai: e.target.value })}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 font-mono text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Jam Selesai</label>
                  <input
                    type="time"
                    value={groupEditing.editForm.jamSelesai}
                    onChange={(e) => patchGroupForm({ jamSelesai: e.target.value })}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 font-mono text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-label-caps uppercase text-on-surface-variant">Tipe Kelas</label>
                  <FormSelect
                    value={groupEditing.editForm.tipeKelas}
                    onChange={(val) => patchGroupForm({ tipeKelas: val })}
                    options={CLASS_TYPE_CODES.map((t) => ({ value: t, label: t }))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-label-caps uppercase text-on-surface-variant">Mata Kuliah</label>
                <FormSelect
                  value={groupEditing.editForm.kodeMK}
                  onChange={(val) => patchGroupForm({ kodeMK: val })}
                  options={courses.map((cc) => ({
                    value: cc.kodeMK,
                    label: `${cc.kodeMK} — ${cc.namaMK}`,
                  }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-label-caps uppercase text-on-surface-variant">Ruangan</label>
                <input
                  type="text"
                  value={groupEditing.editForm.ruang}
                  onChange={(e) => patchGroupForm({ ruang: e.target.value })}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-label-caps uppercase text-on-surface-variant">Status</label>
                <FormSelect
                  value={groupEditing.editForm.status}
                  onChange={(val) => patchGroupForm({ status: val })}
                  options={[
                    { value: 'published', label: 'Published' },
                    { value: 'draft', label: 'Draft' },
                  ]}
                />
              </div>
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
            <Button type="submit" disabled={busy} className="font-bold cursor-pointer">
              <Icon name="save" size={18} className="mr-1" />
              {busy ? 'Menyimpan...' : `Simpan Grup (${groupEditing.group.items.length} sesi)`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
