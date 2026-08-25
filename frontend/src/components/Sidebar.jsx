import { NavLink } from 'react-router-dom'
import { useApp } from '../hooks/useApp'
import { useNotifications } from '../hooks/useNotifications'
import { Icon } from './Icon'

const SIDEBAR_LINKS = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/jadwal', label: 'Jadwal', icon: 'calendar_month' },
  { to: '/tugas', label: 'Tugas', icon: 'checklist' },
  { to: '/ujian', label: 'Ujian', icon: 'edit_note' },
  { to: '/cari', label: 'Search', icon: 'search' },
  { to: '/notifikasi', label: 'Notifikasi', icon: 'notifications', badge: true },
]

// Label: fades + slides in on hover only
const labelCls =
  'overflow-hidden whitespace-nowrap transition-[opacity,max-width,margin] duration-300 ease-in-out max-w-0 opacity-0 ml-0 pointer-events-none group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-md group-hover:pointer-events-auto'

const labelClsSm =
  'overflow-hidden whitespace-nowrap transition-[opacity,max-width,margin] duration-300 ease-in-out max-w-0 opacity-0 ml-0 pointer-events-none group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-sm group-hover:pointer-events-auto'

/**
 * Sidebar desktop — stateless. Permanently collapsed to 80px icon rail.
 * Overlays to 280px on hover. No button, no state, no layout shift.
 */
export function Sidebar() {
  const { theme, setTheme } = useApp()
  const { unreadCount } = useNotifications()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <div className="relative hidden h-screen w-20 shrink-0 tablet:block">
      <div className="group absolute left-0 top-0 h-screen w-20 transition-[width] duration-300 ease-in-out z-40 hover:w-[280px] hover:shadow-xl">
        <nav style={{ viewTransitionName: 'sidebar' }} className="w-full h-full flex flex-col overflow-x-hidden overflow-y-auto border-r border-outline-variant/50 bg-surface py-lg dark:bg-surface">

          {/* Logo */}
          <div className="mb-xl flex items-center px-3 transition-[padding] duration-300 ease-in-out group-hover:px-lg">
            <img src="/logo.svg" alt="Logo JadwalKu" className="h-10 w-10 shrink-0" />
            <div className={labelClsSm}>
              <h1 className="text-headline-lg-mobile font-bold text-primary desktop:text-headline-lg truncate">
                JadwalKu
              </h1>
              <p className="text-[11px] text-on-surface-variant truncate">Manajemen Jadwal Kuliah</p>
            </div>
          </div>

          {/* Nav links */}
          <ul className="flex-1 space-y-1 px-2">
            {SIDEBAR_LINKS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'} viewTransition>
                  {({ isActive }) => (
                    <span
                      title={item.label}
                      className={`flex w-full items-center rounded-full py-sm px-3 transition-[padding,background-color] duration-300 ease-in-out group-hover:px-md ${
                        isActive
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                        <Icon name={item.icon} size={22} filled={isActive} />
                        {item.badge && unreadCount > 0 && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-error text-[8px] font-bold text-on-error transition-opacity duration-300 group-hover:opacity-0">
                            {unreadCount}
                          </span>
                        )}
                      </span>
                      <span className={labelCls}>{item.label}</span>
                      {item.badge && unreadCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 max-w-0 overflow-hidden items-center justify-center rounded-full bg-error px-1 text-label-caps text-on-error opacity-0 pointer-events-none transition-[opacity,max-width] duration-300 group-hover:max-w-[30px] group-hover:opacity-100">
                          {unreadCount}
                        </span>
                      )}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="px-2 transition-[padding] duration-300 ease-in-out group-hover:px-md">
            <div className="border-t border-outline-variant/40 pt-1">
              <NavLink
                to="/pengaturan"
                viewTransition
                title="Pengaturan"
                className={({ isActive }) =>
                  `flex w-full items-center rounded-full py-sm px-3 transition-[padding,background-color] duration-300 ease-in-out group-hover:px-md ${
                    isActive
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`
                }
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                  <Icon name="settings" size={22} />
                </span>
                <span className={labelCls}>Pengaturan</span>
              </NavLink>
              <NavLink
                to="/admin/login"
                viewTransition
                title="Panel Admin"
                className={({ isActive }) =>
                  `flex w-full items-center rounded-full py-sm px-3 transition-[padding,background-color] duration-300 ease-in-out group-hover:px-md ${
                    isActive
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`
                }
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                  <Icon name="admin_panel_settings" size={22} />
                </span>
                <span className={labelCls}>Panel Admin</span>
              </NavLink>
              <button
                type="button"
                onClick={() => setTheme(nextTheme)}
                title={`Mode ${nextTheme === 'dark' ? 'gelap' : 'terang'}`}
                className="flex w-full items-center rounded-full py-sm px-3 text-on-surface-variant transition-[padding,background-color] duration-300 ease-in-out hover:bg-surface-container-high group-hover:px-md"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                  <Icon name={nextTheme === 'dark' ? 'dark_mode' : 'light_mode'} size={22} />
                </span>
                <span className={labelCls}>Mode {nextTheme === 'dark' ? 'gelap' : 'terang'}</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
