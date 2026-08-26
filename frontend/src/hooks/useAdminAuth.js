import { useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth, firebaseReady } from '../lib/firebaseClient'
import { removeItem, setItem, STORAGE_KEYS } from '../lib/storage'

/**
 * Sesi admin: Firebase Authentication (Email/Password).
 */
export function useAdminAuth() {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(() => Boolean(firebaseReady && auth))

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
      return { ok: false, error: 'Layanan autentikasi Firebase belum terhubung.' }
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
    if (!firebaseReady || !auth) {
      return { ok: false, error: 'Layanan autentikasi Firebase belum terhubung.' }
    }
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
      try {
        await signOut(auth)
      } catch {
        // Abaikan kegagalan jaringan saat logout
      }
    }
    setUser(null)
  }

  return {
    user,
    initializing,
    signIn,
    registerAdmin,
    signOutAdmin,
  }
}

function translateAuthError(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email atau password salah.'
    case 'auth/invalid-email':
      return 'Format email tidak valid.'
    case 'auth/user-disabled':
      return 'Akun admin dinonaktifkan.'
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Silakan coba beberapa saat lagi.'
    case 'auth/network-request-failed':
      return 'Koneksi jaringan terputus. Periksa sambungan internet Anda.'
    case 'auth/email-already-in-use':
      return 'Email admin ini sudah terdaftar.'
    case 'auth/weak-password':
      return 'Password terlalu lemah (minimal 6 karakter).'
    default:
      return 'Gagal memproses autentikasi. Silakan coba lagi.'
  }
}
