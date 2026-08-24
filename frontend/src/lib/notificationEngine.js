import { minutesUntil } from './scheduleUtils'

/**
 * Mesin notifikasi — fungsi murni yang mengubah data (jadwal, tugas, ujian,
 * riwayat) menjadi daftar item notifikasi. Dipanggil oleh
 * NotificationsContext secara berkala.
 *
 * Bentuk item notifikasi:
 * {
 *   id: string          — kunci stabil untuk deduplikasi
 *   type: 'kelas' | 'tugas' | 'ujian' | 'perubahan'
 *   icon: string        — nama Material Symbol
 *   accent: 'primary' | 'tertiary' | 'error' | 'secondary'
 *   title: string
 *   description: string
 *   timeLabel: string   — misal "08:00" atau "Kemarin, 16:00"
 *   createdAt: number   — epoch ms
 *   read: boolean
 * }
 */

const CLASS_REMINDER_WINDOW_MIN = 15
const EXAM_REMINDER_DAYS = 3
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

/** Pengingat kelas: kelas hari ini yang mulai ≤15 menit lagi. */
export function buildClassReminders(todayEntries, courseMap = new Map(), now = new Date()) {
  return todayEntries
    .filter((entry) => {
      const mins = minutesUntil(entry.jamMulai, now)
      return mins > 0 && mins <= CLASS_REMINDER_WINDOW_MIN
    })
    .map((entry) => {
      const course = courseMap.get(entry.kodeMK)
      const mins = minutesUntil(entry.jamMulai, now)
      return {
        id: `kelas-${entry.id}-${dateKey(now)}`,
        type: 'kelas',
        icon: 'schedule',
        accent: 'primary',
        title: course?.namaMK ?? entry.kodeMK ?? 'Kelas',
        description: `Kelas akan dimulai dalam ${mins} menit. Ruang: ${entry.ruang ?? '-'}.`,
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
          ? 'Batas waktu pengumpulan tugas adalah hari ini.'
          : 'Batas waktu pengumpulan tugas adalah besok.',
      timeLabel: formatClock(now),
      createdAt: now.getTime(),
      read: false,
    }))
}

/** Pengingat ujian: ujian dalam 3 hari ke depan. */
export function buildExamReminders(exams = [], now = new Date()) {
  const limit = new Date(now.getTime() + EXAM_REMINDER_DAYS * 24 * 60 * 60 * 1000)
  const todayStr = dateKey(now)
  const limitStr = dateKey(limit)
  return exams
    .filter((exam) => exam.tanggal >= todayStr && exam.tanggal <= limitStr)
    .map((exam) => ({
      id: `ujian-${exam.id}`,
      type: 'ujian',
      icon: 'edit',
      accent: 'error',
      title: `${exam.jenis ?? 'Ujian'} — ${exam.kodeMK ?? ''}`.trim(),
      description: `Ujian dijadwalkan pada ${exam.tanggal} pukul ${exam.jam ?? '-'} di ${exam.ruang ?? '-'}.`,
      timeLabel: formatClock(now),
      createdAt: now.getTime(),
      read: false,
    }))
}

/**
 * Ambil epoch ms dari timestamp Firestore (objek Timestamp, Date, angka,
 * atau string ISO). Mengembalikan null bila tidak valid.
 */
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
 * Item lama dipertahankan urutan & status bacanya.
 */
export function mergeNotifications(existing = [], incoming = []) {
  const knownIds = new Set(existing.map((item) => item.id))
  const fresh = incoming.filter((item) => !knownIds.has(item.id))
  return [...fresh, ...existing].sort((a, b) => b.createdAt - a.createdAt)
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
