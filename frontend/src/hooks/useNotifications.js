import { createContext, useContext } from 'react'

/** Context objek notifikasi (daftar item, jumlah belum dibaca, aksi). */
export const NotificationsContext = createContext(null)

/** Akses daftar notifikasi & aksinya (tandai baca, hapus, bersihkan). */
export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return ctx
}
