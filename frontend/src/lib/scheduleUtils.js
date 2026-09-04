export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

/**
 * Menghitung selisih hari dari hari ini ke tanggal ISO (YYYY-MM-DD).
 * Hasil: >0 (hari ke depan), 0 (hari ini), <0 (sudah lewat).
 */
export function daysUntil(isoDate) {
  if (!isoDate || isoDate === 'Tanpa Tanggal') return 0
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const [y, m, d] = String(isoDate).split('-').map(Number)
  if (!y || !m || !d) return 0
  const target = new Date(y, m - 1, d)
  const diffMs = target.getTime() - startOfToday.getTime()
  return Math.round(diffMs / (24 * 60 * 60 * 1000))
}

/** Urutan hari untuk sorting jadwal (Senin = 1, dst). */
export const DAY_ORDER = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6, Minggu: 7 }

export const BASE_SEMESTER_GROUPS = [
  { label: 'Semua Semester', value: '' },
  { label: 'Semester Ganjil', value: 'ganjil' },
  { label: 'Semester Genap', value: 'genap' },
]

/** Susun opsi Tahun Ajaran unik dari daftar jadwal (desc), selalu diawali "Semua TA". */
export function buildTaOptions(rawSchedule) {
  const tas = [...new Set(rawSchedule.map((s) => String(s.tahunAjaran || '').trim()).filter(Boolean))].sort((a, b) => b.localeCompare(a))
  return [{ label: 'Semua TA', value: '' }, ...tas.map((ta) => ({ label: `TA ${ta}`, value: ta }))]
}

/** Susun opsi semester: cascade mengikuti TA terpilih, plus grup Ganjil/Genap. */
export function buildSemesterOptions(rawSchedule, taFilter) {
  const pool = taFilter ? rawSchedule.filter((s) => String(s.tahunAjaran || '').trim() === String(taFilter)) : rawSchedule
  const nums = [...new Set(pool.map((s) => Number(s.semester)).filter((n) => Number.isInteger(n) && n > 0))].sort((a, b) => a - b)
  const numeric = nums.map((n) => ({ label: `Semester ${n}`, value: String(n) }))
  return [...BASE_SEMESTER_GROUPS, ...numeric]
}

/** Terapkan seluruh filter jadwal (fakultas/prodi/semester/TA/hari/status/bentrok/search) lalu sortir. */
export function filterSchedule(rawSchedule, filters, context) {
  const { fakultasFilter, prodiFilter, semesterFilter, taFilter, hariFilter, statusFilter, onlyShowConflicts, search } = filters
  const { courseMap, prodiFakultasMap, conflictMap } = context
  const q = search.trim().toLowerCase()

  return rawSchedule
    .filter((item) => (fakultasFilter ? String(item.fakultasId || prodiFakultasMap.get(String(item.prodi || '')) || '') === String(fakultasFilter) : true))
    .filter((item) => (prodiFilter ? item.prodi === prodiFilter : true))
    .filter((item) => {
      if (!semesterFilter) return true
      const sem = Number(item.semester)
      if (semesterFilter === 'ganjil') return sem % 2 === 1
      if (semesterFilter === 'genap') return sem % 2 === 0
      return sem === Number(semesterFilter)
    })
    .filter((item) => (taFilter ? String(item.tahunAjaran || '') === String(taFilter) : true))
    .filter((item) => (hariFilter ? item.hari === hariFilter : true))
    .filter((item) => (statusFilter ? (item.status || 'published') === statusFilter : true))
    .filter((item) => (onlyShowConflicts ? conflictMap.has(item.id) : true))
    .filter((item) => {
      if (!q) return true
      const course = courseMap.get(item.kodeMK)
      const matchStr = `${item.kodeMK} ${course?.namaMK ?? ''} ${course?.dosen ?? ''} ${item.prodi} ${item.ruang ?? ''} ${item.hari}`.toLowerCase()
      return matchStr.includes(q)
    })
    .sort((a, b) => {
      const dayDiff = (DAY_ORDER[a.hari] || 99) - (DAY_ORDER[b.hari] || 99)
      if (dayDiff !== 0) return dayDiff
      return String(a.jamMulai).localeCompare(String(b.jamMulai))
    })
}

/**
 * Kelompokkan sesi jadwal (MK umum lintas prodi) berdasarkan kombinasi unik:
 * kodeMK + hari + jamMulai + jamSelesai + dosen + ruang.
 */
export function groupSchedule(filteredSchedule, courseMap) {
  const groups = new Map()
  for (const item of filteredSchedule) {
    const course = courseMap.get(item.kodeMK)
    const dosenKey = String(course?.dosen ?? item.dosen ?? '').trim().toLowerCase()
    const ruangKey = String(item.ruang ?? '').trim().toLowerCase()
    const key = [
      String(item.kodeMK ?? '').trim().toUpperCase(),
      String(item.hari ?? ''),
      String(item.jamMulai ?? ''),
      String(item.jamSelesai ?? ''),
      dosenKey,
      ruangKey,
    ].join('|')
    if (!groups.has(key)) groups.set(key, { key, items: [], course })
    groups.get(key).items.push(item)
  }
  const arr = [...groups.values()]
  arr.sort((a, b) => {
    const ra = a.items[0]
    const rb = b.items[0]
    const da = (DAY_ORDER[ra.hari] || 99) - (DAY_ORDER[rb.hari] || 99)
    if (da !== 0) return da
    return String(ra.jamMulai).localeCompare(String(rb.jamMulai))
  })
  return arr
}

/** Bangun ID dokumen jadwal dari entri + tahun ajaran (aman untuk Firestore path). */
export function jadwalDocId(entry, ta) {
  const taStr = String(ta || entry.tahunAjaran || '').trim().replace(/[/#?[\]]/g, '-')
  return [
    entry.prodi,
    Number(entry.semester),
    entry.hari,
    entry.jamMulai,
    entry.kodeMK,
    entry.tipeKelas,
    taStr || 'tanpaTA',
  ]
    .join('|')
    .replace(/[/#?[\]]/g, '-')
}

/** Nama hari ini dalam Bahasa Indonesia, misal "Senin". */
export function getTodayName(date = new Date()) {
  return DAY_NAMES[date.getDay()]
}

/** Format tanggal panjang lokal ('id' atau 'en'), misal "Senin, 14 Oktober 2024" atau "Monday, October 14, 2024". */
export function formatLongDate(date = new Date(), lang = 'id') {
  const locale = lang === 'en' ? 'en-US' : 'id-ID'
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function toMinutes(hhmm) {
  const parts = String(hhmm ?? '').split(':').map(Number)
  const [h, m] = parts
  if (parts.length < 2 || Number.isNaN(h) || Number.isNaN(m)) return NaN
  return h * 60 + m
}

/**
 * Urutkan entri jadwal berdasarkan jam mulai.
 */
export function sortByTime(entries) {
  return [...entries].sort((a, b) => {
    const ma = toMinutes(a.jamMulai)
    const mb = toMinutes(b.jamMulai)
    // Entri dengan jam tidak valid disortir ke akhir agar tidak mengganggu.
    if (Number.isNaN(ma) && Number.isNaN(mb)) return 0
    if (Number.isNaN(ma)) return 1
    if (Number.isNaN(mb)) return -1
    return ma - mb
  })
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
  const target = toMinutes(hhmm)
  if (Number.isNaN(target)) return Number.POSITIVE_INFINITY
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return target - nowMinutes
}

/** Format countdown ramah: "30 menit lagi", "1 jam 15 menit lagi". */
export function formatCountdown(minutes) {
  const safe = Number(minutes)
  if (!Number.isFinite(safe)) return 'Belum dijadwalkan'
  if (safe <= 0) return 'Sedang berlangsung'
  if (safe < 60) return `${safe} menit lagi`
  const hours = Math.floor(safe / 60)
  const mins = safe % 60
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
 *
 * @param {string} ruang
 * @param {string} [tipeKelas]
 * @param {object} [roomMap] peta ruang tambahan dari config kampus (optional)
 */
export function formatRuang(ruang, tipeKelas = '', roomMap = {}) {
  const cleanRuang = String(ruang || '').trim()
  const cleanTipe = String(tipeKelas || '').trim().toUpperCase()
  const activeMap = roomMap && Object.keys(roomMap).length > 0 ? roomMap : ROOM_NAME_MAP

  // 1. Cek langsung pemetaan kode ruang
  if (cleanRuang && activeMap[cleanRuang.toUpperCase()]) {
    return activeMap[cleanRuang.toUpperCase()]
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
    if (cleanTipe === 'K2' || cleanTipe === 'GBK2') return activeMap.K2 || 'Online / Zoom'
    if (cleanTipe === 'HBH') return activeMap.HBH || 'Gedung Halimah'
    if (cleanTipe === 'HBD') return activeMap.HBD || 'Gedung Dekanat'
    if (cleanTipe === 'GBK1') return activeMap.GBK1 || 'Ruang Kelas Gabungan'
    if (cleanTipe === 'K1') return activeMap.K1 || 'Ruang Kelas Prodi'
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
