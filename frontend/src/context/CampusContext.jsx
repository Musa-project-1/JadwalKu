import { useEffect, useMemo, useState } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db, firebaseReady } from '../lib/firebaseClient'
import { CampusContext } from './campusContext'
import { DEFAULT_CAMPUS, normalizeCampus, getProdiNames, getClassTypeCodes, getRoomMap } from '../lib/campusConfig'
import { getItem, setItem, STORAGE_KEYS } from '../lib/storage'

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

  // Pindah kampus → simpan di localStorage + reset state ke default dulu,
  // supaya config kampus lama (prodi/ruang/tipe kelas) tidak sempat terlihat
  // saat kampus baru sedang dimuat.
  const setKampusId = (nextId) => {
    const clean = String(nextId || '').trim()
    if (!clean) return
    setKampusIdState(clean)
    setCampus(DEFAULT_CAMPUS)
    setItem(STORAGE_KEYS.kampusId, clean)
  }

  useEffect(() => {
    if (!firebaseReady || !db) {
      return undefined
    }

    const ref = doc(collection(db, 'kampus'), kampusId)
    // oxlint-disable-next-line react/set-state-in-effect
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
