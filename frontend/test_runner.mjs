import assert from 'node:assert/strict'
import { parseRoomLocation } from './src/lib/locationUtils.js'
import {
  buildClassReminders,
  buildTaskDeadlineReminders,
  buildExamReminders,
  mergeNotifications,
  groupByDay,
} from './src/lib/notificationEngine.js'
import {
  minutesUntil,
  detectClassTransitions,
  formatRuang,
  sortByTime,
} from './src/lib/scheduleUtils.js'
import {
  deriveTahunAjaran,
  deriveTerm,
  expectedTahunAjaranForSemester,
  getTermLabel,
} from './src/lib/tahunAjaran.js'
import { parseLecturers, getLecturerInitials, formatWhatsAppUrl } from './src/lib/lecturerUtils.js'
import { validateScheduleEntry, findConflicts } from './src/lib/uploadValidator.js'

console.log('🧪 ========================================================')
console.log('🧪 MENJALANKAN AUTOMATED TEST SUITE KESELURUHAN JADWALKU')
console.log('🧪 ========================================================\n')

let passedTests = 0
let failedTests = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  ✅ [PASS] ${name}`)
    passedTests++
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`)
    console.error(`     Error: ${err.message}\n`)
    failedTests++
  }
}

// ── TEST GROUP 1: locationUtils.js ──
console.log('📍 [1/6] Menguji Modul Lokasi & Panduan Lantai (locationUtils)...')

test('Mendeteksi ruangan kelas teori standar (R. 204)', () => {
  const loc = parseRoomLocation('R. 204', 'K1')
  assert.equal(loc.floorNumber, 2, 'Lantai harus 2')
  assert.equal(loc.isOnline, false)
  assert.ok(loc.guidance.includes('Lantai 2'))
  assert.ok(loc.facilities.length > 0)
})

test('Mendeteksi ruangan laboratorium komputer (Lab Komputer 3)', () => {
  const loc = parseRoomLocation('Lab Komputer 3', 'K1')
  assert.equal(loc.buildingCode, 'LAB')
  assert.equal(loc.roomType, 'Laboratorium Praktikum & Komputer')
  assert.ok(loc.facilities.includes('PC / Workstation'))
})

test('Mendeteksi sesi perkuliahan online / daring (Zoom)', () => {
  const loc = parseRoomLocation('Online (Zoom)', 'K2')
  assert.equal(loc.isOnline, true)
  assert.equal(loc.buildingCode, 'ONLINE')
  assert.ok(loc.guidance.includes('Zoom'))
})

test('Mendeteksi Auditorium / Aula Serbaguna', () => {
  const loc = parseRoomLocation('Auditorium Kampus', 'K1')
  assert.equal(loc.buildingCode, 'AULA')
  assert.equal(loc.floorNumber, 1)
})

// ── TEST GROUP 2: notificationEngine.js ──
console.log('\n🔔 [2/6] Menguji Modul Pengingat & Notifikasi (notificationEngine)...')

test('Membangun pengingat kelas dengan ambang waktu dinamis', () => {
  const fakeNow = new Date('2026-08-27T08:15:00')
  const entries = [
    { id: '1', jamMulai: '08:30', kodeMK: 'IF101', ruang: 'R. 201' },
    { id: '2', jamMulai: '11:00', kodeMK: 'IF102', ruang: 'R. 202' },
  ]
  const courseMap = new Map([['IF101', { namaMK: 'Algoritma Pemrograman' }]])
  const reminders = buildClassReminders(entries, courseMap, fakeNow, 20)

  assert.equal(reminders.length, 1)
  assert.equal(reminders[0].title, 'Algoritma Pemrograman')
  assert.ok(reminders[0].description.includes('15 menit'))
})

test('Membangun pengingat deadline tugas (H-1 & Hari-H)', () => {
  const fakeNow = new Date('2026-08-27T10:00:00')
  const tasks = [
    { id: 't1', judul: 'Tugas Makalah', deadline: '2026-08-27', selesai: false },
    { id: 't2', judul: 'Tugas Coding', deadline: '2026-08-28', selesai: false },
    { id: 't3', judul: 'Tugas Lama', deadline: '2026-08-20', selesai: false },
    { id: 't4', judul: 'Tugas Selesai', deadline: '2026-08-27', selesai: true },
  ]
  const reminders = buildTaskDeadlineReminders(tasks, fakeNow)
  assert.equal(reminders.length, 2)
  assert.equal(reminders[0].title, 'Tugas Makalah')
  assert.equal(reminders[1].title, 'Tugas Coding')
})

test('Membangun pengingat jadwal ujian semester (buildExamReminders)', () => {
  const fakeNow = new Date('2026-08-27T10:00:00')
  const exams = [
    { id: 'ex-1', jenis: 'UTS', kodeMK: 'IF101', tanggal: '2026-08-28', jam: '08:00', ruang: 'R. 201' },
    { id: 'ex-2', jenis: 'UTS', kodeMK: 'IF102', tanggal: '2026-09-15', jam: '10:00', ruang: 'R. 202' },
  ]
  const reminders = buildExamReminders(exams, fakeNow, 3)
  assert.equal(reminders.length, 1)
  assert.equal(reminders[0].id, 'ujian-ex-1')
})

test('Pengelompokan notifikasi harian (groupByDay)', () => {
  const fakeNow = new Date('2026-08-27T10:00:00')
  const todayMs = new Date('2026-08-27T08:00:00').getTime()
  const yesterdayMs = new Date('2026-08-26T08:00:00').getTime()
  const earlierMs = new Date('2026-08-20T08:00:00').getTime()

  const notifs = [
    { id: 'n1', createdAt: todayMs },
    { id: 'n2', createdAt: yesterdayMs },
    { id: 'n3', createdAt: earlierMs },
  ]
  const groups = groupByDay(notifs, fakeNow)
  assert.equal(groups.today.length, 1)
  assert.equal(groups.yesterday.length, 1)
  assert.equal(groups.earlier.length, 1)
})

test('Penggabungan & deduplikasi notifikasi (mergeNotifications)', () => {
  const existing = [{ id: 'notif-1', title: 'Notif Lama', read: true, createdAt: 1000 }]
  const incoming = [
    { id: 'notif-1', title: 'Notif Update', read: false, createdAt: 2000 },
    { id: 'notif-2', title: 'Notif Baru', read: false, createdAt: 3000 },
  ]
  const merged = mergeNotifications(existing, incoming)
  assert.equal(merged.length, 2)
  const item1 = merged.find((m) => m.id === 'notif-1')
  assert.equal(item1.read, true)
  assert.equal(item1.title, 'Notif Update')
})

// ── TEST GROUP 3: scheduleUtils.js ──
console.log('\n⏱️ [3/6] Menguji Modul Utilitas Jadwal (scheduleUtils)...')

test('Menghitung selisih menit (minutesUntil)', () => {
  const fakeNow = new Date('2026-08-27T08:00:00')
  assert.equal(minutesUntil('08:30', fakeNow), 30)
  assert.equal(minutesUntil('07:45', fakeNow), -15)
  assert.equal(minutesUntil('08:00', fakeNow), 0)
})

test('Pengurutan jadwal berdasarkan jam mulai (sortByTime)', () => {
  const items = [
    { id: 's2', jamMulai: '13:00' },
    { id: 's1', jamMulai: '08:00' },
    { id: 's3', jamMulai: '15:30' },
  ]
  const sorted = sortByTime(items)
  assert.equal(sorted[0].id, 's1')
  assert.equal(sorted[1].id, 's2')
  assert.equal(sorted[2].id, 's3')
})

test('Deteksi transisi kelas berurutan ketat (detectClassTransitions)', () => {
  const todayClasses = [
    { id: 'c1', jamMulai: '08:00', jamSelesai: '09:40', ruang: 'Gedung A 101', tipeKelas: 'K1' },
    { id: 'c2', jamMulai: '09:45', jamSelesai: '11:25', ruang: 'Gedung B 302', tipeKelas: 'K1' },
    { id: 'c3', jamMulai: '13:00', jamSelesai: '14:40', ruang: 'Gedung B 302', tipeKelas: 'K1' },
  ]
  const transitions = detectClassTransitions(todayClasses)
  assert.ok(transitions.has('c2'))
  const trans2 = transitions.get('c2')
  assert.equal(trans2.gapMinutes, 5)
  assert.equal(trans2.fromRoom, 'Gedung A 101')
  assert.equal(trans2.toRoom, 'Gedung B 302')
  assert.equal(transitions.has('c3'), false)
})

test('Format nama ruangan (formatRuang)', () => {
  assert.equal(formatRuang('201', 'K1'), '201')
  assert.equal(formatRuang('', 'K2'), 'Online / Zoom')
})

// ── TEST GROUP 4: tahunAjaran.js ──
console.log('\n📅 [4/6] Menguji Modul Tahun Ajaran & Kalender (tahunAjaran)...')

test('Menentukan Tahun Ajaran berjalan secara otomatis', () => {
  const dateGanjil = new Date('2026-10-01')
  assert.equal(deriveTahunAjaran(dateGanjil), '2026/2027')
  assert.equal(deriveTerm(dateGanjil), 'ganjil')
  assert.equal(getTermLabel('ganjil'), 'Ganjil')

  const dateGenap = new Date('2027-04-15')
  assert.equal(deriveTahunAjaran(dateGenap), '2026/2027')
  assert.equal(deriveTerm(dateGenap), 'genap')
})

test('Menghitung perkiraan Tahun Ajaran per Semester Mahasiswa', () => {
  const dateGanjil = new Date('2026-10-01')
  const taSem1 = expectedTahunAjaranForSemester(1, dateGanjil)
  assert.equal(taSem1, '2026/2027')
})

// ── TEST GROUP 5: lecturerUtils.js ──
console.log('\n👨‍🏫 [5/6] Menguji Modul Direktori Dosen (lecturerUtils)...')

test('Ekstraksi inisial dosen dari gelar akademik', () => {
  assert.equal(getLecturerInitials('Dr. Ahmad Fauzi, M.Kom.'), 'AF')
  assert.equal(getLecturerInitials('Prof. Siti Nurhaliza, Ph.D.'), 'SN')
  assert.equal(getLecturerInitials('Budi Santoso'), 'BS')
  assert.equal(getLecturerInitials(''), 'DS')
})

test('Parsing multi-dosen pengampu dan gelar (parseLecturers)', () => {
  const parsed = parseLecturers('1. Dr. Achmad, M.Kom. 2. Ir. Fadhilah, MT')
  assert.equal(parsed.length, 2)
  assert.equal(parsed[0], 'Dr. Achmad, M.Kom.')
})

test('Format tautan nomor WhatsApp dosen (formatWhatsAppUrl)', () => {
  assert.equal(formatWhatsAppUrl('08123456789'), 'https://wa.me/628123456789')
  assert.equal(formatWhatsAppUrl('628123456789'), 'https://wa.me/628123456789')
})

// ── TEST GROUP 6: uploadValidator.js ──
console.log('\n📊 [6/6] Menguji Modul Validasi Impor Jadwal (uploadValidator)...')

test('Validasi baris jadwal impor Excel/Word/PDF', () => {
  const validEntry = {
    hari: 'Senin',
    jamMulai: '08:00',
    jamSelesai: '09:40',
    kodeMK: 'IF101',
    prodi: 'Teknik Informatika',
    semester: 2,
    ruang: 'R. 201',
    tipeKelas: 'K1',
  }
  const errorsValid = validateScheduleEntry(validEntry)
  assert.equal(errorsValid.length, 0)

  const invalidEntry = {
    hari: 'Minggu',
    jamMulai: '25:00',
    jamSelesai: '09:40',
    kodeMK: '',
    prodi: '',
    semester: 20,
    ruang: '',
    tipeKelas: 'INVALID',
  }
  const errorsInvalid = validateScheduleEntry(invalidEntry)
  assert.ok(errorsInvalid.length >= 4)
})

test('Mengakui Kelas Gabungan & Hybrid Lintas Prodi (HBH/GBK) tanpa bentrok palsu', () => {
  const jointEntries = [
    {
      id: 'j1',
      hari: 'Senin',
      jamMulai: '08:00',
      jamSelesai: '09:40',
      kodeMK: 'MKWK202',
      prodi: 'Arsitektur',
      semester: 2,
      ruang: 'Gedung Halimah',
      tipeKelas: 'HBH',
    },
    {
      id: 'j2',
      hari: 'Senin',
      jamMulai: '08:00',
      jamSelesai: '09:40',
      kodeMK: 'MKWK202',
      prodi: 'Informatika',
      semester: 2,
      ruang: 'Gedung Halimah',
      tipeKelas: 'HBH',
    },
    {
      id: 'j3',
      hari: 'Senin',
      jamMulai: '08:00',
      jamSelesai: '09:40',
      kodeMK: 'MKWK202',
      prodi: 'Teknik Sipil',
      semester: 2,
      ruang: 'Gedung Halimah',
      tipeKelas: 'HBH',
    },
  ]
  const courseSource = [
    { kodeMK: 'MKWK202', namaMK: 'Kewarganegaraan', dosen: 'BINGAR HERNOWO, SKM., MM.' },
  ]
  const conflicts = findConflicts(jointEntries, courseSource)
  // Sesi bersama lintas prodi tidak boleh dianggap bentrok
  assert.equal(conflicts.length, 0)
})

test('Mendeteksi bentrok ruangan nyata antar 2 mata kuliah berbeda', () => {
  const realClashEntries = [
    {
      id: 'c1',
      hari: 'Senin',
      jamMulai: '08:00',
      jamSelesai: '09:40',
      kodeMK: 'IF101',
      prodi: 'Informatika',
      semester: 2,
      ruang: 'R. 204',
      tipeKelas: 'K1',
    },
    {
      id: 'c2',
      hari: 'Senin',
      jamMulai: '08:30',
      jamSelesai: '10:00',
      kodeMK: 'TS201',
      prodi: 'Teknik Sipil',
      semester: 4,
      ruang: 'R. 204',
      tipeKelas: 'K1',
    },
  ]
  const conflicts = findConflicts(realClashEntries)
  assert.equal(conflicts.length, 1)
  assert.equal(conflicts[0].type, 'room')
})

test('Mengakui Ruang Kelas Prodi sebagai ruangan terpisah per prodi (Bukan bentrok)', () => {
  const prodiRoomEntries = [
    {
      id: 'pr-1',
      hari: 'Senin',
      jamMulai: '09:50',
      jamSelesai: '12:20',
      kodeMK: 'ARS204',
      prodi: 'Arsitektur',
      semester: 2,
      ruang: 'Ruang Kelas Prodi',
      tipeKelas: 'K1',
    },
    {
      id: 'pr-2',
      hari: 'Senin',
      jamMulai: '10:00',
      jamSelesai: '11:40',
      kodeMK: 'INF204',
      prodi: 'Informatika',
      semester: 2,
      ruang: 'Ruang Kelas Prodi',
      tipeKelas: 'K1',
    },
    {
      id: 'pr-3',
      hari: 'Senin',
      jamMulai: '10:00',
      jamSelesai: '11:40',
      kodeMK: 'TSP206',
      prodi: 'Teknik Sipil',
      semester: 2,
      ruang: 'Ruang Kelas Prodi',
      tipeKelas: 'K1',
    },
  ]
  const conflicts = findConflicts(prodiRoomEntries)
  // Setiap prodi punya ruang kelas prodi masing-masing, tidak bentrok
  assert.equal(conflicts.length, 0)
})

test('Mengakui Kelas Gabungan (GBK) dengan beda kode MK (MKN201 vs MKN203) sebagai sesi bersama', () => {
  const gbkEntries = [
    {
      id: 'g1',
      hari: 'Selasa',
      jamMulai: '10:00',
      jamSelesai: '11:40',
      kodeMK: 'MKN201',
      prodi: 'Kewirausahaan',
      semester: 2,
      ruang: 'Ruang Kelas Gabungan',
      tipeKelas: 'GBK1',
    },
    {
      id: 'g2',
      hari: 'Selasa',
      jamMulai: '10:00',
      jamSelesai: '11:40',
      kodeMK: 'MKN203',
      prodi: 'Teknik Sipil',
      semester: 2,
      ruang: 'Ruang Kelas Gabungan',
      tipeKelas: 'GBK1',
    },
    {
      id: 'g3',
      hari: 'Selasa',
      jamMulai: '10:00',
      jamSelesai: '11:40',
      kodeMK: 'MKN201',
      prodi: 'Informatika',
      semester: 2,
      ruang: 'Ruang Kelas Gabungan',
      tipeKelas: 'GBK1',
    },
  ]
  const courseSource = [
    { kodeMK: 'MKN201', namaMK: 'Aqidah Islam', dosen: "RIF'AN WACHID SUMARDI, S.PD.I., M.PD." },
    { kodeMK: 'MKN203', namaMK: 'Aqidah Islam', dosen: "RIF'AN WACHID SUMARDI, S.PD.I., M.PD." },
  ]
  const conflicts = findConflicts(gbkEntries, courseSource)
  assert.equal(conflicts.length, 0)
})

test('Mengakui ruang virtual (Online / Zoom) tanpa bentrok fisik', () => {
  const virtualEntries = [
    {
      id: 'v1',
      hari: 'Selasa',
      jamMulai: '19:00',
      jamSelesai: '20:40',
      kodeMK: 'TSP408',
      prodi: 'Teknik Sipil',
      semester: 4,
      ruang: 'Online / Zoom',
      tipeKelas: 'K2',
    },
    {
      id: 'v2',
      hari: 'Selasa',
      jamMulai: '19:00',
      jamSelesai: '21:30',
      kodeMK: 'INF403',
      prodi: 'Informatika',
      semester: 4,
      ruang: 'Online / Zoom',
      tipeKelas: 'K2',
    },
  ]
  const courseSource = [
    { kodeMK: 'TSP408', namaMK: 'Analisis Variabel', dosen: 'ANGGIE YUDISTIRA ADITYA, S.PD., M.PD.' },
    { kodeMK: 'INF403', namaMK: 'Mikrokontroler', dosen: 'DWI SUSANTO, S.KOM., M.KOM.' },
  ]
  const conflicts = findConflicts(virtualEntries, courseSource)
  assert.equal(conflicts.length, 0)
})

// ── RINGKASAN HASIL ──
console.log('\n========================================================')
console.log(`🏁 HASIL TEST: ${passedTests} LULUS, ${failedTests} GAGAL`)
console.log('========================================================\n')

if (failedTests > 0) {
  process.exit(1)
} else {
  console.log('✨ SEMUA TES OTOMATIS BERHASIL DENGAN NILAI SEMPURNA 100%! ✨\n')
}

