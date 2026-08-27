import { useState, useMemo } from 'react'
import { Icon } from '../Icon'
import { Button } from '../Button'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'

export function CourseNotesModal({
  isOpen,
  onClose,
  courses = [],
  onOpenCourseDetail,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [notesVersion, setNotesVersion] = useState(0)

  // Ambil semua mata kuliah yang memiliki catatan
  const notesList = useMemo(() => {
    // eslint-disable-next-line no-unused-expressions
    notesVersion // trigger recompute when note is edited/deleted
    const result = []

    courses.forEach((c) => {
      if (!c.kodeMK) return
      const raw = getItem(`${STORAGE_KEYS.courseNotes}:${c.kodeMK}`, '')
      if (raw && typeof raw === 'string' && raw.trim()) {
        result.push({
          kodeMK: c.kodeMK,
          namaMK: c.namaMK || c.kodeMK,
          dosen: c.dosen || '',
          sks: c.sks || 2,
          semester: c.semester || 1,
          note: raw.trim(),
        })
      }
    })

    return result
  }, [courses, notesVersion])

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notesList
    const q = searchQuery.toLowerCase().trim()
    return notesList.filter(
      (n) =>
        n.namaMK.toLowerCase().includes(q) ||
        n.kodeMK.toLowerCase().includes(q) ||
        n.note.toLowerCase().includes(q),
    )
  }, [notesList, searchQuery])

  function handleCopy(kodeMK, text) {
    navigator.clipboard.writeText(text)
    setCopiedId(kodeMK)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleDelete(kodeMK) {
    setItem(`${STORAGE_KEYS.courseNotes}:${kodeMK}`, '')
    setNotesVersion((v) => v + 1)
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 max-[599px]:items-end max-[599px]:p-0"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-5 border-b border-outline-variant/15 shrink-0 bg-surface-container/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
              <Icon name="edit_note" size={22} />
            </div>
            <div>
              <h3 className="text-title-md font-bold text-on-surface">
                Semua Catatan Kuliah
              </h3>
              <p className="text-body-xs text-on-surface-variant">
                {notesList.length} mata kuliah memiliki catatan aktif semester ini
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        {/* Search Toolbar */}
        <div className="p-3.5 border-b border-outline-variant/15 bg-surface-container-low/50 shrink-0">
          <div className="relative w-full">
            <Icon
              name="search"
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari catatan atau mata kuliah..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-body-sm text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant space-y-2">
              <Icon name="description" size={36} className="mx-auto text-outline-variant" />
              <p className="text-body-sm font-semibold">
                {searchQuery ? 'Tidak ada catatan yang cocok' : 'Belum ada catatan kuliah'}
              </p>
              <p className="text-body-xs text-on-surface-variant/80 max-w-sm mx-auto">
                Buka salah satu jadwal mata kuliah dan isi catatan di panel detail untuk menyimpannya di sini.
              </p>
            </div>
          ) : (
            filteredNotes.map((item) => (
              <div
                key={item.kodeMK}
                className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-xs space-y-2.5 dark:bg-amber-500/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-label-caps font-bold text-amber-900 bg-amber-500/20 dark:text-amber-200 px-2 py-0.5 rounded-md">
                        {item.kodeMK}
                      </span>
                      <span className="text-body-sm font-extrabold text-on-surface truncate">
                        {item.namaMK}
                      </span>
                    </div>
                    {item.dosen && (
                      <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                        {item.dosen}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.kodeMK, item.note)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-container text-body-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                      title="Salin Catatan"
                    >
                      <Icon
                        name={copiedId === item.kodeMK ? 'check' : 'content_copy'}
                        size={13}
                        className={copiedId === item.kodeMK ? 'text-emerald-500' : ''}
                      />
                      <span>{copiedId === item.kodeMK ? 'Tersalin' : 'Salin'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.kodeMK)}
                      className="p-1.5 rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
                      title="Hapus Catatan"
                    >
                      <Icon name="delete" size={15} />
                    </button>
                  </div>
                </div>

                {/* Note Content Box */}
                <div className="rounded-xl bg-surface-container-lowest p-3 border border-outline-variant/20 dark:bg-surface-container-high/60">
                  <p className="text-body-xs text-on-surface whitespace-pre-wrap leading-relaxed">
                    {item.note}
                  </p>
                </div>

                {/* Action footer */}
                {onOpenCourseDetail && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        onOpenCourseDetail(item.kodeMK)
                      }}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Buka Detail Jadwal</span>
                      <Icon name="arrow_forward" size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end p-4 border-t border-outline-variant/15 bg-surface-container/20 shrink-0">
          <Button type="button" onClick={onClose} className="font-bold">
            Tutup
          </Button>
        </footer>
      </div>
    </div>
  )
}

