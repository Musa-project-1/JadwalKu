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

/** Data lengkap sapaan dengan ikon dan warna untuk header beranda. */
export function getGreetingData(now = new Date()) {
  const hour = now.getHours()
  if (hour < 11) {
    return {
      text: 'Selamat pagi',
      icon: 'wb_sunny',
      iconBg: 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300',
      subtitle: 'Semoga harimu menyenangkan dan penuh semangat.',
    }
  }
  if (hour < 15) {
    return {
      text: 'Selamat siang',
      icon: 'light_mode',
      iconBg: 'bg-orange-500/15 text-orange-600 dark:bg-orange-400/20 dark:text-orange-300',
      subtitle: 'Tetap fokus dan jaga energi untuk sesi kuliah berikutnya.',
    }
  }
  if (hour < 19) {
    return {
      text: 'Selamat sore',
      icon: 'wb_twilight',
      iconBg: 'bg-violet-500/15 text-violet-600 dark:bg-violet-400/20 dark:text-violet-300',
      subtitle: 'Selesaikan agenda harimu dan bersiap istirahat.',
    }
  }
  return {
    text: 'Selamat malam',
    icon: 'dark_mode',
    iconBg: 'bg-indigo-500/15 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300',
    subtitle: 'Waktunya rehat dan mengevaluasi materi belajar.',
  }
}

export const ROOM_NAME_MAP = {
  HBH: 'Gedung Halimah',
  HBD: 'Gedung Dekanat',
  K1: 'Ruang Kelas Prodi',
  '2-A': 'Ruang Kelas 2-A',
  '4-A': 'Ruang Kelas 4-A',
  K2: 'Online / Zoom',
  '2-B': 'Online / Zoom',
  '4-E': 'Online / Zoom',
  GBK1: 'Ruang Kelas Gabungan',
  GBK2: 'Online / Zoom',
}

/**
 * Format nama ruangan agar ramah dibaca dan mendeskripsikan lokasi fisik/daring yang tepat.
 * Memetakan HBH -> Gedung Halimah, HBD -> Gedung Dekanat, K2/GBK2 -> Online / Zoom, K1 -> Ruang Kelas Prodi.
 */
export function formatRuang(ruang, tipeKelas = '') {
  const cleanRuang = String(ruang || '').trim()
  const cleanTipe = String(tipeKelas || '').trim().toUpperCase()

  // 1. Cek langsung pemetaan kode ruang
  if (cleanRuang && ROOM_NAME_MAP[cleanRuang.toUpperCase()]) {
    return ROOM_NAME_MAP[cleanRuang.toUpperCase()]
  }

  // 2. Pola dinamis seperti 2-A, 4-A, 6-A, 8-A -> Ruang Kelas [X-A]
  if (/^\d+-A$/i.test(cleanRuang)) {
    return `Ruang Kelas ${cleanRuang.toUpperCase()}`
  }
  // Pola dinamis seperti 2-B, 4-B, 6-B, 4-E -> Online / Zoom
  if (/^\d+-[BE]$/i.test(cleanRuang)) {
    return 'Online / Zoom'
  }

  // 3. Jika ruang kosong atau '-' tapi ada tipeKelas
  if (!cleanRuang || cleanRuang === '-') {
    if (cleanTipe === 'K2' || cleanTipe === 'GBK2') return 'Online / Zoom'
    if (cleanTipe === 'HBH') return 'Gedung Halimah'
    if (cleanTipe === 'HBD') return 'Gedung Dekanat'
    if (cleanTipe === 'GBK1') return 'Ruang Kelas Gabungan'
    if (cleanTipe === 'K1') return 'Ruang Kelas Prodi'
    return '-'
  }

  return cleanRuang
}
