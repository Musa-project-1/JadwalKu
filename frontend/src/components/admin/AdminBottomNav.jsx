import { NavLink } from 'react-router-dom'
import { Icon } from '../Icon'

/**
 * Floating Pill Nav — Admin Console Mobile (`tablet:hidden`).
 * 5 Tab Utama Admin:
 * 1. Dashboard (/admin/dashboard)
 * 2. Kelola Jadwal (/admin/jadwal)
 * 3. MK & Dosen (/admin/mata-kuliah)
 * 4. Ujian (/admin/ujian)
 * 5. Pengaturan (/admin/pengaturan-akademik)
 */

const ADMIN_BOTTOM_TABS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/jadwal', label: 'Jadwal', icon: 'edit_calendar' },
  { to: '/admin/mata-kuliah', label: 'Matkul', icon: 'menu_book' },
  { to: '/admin/ujian', label: 'Ujian', icon: 'event_note' },
  { to: '/admin/pengaturan-akademik', label: 'Pengaturan', icon: 'settings' },
]

export function AdminBottomNav({ onOpenSettings }) {
  return (
    <nav
      aria-label="Navigasi Admin Utama"
      className="fixed left-1/2 z-40 -translate-x-1/2 tablet:hidden"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
    >
      <ul className="flex items-center gap-0.5 rounded-full border border-white/10 bg-surface-container-lowest/90 px-2 py-1.5 shadow-level-2 backdrop-blur-xl dark:bg-surface-container-low/90">
        {ADMIN_BOTTOM_TABS.slice(0, 4).map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.to === '/admin/dashboard'} viewTransition>
              {({ isActive }) => (
                <span
                  className={`flex w-[62px] flex-col items-center gap-0.5 rounded-full py-1 text-label-caps tracking-tight transition-all duration-200 active:opacity-80 ${
                    isActive
                      ? 'font-bold text-primary'
                      : 'font-normal text-on-surface-variant'
                  }`}
                >
                  <span
                    className={`flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-container/50 shadow-[0_0_16px_rgb(var(--c-primary)/0.25)] dark:bg-primary/15'
                        : ''
                    }`}
                  >
                    <Icon name={item.icon} size={21} filled={isActive} />
                  </span>
                  <span className="whitespace-nowrap text-center leading-tight">{item.label}</span>
                </span>
              )}
            </NavLink>
          </li>
        ))}

        {/* Tab ke-5: Pengaturan (Membuka Modal Pengaturan Admin) */}
        <li>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex w-[62px] flex-col items-center gap-0.5 rounded-full py-1 text-label-caps tracking-tight transition-all duration-200 active:opacity-80 font-normal text-on-surface-variant cursor-pointer"
          >
            <span className="flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200">
              <Icon name="settings" size={21} />
            </span>
            <span className="whitespace-nowrap text-center leading-tight">Pengaturan</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}

