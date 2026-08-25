import { useMemo, useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { useTasks } from '../../hooks/useTasks'
import { useFirestore } from '../../hooks/useFirestore'
import { Icon } from '../../components/Icon'
import { EmptyState } from '../../components/EmptyState'
import { sampleSchedule, sampleCourses } from '../../data/sampleSchedule'
import { firebaseReady } from '../../lib/firebaseClient'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'

const FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'mk', label: 'Mata Kuliah' },
  { value: 'dosen', label: 'Dosen' },
  { value: 'tugas', label: 'Tugas' },
  { value: 'jadwal', label: 'Jadwal' },
]

export default function Search() {
  const { program, semester } = useApp()
  const { tasks } = useTasks()
  const [queryText, setQueryText] = useState('')
  const [filter, setFilter] = useState('all')
  const [recents, setRecents] = useState(() => getItem(STORAGE_KEYS.recentSearches, []))

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
  const courseNameMap = useMemo(
    () => new Map(courses.map((c) => [c.kodeMK, c.namaMK])),
    [courses],
  )

  const results = useMemo(() => {
    const q = queryText.trim().toLowerCase()
    if (!q) return null

    const courseHits = courses.filter(
      (c) =>
        c.namaMK?.toLowerCase().includes(q) || c.kodeMK?.toLowerCase().includes(q),
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

  // Simpan kata kunci ke riwayat pencarian (maks 5) saat menekan Enter.
  function handleSearchKeyDown(e) {
    if (e.key !== 'Enter') return
    const q = queryText.trim()
    if (q.length < 2) return
    // Hitung nilai berikutnya di luar updater — updater harus murni
    // (StrictMode bisa memanggilnya dua kali).
    const next = [q, ...recents.filter((r) => r !== q)].slice(0, 5)
    setItem(STORAGE_KEYS.recentSearches, next)
    setRecents(next)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-lg">
      <header>
        <h2 className="text-display text-on-surface">Search</h2>
      </header>

      <div className="relative group rounded-full border border-outline-variant/40 bg-surface-container-lowest p-1 shadow-sm transition-all focus-within:border-primary focus-within:shadow-md dark:bg-surface-container-low">
        <Icon
          name="search"
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors"
        />
        {/* Token warna otomatis berubah di mode gelap, tanpa override dark: */}
        <input
          type="search"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Cari mata kuliah, dosen, atau tugas..."
          autoFocus
          className="w-full bg-transparent py-2.5 pl-11 pr-4 text-body-lg text-on-surface focus:outline-none"
        />
      </div>

      {/* Pencarian terakhir */}
      {!results && recents.length > 0 && (
        <section>
          <h3 className="mb-sm text-label-caps uppercase text-on-surface-variant">
            Pencarian Terakhir
          </h3>
          <div className="flex flex-wrap gap-xs">
            {recents.map((r) => (
              <div
                key={r}
                className="flex items-center rounded-full border border-outline-variant bg-surface-container-lowest text-body-sm text-on-surface dark:bg-surface-container-low transition-all hover:border-primary-fixed"
              >
                <button
                  type="button"
                  onClick={() => setQueryText(r)}
                  className="flex items-center gap-1.5 py-1.5 pl-3 pr-2 text-left text-body-sm font-medium hover:text-primary"
                >
                  <Icon name="history" size={16} className="text-on-surface-variant" />
                  {r}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setRecents((prev) => {
                      const next = prev.filter((item) => item !== r)
                      setItem(STORAGE_KEYS.recentSearches, next)
                      return next
                    })
                  }}
                  className="pr-2.5 pl-1 py-1.5 text-on-surface-variant hover:text-error transition-colors"
                  aria-label={`Hapus ${r} dari pencarian terakhir`}
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filter chips */}
      <div className="flex gap-xs overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-body-sm font-medium transition-all duration-150 active:scale-95 ${
              filter === f.value
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high dark:bg-surface-container-high'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!results ? (
        <EmptyState
          icon="search"
          title="Mulai mencari"
          description="Ketik kata kunci untuk mencari mata kuliah, dosen, atau tugas."
        />
      ) : !hasResults ? (
        <EmptyState icon="search_off" title="Tidak ada hasil ditemukan" />
      ) : (
        <div className="space-y-lg">
          {(filter === 'all' || filter === 'mk') && results.courseHits.length > 0 && (
            <ResultSection title="Mata Kuliah" icon="menu_book">
              {results.courseHits.map((c) => (
                <ResultRow
                  key={c.kodeMK}
                  icon="menu_book"
                  title={c.namaMK}
                  subtitle={`${c.kodeMK} · ${c.sks} SKS`}
                  tintClass="bg-primary/10 text-primary"
                />
              ))}
            </ResultSection>
          )}

          {(filter === 'all' || filter === 'dosen') && results.lecturerHits.length > 0 && (
            <ResultSection title="Dosen" icon="person">
              {results.lecturerHits.map((c) => (
                <ResultRow
                  key={c.dosen}
                  icon="person"
                  title={c.dosen}
                  subtitle={c.kontakDosen ?? ''}
                  tintClass="bg-tertiary-container/20 text-tertiary"
                />
              ))}
            </ResultSection>
          )}

          {(filter === 'all' || filter === 'tugas') && results.taskHits.length > 0 && (
            <ResultSection title="Tugas" icon="assignment">
              {results.taskHits.map((t) => (
                <ResultRow
                  key={t.id}
                  icon="assignment"
                  title={t.judul}
                  subtitle={`Tenggat: ${t.deadline}`}
                  tintClass="bg-warning-container/30 text-warning"
                />
              ))}
            </ResultSection>
          )}

          {(filter === 'all' || filter === 'jadwal') && results.scheduleHits.length > 0 && (
            <ResultSection title="Jadwal" icon="calendar_month">
              {results.scheduleHits.map((s) => (
                <ResultRow
                  key={s.id ?? `${s.kodeMK}-${s.hari}-${s.jamMulai}`}
                  icon="calendar_month"
                  title={courseNameMap.get(s.kodeMK) ?? s.kodeMK}
                  subtitle={`${s.kodeMK} · ${s.hari}, ${s.jamMulai}-${s.jamSelesai}`}
                  tintClass="bg-info-container/30 text-info"
                />
              ))}
            </ResultSection>
          )}
        </div>
      )}
    </div>
  )
}

function ResultSection({ title, icon, children }) {
  return (
    <section>
      <h3 className="mb-sm flex items-center gap-sm text-label-caps uppercase text-on-surface-variant font-semibold">
        <Icon name={icon} size={18} />
        {title}
      </h3>
      <div className="space-y-xs">{children}</div>
    </section>
  )
}

function ResultRow({ icon, title, subtitle, tintClass = 'bg-surface-container text-primary' }) {
  return (
    <div className="flex items-center gap-md rounded-2xl bg-surface-container-lowest p-3 border border-outline-variant/10 transition-all duration-200 hover:scale-[1.002] hover:bg-surface-container-low dark:bg-surface-container-low">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tintClass}`}>
        <Icon name={icon} size={18} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-body-lg text-on-surface font-semibold">{title}</p>
        {subtitle && (
          <p className="truncate text-body-sm text-on-surface-variant font-medium mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
