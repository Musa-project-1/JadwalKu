import { daysUntil } from '../../../lib/scheduleUtils'

export const PRIORITY_STRIPE = {
  tinggi: 'bg-error',
  sedang: 'bg-amber-500',
  rendah: 'bg-blue-500',
}

export const PRIORITY_LABEL = {
  tinggi: 'Mendesak',
  sedang: 'Segera',
  rendah: 'Masih lama',
}

export function groupTasks(tasks) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekMs = 7 * 24 * 60 * 60 * 1000

  const groups = { thisWeek: [], nextWeek: [], done: [] }
  for (const task of tasks) {
    if (task.selesai) {
      groups.done.push(task)
      continue
    }
    const dl = parseLocalDate(task.deadline)
    const diff = dl.getTime() - startOfToday.getTime()
    if (diff <= weekMs) groups.thisWeek.push(task)
    else groups.nextWeek.push(task)
  }
  return groups
}

export function parseLocalDate(isoDate) {
  const m = String(isoDate ?? '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (!m) return new Date(isoDate)
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

export function formatDeadline(isoDate) {
  const days = daysUntil(isoDate)
  if (days === 0) return 'Hari ini'
  if (days === 1) return 'Besok'
  if (days > 1) return `${days} hari lagi`
  return `${Math.abs(days)} hari lewat`
}

export function localDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}
