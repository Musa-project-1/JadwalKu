import { useState, useRef, useEffect, useId } from 'react'
import { Icon } from './Icon'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export function CustomDatePicker({
  value = '',
  onChange,
  placeholder = 'Pilih tanggal...',
  disabled = false,
  className = '',
  id,
}) {
  const generatedId = useId()
  const inputId = id || generatedId
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // Parse current value (YYYY-MM-DD) or default to today
  const selectedDate = value ? new Date(value + 'T00:00:00') : null
  const initialYear = selectedDate && !isNaN(selectedDate) ? selectedDate.getFullYear() : new Date().getFullYear()
  const initialMonth = selectedDate && !isNaN(selectedDate) ? selectedDate.getMonth() : new Date().getMonth()

  const [viewYear, setViewYear] = useState(initialYear)
  const [viewMonth, setViewMonth] = useState(initialMonth)

  // Sync view when value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00')
      if (!isNaN(d)) {
        setViewYear(d.getFullYear())
        setViewMonth(d.getMonth())
      }
    }
  }, [value])

  // Close on outside click or ESC
  useEffect(() => {
    if (!open) return

    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  // Navigation handlers
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  // Format date helper: YYYY-MM-DD
  const formatYMD = (year, month, day) => {
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    return `${year}-${mm}-${dd}`
  }

  // Format display string
  const formatDisplay = (val) => {
    if (!val) return ''
    const d = new Date(val + 'T00:00:00')
    if (isNaN(d)) return val
    const day = d.getDate()
    const month = MONTH_NAMES[d.getMonth()]
    const year = d.getFullYear()
    return `${day} ${month} ${year}`
  }

  // Build calendar matrix
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay() // 0 = Sun
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const todayYMD = formatYMD(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  const calendarCells = []

  // Prev month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const m = viewMonth === 0 ? 11 : viewMonth - 1
    const y = viewMonth === 0 ? viewYear - 1 : viewYear
    const ymd = formatYMD(y, m, day)
    calendarCells.push({ day, month: m, year: y, ymd, isCurrentMonth: false })
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const ymd = formatYMD(viewYear, viewMonth, day)
    calendarCells.push({ day, month: viewMonth, year: viewYear, ymd, isCurrentMonth: true })
  }

  // Next month padding to fill complete rows (multiple of 7)
  const remainingCells = 7 - (calendarCells.length % 7)
  if (remainingCells < 7) {
    for (let day = 1; day <= remainingCells; day++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1
      const y = viewMonth === 11 ? viewYear + 1 : viewYear
      const ymd = formatYMD(y, m, day)
      calendarCells.push({ day, month: m, year: y, ymd, isCurrentMonth: false })
    }
  }

  const handleSelectDate = (ymd) => {
    onChange?.(ymd)
    setOpen(false)
  }

  const handleSetToday = () => {
    onChange?.(todayYMD)
    const now = new Date()
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    setOpen(false)
  }

  const handleClear = () => {
    onChange?.('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        id={inputId}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3.5 py-2 text-body-xs font-semibold text-on-surface text-left transition-all hover:border-primary/50 focus:border-primary focus:outline-none dark:bg-surface-container-high/30 cursor-pointer ${
          open ? 'ring-2 ring-primary/20 border-primary' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={value ? 'text-on-surface font-semibold' : 'text-on-surface-variant/50'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Icon
          name="calendar_today"
          size={16}
          className={`shrink-0 transition-colors ${value ? 'text-primary' : 'text-on-surface-variant'}`}
        />
      </button>

      {/* Date Picker Popover */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-72 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-3 shadow-xl backdrop-blur-md animate-fade-in">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-body-sm text-on-surface">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
                title="Bulan sebelumnya"
              >
                <Icon name="chevron_left" size={18} />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
                title="Bulan berikutnya"
              >
                <Icon name="chevron_right" size={18} />
              </button>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_NAMES.map((name, i) => (
              <span
                key={name}
                className={`text-[10px] font-extrabold uppercase ${
                  i === 0 ? 'text-error/80' : 'text-on-surface-variant'
                }`}
              >
                {name}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              const isSelected = cell.ymd === value
              const isToday = cell.ymd === todayYMD

              let cellStyle = 'text-on-surface hover:bg-surface-container-high/60'
              if (!cell.isCurrentMonth) {
                cellStyle = 'text-on-surface-variant/30 hover:bg-surface-container-high/30'
              }
              if (isSelected) {
                cellStyle = 'bg-teal-800 text-white font-extrabold shadow-2xs hover:bg-teal-900'
              } else if (isToday) {
                cellStyle = 'border border-primary/40 font-bold text-primary hover:bg-primary/10'
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDate(cell.ymd)}
                  className={`flex h-8 w-full items-center justify-center rounded-xl text-body-xs transition-all cursor-pointer ${cellStyle}`}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-outline-variant/15 px-1 text-[11px]">
            <button
              type="button"
              onClick={handleClear}
              className="text-on-surface-variant hover:text-error transition-colors cursor-pointer font-bold"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={handleSetToday}
              className="text-teal-700 dark:text-teal-400 hover:underline transition-colors cursor-pointer font-bold"
            >
              Hari Ini
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
