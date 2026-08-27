import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'
import { getItem, setItem } from '../lib/storage'
import { Icon } from './Icon'

const SIDEBAR_LINKS = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/jadwal', label: 'Jadwal', icon: 'calendar_month' },
  { to: '/tugas', label: 'Tugas', icon: 'checklist' },
  { to: '/ujian', label: 'Ujian', icon: 'edit_note' },
]

export function Sidebar() {
  const { unreadCount } = useNotifications()
  const [isPinned, setIsPinned] = useState(() => getItem('jadwalku:sidebar_pinned', false))

  useEffect(() => {
    setItem('jadwalku:sidebar_pinned', isPinned)
  }, [isPinned])

  // Dynamic label classes for smooth hover expansion / pinned state
  const labelCls = isPinned
    ? 'overflow-hidden whitespace-nowrap ml-3.5 max-w-[180px] opacity-100'
    : 'overflow-hidden whitespace-nowrap transition-[opacity,max-width,margin] duration-300 ease-in-out max-w-0 opacity-0 ml-0 pointer-events-none group-hover:max-w-[180px] group-hover:opacity-100 group-hover:ml-3.5 group-hover:pointer-events-auto'

  const labelClsSm = isPinned
    ? 'overflow-hidden whitespace-nowrap ml-3 max-w-[150px] opacity-100'
    : 'overflow-hidden whitespace-nowrap transition-[opacity,max-width,margin] duration-300 ease-in-out max-w-0 opacity-0 ml-0 pointer-events-none group-hover:max-w-[150px] group-hover:opacity-100 group-hover:ml-3 group-hover:pointer-events-auto'

  return (
    <>
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
          isPinned ? 'w-[280px] shadow-lg' : 'w-20 hover:w-[280px] hover:shadow-2xl'
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
              <div className={labelClsSm}>
                <h1 className="text-headline-lg-mobile font-bold font-brand tracking-[-0.025em] desktop:text-headline-lg truncate">
                  <span className="text-on-surface">Jadwal</span>
                  <span className="text-primary">Ku</span>
                </h1>
                <p className="font-brand font-medium text-[10.5px] tracking-[0.09em] uppercase text-on-surface-variant/80 truncate mt-0.5">
                  SCHEDULE SMARTER
                </p>
              </div>
            </div>

            {/* Pin Toggle Button — absolute position */}
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

          {/* Nav links — fixed coordinate anchor for rock-solid 60 FPS icon stability */}
          <ul className="flex-1 space-y-1.5 px-3.5">
            {SIDEBAR_LINKS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'} viewTransition>
                  {({ isActive }) => (
                    <span
                      title={item.label}
                      className={`flex w-full items-center rounded-full h-12 px-3.5 transition-colors duration-200 ${
                        isActive
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                        <Icon name={item.icon} size={24} filled={isActive} />
                        {item.badge && unreadCount > 0 && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-error text-[8px] font-bold text-on-error transition-opacity duration-300 group-hover:opacity-0">
                            {unreadCount}
                          </span>
                        )}
                      </span>
                      <span className={labelCls}>{item.label}</span>
                      {item.badge && unreadCount > 0 && (
                        <span className={`ml-auto flex h-5 min-w-5 overflow-hidden items-center justify-center rounded-full bg-error px-1 text-label-caps text-on-error transition-[opacity,max-width] duration-300 ${isPinned ? 'max-w-[30px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none group-hover:max-w-[30px] group-hover:opacity-100'}`}>
                          {unreadCount}
                        </span>
                      )}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Footer — fixed coordinate anchor matching nav items */}
          <div className="px-3.5">
            <div className="border-t border-outline-variant/40 pt-2 space-y-1">
              <NavLink
                to="/pengaturan"
                viewTransition
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
                <span className={labelCls}>Pengaturan</span>
              </NavLink>

              <NavLink
                to="/admin/login"
                viewTransition
                title="Mode Admin"
                className={({ isActive }) =>
                  `flex w-full items-center rounded-full h-12 px-3.5 transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`
                }
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center text-primary">
                  <Icon name="admin_panel_settings" size={24} />
                </span>
                <span className={labelCls}>Mode Admin</span>
              </NavLink>
            </div>
          </div>
        </nav>
      </aside>
    </>
  )
}
