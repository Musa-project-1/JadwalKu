import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Input } from '../../components/Input'
import { Button } from '../../components/Button'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { firebaseReady } from '../../lib/firebaseClient'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { user, signIn } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Sudah masuk → langsung ke dashboard.
  if (user) {
    return <Navigate to="/admin/dashboard" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Email dan password wajib diisi.')
      return
    }

    setSubmitting(true)
    const result = await signIn(email.trim(), password)
    setSubmitting(false)

    if (result.ok) {
      navigate('/admin/dashboard', { replace: true })
    } else {
      setError(result.error ?? 'Gagal masuk.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-md">
      <div className="w-full max-w-md">
        <div className="mb-xl text-center">
          <span className="mx-auto mb-base flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary">
            <Icon name="admin_panel_settings" size={28} />
          </span>
          <h1 className="text-headline-lg font-bold text-primary">
            JadwalKu
          </h1>
          <p className="text-body-lg text-on-surface-variant">Masuk sebagai Admin</p>
        </div>

        {!firebaseReady && (
          <div className="mb-md flex items-start gap-sm rounded-lg border border-tertiary/30 bg-tertiary/10 p-md text-body-sm text-tertiary">
            <Icon name="info" size={20} className="mt-xs shrink-0" />
            <p>
              Firebase belum dikonfigurasi — mode demo aktif. Masukkan email apa saja untuk
              mencoba alur admin tanpa backend.
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-md rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low"
        >
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@jadwalkampus.app"
            autoComplete="username"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="flex items-center gap-xs rounded-lg bg-error-container px-md py-sm text-body-sm text-on-error-container">
              <Icon name="error" size={18} className="shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full justify-center">
            {submitting ? 'Memproses…' : 'Masuk'}
            {!submitting && <Icon name="arrow_forward" size={20} />}
          </Button>
        </form>

        <p className="mt-lg text-center text-body-sm text-on-surface-variant">
          <Link to="/" className="font-semibold text-primary hover:underline">
            ← Kembali ke tampilan mahasiswa
          </Link>
        </p>
      </div>
    </div>
  )
}
