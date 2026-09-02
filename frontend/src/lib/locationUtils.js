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

  // 3. Fallback Aman & Faktual — deteksi tipe ruangan dari nama (lab / auditorium / kelas)
  const lowerClean = clean.toLowerCase()
  const isLab = /lab|komputer|laboratorium/i.test(lowerClean)
  const isAuditorium = /auditorium|aula|serbaguna/i.test(lowerClean)

  let detectedFloorLabel = 'Lantai 1'
  let detectedFloorNumber = 1
  const numMatch = clean.match(/\d+/)
  if (numMatch) {
    const num = parseInt(numMatch[0], 10)
    if (num >= 100 && num <= 999) {
      detectedFloorNumber = Math.floor(num / 100)
      detectedFloorLabel = `Lantai ${detectedFloorNumber}`
    } else if (num >= 1 && num <= 9) {
      detectedFloorNumber = num
      detectedFloorLabel = `Lantai ${num}`
    }
  }

  // 3a. Laboratorium Komputer / Sains
  if (isLab) {
    return {
      raw: clean,
      building: 'Gedung Laboratorium / Komputer',
      buildingCode: 'LAB',
      floor: detectedFloorLabel,
      floorNumber: detectedFloorNumber,
      roomNumber: clean || 'Lab Komputer',
      roomType: 'Laboratorium Praktikum & Komputer',
      guidance: `Ruangan lab terletak di ${detectedFloorLabel}, ${clean || 'lab komputer'} — silakan ikuti petunjuk atau tanyakan petugas lab.`,
      facilities: ['PC / Workstation', 'Software Kebutuhan Praktikum', 'AC Ruangan'],
      badgeTone: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30',
      icon: 'desktop_windows',
      isOnline: false,
      isCustomMaster: false,
    }
  }

  // 3b. Auditorium / Aula Serbaguna
  if (isAuditorium) {
    return {
      raw: clean,
      building: 'Gedung Serbaguna / Auditorium',
      buildingCode: 'AULA',
      floor: detectedFloorLabel,
      floorNumber: detectedFloorNumber,
      roomNumber: clean || 'Auditorium',
      roomType: 'Auditorium / Aula Besar',
      guidance: `Auditorium terletak di ${detectedFloorLabel}, ${clean || 'aula serbaguna'} — ikuti penunjuk arah menuju area ini.`,
      facilities: ['Sound System', 'AC Ruangan', 'Panggung / Stage'],
      badgeTone: 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30',
      icon: 'theater_comedy',
      isOnline: false,
      isCustomMaster: false,
    }
  }

  // 3c. Ruang Kelas Perkuliahan (default)
  return {
    raw: clean,
    building: 'Gedung Perkuliahan Kampus',
    buildingCode: clean.slice(0, 4).toUpperCase(),
    floor: detectedFloorLabel,
    floorNumber: detectedFloorNumber,
    roomNumber: clean || 'Ruang Kelas',
    roomType: tipeKelas === 'HB' ? 'Kelas Hybrid' : 'Ruang Kelas Tatap Muka',
    guidance: `Ruangan ${clean || 'kelas'} terletak di ${detectedFloorLabel}, sesuai denah kampus atau tanyakan petugas akademik.`,
    facilities: ['Fasilitas Perkuliahan Standar'],
    badgeTone: 'bg-surface-container-high text-on-surface border-outline-variant/30',
    icon: 'meeting_room',
    isOnline: false,
    isCustomMaster: false,
  }
}
