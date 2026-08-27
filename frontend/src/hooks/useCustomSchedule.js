import { useEffect, useState, useCallback } from 'react'
import { getItem, setItem, STORAGE_KEYS } from '../lib/storage'

/**
 * Hook untuk mengelola mode tampilan jadwal:
 * - 'regular': Jadwal Paket Kelas sesuai Prodi & Semester
 * - 'custom': Jadwal Kustom Mahasiswa (KRS Mandiri / Lintas Semester)
 */
export function useCustomSchedule() {
  const [scheduleMode, setScheduleModeState] = useState(() =>
    getItem(STORAGE_KEYS.scheduleMode, 'regular'),
  )
  const [customScheduleIds, setCustomScheduleIdsState] = useState(() =>
    getItem(STORAGE_KEYS.customScheduleIds, []),
  )

  // Sinkronisasi antar tab/komponen
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === `jadwal-kampus:${STORAGE_KEYS.scheduleMode}`) {
        setScheduleModeState(getItem(STORAGE_KEYS.scheduleMode, 'regular'))
      }
      if (e.key === `jadwal-kampus:${STORAGE_KEYS.customScheduleIds}`) {
        setCustomScheduleIdsState(getItem(STORAGE_KEYS.customScheduleIds, []))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const setScheduleMode = useCallback((mode) => {
    const validMode = mode === 'custom' ? 'custom' : 'regular'
    setScheduleModeState(validMode)
    setItem(STORAGE_KEYS.scheduleMode, validMode)
  }, [])

  const setCustomScheduleIds = useCallback((ids) => {
    const validIds = Array.isArray(ids) ? ids : []
    setCustomScheduleIdsState(validIds)
    setItem(STORAGE_KEYS.customScheduleIds, validIds)
  }, [])

  const toggleCustomSchedule = useCallback((id) => {
    setCustomScheduleIdsState((prev) => {
      const current = Array.isArray(prev) ? prev : []
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
      setItem(STORAGE_KEYS.customScheduleIds, next)
      return next
    })
  }, [])

  const clearCustomSchedule = useCallback(() => {
    setCustomScheduleIdsState([])
    setItem(STORAGE_KEYS.customScheduleIds, [])
  }, [])

  return {
    scheduleMode,
    isCustomMode: scheduleMode === 'custom',
    setScheduleMode,
    customScheduleIds,
    setCustomScheduleIds,
    toggleCustomSchedule,
    clearCustomSchedule,
  }
}

