import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon'

/* ── Portal helper: render dropdown menu in body to escape overflow:hidden parents ── */
function usePortalPosition(open, triggerRef) {
  const [pos, setPos] = useState(null)
  const update = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const gap = 6
    const vw = window.innerWidth
    const vh = window.innerHeight
    // prefer left align, flip to right if overflow
    let left = r.left
    // menu width up to 224 (w-56) or 288; clamp
    const menuW = 224
    if (left + menuW > vw - 8) left = Math.max(8, vw - menuW - 8)
    // vertical: below trigger; flip above if near bottom
    let top = r.bottom + gap
    // estimate menu height ~240; if overflow, show above trigger
    const estH = 260
    if (top + estH > vh - 8) top = Math.max(8, r.top - estH - gap)
    setPos({ top, left, width: menuW, triggerWidth: r.width, triggerRight: r.right })
  }, [triggerRef])
  useLayoutEffect(() => {
    if (!open) return
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, update])
  return pos
}

function PortalMenu({ open, triggerRef, widthClass = 'w-56', align = 'left', children }) {
  const pos = usePortalPosition(open, triggerRef)
  if (!open || !pos) return null
  // widthClass maps to px via Tailwind but portal uses inline width for clamping
  const wMap = { 'w-56': 224, 'w-48': 192, 'w-44': 176, 'w-72': 288, 'w-80': 320 }
  const w = wMap[widthClass] || 224
  const left = align === 'right'
    ? Math.max(8, (pos.triggerRight || pos.left + w) - w)
    : pos.left
  return createPortal(
    <div
      data-portal-menu
      style={{ position: 'fixed', top: pos.top, left, width: w, zIndex: 9999 }}
      className={`rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-2 shadow-level-3 dark:bg-surface-container-high animate-fade-up ${widthClass.includes('w-72') || widthClass.includes('w-80') ? 'rounded-3xl p-3' : ''}`}
    >
      {children}
    </div>,
    document.body,
  )
}

import { PRODIS, SEMESTER_OPTIONS, STATUS_OPTIONS, MONTH_NAMES } from '../../constants/academicConstants'

/**
 * Reusable Prodi Filter Dropdown (Supports array of strings, objects, and prodiOptions alias)
 */
export function ProdiFilterDropdown({ selected, onSelect, prodis, prodiOptions }) {
  const [open, setOpen] = useState(false)
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

  const normalizedList = useMemo(() => {
    const raw = prodis || prodiOptions || PRODIS
    const list = []
    let hasAll = false

    for (const item of raw) {
      if (typeof item === 'string') {
        if (!item || item.toLowerCase() === 'semua prodi') {
          hasAll = true
          list.push({ label: 'Semua Prodi', value: '' })
        } else {
          list.push({ label: item, value: item })
        }
      } else if (item && typeof item === 'object') {
        const val = item.value ?? item.id ?? item.nama ?? ''
        const lbl = item.label ?? item.nama ?? item.id ?? val
        if (!val || lbl.toLowerCase() === 'semua prodi') {
          hasAll = true
          list.push({ label: 'Semua Prodi', value: '' })
        } else {
          list.push({ label: lbl, value: val })
        }
      }
    }

    if (!hasAll) {
      list.unshift({ label: 'Semua Prodi', value: '' })
    }
    return list
  }, [prodis, prodiOptions])

  const selectedLabel =
    normalizedList.find((p) => String(p.value).toLowerCase() === String(selected || '').toLowerCase())?.label ||
    (selected || 'Semua Prodi')

  return (
    <div ref={dropdownRef} className="relative shrink-0 z-[70]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-body-xs font-semibold transition-all cursor-pointer ${
          selected
            ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'
        }`}
      >
        <Icon name="school" size={15} className={selected ? 'text-primary' : 'text-on-surface-variant'} />
        <span className="max-w-[120px] truncate sm:max-w-[150px]">{selectedLabel}</span>
        <Icon
          name="expand_more"
          size={15}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      <PortalMenu open={open} triggerRef={dropdownRef} widthClass="w-56" align="left">
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {normalizedList.map((p, idx) => {
              const isSelected = String(selected || '').toLowerCase() === String(p.value).toLowerCase()
              return (
                <button
                  key={`${p.value}-${idx}`}
                  type="button"
                  onClick={() => {
                    onSelect(p.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-body-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'
                  }`}
                >
                  <span className="truncate">{p.label}</span>
                  {isSelected && <Icon name="check" size={15} className="text-primary shrink-0" />}
                </button>
              )
            })}
          </div>
        </PortalMenu>
    </div>
  )
}

/**
 * Reusable Semester Filter Dropdown
 */
export function SemesterFilterDropdown({ selected, onSelect, semesterOptions = SEMESTER_OPTIONS }) {
  const [open, setOpen] = useState(false)
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

  const selectedLabel =
    semesterOptions.find((s) => String(s.value) === String(selected))?.label ||
    (selected ? `Semester ${selected}` : 'Semua Semester')

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-body-xs font-semibold transition-all cursor-pointer ${
          selected
            ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'
        }`}
      >
        <Icon name="layers" size={16} className={selected ? 'text-indigo-600 dark:text-indigo-400' : 'text-on-surface-variant'} />
        <span>{selectedLabel}</span>
        <Icon
          name="expand_more"
          size={16}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      <PortalMenu open={open} triggerRef={dropdownRef} widthClass="w-48" align="left">
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {semesterOptions.map((s) => {
              const isSelected = String(selected) === String(s.value)
              return (
                <button
                  key={s.value || 'all'}
                  type="button"
                  onClick={() => {
                    onSelect(s.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-body-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'
                  }`}
                >
                  <span>{s.label}</span>
                  {isSelected && <Icon name="check" size={16} className="text-primary shrink-0" />}
                </button>
              )
            })}
          </div>
        </PortalMenu>
    </div>
  )
}


/**
 * Reusable TA Filter Dropdown (Opsi B: only TAs that have data, plus Semua TA)
 */
export function TaFilterDropdown({ selected, onSelect, taOptions = [] }) {
  const [open, setOpen] = useState(false)
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

  const normalized = taOptions.length > 0 ? taOptions : [{ label: 'Semua TA', value: '' }]
  const selectedLabel = normalized.find((t) => String(t.value) === String(selected ?? ''))?.label || (selected ? `TA ${selected}` : 'Semua TA')

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-body-xs font-semibold transition-all cursor-pointer ${
          selected
            ? 'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300'
            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'
        }`}
      >
        <Icon name="calendar_today" size={14} className={selected ? 'text-teal-600 dark:text-teal-400' : 'text-on-surface-variant'} />
        <span>{selectedLabel}</span>
        <Icon name="expand_more" size={16} className={`text-on-surface-variant transition-transform duration-200 ${open ? 'rotate-180 text-primary' : ''}`} />
      </button>
      <PortalMenu open={open} triggerRef={dropdownRef} widthClass="w-44" align="left">
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {normalized.map((t) => {
              const isSelected = String(selected ?? '') === String(t.value)
              return (
                <button
                  key={t.value || 'all'}
                  type="button"
                  onClick={() => { onSelect(t.value); setOpen(false) }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-body-xs font-medium transition-colors cursor-pointer ${isSelected ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold' : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'}`}
                >
                  <span>{t.label}</span>
                  {isSelected && <Icon name="check" size={16} className="text-teal-600 shrink-0" />}
                </button>
              )
            })}
          </div>
        </PortalMenu>
    </div>
  )
}

/**
 * Reusable Status Filter Dropdown
 */
export function StatusFilterDropdown({ selected, onSelect, options = STATUS_OPTIONS }) {
  const [open, setOpen] = useState(false)
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

  const selectedLabel = options.find((s) => s.value === selected)?.label || 'Semua Status'

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-body-xs font-semibold transition-all cursor-pointer ${
          selected
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'
        }`}
      >
        <Icon name="verified" size={16} className={selected ? 'text-amber-600 dark:text-amber-400' : 'text-on-surface-variant'} />
        <span>{selectedLabel}</span>
        <Icon
          name="expand_more"
          size={16}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      <PortalMenu open={open} triggerRef={dropdownRef} widthClass="w-44" align="left">
          <div className="space-y-1">
            {options.map((s) => {
              const isSelected = selected === s.value
              return (
                <button
                  key={s.value || 'all'}
                  type="button"
                  onClick={() => {
                    onSelect(s.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-body-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'
                  }`}
                >
                  <span>{s.label}</span>
                  {isSelected && <Icon name="check" size={16} className="text-primary shrink-0" />}
                </button>
              )
            })}
          </div>
        </PortalMenu>
    </div>
  )
}

/**
 * Reusable Dosen Filter Dropdown with Search
 */
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
export function HolidayProdiFilterDropdown({ programs = [], selected, onSelect }) {
  const [open, setOpen] = useState(false)
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

  let selectedLabel = 'Semua Cakupan'
  if (selected === 'umum') selectedLabel = 'Umum (Semua Prodi)'
  else if (selected && selected !== 'semua') selectedLabel = `Khusus: ${selected}`

  return (
    <div ref={dropdownRef} className="relative shrink-0 ml-auto">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-body-xs font-semibold transition-all cursor-pointer ${
          selected !== 'semua'
            ? 'border-secondary/40 bg-secondary/10 text-secondary'
            : 'border-outline-variant/30 bg-surface-container-low/60 text-on-surface hover:border-secondary/40 dark:bg-surface-container-high/30'
        }`}
      >
        <Icon name="filter_list" size={15} className={selected !== 'semua' ? 'text-secondary' : 'text-on-surface-variant'} />
        <span className="max-w-[120px] truncate sm:max-w-[150px]">{selectedLabel}</span>
        <Icon
          name="expand_more"
          size={16}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-secondary' : ''
          }`}
        />
      </button>

      <PortalMenu open={open} triggerRef={dropdownRef} widthClass="w-44" align="right">
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            <button
              type="button"
              onClick={() => {
                onSelect('semua')
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-body-xs font-medium transition-colors cursor-pointer ${
                selected === 'semua'
                  ? 'bg-secondary/10 text-secondary font-bold'
                  : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'
              }`}
            >
              <span>Semua Cakupan</span>
              {selected === 'semua' && <Icon name="check" size={15} className="text-secondary shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => {
                onSelect('umum')
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-body-xs font-medium transition-colors cursor-pointer ${
                selected === 'umum'
                  ? 'bg-secondary/10 text-secondary font-bold'
                  : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'
              }`}
            >
              <span>Umum (Semua Prodi)</span>
              {selected === 'umum' && <Icon name="check" size={15} className="text-secondary shrink-0" />}
            </button>

            {programs.map((p) => {
              const isSelected = selected === p.nama
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelect(p.nama)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-body-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-secondary/10 text-secondary font-bold'
                      : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'
                  }`}
                >
                  <span className="truncate">Khusus: {p.nama}</span>
                  {isSelected && <Icon name="check" size={15} className="text-secondary shrink-0" />}
                </button>
              )
            })}
          </div>
        </PortalMenu>
    </div>
  )
}

/**
 * Reusable Month Selection Dropdown
 */
export function MonthSelectDropdown({ value, onChange, months = MONTH_NAMES }) {
  const [open, setOpen] = useState(false)
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

  const selectedMonthName = months[value] || months[0]

  return (
    <div ref={dropdownRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full min-w-0 items-center justify-between gap-1 rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2.5 py-1.5 text-body-sm font-semibold text-on-surface hover:border-primary/40 transition-colors cursor-pointer"
      >
        <span className="truncate">{selectedMonthName}</span>
        <Icon
          name="expand_more"
          size={16}
          className={`shrink-0 text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      <PortalMenu open={open} triggerRef={dropdownRef} widthClass="w-44" align="left">
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {months.map((m, idx) => {
              const isSelected = value === idx
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onChange(idx)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1 text-left text-body-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'
                  }`}
                >
                  <span>{m}</span>
                  {isSelected && <Icon name="check" size={14} className="text-primary shrink-0" />}
                </button>
              )
            })}
          </div>
        </PortalMenu>
    </div>
  )
}

const DEFAULT_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

/**
 * Reusable Hari Filter Dropdown
 */
export function HariFilterDropdown({ selected, onSelect, days = DEFAULT_DAYS }) {
  const [open, setOpen] = useState(false)
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

  return (
    <div ref={dropdownRef} className="relative shrink-0 z-30">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-body-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
          selected
            ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20 font-bold'
            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'
        }`}
      >
        <Icon name="calendar_today" size={14} className={selected ? 'text-primary' : 'text-on-surface-variant'} />
        <span>{selected || 'Semua Hari'}</span>
        <Icon
          name="expand_more"
          size={14}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      <PortalMenu open={open} triggerRef={dropdownRef} widthClass="w-48" align="left">
          <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              onSelect('')
              setOpen(false)
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-body-xs font-medium transition-colors cursor-pointer ${
              !selected
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'
            }`}
          >
            <span>Semua Hari</span>
            {!selected && <Icon name="check" size={14} className="text-primary" />}
          </button>
          {days.map((d) => {
            const isSelected = selected === d
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  onSelect(d)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-body-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'
                }`}
              >
                <span>{d}</span>
                {isSelected && <Icon name="check" size={14} className="text-primary" />}
              </button>
            )
          })}
          </div>
        </PortalMenu>
    </div>
  )
}

const DEFAULT_SKS = [
  { label: 'Semua SKS', value: '' },
  { label: '2 SKS', value: 2 },
  { label: '3 SKS', value: 3 },
  { label: '4 SKS', value: 4 },
  { label: '6 SKS', value: 6 },
]

/**
 * Reusable SKS Filter Dropdown
 */
export function SksFilterDropdown({ selected, onSelect, options = DEFAULT_SKS }) {
  const [open, setOpen] = useState(false)
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

  const selectedLabel =
    options.find((s) => String(s.value) === String(selected || ''))?.label ||
    (selected ? `${selected} SKS` : 'Semua SKS')

  return (
    <div ref={dropdownRef} className="relative shrink-0 z-30">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-body-xs font-semibold transition-all cursor-pointer ${
          selected
            ? 'border-tertiary/40 bg-tertiary/10 text-tertiary font-bold'
            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'
        }`}
      >
        <Icon name="workspace_premium" size={15} className={selected ? 'text-tertiary' : 'text-on-surface-variant'} />
        <span>{selectedLabel}</span>
        <Icon
          name="expand_more"
          size={14}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      <PortalMenu open={open} triggerRef={dropdownRef} widthClass="w-44" align="left">
          <div className="space-y-0.5">
          {options.map((s) => {
            const isSelected = String(selected || '') === String(s.value || '')
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  onSelect(s.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-body-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'
                }`}
              >
                <span>{s.label}</span>
                {isSelected && <Icon name="check" size={14} className="text-primary" />}
              </button>
            )
          })}
          </div>
        </PortalMenu>
    </div>
  )
}


/**
 * Fakultas Filter Dropdown (Opsi B: hanya fakultas yang ada data)
 */
export function FakultasFilterDropdown({ selected, onSelect, fakultasOptions = [] }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])
  const normalized = fakultasOptions.length > 0 ? fakultasOptions : [{ label: 'Semua Fakultas', value: '' }]
  const selectedLabel = normalized.find((f) => String(f.value) === String(selected ?? ''))?.label || (selected ? String(selected) : 'Semua Fakultas')
  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button type="button" onClick={() => setOpen((p) => !p)} className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-body-xs font-semibold transition-all cursor-pointer ${selected ? 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300' : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30'}`}>
        <Icon name="account_balance" size={14} className={selected ? 'text-violet-600 dark:text-violet-400' : 'text-on-surface-variant'} />
        <span>{selectedLabel}</span>
        <Icon name="expand_more" size={16} className={`text-on-surface-variant transition-transform duration-200 ${open ? 'rotate-180 text-primary' : ''}`} />
      </button>
      <PortalMenu open={open} triggerRef={dropdownRef} widthClass="w-48" align="left">
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {normalized.map((f) => {
              const isSelected = String(selected ?? '') === String(f.value)
              return (
                <button key={f.value || 'all'} type="button" onClick={() => { onSelect(f.value); setOpen(false) }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-body-xs font-medium transition-colors cursor-pointer ${isSelected ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 font-bold' : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container'}`}>
                  <span>{f.label}</span>
                  {isSelected && <Icon name="check" size={16} className="text-violet-600 shrink-0" />}
                </button>
              )
            })}
          </div>
        </PortalMenu>
    </div>
  )
}
