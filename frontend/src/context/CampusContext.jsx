import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db, firebaseReady } from '../lib/firebaseClient'
import { DEFAULT_CAMPUS, normalizeCampus, getProdiNames, getClassTypeCodes, getRoomMap } from '../lib/campusConfig'
import { getItem, setItem, STORAGE_KEYS } from '../lib/storage'

const CampusContext = createContext(null)

/**
 * Penyedia konfigurasi kampus universal.
 *
 * Membaca dokumen `kampus/{kampusId}` dari Firestore (jika tersedia),
 * atau memakai DEFAULT_CAMPUS sebagai fallback (mode dev / belum dikonfigurasi).
 *
 * kampusId aktif disimpan di localStorage (STORAGE_KEYS.kampusId).
 */
export function CampusProvider({ children, kampusId: initialKampusId = null }) {
  const [kampusId, setKampusIdState] = useState(
    () => initialKampusId || getItem(STORAGE_KEYS.kampusId, DEFAULT_CAMPUS.id),
  )
  const [campus, setCampus] = useState(DEFAULT_CAMPUS)
  const [loading, setLoading] = useState(Boolean(firebaseReady))

  // Pindah kampus → simpan di localStorage + reset state ke default dulu.
  const setKampusId = (nextId) => {
    const clean = String(nextId || '').trim()
    if (!clean) return
    setKampusIdState(clean)
    setItem(STORAGE_KEYS.kampusId, clean)
  }

  useEffect(() => {
    if (!firebaseReady || !db) {
      setCampus(DEFAULT_CAMPUS)
      setLoading(false)
      return undefined
    }

    const ref = doc(collection(db, 'kampus'), kampusId)
    setLoading(true)

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        const raw = snap.exists() ? { id: snap.id, ...snap.data() } : DEFAULT_CAMPUS
        setCampus(normalizeCampus(raw))
        setLoading(false)
      },
      (err) => {
        // Gagal membaca (mis. kampus belum dibuat) → tetap pakai default.
        console.warn('[CampusContext] Gagal membaca konfigurasi kampus:', err?.message || err)
        setCampus(DEFAULT_CAMPUS)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [kampusId])

  const value = useMemo(
    () => ({
      campus,
      campusId: kampusId,
      setKampusId,
      loading,
      prodiNames: getProdiNames(campus),
      classTypeCodes: getClassTypeCodes(campus),
      roomMap: getRoomMap(campus),
    }),
    [campus, kampusId, loading],
  )

  return <CampusContext.Provider value={value}>{children}</CampusContext.Provider>
}

/** Akses konfigurasi kampus aktif. */
export function useCampus() {
  const ctx = useContext(CampusContext)
  if (!ctx) {
    throw new Error('useCampus must be used within CampusProvider')
  }
  return ctx
}

/** Helper: ambil config kampus sekali (untuk parser/export non-React). */
export async function fetchCampusConfig(kampusId = DEFAULT_CAMPUS.id) {
  if (!firebaseReady || !db) return DEFAULT_CAMPUS
  try {
    const snap = await getDoc(doc(collection(db, 'kampus'), kampusId))
    return snap.exists() ? normalizeCampus({ id: snap.id, ...snap.data() }) : DEFAULT_CAMPUS
  } catch {
    return DEFAULT_CAMPUS
  }
}
