import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Icon } from './Icon'
import { OfflineBanner } from './OfflineBanner'
import { Sidebar } from './Sidebar'
import { SearchModal } from './SearchModal'
import { NotificationPopover } from './NotificationPopover'
import { useNotifications } from '../hooks/useNotifications'
import { useApp } from '../hooks/useApp'

/** Tombol lonceng dengan badge jumlah belum dibaca — click to toggle popover */
function BellButton({ active, onToggle }) {
  const { unreadCount } = useNotifications()
  return (
    <button
      type="button"
      data-notif-trigger="true"
      onClick={onToggle}
      aria-label={`Notifikasi${unreadCount > 0 ? ` (${unreadCount} belum dibaca)` : ''}`}
      title="Notifikasi"
      className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
        active
          ? 'bg-primary text-on-primary shadow-sm'
          : 'bg-primary/10 text-primary hover:bg-primary-container hover:text-on-primary-container'
      }`}
    >
      <Icon name="notifications" filled={active || unreadCount > 0} />
      {unreadCount > 0 && !active && (
        <span aria-hidden="true" className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
      )}
    </button>
  )
}

export function AppLayout() {
  const location = useLocation()
  const { program, semester, theme, setTheme } = useApp()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

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

  const toggleSearch = () => {
    setSearchOpen((prev) => !prev)
    setNotifOpen(false)
  }

  const toggleNotif = () => {
    setNotifOpen((prev) => !prev)
    setSearchOpen(false)
  }

  // Shortcut global: Cmd+K / Ctrl+K untuk toggle search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggleSearch()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col relative">
        {/* Top app bar — enriched & balanced */}
        <header className="sticky top-0 z-40 bg-background/80 px-md py-2.5 backdrop-blur-md border-b border-outline-variant/10 desktop:px-lg">
          <div className="mx-auto flex w-full max-w-container-max items-center justify-between gap-sm relative">
            {/* Mobile Logo + Title */}
            <div className="flex items-center gap-sm tablet:hidden">
              <img src="/logo.svg" alt="Logo JadwalKu" className="h-9 w-9" />
              <h1 className="text-headline-lg-mobile font-bold font-sans tracking-[-0.02em]">
                <span className="text-on-surface">Jadwal</span>
                <span className="text-primary">Ku</span>
              </h1>
            </div>

            {/* Desktop Left: Active Academic Program & Semester Badge */}
            <div className="hidden tablet:flex items-center gap-2">
              <Link
                to="/pengaturan"
                title="Ubah program studi / semester di Pengaturan"
                className="group flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-high/50 px-3.5 py-1 text-label-caps text-on-surface hover:border-primary/50 hover:bg-surface-container-highest transition-all"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-primary">
                  {program || 'Informatika'}
                </span>
                <span className="text-on-surface-variant font-medium">
                  · Semester {semester || '1'}
                </span>
                <Icon name="tune" size={14} className="text-on-surface-variant group-hover:text-primary transition-colors ml-0.5" />
              </Link>

              {/* Today's Date & Live Clock Chip */}
              <div className="flex items-center gap-1.5 rounded-full bg-surface-container/50 px-3 py-1 text-[11px] font-semibold text-on-surface-variant border border-outline-variant/15 shadow-sm">
                <Icon name="schedule" size={13} className="text-primary" />
                <span>{todayString}</span>
                <span className="text-outline-variant/50">·</span>
                <span className="text-on-surface font-semibold">{timeString} WIB</span>
              </div>
            </div>

            {/* Top Right: Quick Actions (Panel Admin, Search, Theme Toggle, Notif Bell) */}
            <div className="ml-auto flex items-center gap-2 relative">
              {/* Panel Admin button */}
              <Link
                to="/admin/login"
                viewTransition
                title="Masuk ke Panel Admin"
                className="flex items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-container-high/60 px-3.5 py-1.5 text-body-sm font-semibold text-on-surface-variant hover:border-primary/50 hover:bg-surface-container-highest hover:text-primary transition-all"
              >
                <Icon name="admin_panel_settings" size={16} />
                <span className="hidden sm:inline">Panel Admin</span>
                <span className="sm:hidden">Admin</span>
              </Link>

              {/* Search button — round icon */}
              <button
                type="button"
                onClick={toggleSearch}
                aria-label="Search (Ctrl+K)"
                title="Pencarian Cepat (Ctrl+K)"
                className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  searchOpen
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-primary/10 text-primary hover:bg-primary-container hover:text-on-primary-container'
                }`}
              >
                <Icon name="search" />
              </button>

              {/* Quick Light/Dark Mode Switcher */}
              <button
                type="button"
                onClick={() => setTheme(nextTheme)}
                aria-label={`Ganti ke mode ${nextTheme === 'dark' ? 'gelap' : 'terang'}`}
                title={`Mode ${nextTheme === 'dark' ? 'Gelap' : 'Terang'}`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high/60 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
              >
                <Icon name={nextTheme === 'dark' ? 'dark_mode' : 'light_mode'} size={20} />
              </button>

              {/* Bell notification button with popover toggle */}
              <BellButton active={notifOpen} onToggle={toggleNotif} />

              {/* Notification Popover */}
              <NotificationPopover open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
          </div>
        </header>

        {/* Global Quick Search Modal */}
        <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

        <OfflineBanner />
        <main className="mx-auto w-full max-w-container-max flex-1 px-md pb-24 pt-md tablet:pb-md desktop:px-lg">
          {/* Kunci dengan pathname agar animasi masuk dipicu ulang tiap pindah halaman */}
          <div key={location.pathname} className="animate-page-enter">
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
