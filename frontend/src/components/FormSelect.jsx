import { useState, useRef, useEffect } from 'react'
import { Icon } from './Icon'

/**
 * Modern custom dropdown component for modal forms.
 * Replaces native HTML <select> with a sleek, theme-aware popover.
 *
 * Props:
 * - value: string | number
 * - onChange: (val: any) => void
 * - options: Array<{ value: string | number, label: string, badge?: string, icon?: string, disabled?: boolean }> | string[]
 * - placeholder?: string
 * - disabled?: boolean
 * - className?: string
 * - id?: string
 */
export function FormSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Pilih...',
  disabled = false,
  className = '',
  id,
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // Normalize options array
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : '',
        label: opt.label !== undefined ? opt.label : String(opt.value),
        badge: opt.badge,
        icon: opt.icon,
        disabled: Boolean(opt.disabled),
      }
    }
    return {
      value: opt,
      label: String(opt),
    }
  })

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value))

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border transition-all text-left cursor-pointer select-none px-3.5 py-2 text-body-sm font-semibold shadow-2xs ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-surface-container-lowest border-outline-variant/20 text-on-surface-variant'
            : open
            ? 'border-primary bg-surface-container-lowest text-on-surface ring-2 ring-primary/20 dark:bg-surface-container-high/40'
            : 'border-outline-variant/30 bg-surface-container-low/60 text-on-surface hover:border-primary/50 dark:bg-surface-container-high/30'
        }`}
      >
        <span className={`truncate ${!selectedOption && !value ? 'text-on-surface-variant/50 font-normal' : 'text-on-surface'}`}>
          {selectedOption ? selectedOption.label : value || placeholder}
        </span>
        <Icon
          name="expand_more"
          size={18}
          className={`shrink-0 text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Floating Popover Options Menu */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[160px] max-h-56 overflow-y-auto rounded-2xl border border-outline-variant/25 bg-surface-container-lowest/98 p-1.5 shadow-2xl backdrop-blur-md dark:bg-surface-container-low/98 custom-scrollbar animate-scale-in">
          {normalizedOptions.length === 0 ? (
            <div className="px-3 py-2 text-center text-body-xs text-on-surface-variant/60">
              Tidak ada pilihan
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value)
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => {
                    if (!opt.disabled) {
                      onChange(opt.value)
                      setOpen(false)
                    }
                  }}
                  className={`group flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-body-xs font-semibold transition-colors cursor-pointer ${
                    opt.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-primary/10 text-primary font-bold shadow-2xs'
                      : 'text-on-surface hover:bg-surface-container-high/60 hover:text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {opt.icon && <Icon name={opt.icon} size={15} className="shrink-0 text-primary" />}
                    <span className="truncate">{opt.label}</span>
                  </div>

                  {opt.badge && (
                    <span className="rounded-md bg-surface-container px-1.5 py-0.2 text-[9.5px] font-bold uppercase text-on-surface-variant shrink-0">
                      {opt.badge}
                    </span>
                  )}

                  {isSelected && (
                    <Icon name="check" size={16} className="shrink-0 text-primary animate-fade-in" />
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

