import { useEffect, useMemo, useRef, useState } from "react"
import { Icon } from "../../Icon"
import { PortalMenu } from "./PortalMenu"
import { PRODIS } from "../../../constants/academicConstants"

export function ProdiFilterDropdown({ selected, onSelect, prodis, prodiOptions }) {
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

  const normalizedList = useMemo(() => {
    const raw = prodis || prodiOptions || PRODIS
    const list = []
    let hasAll = false

    for (const item of raw) {
      if (typeof item === "string") {
        if (!item || item.toLowerCase() === "semua prodi") {
          hasAll = true
          list.push({ label: "Semua Prodi", value: "" })
        } else {
          list.push({ label: item, value: item })
        }
      } else if (item && typeof item === "object") {
        const val = item.value ?? item.id ?? item.nama ?? ""
        const lbl = item.label ?? item.nama ?? item.id ?? val
        if (!val || lbl.toLowerCase() === "semua prodi") {
          hasAll = true
          list.push({ label: "Semua Prodi", value: "" })
        } else {
          list.push({ label: lbl, value: val })
        }
      }
    }

    if (!hasAll) {
      list.unshift({ label: "Semua Prodi", value: "" })
    }
    return list
  }, [prodis, prodiOptions])

  const selectedLabel =
    normalizedList.find((p) => String(p.value).toLowerCase() === String(selected || "").toLowerCase())?.label ||
    (selected || "Semua Prodi")

  return (
    <div ref={dropdownRef} className="relative shrink-0 z-20">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-body-xs font-semibold transition-all cursor-pointer ${
          selected
            ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
            : "border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30"
        }`}
      >
        <Icon name="school" size={15} className={selected ? "text-primary" : "text-on-surface-variant"} />
        <span className="max-w-[120px] truncate sm:max-w-[150px]">{selectedLabel}</span>
        <Icon
          name="expand_more"
          size={15}
          className={`text-on-surface-variant transition-transform duration-200 ${
            open ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      <PortalMenu open={open} triggerRef={dropdownRef} widthClass="w-56" align="left">
        <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {normalizedList.map((p, idx) => {
            const isSelected = String(selected || "").toLowerCase() === String(p.value).toLowerCase()
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
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container"
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
