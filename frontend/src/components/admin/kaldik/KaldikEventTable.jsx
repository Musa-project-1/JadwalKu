import { Icon } from '../../Icon'
import { Button } from '../../Button'

export function KaldikEventTable({
  totalEventsCount,
  handleAddManual,
  events,
  editingIdx,
  editDraft,
  handleEditField,
  cancelEdit,
  saveEdit,
  startEdit,
  handleDelete,
  onClose,
  busySaving,
  existingEvents,
  handleImport,
}) {
  return (
    <div className="tablet:col-span-7 flex flex-col flex-1 min-h-0 bg-surface-container-lowest dark:bg-surface-container-low p-4 tablet:p-5 overflow-hidden">
      {/* Top Table Control Bar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-outline-variant/15 shrink-0 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-full bg-teal-500/10 text-teal-800 dark:text-teal-400 border border-teal-500/20 px-2.5 py-0.5 text-body-xs font-extrabold shadow-level-1">
            {totalEventsCount.total} Event Terdeteksi
          </span>
          <span className="rounded-full bg-blue-500/10 text-blue-800 dark:text-blue-400 border border-blue-500/20 px-2.5 py-0.5 text-label-caps font-bold">
            {totalEventsCount.ganjil} Ganjil
          </span>
          <span className="rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-label-caps font-bold">
            {totalEventsCount.genap} Genap
          </span>
        </div>
        <button
          type="button"
          onClick={handleAddManual}
          className="inline-flex items-center gap-1 rounded-full border border-teal-600/30 bg-teal-500/10 px-3 py-1 text-label-caps font-bold text-teal-800 dark:text-teal-400 hover:bg-teal-500/20 transition-colors cursor-pointer shadow-level-1"
        >
          <Icon name="add" size={13} />
          <span>Tambah Event</span>
        </button>
      </div>

      {/* Event List Table */}
      {events.length > 0 ? (
        <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 border border-outline-variant/15 rounded-2xl my-3 custom-scrollbar">
          <table className="w-full table-fixed text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-surface-container-low/95 dark:bg-surface-container-high/95 backdrop-blur-md shadow-level-1">
              <tr className="border-b border-outline-variant/15">
                <th className="px-3 py-2 text-body-xs uppercase tracking-wider text-on-surface-variant font-extrabold">
                  Nama Agenda / Event
                </th>
                <th className="w-36 px-2.5 py-2 text-body-xs uppercase tracking-wider text-on-surface-variant font-extrabold">
                  Rentang Waktu
                </th>
                <th className="w-24 px-2 py-2 text-body-xs uppercase tracking-wider text-on-surface-variant font-extrabold text-center">
                  Semester
                </th>
                <th className="w-16 px-2 py-2 text-body-xs uppercase tracking-wider text-on-surface-variant font-extrabold text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {events.map((event, idx) => {
                const isEditing = editingIdx === idx

                if (isEditing && editDraft) {
                  return (
                    <tr key={idx} className="bg-primary/5 dark:bg-primary/10">
                      <td className="px-3 py-2" colSpan={4}>
                        <div className="space-y-2 p-1">
                          <input
                            type="text"
                            value={editDraft.name}
                            onChange={(e) => handleEditField('name', e.target.value)}
                            className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-body-xs font-bold text-on-surface"
                            placeholder="Nama Agenda"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="date"
                              value={editDraft.startDate}
                              onChange={(e) => handleEditField('startDate', e.target.value)}
                              className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-2 py-1 text-label-caps font-semibold"
                            />
                            <input
                              type="date"
                              value={editDraft.endDate}
                              onChange={(e) => handleEditField('endDate', e.target.value)}
                              className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-2 py-1 text-label-caps font-semibold"
                            />
                            <select
                              value={editDraft.semester}
                              onChange={(e) => handleEditField('semester', e.target.value)}
                              className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-2 py-1 text-label-caps font-bold"
                            >
                              <option value="ganjil">Ganjil</option>
                              <option value="genap">Genap</option>
                              <option value="antar">Antar / Umum</option>
                            </select>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-2.5 py-1 text-label-caps rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="px-3 py-1 text-label-caps font-bold rounded-lg bg-teal-800 text-white hover:bg-teal-900 cursor-pointer shadow-level-1"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={idx} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="px-3 py-2 align-middle overflow-hidden">
                      <p className="font-bold text-body-xs text-on-surface truncate" title={event.name}>
                        {event.name}
                      </p>
                    </td>
                    <td className="w-36 px-2.5 py-2 align-middle font-mono text-body-xs text-on-surface-variant truncate">
                      {event.startDate} s.d {event.endDate}
                    </td>
                    <td className="w-24 px-2 py-2 align-middle text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-label-caps font-extrabold uppercase ${
                          event.semester === 'ganjil'
                            ? 'bg-blue-500/10 text-blue-800 dark:text-blue-400 border border-blue-500/20'
                            : event.semester === 'genap'
                            ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-800 dark:text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        {event.semester}
                      </span>
                    </td>
                    <td className="w-16 px-2 py-2 align-middle text-right shrink-0">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(idx)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer border border-outline-variant/15"
                          title="Edit"
                        >
                          <Icon name="edit" size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(idx)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer border border-outline-variant/15"
                          title="Hapus"
                        >
                          <Icon name="delete" size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center my-3 rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 shadow-level-1">
            <Icon name="event_note" size={24} />
          </div>
          <p className="mt-2.5 text-body-xs font-bold text-on-surface">Belum ada agenda terdeteksi</p>
          <p className="text-label-caps text-on-surface-variant max-w-xs mt-0.5">
            Unggah berkas PDF/Foto atau klik muat preset di sebelah kiri untuk meninjau data.
          </p>
        </div>
      )}

      {/* Bottom Footer Actions inside Right Panel */}
      <div className="flex items-center justify-between pt-3 border-t border-outline-variant/15 shrink-0 mt-auto">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={busySaving}
          className="rounded-full px-4 py-2 text-body-xs font-semibold cursor-pointer"
        >
          Batal
        </Button>
        <div className="flex items-center gap-2">
          {existingEvents.length > 0 && (
            <span className="text-body-xs font-medium text-on-surface-variant hidden tablet:inline">
              Gantikan {existingEvents.length} event lama
            </span>
          )}
          <Button
            type="button"
            onClick={handleImport}
            disabled={busySaving || events.length === 0}
            className="rounded-full px-5 py-2 font-bold shadow-level-1 text-body-xs bg-teal-800 hover:bg-teal-900 text-white cursor-pointer active:scale-98 transition-all"
          >
            {busySaving ? (
              <Icon name="progress_activity" size={15} className="mr-1.5 animate-spin" />
            ) : (
              <Icon name="save" size={15} className="mr-1.5" />
            )}
            {busySaving ? 'Menyimpan...' : 'Import ke Database'}
          </Button>
        </div>
      </div>
    </div>
  )
}
