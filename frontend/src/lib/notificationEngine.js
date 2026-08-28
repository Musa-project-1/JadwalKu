import { minutesUntil } from './scheduleUtils'

/**
 * Mesin notifikasi — fungsi murni yang mengubah data (jadwal, tugas, ujian,
 * riwayat) menjadi daftar item notifikasi. Dipanggil oleh
 * NotificationsContext secara berkala.
 */

const DEFAULT_CLASS_WINDOW = 15
const DEFAULT_EXAM_DAYS = 3
const CHANGE_HISTORY_DAYS = 7

function dateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatClock(date) {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date)
}

/**
 * Memainkan nada chime pengingat lembut menggunakan Web Audio API synth
 * (ringan, tanpa perlu aset file audio eksternal).
 */
export function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const now = ctx.currentTime

    // Tone 1: D5 (587.33Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.05)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.35)

    // Tone 2: A5 (880Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now + 0.12)
    gain2.gain.setValueAtTime(0, now + 0.12)
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.17)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.6)
  } catch (err) {
    console.debug('Audio chime skipped:', err)
  }
}

/**
 * Mengirimkan Browser Native Notification ke sistem operasi.
 */
export async function sendBrowserNotification(title, options = {}) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }

  if (Notification.permission !== 'granted') {
    return false
  }

  // Base URL tidak boleh diakhiri '/'; VITE base '/JadwalKu/' harus dipakai
  // agar path ikon benar di GitHub Pages. Gunakan pwa-192.png yang benar-benar
  // ada di public/ (folder /icons/ tidak pernah ada → 404 untuk notifikasi).
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const iconPath = `${base}/pwa-192.png`
  const defaultOptions = {
    icon: iconPath,
    badge: iconPath,
    tag: options.tag || 'jadwalku-reminder',
    renotify: true,
    ...options,
  }

  try {
    // Check if Service Worker is active and can show notification
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      if (reg && reg.showNotification) {
        await reg.showNotification(title, defaultOptions)
        return true
      }
    }
  } catch (err) {
    console.debug('Service worker notification failed, falling back to Notification constructor', err)
  }

  try {
    new Notification(title, defaultOptions)
    return true
  } catch (err) {
    console.debug('Native notification constructor failed:', err)
    return false
  }
}

/** Pengingat kelas: kelas hari ini yang mulai dalam batas waktu jendela (default 15 mnt). */
export function buildClassReminders(
  todayEntries,
  courseMap = new Map(),
  now = new Date(),
  classWindowMinutes = DEFAULT_CLASS_WINDOW,
) {
  const windowLimit = Number(classWindowMinutes) || DEFAULT_CLASS_WINDOW

  return todayEntries
    .filter((entry) => {
      const mins = minutesUntil(entry.jamMulai, now)
      return mins > 0 && mins <= windowLimit
    })
    .map((entry) => {
      const course = courseMap.get(entry.kodeMK)
      const mins = minutesUntil(entry.jamMulai, now)
      return {
        id: `kelas-${entry.id}-${dateKey(now)}`,
        type: 'kelas',
        icon: 'schedule',
        accent: 'primary',
        title: course?.namaMK ?? entry.kodeMK ?? 'Kelas Perkuliahan',
        description: `Kelas akan dimulai dalam ${mins} menit (${entry.jamMulai} WIB) di ${entry.ruang ?? '-'}.`,
        timeLabel: formatClock(now),
        createdAt: now.getTime(),
        read: false,
      }
    })
}

/** Pengingat tugas: deadline hari ini atau besok, belum selesai. */
export function buildTaskDeadlineReminders(tasks = [], now = new Date()) {
  const today = dateKey(now)
  const tomorrow = dateKey(new Date(now.getTime() + 24 * 60 * 60 * 1000))
  return tasks
    .filter((task) => !task.selesai && (task.deadline === today || task.deadline === tomorrow))
    .map((task) => ({
      id: `tugas-${task.id}-${task.deadline}`,
      type: 'tugas',
      icon: 'task_alt',
      accent: 'tertiary',
      title: task.judul,
      description:
        task.deadline === today
          ? 'Batas waktu pengumpulan tugas adalah HARI INI.'
          : 'Batas waktu pengumpulan tugas adalah BESOK.',
      timeLabel: formatClock(now),
      createdAt: now.getTime(),
      read: false,
    }))
}

/** Pengingat ujian: ujian dalam X hari ke depan (default 3 hari). */
export function buildExamReminders(exams = [], now = new Date(), examDays = DEFAULT_EXAM_DAYS) {
  const daysLimit = Number(examDays) || DEFAULT_EXAM_DAYS
  const limit = new Date(now.getTime() + daysLimit * 24 * 60 * 60 * 1000)
  const todayStr = dateKey(now)
  const limitStr = dateKey(limit)

  return exams
    .filter((exam) => exam.tanggal >= todayStr && exam.tanggal <= limitStr)
    .map((exam) => ({
      id: `ujian-${exam.id}`,
      type: 'ujian',
      icon: 'edit',
      accent: 'error',
      title: `${exam.jenis ?? 'Ujian'} - ${exam.kodeMK ?? ''}`.trim(),
      description: `Ujian dijadwalkan pada ${exam.tanggal} pukul ${exam.jam ?? '-'} di ${exam.ruang ?? '-'}.`,
      timeLabel: formatClock(now),
      createdAt: now.getTime(),
      read: false,
    }))
}

function extractMillis(timestamp) {
  if (!timestamp) return null
  if (typeof timestamp.toMillis === 'function') return timestamp.toMillis()
  const n = Number(timestamp)
  return Number.isNaN(n) ? null : n
}

/** Perubahan jadwal dari koleksi riwayat (7 hari terakhir). */
export function buildChangeNotifications(historyEntries = [], now = new Date()) {
  const cutoff = now.getTime() - CHANGE_HISTORY_DAYS * 24 * 60 * 60 * 1000
  return historyEntries
    .filter((entry) => {
      const ts = extractMillis(entry.timestamp)
      return ts !== null && ts >= cutoff
    })
    .map((entry) => {
      const ts = extractMillis(entry.timestamp) ?? now.getTime()
      const date = new Date(ts)
      return {
        id: `riwayat-${entry.id}`,
        type: 'perubahan',
        icon: 'update',
        accent: 'secondary',
        title: 'Jadwal Diperbarui',
        description: `${entry.entitas ?? 'Data jadwal'} diperbarui${
          entry.field ? ` (${entry.field})` : ''
        }.`,
        timeLabel: formatClock(date),
        createdAt: ts,
        read: false,
      }
    })
}

/**
 * Gabungkan notifikasi baru ke daftar lama tanpa duplikat (berdasarkan id).
 */
export function mergeNotifications(existing = [], incoming = []) {
  const existingById = new Map(existing.map((item) => [item.id, item]))
  const refreshed = incoming.map((item) => {
    const prev = existingById.get(item.id)
    return prev ? { ...item, read: prev.read } : item
  })
  const incomingIds = new Set(incoming.map((item) => item.id))
  const rest = existing.filter((item) => !incomingIds.has(item.id))
  return [...refreshed, ...rest].sort((a, b) => b.createdAt - a.createdAt)
}

/** Kelompokkan notifikasi: Hari ini / Kemarin / Lebih awal. */
export function groupByDay(items = [], now = new Date()) {
  const groups = { today: [], yesterday: [], earlier: [] }
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000
  for (const item of items) {
    if (item.createdAt >= todayStart) groups.today.push(item)
    else if (item.createdAt >= yesterdayStart) groups.yesterday.push(item)
    else groups.earlier.push(item)
  }
  return groups
}
