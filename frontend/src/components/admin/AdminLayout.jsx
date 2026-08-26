import { useState, useEffect } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ADMIN_NAV } from '../../lib/navigation'
import { Icon } from '../Icon'
import { OfflineBanner } from '../OfflineBanner'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { useApp } from '../../hooks/useApp'
import { getItem, setItem } from '../../lib/storage'

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
          className={`flex w-full items-center rounded-full h-12 px-3.5 transition-colors duration-200 ${
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
    <div className="px-3.5">
      <div className="border-t border-outline-variant/40 pt-2 space-y-1">
        {/* Account info row + logout */}
        <div className="flex w-full items-center rounded-full h-12 px-3.5 transition-colors duration-200 text-on-surface-variant hover:bg-surface-container-high">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icon name="account_circle" size={18} />
          </span>
          <div className={labelCls(!isPinned, 'ml-3.5')}>
            <p className="truncate text-[12px] font-semibold text-on-surface leading-tight">
              {user.email}
            </p>
            <p className="text-[10px] text-on-surface-variant leading-none mt-0.5">
              {user.demo ? 'Mode Demo' : 'Administrator'}
            </p>
          </div>
          {/* Logout icon — only visible when expanded or pinned */}
          <button
            type="button"
            onClick={signOutAdmin}
            title="Keluar"
            className={`ml-auto shrink-0 h-7 w-7 items-center justify-center rounded-full text-on-surface-variant/60 hover:bg-error/10 hover:text-error transition-colors ${
              isPinned ? 'flex' : 'hidden group-hover:flex'
            }`}
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
        <NavLink
          to="/pengaturan"
          title="Pengaturan"
          className={({ isActive }) =>
            `flex w-full items-center rounded-full h-12 px-3.5 transition-colors duration-200 ${
              isActive
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`
          }
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center">
            <Icon name="settings" size={24} />
          </span>
          <span className={labelCls(!isPinned, 'ml-3.5')}>Pengaturan</span>
        </NavLink>
      </div>
    </div>
  )
}


export function AdminLayout() {
  const { theme, setTheme } = useApp()
  const [isPinned, setIsPinned] = useState(() => getItem('jadwalku:sidebar_pinned', false))
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  useEffect(() => {
    setItem('jadwalku:sidebar_pinned', isPinned)
  }, [isPinned])

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const todayString = now.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <div className="flex min-h-screen bg-transparent text-on-background">
      {/* Sidebar — permanent spacer with pin transition */}
      <div className={`sticky top-0 hidden h-screen shrink-0 tablet:block z-50 transition-[width] duration-300 ease-in-out ${isPinned ? 'w-[280px]' : 'w-20'}`}>
        <div className={`group absolute left-0 top-0 h-screen transition-[width] duration-300 ease-in-out z-50 ${isPinned ? 'w-[280px] shadow-lg' : 'w-20 hover:w-[280px] hover:shadow-2xl'}`}>
          <nav style={{ viewTransitionName: 'sidebar' }} className="w-full h-full flex flex-col overflow-x-hidden overflow-y-auto border-r border-outline-variant/30 bg-surface-container-low py-lg dark:bg-surface-container-low">
            {/* Logo & Brand Wordmark — fixed anchor point at x = 20px */}
            <div className="relative mb-xl flex items-center px-5 min-h-[48px]">
              <div className="flex items-center min-w-0">
                <img src="/logo.svg" alt="Logo JadwalKu" className="h-10 w-10 shrink-0" />
                <div className={labelCls(!isPinned, 'ml-3')}>
                  <h1 className="text-headline-lg-mobile font-bold font-brand tracking-[-0.025em] desktop:text-headline-lg truncate">
                    <span className="text-on-surface">Jadwal</span>
                    <span className="text-primary">Ku</span>
                  </h1>
                  <p className="font-brand font-medium text-[10.5px] tracking-[0.09em] uppercase text-on-surface-variant/80 truncate mt-0.5">
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
            <ul className="flex-1 space-y-1.5 px-3.5">
              {ADMIN_NAV.map((item) => (
                <li key={item.to}>
                  <AdminNavItem item={item} isPinned={isPinned} />
                </li>
              ))}
            </ul>
            <AdminAccount isPinned={isPinned} />
          </nav>
        </div>
      </div>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Top app bar — Generous Height (72px), Crisp & High-Affordance */}
        <header className="sticky top-0 z-30 h-[72px] flex items-center bg-surface-container-lowest/95 dark:bg-surface-container-low/95 px-md tablet:px-lg desktop:px-xl backdrop-blur-md border-b border-outline-variant/30 shadow-xs transition-colors">
          <div className="mx-auto flex w-full max-w-container-max items-center justify-between gap-md relative">
            {/* Left: Mobile Header or Desktop Admin Console Status Badge */}
            <div className="flex items-center gap-2.5 shrink-0 min-w-0">
              {/* Mobile Header: Logo + Title */}
              <div className="flex items-center gap-sm tablet:hidden">
                <img src="/logo.svg" alt="Logo JadwalKu" className="h-9 w-9" />
                <h1 className="text-headline-lg-mobile font-bold font-brand tracking-[-0.025em]">
                  <span className="text-on-surface">Jadwal</span>
                  <span className="text-primary">Ku</span>
                </h1>
              </div>

              {/* Desktop Left: Admin Console Status Badge (text-sm, px-4 py-2) */}
              <div className="hidden tablet:flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-body-sm font-bold text-primary shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Admin Console</span>
              </div>
            </div>

            {/* Right: Date & Clock + Mode Mahasiswa Switcher + Theme Toggle */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Today's Date & Live Clock Chip (Matching Student View, text-sm, px-4 py-2) */}
              <div className="hidden desktop:flex items-center gap-2 rounded-full bg-surface-container-high/60 px-4 py-2 text-body-sm font-semibold text-on-surface-variant border border-outline-variant/25 shadow-xs">
                <Icon name="schedule" size={16} className="text-primary shrink-0" />
                <span>{todayString}</span>
                <span className="text-outline-variant/50">·</span>
                <span className="text-on-surface font-semibold">{timeString} WIB</span>
              </div>

              {/* Mode Mahasiswa Switcher Button (text-sm, px-4 py-2) */}
              <Link
                to="/"
                viewTransition
                title="Kembali ke Mode Mahasiswa"
                className="group flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-high/70 px-4 py-2 text-body-sm font-bold text-on-surface hover:border-primary/60 hover:bg-primary/10 hover:text-primary transition-all shadow-xs"
              >
                <Icon name="arrow_back" size={15} className="opacity-60 group-hover:-translate-x-0.5 transition-transform text-on-surface-variant group-hover:text-primary" />
                <Icon name="school" size={18} className="text-primary" />
                <span className="hidden sm:inline">Mode Mahasiswa</span>
                <span className="sm:hidden">Mahasiswa</span>
              </Link>

              {/* Theme Switcher Button */}
              <button
                type="button"
                onClick={() => setTheme(nextTheme)}
                aria-label={`Ganti ke mode ${nextTheme === 'dark' ? 'gelap' : 'terang'}`}
                title={`Mode ${nextTheme === 'dark' ? 'Gelap' : 'Terang'}`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high/60 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface shadow-xs"
              >
                <Icon name={nextTheme === 'dark' ? 'dark_mode' : 'light_mode'} size={20} />
              </button>
            </div>
          </div>
        </header>

        <OfflineBanner />

        {/* Tab navigasi horizontal — mobile */}
        <nav className="sticky top-16 z-30 flex gap-xs overflow-x-auto border-b border-surface-variant bg-surface px-md py-sm tablet:hidden no-scrollbar dark:bg-surface-container-low">
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {({ isActive }) => (
                <span
                  className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-4 py-2 text-body-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high/60 text-on-surface-variant'
                  }`}
                >
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-container-max flex-1 px-md pb-xl pt-lg desktop:px-xl">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
