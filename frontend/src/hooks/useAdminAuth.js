import { useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth, firebaseReady } from '../lib/firebaseClient'
import { getItem, removeItem, setItem, STORAGE_KEYS } from '../lib/storage'

/**
 * Sesi admin: Firebase Authentication (Email/Password) saat SDK terkonfigurasi.
 * Tanpa konfigurasi Firebase (.env kosong), tersedia "mode demo" lokal agar
 * alur admin tetap bisa dikembangkan/diuji tanpa backend — jelas ditandai di UI.
 */

const DEMO_MARKER = { demo: true }

export function useAdminAuth() {
  // Mode demo (SDK belum dikonfigurasi): pulihkan sesi langsung saat inisialisasi.
  const [user, setUser] = useState(() => {
    if (!firebaseReady) {
      const stored = getItem(STORAGE_KEYS.adminSession, null)
      return stored?.email ? { email: stored.email, demo: true } : null
    }
    return null
  })
  const [initializing, setInitializing] = useState(firebaseReady)

  useEffect(() => {
    if (!firebaseReady || !auth) {
      return undefined
    }

    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser ? { email: fbUser.email } : null)
      setInitializing(false)
    })
    return unsub
  }, [])

  async function signIn(email, password) {
    if (!firebaseReady || !auth) {
      const session = { email, ...DEMO_MARKER }
      setItem(STORAGE_KEYS.adminSession, session)
      setUser({ email, demo: true })
      return { ok: true }
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      setItem(STORAGE_KEYS.adminSession, { email: cred.user.email })
      return { ok: true }
    } catch (err) {
      return { ok: false, error: translateAuthError(err?.code) }
    }
  }

  async function registerAdmin(email, password) {
    // Sekali pakai: membuat akun admin pertama bila belum ada di Firebase Console.
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: translateAuthError(err?.code) }
    }
  }

  async function signOutAdmin() {
    removeItem(STORAGE_KEYS.adminSession)
    if (firebaseReady && auth) {
      await signOut(auth)
    }
    setUser(null)
  }

  return { user, initializing, signIn, registerAdmin, signOutAdmin }
}

function translateAuthError(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'Format email tidak valid.'
    case 'auth/user-disabled':
      return 'Akun ini dinonaktifkan.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email atau password salah.'
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Coba lagi nanti.'
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke server. Periksa koneksi internet.'
    default:
      return 'Gagal masuk. Coba lagi.'
  }
}
