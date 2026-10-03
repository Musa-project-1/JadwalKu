/**
 * Peta tipe kelas & warna status – SATU-SATUNYA sumber kebenaran untuk
 * tampilan status (ClassCard, ClassTimelineItem, Badge, legend Settings).
 * Jangan hardcode warna status di komponen; tambahkan/diubah di sini saja.
 * (UIUX_MODERNIZATION.md Phase C2)
 */
export const CLASS_TYPES = {
  K1: { label: 'Kelas Reguler / Offline', shortLabel: 'Offline', tone: 'offline' },
  K2: { label: 'Kelas Karyawan / Online', shortLabel: 'Online', tone: 'online' },
  HB: { label: 'Hybrid', shortLabel: 'Hybrid', tone: 'hybrid' },
  HBH: { label: 'Hybrid Halimah', shortLabel: 'Hybrid Halimah', tone: 'hybrid' },
  HBD: { label: 'Hybrid Dekanat', shortLabel: 'Hybrid Dekanat', tone: 'hybrid' },
  GBK: { label: 'Kelas Gabungan', shortLabel: 'GBK', tone: 'combined' },
  GBK1: { label: 'Gabungan Offline', shortLabel: 'GBK Offline', tone: 'combined' },
  GBK2: { label: 'Gabungan Online', shortLabel: 'GBK Online', tone: 'combined' },
}

/** Teks judul berwarna per tone (WCAG AAA: light = deep shade, dark = luminous tint). */
export const TONE_TEXT_CLASSES = {
  offline: 'text-emerald-950 dark:text-emerald-200',
  online: 'text-blue-950 dark:text-blue-200',
  hybrid: 'text-violet-950 dark:text-violet-200',
  combined: 'text-amber-950 dark:text-amber-100',
  neutral: 'text-on-surface',
}

/** Teks sekunder/detail per tone (jam, ruang, info). */
export const TONE_SUBTEXT_CLASSES = {
  offline: 'text-emerald-800 dark:text-emerald-300',
  online: 'text-blue-800 dark:text-blue-300',
  hybrid: 'text-violet-800 dark:text-violet-300',
  combined: 'text-amber-900 dark:text-amber-200',
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

/** Latar tonal per tone (untuk kartu / ikon lingkaran) – Clean Modern: netral dengan aksen tipis. */
export const TONE_BG_CLASSES = {
  offline: 'bg-surface-container-lowest dark:bg-surface-container-low',
  online: 'bg-surface-container-lowest dark:bg-surface-container-low',
  hybrid: 'bg-surface-container-lowest dark:bg-surface-container-low',
  combined: 'bg-surface-container-lowest dark:bg-surface-container-low',
  neutral: 'bg-surface-container',
}

/** Chip/badge tonal lengkap (bg + teks) – dipakai Badge.jsx. */
export const TONE_CLASSES = {
  offline: 'bg-status-offline/10 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300/80 border-status-offline/20 dark:border-emerald-500/15',
  online: 'bg-status-online/10 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300/80 border-status-online/20 dark:border-blue-500/15',
  hybrid: 'bg-status-hybrid/10 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300/80 border-status-hybrid/20 dark:border-violet-500/15',
  combined: 'bg-status-combined/10 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300/80 border-status-combined/20 dark:border-amber-500/15',
  neutral: 'bg-surface-container text-on-surface-variant border-outline-variant/20',
}

/** Ikon Material Symbols per tone. */
export const TONE_ICONS = {
  offline: 'corporate_fare',
  online: 'videocam',
  hybrid: 'sync_alt',
  combined: 'groups',
  neutral: 'help_outline',
}

/** Latar chip ikon gelap/akcent per tone dengan teks terang. */
export const TONE_CHIP_BG_CLASSES = {
  offline: 'bg-emerald-700 text-emerald-50 dark:bg-emerald-500 dark:text-emerald-950',
  online: 'bg-blue-700 text-blue-50 dark:bg-blue-500 dark:text-blue-950',
  hybrid: 'bg-violet-700 text-violet-50 dark:bg-violet-500 dark:text-violet-950',
  combined: 'bg-amber-700 text-amber-50 dark:bg-amber-500 dark:text-amber-950',
  neutral: 'bg-slate-700 text-slate-50 dark:bg-slate-500 dark:text-slate-950',
}

/** Tinted shadow per tone untuk elevasi halus pada grid & kartu – Clean Modern: shadow netral seragam. */
export const TONE_SHADOW_CLASSES = {
  offline: 'shadow-xs hover:shadow-level-1',
  online: 'shadow-xs hover:shadow-level-1',
  hybrid: 'shadow-xs hover:shadow-level-1',
  combined: 'shadow-xs hover:shadow-level-1',
  neutral: 'shadow-xs hover:shadow-level-1',
}

/** Divider halus 1px per tone. */
export const TONE_DIVIDER_CLASSES = {
  offline: 'border-emerald-900/10 dark:border-emerald-300/15',
  online: 'border-blue-900/10 dark:border-blue-300/15',
  hybrid: 'border-violet-900/10 dark:border-violet-300/15',
  combined: 'border-amber-900/10 dark:border-amber-300/15',
  neutral: 'border-outline-variant/20',
}

/** Bilah warna 4px di tepi kiri kartu per tone (timeline & grid mingguan). */
export const TONE_BORDER_CLASSES = {
  offline: 'border-l-[4px] border-emerald-500',
  online: 'border-l-[4px] border-blue-500',
  hybrid: 'border-l-[4px] border-violet-500',
  combined: 'border-l-[4px] border-amber-500',
  neutral: 'border-l-[4px] border-outline-variant',
}

/** Border keliling 2px per tone untuk kartu jadwal – Clean Modern: border netral tipis + aksen kiri. */
export const TONE_CARD_BORDER_CLASSES = {
  offline: 'border border-outline-variant/30 border-l-[3px] border-l-emerald-500',
  online: 'border border-outline-variant/30 border-l-[3px] border-l-blue-500',
  hybrid: 'border border-outline-variant/30 border-l-[3px] border-l-violet-500',
  combined: 'border border-outline-variant/30 border-l-[3px] border-l-amber-500',
  neutral: 'border border-outline-variant/30',
}

/** Background solid badge pill jam per tone – Clean Modern: outline subtle, bukan solid pekat. */
export const TONE_TIME_PILL_CLASSES = {
  offline: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold',
  online: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-bold',
  hybrid: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30 font-bold',
  combined: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold',
  neutral: 'bg-surface-container text-on-surface-variant border border-outline-variant/40 font-bold',
}

/** Warna ikon tipe kelas. */
export const TONE_ICON_COLOR_CLASSES = {
  offline: 'text-emerald-600 dark:text-emerald-400',
  online: 'text-blue-600 dark:text-blue-400',
  hybrid: 'text-violet-600 dark:text-violet-400',
  combined: 'text-amber-600 dark:text-amber-400',
  neutral: 'text-on-surface-variant',
}

export function getClassType(code) {
  return CLASS_TYPES[code] ?? { label: code || 'Tidak diketahui', shortLabel: code || 'Kelas', tone: 'neutral' }
}

export const VALID_CLASS_TYPES = ['K1', 'K2', 'HB', 'HBH', 'HBD', 'GBK1', 'GBK2']
export const CLASS_TYPE_CODES = VALID_CLASS_TYPES

export function classTypeLabel(code) {
  return CLASS_TYPES[code]?.label ?? code ?? 'Reguler'
}
