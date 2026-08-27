import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../hooks/useApp'
import { useFirestore } from '../hooks/useFirestore'
import { NotificationsContext } from '../hooks/useNotifications'
import {
  buildChangeNotifications,
  buildClassReminders,
  buildExamReminders,
  buildTaskDeadlineReminders,
  mergeNotifications,
  playNotificationChime,
  sendBrowserNotification,
} from '../lib/notificationEngine'
import { getTodayName } from '../lib/scheduleUtils'
import { getItem, setItem, STORAGE_KEYS } from '../lib/storage'

const MAX_ITEMS = 100
const ENGINE_INTERVAL_MS = 60_000

/** Preferensi pengingat global (kelas/ujian/tugas), default semua aktif. */
function getReminderPrefs() {
  return {
    kelas: true,
    ujian: true,
    tugas: true,
    nativePush: false,
    classWindow: 15,
    examDays: 3,
    sound: true,
    ...getItem(STORAGE_KEYS.reminderPrefs, {}),
  }
}

/**
 * Penyedia notifikasi aplikasi:
 * - Menyimpan daftar notifikasi di localStorage (device-local, sesuai PLAN.md)
 * - Secara berkala memeriksa sumber data (jadwal hari ini, tugas, ujian,
 *   riwayat perubahan) dan menambahkan notifikasi baru tanpa duplikat.
 */
export function NotificationsProvider({ children }) {
  const { program, semester } = useApp()
  const [items, setItems] = useState(() => getItem(STORAGE_KEYS.notifications, []))

  // Ref agar mesin notifikasi bisa membaca daftar terbaru tanpa menjadikan
  // `items` dependensi callback (yang akan me-reset interval tiap tick).
  // Sinkronisasi lewat effect — menulis ref saat render dilarang React.
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const persist = useCallback((next) => {
    setItems(next)
    setItem(STORAGE_KEYS.notifications, next)
  }, [])

  // Sumber data untuk mesin notifikasi.
  const { data: jadwal } = useFirestore('jadwal', [
    ['prodi', '==', program ?? ''],
    ['semester', '==', Number(semester) || 0],
    ['status', '==', 'published'],
  ])
  const { data: mataKuliah } = useFirestore('mataKuliah')
  const { data: ujian } = useFirestore('ujian', [['status', '==', 'published']])
  const { data: riwayat } = useFirestore('riwayat')

  const dispatchedNativeRef = useRef(new Set())

  const runEngine = useCallback(() => {
    const now = new Date()
    const todayEntries = jadwal.filter((e) => e.hari === getTodayName(now))
    const courseMap = new Map(mataKuliah.map((c) => [c.kodeMK, c]))
    const tasks = getItem(STORAGE_KEYS.tasks, [])

    const prefs = getReminderPrefs()
    const incoming = [
      ...(prefs.kelas ? buildClassReminders(todayEntries, courseMap, now, prefs.classWindow) : []),
      ...(prefs.tugas ? buildTaskDeadlineReminders(tasks, now) : []),
      ...(prefs.ujian ? buildExamReminders(ujian, now, prefs.examDays) : []),
      ...buildChangeNotifications(riwayat, now),
    ]
    if (incoming.length === 0) return

    // Trigger Native Browser Notification & Sound if enabled
    if (prefs.nativePush && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const urgentReminders = incoming.filter(
        (item) =>
          (item.type === 'kelas' || item.type === 'tugas' || item.type === 'ujian') &&
          !dispatchedNativeRef.current.has(item.id),
      )

      if (urgentReminders.length > 0) {
        const topItem = urgentReminders[0]
        sendBrowserNotification(topItem.title, {
          body: topItem.description,
          tag: topItem.id,
        })
        if (prefs.sound) {
          playNotificationChime()
        }
        urgentReminders.forEach((r) => dispatchedNativeRef.current.add(r.id))
      }
    }

    // Merge di luar updater
    const merged = mergeNotifications(itemsRef.current, incoming).slice(0, MAX_ITEMS)
    const prev = itemsRef.current
    const changed =
      merged.length !== prev.length || merged.some((item, i) => item !== prev[i])
    if (!changed) return
    persist(merged)
  }, [jadwal, mataKuliah, ujian, riwayat, persist])

  useEffect(() => {
    // Effect ini sengaja menyinkronkan state dengan "sistem eksternal"
    // (waktu berjalan + data Firestore): mesin notifikasi harus dijalankan
    // saat mount dan tiap interval, lalu hasilnya masuk ke state.
    // oxlint-disable-next-line react/set-state-in-effect -- sinkronisasi berkala dengan waktu & data eksternal memang butuh setState dalam effect.
    runEngine()
    const id = setInterval(runEngine, ENGINE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [runEngine])

  const markRead = useCallback(
    (id) => persist(items.map((item) => (item.id === id ? { ...item, read: true } : item))),
    [items, persist],
  )

  const markAllRead = useCallback(
    () => persist(items.map((item) => ({ ...item, read: true }))),
    [items, persist],
  )

  const removeItem = useCallback(
    (id) => persist(items.filter((item) => item.id !== id)),
    [items, persist],
  )

  const clearAll = useCallback(() => persist([]), [persist])

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items])

  const value = useMemo(
    () => ({ items, unreadCount, markRead, markAllRead, removeItem, clearAll }),
    [items, unreadCount, markRead, markAllRead, removeItem, clearAll],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}
