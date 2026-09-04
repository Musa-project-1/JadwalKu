import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from 'firebase/firestore'

// Semua nilai Firebase WAJIB via env VITE_FIREBASE_*.
// Jangan hardcode apiKey/projectId di source — GitHub Secret Scanning akan
// flag pattern AIza* sebagai Public leak dan key tidak bisa dirotasi via
// GitHub Secrets. Untuk GitHub Pages, set secrets di repo Settings ->
// Secrets and variables -> Actions -> VITE_FIREBASE_* (lihat .env.example).
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const hasEnvConfig = Boolean(envConfig.apiKey && envConfig.projectId)

// Tanpa env yang lengkap, jangan coba inisialisasi Firebase — biarkan app
// jalan dalam mode offline/empty dengan firebaseReady=false.
const firebaseConfig = hasEnvConfig ? envConfig : null

const isConfigured = Boolean(firebaseConfig?.apiKey && firebaseConfig?.projectId)

export const firebaseReady = isConfigured

let app = null
let db = null
let auth = null

if (isConfigured) {
  // Reuse app instance (aman terhadap HMR / re-import modul).
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
  auth = getAuth(app)

  // Singleton di level global agar Vite HMR tidak memanggil
  // initializeFirestore dua kali pada app yang sama.
  const g = globalThis
  if (!g.__jadwalkuFirestore) {
    try {
      g.__jadwalkuFirestore = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentSingleTabManager(),
        }),
      })
    } catch {
      g.__jadwalkuFirestore = getFirestore(app)
    }
  }
  db = g.__jadwalkuFirestore
} else if (import.meta.env.DEV) {
  console.info(
    '[firebase] SDK belum dikonfigurasi. Isi VITE_FIREBASE_* di frontend/.env (lihat .env.example).',
  )
}

export { app, db, auth }
