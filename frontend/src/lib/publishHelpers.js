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
import { deriveTahunAjaran } from './tahunAjaran'

// Re-export: tahunAjaran.js adalah sumber kebenaran TA (kalender kampus
// digeser: ganjil akhir Sep → awal Feb, genap akhir Mar → awal Jul).
export { deriveTahunAjaran }

/**
 * ATURAN SEMESTER: jadwal semester yang sama (mis. Semester 4) di tahun
 * ajaran berbeda adalah jadwal BERBEDA. Saat batch dipublish, semua dokumen
 * published LAIN dengan pasangan prodi+semester+tahunAjaran yang sama (di luar batch)
 * otomatis diarsipkan — jadi jadwal baru MENGGANTIKAN yang lama, tidak
 * pernah tercampur.
 *
 * @param {'jadwal'|'ujian'} collectionName
 * @param {Array<FirebaseFirestore.QueryDocumentSnapshot>} draftDocs
 * @param {Set<string>} keepIds id dokumen batch yang akan dipublish
 * @param {string} actor
 */
async function archiveReplacedPublished(collectionName, draftDocs, keepIds, actor) {
  // Hanya butuh himpunan pasangan prodi|semester unik — pakai Set, bukan
  // Map berisi array kosong yang tidak pernah dipakai. Kueri per kelompok
  // dijalankan paralel agar tidak serial (N+1).
  const groupKeys = new Set(
    draftDocs.map((d) => `${d.data().prodi ?? ''}|${Number(d.data().semester)}|${String(d.data().tahunAjaran ?? '').trim()}`),
  )

  const results = await Promise.all(
    Array.from(groupKeys).map(async (key) => {
      const [prodi, semester, ta] = key.split('|')
      const clauses = [
        where('prodi', '==', prodi),
        where('semester', '==', Number(semester)),
        where('status', '==', 'published'),
      ]
      if (ta) clauses.push(where('tahunAjaran', '==', ta))
      const snap = await getDocs(query(collection(db, collectionName), ...clauses))
      return snap.docs.filter((d) => !keepIds.has(d.id))
    }),
  )

  let archivedCount = 0
  for (const stale of results) {
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

/**
 * Sinkronisasi otomatis koleksi `prodi` dari data `jadwal` dan `mataKuliah` yang sudah ada di Firestore.
 * Memulihkan data prodi jika dokumen jadwal/MK sudah ada di database.
 *
 * @param {string} actor email pengguna
 * @returns {Promise<{ ok: boolean, count: number, error?: string }>}
 */
export async function syncProdiFromExistingData(actor = '') {
  if (!db) return { ok: false, count: 0, error: 'Database belum terkonfigurasi' }

  try {
    const { setDoc } = await import('firebase/firestore')
    const prodiMap = new Map()

    // 1. Baca dari jadwal
    const jadwalSnap = await getDocs(collection(db, 'jadwal'))
    jadwalSnap.docs.forEach((d) => {
      const data = d.data()
      const name = String(data.prodi ?? '').trim()
      if (!name || name.toLowerCase().startsWith('prodi ')) return
      if (!prodiMap.has(name)) prodiMap.set(name, { nama: name, semesters: new Set() })
      const sem = Number(data.semester)
      if (sem && !Number.isNaN(sem)) prodiMap.get(name).semesters.add(sem)
    })

    // 2. Baca dari mataKuliah
    const mkSnap = await getDocs(collection(db, 'mataKuliah'))
    mkSnap.docs.forEach((d) => {
      const data = d.data()
      const name = String(data.prodi ?? '').trim()
      if (!name || name.toLowerCase().startsWith('prodi ')) return
      if (!prodiMap.has(name)) prodiMap.set(name, { nama: name, semesters: new Set() })
      const sem = Number(data.semester)
      if (sem && !Number.isNaN(sem)) prodiMap.get(name).semesters.add(sem)
    })

    // 3. Simpan ke koleksi prodi
    let count = 0
    for (const p of prodiMap.values()) {
      const sems = Array.from(p.semesters).sort((a, b) => a - b)
      const docId = p.nama.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || p.nama
      await setDoc(
        doc(db, 'prodi', docId),
        {
          nama: p.nama,
          semesterMin: 1,
          semesterMax: sems.length > 0 ? Math.max(sems[sems.length - 1], 8) : 8,
          updatedAt: serverTimestamp(),
          ...(actor ? { updatedBy: actor } : {}),
        },
        { merge: true },
      )
      count += 1
    }

    if (count > 0) {
      await appendHistory({
        entitas: 'prodi',
        field: 'sinkronisasi',
        nilaiLama: null,
        nilaiBaru: `${count} prodi disinkronkan dari data jadwal & MK`,
        aktor: actor,
        detail: `Auto-sync: ${Array.from(prodiMap.keys()).join(', ')}`,
      })
    }

    return { ok: true, count }
  } catch (err) {
    logError({
      type: 'sync-prodi',
      detail: err?.message ?? String(err),
    })
    return { ok: false, count: 0, error: err?.message ?? String(err) }
  }
}
