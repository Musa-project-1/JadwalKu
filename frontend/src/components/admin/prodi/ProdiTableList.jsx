import { Icon } from '../../Icon'
import { Input } from '../../Input'
import { FormSelect } from '../../FormSelect'
import { Skeleton } from '../../Skeleton'
import { getProdiTokenMap } from '../../../lib/prodiColors'

export function ProdiTableList({
  loading,
  filtered,
  groupedByFakultas,
  fakultasNameMap,
  fakultasList,
  editingId,
  editDraft,
  setEditDraft,
  handleEditSave,
  setEditingId,
  startEdit,
  setDeleteTarget,
  semesterOptions,
  search,
  fakultasFilter,
}) {
  if (loading) {
    return (
      <div className="space-y-2.5">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low/20">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-level-1">
          <Icon name="school" size={24} />
        </div>
        <p className="mt-2.5 text-body-xs font-bold text-on-surface">Tidak ada program studi ditemukan</p>
        <p className="text-label-caps text-on-surface-variant max-w-xs mt-0.5">
          {search || fakultasFilter !== 'Semua'
            ? 'Coba sesuaikan kata kunci pencarian atau filter fakultas.'
            : 'Klik tombol "+ Tambah Prodi" di atas untuk menambahkan jurusan baru.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Array.from(groupedByFakultas.entries()).map(([fid, prodis]) => (
        <div key={fid} className="space-y-2">
          <div className="flex items-center gap-2 text-label-caps font-extrabold uppercase tracking-wider text-on-surface-variant/80 px-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>{fid === '__tanpa__' ? 'Tanpa Fakultas Terhubung' : (fakultasNameMap.get(fid) || fid)}</span>
            <span className="rounded-full bg-surface-container-high px-2 py-0.2 text-[10px] font-bold border border-outline-variant/20">
              {prodis.length}
            </span>
            <span className="h-px flex-1 bg-outline-variant/20" />
          </div>

          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low overflow-hidden shadow-2xs divide-y divide-outline-variant/15">
            {prodis.map((program) => {
              const isEditing = editingId === program.id
              const colors = getProdiTokenMap(program.nama)
              return (
                <div
                  key={program.id}
                  className="p-3 tablet:px-4 flex items-center justify-between gap-3 hover:bg-surface-container-low/40 transition-colors"
                >
                  {isEditing ? (
                    <div className="grid flex-1 gap-2 tablet:grid-cols-[1.5fr_1.2fr_auto_auto_auto] tablet:items-center">
                      <Input
                        value={editDraft.nama}
                        onChange={(e) => setEditDraft((d) => ({ ...d, nama: e.target.value }))}
                      />
                      <FormSelect
                        value={editDraft.fakultasId || ''}
                        onChange={(val) => setEditDraft((d) => ({ ...d, fakultasId: String(val || '') }))}
                        options={[
                          { value: '', label: 'Tanpa Fakultas' },
                          ...(fakultasList || []).map((f) => ({
                            value: String(f.id),
                            label: String(f.nama || f.singkatan || f.id),
                          })),
                        ]}
                        placeholder="Fakultas"
                      />
                      <FormSelect
                        value={editDraft.semesterMin}
                        onChange={(val) => setEditDraft((d) => ({ ...d, semesterMin: Number(val) }))}
                        options={semesterOptions.map((n) => ({ value: n, label: String(n) }))}
                      />
                      <FormSelect
                        value={editDraft.semesterMax}
                        onChange={(val) => setEditDraft((d) => ({ ...d, semesterMax: Number(val) }))}
                        options={semesterOptions.map((n) => ({ value: n, label: String(n) }))}
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditSave(program)}
                          className="h-8 w-8 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs hover:opacity-90 cursor-pointer"
                          title="Simpan"
                        >
                          <Icon name="check" size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="h-8 w-8 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center hover:text-on-surface cursor-pointer"
                          title="Batal"
                        >
                          <Icon name="close" size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-body-xs font-bold border shadow-2xs ${colors.bg} ${colors.text} ${colors.border}`}
                        >
                          {program.nama.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-body-sm text-on-surface tracking-tight truncate block">
                            {program.nama}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="rounded-full bg-surface-container-high/80 px-2 py-0.2 text-[10.5px] font-bold text-on-surface-variant border border-outline-variant/20">
                              Semester {program.semesterMin ?? 1} – {program.semesterMax ?? 8}
                            </span>
                            {program.fakultasId && (
                              <span className="text-[11px] text-on-surface-variant/80 truncate">
                                · {fakultasNameMap.get(program.fakultasId) || program.fakultasId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(program)}
                          className="h-8 w-8 rounded-xl border border-outline-variant/20 bg-surface-container-low/60 hover:bg-surface-container text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                          title="Edit Prodi"
                        >
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(program)}
                          className="h-8 w-8 rounded-xl border border-outline-variant/20 bg-surface-container-low/60 hover:bg-error/15 text-on-surface-variant hover:text-error flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
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
        </div>
      ))}
    </div>
  )
}
