import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import { useApp } from '../hooks/useApp'
import { useTasks } from '../hooks/useTasks'
import { useFirestore } from '../hooks/useFirestore'
import { sampleSchedule, sampleCourses } from '../data/sampleSchedule'
import { firebaseReady } from '../lib/firebaseClient'

const FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'mk', label: 'Mata Kuliah' },
  { value: 'dosen', label: 'Dosen' },
  { value: 'tugas', label: 'Tugas' },
  { value: 'jadwal', label: 'Jadwal' },
]

export function SearchModal({ open, onClose }) {
  const navigate = useNavigate()
  const { program, semester, t } = useApp()
  const { tasks } = useTasks()
  const [queryText, setQueryText] = useState('')
  const [filter, setFilter] = useState('all')
  const inputRef = useRef(null)

  const { data: jadwal } = useFirestore(
    'jadwal',
    firebaseReady
      ? [
          ['prodi', '==', program ?? ''],
          ['semester', '==', Number(semester) || 0],
          ['status', '==', 'published'],
        ]
      : [],
  )
  const { data: mataKuliah } = useFirestore('mataKuliah')

  const useSample = !firebaseReady
  const courses = useMemo(
    () => (mataKuliah.length > 0 ? mataKuliah : useSample ? sampleCourses : []),
    [mataKuliah, useSample],
  )
  const schedule = useMemo(
    () => (jadwal.length > 0 ? jadwal : useSample ? sampleSchedule : []),
    [jadwal, useSample],
  )

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const results = useMemo(() => {
    const q = queryText.trim().toLowerCase()
    if (!q) return null

    const courseHits = courses.filter(
      (c) => c.namaMK?.toLowerCase().includes(q) || c.kodeMK?.toLowerCase().includes(q),
    )
    const lecturerHits = [...new Map(courses.map((c) => [c.dosen, c])).values()].filter((c) =>
      c.dosen?.toLowerCase().includes(q),
    )
    const taskHits = tasks.filter(
      (t) =>
        t.judul?.toLowerCase().includes(q) ||
        t.kodeMK?.toLowerCase().includes(q) ||
        t.catatan?.toLowerCase().includes(q),
    )
    const scheduleHits = schedule.filter((e) => e.kodeMK?.toLowerCase().includes(q))

    return { courseHits, lecturerHits, taskHits, scheduleHits }
  }, [queryText, courses, tasks, schedule])

  const hasResults =
    results &&
    (results.courseHits.length > 0 ||
      results.lecturerHits.length > 0 ||
      results.taskHits.length > 0 ||
      results.scheduleHits.length > 0)

  if (!open) return null

  function handleSelect(to) {
    onClose()
    navigate(to)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-4 tablet:p-4 tablet:pt-20">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity"
        onClick={onClose}
        role="presentation"
      />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl backdrop-blur-2xl animate-fade-up">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-outline-variant/25 px-4 py-3.5 bg-surface-container/40">
          <Icon name="search" size={22} className="text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={t ? t('search_modal.placeholder') : 'Cari jadwal, dosen, tugas...'}
            className="flex-1 min-w-0 bg-transparent text-body-md tablet:text-body-lg text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
          />
          {queryText && (
            <button
              type="button"
              onClick={() => setQueryText('')}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors cursor-pointer"
              title="Hapus pencarian"
            >
              <Icon name="backspace" size={18} />
            </button>
          )}
          <span className="hidden tablet:inline-block rounded-md border border-outline-variant/40 bg-surface-container px-2 py-0.5 text-[11px] font-mono font-semibold text-on-surface-variant">
            ESC
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex tablet:hidden h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            title="Tutup pencarian"
            aria-label="Tutup modal pencarian"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex w-full max-w-full gap-2 overflow-x-auto border-b border-outline-variant/20 px-4 py-2.5 bg-surface-container/20 no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-body-xs font-semibold transition-all cursor-pointer ${
                filter === f.value
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results / Suggestions list */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-md">
          {!queryText ? (
            <div className="py-8 text-center text-on-surface-variant">
              <Icon name="manage_search" size={48} className="mx-auto mb-2 opacity-40 text-primary" />
              <p className="text-body-md font-semibold text-on-surface">Ketik untuk mulai mencari</p>
              <p className="text-body-sm text-on-surface-variant/70 mt-0.5">
                Cari jadwal kuliah, nama dosen pengampu, atau tugas yang sedang aktif.
              </p>
            </div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-on-surface-variant">
              <Icon name="search_off" size={40} className="mx-auto mb-2 opacity-40" />
              <p className="text-body-md font-semibold text-on-surface">Tidak ada hasil untuk "{queryText}"</p>
              <p className="text-body-sm text-on-surface-variant/70 mt-0.5">
                Coba gunakan kata kunci lain atau pilih filter yang sesuai.
              </p>
            </div>
          ) : (
            <>
              {/* Mata Kuliah Hits */}
              {(filter === 'all' || filter === 'mk') && results.courseHits.length > 0 && (
                <section>
                  <h4 className="mb-2 text-label-caps uppercase text-on-surface-variant font-bold">Mata Kuliah</h4>
                  <div className="space-y-1">
                    {results.courseHits.map((c) => (
                      <button
                        key={c.kodeMK}
                        type="button"
                        onClick={() => handleSelect(`/jadwal`)}
                        className="flex w-full items-center justify-between p-2.5 rounded-2xl bg-surface-container/50 hover:bg-primary/10 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon name="menu_book" size={20} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-body-sm font-bold text-on-surface group-hover:text-primary truncate">{c.namaMK}</p>
                            <p className="text-[12px] text-on-surface-variant truncate">{c.kodeMK} • {c.dosen}</p>
                          </div>
                        </div>
                        <Icon name="chevron_right" size={18} className="text-on-surface-variant group-hover:text-primary shrink-0" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Dosen Hits */}
              {(filter === 'all' || filter === 'dosen') && results.lecturerHits.length > 0 && (
                <section>
                  <h4 className="mb-2 text-label-caps uppercase text-on-surface-variant font-bold">Dosen</h4>
                  <div className="space-y-1">
                    {results.lecturerHits.map((c) => (
                      <button
                        key={c.dosen}
                        type="button"
                        onClick={() => handleSelect(`/jadwal`)}
                        className="flex w-full items-center justify-between p-2.5 rounded-2xl bg-surface-container/50 hover:bg-secondary/10 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                            <Icon name="person" size={20} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-body-sm font-bold text-on-surface group-hover:text-secondary truncate">{c.dosen}</p>
                            <p className="text-[12px] text-on-surface-variant truncate">Dosen {c.namaMK}</p>
                          </div>
                        </div>
                        <Icon name="chevron_right" size={18} className="text-on-surface-variant group-hover:text-secondary shrink-0" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Tugas Hits */}
              {(filter === 'all' || filter === 'tugas') && results.taskHits.length > 0 && (
                <section>
                  <h4 className="mb-2 text-label-caps uppercase text-on-surface-variant font-bold">Tugas</h4>
                  <div className="space-y-1">
                    {results.taskHits.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelect(`/tugas`)}
                        className="flex w-full items-center justify-between p-2.5 rounded-2xl bg-surface-container/50 hover:bg-tertiary/10 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary">
                            <Icon name="checklist" size={20} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-body-sm font-bold text-on-surface group-hover:text-tertiary truncate">{t.judul}</p>
                            <p className="text-[12px] text-on-surface-variant truncate">Tenggat: {t.deadline} • {t.prioritas}</p>
                          </div>
                        </div>
                        <Icon name="chevron_right" size={18} className="text-on-surface-variant group-hover:text-tertiary shrink-0" />
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
