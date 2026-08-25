import { NavLink } from 'react-router-dom'
import { STUDENT_NAV } from '../lib/navigation'
import { Icon } from './Icon'

/**
 * Floating Pill Nav — kontainer terpusat, blur, border halus
 * (JadwalKu Expressive v2). Mobile only.
 */
export function BottomNav() {
  return (
    <nav className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 tablet:hidden">
      <ul className="flex items-center gap-0.5 rounded-full border border-white/10 bg-surface-container-lowest/90 px-2 py-1.5 shadow-level-2 backdrop-blur-xl dark:bg-surface-container-low/90">
        {STUDENT_NAV.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.to === '/'} viewTransition>
              {({ isActive }) => (
                <span
                  className={`flex w-16 flex-col items-center gap-0.5 rounded-full py-1.5 text-[11px] transition-all duration-200 active:scale-95 ${
                    isActive
                      ? 'font-medium text-primary'
                      : 'font-normal text-on-surface-variant'
                  }`}
                >
                  <span
                    className={`flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-container/50 shadow-[0_0_16px_rgb(var(--c-primary)/0.25)] dark:bg-primary/15'
                        : ''
                    }`}
                  >
                    <Icon name={item.icon} size={21} filled={isActive} />
                  </span>
                  {item.label}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
