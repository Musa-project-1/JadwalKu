import { useEffect, useMemo, useRef, useState } from "react"
import { Icon } from "../../Icon"
import { PortalMenu } from "./PortalMenu"

export function DosenFilterDropdown({ lecturers = [], selected, onSelect }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (e.target.closest('[data-portal-menu]')) return
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const filteredLecturers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return lecturers
    return lecturers.filter((name) => name.toLowerCase().includes(q))
  }, [lecturers, search])

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-body-xs font-semibold transition-all cursor-pointer ${
          selected
            ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'
        }`}
      >
        <Icon name="person" size={18} className={selected ? 'text-primary' : 'text-on-surface-variant'} />
        <span className="max-w-[130px] truncate sm:max-w-[160px]">
          {selected || `Dosen (${lecturers.length})`}
        </span>
        <Icon
          name="expand_more"
          size={18}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      <PortalMenu open={open} triggerRef={dropdownRef} widthClass="w-72" align="right">
          <div className="relative mb-2">
            <Icon
              name="search"
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari dosen..."
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/60 py-1.5 pl-9 pr-3 text-body-xs font-medium text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            <button
              type="button"
              onClick={() => {
                onSelect('')
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-body-xs font-semibold transition-colors cursor-pointer ${
                !selected
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span>Semua Dosen</span>
              {!selected && <Icon name="check" size={18} className="text-primary" />}
            </button>

            {filteredLecturers.map((name) => {
              const isSelected = selected === name
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onSelect(name)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-body-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary-container text-label-caps font-bold text-on-secondary-container">
                      {name.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="truncate">{name}</span>
                  </div>
                  {isSelected && <Icon name="check" size={18} className="text-primary shrink-0" />}
                </button>
              )
            })}

            {filteredLecturers.length === 0 && (
              <p className="py-4 text-center text-body-xs text-on-surface-variant font-medium">
                Dosen tidak ditemukan
              </p>
            )}
          </div>
        </PortalMenu>
    </div>
  )
}

/**
 * Reusable Holiday Prodi Scope Dropdown
 */
