/**
 * Utilitas Parser Lokasi Kampus, Gedung, Nomor Lantai, dan Panduan Arah (Wayfinding)
 */

export function parseRoomLocation(rawRuang = '', tipeKelas = 'K1') {
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
      roomNumber: 'Kelas Online',
      roomType: 'Kuliah Daring / Teleconference',
      guidance:
        'Sesi perkuliahan dilaksanakan via platform video conference (Zoom / Google Meet). Pastikan jaringan internet stabil dan bergabung 5–10 menit sebelum jam kuliah dimulai.',
      facilities: ['Aplikasi Zoom / Meet', 'Materi LMS / Slide', 'Interaksi Virtual'],
      badgeTone: 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30',
      icon: 'videocam',
      isOnline: true,
    }
  }

  // 2. Auditorium / Aula / Hall
  if (lower.includes('auditorium') || lower.includes('aula') || lower.includes('hall')) {
    return {
      raw: clean,
      building: 'Gedung Rektorat & Aula Serbaguna',
      buildingCode: 'AULA',
      floor: 'Lantai 1 (Lobi Utama)',
      floorNumber: 1,
      roomNumber: clean,
      roomType: 'Auditorium & Gedung Pertemuan',
      guidance:
        'Masuk melalui lobi utama Gedung Pusat/Rektorat. Aula besar terletak tepat di sayap tengah lantai 1 dengan kapasitas ratusan mahasiswa.',
      facilities: ['Sound System Profesional', 'Proyektor Layar Lebar', 'AC Sentral', 'Panggung Presentasi'],
      badgeTone: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30',
      icon: 'theater_comedy',
      isOnline: false,
    }
  }

  // 3. Laboratorium Komputer / Sains
  if (
    lower.includes('lab') ||
    lower.includes('laboratorium') ||
    lower.includes('komputer') ||
    lower.includes('bengkel')
  ) {
    // Detect floor if any number in room (e.g. Lab 2 -> Lt. 2 or Lab 301 -> Lt. 3)
    let floorNumber = 2
    let floorText = 'Lantai 2'
    const numMatch = clean.match(/\d+/)
    if (numMatch) {
      const num = parseInt(numMatch[0], 10)
      if (num >= 100) {
        floorNumber = Math.floor(num / 100)
        floorText = `Lantai ${floorNumber}`
      } else if (num >= 1 && num <= 6) {
        floorNumber = num
        floorText = `Lantai ${floorNumber}`
      }
    }

    return {
      raw: clean,
      building: 'Gedung Laboratorium Terpadu (Lab Center)',
      buildingCode: 'LAB',
      floor: `${floorText} (Sayap Lab)`,
      floorNumber,
      roomNumber: clean,
      roomType: 'Laboratorium Praktikum & Komputer',
      guidance: `Masuk melalui pintu barat Gedung Lab Terpadu. Naik tangga/lift menuju ${floorText}, koridor laboratorium berada di sisi utara. Harap gunakan kartu tanda mahasiswa (KTM) dan jaga ketertiban peralatan praktikum.`,
      facilities: ['PC / Workstation', 'AC Dingin', 'LAN & Eduroam WiFi', 'Proyektor & Whiteboard', 'CCTV'],
      badgeTone: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
      icon: 'desktop_windows',
      isOnline: false,
    }
  }

  // 4. Gedung Spesifik (misal: Gedung B, Gedung A, GKB, Gedung Halimah, dsb.)
  let building = 'Gedung Kuliah Bersama (GKB)'
  let buildingCode = 'GKB'
  if (lower.includes('gedung a') || lower.startsWith('a.') || lower.startsWith('a-')) {
    building = 'Gedung A (Fakultas Utama)'
    buildingCode = 'GDA'
  } else if (lower.includes('gedung b') || lower.startsWith('b.') || lower.startsWith('b-')) {
    building = 'Gedung B (Fakultas Sains & Teknologi)'
    buildingCode = 'GDB'
  } else if (lower.includes('gedung c') || lower.startsWith('c.') || lower.startsWith('c-')) {
    building = 'Gedung C (Fakultas Humaniora)'
    buildingCode = 'GDC'
  } else if (lower.includes('gedung d') || lower.startsWith('d.') || lower.startsWith('d-')) {
    building = 'Gedung D (Pascasarjana & Riset)'
    buildingCode = 'GDD'
  } else if (lower.includes('halimah')) {
    building = 'Gedung Siti Halimah'
    buildingCode = 'GSH'
  }

  // 5. Floor Extraction (misal: 201 -> Lt. 2, 304 -> Lt. 3, 102 -> Lt. 1, 401 -> Lt. 4)
  let floorNumber = 1
  let floorText = 'Lantai 1'

  const floorExplicitMatch = lower.match(/(?:lt|lantai)[.\s]*(\d+)/i)
  if (floorExplicitMatch) {
    floorNumber = parseInt(floorExplicitMatch[1], 10)
    floorText = `Lantai ${floorNumber}`
  } else {
    const numMatch = clean.match(/\d+/)
    if (numMatch) {
      const num = parseInt(numMatch[0], 10)
      if (num >= 100 && num <= 999) {
        floorNumber = Math.floor(num / 100)
        floorText = `Lantai ${floorNumber}`
      } else if (num >= 1000) {
        floorNumber = Math.floor(num / 1000)
        floorText = `Lantai ${floorNumber}`
      }
    }
  }

  const roomDisplay = clean || 'Ruang Kuliah Teori'

  return {
    raw: roomDisplay,
    building,
    buildingCode,
    floor: `${floorText}`,
    floorNumber,
    roomNumber: roomDisplay,
    roomType: 'Ruang Kelas Teori',
    guidance: `Tiba di ${building}, gunakan tangga utama atau lift di lobi depan menuju ${floorText}. Ruangan ${roomDisplay} terletak di sepanjang koridor kelas dengan nomor pintu terpasang di atas pintu masuk.`,
    facilities: ['AC Ruangan', 'Proyektor LCD', 'Stopkontak Tiap Meja', 'Papan Tulis Whiteboard', 'WiFi Kampus'],
    badgeTone: 'bg-primary/10 text-primary border-primary/20',
    icon: 'meeting_room',
    isOnline: false,
  }
}

