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
    const timer = setInterval(() => setNow(new Date()), 60_000)
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
    <div className="flex min-h-screen w-full bg-transparent">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 w-full flex-1 flex-col relative">
        {/* Top app bar — Sticky Header */}
        <header className="sticky top-0 z-40 h-[72px] flex items-center bg-surface-container-lowest/95 dark:bg-surface-container-low/95 px-md tablet:px-lg desktop:px-xl backdrop-blur-md border-b border-outline-variant/30 shadow-xs transition-colors">
          <div className="mx-auto flex w-full max-w-container-max items-center justify-between gap-md relative">
            {/* Left: Mobile Logo + Live Clock or Desktop Active Academic Program */}
            <div className="flex items-center gap-2 tablet:gap-2.5 shrink-0 min-w-0">
              {/* Mobile Header: Logo + Live Clock Chip */}
              <div className="flex items-center gap-2 tablet:hidden">
                <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="JadwalKu" className="h-9 w-9 shrink-0" />
                <div className="flex items-center gap-1 rounded-full bg-surface-container-high/70 dark:bg-surface-container-high/60 border border-outline-variant/30 px-2.5 py-1 text-label-caps font-bold text-on-surface shadow-2xs">
                  <Icon name="schedule" size={13} className="text-primary shrink-0" />
                  <span className="text-[11px] tracking-tight">{timeString} WIB</span>
                </div>
              </div>

              {/* Desktop: Active Academic Program & Semester Pill (text-sm, px-4 py-2) */}
              <Link
                to="/pengaturan"
                title="Ubah program studi / semester di Pengaturan"
                className="hidden tablet:flex group items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-high/60 px-4 py-2 text-body-sm font-semibold text-on-surface hover:border-primary/50 hover:bg-surface-container-highest transition-all shadow-xs"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-primary">
                  {program || 'Informatika'}
                </span>
                <span className="text-on-surface-variant font-medium">
                  · Sem {semester || '1'}
                </span>
                <Icon name="tune" size={15} className="text-on-surface-variant group-hover:text-primary transition-colors ml-0.5" />
              </Link>
            </div>

            {/* Center: Large & Solid Search Bar (Desktop/Tablet) */}
            <div className="hidden tablet:flex flex-1 min-w-[160px] max-w-[400px] justify-center mx-2">
              <button
                type="button"
                onClick={toggleSearch}
                className="group flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-full border border-outline-variant/35 bg-surface-container/70 dark:bg-surface-container-high/60 hover:bg-surface-container hover:border-primary/50 px-3.5 text-body-sm text-on-surface-variant transition-all shadow-xs cursor-pointer text-left"
                aria-label="Pencarian Cepat (Ctrl+K)"
              >
                <div className="flex min-w-0 items-center gap-2 text-on-surface-variant/75 group-hover:text-on-surface">
                  <Icon name="search" size={18} className="group-hover:text-primary transition-colors shrink-0" />
                  <span className="text-body-sm font-medium truncate whitespace-nowrap">Cari MK, dosen, ruang...</span>
                </div>
                <kbd className="hidden desktop:inline-flex shrink-0 items-center gap-0.5 rounded-md border border-outline-variant/40 bg-surface-container-highest/80 px-2 py-0.5 text-[11px] font-mono font-semibold text-on-surface-variant">
                  Ctrl K
                </kbd>
              </button>
            </div>

            {/* Right: Date & Clock + Switch Mode + Mobile Search + Bell + Theme Toggle */}
            <div className="flex items-center gap-1.5 tablet:gap-2 shrink-0">
              {/* Today's Date & Live Clock Chip (Desktop only, text-sm, px-3.5 py-1.5) */}
              <div className="hidden desktop:flex items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-container-high/60 px-3.5 py-1.5 text-body-sm font-semibold text-on-surface-variant border border-outline-variant/25 shadow-xs shrink-0">
                <Icon name="schedule" size={16} className="text-primary shrink-0" />
                <span>{todayString}</span>
                <span className="text-outline-variant/50">·</span>
                <span className="text-on-surface font-semibold">{timeString} WIB</span>
              </div>

              {/* Mobile: Switch to Mode Admin Button (Icon-only) */}
              <Link
                to="/admin/login"
                viewTransition
                title="Beralih ke Panel Admin"
                aria-label="Panel Admin"
                className="tablet:hidden flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary/20 transition-colors shadow-xs"
              >
                <Icon name="admin_panel_settings" size={19} />
              </Link>

              {/* Mobile Search button (icon only for mobile screens) */}
              <button
                type="button"
                onClick={toggleSearch}
                aria-label="Search (Ctrl+K)"
                title="Pencarian Cepat (Ctrl+K)"
                className={`tablet:hidden relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  searchOpen
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-primary/10 text-primary hover:bg-primary-container hover:text-on-primary-container'
                }`}
              >
                <Icon name="search" size={18} />
              </button>

              {/* Bell notification button with popover toggle */}
              <BellButton active={notifOpen} onToggle={toggleNotif} />

              {/* Quick Light/Dark Mode Switcher */}
              <button
                type="button"
                onClick={() => setTheme(nextTheme)}
                aria-label={`Ganti ke mode ${nextTheme === 'dark' ? 'gelap' : 'terang'}`}
                title={`Mode ${nextTheme === 'dark' ? 'Gelap' : 'Terang'}`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high/60 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface shadow-xs"
              >
                <Icon name={nextTheme === 'dark' ? 'dark_mode' : 'light_mode'} size={18} />
              </button>

              {/* Notification Popover */}
              <NotificationPopover open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
          </div>
        </header>

        {/* Global Quick Search Modal */}
        <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

        <OfflineBanner />
        <main className="mx-auto w-full max-w-container-max flex-1 px-md pb-24 pt-md tablet:pb-md desktop:px-lg overflow-x-hidden">
          {/* Kunci dengan pathname agar animasi masuk dipicu ulang tiap pindah halaman */}
          <div key={location.pathname} className="animate-page-enter w-full max-w-full min-w-0">
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
