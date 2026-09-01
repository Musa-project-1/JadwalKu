import { findRoomMasterMatch } from './roomUtils'

/**
 * Utilitas Parser Lokasi Kampus, Gedung, Nomor Lantai, dan Panduan Arah (Wayfinding)
 * Mendukung pencarian dinamis dari Master Ruangan Firestore jika tersedia.
 */
export function parseRoomLocation(rawRuang = '', tipeKelas = 'K1', roomMasterList = []) {
  const clean = String(rawRuang || '').trim()
  const lower = clean.toLowerCase()

  // 1. Daring / Online / Virtual Room
  if (
    lower.includes('online') ||
    lower.includes('zoom') ||
    lower.includes('meet') ||
    lower.includes('teams') ||
    tipeKelas === 'K2'
  ) {
    return {
      raw: clean || 'Daring / Online',
      building: 'Ruang Virtual (Daring)',
      buildingCode: 'ONLINE',
      floor: 'Cloud / Internet',
      floorNumber: 0,
      roomNumber: clean || 'Kelas Online',
      roomType: 'Kuliah Daring / Teleconference',
      guidance:
        'Sesi perkuliahan dilaksanakan via platform teleconference (Zoom / Google Meet). Pastikan koneksi internet stabil dan bergabung 5–10 menit sebelum jam kuliah dimulai.',
      facilities: ['Aplikasi Zoom / Meet', 'Materi LMS / Slide', 'Interaksi Virtual'],
      badgeTone: 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30',
      icon: 'videocam',
      isOnline: true,
      isCustomMaster: false,
    }
  }

  // 2. Cek apakah ruangan terdaftar resmi di Master Ruangan Kampus (Firestore)
  const masterMatch = findRoomMasterMatch(clean, roomMasterList)
  if (masterMatch) {
    return {
      raw: clean,
      building: masterMatch.gedung || 'Gedung Kampus',
      buildingCode: masterMatch.gedungCode || masterMatch.gedung || 'RUANG',
      floor: masterMatch.lantai ? `Lantai ${masterMatch.lantai}` : 'Lantai Kampus',
      floorNumber: masterMatch.lantai || 1,
      roomNumber: masterMatch.namaRuang || clean,
      roomType:
        masterMatch.tipeRuang === 'lab'
          ? 'Laboratorium Praktikum'
          : masterMatch.tipeRuang === 'auditorium'
          ? 'Auditorium / Aula Besar'
          : 'Ruang Kelas Perkuliahan',
      guidance: masterMatch.petunjukArah || `Ruangan ${masterMatch.namaRuang} terletak di ${masterMatch.gedung || 'area kampus'}.`,
      facilities: Array.isArray(masterMatch.fasilitas) && masterMatch.fasilitas.length > 0
        ? masterMatch.fasilitas
        : ['AC Ruangan', 'Proyektor LCD', 'Papan Tulis Whiteboard'],
      badgeTone:
        masterMatch.tipeRuang === 'lab'
          ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30'
          : 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30',
      icon:
        masterMatch.tipeRuang === 'lab'
          ? 'desktop_windows'
          : masterMatch.tipeRuang === 'auditorium'
          ? 'theater_comedy'
          : 'meeting_room',
      isOnline: false,
      isCustomMaster: true,
      kapasitas: masterMatch.kapasitas,
    }
  }

  // 3. Fallback Aman & Faktual (Tanpa Data Fiktif) jika belum dikonfigurasi di Master Admin
  let detectedFloor = 'Lantai 1'
  const numMatch = clean.match(/\d+/)
  if (numMatch) {
    const num = parseInt(numMatch[0], 10)
    if (num >= 100 && num <= 999) {
      detectedFloor = `Lantai ${Math.floor(num / 100)}`
    } else if (num >= 1 && num <= 9) {
      detectedFloor = `Lantai ${num}`
    }
  }

  return {
    raw: clean,
    building: 'Gedung Perkuliahan Kampus',
    buildingCode: clean.slice(0, 4).toUpperCase(),
    floor: detectedFloor,
    floorNumber: 1,
    roomNumber: clean || 'Ruang Kelas',
    roomType: tipeKelas === 'HB' ? 'Kelas Hybrid' : 'Ruang Kelas Tatap Muka',
    guidance: `Silakan menuju ${clean || 'ruang kelas'} sesuai denah kampus atau tanyakan petugas akademik jika membutuhkan panduan ruangan.`,
    facilities: ['Fasilitas Perkuliahan Standar'],
    badgeTone: 'bg-surface-container-high text-on-surface border-outline-variant/30',
    icon: 'meeting_room',
    isOnline: false,
    isCustomMaster: false,
  }
}
