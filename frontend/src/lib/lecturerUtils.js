/**
 * Lecturer and Contact Utility Helpers for JadwalKu
 */

const DEGREE_PATTERNS = [
  /^s\.[a-z]+/i, /^m\.[a-z]+/i, /^ph\.?d/i, /^b\.?sc/i, /^m\.?sc/i,
  /^m\.?eng/i, /^b\.?eng/i, /^m\.?ba/i, /^dr\./i, /^prof\./i, /^ir\./i,
  /^drs\./i, /^dra\./i, /^s\.tr\.[a-z]+/i, /^m\.tr\.[a-z]+/i,
]

const COMMON_DEGREE_ACRONYMS = new Set([
  'ST', 'MT', 'SKOM', 'MKOM', 'SARS', 'MARS', 'SE', 'MM', 'SH', 'MH',
  'SSI', 'MSI', 'SPD', 'MPD', 'SKED', 'MKED', 'SSTAT', 'MSTAT', 'STRT',
  'STRKOM', 'MSC', 'BSC', 'PHD', 'MENG', 'BENG', 'MBA', 'MPROF', 'CPMA',
])

function isLikelyDegree(token) {
  const clean = token.trim().replace(/^[,.\-\s]+|[,.\-\s]+$/g, '')
  if (!clean) return true
  if (DEGREE_PATTERNS.some((p) => p.test(clean))) return true
  const upper = clean.toUpperCase().replace(/[^A-Z]/g, '')
  return COMMON_DEGREE_ACRONYMS.has(upper)
}

function isDegreeOnlyString(str) {
  const clean = str.trim().replace(/^[,.\-\s]+|[,.\-\s]+$/g, '')
  if (!clean) return true
  const parts = clean.split(/[\s,]+/).filter(Boolean)
  if (parts.length === 0) return true
  return parts.length <= 3 && parts.every((p) => isLikelyDegree(p) || p.length <= 3)
}

/** Helper: Parse lecturer strings (smart multi-dosen parser with academic degree merge) */
export function parseLecturers(rawString) {
  if (!rawString || typeof rawString !== 'string') return []
  const text = rawString.trim()
  if (!text) return []

  // Step 1: Check for numbered list like '1. Dr. Achmad... 2. Fadhilah...'
  const numberedMatch = text.split(/(?=\b\d+[.)]\s+)/).map((s) => s.trim()).filter(Boolean)
  let rawSegments = []
  if (numberedMatch.length > 1) {
    rawSegments = numberedMatch.map((s) => s.replace(/^\d+[.)]\s*/, '').trim()).filter(Boolean)
  } else {
    // Split by newlines, semicolons, or explicit & / dan delimiters
    rawSegments = text
      .split(/\r?\n|;|\s+&\s+|\s+dan\s+(?=[A-Z])/g)
      .map((s) => s.trim().replace(/^[\d.)\-\s]+/, ''))
      .filter(Boolean)
  }

  if (rawSegments.length <= 1) {
    return rawSegments.length === 1 ? rawSegments : [text]
  }

  // Step 2: Merge accidental degree-only lines (e.g. Alt+Enter in Excel) back into previous lecturer
  const merged = []
  for (const seg of rawSegments) {
    if (merged.length > 0 && isDegreeOnlyString(seg)) {
      const prev = merged[merged.length - 1]
      merged[merged.length - 1] = prev + (prev.endsWith(',') ? ' ' : ', ') + seg
    } else {
      merged.push(seg)
    }
  }

  return merged.length > 0 ? merged : [text]
}

/** Helper: Extract initials for avatars (ignoring numbering and academic prefixes) */
export function getLecturerInitial(name) {
  if (!name) return '?'
  const clean = name
    .replace(/^[\d.)\-\s]+/, '')
    .replace(/^(?:dr|prof|ir|drs|dra|h|hj)\.?\s+/i, '')
    .trim()
  return (clean[0] || name[0] || '?').toUpperCase()
}

/** Helper: Extract 1-2 letter uppercase initials for avatar badges */
export function getLecturerInitials(name) {
  if (!name) return 'DS'
  const clean = name
    .replace(/^[\d.)\-\s]+/, '')
    .replace(/^(?:dr|prof|drg|drs|dra|ir|ns|h|hj)\.?\s+/i, '')
    .trim()
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'DS'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Helper: Format official WhatsApp direct link */
export function formatWhatsAppUrl(rawPhone) {
  if (!rawPhone) return null
  let clean = String(rawPhone).replace(/[^0-9]/g, '')
  if (!clean) return null
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1)
  } else if (clean.startsWith('8')) {
    clean = '62' + clean
  }
  return `https://wa.me/${clean}`
}
