import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db, firebaseReady } from '../lib/firebaseClient'
import { getItem, setItem, STORAGE_KEYS } from '../lib/storage'
import { AppContext } from '../hooks/useApp'

function applyDocumentPreferences({ theme, fontSize, highContrast }) {
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
  root.classList.toggle('dark', isDark)
  root.classList.remove('font-sm', 'font-md', 'font-lg', 'font-xl')
  root.classList.add(`font-${fontSize}`)
  root.classList.toggle('high-contrast', Boolean(highContrast))
}

function updatePreferencesWithTransition(prefs) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || prefersReducedMotion) {
    applyDocumentPreferences(prefs)
    return
  }

  // Tandai `html.theme-transition` agar CSS menerapkan "Whole-Page Theme
  // Dissolve" (lihat index.css), bukan slide rute default. Penanda dilepas
  // segera setelah transisi selesai supaya tidak mengganggu navigasi.
  const root = document.documentElement
  root.classList.add('theme-transition')
  try {
    const transition = document.startViewTransition(() => {
      applyDocumentPreferences(prefs)
    })
    // Hapus penanda setelah seluruh animasi selesai (bukan saat `ready`),
    // supaya selektor `html.theme-transition` tetap aktif selama transisi.
    const clearMarker = () => root.classList.remove('theme-transition')
    if (transition?.finished) {
      transition.finished.then(clearMarker).catch(clearMarker)
    } else {
      clearMarker()
    }
  } catch (err) {
    root.classList.remove('theme-transition')
    applyDocumentPreferences(prefs)
  }
}

export function AppProvider({ children }) {
  const [theme, setThemeState] = useState(() => getItem(STORAGE_KEYS.theme, 'system'))
  const [fontSize, setFontSizeState] = useState(() => getItem(STORAGE_KEYS.fontSize, 'md'))
  const [highContrast, setHighContrastState] = useState(() =>
    getItem(STORAGE_KEYS.highContrast, false),
  )
  const [kampusId, setKampusIdState] = useState(() => getItem(STORAGE_KEYS.kampusId, null))
  const [fakultasId, setFakultasIdState] = useState(() => getItem(STORAGE_KEYS.fakultasId, null))
  const [fakultasNama, setFakultasNamaState] = useState(() => getItem(STORAGE_KEYS.fakultasNama, null))
  const [program, setProgramState] = useState(() => getItem(STORAGE_KEYS.program, null))
  const [semester, setSemesterState] = useState(() => getItem(STORAGE_KEYS.semester, null))
  const [adminSession, setAdminSessionState] = useState(() =>
    getItem(STORAGE_KEYS.adminSession, null),
  )

  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      applyDocumentPreferences({ theme, fontSize, highContrast })
    } else {
      updatePreferencesWithTransition({ theme, fontSize, highContrast })
    }
  }, [theme, fontSize, highContrast])

  useEffect(() => {
    if (theme !== 'system') return undefined
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => updatePreferencesWithTransition({ theme, fontSize, highContrast })
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme, fontSize, highContrast])

  // C5: Stale semester guard — if saved program/semester out of range for that prodi (e.g. switch BD Sem8 -> IF max 6), clear it
  useEffect(() => {
    if (!program || !semester) return
    let cancelled = false
    ;(async () => {
      try {
        if (!db) return
        const snap = await getDocs(collection(db, 'prodi'))
        if (cancelled) return
        const row = snap.docs.map((d) => ({ id: d.id, ...d.data() })).find((r) => String(r.nama) === String(program))
        if (!row) return
        const min = Number(row.semesterMin ?? 1)
        const max = Number(row.semesterMax ?? 8)
        const sem = Number(semester)
        if (!Number.isInteger(sem) || sem < min || sem > max) {
          setSemesterState(null)
          try {
            // use PREFIX-aware helper (storage.js) so semester key is cleared correctly
            const { removeItem, STORAGE_KEYS: SK } = await import('../lib/storage')
            removeItem(SK.semester)
          } catch {}
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [program, semester])

  const value = useMemo(
    () => ({
      theme,
      setTheme: (next) => {
        setThemeState(next)
        setItem(STORAGE_KEYS.theme, next)
      },
      fontSize,
      setFontSize: (next) => {
        setFontSizeState(next)
        setItem(STORAGE_KEYS.fontSize, next)
      },
      highContrast,
      setHighContrast: (next) => {
        setHighContrastState(next)
        setItem(STORAGE_KEYS.highContrast, next)
      },
      kampusId,
      setKampusId: (next) => {
        setKampusIdState(next)
        setItem(STORAGE_KEYS.kampusId, next)
      },
      fakultasId,
      fakultasNama,
      setFakultas: (id, nama) => {
        setFakultasIdState(id)
        setFakultasNamaState(nama)
        setItem(STORAGE_KEYS.fakultasId, id)
        setItem(STORAGE_KEYS.fakultasNama, nama)
      },
      program,
      setProgram: (next) => {
        setProgramState(next)
        setItem(STORAGE_KEYS.program, next)
      },
      semester,
      setSemester: (next) => {
        setSemesterState(next)
        setItem(STORAGE_KEYS.semester, next)
      },
      adminSession,
      setAdminSession: (next) => {
        setAdminSessionState(next)
        setItem(STORAGE_KEYS.adminSession, next)
      },
      firebaseReady,
    }),
    [theme, fontSize, highContrast, kampusId, fakultasId, fakultasNama, program, semester, adminSession],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
