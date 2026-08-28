import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

// Konfigurasi dibaca dari env VITE_FIREBASE_*. Fallback publik HANYA dipakai
// di build produksi (GitHub Pages tidak punya env) supaya app tetap terhubung.
// Di mode dev tanpa env kita TIDAK diam-diam memakai proyek publik — beri
// peringatan agar salah konfigurasi cepat terlihat.
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const hasEnvConfig = Boolean(envConfig.apiKey && envConfig.projectId)

const firebaseConfig = hasEnvConfig
  ? envConfig
  : import.meta.env.PROD
    ? {
        apiKey: 'AIzaSyC5GAJuDdkAsBPoSZpgnj8DwY2vk3euL18',
        authDomain: 'scheduleuni-89887.firebaseapp.com',
        projectId: 'scheduleuni-89887',
        storageBucket: 'scheduleuni-89887.firebasestorage.app',
        messagingSenderId: '550134333073',
        appId: '1:550134333073:web:5bfa0995a26159c8b90930',
      }
    : null

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
          tabManager: persistentMultipleTabManager(),
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
