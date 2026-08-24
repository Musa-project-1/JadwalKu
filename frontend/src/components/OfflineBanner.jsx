import { useOnlineStatus } from '../hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null

  return (
    <div
      role="status"
      className="bg-amber-100 px-md py-2 text-center text-body-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
    >
      Mode offline — menampilkan data yang sudah tersimpan di perangkat.
    </div>
  )
}
