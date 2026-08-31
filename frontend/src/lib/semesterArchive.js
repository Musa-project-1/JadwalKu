import {
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebaseClient'
import { logError } from './errorLogger'

/**
 * Arsipkan semua dokumen jadwal & ujian milik satu semester, lalu siapkan
 * state kosong untuk semester baru. Semua dilakukan client-side dalam
 * batched writes dari sesi admin yang terautentikasi.
 *
 * Dokumen lama TIDAK dihapus — hanya ditandai `status: "archived"` supaya
 * tetap bisa dibaca sebagai riwayat (query mahasiswa selalu filter
 * `status == "published"`, jadi data arsip otomatis tak terlihat).
 *
 * @param {{
 *   prodi?: string,
 *   oldSemester: number|string,
 *   newSemester: number|string,
 *   actor: string
 * }} params
 * @returns {Promise<{ ok: boolean, archivedCount: number, error?: string }>}
 */
export async function archiveSemester({ prodi, oldSemester, newSemester, actor }) {
  if (!db) return { ok: false, archivedCount: 0, error: 'Firestore belum siap' }

  try {
    let archivedCount = 0

    for (const collectionName of ['jadwal', 'ujian']) {
      const clauses = [where('semester', '==', Number(oldSemester))]
      if (prodi) clauses.push(where('prodi', '==', prodi))

      const snap = await getDocs(query(collection(db, collectionName), ...clauses))
      const docs = snap.docs.filter((d) => d.data().status !== 'archived')

      // Firestore membatasi 500 operasi per batch.
      for (let i = 0; i < docs.length; i += 450) {
        const chunk = docs.slice(i, i + 450)
        const batch = writeBatch(db)

        for (const d of chunk) {
          batch.update(d.ref, {
            status: 'archived',
            updatedAt: serverTimestamp(),
          })
        }

        await batch.commit()
        archivedCount += chunk.length
      }
    }

    const { appendHistory } = await import('./publishHelpers')
    await appendHistory({
      entitas: 'jadwal+ujian',
      field: 'status',
      nilaiLama: String(oldSemester),
      nilaiBaru: `archived (menuju semester ${newSemester})`,
      aktor: actor,
      detail: `${archivedCount} dokumen semester ${oldSemester} diarsipkan`,
    })

    return { ok: true, archivedCount }
  } catch (err) {
    logError({
      type: 'archive',
      detail: err?.message ?? String(err),
      context: { prodi, oldSemester, newSemester },
    })
    return { ok: false, archivedCount: 0, error: err?.message ?? String(err) }
  }
}
