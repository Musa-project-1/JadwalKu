import { NavLink } from 'react-router-dom'
import { STUDENT_NAV, SIDEBAR_EXTRA } from '../lib/navigation'
import { Icon } from './Icon'
import { useApp } from '../hooks/useApp'
import { useNotifications } from '../hooks/useNotifications'

const ITEM_BASE =
  'flex items-center gap-md rounded-full px-md py-sm text-body-lg transition-colors duration-200'

/**
 * Sidebar desktop — active state pill teal (PLAN §7), bukan border kiri.
 */
export function Sidebar() {
  const { theme, setTheme } = useApp()
  const { unreadCount } = useNotifications()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <nav className="sticky top-0 hidden h-screen w-sidebar-width shrink-0 flex-col overflow-y-auto border-r border-outline-variant/50 bg-surface py-lg tablet:flex dark:bg-surface">
      <div className="mb-xl px-lg">
        <div className="mb-xs flex items-center gap-sm">
          <img src="/logo.svg" alt="Logo JadwalKu" className="h-10 w-10" />
          <h1 className="text-headline-lg-mobile font-bold text-primary desktop:text-headline-lg">
            JadwalKu
          </h1>
        </div>
        <p className="text-body-sm text-on-surface-variant">Manajemen Jadwal Kuliah</p>
      </div>
      <ul className="flex-1 space-y-1 px-md">
        {STUDENT_NAV.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.to === '/'}>
              {({ isActive }) => (
                <span
                  className={`${ITEM_BASE} ${
                    isActive
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <Icon name={item.icon} size={22} filled={isActive} />
                  {item.label}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="space-y-0.5 px-md">
        <div className="border-t border-outline-variant/40 pt-2">
          {SIDEBAR_EXTRA.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {({ isActive }) => (
                <span
                  className={`flex w-full items-center gap-md rounded-full px-md py-2 text-body-sm transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <Icon name={item.icon} size={20} filled={isActive} />
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="space-y-0.5 px-md">
        <NavLink
          to="/notifikasi"
          className={({ isActive }) =>
            `flex w-full items-center gap-md rounded-full px-md py-2 text-body-sm transition-colors duration-200 ${
              isActive
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`
          }
        >
          <Icon name="notifications" size={20} />
          Notifikasi
          {unreadCount > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-label-caps text-on-error">
              {unreadCount}
            </span>
          )}
        </NavLink>
        <button
          type="button"
          onClick={() => setTheme(nextTheme)}
          className={`flex w-full items-center gap-md rounded-full px-md py-2 text-body-sm text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-high`}
        >
          <Icon name={nextTheme === 'dark' ? 'dark_mode' : 'light_mode'} size={20} />
          Mode {nextTheme === 'dark' ? 'gelap' : 'terang'}
        </button>
      </div>
    </nav>
  )
}
