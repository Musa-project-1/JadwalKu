/**
 * Peta tipe kelas & warna status — SATU-SATUNYA sumber kebenaran untuk
 * tampilan status (ClassCard, ClassTimelineItem, Badge, legend Settings).
 * Jangan hardcode warna status di komponen; tambahkan/diubah di sini saja.
 * (UIUX_MODERNIZATION.md Phase C2)
 */
export const CLASS_TYPES = {
  K1: { label: 'Kelas Offline', tone: 'offline' },
  K2: { label: 'Kelas Online', tone: 'online' },
  HB: { label: 'Hybrid', tone: 'hybrid' },
  HBH: { label: 'Hybrid', tone: 'hybrid' },
  HBD: { label: 'Hybrid', tone: 'hybrid' },
  GBK1: { label: 'Kelas Gabungan', tone: 'combined' },
  GBK2: { label: 'Kelas Gabungan', tone: 'combined' },
}

/** Teks berwarna per tone (light = shade gelap, dark = shade terang). */
export const TONE_TEXT_CLASSES = {
  offline: 'text-emerald-800 dark:text-emerald-300',
  online: 'text-blue-800 dark:text-blue-300',
  hybrid: 'text-violet-800 dark:text-violet-300',
  combined: 'text-amber-800 dark:text-amber-300',
  neutral: 'text-on-surface-variant',
}

/** Dot indikator kecil per tone. */
export const TONE_DOT_CLASSES = {
  offline: 'bg-status-offline',
  online: 'bg-status-online',
  hybrid: 'bg-status-hybrid',
  combined: 'bg-status-combined',
  neutral: 'bg-surface-variant',
}

/** Latar tonal per tone (untuk kartu / ikon lingkaran). */
export const TONE_BG_CLASSES = {
  offline: 'bg-status-offline/10 dark:bg-status-offline/15',
  online: 'bg-status-online/10 dark:bg-status-online/15',
  hybrid: 'bg-status-hybrid/10 dark:bg-status-hybrid/15',
  combined: 'bg-status-combined/10 dark:bg-status-combined/15',
  neutral: 'bg-surface-container',
}

/** Chip/badge tonal lengkap (bg + teks) — dipakai Badge.jsx. */
export const TONE_CLASSES = {
  offline: 'bg-status-offline/10 text-emerald-800 dark:bg-status-offline/15 dark:text-emerald-300',
  online: 'bg-status-online/10 text-blue-800 dark:bg-status-online/15 dark:text-blue-300',
  hybrid: 'bg-status-hybrid/10 text-violet-800 dark:bg-status-hybrid/15 dark:text-violet-300',
  combined: 'bg-status-combined/10 text-amber-800 dark:bg-status-combined/15 dark:text-amber-300',
  neutral: 'bg-surface-container text-on-surface-variant',
}

/** Ikon Material Symbols per tone (timeline). */
export const TONE_ICONS = {
  offline: 'school',
  online: 'laptop_mac',
  hybrid: 'co_present',
  combined: 'groups',
  neutral: 'help_outline',
}

/** Bilah warna 4px di tepi kiri kartu per tone (timeline & grid mingguan). */
export const TONE_BORDER_CLASSES = {
  offline: 'border-l-[4px] border-emerald-500',
  online: 'border-l-[4px] border-blue-500',
  hybrid: 'border-l-[4px] border-violet-500',
  combined: 'border-l-[4px] border-amber-500',
  neutral: 'border-l-[4px] border-outline-variant',
}

export function getClassType(code) {
  return CLASS_TYPES[code] ?? { label: code || 'Tidak diketahui', tone: 'neutral' }
}
