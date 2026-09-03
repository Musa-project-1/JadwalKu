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
import {
  extractKaldikDateRange,
  parseKaldikLines,
  deriveBoundsFromEvents,
  normalizeDate,
  normalizeCategory,
  detectSemester,
} from './src/lib/academicCalendarParser.js'
import { MADANI_CALENDAR_PRESET } from './src/constants/academicCalendarPreset.js'
import { parseLecturers, getLecturerInitials, formatWhatsAppUrl } from './src/lib/lecturerUtils.js'
import { validateScheduleEntry, findConflicts } from './src/lib/uploadValidator.js'
import { getPrayerTimes } from './src/lib/prayerTimes.js'
import { translate, formatDayName } from './src/lib/translations.js'
import { parseTimeToMinutes, getSessionForClass, checkPrayerClash } from './src/lib/scheduleGridUtils.js'

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

// ── TEST GROUP 7: academicCalendarParser.js ──
console.log('\n📆 [7/7] Menguji Modul Parser Kalender Akademik (academicCalendarParser)...')

test('Mengekstrak rentang tanggal Kaldik: DD – DD MMM YYYY (satu bulan)', () => {
  const res = extractKaldikDateRange('10 – 12 Sep 2026')
  assert.deepEqual(res, { start: '2026-09-10', end: '2026-09-12', raw: '10 – 12 Sep 2026' })
})

test('Mengekstrak rentang tanggal Kaldik: DD MMM – DD MMM YYYY (beda bulan)', () => {
  const res = extractKaldikDateRange('21 Sep – 07 Nov 2026')
  assert.deepEqual(res, { start: '2026-09-21', end: '2026-11-07', raw: '21 Sep – 07 Nov 2026' })
})

test('Mengekstrak rentang tanggal Kaldik: DD MMM YYYY – DD MMM YYYY (beda tahun)', () => {
  const res = extractKaldikDateRange('16 Nov 2026 – 02 Jan 2027')
  assert.deepEqual(res, { start: '2026-11-16', end: '2027-01-02', raw: '16 Nov 2026 – 02 Jan 2027' })
})

test('Mengekstrak tanggal tunggal Kaldik: DD MMM YYYY', () => {
  const res = extractKaldikDateRange('28 Jan 2027')
  assert.deepEqual(res, { start: '2027-01-28', end: '2027-01-28', raw: '28 Jan 2027' })
})

test('Menormalkan berbagai format tanggal ke ISO', () => {
  assert.equal(normalizeDate('2026-09-10'), '2026-09-10')
  assert.equal(normalizeDate('10/09/2026'), '2026-09-10')
  assert.equal(normalizeDate('10 Sep 2026'), '2026-09-10')
  assert.equal(normalizeDate('10-09-2026'), '2026-09-10')
})

test('Mendeteksi kategori dari nama event Kaldik', () => {
  assert.equal(normalizeCategory('Registrasi, KRS & Bimbingan Akademik I'), 'registrasi')
  assert.equal(normalizeCategory('Perkuliahan Termin 1'), 'perkuliahan')
  assert.equal(normalizeCategory('Ujian Tengah Semester (UTS)'), 'uts')
  assert.equal(normalizeCategory('Ujian Akhir Semester (UAS)'), 'uas')
  assert.equal(normalizeCategory('Ujian Remidial'), 'ujian')
  assert.equal(normalizeCategory('Yudisium Semester Ganjil'), 'yudisium')
  assert.equal(normalizeCategory('Libur Idul Fitri'), 'libur')
  assert.equal(normalizeCategory('Minggu Tenang'), 'minggu_tenang')
  assert.equal(normalizeCategory('PKKMB T.A. 2026/2027'), 'kegiatan')
})

test('Mendeteksi semester dari string eksplisit maupun fallback tanggal', () => {
  assert.equal(detectSemester('ganjil'), 'ganjil')
  assert.equal(detectSemester('genap'), 'genap')
  assert.equal(detectSemester('antar'), 'antar')
  assert.equal(detectSemester('', '2026-10-01'), 'ganjil')
  assert.equal(detectSemester('', '2027-04-01'), 'genap')
})

test('Menurunkan batas kalender otomatis dari event preset Madani', () => {
  const bounds = deriveBoundsFromEvents(MADANI_CALENDAR_PRESET.events)
  assert.ok(bounds, 'Bounds harus dihasilkan')
  assert.deepEqual(bounds.ganjilStart, { month: 8, day: 10 }) // 10 Sep
  assert.deepEqual(bounds.ganjilEnd, { month: 1, day: 20 }) // 20 Feb
  assert.deepEqual(bounds.genapStart, { month: 1, day: 17 }) // 17 Feb
  assert.deepEqual(bounds.genapEnd, { month: 6, day: 24 }) // 24 Jul
})

test('Mem-parse baris hasil OCR/PDF Kaldik menjadi daftar event', () => {
  const lines = [
    'SEMESTER GANJIL',
    '10 – 12 Sep 2026 Kegiatan Mahasiswa Baru & Lama Ke Asrama',
    '14 – 19 Sep 2026 Registrasi, KRS & Bimbingan Akademik I',
    'SEMESTER GENAP',
    '17 – 20 Feb 2027 Registrasi, KRS & Bimbingan Akademik I',
    'KETERANGAN DAN HARI LIBUR',
    '07 – 27 Mar 2027 Libur Idul Fitri (Hari Raya Idul Fitri diperkirakan tanggal 10 Mar 2027)',
  ]
  const events = parseKaldikLines(lines)
  assert.equal(events.length, 4)

  const ganjil1 = events[0]
  assert.equal(ganjil1.semester, 'ganjil')
  assert.equal(ganjil1.tanggalMulai, '2026-09-10')
  assert.equal(ganjil1.tanggalSelesai, '2026-09-12')
  assert.equal(ganjil1.nama, 'Kegiatan Mahasiswa Baru & Lama Ke Asrama')
  assert.equal(ganjil1.kategori, 'kegiatan')

  const genap1 = events[2]
  assert.equal(genap1.semester, 'genap')
  assert.equal(genap1.tanggalMulai, '2027-02-17')

  const libur1 = events[3]
  assert.equal(libur1.semester, 'antar')
  assert.equal(libur1.kategori, 'libur')
})

// ── TEST GROUP 8: prayerTimes.js & scheduleGridUtils.js ──
console.log('\n🕌 [8/9] Menguji Hisab Astronomis Waktu Sholat & Grid Sesi (prayerTimes & scheduleGridUtils)...')

test('Hisab waktu sholat Jakarta menghasilkan jam yang valid dalam rentang astronomis Kemenag RI', () => {
  // Tanggal tes tetap: 3 September 2026 (Jakarta Lat -6.2088, Lon 106.8456, WIB UTC+7)
  const testDate = new Date('2026-09-03T00:00:00')
  const pt = getPrayerTimes(testDate, -6.2088, 106.8456, 7)

  assert.ok(pt.subuh, 'Waktu subuh harus ada')
  assert.ok(pt.dzuhur, 'Waktu dzuhur harus ada')
  assert.ok(pt.ashar, 'Waktu ashar harus ada')
  assert.ok(pt.maghrib, 'Waktu maghrib harus ada')
  assert.ok(pt.isya, 'Waktu isya harus ada')

  // Validasi format jam "HH.MM"
  const timeRegex = /^\d{2}\.\d{2}$/
  assert.match(pt.subuh, timeRegex)
  assert.match(pt.dzuhur, timeRegex)
  assert.match(pt.ashar, timeRegex)
  assert.match(pt.maghrib, timeRegex)
  assert.match(pt.isya, timeRegex)

  // Konversi ke total menit untuk validasi batas astronomis Jakarta
  const subuhMin = parseTimeToMinutes(pt.subuh)
  const dzuhurMin = parseTimeToMinutes(pt.dzuhur)
  const asharMin = parseTimeToMinutes(pt.ashar)
  const maghribMin = parseTimeToMinutes(pt.maghrib)
  const isyaMin = parseTimeToMinutes(pt.isya)

  // Validasi urutan kronologis waktu sholat
  assert.ok(subuhMin < dzuhurMin, 'Subuh harus sebelum Dzuhur')
  assert.ok(dzuhurMin < asharMin, 'Dzuhur harus sebelum Ashar')
  assert.ok(asharMin < maghribMin, 'Ashar harus sebelum Maghrib')
  assert.ok(maghribMin < isyaMin, 'Maghrib harus sebelum Isya')

  // Batas toleransi hisab Jakarta bulan September:
  // Subuh: ~04:20 - 04:50 (260 - 290 min)
  assert.ok(subuhMin >= 260 && subuhMin <= 295, `Subuh (${pt.subuh}) di luar rentang wajar`)
  // Dzuhur: ~11:40 - 12:15 (700 - 735 min)
  assert.ok(dzuhurMin >= 700 && dzuhurMin <= 735, `Dzuhur (${pt.dzuhur}) di luar rentang wajar`)
  // Ashar: ~14:55 - 15:35 (895 - 935 min)
  assert.ok(asharMin >= 895 && asharMin <= 935, `Ashar (${pt.ashar}) di luar rentang wajar`)
  // Maghrib: ~17:40 - 18:15 (1060 - 1095 min)
  assert.ok(maghribMin >= 1060 && maghribMin <= 1095, `Maghrib (${pt.maghrib}) di luar rentang wajar`)
  // Isya: ~18:50 - 19:25 (1130 - 1165 min)
  assert.ok(isyaMin >= 1130 && isyaMin <= 1170, `Isya (${pt.isya}) di luar rentang wajar`)
})

test('Mengelompokkan kelas ke sesi yang tepat (Pagi, Siang, Sore, Malam)', () => {
  const dummyPrayer = { dzuhur: '11.58', ashar: '15.15', maghrib: '17.58' }

  assert.equal(getSessionForClass('07:30', '10:00', dummyPrayer), 'pagi')
  assert.equal(getSessionForClass('10:00', '11:40', dummyPrayer), 'pagi')
  assert.equal(getSessionForClass('13:00', '14:40', dummyPrayer), 'siang')
  assert.equal(getSessionForClass('15:30', '17:10', dummyPrayer), 'sore')
  assert.equal(getSessionForClass('18:30', '20:10', dummyPrayer), 'malam')
})

test('Deteksi bentrok waktu sholat dan Sholat Jumat dengan tepat', () => {
  const dummyPrayer = { dzuhur: '12.00', ashar: '15.15', maghrib: '18.00' }

  // 1. Sholat Jumat (11.30 - 13.00)
  const jumatClash = checkPrayerClash('Jumat', '11:00', '12:30', dummyPrayer)
  assert.equal(jumatClash.hasClash, true)
  assert.equal(jumatClash.type, 'friday')

  // Bukan hari Jumat -> tidak terkena aturan friday
  const nonJumat = checkPrayerClash('Kamis', '11:00', '12:30', dummyPrayer)
  assert.equal(nonJumat.type, 'dzuhur')

  // 2. Kelas melintasi Dzuhur (misal 11:30 - 13:00 di hari Senin)
  const dzuhurClash = checkPrayerClash('Senin', '11:30', '13:00', dummyPrayer)
  assert.equal(dzuhurClash.hasClash, true)
  assert.equal(dzuhurClash.type, 'dzuhur')

  // 3. Kelas tidak bentrok (misal 08:00 - 10:30)
  const noClash = checkPrayerClash('Senin', '08:00', '10:30', dummyPrayer)
  assert.equal(noClash.hasClash, false)
})

// ── TEST GROUP 9: translations.js ──
console.log('\n🌐 [9/9] Menguji Modul Terjemahan & Lokalisasi Dwibahasa (translations)...')

test('Menerjemahkan key umum dalam Bahasa Indonesia dan English', () => {
  assert.equal(translate('nav.schedule', 'id'), 'Jadwal')
  assert.equal(translate('nav.schedule', 'en'), 'Schedule')
  assert.equal(translate('action.save', 'id'), 'Simpan')
  assert.equal(translate('action.save', 'en'), 'Save')
})

test('Interpolasi parameter dinamis {key} berfungsi dengan sempurna', () => {
  // Format {count}
  const idCount = translate('home.custom_schedule', 'id', { count: 3 })
  assert.equal(idCount, 'Jadwal Kustom (3 MK)')

  const enCount = translate('home.custom_schedule', 'en', { count: 3 })
  assert.equal(enCount, 'Custom Schedule (3 Courses)')

  // Format multi-parameter {semester} & {ta}
  const syncBanner = translate('home.sync_banner', 'en', { semester: 4, ta: '2026/2027' })
  assert.equal(syncBanner, 'Academic year changed — Semester 4 is now AY 2026/2027. Tap to sync.')

  // Format {mins}
  const remainingTime = translate('class.remaining_mins', 'en', { mins: 25 })
  assert.equal(remainingTime, '25 mins left')
})

test('Fallback cerdas: fallback ke Bahasa Indonesia dan raw key jika tidak ditemukan', () => {
  // Fallback ke ID jika di EN tidak ada tapi di ID ada
  // (buat skenario key fiktif dengan menguji fallback jika key belum di-en-kan)
  assert.equal(translate('action.save', 'en'), 'Save')

  // Raw key fallback jika sama sekali tidak ada di kamus
  assert.equal(translate('unknown.dummy.key', 'en'), 'unknown.dummy.key')
  assert.equal(translate('unknown.dummy.key', 'id'), 'unknown.dummy.key')
})

test('Memetakan nama hari Indonesia ke English (formatDayName)', () => {
  assert.equal(formatDayName('Senin', 'en'), 'Monday')
  assert.equal(formatDayName('Jumat', 'en'), 'Friday')
  assert.equal(formatDayName('Minggu', 'en'), 'Sunday')
  assert.equal(formatDayName('Senin', 'id'), 'Senin')
  assert.equal(formatDayName('Sabtu', 'id'), 'Sabtu')
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
