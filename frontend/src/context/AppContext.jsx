import { useEffect, useMemo, useRef, useState } from 'react'
import { firebaseReady } from '../lib/firebaseClient'
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
  const transition = document.startViewTransition(() => {
    applyDocumentPreferences(prefs)
  })
  // Hapus penanda setelah seluruh animasi selesai (bukan saat `ready`),
  // supaya selektor `html.theme-transition` tetap aktif selama transisi.
  const clearMarker = () => root.classList.remove('theme-transition')
  transition.finished.then(clearMarker).catch(clearMarker)
}

export function AppProvider({ children }) {
  const [theme, setThemeState] = useState(() => getItem(STORAGE_KEYS.theme, 'system'))
  const [fontSize, setFontSizeState] = useState(() => getItem(STORAGE_KEYS.fontSize, 'md'))
  const [highContrast, setHighContrastState] = useState(() =>
    getItem(STORAGE_KEYS.highContrast, false),
  )
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
    [theme, fontSize, highContrast, program, semester, adminSession],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
