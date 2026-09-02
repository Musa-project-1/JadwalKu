import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { useApp } from '../../hooks/useApp'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { theme, setTheme } = useApp()
  const { user, signIn } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const nextTheme = theme === 'dark' ? 'light' : 'dark'

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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-surface-container-lowest/50 dark:bg-[#0B132B]/60 px-4 py-8">
      {/* ── Ambient Background Lighting Mesh ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-[100px] dark:bg-primary/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-teal-500/20 blur-[100px] dark:bg-teal-500/15"
      />

      {/* ── Top Floating Navigation Bar (Back + Theme Switcher) ── */}
      <header className="absolute top-4 left-4 right-4 max-w-5xl mx-auto flex items-center justify-between z-10">
        <Link
          to="/"
          viewTransition
          className="flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-lowest/80 dark:bg-surface-container-low/80 backdrop-blur-md px-4 py-2 text-body-xs font-bold text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all shadow-level-1 group"
        >
          <Icon name="arrow_back" size={16} className="text-on-surface-variant group-hover:text-primary transition-colors" />
          <span>Mode Mahasiswa</span>
        </Link>

        <button
          type="button"
          onClick={() => setTheme(nextTheme)}
          aria-label={`Ganti ke mode ${nextTheme === 'dark' ? 'gelap' : 'terang'}`}
          title={`Mode ${nextTheme === 'dark' ? 'Gelap' : 'Terang'}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-lowest/80 dark:bg-surface-container-low/80 backdrop-blur-md text-on-surface-variant transition-all hover:bg-surface-container-highest hover:text-on-surface shadow-level-1 cursor-pointer"
        >
          <Icon name={nextTheme === 'dark' ? 'dark_mode' : 'light_mode'} size={18} />
        </button>
      </header>

      {/* ── Main Login Card ── */}
      <div className="relative z-10 w-full max-w-[440px]">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="relative inline-flex items-center justify-center p-3 rounded-3xl bg-surface-container-lowest/90 dark:bg-surface-container-high/60 border border-outline-variant/30 shadow-level-2 mb-3.5 group">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo JadwalKu" className="h-12 w-12 shrink-0 group-hover:opacity-90 transition-opacity" />
          </div>
          <h1 className="text-display-sm tablet:text-display-md font-bold font-brand tracking-tight text-on-surface">
            <span>Jadwal</span>
            <span className="text-primary">Ku</span>
          </h1>
          <div className="mt-1.5 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/25 px-3 py-0.5 text-label-caps font-extrabold text-primary shadow-level-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ADMIN CONSOLE</span>
          </div>
        </div>

        {/* Card Form */}
        <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest/85 dark:bg-surface-container-low/80 backdrop-blur-xl p-6 tablet:p-8 shadow-level-3 transition-all">
          <div className="mb-5 pb-3 border-b border-outline-variant/20 flex items-center justify-between">
            <div>
              <h2 className="text-title-sm font-bold text-on-surface">Masuk Panel Admin</h2>
              <p className="text-body-xs text-on-surface-variant">Kelola jadwal kuliah, ujian, dan data master.</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon name="shield_person" size={20} />
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-body-xs font-bold text-on-surface">
                <Icon name="mail" size={15} className="text-primary" />
                <span>Email</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jadwalkampus.app"
                  autoComplete="username"
                  required
                  className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-lowest/60 dark:bg-surface-container-high/40 px-4 py-2.5 text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="flex items-center gap-2 text-body-xs font-bold text-on-surface">
                  <Icon name="lock" size={15} className="text-primary" />
                  <span>Kata Sandi</span>
                </label>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-lowest/60 dark:bg-surface-container-high/40 pl-3.5 pr-11 py-2.5 text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  className="absolute right-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={17} />
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-error/30 bg-error-container/60 px-4 py-2.5 text-body-xs text-on-error-container">
                <Icon name="error" size={17} className="shrink-0 text-error" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-primary to-teal-600 py-3 text-body-sm font-bold text-on-primary shadow-level-2 hover:shadow-level-2 hover:brightness-105 active:opacity-80 disabled:opacity-60 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <Icon name="arrow_forward" size={17} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer Note */}
        <p className="mt-5 text-center text-label-caps text-on-surface-variant/75 flex items-center justify-center gap-2">
          <Icon name="lock" size={13} className="text-primary/70" />
          <span>Koneksi aman terenkripsi · JadwalKu Administrator</span>
        </p>
      </div>
    </div>
  )
}
