import { useContext } from 'react'
import { CampusContext } from './campusContext'

/** Akses konfigurasi kampus aktif. */
export function useCampus() {
  const ctx = useContext(CampusContext)
  if (!ctx) {
    throw new Error('useCampus must be used within CampusProvider')
  }
  return ctx
}
