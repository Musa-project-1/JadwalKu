/**
 * Generate file .ics (iCalendar) dari daftar jadwal, lalu unduh.
 * Format mengikuti RFC 5545 — kompatibel dengan Google Calendar.
 *
 * @param {Array<{ id: string, hari: string, jamMulai: string, jamSelesai: string, kodeMK: string, ruang?: string }>} entries
 * @param {{ prodi?: string, semester?: unknown }} meta
 */
export function downloadIcs(entries, { prodi = '', semester = '' } = {}) {
  const now = new Date()
  const stamp = formatIcsDate(now)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jadwal Kampus//ID',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:Jadwal ${prodi} Semester ${semester}`.trim(),
    'X-WR-TIMEZONE:Asia/Jakarta',
  ]

  for (const entry of entries) {
    const dayIndex = DAY_INDEX[entry.hari]
    if (dayIndex === undefined) continue

    // Hitung END relatif terhadap START: kelas lewat tengah malam
    // (jamSelesai < jamMulai, mis. 22:00–01:00) harus berakhir besoknya,
    // bukan DTEND < DTSTART.
    const start = nextOccurrence(dayIndex, entry.jamMulai)
    const end = addMinutes(start, toMinutes(entry.jamSelesai) - toMinutes(entry.jamMulai))

    lines.push(
      'BEGIN:VEVENT',
      `UID:${entry.id}@jadwal-kampus`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Asia/Jakarta:${formatIcsDate(start)}`,
      `DTEND;TZID=Asia/Jakarta:${formatIcsDate(end)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${WEEKLY_BYDAY[entry.hari]}`,
      `SUMMARY:${escapeIcsText(entry.kodeMK)}`,
      entry.ruang ? `LOCATION:${escapeIcsText(entry.ruang)}` : null,
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')

  const blob = new Blob([lines.filter(Boolean).join('\r\n')], {
    type: 'text/calendar;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `jadwal-${prodi.toLowerCase().replace(/\s+/g, '-')}-semester-${semester}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const DAY_INDEX = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6 }
const WEEKLY_BYDAY = {
  Senin: 'MO',
  Selasa: 'TU',
  Rabu: 'WE',
  Kamis: 'TH',
  Jumat: 'FR',
  Sabtu: 'SA',
}

/** Cari kejadian berikutnya (hari & jam tertentu) mulai dari sekarang. */
function nextOccurrence(dayIndex, hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
  let diff = dayIndex - target.getDay()
  if (diff < 0 || (diff === 0 && target <= now)) diff += 7
  target.setDate(target.getDate() + diff)
  return target
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + m
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000)
}

/**
 * Escaping teks sesuai RFC 5545 §3.3.11 — tanpa ini karakter koma/titik
 * dua/backslash/newline merusak parsing .ics di Google Calendar/Outlook.
 */
function escapeIcsText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function formatIcsDate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}00`
  )
}
