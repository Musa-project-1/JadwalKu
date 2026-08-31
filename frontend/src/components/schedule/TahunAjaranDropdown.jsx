import { useState, useEffect, useRef, useMemo } from 'react'
import { Icon } from '../../components/Icon'

export default function TahunAjaranDropdown({ selectedTA, onSelect, currentTA, allTAs }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (open && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const sortedTAs = useMemo(() => {
    const list = [{ ta: currentTA, isCurrent: true }]
    allTAs
      .filter((t) => t !== currentTA)
      .sort((a, b) => b.localeCompare(a))
      .forEach((t) => list.push({ ta: t, isCurrent: false }))
    return list
  }, [currentTA, allTAs])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Pilih tahun ajaran"
        className={`group flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-body-sm font-medium transition-all shadow-sm cursor-pointer ${
          open
            ? 'border-primary bg-surface-container-high text-on-surface shadow-md'
            : 'border-outline-variant/40 bg-surface-container-lowest hover:border-primary/50 hover:bg-surface-container-low text-on-surface dark:bg-surface-container-high'
        }`}
      >
        <Icon name="calendar_month" size={15} className="text-primary shrink-0" />
        <span className="whitespace-nowrap font-bold text-body-xs tablet:text-body-sm">TA {selectedTA}</span>
        <span
          className={`hidden tablet:inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
            selectedTA === currentTA
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : 'bg-surface-container-highest text-on-surface-variant'
          }`}
        >
          {selectedTA === currentTA ? 'Berjalan' : 'Arsip'}
        </span>
        <Icon
          name="expand_more"
          size={16}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : 'group-hover:text-on-surface'
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 min-w-[230px] overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/95 backdrop-blur-xl dark:bg-surface-container-high/95 shadow-level-3 p-1.5 animate-fade-up">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 border-b border-outline-variant/15 mb-1">
            Pilih Tahun Ajaran
          </div>
          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {sortedTAs.map(({ ta, isCurrent }) => {
              const isSelected = ta === selectedTA
              return (
                <button
                  key={ta}
                  type="button"
                  onClick={() => {
                    onSelect(ta)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-body-sm font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold dark:bg-primary/20 dark:text-on-primary-container'
                      : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container-highest'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      name={isCurrent ? 'event_available' : 'history'}
                      size={16}
                      className={isSelected ? 'text-primary' : 'text-on-surface-variant'}
                    />
                    <span>TA {ta}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isCurrent
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {isCurrent ? 'Berjalan' : 'Arsip'}
                    </span>
                    {isSelected && <Icon name="check" size={16} className="text-primary" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
