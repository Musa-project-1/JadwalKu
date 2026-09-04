import { useMemo } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { useApp } from '../../hooks/useApp'
import { groupByDay } from '../../lib/notificationEngine'
import { NotificationItem } from '../../components/NotificationItem'
import { EmptyState } from '../../components/EmptyState'
import { Icon } from '../../components/Icon'

export default function Notifications() {
  const { items, unreadCount, markRead, markAllRead, clearAll } = useNotifications()
  const { t } = useApp()
  const groups = useMemo(() => groupByDay(items), [items])

  const GROUPS = useMemo(() => [
    { key: 'today', label: t ? t('notifications.group_today') : 'Hari ini', dim: '' },
    { key: 'yesterday', label: t ? t('notifications.group_yesterday') : 'Kemarin', dim: 'opacity-80' },
    { key: 'earlier', label: t ? t('notifications.group_earlier') : 'Lebih awal', dim: 'opacity-70' },
  ], [t])

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-lg">
        <h2 className="text-display text-on-surface">
          {t ? t('notifications.title') : 'Pengingat'}
        </h2>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon="notifications_off"
          title={t ? t('notifications.empty_title') : 'Tidak ada pengingat'}
          description={t ? t('notifications.empty_desc') : 'Pengingat kelas, deadline tugas, ujian, dan perubahan jadwal akan muncul di sini.'}
        />
      ) : (
        <>
          {/* Action bar */}
          <div className="mb-xl flex items-center justify-between gap-sm">
            <p className="text-body-lg text-on-surface-variant">
              {t ? t('notifications.unread_count', { count: unreadCount }) : `Anda memiliki ${unreadCount} pengingat baru.`}
            </p>
            <button
              type="button"
              onClick={unreadCount > 0 ? markAllRead : clearAll}
              className={`flex items-center gap-xs bg-transparent text-title-md transition-colors ${
                unreadCount > 0 ? 'text-primary hover:text-surface-tint' : 'text-secondary hover:text-on-surface'
              }`}
            >
              <Icon name={unreadCount > 0 ? 'done_all' : 'delete_sweep'} size={20} />
              {unreadCount > 0
                ? (t ? t('notifications.mark_all_read') : 'Tandai semua sudah dibaca')
                : (t ? t('notifications.clear_all') : 'Hapus semua')}
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
