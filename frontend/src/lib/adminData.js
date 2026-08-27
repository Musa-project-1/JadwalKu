import { addDoc, collection, deleteDoc, doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, firebaseReady } from './firebaseClient'
import { logError } from './errorLogger'

/**
 * Helper tulis Firestore untuk seluruh layar admin. Semua operasi:
 * - menolak berjalan saat SDK belum terkonfigurasi dengan pesan
 *   yang jelas, bukan error mentah,
 * - mencatat kegagalan ke `errorLog`,
 * - mengembalikan `{ ok, id?, error? }` agar UI bisa menampilkan toast/banner.
 */

export function backendReady() {
  return firebaseReady && Boolean(db)
}

function guard() {
  if (!backendReady()) {
    return {
      ok: false,
      error: 'Koneksi database Firebase belum terhubung. Perubahan tidak dapat disimpan.',
    }
  }
  return null
}

async function run(fn, context) {
  const blocked = guard()
  if (blocked) return blocked

  try {
    return await fn()
  } catch (err) {
    logError({ type: 'admin-write', detail: err?.message ?? String(err), context })
    return { ok: false, error: err?.message ?? String(err) }
  }
}

export function addDocument(collectionName, data, actor = '') {
  return run(async () => {
    const ref = await addDoc(collection(db, collectionName), {
      ...data,
      // serverTimestamp() dipakai agar waktu tidak bisa dipalsukan oleh klien.
      updatedAt: serverTimestamp(),
      ...(actor ? { updatedBy: actor } : {}),
    })
    return { ok: true, id: ref.id }
  }, { op: 'add', collectionName })
}

/** Tulis dokumen dengan ID eksplisit (mis. mataKuliah memakai kodeMK sebagai id). */
export function setDocument(collectionName, docId, data, actor = '') {
  return run(async () => {
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      // serverTimestamp() dipakai agar waktu tidak bisa dipalsukan oleh klien.
      updatedAt: serverTimestamp(),
      ...(actor ? { updatedBy: actor } : {}),
    }, { merge: true })
    return { ok: true, id: docId }
  }, { op: 'set', collectionName, docId })
}

export function updateDocument(collectionName, docId, data, actor = '') {
  return run(async () => {
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      // serverTimestamp() dipakai agar waktu tidak bisa dipalsukan oleh klien.
      updatedAt: serverTimestamp(),
      ...(actor ? { updatedBy: actor } : {}),
    })
    return { ok: true, id: docId }
  }, { op: 'update', collectionName, docId })
}

export function deleteDocument(collectionName, docId) {
  return run(async () => {
    await deleteDoc(doc(db, collectionName, docId))
    return { ok: true, id: docId }
  }, { op: 'delete', collectionName, docId })
}

/** Baca satu dokumen sekali (bukan listener) — mis. settings/app. */
export async function fetchDocument(collectionName, docId) {
  const blocked = guard()
  if (blocked) return null

  try {
    const snap = await getDoc(doc(db, collectionName, docId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (err) {
    logError({ type: 'admin-read', detail: err?.message ?? String(err), context: { collectionName, docId } })
    return null
  }
}
