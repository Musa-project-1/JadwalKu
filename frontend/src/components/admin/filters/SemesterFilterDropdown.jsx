import { useEffect, useRef, useState } from "react"
import { Icon } from "../../Icon"
import { PortalMenu } from "./PortalMenu"
import { SEMESTER_OPTIONS } from "../../../constants/academicConstants"

export function SemesterFilterDropdown({ selected, onSelect, semesterOptions = SEMESTER_OPTIONS }) {
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
    semesterOptions.find((s) => String(s.value) === String(selected))?.label ||
    (selected ? `Semester ${selected}` : "Semua Semester")

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-body-xs font-semibold transition-all cursor-pointer ${
          selected
            ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
            : "border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 dark:bg-surface-container-high/30"
        }`}
      >
        <Icon name="layers" size={16} className={selected ? "text-indigo-600 dark:text-indigo-400" : "text-on-surface-variant"} />
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
          {semesterOptions.map((s) => {
            const isSelected = String(selected) === String(s.value)
            return (
              <button
                key={s.value || "all"}
                type="button"
                onClick={() => {
                  onSelect(s.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-body-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container"
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
