export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

/** Nama hari ini dalam Bahasa Indonesia, misal "Senin". */
export function getTodayName(date = new Date()) {
  return DAY_NAMES[date.getDay()]
}

/** Format tanggal panjang Indonesia, misal "Senin, 14 Oktober 2024". */
export function formatLongDate(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + m
}

/**
 * Urutkan entri jadwal berdasarkan jam mulai.
 */
export function sortByTime(entries) {
  return [...entries].sort((a, b) => toMinutes(a.jamMulai) - toMinutes(b.jamMulai))
}

/**
 * Cari kelas berikutnya yang belum selesai dari daftar jadwal hari ini.
 * Mengembalikan null jika tidak ada.
 */
export function findNextClass(todayEntries, now = new Date()) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const sorted = sortByTime(todayEntries)
  return sorted.find((e) => toMinutes(e.jamSelesai) > nowMinutes) ?? null
}

/**
 * Hitung selisih menit sampai jam tertentu hari ini ("30 menit lagi").
 * Negatif jika sudah lewat.
 */
export function minutesUntil(hhmm, now = new Date()) {
  const [h, m] = String(hhmm).split(':').map(Number)
  const target = h * 60 + m
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return target - nowMinutes
}

/** Format countdown ramah: "30 menit lagi", "1 jam 15 menit lagi". */
export function formatCountdown(minutes) {
  if (minutes <= 0) return 'Sedang berlangsung'
  if (minutes < 60) return `${minutes} menit lagi`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours} jam ${mins} menit lagi` : `${hours} jam lagi`
}

/** Sapaan sesuai jam: pagi/siang/sore/malam. */
export function getGreeting(now = new Date()) {
  const hour = now.getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}
