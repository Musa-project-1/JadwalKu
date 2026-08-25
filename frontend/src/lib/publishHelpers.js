import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  documentId,
  arrayUnion,
} from 'firebase/firestore'
import { db } from './firebaseClient'
import { logError } from './errorLogger'

/**
 * Tahun ajaran berjalan: Agustus–Desember → Y/Y+1, Januari–Juli → Y-1/Y.
 */
export function deriveTahunAjaran(date = new Date()) {
  const y = date.getFullYear()
  return date.getMonth() >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`
}

/**
 * ATURAN SEMESTER: jadwal semester yang sama (mis. Semester 4) di tahun
 * ajaran berbeda adalah jadwal BERBEDA. Saat batch dipublish, semua dokumen
 * published LAIN dengan pasangan prodi+semester yang sama (di luar batch)
 * otomatis diarsipkan — jadi jadwal baru MENGGANTIKAN yang lama, tidak
 * pernah tercampur.
 *
 * @param {'jadwal'|'ujian'} collectionName
 * @param {Array<FirebaseFirestore.QueryDocumentSnapshot>} draftDocs
 * @param {Set<string>} keepIds id dokumen batch yang akan dipublish
 * @param {string} actor
 */
async function archiveReplacedPublished(collectionName, draftDocs, keepIds, actor) {
  const groups = new Map()
  draftDocs.forEach((d) => {
    const data = d.data()
    const key = `${data.prodi ?? ''}|${Number(data.semester)}`
    if (!groups.has(key)) groups.set(key, [])
  })

  let archivedCount = 0
  for (const key of groups.keys()) {
    const [prodi, semester] = key.split('|')
    const snap = await getDocs(
      query(
        collection(db, collectionName),
        where('prodi', '==', prodi),
        where('semester', '==', Number(semester)),
        where('status', '==', 'published'),
      ),
    )
    const stale = snap.docs.filter((d) => !keepIds.has(d.id))
    for (let i = 0; i < stale.length; i += 450) {
      const chunk = stale.slice(i, i + 450)
      const batch = writeBatch(db)
      chunk.forEach((d) => {
        batch.update(d.ref, { status: 'archived', updatedAt: serverTimestamp() })
      })
      await batch.commit()
      archivedCount += chunk.length
    }
  }

  if (archivedCount > 0) {
    await appendHistory({
      entitas: collectionName,
      field: 'status',
      nilaiLama: 'published',
      nilaiBaru: 'archived (digantikan jadwal terbaru)',
      aktor: actor,
      detail: `${archivedCount} dokumen published lama diarsipkan otomatis saat publish baru`,
    })
  }
}

/** Ambil snapshot dokumen per id — query 'in' (maks 30 per query). */
async function fetchByIds(collectionName, ids) {
  const docs = []
  for (let i = 0; i < ids.length; i += 30) {
    const snap = await getDocs(
      query(collection(db, collectionName), where(documentId(), 'in', ids.slice(i, i + 30))),
    )
    docs.push(...snap.docs)
  }
  return docs
}

/** Publish satu set draft doc + catat riwayat (tanpa arsip — arsip dipanggil terpisah). */
async function publishIds(collectionName, draftDocs, fallbackTa, actor) {
  const batch = writeBatch(db)
  draftDocs.forEach((snap) => {
    batch.update(doc(db, collectionName, snap.id), {
      status: 'published',
      // TA dari file/entri dipertahankan; fallback = TA berjalan
      tahunAjaran: snap.data().tahunAjaran ?? fallbackTa,
      updatedAt: serverTimestamp(),
    })
  })
  await batch.commit()

  await appendHistory({
    entitas: collectionName,
    field: 'status',
    nilaiLama: 'draft',
    nilaiBaru: 'published',
    aktor: actor,
    detail: `${draftDocs.length} dokumen dipublikasikan`,
  })
}

/**
 * Ubah status dokumen jadwal/ujian dari `draft` menjadi `published`.
 * Sebelum publish, jadwal published lama untuk prodi+semester yang sama
 * diarsipkan dulu (aturan semester — lihat archiveReplacedPublished).
 *
 * @param {'jadwal'|'ujian'} collectionName
 * @param {string[]} docIds daftar id dokumen yang mau dipublish
 * @param {string} actor email admin yang melakukan aksi (dari Firebase Auth)
 * @returns {Promise<{ ok: boolean, publishedCount: number, error?: string }>}
 */
export async function publishDocuments(collectionName, docIds, actor) {
  if (!db) return { ok: false, publishedCount: 0, error: 'Firestore belum siap' }
  if (!docIds.length) return { ok: true, publishedCount: 0 }

  try {
    const draftDocs = await fetchByIds(collectionName, docIds)
    const fallbackTa = deriveTahunAjaran()

    await archiveReplacedPublished(collectionName, draftDocs, new Set(docIds), actor)
    await publishIds(collectionName, draftDocs, fallbackTa, actor)

    // Tandai waktu & aktor publikasi terakhir agar bisa tampil di halaman
    // pengaturan mahasiswa ("Terakhir diperbarui oleh Admin").
    const activeTa = draftDocs[0]?.data().tahunAjaran ?? fallbackTa
    await saveSettings({
      lastPublishedAt: new Date().toISOString(),
      lastPublishedBy: actor,
      currentTahunAjaran: activeTa,
      availableTAs: arrayUnion(activeTa),
    })

    return { ok: true, publishedCount: draftDocs.length }
  } catch (err) {
    logError({
      type: 'publish',
      detail: err?.message ?? String(err),
      context: { collectionName, count: docIds.length },
    })
    return { ok: false, publishedCount: 0, error: err?.message ?? String(err) }
  }
}

/**
 * Tulis satu entri riwayat perubahan ke koleksi `riwayat`.
 * Dipanggil setiap kali admin mengubah data (edit manual, upload, publish).
 *
 * @param {{
 *   entitas: string, field: string, nilaiLama: unknown, nilaiBaru: unknown,
 *   aktor: string, detail?: string
 * }} entry
 */
export async function appendHistory({ entitas, field, nilaiLama, nilaiBaru, aktor, detail }) {
  if (!db) return false

  try {
    await addDoc(collection(db, 'riwayat'), {
      timestamp: serverTimestamp(),
      entitas,
      field,
      nilaiLama: serializeHistoryValue(nilaiLama),
      nilaiBaru: serializeHistoryValue(nilaiBaru),
      aktor,
      ...(detail ? { detail } : {}),
    })
    return true
  } catch (err) {
    logError({
      type: 'history',
      detail: err?.message ?? String(err),
      context: { entitas, field },
    })
    return false
  }
}

/**
 * Simpan metadata terakhir ke koleksi `settings` (misal lastPublished, lastFileName).
 *
 * @param {Record<string, unknown>} values pasangan key-value yang mau disimpan
 */
export async function saveSettings(values) {
  if (!db) return false

  try {
    // Satu dokumen tetap "app" untuk semua setting global.
    await updateDoc(doc(db, 'settings', 'app'), values)
    return true
  } catch {
    // Dokumen "app" belum ada → buat baru dengan setDoc merge.
    try {
      const { setDoc } = await import('firebase/firestore')
      await setDoc(doc(db, 'settings', 'app'), values, { merge: true })
      return true
    } catch (err) {
      logError({
        type: 'settings',
        detail: err?.message ?? String(err),
        context: values,
      })
      return false
    }
  }
}

function serializeHistoryValue(value) {
  if (value === undefined || value === null) return null
  if (typeof value === 'object') return JSON.stringify(value)
  return value
}
