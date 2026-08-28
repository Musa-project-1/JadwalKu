/**
 * Generate dan unduh file .ics (iCalendar) dari jadwal perkuliahan dan ujian.
 * Format mengikuti standar RFC 5545 — kompatibel dengan Google Calendar, Apple iCal, dan Microsoft Outlook.
 */

// URL aplikasi dipakai di deskripsi event .ics. Dihitung dari BASE_URL & origin
// agar benar di GitHub Pages (base '/JadwalKu/'), bukan URL lama yang hardcoded.
const APP_URL = (() => {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  return typeof window !== 'undefined' && window.location.origin
    ? `${window.location.origin}${base}`
    : 'https://jadwalku.app'
})()

/**
 * Unduh file .ics untuk jadwal mingguan berulang (Weekly Recurring Schedule).
 *
 * @param {Array<object>} entries - Daftar jadwal perkuliahan
 * @param {object} options
 * @param {string} [options.prodi] - Nama program studi
 * @param {string|number} [options.semester] - Semester aktif
 * @param {string} [options.tahunAjaran] - Tahun ajaran aktif
 * @param {Map<string, object>} [options.courseMap] - Map kodeMK ke object mata kuliah
 */
export function downloadIcs(
  entries,
  { prodi = '', semester = '', tahunAjaran = '', courseMap = new Map(), campusName = '' } = {},
) {
  if (!entries || entries.length === 0) return

  const now = new Date()
  const stamp = formatIcsDate(now)
  const calName = [campusName ? `${campusName}: ` : '', 'Jadwal Kuliah', prodi, `Semester ${semester}`]
    .filter(Boolean)
    .join(' ')
    .trim()

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JadwalKu//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calName}`,
    'X-WR-TIMEZONE:Asia/Jakarta',
  ]

  for (const entry of entries) {
    const dayIndex = DAY_INDEX[entry.hari]
    if (dayIndex === undefined) continue

    const course = courseMap.get(entry.kodeMK) || {}
    const courseTitle = course.namaMK
      ? `${course.namaMK} (${entry.kodeMK})`
      : escapeIcsText(entry.kodeMK)

    const start = nextOccurrence(dayIndex, entry.jamMulai)
    const end = addMinutes(start, Math.max(30, toMinutes(entry.jamSelesai) - toMinutes(entry.jamMulai)))

    const description = [
      `Mata Kuliah: ${escapeIcsText(course.namaMK || entry.kodeMK)}`,
      `Kode MK: ${escapeIcsText(entry.kodeMK)}`,
      course.dosen ? `Dosen: ${escapeIcsText(course.dosen)}` : null,
      entry.ruang ? `Ruangan: ${escapeIcsText(entry.ruang)}` : null,
      course.sks ? `Beban: ${course.sks} SKS` : null,
      entry.tipeKelas ? `Tipe Kelas: ${escapeIcsText(entry.tipeKelas)}` : null,
      tahunAjaran ? `Tahun Ajaran: ${escapeIcsText(tahunAjaran)}` : null,
      `Aplikasi: JadwalKu (${escapeIcsText(APP_URL)})`,
    ]
      .filter(Boolean)
      .join('\\n')

    lines.push(
      'BEGIN:VEVENT',
      `UID:jadwal-${entry.id || crypto.randomUUID()}@jadwalku.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Asia/Jakarta:${formatIcsDate(start)}`,
      `DTEND;TZID=Asia/Jakarta:${formatIcsDate(end)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${WEEKLY_BYDAY[entry.hari]}`,
      `SUMMARY:${escapeIcsText(courseTitle)}`,
      entry.ruang ? `LOCATION:${escapeIcsText(entry.ruang)}` : null,
      `DESCRIPTION:${description}`,
      // Alarm 30 menit & 15 menit sebelum kelas
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Pengingat: 30 menit lagi kelas ${escapeIcsText(courseTitle)} dimulai`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Pengingat: 15 menit lagi kelas ${escapeIcsText(courseTitle)} dimulai`,
      'END:VALARM',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  saveBlobAsFile(
    lines.filter(Boolean).join('\r\n'),
    `jadwal-kuliah-${prodi.toLowerCase().replace(/\s+/g, '-')}-sem-${semester}.ics`,
  )
}

/**
 * Unduh file .ics untuk jadwal ujian (UTS & UAS) dengan tanggal dan jam spesifik.
 *
 * @param {Array<object>} exams - Daftar jadwal ujian
 * @param {object} options
 * @param {string} [options.prodi] - Nama program studi
 * @param {string|number} [options.semester] - Semester aktif
 * @param {string} [options.jenis] - 'UTS' atau 'UAS'
 * @param {Map<string, object>} [options.courseMap] - Map kodeMK ke object mata kuliah
 */
export function downloadExamIcs(
  exams,
  { prodi = '', semester = '', jenis = 'UTS', courseMap = new Map(), campusName = '' } = {},
) {
  if (!exams || exams.length === 0) return

  const now = new Date()
  const stamp = formatIcsDate(now)
  const calName = [campusName ? `${campusName}: ` : '', 'Jadwal Ujian', jenis, prodi, `Semester ${semester}`]
    .filter(Boolean)
    .join(' ')
    .trim()

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JadwalKu//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calName}`,
    'X-WR-TIMEZONE:Asia/Jakarta',
  ]

  for (const exam of exams) {
    if (!exam.tanggal || !exam.jamMulai) continue

    const course = courseMap.get(exam.kodeMK) || {}
    const title = course.namaMK || exam.namaMK || exam.kodeMK
    const summary = `${exam.jenis || jenis}: ${title} (${exam.kodeMK})`

    const [year, month, day] = String(exam.tanggal).split('-').map(Number)
    const [startH, startM] = String(exam.jamMulai).split(':').map(Number)
    const startDate = new Date(year, month - 1, day, startH, startM)

    let endDate
    if (exam.jamSelesai) {
      const [endH, endM] = String(exam.jamSelesai).split(':').map(Number)
      endDate = new Date(year, month - 1, day, endH, endM)
    } else {
      endDate = addMinutes(startDate, 90) // Default durasi ujian 90 menit
    }

    const description = [
      `Mata Uji: ${escapeIcsText(title)}`,
      `Jenis: ${escapeIcsText(exam.jenis || jenis)}`,
      `Kode MK: ${escapeIcsText(exam.kodeMK)}`,
      exam.dosen ? `Pengawas / Dosen: ${escapeIcsText(exam.dosen)}` : null,
      exam.ruang ? `Ruangan: ${escapeIcsText(exam.ruang)}` : null,
      exam.mode ? `Mode Ujian: ${escapeIcsText(exam.mode)}` : null,
      `Aplikasi: JadwalKu (${escapeIcsText(APP_URL)})`,
    ]
      .filter(Boolean)
      .join('\\n')

    lines.push(
      'BEGIN:VEVENT',
      `UID:ujian-${exam.id || crypto.randomUUID()}@jadwalku.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Asia/Jakarta:${formatIcsDate(startDate)}`,
      `DTEND;TZID=Asia/Jakarta:${formatIcsDate(endDate)}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      exam.ruang ? `LOCATION:${escapeIcsText(exam.ruang)}` : null,
      `DESCRIPTION:${description}`,
      // Alarm H-1 hari dan H-1 jam sebelum ujian
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Besok Ujian: ${escapeIcsText(summary)}`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      `DESCRIPTION:1 Jam Lagi Ujian: ${escapeIcsText(summary)}`,
      'END:VALARM',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  saveBlobAsFile(
    lines.filter(Boolean).join('\r\n'),
    `jadwal-ujian-${jenis.toLowerCase()}-${prodi.toLowerCase().replace(/\s+/g, '-')}-sem-${semester}.ics`,
  )
}

/**
 * Buat tautan URL langsung untuk menambahkan event ke Google Calendar via Web.
 */
export function getGoogleCalendarUrl(entry, { course = {}, date = null } = {}) {
  const title = course.namaMK ? `${course.namaMK} (${entry.kodeMK})` : entry.kodeMK
  const details = `Dosen: ${course.dosen || '-'}\nRuang: ${entry.ruang || '-'}`

  let startIso = ''
  let endIso = ''

  if (date) {
    const pad = (n) => String(n).padStart(2, '0')
    const [startH, startM] = String(entry.jamMulai).split(':')
    const [endH, endM] = String(entry.jamSelesai || entry.jamMulai).split(':')
    const y = date.getFullYear()
    const m = pad(date.getMonth() + 1)
    const d = pad(date.getDate())

    startIso = `${y}${m}${d}T${startH}${startM}00`
    endIso = `${y}${m}${d}T${endH}${endM}00`
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: details,
    location: entry.ruang || '',
  })

  if (startIso && endIso) {
    params.set('dates', `${startIso}/${endIso}`)
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function saveBlobAsFile(content, fileName) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
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
 * Escaping teks sesuai RFC 5545 §3.3.11
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
