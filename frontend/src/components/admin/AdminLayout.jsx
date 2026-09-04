import { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ADMIN_NAV } from '../../lib/navigation'
import { Icon } from '../Icon'
import { OfflineBanner } from '../OfflineBanner'
import { SearchModal } from '../SearchModal'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { useApp } from '../../hooks/useApp'
import { getItem, setItem } from '../../lib/storage'
import { AdminBottomNav } from './AdminBottomNav'

// Shared label class helper — only opacity + max-width transition, NO scale
function labelCls(isCollapsed, spacing = 'ml-3.5') {
  return `overflow-hidden whitespace-nowrap transition-[opacity,max-width,margin] duration-300 ease-in-out ${
    isCollapsed
      ? `max-w-0 opacity-0 ml-0 pointer-events-none group-hover:max-w-[200px] group-hover:opacity-100 group-hover:${spacing} group-hover:pointer-events-auto`
      : `max-w-[200px] opacity-100 ${spacing}`
  }`
}

function AdminNavItem({ item, onNavigate, isPinned }) {
  return (
    <NavLink to={item.to} onClick={onNavigate} end={item.to === '/admin/dashboard'}>
      {({ isActive }) => (
        <span
          title={item.label}
          className={`flex w-full items-center rounded-full h-12 px-4 transition-colors duration-200 ${
            isActive
              ? 'bg-primary/10 font-medium text-primary'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center">
            <Icon name={item.icon} size={24} filled={isActive} />
          </span>
          <span className={labelCls(!isPinned, 'ml-3.5')}>
            {item.label}
          </span>
        </span>
      )}
    </NavLink>
  )
}

/** Baris akun admin di dasar sidebar: email + tombol keluar. */
function AdminAccount({ isPinned }) {
  const { user, signOutAdmin } = useAdminAuth()
  if (!user) return null

  return (
    <div className="px-4">
      <div className="border-t border-outline-variant/40 pt-2 space-y-1">
        {/* Account info row + logout */}
        <div className="flex w-full items-center rounded-full h-12 px-4 transition-colors duration-200 text-on-surface-variant hover:bg-surface-container-high">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icon name="account_circle" size={18} />
          </span>
          <div className={labelCls(!isPinned, 'ml-3.5')}>
            <p className="truncate text-body-xs font-semibold text-on-surface leading-tight">
              {user.email}
            </p>
            <p className="text-label-caps text-on-surface-variant leading-none mt-0.5">
              Administrator
            </p>
          </div>
          {/* Logout icon — only visible when expanded or pinned */}
          <button
            type="button"
            onClick={signOutAdmin}
            title="Keluar"
            className={`ml-auto shrink-0 h-7 w-7 items-center justify-center rounded-full text-on-surface-variant/70 hover:bg-error/10 hover:text-error transition-colors ${
              isPinned ? 'flex' : 'hidden group-hover:flex'
            }`}
          >
            <Icon name="logout" size={16} />
          </button>
        </div>

        {/* Mode Mahasiswa Switcher — in sidebar */}
        <NavLink
          to="/"
          viewTransition
          title="Mode Mahasiswa"
          className="flex w-full items-center rounded-full h-12 px-4 transition-colors duration-200 text-on-surface-variant hover:bg-surface-container-high group/link"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center text-primary">
            <Icon name="school" size={22} />
          </span>
          <span className={labelCls(!isPinned, 'ml-3.5')}>Mode Mahasiswa</span>
        </NavLink>
      </div>
    </div>
  )
}


export function AdminLayout() {
  const { theme, setTheme } = useApp()
  const [isPinned, setIsPinned] = useState(() => getItem('jadwalku:sidebar_pinned', false))
  const [searchOpen, setSearchOpen] = useState(false)
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  useEffect(() => {
    setItem('jadwalku:sidebar_pinned', isPinned)
  }, [isPinned])

  // Shortcut global: Cmd+K / Ctrl+K untuk toggle search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const todayString = now.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <div className="flex min-h-screen w-full bg-transparent text-on-background">
      {/* Sidebar spacer — reserves layout width for fixed sidebar */}
      <div
        aria-hidden="true"
        className={`hidden tablet:block shrink-0 transition-[width] duration-300 ease-in-out ${
          isPinned ? 'w-[280px]' : 'w-20'
        }`}
      />

      {/* Sidebar — permanently fixed to viewport at all scroll positions */}
      <aside
        className={`group fixed left-0 top-0 h-screen hidden tablet:block z-50 transition-[width] duration-300 ease-in-out ${
          isPinned ? 'w-[280px] shadow-level-2' : 'w-20 hover:w-[280px] hover:shadow-level-3'
        }`}
      >
        <nav
          style={{ viewTransitionName: 'sidebar' }}
          className="w-full h-full flex flex-col overflow-x-hidden overflow-y-auto border-r border-outline-variant/30 bg-surface-container-low py-lg dark:bg-surface-container-low"
        >
          {/* Logo & Brand Wordmark — fixed anchor point at x = 20px */}
          <div className="relative mb-xl flex items-center px-5 min-h-[48px]">
            <div className="flex items-center min-w-0">
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo JadwalKu" className="h-10 w-10 shrink-0" />
              <div className={labelCls(!isPinned, 'ml-3')}>
                <h1 className="text-headline-lg-mobile font-bold font-brand tracking-[-0.025em] desktop:text-headline-lg truncate">
                  <span className="text-on-surface">Jadwal</span>
                  <span className="text-primary">Ku</span>
                </h1>
                <p className="font-brand font-medium text-body-xs tracking-wider uppercase text-on-surface-variant/80 truncate mt-0.5">
                  ADMIN CONSOLE
                </p>
              </div>
            </div>

            {/* Pin Toggle Button — absolute positioning ensures 0px interference with collapsed logo */}
            <button
              type="button"
              onClick={() => setIsPinned((prev) => !prev)}
              title={isPinned ? 'Lepaskan sidebar (Auto-tutup)' : 'Kunci sidebar (Tetap terbuka)'}
              aria-label={isPinned ? 'Lepaskan sidebar' : 'Kunci sidebar'}
              className={`absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                isPinned
                  ? 'bg-primary/15 text-primary opacity-100'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
              }`}
            >
              <Icon name="push_pin" size={18} filled={isPinned} className={isPinned ? '-rotate-45 text-primary' : ''} />
            </button>
          </div>
          <ul className="flex-1 space-y-1.5 px-4">
            {ADMIN_NAV.map((item) => (
              <li key={item.to}>
                <AdminNavItem item={item} isPinned={isPinned} />
              </li>
            ))}
          </ul>
          <AdminAccount isPinned={isPinned} />
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 w-full flex-1 flex-col">
        {/* Top app bar — Sticky Header (Matching AppLayout h-[72px]) */}
        <header className="shrink-0 sticky top-0 z-40 h-[72px] flex items-center bg-surface-container-lowest/95 dark:bg-surface-container-low/95 px-md tablet:px-lg desktop:px-xl backdrop-blur-md border-b border-outline-variant/30 shadow-level-1 transition-colors">
          <div className="mx-auto flex w-full max-w-container-max items-center justify-between gap-md relative">
            {/* Left: Mobile Logo + Live Clock or Desktop Admin Console Status Badge */}
            <div className="flex items-center gap-2 tablet:gap-2 shrink-0 min-w-0">
              {/* Mobile Header: Logo + Live Clock Chip (Matching Student view) */}
              <div className="flex items-center gap-2 tablet:hidden">
                <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="JadwalKu" className="h-9 w-9 shrink-0" />
                <div className="flex items-center gap-1 rounded-full bg-surface-container-high/70 dark:bg-surface-container-high/60 border border-outline-variant/30 px-2.5 py-1 text-label-caps font-bold text-on-surface shadow-level-1">
                  <Icon name="schedule" size={13} className="text-primary shrink-0" />
                  <span className="text-label-caps tracking-tight">{timeString} WIB</span>
                </div>
              </div>

              {/* Desktop Left: Admin Console Status Pill (Matching Student Pill dimensions) */}
              <div className="hidden tablet:flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-high/60 px-4 py-2 text-body-sm font-semibold text-on-surface shadow-level-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-primary">Admin Console</span>
              </div>
            </div>

            {/* Center: Large & Solid Search Bar (Desktop/Tablet) */}
            <div className="hidden tablet:flex flex-1 min-w-[160px] max-w-[400px] justify-center mx-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="group flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-full border border-outline-variant/35 bg-surface-container/70 dark:bg-surface-container-high/60 hover:bg-surface-container hover:border-primary/50 px-4 text-body-sm text-on-surface-variant transition-all shadow-level-1 cursor-pointer text-left"
                aria-label="Pencarian Cepat (Ctrl+K)"
              >
                <div className="flex min-w-0 items-center gap-2 text-on-surface-variant/75 group-hover:text-on-surface">
                  <Icon name="search" size={18} className="group-hover:text-primary transition-colors shrink-0" />
                  <span className="text-body-sm font-medium truncate whitespace-nowrap">Cari MK, dosen, ruang...</span>
                </div>
                <kbd className="hidden desktop:inline-flex shrink-0 items-center gap-0.5 rounded-md border border-outline-variant/40 bg-surface-container-highest/80 px-2 py-0.5 text-label-caps font-mono font-semibold text-on-surface-variant">
                  Ctrl K
                </kbd>
              </button>
            </div>

            {/* Right: Date & Clock + Switch Mode + Mobile Search + Theme Toggle */}
            <div className="flex items-center gap-2 tablet:gap-2 shrink-0">
              {/* Today's Date & Live Clock Chip (Matching Student View, text-sm, px-4 py-2) */}
              <div className="hidden desktop:flex items-center gap-2 whitespace-nowrap rounded-full bg-surface-container-high/60 px-4 py-2 text-body-sm font-semibold text-on-surface-variant border border-outline-variant/25 shadow-level-1 shrink-0">
                <Icon name="schedule" size={16} className="text-primary shrink-0" />
                <span>{todayString}</span>
                <span className="text-outline-variant/50">·</span>
                <span className="text-on-surface font-semibold">{timeString} WIB</span>
              </div>

              {/* Mobile: Switch to Mode Mahasiswa Button (Icon-only) */}
              <NavLink
                to="/"
                viewTransition
                title="Beralih ke Mode Mahasiswa"
                aria-label="Mode Mahasiswa"
                className="tablet:hidden flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors shadow-level-1"
              >
                <Icon name="school" size={19} />
              </NavLink>

              {/* Mobile Search button (icon only for mobile screens) */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search (Ctrl+K)"
                title="Pencarian Cepat (Ctrl+K)"
                className={`tablet:hidden relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  searchOpen
                    ? 'bg-primary text-on-primary shadow-level-1'
                    : 'bg-primary/10 text-primary hover:bg-primary-container hover:text-on-primary-container'
                }`}
              >
                <Icon name="search" size={18} />
              </button>

              {/* Theme Switcher Button */}
              <button
                type="button"
                onClick={() => setTheme(nextTheme)}
                aria-label={`Ganti ke mode ${nextTheme === 'dark' ? 'gelap' : 'terang'}`}
                title={`Mode ${nextTheme === 'dark' ? 'Gelap' : 'Terang'}`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high/60 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface shadow-level-1"
              >
                <Icon name={nextTheme === 'dark' ? 'dark_mode' : 'light_mode'} size={18} />
              </button>
            </div>
          </div>
        </header>

        <OfflineBanner />

        <main className="mx-auto w-full max-w-container-max flex-1 px-md pb-20 tablet:pb-4 pt-2.5 tablet:pt-3.5 desktop:px-xl overflow-x-hidden">
          <Outlet />
        </main>

        {/* Global Search Dialog Modal */}
        <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

        {/* Floating Bottom Nav untuk Admin Console Mobile */}
        <AdminBottomNav />
      </div>
    </div>
  )
}
