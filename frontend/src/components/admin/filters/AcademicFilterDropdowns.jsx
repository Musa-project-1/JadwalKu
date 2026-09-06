import { useEffect, useRef, useState } from "react"
import { Icon } from "../../Icon"
import { PortalMenu } from "./PortalMenu"
import { STATUS_OPTIONS } from "../../../constants/academicConstants"

export function TaFilterDropdown({ selected, onSelect, taOptions = [] }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (e.target.closest("[data-portal-menu]")) return
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const normalized = taOptions.length > 0 ? taOptions : [{ label: "Semua TA", value: "" }]
  const selectedLabel = normalized.find((t) => String(t.value) === String(selected ?? ""))?.label || (selected ? `TA ${selected}` : "Semua TA")

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-body-xs font-semibold transition-all cursor-pointer ${
          selected
            ? "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-400"
            : "border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30"
        }`}
      >
        <Icon name="calendar_today" size={14} className={selected ? "text-teal-600 dark:text-teal-400" : "text-on-surface-variant"} />
        <span>{selectedLabel}</span>
        <Icon name="expand_more" size={16} className={`text-on-surface-variant transition-transform duration-200 ${open ? "rotate-180 text-primary" : ""}`} />
      </button>
      <PortalMenu open={open} triggerRef={dropdownRef} widthClass="w-44" align="left">
        <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {normalized.map((t) => {
            const isSelected = String(selected ?? "") === String(t.value)
            return (
              <button
                key={t.value || "all"}
                type="button"
                onClick={() => { onSelect(t.value); setOpen(false) }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-body-xs font-medium transition-colors cursor-pointer ${isSelected ? "bg-teal-500/10 text-teal-700 dark:text-teal-400 font-bold" : "text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container"}`}
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

export function StatusFilterDropdown({ selected, onSelect, options = STATUS_OPTIONS }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (e.target.closest("[data-portal-menu]")) return
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const selectedLabel =
    options.find((o) => o.value === selected)?.label ||
    (selected ? String(selected) : "Semua Status")

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-body-xs font-semibold transition-all cursor-pointer ${
          selected
            ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            : "border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30"
        }`}
      >
        <Icon name="tune" size={16} className={selected ? "text-amber-600 dark:text-amber-400" : "text-on-surface-variant"} />
        <span>{selectedLabel}</span>
        <Icon
          name="expand_more"
          size={16}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      <PortalMenu open={open} triggerRef={dropdownRef} widthClass="w-48" align="left">
        <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {options.map((o) => {
            const isSelected = selected === o.value
            return (
              <button
                key={o.value || "all"}
                type="button"
                onClick={() => {
                  onSelect(o.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-body-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container"
                }`}
              >
                <span>{o.label}</span>
                {isSelected && <Icon name="check" size={16} className="text-primary shrink-0" />}
              </button>
            )
          })}
        </div>
      </PortalMenu>
    </div>
  )
}

export function FakultasFilterDropdown({ selected, onSelect, fakultasOptions = [] }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])
  const normalized = fakultasOptions.length > 0 ? fakultasOptions : [{ label: "Semua Fakultas", value: "" }]
  const selectedLabel = normalized.find((f) => String(f.value) === String(selected ?? ""))?.label || (selected ? String(selected) : "Semua Fakultas")
  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button type="button" onClick={() => setOpen((p) => !p)} className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-body-xs font-semibold transition-all cursor-pointer ${selected ? "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400" : "border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30"}`}>
        <Icon name="account_balance" size={14} className={selected ? "text-violet-600 dark:text-violet-400" : "text-on-surface-variant"} />
        <span>{selectedLabel}</span>
        <Icon name="expand_more" size={16} className={`text-on-surface-variant transition-transform duration-200 ${open ? "rotate-180 text-primary" : ""}`} />
      </button>
      <PortalMenu open={open} triggerRef={dropdownRef} widthClass="w-48" align="left">
        <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {normalized.map((f) => {
            const isSelected = String(selected ?? "") === String(f.value)
            return (
              <button key={f.value || "all"} type="button" onClick={() => { onSelect(f.value); setOpen(false) }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-body-xs font-medium transition-colors cursor-pointer ${isSelected ? "bg-violet-500/10 text-violet-700 dark:text-violet-400 font-bold" : "text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container"}`}>
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
