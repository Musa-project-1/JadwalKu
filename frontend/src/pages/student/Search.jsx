import { useMemo, useState } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import { useTasks } from '../../hooks/useTasks'
import { useApp } from '../../hooks/useApp'
import { useFirestore } from '../../hooks/useFirestore'
import { Icon } from '../../components/Icon'
import { EmptyState } from '../../components/EmptyState'
import { sampleSchedule, sampleCourses } from '../../data/sampleSchedule'
import { firebaseReady } from '../../lib/firebaseClient'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'

import { LecturerTimetableModal } from '../../components/student/LecturerTimetableModal'
import { getLecturerInitials } from '../../lib/lecturerUtils'

export default function Search() {
  const { language, t } = useApp()
  const { tasks } = useTasks()
  const [queryText, setQueryText] = useState('')
  const debouncedQuery = useDebounce(queryText, 250)
  const [filter, setFilter] = useState('all')
  const [recents, setRecents] = useState(() => getItem(STORAGE_KEYS.recentSearches, []))
  const [selectedLecturer, setSelectedLecturer] = useState(null)

  const FILTERS = useMemo(() => [
    { value: 'all', label: t ? t('search.filter_all') : 'Semua' },
    { value: 'dosen', label: t ? t('search.filter_lecturer') : '👨‍🏫 Dosen & Jadwal' },
    { value: 'mk', label: t ? t('search.filter_course') : 'Mata Kuliah' },
    { value: 'tugas', label: language === 'en' ? 'Tasks' : 'Tugas' },
    { value: 'jadwal', label: language === 'en' ? 'Class Schedule' : 'Jadwal Kelas' },
  ], [t, language])

  const { data: allPublishedJadwal } = useFirestore('jadwal', [
    ['status', '==', 'published'],
  ])
  const { data: mataKuliah } = useFirestore('mataKuliah')

  const useSample = !firebaseReady
  const courses = useMemo(
    () => (mataKuliah.length > 0 ? mataKuliah : useSample ? sampleCourses : []),
    [mataKuliah, useSample],
  )
  const fullSchedulePool = useMemo(
    () => (allPublishedJadwal.length > 0 ? allPublishedJadwal : sampleSchedule),
    [allPublishedJadwal],
  )
  const courseNameMap = useMemo(
    () => new Map(courses.map((c) => [c.kodeMK, c.namaMK])),
    [courses],
  )

  // Full unique lecturers list with class counts across all schedules
  const allLecturers = useMemo(() => {
    const map = new Map()
    courses.forEach((c) => {
      const d = (c.dosen || '').trim()
      if (d && !map.has(d)) {
        map.set(d, {
          dosen: d,
          kontakDosen: c.kontakDosen || '',
          sampleCourse: c,
        })
      }
    })

    const list = Array.from(map.values()).map((lec) => {
      const target = lec.dosen.toLowerCase()
      const sessions = fullSchedulePool.filter((s) => {
        const c = courses.find((course) => course.kodeMK === s.kodeMK)
        const dName = (c?.dosen || s.dosen || '').trim().toLowerCase()
        return dName === target || dName.includes(target)
      })
      return {
        ...lec,
        sessionCount: sessions.length,
      }
    })

    return list.sort((a, b) => a.dosen.localeCompare(b.dosen))
  }, [courses, fullSchedulePool])

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return null

    const courseHits = courses.filter(
      (c) =>
        c.namaMK?.toLowerCase().includes(q) || c.kodeMK?.toLowerCase().includes(q),
    )
    const lecturerHits = allLecturers.filter((c) =>
      c.dosen?.toLowerCase().includes(q),
    )
    const taskHits = tasks.filter(
      (t) =>
        t.judul?.toLowerCase().includes(q) ||
        t.kodeMK?.toLowerCase().includes(q) ||
        t.catatan?.toLowerCase().includes(q),
    )
    const scheduleHits = fullSchedulePool.filter((e) => {
      const courseName = courseNameMap.get(e.kodeMK) || ''
      return (
        e.kodeMK?.toLowerCase().includes(q) ||
        courseName.toLowerCase().includes(q) ||
        e.ruang?.toLowerCase().includes(q)
      )
    })

    return { courseHits, lecturerHits, taskHits, scheduleHits }
  }, [debouncedQuery, courses, allLecturers, tasks, fullSchedulePool, courseNameMap])

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
    <div className="flex flex-col gap-4 w-full max-w-full overflow-x-hidden animate-fade-in">
      {/* 1. Header Pencarian — Structured 1:1 like WeeklySchedule */}
      <header className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-3 tablet:px-4 tablet:py-3 shadow-level-1 flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between w-full">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-level-1">
            <Icon name="search" size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl tablet:text-2xl font-bold tracking-tight text-on-surface">
                {language === 'en' ? 'Campus Search' : 'Pencarian Kampus'}
              </h1>
              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-label-caps font-bold border border-primary/20">
                {language === 'en' ? 'Global Explorer' : 'Global Explorer'}
              </span>
            </div>
            <p className="mt-0.5 text-body-xs text-on-surface-variant font-medium truncate">
              {language === 'en' ? 'Search lecturers, lecture schedules, courses, and active tasks' : 'Cari dosen, jadwal kuliah, mata kuliah terdaftar, dan tugas aktif'}
            </p>
          </div>
        </div>
      </header>

      {/* 2. Search Input Container */}
      <div className="relative group rounded-2xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low p-1.5 shadow-level-1 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <Icon
          name="search"
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors"
        />
        <input
          type="search"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder={language === 'en' ? 'Search lecturer name, course, room, or task...' : 'Cari nama dosen, mata kuliah, ruangan, atau judul tugas...'}
          autoFocus
          className="w-full bg-transparent py-2 pl-11 pr-4 text-body-sm tablet:text-body-md font-semibold text-on-surface focus:outline-none placeholder:text-on-surface-variant"
        />
      </div>

      {/* Pencarian terakhir */}
      {!results && recents.length > 0 && (
        <section>
          <h3 className="mb-sm text-label-caps uppercase text-on-surface-variant">
            {t ? t('search.recent') : 'Pencarian Terakhir'}
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
            className={`shrink-0 rounded-full px-4 py-1.5 text-body-sm font-medium transition-all duration-150 active:opacity-80 ${
              filter === f.value
                ? 'bg-primary text-on-primary shadow-level-1'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high dark:bg-surface-container-high'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!results && filter === 'dosen' ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-label-caps uppercase text-on-surface-variant font-bold">
              <Icon name="person" size={18} className="text-primary" />
              {t ? t('search.lecturer_dir', { count: allLecturers.length }) : `Direktori Dosen Pengampu (${allLecturers.length})`}
            </h3>
            <span className="text-body-xs text-on-surface-variant">
              {language === 'en' ? 'Click lecturer to view teaching schedule' : 'Klik nama dosen untuk melihat jadwal mengajar'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {allLecturers.map((lec) => (
              <LecturerCard
                key={lec.dosen}
                lecturer={lec}
                onClick={() => setSelectedLecturer(lec)}
              />
            ))}
          </div>
        </section>
      ) : !results ? (
        <EmptyState
          icon="search"
          title={language === 'en' ? 'Start Searching' : 'Mulai mencari'}
          description={language === 'en' ? 'Type keywords to search courses, lecturers, or tasks.' : 'Ketik kata kunci untuk mencari mata kuliah, dosen, atau tugas.'}
        />
      ) : !hasResults ? (
        <EmptyState
          icon="search_off"
          title={language === 'en' ? 'No results found' : 'Tidak ada hasil ditemukan'}
        />
      ) : (
        <div className="space-y-lg">
          {(filter === 'all' || filter === 'dosen') && results.lecturerHits.length > 0 && (
            <ResultSection title={t ? t('search.results_lecturer') : 'Dosen & Jadwal Mengajar'} icon="person">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {results.lecturerHits.map((lec) => (
                  <LecturerCard
                    key={lec.dosen}
                    lecturer={lec}
                    onClick={() => setSelectedLecturer(lec)}
                  />
                ))}
              </div>
            </ResultSection>
          )}

          {(filter === 'all' || filter === 'mk') && results.courseHits.length > 0 && (
            <ResultSection title={t ? t('search.results_course') : 'Mata Kuliah'} icon="menu_book">
              {results.courseHits.map((c) => (
                <ResultRow
                  key={c.kodeMK}
                  icon="menu_book"
                  title={c.namaMK}
                  subtitle={`${c.kodeMK} · ${c.sks} SKS · ${c.dosen}`}
                  tintClass="bg-primary/10 text-primary"
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
            <ResultSection title="Jadwal Kelas" icon="calendar_month">
              {results.scheduleHits.map((s) => (
                <ResultRow
                  key={s.id ?? `${s.kodeMK}-${s.hari}-${s.jamMulai}`}
                  icon="calendar_month"
                  title={courseNameMap.get(s.kodeMK) ?? s.kodeMK}
                  subtitle={`${s.kodeMK} · ${s.hari}, ${s.jamMulai}-${s.jamSelesai} · ${s.prodi} Sem. ${s.semester} · Ruang ${s.ruang}`}
                  tintClass="bg-info-container/30 text-info"
                />
              ))}
            </ResultSection>
          )}
        </div>
      )}

      <LecturerTimetableModal
        isOpen={Boolean(selectedLecturer)}
        onClose={() => setSelectedLecturer(null)}
        lecturerName={selectedLecturer?.dosen}
        lecturerContact={selectedLecturer?.kontakDosen}
        allSchedules={fullSchedulePool}
        courses={courses}
      />
    </div>
  )
}

function LecturerCard({ lecturer, onClick }) {
  const initials = getLecturerInitials(lecturer.dosen)

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest hover:border-primary/50 hover:bg-surface-container-low transition-all cursor-pointer dark:bg-surface-container-low group shadow-level-1"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-body-sm group-hover:bg-primary group-hover:text-on-primary transition-colors">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-body-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
            {lecturer.dosen}
          </p>
          <div className="flex items-center gap-2 mt-0.5 text-label-caps text-on-surface-variant font-medium">
            <span>{lecturer.sessionCount} Sesi Mengajar</span>
            {lecturer.kontakDosen && (
              <>
                <span>·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">WA Tersedia</span>
              </>
            )}
          </div>
        </div>
      </div>

      <Icon
        name="chevron_right"
        size={18}
        className="text-on-surface-variant group-hover:text-primary transition-colors shrink-0"
      />
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
    <div className="flex items-center gap-md rounded-2xl bg-surface-container-lowest p-3 border border-outline-variant/10 transition-all duration-200 hover:shadow-level-2 hover:bg-surface-container-low dark:bg-surface-container-low">
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
