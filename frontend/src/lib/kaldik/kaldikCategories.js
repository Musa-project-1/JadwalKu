export const KATEGORI_VALUES = [
  'registrasi',
  'perkuliahan',
  'uts',
  'uas',
  'ujian',
  'yudisium',
  'libur',
  'kegiatan',
  'minggu_tenang',
]

/** Deteksi kategori dari nama event / teks label. */
export function normalizeCategory(name) {
  const s = String(name || '').toLowerCase()
  if (s.includes('registrasi') || s.includes('krs') || s.includes('bimbingan akademik')) return 'registrasi'
  if (s.includes('perkuliahan')) return 'perkuliahan'
  if (s.includes('uts') || s.includes('tengah semester')) return 'uts'
  if (s.includes('uas') || s.includes('akhir semester')) return 'uas'
  if (s.includes('praktikum') || s.includes('praktik lapangan') || s.includes('remedial') || s.includes('ujian')) return 'ujian'
  if (s.includes('yudisium')) return 'yudisium'
  if (s.includes('libur') || s.includes('cuti')) return 'libur'
  if (s.includes('minggu tenang')) return 'minggu_tenang'
  return 'kegiatan'
}

/** Deteksi semester dari string eksplisit / fallback dari bulan tanggal mulai. */
export function detectSemester(semesterRaw, tanggalMulai = '') {
  const s = String(semesterRaw || '').toLowerCase()
  if (s.includes('ganjil')) return 'ganjil'
  if (s.includes('genap')) return 'genap'
  if (s.includes('antar') || s.includes('libur') || s.includes('cuti')) return 'antar'

  // Fallback: infer dari bulan. Sep–Feb → ganjil, Mar–Agu → genap.
  if (tanggalMulai) {
    const month = Number(String(tanggalMulai).split('-')[1])
    if (!Number.isNaN(month)) {
      if (month >= 9 || month <= 2) return 'ganjil'
      return 'genap'
    }
  }
  return 'antar'
}

export function detectSemesterFromDate(startISO) {
  return detectSemester('', startISO)
}

export function semesterLabel(semester) {
  return semester === 'ganjil' ? 'Ganjil' : semester === 'genap' ? 'Genap' : 'Antar / Libur'
}

export function kategoriLabel(kategori) {
  const labels = {
    registrasi: 'Registrasi / KRS',
    perkuliahan: 'Perkuliahan',
    uts: 'UTS',
    uas: 'UAS',
    ujian: 'Ujian / Praktikum',
    yudisium: 'Yudisium',
    libur: 'Libur',
    kegiatan: 'Kegiatan',
    minggu_tenang: 'Minggu Tenang',
  }
  return labels[kategori] || kategori || 'Kegiatan'
}
