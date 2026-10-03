/**
 * Pemetaan warna deterministik per nama prodi.
 *
 * Setiap nama prodi selalu menghasilkan warna yang sama (hash -> palette),
 * sehingga:
 * - Prodi baru yang ditambahkan otomatis mendapat warna unik tanpa konfigurasi.
 * - Warna tetap konsisten di semua halaman (tabel, kartu, dsb.).
 * - Tidak perlu menambahkan kolom warna manual di Firestore.
 *
 * Pakai untuk badge prodi agar tiap program studi mudah dibedakan.
 */

/**
 * Palette kelas Tailwind untuk badge prodi.
 * Semua string ditulis lengkap di sini agar Tailwind content scanner
 * menghasilkan class-nya (tidak di-purge).
 */
const PRODI_COLOR_PALETTE = [
  'bg-teal-500/10 text-teal-800 dark:text-teal-400/80 border-teal-500/20 dark:border-teal-500/15 dark:bg-teal-950/40',
  'bg-indigo-500/10 text-indigo-800 dark:text-indigo-400/80 border-indigo-500/20 dark:border-indigo-500/15 dark:bg-indigo-950/40',
  'bg-violet-500/10 text-violet-800 dark:text-violet-400/80 border-violet-500/20 dark:border-violet-500/15 dark:bg-violet-950/40',
  'bg-rose-500/10 text-rose-800 dark:text-rose-400/80 border-rose-500/20 dark:border-rose-500/15 dark:bg-rose-950/40',
  'bg-amber-500/10 text-amber-800 dark:text-amber-400/80 border-amber-500/20 dark:border-amber-500/15 dark:bg-amber-950/40',
  'bg-cyan-500/10 text-cyan-800 dark:text-cyan-400/80 border-cyan-500/20 dark:border-cyan-500/15 dark:bg-cyan-950/40',
  'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400/80 border-emerald-500/20 dark:border-emerald-500/15 dark:bg-emerald-950/40',
  'bg-slate-500/10 text-slate-700 dark:text-slate-400/80 border-slate-500/20 dark:border-slate-500/15 dark:bg-slate-900/40',
]

/** Palette solid border-left untuk aksen/list prodi (stripe kiri) – 8 warna kalem, selaras Clean Modern. */
const PRODI_STRIPE_PALETTE = [
  'border-l-teal-500',
  'border-l-indigo-500',
  'border-l-violet-500',
  'border-l-rose-500',
  'border-l-amber-500',
  'border-l-cyan-500',
  'border-l-emerald-500',
  'border-l-slate-500',
]

/** Hash deterministik untuk sebuah string (nama prodi). */
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return hash
}

/** Key normalisasi (lowercase, trim) untuk lookup warna. */
function prodiKey(nama = '') {
  return String(nama || '').trim().toLowerCase()
}

/**
 * Ambil kelas badge untuk sebuah nama prodi secara deterministik.
 * @param {string} nama - Nama prodi (mis. "Informatika").
 * @returns {string} Kelas Tailwind untuk badge prodi.
 */
export function getProdiColorClasses(nama = '') {
  const key = prodiKey(nama)
  if (!key) return PRODI_COLOR_PALETTE[0]
  return PRODI_COLOR_PALETTE[hashString(key) % PRODI_COLOR_PALETTE.length]
}

/**
 * Badge warna untuk Kode MK:
 * - Jika MK Umum / Multi-prodi / MKWK: warna ungu/amber khusus MK Umum.
 * - Jika MK Prodi: warna diturunkan secara deterministik dari Prodi pemiliknya.
 */
export function getCourseCodeBadgeClass(prodi = '', isMultiProdi = false, kodeMK = '') {
  const cleanCode = String(kodeMK || '').toUpperCase().trim()
  if (isMultiProdi || cleanCode.startsWith('MKWK') || cleanCode.startsWith('MKN') || cleanCode.startsWith('UMUM') || !prodi) {
    return 'bg-purple-500/10 text-purple-800 dark:text-purple-300/80 border-purple-500/20 dark:border-purple-500/15 dark:bg-purple-950/40'
  }
  return getProdiColorClasses(prodi)
}

/**
 * Ambil kelas split (bg, text, border) untuk avatar/initial kotak prodi.
 */
export function getProdiTokenMap(nama = '') {
  const full = getProdiColorClasses(nama)
  const parts = full.split(' ')
  return {
    bg: parts[0] || 'bg-teal-500/10',
    text: `${parts[1] || 'text-teal-800'} ${parts[2] || 'dark:text-teal-400'}`,
    border: parts[3] || 'border-teal-500/20',
  }
}

/**
 * Ambil kelas stripe kiri (border-l-*) untuk sebuah nama prodi.
 * @param {string} nama - Nama prodi.
 * @returns {string} Kelas Tailwind border-left solid untuk prodi.
 */
export function getProdiStripeClass(nama = '') {
  const key = prodiKey(nama)
  if (!key) return PRODI_STRIPE_PALETTE[0]
  return PRODI_STRIPE_PALETTE[hashString(key) % PRODI_STRIPE_PALETTE.length]
}
