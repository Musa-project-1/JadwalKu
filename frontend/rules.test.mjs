/**
 * Firestore Security Rules test — Phase 5 item F.
 *
 * Jalankan:
 *   1. Terminal 1:  npx firebase-tools emulators:start --only firestore
 *   2. Terminal 2:  npm run test:rules
 *
 * Semua skenario dari DEPLOYMENT.md §5 dijalankan otomatis.
 * Exit code 0 = semua pass.
 */
import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'

const RULES = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8')
const PROJECT_ID = 'rules-test-jadwal-kampus'

const results = []
let env

function record(n, name, pass) {
  results.push({ n, name, pass })
  console.log(`${pass ? '  PASS' : '  FAIL'}  #${n} ${name}`)
}

/**
 * Jalankan satu skenario tanpa menghentikan seluruh test saat error tak terduga
 * (mis. resource.data.status undefined pada list tanpa filter).
 */
async function check(n, name, fn) {
  try {
    // assertSucceeds resolve = hasil operasi (truthy); assertFails resolve =
    // objek error yang ditolak (truthy). Keduanya pass jika truthy.
    const pass = await fn()
    record(n, name, Boolean(pass))
  } catch (e) {
    record(n, name, false)
    console.log(`        error: ${String(e.message ?? e).split('\n')[0]}`)
  }
}

async function run() {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES, port: 8080, host: '127.0.0.1' },
  })
  await env.clearFirestore()

  const admin = env.authenticatedContext('admin-uid', {
    email: 'admin@jadwalkampus.app',
  })
  const other = env.authenticatedContext('other-uid', {
    email: 'student@example.com',
  })
  const anon = env.unauthenticatedContext()

  const adminDb = admin.firestore()
  const otherDb = other.firestore()
  const anonDb = anon.firestore()

  // ── Seed data sebagai admin (semua dokumen jadwal PUNYA field status
  //    agar list query tidak melempar "status undefined") ──
  await check('S0', 'Seed data admin', async () => {
    await assertSucceeds(
      setDoc(doc(adminDb, 'jadwal', 'pub1'), { prodi: 'TI', semester: 3, status: 'published' }),
    )
    await assertSucceeds(
      setDoc(doc(adminDb, 'jadwal', 'draft1'), { prodi: 'TI', semester: 3, status: 'draft' }),
    )
    await assertSucceeds(
      setDoc(doc(adminDb, 'jadwal', 'adminonly'), { prodi: 'TI', semester: 3, status: 'draft' }),
    )
    await assertSucceeds(setDoc(doc(adminDb, 'ujian', 'u1'), { jenis: 'UTS', status: 'published' }))
    await assertSucceeds(setDoc(doc(adminDb, 'ujian', 'udraft'), { jenis: 'UTS', status: 'draft' }))
    await assertSucceeds(setDoc(doc(adminDb, 'mataKuliah', 'mk1'), { kodeMK: 'IF101' }))
    await assertSucceeds(setDoc(doc(adminDb, 'prodi', 'p1'), { nama: 'TI' }))
    await assertSucceeds(setDoc(doc(adminDb, 'libur', 'l1'), { label: 'Libur' }))
    await assertSucceeds(setDoc(doc(adminDb, 'settings', 'app'), { lastPublishedAt: 'x' }))
    await assertSucceeds(
      setDoc(doc(adminDb, 'riwayat', 'r1'), { entitas: 'jadwal', field: 'status' }),
    )
    return true
  })

  console.log('\n== Skenario DEPLOYMENT.md §5 ==\n')

  // 1-2. Unauthenticated writes fail
  await check(1, 'Anon write jadwal ditolak', async () =>
    assertFails(setDoc(doc(anonDb, 'jadwal', 'anon-x'), { a: 1 })))

  await check(2, 'Anon write mataKuliah/prodi/libur/settings/riwayat ditolak', async () =>
    (await assertFails(setDoc(doc(anonDb, 'mataKuliah', 'anon-x'), { a: 1 }))) &&
    (await assertFails(setDoc(doc(anonDb, 'prodi', 'anon-x'), { a: 1 }))) &&
    (await assertFails(setDoc(doc(anonDb, 'libur', 'anon-x'), { a: 1 }))) &&
    (await assertFails(setDoc(doc(anonDb, 'settings', 'anon-x'), { a: 1 }))) &&
    (await assertFails(setDoc(doc(anonDb, 'riwayat', 'anon-x'), { a: 1 }))))

  // 3. Authenticated non-admin writes fail
  await check(3, 'Non-admin login write jadwal/ujian ditolak', async () =>
    (await assertFails(setDoc(doc(otherDb, 'jadwal', 'other-x'), { a: 1 }))) &&
    (await assertFails(setDoc(doc(otherDb, 'ujian', 'other-x'), { a: 1 }))))

  // 4. Admin writes allowed (setDoc resolve undefined — jangan di-chain &&)
  await check(4, 'Admin write jadwal/ujian/mataKuliah diizinkan', async () => {
    await assertSucceeds(setDoc(doc(adminDb, 'jadwal', 'admin-y'), { status: 'draft' }))
    await assertSucceeds(setDoc(doc(adminDb, 'ujian', 'admin-y'), { status: 'draft' }))
    await assertSucceeds(setDoc(doc(adminDb, 'mataKuliah', 'admin-y'), { kodeMK: 'X' }))
    return true
  })

  // 5. Anonymous read published allowed
  await check(5, 'Anon read jadwal published diizinkan', async () =>
    assertSucceeds(getDoc(doc(anonDb, 'jadwal', 'pub1'))))

  // 6. Anonymous read draft denied
  await check(6, 'Anon read jadwal draft ditolak', async () =>
    assertFails(getDoc(doc(anonDb, 'jadwal', 'draft1'))))

  // 7. Anonymous read public collections allowed
  await check(7, 'Anon read mataKuliah/prodi/libur/settings/riwayat diizinkan', async () =>
    (await assertSucceeds(getDoc(doc(anonDb, 'mataKuliah', 'mk1')))) &&
    (await assertSucceeds(getDoc(doc(anonDb, 'prodi', 'p1')))) &&
    (await assertSucceeds(getDoc(doc(anonDb, 'libur', 'l1')))) &&
    (await assertSucceeds(getDoc(doc(anonDb, 'settings', 'app')))) &&
    (await assertSucceeds(getDoc(doc(anonDb, 'riwayat', 'r1')))))

  // 8. errorLog create allowed for anyone (doc unik per run → selalu create)
  const errId = `anon-${Date.now()}`
  await check(8, 'Anon create errorLog diizinkan', async () => {
    await assertSucceeds(setDoc(doc(anonDb, 'errorLog', errId), { detail: 'test' }))
    return true
  })

  // 9. errorLog read/update/delete denied for anon
  await check(9, 'Anon read/update/delete errorLog ditolak', async () =>
    (await assertFails(getDoc(doc(anonDb, 'errorLog', errId)))) &&
    (await assertFails(setDoc(doc(anonDb, 'errorLog', errId), { detail: 'hack' }))) &&
    (await assertFails(setDoc(doc(adminDb, 'errorLog', 'admin-del-test'), { x: 1 }).then(() =>
      getDoc(doc(anonDb, 'errorLog', 'admin-del-test')),
    ))))

  // 10. ujian: draft denied, published allowed
  await check(10, 'Anon read ujian draft ditolak, published diizinkan', async () =>
    (await assertFails(getDoc(doc(anonDb, 'ujian', 'udraft')))) &&
    (await assertSucceeds(getDoc(doc(anonDb, 'ujian', 'u1')))))

  // Query-level (list) checks
  await check('Q1', 'Anon list jadwal TANPA filter status ditolak', async () =>
    assertFails(getDocs(collection(anonDb, 'jadwal'))))

  await check('Q2', 'Anon list jadwal DENGAN filter status==published diizinkan', async () =>
    assertSucceeds(
      getDocs(query(collection(anonDb, 'jadwal'), where('status', '==', 'published'))),
    ))

  await check('Q3', 'Anon list ujian draft ditolak', async () =>
    assertFails(getDocs(query(collection(anonDb, 'ujian'), where('status', '==', 'draft')))))

  await check('Q4', 'Admin list jadwal tanpa filter diizinkan', async () =>
    assertSucceeds(getDocs(collection(adminDb, 'jadwal'))))

  await check('Q5', 'Non-admin login list ujian draft ditolak', async () =>
    assertFails(getDocs(query(collection(otherDb, 'ujian'), where('status', '==', 'draft')))))
}

try {
  await run()
} catch (e) {
  console.error('Fatal:', e.message)
} finally {
  if (env) await env.cleanup()
}

const failed = results.filter((r) => !r.pass)
console.log(`\n== HASIL: ${results.length - failed.length}/${results.length} PASS ==`)
if (failed.length > 0) {
  console.log('Gagal:')
  failed.forEach((r) => console.log(`  - #${r.n} ${r.name}`))
  process.exit(1)
}
