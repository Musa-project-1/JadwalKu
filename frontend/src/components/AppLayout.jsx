import { Link, Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Icon } from './Icon'
import { OfflineBanner } from './OfflineBanner'
import { Sidebar } from './Sidebar'
import { useNotifications } from '../hooks/useNotifications'

/** Tombol lonceng dengan badge jumlah belum dibaca (mengikuti referensi header). */
function BellButton() {
  const { unreadCount } = useNotifications()
  return (
    <Link
      to="/notifikasi"
      aria-label={`Notifikasi${unreadCount > 0 ? ` (${unreadCount} belum dibaca)` : ''}`}
      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary-container hover:text-on-primary-container"
    >
      <Icon name="notifications" filled={unreadCount > 0} />
      {unreadCount > 0 && (
        <span aria-hidden="true" className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
      )}
    </Link>
  )
}

export function AppLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Top app bar mobile — logo + lonceng notifikasi */}
        <header className="flex items-center gap-sm px-md py-base tablet:hidden">
          <img src="/logo.svg" alt="Logo JadwalKu" className="h-9 w-9" />
          <h1 className="text-headline-lg-mobile font-bold text-primary">
            JadwalKu
          </h1>
          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/cari"
              aria-label="Search"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary-container hover:text-on-primary-container"
            >
              <Icon name="search" />
            </Link>
            <BellButton />
          </div>
        </header>
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
