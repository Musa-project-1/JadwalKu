import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

export const firebaseReady = isConfigured

let app = null
let db = null
let auth = null

if (isConfigured) {
  // Reuse app instance (aman terhadap HMR / re-import modul).
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
  auth = getAuth(app)

  // Singleton di level global agar Vite HMR tidak memanggil
  // initializeFirestore dua kali pada app yang sama — penyebab
  // "INTERNAL ASSERTION FAILED: Unexpected state".
  const g = globalThis
  if (!g.__jadwalkuFirestore) {
    g.__jadwalkuFirestore = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  }
  db = g.__jadwalkuFirestore
} else if (import.meta.env.DEV) {
  console.info(
    '[firebase] SDK belum dikonfigurasi. Isi VITE_FIREBASE_* di frontend/.env (lihat .env.example).',
  )
}

export { app, db, auth }
