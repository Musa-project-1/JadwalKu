import { Link } from 'react-router'
import { Icon } from '../../Icon'

export function ClassDetailNotesTab({
  kode,
  note,
  handleNoteChange,
  noteSaved,
  handleCopyNote,
  copiedNote,
  handleClearNote,
  appendTag,
  QUICK_NOTE_TAGS,
  relatedTasks,
}) {
  return (
    <div className="space-y-4 animate-fade-in flex-1">
      {/* Catatan Sesi Kuliah */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-body-xs font-extrabold uppercase tracking-wider text-on-surface">
            <Icon name="sticky_note_2" size={16} className="text-amber-500" />
            Catatan Kuliah (Auto-save)
          </h3>
          <div className="flex items-center gap-2">
            {noteSaved && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Icon name="check" size={13} />
                Tersimpan
              </span>
            )}
            {note && (
              <>
                <button
                  type="button"
                  onClick={handleCopyNote}
                  className="text-[11px] font-bold text-primary hover:underline transition-colors cursor-pointer flex items-center gap-0.5"
                >
                  <Icon name={copiedNote ? 'check' : 'content_copy'} size={12} />
                  <span>{copiedNote ? 'Tersalin' : 'Salin'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearNote}
                  className="text-[11px] font-bold text-error/80 hover:text-error transition-colors cursor-pointer"
                >
                  Hapus
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Tag Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-extrabold text-on-surface-variant uppercase">
            Pintasan:
          </span>
          {QUICK_NOTE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => appendTag(tag)}
              className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[11px] font-bold text-amber-900 dark:text-amber-200 border border-amber-500/30 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              {tag}
            </button>
          ))}
        </div>

        <textarea
          id="course-note-input"
          name="course-note"
          aria-label="Catatan kuliah"
          value={note}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="Tulis catatan penting perkuliahan, instruksi dosen, tugas, atau kuis..."
          className="min-h-[110px] w-full resize-none rounded-2xl border border-outline-variant/35 bg-surface-container-low/40 p-3.5 text-body-sm text-on-surface placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none dark:bg-surface-container-high/40 shadow-xs leading-relaxed"
        />
      </section>

      {/* Tugas Terkait Section */}
      <section className="pt-2 border-t border-outline-variant/20 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-body-xs font-extrabold uppercase tracking-wider text-on-surface">
            <Icon name="assignment" size={16} className="text-primary" />
            Tugas Tertaut
          </h3>
          <Link
            to="/tugas"
            state={{ createKodeMK: kode }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 px-3 py-1 text-[11px] font-bold transition-all shadow-2xs"
          >
            <Icon name="add" size={13} />
            <span>Tambah Tugas</span>
          </Link>
        </div>

        {relatedTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/40 p-4 text-center">
            <p className="text-body-xs text-on-surface-variant font-medium">
              Belum ada tugas untuk mata kuliah ini.
            </p>
          </div>
        ) : (
          <ul className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {relatedTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low/60 px-3.5 py-2.5 border border-outline-variant/25 shadow-2xs"
              >
                <span
                  className={`min-w-0 truncate text-body-xs font-bold ${
                    task.selesai
                      ? 'text-outline line-through'
                      : 'text-on-surface'
                  }`}
                >
                  {task.judul}
                </span>
                <span className="shrink-0 text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">
                  {task.deadline ?? '-'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
