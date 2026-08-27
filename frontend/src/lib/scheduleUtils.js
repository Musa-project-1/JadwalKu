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
 * Analisis status live jadwal hari ini:
 * - 'ongoing': Ada kelas yang sedang aktif saat ini (jamMulai <= now < jamSelesai).
 * - 'upcoming': Ada kelas yang akan datang hari ini.
 * - 'finished': Semua kelas hari ini sudah selesai.
 * - 'empty': Hari ini tidak ada jadwal kuliah.
 */
export function getClassLiveState(todayEntries, now = new Date()) {
  if (!todayEntries || todayEntries.length === 0) {
    return { status: 'empty', entry: null }
  }

  const nowMinutes = typeof now === 'number' ? now : now.getHours() * 60 + now.getMinutes()
  const sorted = sortByTime(todayEntries)

  // 1. Cek apakah ada kelas yang sedang aktif/berlangsung saat ini
  const active = sorted.find((e) => {
    const start = toMinutes(e.jamMulai)
    const end = toMinutes(e.jamSelesai)
    return nowMinutes >= start && nowMinutes < end
  })

  if (active) {
    const start = toMinutes(active.jamMulai)
    const end = toMinutes(active.jamSelesai)
    const totalDuration = Math.max(1, end - start)
    const elapsedMinutes = Math.max(0, nowMinutes - start)
    const remainingMinutes = Math.max(0, end - nowMinutes)
    const elapsedPercent = Math.min(100, Math.round((elapsedMinutes / totalDuration) * 100))

    return {
      status: 'ongoing',
      entry: active,
      remainingMinutes,
      elapsedPercent,
      totalDuration,
    }
  }

  // 2. Cek apakah ada kelas yang akan datang berikutnya hari ini
  const upcoming = sorted.find((e) => toMinutes(e.jamMulai) > nowMinutes)
  if (upcoming) {
    const minutesToStart = toMinutes(upcoming.jamMulai) - nowMinutes
    return {
      status: 'upcoming',
      entry: upcoming,
      minutesToStart,
      urgent: minutesToStart <= 15,
    }
  }

  // 3. Jika semua kelas hari ini jam selesainya sudah lewat
  return {
    status: 'finished',
    totalClassesToday: sorted.length,
    lastClass: sorted[sorted.length - 1],
  }
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

/** Data lengkap sapaan dengan ikon, gradien warna teks, dan background dinamis untuk header beranda. */
export function getGreetingData(now = new Date()) {
  const hour = now.getHours()
  if (hour < 11) {
    return {
      text: 'Selamat pagi',
      icon: 'wb_sunny',
      iconBg: 'bg-amber-500/20 text-amber-600 dark:bg-amber-400/25 dark:text-amber-300 ring-2 ring-amber-500/30',
      textGradient: 'from-amber-600 via-orange-500 to-yellow-500 dark:from-amber-300 dark:via-orange-300 dark:to-yellow-200',
      headerBg: 'bg-gradient-to-r from-amber-500/15 via-orange-500/5 to-transparent dark:from-amber-950/30 dark:via-orange-950/10 dark:to-transparent',
      subtitle: 'Semoga harimu menyenangkan dan penuh semangat.',
    }
  }
  if (hour < 15) {
    return {
      text: 'Selamat siang',
      icon: 'light_mode',
      iconBg: 'bg-sky-500/20 text-sky-600 dark:bg-sky-400/25 dark:text-sky-300 ring-2 ring-sky-500/30',
      textGradient: 'from-sky-600 via-blue-600 to-cyan-500 dark:from-sky-300 dark:via-blue-300 dark:to-cyan-200',
      headerBg: 'bg-gradient-to-r from-sky-500/15 via-blue-500/5 to-transparent dark:from-sky-950/30 dark:via-blue-950/10 dark:to-transparent',
      subtitle: 'Tetap fokus dan jaga energi untuk sesi kuliah berikutnya.',
    }
  }
  if (hour < 19) {
    return {
      text: 'Selamat sore',
      icon: 'wb_twilight',
      iconBg: 'bg-rose-500/20 text-rose-600 dark:bg-rose-400/25 dark:text-rose-300 ring-2 ring-rose-500/30',
      textGradient: 'from-orange-500 via-rose-500 to-purple-600 dark:from-orange-300 dark:via-rose-300 dark:to-purple-300',
      headerBg: 'bg-gradient-to-r from-rose-500/15 via-purple-500/5 to-transparent dark:from-rose-950/30 dark:via-purple-950/10 dark:to-transparent',
      subtitle: 'Selesaikan agenda harimu dan bersiap istirahat.',
    }
  }
  return {
    text: 'Selamat malam',
    icon: 'dark_mode',
    iconBg: 'bg-indigo-500/20 text-indigo-600 dark:bg-indigo-400/25 dark:text-indigo-300 ring-2 ring-indigo-500/30',
    textGradient: 'from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-300 dark:via-purple-300 dark:to-pink-300',
    headerBg: 'bg-gradient-to-r from-indigo-500/15 via-purple-500/5 to-transparent dark:from-indigo-950/30 dark:via-purple-950/10 dark:to-transparent',
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

/**
 * Deteksi perpindahan kelas yang berurutan ketat (jeda 0–15 menit) di ruangan/gedung berbeda.
 * Mengembalikan Map: entryId -> transition metadata.
 */
export function detectClassTransitions(dayEntries) {
  const transitions = new Map()
  if (!Array.isArray(dayEntries) || dayEntries.length <= 1) {
    return transitions
  }

  const sorted = sortByTime(dayEntries)
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1]
    const curr = sorted[i]

    const prevEnd = toMinutes(prev.jamSelesai)
    const currStart = toMinutes(curr.jamMulai)
    const gap = currStart - prevEnd

    // Jika kelas berikutnya dimulai dalam jeda 0 - 15 menit dari kelas sebelumnya
    if (gap >= 0 && gap <= 15) {
      const prevRuangFmt = formatRuang(prev.ruang, prev.tipeKelas)
      const currRuangFmt = formatRuang(curr.ruang, curr.tipeKelas)

      const isDifferent =
        String(prev.ruang || '').trim().toLowerCase() !==
          String(curr.ruang || '').trim().toLowerCase() ||
        prevRuangFmt.toLowerCase() !== currRuangFmt.toLowerCase()

      if (isDifferent) {
        // Metadata untuk kelas yang baru masuk (curr)
        transitions.set(curr.id, {
          type: 'incoming',
          gapMinutes: gap,
          fromEntry: prev,
          fromRoom: prevRuangFmt,
          toRoom: currRuangFmt,
          label: gap === 0 ? 'Pindah Ruang (Jeda 0 mnt)' : `Pindah Ruang (Jeda ${gap} mnt)`,
          message:
            gap === 0
              ? `Langsung berpindah dari ${prevRuangFmt} tanpa jeda`
              : `Jeda hanya ${gap} menit berpindah dari ${prevRuangFmt}`,
        })

        // Metadata untuk kelas yang akan keluar (prev) jika belum terpasang
        if (!transitions.has(prev.id)) {
          transitions.set(prev.id, {
            type: 'outgoing',
            gapMinutes: gap,
            nextEntry: curr,
            fromRoom: prevRuangFmt,
            toRoom: currRuangFmt,
            label: gap === 0 ? 'Lanjut Kelas Lain (0 mnt)' : `Lanjut Kelas Lain (${gap} mnt)`,
            message:
              gap === 0
                ? `Segera lanjut ke ${currRuangFmt} tanpa jeda setelah kelas ini`
                : `Ada kelas berikutnya di ${currRuangFmt} dalam ${gap} menit`,
          })
        }
      }
    }
  }

  return transitions
}
