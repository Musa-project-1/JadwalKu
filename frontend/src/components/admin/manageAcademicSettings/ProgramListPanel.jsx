import { Icon } from '../../Icon'
import { Skeleton } from '../../Skeleton'
import { EmptyState } from '../../EmptyState'

export function ProgramListPanel({
  programs,
  loadingProdi,
  syncingProdi,
  onSyncProdi,
  onOpenAddModal,
  editingProdiId,
  setEditingProdiId,
  editProdiDraft,
  setEditProdiDraft,
  onSaveEditProdi,
  onDeleteTarget,
}) {
  return (
    <section className="h-full flex flex-col justify-between rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 tablet:p-5 shadow-xs dark:bg-surface-container-low min-h-0 space-y-3">
      <div className="flex-1 flex flex-col space-y-3 min-h-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/15 pb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <Icon name="school" size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base tablet:text-lg font-bold tracking-tight text-on-surface">
                Master Program Studi
              </h2>
              <p className="text-[11.5px] font-medium text-on-surface-variant truncate">
                Daftar prodi aktif & rentang semester
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onSyncProdi}
              disabled={syncingProdi}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-container-low/60 px-3 py-1.5 text-[11.5px] font-bold text-on-surface shadow-2xs hover:border-primary hover:text-primary cursor-pointer transition-colors"
              title="Sinkronisasi dari data Jadwal & MK"
            >
              <Icon name="sync" size={13} className={syncingProdi ? 'animate-spin' : ''} />
              <span>
                {syncingProdi ? 'Menyinkronkan...' : 'Sinkron'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[11.5px] font-bold text-on-primary shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
              title="Tambah Program Studi"
              aria-label="Tambah Prodi"
            >
              <Icon name="add" size={15} />
              <span>Tambah Prodi</span>
            </button>
          </div>
        </div>

        {/* List Program Studi */}
        {loadingProdi ? (
          <div className="space-y-2.5">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        ) : programs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10">
            <EmptyState
              icon="school"
              title="Belum ada program studi"
              description="Tambahkan prodi baru atau klik sinkron otomatis."
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
            {programs.map((p) => {
              const isEditing = editingProdiId === p.id
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 p-3 tablet:p-3.5 dark:bg-surface-container-high/20 transition-all hover:border-primary/30 shadow-2xs border-l-4 border-l-emerald-600"
                >
                  {isEditing ? (
                    <div className="flex-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={editProdiDraft.nama}
                        onChange={(e) =>
                          setEditProdiDraft((d) => ({ ...d, nama: e.target.value }))
                        }
                        className="flex-1 rounded-xl border border-outline-variant/30 bg-surface px-3 py-1.5 text-body-sm font-semibold text-on-surface"
                      />
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="14"
                          value={editProdiDraft.semesterMin}
                          onChange={(e) =>
                            setEditProdiDraft((d) => ({
                              ...d,
                              semesterMin: Number(e.target.value),
                            }))
                          }
                          className="w-12 rounded-xl border border-outline-variant/30 bg-surface px-2 py-1.5 text-center text-body-sm font-bold"
                        />
                        <span>–</span>
                        <input
                          type="number"
                          min="1"
                          max="14"
                          value={editProdiDraft.semesterMax}
                          onChange={(e) =>
                            setEditProdiDraft((d) => ({
                              ...d,
                              semesterMax: Number(e.target.value),
                            }))
                          }
                          className="w-12 rounded-xl border border-outline-variant/30 bg-surface px-2 py-1.5 text-center text-body-sm font-bold"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSaveEditProdi(p)}
                          className="rounded-xl bg-primary px-3 py-1.5 text-body-xs font-bold text-on-primary hover:bg-primary/90 cursor-pointer shadow-2xs"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProdiId(null)}
                          className="rounded-xl px-3 py-1.5 text-body-xs font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-body-sm text-on-surface truncate">{p.nama}</p>
                        <span className="inline-flex items-center rounded-lg bg-primary/10 px-2 py-0.5 text-label-caps font-bold text-primary mt-1 border border-primary/20">
                          Semester {p.semesterMin ?? 1} – {p.semesterMax ?? 8}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProdiId(p.id)
                            setEditProdiDraft({
                              nama: p.nama,
                              semesterMin: p.semesterMin ?? 1,
                              semesterMax: p.semesterMax ?? 8,
                            })
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer border border-outline-variant/15"
                          title="Edit Prodi"
                        >
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTarget(p)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer border border-outline-variant/15"
                          title="Hapus Prodi"
                        >
                          <Icon name="delete" size={15} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
