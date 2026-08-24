import { createContext, useContext } from 'react'

/** Context objek aplikasi (tema, preferensi, sesi admin). */
export const AppContext = createContext(null)

/** Akses state & setter global aplikasi (tema, program, sesi admin, dll). */
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider')
  }
  return ctx
}
