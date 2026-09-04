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
  'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400/80 border-emerald-500/20 dark:border-emerald-500/15 dark:bg-emerald-950/40',
  'bg-blue-500/10 text-blue-800 dark:text-blue-400/80 border-blue-500/20 dark:border-blue-500/15 dark:bg-blue-950/40',
  'bg-violet-500/10 text-violet-800 dark:text-violet-400/80 border-violet-500/20 dark:border-violet-500/15 dark:bg-violet-950/40',
  'bg-amber-500/10 text-amber-800 dark:text-amber-400/80 border-amber-500/20 dark:border-amber-500/15 dark:bg-amber-950/40',
  'bg-rose-500/10 text-rose-800 dark:text-rose-400/80 border-rose-500/20 dark:border-rose-500/15 dark:bg-rose-950/40',
  'bg-cyan-500/10 text-cyan-800 dark:text-cyan-400/80 border-cyan-500/20 dark:border-cyan-500/15 dark:bg-cyan-950/40',
  'bg-indigo-500/10 text-indigo-800 dark:text-indigo-400/80 border-indigo-500/20 dark:border-indigo-500/15 dark:bg-indigo-950/40',
  'bg-orange-500/10 text-orange-800 dark:text-orange-400/80 border-orange-500/20 dark:border-orange-500/15 dark:bg-orange-950/40',
  'bg-fuchsia-500/10 text-fuchsia-800 dark:text-fuchsia-400/80 border-fuchsia-500/20 dark:border-fuchsia-500/15 dark:bg-fuchsia-950/40',
  'bg-lime-500/10 text-lime-800 dark:text-lime-400/80 border-lime-500/20 dark:border-lime-500/15 dark:bg-lime-950/40',
  'bg-sky-500/10 text-sky-800 dark:text-sky-400/80 border-sky-500/20 dark:border-sky-500/15 dark:bg-sky-950/40',
  'bg-pink-500/10 text-pink-800 dark:text-pink-400/80 border-pink-500/20 dark:border-pink-500/15 dark:bg-pink-950/40',
  'bg-purple-500/10 text-purple-800 dark:text-purple-400/80 border-purple-500/20 dark:border-purple-500/15 dark:bg-purple-950/40',
  'bg-red-500/10 text-red-800 dark:text-red-400/80 border-red-500/20 dark:border-red-500/15 dark:bg-red-950/40',
  'bg-green-500/10 text-green-800 dark:text-green-400/80 border-green-500/20 dark:border-green-500/15 dark:bg-green-950/40',
]

/** Palette solid border-left untuk aksen/list prodi (stripe kiri). */
const PRODI_STRIPE_PALETTE = [
  'border-l-teal-500',
  'border-l-emerald-500',
  'border-l-blue-500',
  'border-l-violet-500',
  'border-l-amber-500',
  'border-l-rose-500',
  'border-l-cyan-500',
  'border-l-indigo-500',
  'border-l-orange-500',
  'border-l-fuchsia-500',
  'border-l-lime-500',
  'border-l-sky-500',
  'border-l-pink-500',
  'border-l-purple-500',
  'border-l-red-500',
  'border-l-green-500',
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
