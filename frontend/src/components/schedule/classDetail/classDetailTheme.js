export function formatWhatsAppUrl(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  const formatted = digits.startsWith('0') ? '62' + digits.slice(1) : digits
  return `https://wa.me/${formatted}`
}

/** Validasi URL eksternal hanya untuk http/https (cegah javascript:/data: XSS). */
export function safeExternalUrl(url) {
  try {
    const u = new URL(String(url || ''))
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

/** Theme mapping dinamis per jenis warna tipe kelas (K1 Offline, K2 Online, HB Hybrid, GBK Gabungan) */
export const CLASS_TONE_THEMES = {
  offline: {
    headerGradient: 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800',
    typeBadge: 'bg-emerald-950/40 text-emerald-100 border border-emerald-300/30',
    accentText: 'text-emerald-700 dark:text-emerald-400',
    accentBg: 'bg-emerald-500/15',
    accentBorder: 'border-emerald-500/30',
    activeTabRing: 'text-emerald-700 dark:text-emerald-300',
    iconName: 'corporate_fare',
    dotColor: 'bg-emerald-500',
  },
  online: {
    headerGradient: 'bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-800',
    typeBadge: 'bg-blue-950/40 text-blue-100 border border-blue-300/30',
    accentText: 'text-blue-700 dark:text-blue-400',
    accentBg: 'bg-blue-500/15',
    accentBorder: 'border-blue-500/30',
    activeTabRing: 'text-blue-700 dark:text-blue-300',
    iconName: 'videocam',
    dotColor: 'bg-blue-500',
  },
  hybrid: {
    headerGradient: 'bg-gradient-to-r from-purple-900 via-violet-700 to-indigo-900',
    typeBadge: 'bg-purple-950/40 text-purple-100 border border-purple-300/30',
    accentText: 'text-purple-700 dark:text-purple-400',
    accentBg: 'bg-purple-500/15',
    accentBorder: 'border-purple-500/30',
    activeTabRing: 'text-purple-700 dark:text-purple-300',
    iconName: 'sync_alt',
    dotColor: 'bg-purple-500',
  },
  combined: {
    headerGradient: 'bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700',
    typeBadge: 'bg-amber-950/40 text-amber-100 border border-amber-300/30',
    accentText: 'text-amber-800 dark:text-amber-300',
    accentBg: 'bg-amber-500/15',
    accentBorder: 'border-amber-500/30',
    activeTabRing: 'text-amber-800 dark:text-amber-300',
    iconName: 'groups',
    dotColor: 'bg-amber-500',
  },
  neutral: {
    headerGradient: 'bg-gradient-to-r from-primary via-primary/95 to-primary-container',
    typeBadge: 'bg-black/25 text-white/95 border border-white/10',
    accentText: 'text-primary',
    accentBg: 'bg-primary/15',
    accentBorder: 'border-primary/30',
    activeTabRing: 'text-primary',
    iconName: 'school',
    dotColor: 'bg-primary',
  },
}
