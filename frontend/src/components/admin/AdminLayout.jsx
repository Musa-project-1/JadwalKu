import { Link, NavLink, Outlet } from 'react-router-dom'
import { ADMIN_NAV } from '../../lib/navigation'
import { Icon } from '../Icon'
import { OfflineBanner } from '../OfflineBanner'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { useApp } from '../../hooks/useApp'

// Shared label class helper — only opacity + max-width transition, NO scale
function labelCls(isCollapsed, spacing = 'ml-md') {
  return `overflow-hidden whitespace-nowrap transition-[opacity,max-width,margin] duration-300 ease-in-out ${
    isCollapsed
      ? `max-w-0 opacity-0 ml-0 pointer-events-none group-hover:max-w-[200px] group-hover:opacity-100 group-hover:${spacing} group-hover:pointer-events-auto`
      : `max-w-[200px] opacity-100 ${spacing}`
  }`
}

function AdminNavItem({ item, onNavigate, isCollapsed }) {
  return (
    <NavLink to={item.to} onClick={onNavigate} end={item.to === '/admin/dashboard'}>
      {({ isActive }) => (
        <span
          title={isCollapsed ? item.label : undefined}
          className={`flex w-full items-center rounded-full py-sm text-body-lg transition-[padding,background-color] duration-300 ease-in-out ${
            isCollapsed ? 'px-3 group-hover:px-md' : 'px-md'
          } ${
            isActive
              ? 'bg-primary/10 font-medium text-primary'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center">
            <Icon name={item.icon} size={22} filled={isActive} />
          </span>
          <span className={labelCls(isCollapsed)}>
            {item.label}
          </span>
        </span>
      )}
    </NavLink>
  )
}

/** Baris akun admin di dasar sidebar: email + tombol keluar. */
function AdminAccount({ isCollapsed }) {
  const { user, signOutAdmin } = useAdminAuth()
  const { theme, setTheme } = useApp()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  if (!user) return null

  return (
    <div className="px-2 transition-[padding] duration-300 ease-in-out group-hover:px-md">
      <div className="border-t border-outline-variant/40 pt-1">
        {/* Account info row + logout merged */}
        <div className="flex items-center rounded-full py-sm px-3 transition-[padding] duration-300 ease-in-out group-hover:px-md">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icon name="account_circle" size={16} />
          </span>
          <div className={labelCls(isCollapsed, 'ml-md')}>
            <p className="truncate text-[12px] font-semibold text-on-surface leading-tight">
              {user.email}
            </p>
            <p className="text-[10px] text-on-surface-variant leading-none mt-0.5">
              {user.demo ? 'Mode Demo' : 'Administrator'}
            </p>
          </div>
          {/* Logout icon — only visible when expanded */}
          <button
            type="button"
            onClick={signOutAdmin}
            title="Keluar"
            className={`ml-auto shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant/60 hover:bg-error/10 hover:text-error transition-[opacity,background-color,color] duration-200 ${
              isCollapsed ? 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto' : 'opacity-100'
            }`}
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
        <NavLink
          to="/pengaturan"
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
          <span className={labelCls(isCollapsed)}>Pengaturan</span>
        </NavLink>
        <NavLink
          to="/"
          end
          viewTransition
          className={({ isActive }) =>
            `flex w-full items-center rounded-full py-sm px-3 transition-[padding,background-color] duration-300 ease-in-out group-hover:px-md ${
              isActive
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`
          }
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center">
            <Icon name="arrow_back" size={22} />
          </span>
          <span className={labelCls(isCollapsed)}>Mode Mahasiswa</span>
        </NavLink>
        <button
          type="button"
          onClick={() => setTheme(nextTheme)}
          className="flex w-full items-center rounded-full py-sm px-3 text-on-surface-variant transition-[padding,background-color] duration-300 ease-in-out hover:bg-surface-container-high group-hover:px-md"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center">
            <Icon name={nextTheme === 'dark' ? 'dark_mode' : 'light_mode'} size={22} />
          </span>
          <span className={labelCls(isCollapsed)}>
            Mode {nextTheme === 'dark' ? 'gelap' : 'terang'}
          </span>
        </button>
      </div>
    </div>
  )
}


export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-transparent text-on-background">
      {/* Sidebar — permanent 80px spacer, overlays to 280px on hover */}
      <div className="relative hidden h-screen w-20 shrink-0 tablet:block">
        <div className="group absolute left-0 top-0 h-screen w-20 transition-[width] duration-300 ease-in-out z-40 hover:w-[280px] hover:shadow-xl">
          <nav style={{ viewTransitionName: 'sidebar' }} className="w-full h-full flex flex-col overflow-x-hidden overflow-y-auto border-r border-outline-variant/50 bg-surface py-lg dark:bg-surface">
            {/* Logo */}
            <div className="mb-xl flex items-center px-3 transition-[padding] duration-300 ease-in-out group-hover:px-lg">
              <img src="/logo.svg" alt="Logo JadwalKu" className="h-10 w-10 shrink-0" />
              <div className={labelCls(true, 'ml-sm')}>
                <h1 className="text-headline-lg-mobile font-bold text-primary desktop:text-headline-lg truncate">
                  JadwalKu
                </h1>
                <p className="text-[11px] text-on-surface-variant truncate">Admin Console</p>
              </div>
            </div>
            <ul className="flex-1 space-y-1 px-2">
              {ADMIN_NAV.map((item) => (
                <li key={item.to}>
                  <AdminNavItem item={item} isCollapsed={true} />
                </li>
              ))}
            </ul>
            <AdminAccount isCollapsed={true} />
          </nav>
        </div>
      </div>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
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
