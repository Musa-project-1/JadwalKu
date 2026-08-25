/**
 * Konfigurasi navigasi bersama untuk sidebar & bottom nav.
 * Dipisah dari komponen agar file komponen hanya mengekspor komponen
 * (syarat react-refresh / only-export-components).
 */

export const STUDENT_NAV = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/jadwal', label: 'Jadwal', icon: 'calendar_month' },
  { to: '/tugas', label: 'Tugas', icon: 'checklist' },
  { to: '/ujian', label: 'Ujian', icon: 'edit_note' },
  { to: '/pengaturan', label: 'Pengaturan', icon: 'settings' },
]

/** Ekstra untuk sidebar desktop (bottom nav cukup 5 item). */
export const SIDEBAR_EXTRA = [
  { to: '/cari', label: 'Search', icon: 'search' },
  { to: '/admin/login', label: 'Panel Admin', icon: 'admin_panel_settings' },
]

export const ADMIN_NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/jadwal', label: 'Kelola Jadwal', icon: 'edit_calendar' },
  { to: '/admin/mata-kuliah', label: 'MK & Dosen', icon: 'folder_shared' },
  { to: '/admin/ujian', label: 'Jadwal Ujian', icon: 'event_note' },
  { to: '/admin/pengaturan-akademik', label: 'Master Akademik', icon: 'settings_suggest' },
]

