import { Link, NavLink, Outlet } from 'react-router-dom'
import { ADMIN_NAV } from '../../lib/navigation'
import { Icon } from '../Icon'
import { OfflineBanner } from '../OfflineBanner'
import { useAdminAuth } from '../../hooks/useAdminAuth'

function AdminNavItem({ item, onNavigate }) {
  return (
    <NavLink to={item.to} onClick={onNavigate}>
      {({ isActive }) => (
        <span
          className={`flex items-center gap-md rounded-full px-md py-sm text-body-lg transition-colors duration-200 ${
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
  )
}

/** Baris akun admin di dasar sidebar: email + tombol keluar. */
function AdminAccount() {
  const { user, signOutAdmin } = useAdminAuth()
  if (!user) return null

  return (
    <div className="border-t border-surface-variant px-md py-base">
      <div className="mb-xs flex items-center gap-sm">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
          <Icon name="account_circle" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-body-sm font-semibold text-on-surface">
            {user.email}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {user.demo ? 'Mode Demo (tanpa backend)' : 'Administrator'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={signOutAdmin}
        className="flex w-full items-center gap-sm rounded-lg px-md py-sm text-body-sm text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error"
      >
        <Icon name="logout" size={18} />
        Keluar
      </button>
      <Link
        to="/"
        className="flex w-full items-center gap-sm rounded-lg px-md py-sm text-body-sm text-on-surface-variant transition-colors hover:bg-surface-container"
      >
        <Icon name="arrow_back" size={18} />
        Mode Mahasiswa
      </Link>
    </div>
  )
}

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-transparent text-on-background">
      {/* Sidebar — tablet ke atas */}
      <nav className="fixed left-0 top-0 hidden h-screen w-sidebar-width shrink-0 flex-col border-r border-surface-variant bg-surface py-lg tablet:flex dark:bg-surface-container-low">
        <div className="mb-xl px-lg">
          <h1 className="text-headline-lg-mobile font-bold text-primary">
            JadwalKu
          </h1>
          <p className="text-body-sm text-on-surface-variant">Admin Console</p>
        </div>
        <ul className="flex-1 space-y-2 px-md">
          {ADMIN_NAV.map((item) => (
            <li key={item.to}>
              <AdminNavItem item={item} />
            </li>
          ))}
        </ul>
        <AdminAccount />
      </nav>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col tablet:ml-sidebar-width">
        {/* Top app bar — mobile */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-sm bg-surface px-md shadow-sm tablet:hidden dark:bg-surface-container-low">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
            JK
          </span>
          <h1 className="text-headline-lg-mobile font-bold text-primary">
            JadwalKu
          </h1>
          <Link
            to="/"
            className="ml-auto flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1.5 text-label-caps text-on-surface-variant transition-colors hover:bg-surface-container-highest"
          >
            <Icon name="arrow_back" size={14} />
            Mahasiswa
          </Link>
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
