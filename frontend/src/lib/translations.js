import { id } from "./translations/id.js"
import { en } from "./translations/en.js"

export const TRANSLATIONS = {
  id,
  en,
}


/**
 * Terjemahkan teks dengan fallback cerdas.
 * @param {string} key Kunci terjemahan (e.g. 'nav.home')
 * @param {string} [lang='id'] Kode bahasa ('id' | 'en')
 * @param {Object} [params={}] Parameter substitusi dinamis (e.g. { count: 5 })
 * @returns {string}
 */
export function translate(key, lang = 'id', params = {}) {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.id
  let template = dictionary[key]

  // Fallback ke Bahasa Indonesia jika key di bahasa target tidak ada
  if (template == null && lang !== 'id') {
    template = TRANSLATIONS.id[key]
  }

  // Jika tetap tidak ada, kembalikan key itu sendiri
  if (template == null) return key

  // Substitusi parameter {name}
  if (params && typeof params === 'object') {
    return template.replace(/\{(\w+)\}/g, (_, placeholder) => {
      return params[placeholder] != null ? String(params[placeholder]) : `{${placeholder}}`
    })
  }

  return template
}

/**
 * Helper untuk pemetaan nama hari (ID ke EN atau sebaliknya)
 */
export const DAY_NAMES = {
  id: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
}

export function formatDayName(dayIndo, lang = 'id') {
  if (!dayIndo || lang === 'id') return dayIndo
  const idx = DAY_NAMES.id.indexOf(dayIndo)
  return idx !== -1 ? DAY_NAMES.en[idx] : dayIndo
}
