import { Navigate, Outlet } from 'react-router-dom'
import { Skeleton } from '../Skeleton'
import { useAdminAuth } from '../../hooks/useAdminAuth'

/**
 * Pembatas rute admin: tunggu status auth Firebase, lalu arahkan ke
 * /admin/login bila belum masuk.
 */
export function RequireAdmin() {
  const { user, initializing } = useAdminAuth()

  if (initializing) {
    return (
      <div className="mx-auto max-w-md space-y-md p-xl">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
