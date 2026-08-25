import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'
import { groupByDay } from '../lib/notificationEngine'
import { NotificationItem } from './NotificationItem'
import { Icon } from './Icon'

const GROUPS = [
  { key: 'today', label: 'Hari ini', dim: '' },
  { key: 'yesterday', label: 'Kemarin', dim: 'opacity-80' },
  { key: 'earlier', label: 'Lebih awal', dim: 'opacity-70' },
]

export function NotificationPopover({ open, onClose }) {
  const { items, unreadCount, markRead, markAllRead, clearAll } = useNotifications()
  const groups = useMemo(() => groupByDay(items), [items])
  const popoverRef = useRef(null)

  // Close on Escape or click outside
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && open) onClose()
    }
    function handleClickOutside(e) {
      if (open && popoverRef.current && !popoverRef.current.contains(e.target)) {
        // Only close if click is not on the toggle button
        if (!e.target.closest('[data-notif-trigger]')) {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-12 z-50 w-[360px] sm:w-[420px] max-w-[calc(100vw-32px)] overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface/90 backdrop-blur-2xl dark:bg-surface-container-lowest/90 shadow-2xl animate-fade-up"
    >
      {/* Popover Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-3 bg-surface-container/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="rounded-full bg-error px-2 py-0.5 text-[10px] font-bold text-on-error">
              {unreadCount} baru
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {items.length > 0 && (
            <button
              type="button"
              onClick={unreadCount > 0 ? markAllRead : clearAll}
              title={unreadCount > 0 ? 'Tandai semua dibaca' : 'Hapus semua'}
              className="text-body-sm font-semibold text-primary hover:underline px-2 py-1"
            >
              {unreadCount > 0 ? 'Baca semua' : 'Bersihkan'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-on-surface-variant hover:text-on-surface"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[65vh] overflow-y-auto p-3 space-y-3">
        {items.length === 0 ? (
          <div className="py-8 text-center text-on-surface-variant">
            <Icon name="notifications_off" size={40} className="mx-auto mb-2 opacity-40 text-primary" />
            <p className="text-body-md font-semibold text-on-surface">Tidak ada notifikasi</p>
            <p className="text-body-sm text-on-surface-variant/70 mt-0.5">
              Pengingat kelas dan deadline tugas akan muncul di sini.
            </p>
          </div>
        ) : (
          GROUPS.map(({ key, label, dim }) =>
            groups[key].length > 0 ? (
              <section key={key} className={dim}>
                <h4 className="mb-1.5 px-1 uppercase tracking-wider text-[11px] font-bold text-outline">
                  {label}
                </h4>
                <div className="flex flex-col gap-1.5">
                  {groups[key].map((item) => (
                    <NotificationItem key={item.id} item={item} onMarkRead={markRead} />
                  ))}
                </div>
              </section>
            ) : null,
          )
        )}
      </div>

      {/* Footer link to full notification page */}
      {items.length > 0 && (
        <div className="border-t border-outline-variant/20 p-2.5 bg-surface-container/20 text-center">
          <Link
            to="/notifikasi"
            onClick={onClose}
            className="inline-flex items-center gap-1 text-body-sm font-bold text-primary hover:underline"
          >
            <span>Buka Halaman Notifikasi Penuh</span>
            <Icon name="arrow_forward" size={16} />
          </Link>
        </div>
      )}
    </div>
  )
}

