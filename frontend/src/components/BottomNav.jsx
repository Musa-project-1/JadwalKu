import { NavLink } from 'react-router-dom'
import { Icon } from './Icon'
import { useApp } from '../hooks/useApp'

/**
 * Floating Pill Nav — kontainer terpusat, blur, border halus
 * (JadwalKu Expressive v2). Mobile only (`tablet:hidden`).
 *
 * 5 Tab Utama Mobile:
 * 1. Home
 * 2. Jadwal  ← highlighted: solid primary pill saat aktif, accent dot saat inactive
 * 3. Tugas
 * 4. Ujian
 * 5. Pengaturan
 */

export function BottomNav() {
  const { t, openSettings } = useApp()

  const tabs = [
    { to: '/', label: t ? t('nav.home') : 'Home', icon: 'home', highlight: false },
    { to: '/jadwal', label: t ? t('nav.schedule') : 'Jadwal', icon: 'calendar_month', highlight: true },
    { to: '/tugas', label: t ? t('nav.tasks') : 'Tugas', icon: 'checklist', highlight: false },
    { to: '/ujian', label: t ? t('nav.exams') : 'Ujian', icon: 'edit_note', highlight: false },
    { to: '#settings', label: t ? t('nav.settings') : 'Pengaturan', icon: 'settings', highlight: false, isSettings: true },
  ]

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed left-1/2 z-40 -translate-x-1/2 tablet:hidden"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
    >
      <ul className="flex items-center gap-0.5 rounded-full border border-white/10 bg-surface-container-lowest/90 px-2 py-1.5 shadow-level-2 backdrop-blur-xl dark:bg-surface-container-low/90">
        {tabs.map((item) => (
          <li key={item.label}>
            {item.isSettings ? (
              <button
                type="button"
                onClick={() => openSettings('appearance')}
                className="flex w-[62px] flex-col items-center gap-0.5 rounded-full py-1.5 text-[11px] font-normal text-on-surface-variant transition-all duration-200 active:opacity-80 cursor-pointer"
              >
                <span className="flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200">
                  <Icon name={item.icon} size={22} />
                </span>
                <span className="text-center font-medium leading-none tracking-tight">
                  {item.label}
                </span>
              </button>
            ) : (
              <NavLink to={item.to} end={item.to === '/'} viewTransition>
                {({ isActive }) => {
                  const isHighlight = item.highlight

                // Label & wrapper classes
                const wrapperCls = [
                  'flex w-[62px] flex-col items-center gap-0.5 rounded-full py-1.5 text-[11px] transition-all duration-200 active:opacity-80',
                  isActive
                    ? isHighlight
                      ? 'font-bold text-primary'
                      : 'font-bold text-primary'
                    : isHighlight
                      ? 'font-semibold text-primary/70'
                      : 'font-normal text-on-surface-variant',
                ].join(' ')

                // Icon pill classes
                const pillCls = [
                  'flex h-7 items-center justify-center rounded-full transition-all duration-200',
                  isActive
                    ? isHighlight
                      // Jadwal aktif: solid primary background — standout jelas
                      ? 'w-14 bg-primary text-on-primary shadow-[0_2px_12px_rgb(var(--c-primary)/0.45)]'
                      : 'w-12 bg-primary-container/50 shadow-[0_0_16px_rgb(var(--c-primary)/0.25)] dark:bg-primary/15'
                    : isHighlight
                      // Jadwal inactive: outline pill tipis + warna primary redup
                      ? 'w-12 ring-1 ring-primary/40 bg-primary/8'
                      : 'w-12',
                ].join(' ')

                return (
                  <span className={wrapperCls}>
                    <span className={pillCls}>
                      <Icon name={item.icon} size={21} filled={isActive} />
                    </span>
                    {item.label}
                  </span>
                )
              }}
            </NavLink>
          )}
        </li>
      ))}
      </ul>
    </nav>
  )
}
