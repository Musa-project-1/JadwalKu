import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../Icon'
import { parseLocalDate, localDateKey } from './taskUtils'

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function PremiumDeadlineField({ deadline, setDeadline, pickerOpen, setPickerOpen, formattedDeadlineInfo }) {
  const wrapRef = useRef(null)
  const [viewYear, setViewYear] = useState(() => {
    const base = deadline ? parseLocalDate(deadline) : new Date()
    return base.getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    const base = deadline ? parseLocalDate(deadline) : new Date()
    return base.getMonth()
  })

  useEffect(() => {
    if (deadline) {
      const d = parseLocalDate(deadline)
      if (!Number.isNaN(d.getTime())) {
        // oxlint-disable-next-line react/set-state-in-effect
        setViewYear(d.getFullYear())
        // oxlint-disable-next-line react/set-state-in-effect
        setViewMonth(d.getMonth())
      }
    }
  }, [deadline])

  useEffect(() => {
    if (!pickerOpen) return
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setPickerOpen(false)
    }
    function onEsc(e) {
      if (e.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    window.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('keydown', onEsc)
    }
  }, [pickerOpen, setPickerOpen])

  const displayText = deadline
    ? (() => {
        const d = parseLocalDate(deadline)
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const yyyy = d.getFullYear()
        return `${dd}/${mm}/${yyyy}`
      })()
    : ''

  const todayKey = localDateKey(new Date())
  const selectedKey = deadline || null

  const firstDayOffset = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const cells = useMemo(() => {
    const list = []
    for (let i = 0; i < firstDayOffset; i += 1) {
      const day = daysInPrevMonth - firstDayOffset + 1 + i
      const d = new Date(viewYear, viewMonth - 1, day)
      list.push({ day, key: localDateKey(d), muted: true })
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const d = new Date(viewYear, viewMonth, day)
      list.push({ day, key: localDateKey(d), muted: false })
    }
    while (list.length < 42) {
      const idx = list.length - (firstDayOffset + daysInMonth)
      const day = idx + 1
      const d = new Date(viewYear, viewMonth + 1, day)
      list.push({ day, key: localDateKey(d), muted: true })
    }
    const visible = list.slice(0, 35)
    if (visible.filter((c) => !c.muted).length < daysInMonth) {
      // if month spills into 6th week, keep 6 rows
      visible.push(...list.slice(35, 42))
    }
    return visible
  }, [viewYear, viewMonth, firstDayOffset, daysInMonth, daysInPrevMonth])

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const monthLabelEn = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function goPrev() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  function goNext() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }
  function selectDate(key) {
    setDeadline(key)
    setPickerOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      {/* Hidden native input keeps required + form submit handling */}
      <input type="hidden" value={deadline} required readOnly aria-hidden />
      <button
        type="button"
        onClick={() => setPickerOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={pickerOpen}
        className={`w-full flex items-center justify-between gap-3 rounded-xl border bg-white dark:bg-surface-container-high/50 px-4 py-2.5 text-left shadow-level-1 transition-all cursor-pointer ${
          pickerOpen
            ? 'border-primary ring-2 ring-primary/20'
            : deadline
              ? 'border-primary/30 hover:border-primary/40'
              : 'border-outline-variant/30 hover:border-outline-variant/45 hover:bg-surface-container-low/40'
        }`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-sm ${deadline ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20'}`}>
            <Icon name="calendar_today" size={16} />
          </span>
          <span className="min-w-0">
            {deadline ? (
              <>
                <span className="block text-body-sm font-extrabold text-on-surface tracking-tight">{displayText}</span>
                <span className="block text-label-caps font-semibold text-on-surface-variant -mt-0.5 truncate">
                  {formattedDeadlineInfo ? `${formattedDeadlineInfo.formatted} · ${formattedDeadlineInfo.relative}` : ''}
                </span>
              </>
            ) : (
              <>
                <span className="block text-body-sm font-semibold text-outline-variant">dd/mm/yyyy</span>
                <span className="block text-label-caps text-on-surface-variant/70 -mt-0.5">Pilih tanggal tenggat</span>
              </>
            )}
          </span>
        </span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors ${pickerOpen ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-high/60 text-on-surface-variant border-outline-variant/20'}`}>
          <Icon name={pickerOpen ? 'expand_less' : 'calendar_month'} size={18} />
        </span>
      </button>

      {pickerOpen && (
        <div
          role="dialog"
          aria-label="Pilih tanggal tenggat waktu"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-xl border border-outline-variant/20 bg-white dark:bg-surface-container-low shadow-level-3 overflow-hidden animate-fade-up"
        >
          {/* Month header – premium */}
          <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low/60 dark:bg-surface-container-high/30 border-b border-outline-variant/15">
            <div className="flex items-center gap-1">
              <span className="text-body-sm font-extrabold text-on-surface capitalize">{monthLabelEn}</span>
              <span className="text-body-xs text-on-surface-variant font-medium hidden tablet:inline capitalize">· {monthLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={goPrev} aria-label="Bulan sebelumnya" className="h-8 w-8 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                <Icon name="chevron_left" size={18} />
              </button>
              <button type="button" onClick={goNext} aria-label="Bulan berikutnya" className="h-8 w-8 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                <Icon name="chevron_right" size={18} />
              </button>
            </div>
          </div>

          {/* Weekday row */}
          <div className="grid grid-cols-7 gap-0 px-2 pt-2.5">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w} className="text-center text-label-caps font-extrabold tracking-wider text-on-surface-variant/70 py-1">{w}</span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 px-2 pb-2 pt-1">
            {cells.map((cell) => {
              const isSelected = selectedKey === cell.key
              const isToday = todayKey === cell.key
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => selectDate(cell.key)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-body-sm font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0a58ca] text-white shadow-level-1 ring-2 ring-[#0a58ca]/20'
                      : isToday
                        ? 'bg-primary/12 text-primary border border-primary/30 font-extrabold'
                        : cell.muted
                          ? 'text-on-surface-variant/70 hover:bg-surface-container-high/60'
                          : 'text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-surface-container-low/50 dark:bg-surface-container-high/20 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => { setDeadline(''); setPickerOpen(false) }}
              className="text-body-xs font-bold text-[#0a58ca] hover:text-[#084298] px-2 py-1 rounded-lg hover:bg-[#0a58ca]/10 transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const t = new Date()
                setDeadline(localDateKey(t))
                setViewYear(t.getFullYear())
                setViewMonth(t.getMonth())
              }}
              className="text-body-xs font-bold text-[#0a58ca] hover:text-[#084298] px-2 py-1 rounded-lg hover:bg-[#0a58ca]/10 transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
