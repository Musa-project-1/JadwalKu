import { useState, useMemo, useEffect } from 'react'
import { Icon } from '../Icon'
import { useApp } from '../../hooks/useApp'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'

export function CourseNotesModal({
  isOpen: rawIsOpen,
  open: rawOpen,
  onClose,
  courses = [],
  onOpenCourseDetail,
}) {
  const isOpen = rawIsOpen ?? rawOpen ?? false
  const { language, t } = useApp()
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
        <header className="sticky top-0 z-20 bg-gradient-to-r from-amber-900 via-amber-800 to-orange-900 p-3 tablet:p-5 text-white shadow-level-1 shrink-0">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white border border-white/20 shadow-xs">
                <Icon name="edit_note" size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 id="course-notes-title" className="text-title-sm tablet:text-title-md font-black tracking-tight text-white truncate">
                    {language === 'en' ? 'Course Notes' : 'Catatan Kuliah'}
                  </h3>
                  <span className="rounded-full bg-white/20 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border border-white/25 shadow-2xs shrink-0">
                    {language === 'en' ? `${notesList.length} Active` : `${notesList.length} Aktif`}
                  </span>
                </div>
                <p className="text-[11px] tablet:text-body-xs text-white/80 font-medium truncate mt-0.5">
                  {language === 'en' ? 'Notes saved for your courses' : 'Kumpulan catatan dan instruksi tugas perkuliahan'}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label={t ? t('action.close') : 'Tutup modal'}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </header>

        {/* Search Toolbar */}
        <div className="p-2.5 tablet:p-3 border-b border-outline-variant/15 bg-surface-container-low/50 dark:bg-surface-container-high/20 shrink-0">
          <div className="relative w-full max-w-xl mx-auto">
            <Icon
              name="search"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t ? t('notes_modal.search_ph') : 'Cari catatan, matkul, atau dosen...'}
              className="w-full pl-9 pr-3.5 py-1.5 tablet:py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-body-xs text-on-surface focus:outline-none focus:border-amber-600 dark:bg-surface-container-high shadow-2xs"
            />
          </div>
        </div>

        {/* Notes List Body - Responsive Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 tablet:p-4 custom-scrollbar">
          {filteredNotes.length === 0 ? (
            <div className="py-8 tablet:py-12 text-center text-on-surface-variant space-y-2 max-w-xs mx-auto">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mx-auto shadow-2xs">
                <Icon name="description" size={22} />
              </div>
              <h4 className="text-body-sm font-extrabold text-on-surface">
                {searchQuery ? (t ? t('notes_modal.empty_search') : 'Tidak ada catatan yang cocok') : (t ? t('notes_modal.empty_title') : 'Belum ada catatan kuliah')}
              </h4>
              <p className="text-[11.5px] text-on-surface-variant leading-relaxed">
                {searchQuery
                  ? (language === 'en' ? 'Try other keywords.' : 'Coba gunakan kata kunci lain.')
                  : (t ? t('notes_modal.empty_desc') : 'Buka jadwal kuliah mingguan dan tambah catatan di panel detail untuk melihatnya di sini.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 tablet:grid-cols-2 gap-2.5 tablet:gap-3">
              {filteredNotes.map((item) => (
                <div
                  key={item.kodeMK}
                  className="rounded-xl tablet:rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/10 via-surface-container-lowest to-transparent dark:from-amber-500/15 dark:via-surface-container-low p-2.5 tablet:p-3.5 shadow-2xs space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Course Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="font-mono text-[10px] font-black text-amber-900 bg-amber-500/20 dark:text-amber-200 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                            {item.kodeMK}
                          </span>
                          <span className="text-[10.5px] font-bold text-on-surface-variant">
                            {item.sks} SKS
                          </span>
                        </div>
                        <h4 className="text-body-xs tablet:text-body-sm font-extrabold text-on-surface truncate leading-tight">
                          {item.namaMK}
                        </h4>
                        {item.dosen && (
                          <p className="text-[10.5px] text-on-surface-variant font-medium mt-0.5 truncate">
                            {item.dosen}
                          </p>
                        )}
                      </div>

                      {/* Action buttons (Copy / Delete) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.kodeMK, item.note)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container text-[10.5px] font-bold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/20 shadow-xs"
                          title="Salin Catatan"
                        >
                          <Icon
                            name={copiedId === item.kodeMK ? 'check' : 'content_copy'}
                            size={12}
                            className={copiedId === item.kodeMK ? 'text-emerald-500' : ''}
                          />
                          <span>{copiedId === item.kodeMK ? 'Tersalin' : 'Salin'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.kodeMK)}
                          className="p-1 rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
                          title="Hapus Catatan"
                        >
                          <Icon name="delete" size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Note Content Box */}
                    <div className="rounded-lg bg-surface-container-lowest dark:bg-surface-container-high/60 p-2.5 border border-outline-variant/25 shadow-2xs">
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
                        className="text-[10.5px] font-extrabold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Buka Detail Jadwal</span>
                        <Icon name="arrow_forward" size={11} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between p-2.5 tablet:p-3 border-t border-outline-variant/15 bg-surface-container-low/40 shrink-0">
          <span className="text-[10.5px] text-on-surface-variant font-medium truncate">
            Catatan disimpan secara lokal (offline-first)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-body-xs border border-outline-variant/25 transition-all shadow-xs cursor-pointer shrink-0 ml-2"
          >
            {t ? t('modal.close') : 'Tutup'}
          </button>
        </footer>
      </div>
    </div>
  )
}
