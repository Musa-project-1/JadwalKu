const PREFIX = 'jadwal-kampus:'

export function getItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeItem(key) {
  try {
    localStorage.removeItem(PREFIX + key)
    return true
  } catch {
    return false
  }
}

export const STORAGE_KEYS = {
  theme: 'theme',
  language: 'language',
  fontSize: 'fontSize',
  highContrast: 'highContrast',
  kampusId: 'kampusId',
  fakultasId: 'fakultasId',
  fakultasNama: 'fakultasNama',
  program: 'program',
  semester: 'semester',
  adminSession: 'adminSession',
  onboardingDone: 'onboardingDone',
  tasks: 'tasks',
  dailyNotes: 'dailyNotes',
  courseNotes: 'courseNotes',
  courseReminders: 'courseReminders',
  recentSearches: 'recentSearches',
  reminderPrefs: 'reminderPrefs',
  notifications: 'notifications',
  tahunAjaran: 'tahunAjaran',
  scheduleMode: 'scheduleMode',
  customScheduleIds: 'customScheduleIds',
  attendance: 'attendance',
  courseLinks: 'courseLinks',
  krsPlans: 'krsPlans',
  showPrayerDividers: 'jadwal:showPrayerDividers',
}

/**
 * Cadangkan seluruh preferensi dan data personal mahasiswa (tugas, catatan, absensi, dll).
 */
export function exportStudentData() {
  const data = {}
  for (const key of Object.values(STORAGE_KEYS)) {
    if (key === 'adminSession') continue
    const val = getItem(key, null)
    if (val !== null) {
      data[key] = val
    }
  }
  return {
    app: 'jadwalku-student',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data,
  }
}

/**
 * Pulihkan data personal mahasiswa dari berkas/objek JSON cadangan secara defensif.
 */
export function importStudentData(jsonInput) {
  let parsed = jsonInput
  if (typeof jsonInput === 'string') {
    try {
      parsed = JSON.parse(jsonInput)
    } catch {
      return { ok: false, error: 'Format berkas JSON tidak valid.' }
    }
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Data cadangan tidak valid.' }
  }
  const payload = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed
  let restoredCount = 0

  for (const key of Object.values(STORAGE_KEYS)) {
    if (key === 'adminSession') continue
    if (Object.prototype.hasOwnProperty.call(payload, key) && payload[key] !== undefined) {
      setItem(key, payload[key])
      restoredCount++
    }
  }

  if (restoredCount === 0) {
    return { ok: false, error: 'Tidak ditemukan data JadwalKu yang dapat dipulihkan.' }
  }

  return { ok: true, restoredCount }
}

