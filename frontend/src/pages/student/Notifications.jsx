import { useMemo } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { groupByDay } from '../../lib/notificationEngine'
import { NotificationItem } from '../../components/NotificationItem'
import { EmptyState } from '../../components/EmptyState'
import { Icon } from '../../components/Icon'

const GROUPS = [
  { key: 'today', label: 'Hari ini', dim: '' },
  { key: 'yesterday', label: 'Kemarin', dim: 'opacity-80' },
  { key: 'earlier', label: 'Lebih awal', dim: 'opacity-70' },
]

export default function Notifications() {
  const { items, unreadCount, markRead, markAllRead, clearAll } = useNotifications()
  const groups = useMemo(() => groupByDay(items), [items])

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-lg">
        <h2 className="text-display text-on-surface">Pengingat</h2>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon="notifications_off"
          title="Tidak ada pengingat"
          description="Pengingat kelas, deadline tugas, ujian, dan perubahan jadwal akan muncul di sini."
        />
      ) : (
        <>
          {/* Action bar */}
          <div className="mb-xl flex items-center justify-between gap-sm">
            <p className="text-body-lg text-on-surface-variant">
              Anda memiliki {unreadCount} pengingat baru.
            </p>
            <button
              type="button"
              onClick={unreadCount > 0 ? markAllRead : clearAll}
              className={`flex items-center gap-xs bg-transparent text-title-md transition-colors ${
                unreadCount > 0 ? 'text-primary hover:text-surface-tint' : 'text-secondary hover:text-on-surface'
              }`}
            >
              <Icon name={unreadCount > 0 ? 'done_all' : 'delete_sweep'} size={20} />
              {unreadCount > 0 ? 'Tandai semua sudah dibaca' : 'Hapus semua'}
            </button>
          </div>

          {GROUPS.map(({ key, label, dim }) =>
            groups[key].length > 0 ? (
              <section key={key} className={`mb-xl ${dim}`}>
                <h3 className="mb-sm uppercase tracking-wider text-label-caps text-outline">
                  {label}
                </h3>
                <div className="flex flex-col gap-sm">
                  {groups[key].map((item) => (
                    <NotificationItem key={item.id} item={item} onMarkRead={markRead} />
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </>
      )}
    </div>
  )
}
