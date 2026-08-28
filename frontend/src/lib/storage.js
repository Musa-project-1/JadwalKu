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
  fontSize: 'fontSize',
  highContrast: 'highContrast',
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
  kampusId: 'kampusId',
  customScheduleIds: 'customScheduleIds',
  attendance: 'attendance',
  courseLinks: 'courseLinks',
  krsPlans: 'krsPlans',
}
