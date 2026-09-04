import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'
import { useApp } from '../hooks/useApp'
import { getItem, setItem } from '../lib/storage'
import { Icon } from './Icon'

export function Sidebar() {
  const { unreadCount } = useNotifications()
  const { t, openSettings } = useApp()
  const [isPinned, setIsPinned] = useState(() => getItem('jadwalku:sidebar_pinned', false))

  const links = [
    { to: '/', label: t ? t('nav.home') : 'Home', icon: 'home', highlight: false },
    { to: '/jadwal', label: t ? t('nav.schedule') : 'Jadwal', icon: 'calendar_month', highlight: true },
    { to: '/tugas', label: t ? t('nav.tasks') : 'Tugas', icon: 'checklist', highlight: false },
    { to: '/ujian', label: t ? t('nav.exams') : 'Ujian', icon: 'edit_note', highlight: false },
  ]

  useEffect(() => {
    setItem('jadwalku:sidebar_pinned', isPinned)
  }, [isPinned])

  const labelCls = isPinned
    ? 'overflow-hidden whitespace-nowrap ml-3.5 max-w-[180px] opacity-100'
    : 'overflow-hidden whitespace-nowrap transition-[opacity,max-width,margin] duration-300 ease-in-out max-w-0 opacity-0 ml-0 pointer-events-none group-hover:max-w-[180px] group-hover:opacity-100 group-hover:ml-3.5 group-hover:pointer-events-auto'

  const labelClsSm = isPinned
    ? 'overflow-hidden whitespace-nowrap ml-3 max-w-[150px] opacity-100'
    : 'overflow-hidden whitespace-nowrap transition-[opacity,max-width,margin] duration-300 ease-in-out max-w-0 opacity-0 ml-0 pointer-events-none group-hover:max-w-[150px] group-hover:opacity-100 group-hover:ml-3 group-hover:pointer-events-auto'

  return (
    <>
      {/* Sidebar spacer */}
      <div
        aria-hidden="true"
        className={`hidden tablet:block shrink-0 transition-[width] duration-300 ease-in-out ${
          isPinned ? 'w-[280px]' : 'w-20'
        }`}
      />

      <aside
        className={`group fixed left-0 top-0 h-screen hidden tablet:block z-50 transition-[width] duration-300 ease-in-out ${
          isPinned ? 'w-[280px] shadow-lg' : 'w-20 hover:w-[280px] hover:shadow-2xl'
        }`}
      >
        <nav
          style={{ viewTransitionName: 'sidebar' }}
          className="w-full h-full flex flex-col overflow-x-hidden overflow-y-auto border-r border-outline-variant/30 bg-surface-container-low py-lg dark:bg-surface-container-low"
        >
          {/* Logo & Brand */}
          <div className="relative mb-xl flex items-center px-5 min-h-[48px]">
            <div className="flex items-center min-w-0">
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo JadwalKu" className="h-10 w-10 shrink-0" />
              <div className={labelClsSm}>
                <h1 className="text-headline-lg-mobile font-bold font-brand tracking-[-0.025em] desktop:text-headline-lg truncate">
                  <span className="text-on-surface">Jadwal</span>
                  <span className="text-primary">Ku</span>
                </h1>
                <p className="font-brand font-medium text-[10.5px] tracking-[0.09em] uppercase text-on-surface-variant/80 truncate mt-0.5">
                  SCHEDULE SMARTER
                </p>
              </div>
            </div>

            {/* Pin Toggle */}
            <button
              type="button"
              onClick={() => setIsPinned((prev) => !prev)}
              title={isPinned ? 'Lepaskan sidebar (Auto-tutup)' : 'Kunci sidebar (Tetap terbuka)'}
              aria-label={isPinned ? 'Lepaskan sidebar' : 'Kunci sidebar'}
              className={`absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                isPinned
                  ? 'bg-primary/15 text-primary opacity-100'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
              }`}
            >
              <Icon name="push_pin" size={18} filled={isPinned} className={isPinned ? '-rotate-45 text-primary' : ''} />
            </button>
          </div>

          {/* Nav links */}
          <ul className="flex-1 space-y-1.5 px-3.5">
            {links.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'} viewTransition>
                  {({ isActive }) => {
                    const isHighlight = item.highlight

                    // Jadwal aktif: solid primary pill
                    // Jadwal inactive: subtle tinted bg + primary text
                    // Lainnya: standard M3 nav style
                    const spanCls = [
                      'flex w-full items-center rounded-full h-12 px-3.5 transition-all duration-200',
                      isActive
                        ? isHighlight
                          ? 'bg-primary text-on-primary font-bold shadow-[0_2px_16px_rgb(var(--c-primary)/0.35)]'
                          : 'bg-primary/10 font-medium text-primary'
                        : isHighlight
                          ? 'bg-primary/8 text-primary font-medium hover:bg-primary/15'
                          : 'text-on-surface-variant hover:bg-surface-container-high',
                    ].join(' ')

                    // Icon size: Jadwal sedikit lebih besar untuk emphasis
                    const iconSize = isHighlight ? 22 : 24

                    return (
                      <span title={item.label} className={spanCls}>
                        <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                          <Icon name={item.icon} size={iconSize} filled={isActive || isHighlight} />
                          {item.badge && unreadCount > 0 && (
                            <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-error text-[8px] font-bold text-on-error transition-opacity duration-300 group-hover:opacity-0">
                              {unreadCount}
                            </span>
                          )}
                        </span>
                        <span className={labelCls}>{item.label}</span>
                        {item.badge && unreadCount > 0 && (
                          <span className={`ml-auto flex h-5 min-w-5 overflow-hidden items-center justify-center rounded-full bg-error px-1 text-label-caps text-on-error transition-[opacity,max-width] duration-300 ${isPinned ? 'max-w-[30px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none group-hover:max-w-[30px] group-hover:opacity-100'}`}>
                            {unreadCount}
                          </span>
                        )}
                      </span>
                    )
                  }}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Footer links */}
          <div className="px-3.5">
            <div className="border-t border-outline-variant/40 pt-2 space-y-1">
              <button
                type="button"
                onClick={() => openSettings('appearance')}
                title={t ? t('nav.settings') : 'Pengaturan'}
                className="flex w-full items-center rounded-full h-12 px-3.5 transition-colors duration-200 text-on-surface-variant hover:bg-surface-container-high cursor-pointer text-left"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                  <Icon name="settings" size={24} />
                </span>
                <span className={labelCls}>{t ? t('nav.settings') : 'Pengaturan'}</span>
              </button>

              <NavLink
                to="/admin/login"
                viewTransition
                title="Mode Admin"
                className={({ isActive }) =>
                  `flex w-full items-center rounded-full h-12 px-3.5 transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`
                }
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center text-primary">
                  <Icon name="admin_panel_settings" size={24} />
                </span>
                <span className={labelCls}>Mode Admin</span>
              </NavLink>
            </div>
          </div>
        </nav>
      </aside>
    </>
  )
}
