import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebaseClient'

/**
 * Tulis entri error ke koleksi `errorLog` di Firestore.
 * Dipanggil dari mana saja di frontend saat parsing/validasi/write gagal,
 * supaya admin bisa lihat riwayat masalah tanpa harus reproduksi manual.
 *
 * Tidak pernah melempar error — logging tidak boleh mematikan alur utama app.
 *
 * @param {{ type: string, detail: string, context?: Record<string, unknown> }} entry
 * @returns {Promise<boolean>} true jika berhasil ditulis
 */
export async function logError({ type, detail, context = {} }) {
  if (!db) return false

  try {
    await addDoc(collection(db, 'errorLog'), {
      timestamp: serverTimestamp(),
      errorType: type,
      detail: String(detail).slice(0, 2000),
      context,
    })
    return true
  } catch {
    // Gagal logging (offline / kuota habis / rules) — diamkan saja.
    return false
  }
}

/**
 * Wrapper untuk try/catch otomatis: jalankan fn, kalau throw maka log lalu re-throw.
 * Berguna untuk membungkus operasi penting seperti parse xlsx atau batch write.
 */
export async function withErrorLogging(type, context, fn) {
  try {
    return await fn()
  } catch (err) {
    await logError({
      type,
      detail: err?.message ?? String(err),
      context,
    })
    throw err
  }
}
