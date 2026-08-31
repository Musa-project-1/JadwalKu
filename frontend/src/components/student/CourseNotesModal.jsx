import { useState, useMemo, useEffect } from 'react'
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

  // Support ESC key to close modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose?.()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

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
      aria-labelledby="course-notes-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-6 bg-black/65 backdrop-blur-xs animate-fade-in"
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] tablet:max-h-[88vh] flex flex-col rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl animate-fade-up overflow-hidden"
      >
        {/* Header - Rich Amber/Orange Gradient Hero Header */}
        <header className="sticky top-0 z-20 bg-gradient-to-r from-amber-900/95 via-amber-800 to-orange-900 p-4 tablet:p-5 text-white shadow-level-1 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-xs">
                <Icon name="edit_note" size={24} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 id="course-notes-title" className="text-xl tablet:text-2xl font-bold tracking-tight text-white truncate">
                    Semua Catatan Kuliah
                  </h3>
                  <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border border-white/25 shadow-2xs">
                    {notesList.length} Catatan Aktif
                  </span>
                </div>
                <p className="text-body-xs text-white/80 font-medium truncate">
                  Kompilasi catatan kuliah, instruksi tugas, materi penting, dan pengingat kuis
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
        </header>

        {/* Search Toolbar */}
        <div className="p-3.5 border-b border-outline-variant/15 bg-surface-container-low/50 dark:bg-surface-container-high/20 shrink-0">
          <div className="relative w-full max-w-xl mx-auto">
            <Icon
              name="search"
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari isi catatan, nama mata kuliah, dosen, atau kode MK..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-body-xs text-on-surface focus:outline-none focus:border-amber-600 dark:bg-surface-container-high shadow-2xs"
            />
          </div>
        </div>

        {/* Notes List Body - 2-Column Responsive Grid on Tablets/Desktop */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 tablet:p-5 custom-scrollbar">
          {filteredNotes.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant space-y-3 max-w-md mx-auto">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mx-auto shadow-2xs">
                <Icon name="description" size={36} />
              </div>
              <h4 className="text-body-md font-bold text-on-surface">
                {searchQuery ? 'Tidak ada catatan yang cocok' : 'Belum ada catatan kuliah'}
              </h4>
              <p className="text-body-xs text-on-surface-variant leading-relaxed">
                Buka salah satu jadwal mata kuliah pada grid mingguan dan isi catatan di panel detail untuk menyimpannya secara otomatis di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3.5">
              {filteredNotes.map((item) => (
                <div
                  key={item.kodeMK}
                  className="rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/10 via-surface-container-lowest to-transparent dark:from-amber-500/15 dark:via-surface-container-low p-4 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Course Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="font-mono text-[10px] font-extrabold text-amber-900 bg-amber-500/20 dark:text-amber-200 border border-amber-500/30 px-2 py-0.5 rounded-md">
                            {item.kodeMK}
                          </span>
                          <span className="text-[10.5px] font-bold text-on-surface-variant">
                            {item.sks} SKS
                          </span>
                        </div>
                        <h4 className="text-body-sm font-extrabold text-on-surface truncate leading-snug">
                          {item.namaMK}
                        </h4>
                        {item.dosen && (
                          <p className="text-[11px] text-on-surface-variant font-medium mt-0.5 truncate">
                            {item.dosen}
                          </p>
                        )}
                      </div>

                      {/* Action buttons (Copy / Delete) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.kodeMK, item.note)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-container text-[11px] font-bold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/20"
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
                    <div className="rounded-xl bg-surface-container-lowest dark:bg-surface-container-high/60 p-3 border border-outline-variant/25 shadow-2xs">
                      <p className="text-body-xs text-on-surface whitespace-pre-wrap leading-relaxed">
                        {item.note}
                      </p>
                    </div>
                  </div>

                  {/* Action footer */}
                  {onOpenCourseDetail && (
                    <div className="flex justify-end pt-1 border-t border-outline-variant/15">
                      <button
                        type="button"
                        onClick={() => {
                          onClose()
                          onOpenCourseDetail(item.kodeMK)
                        }}
                        className="text-[11px] font-extrabold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Buka Detail Jadwal</span>
                        <Icon name="arrow_forward" size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between p-4 border-t border-outline-variant/15 bg-surface-container-low/40 shrink-0">
          <span className="text-[11px] text-on-surface-variant font-medium">
            Catatan disimpan secara lokal pada perangkat Anda
          </span>
          <Button type="button" onClick={onClose} className="font-bold">
            Tutup
          </Button>
        </footer>
      </div>
    </div>
  )
}
