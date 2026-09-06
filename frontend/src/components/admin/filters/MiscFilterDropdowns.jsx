import { useEffect, useRef, useState } from "react"
import { Icon } from "../../Icon"
import { PortalMenu } from "./PortalMenu"
import { MONTH_NAMES } from "../../../constants/academicConstants"

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
