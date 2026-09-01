import { useEffect } from 'react'
import { Button } from '../../Button'
import { Icon } from '../../Icon'
import { MonthSelectDropdown } from '../AdminFilterDropdowns'

export default function CalendarSettingsModal({
  open,
  onClose,
  customCal,
  onCustomCalChange,
  mekStats,
  currentComputedTA,
  saving,
  onSubmit,
}) {
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, saving, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 max-[599px]:items-end max-[599px]:p-0"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl overflow-hidden z-10 animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0">
        <div aria-hidden className="hidden max-[599px]:flex justify-center pt-3 pb-1 shrink-0">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>
        {/* Header Banner - Rich Full-Width Teal/Emerald Gradient matching the student design system */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-950 via-teal-800 to-emerald-900 p-4 tablet:p-5 text-white flex items-center justify-between border-b border-white/10 shrink-0 shadow-level-1">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-xs backdrop-blur-md">
              <Icon name="tune" size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base tablet:text-lg font-bold text-white tracking-tight truncate">
                  Batas Kalender Akademik & MEK
                </h3>
                <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border border-white/25 shadow-2xs backdrop-blur-md">
                  TA: {currentComputedTA}
                </span>
              </div>
              <p className="text-[11.5px] text-white/80 font-medium truncate mt-0.5">
                Formula kalkulasi dinamis untuk TA berjalan dan estimasi Minggu Efektif Kuliah
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all border border-white/20 cursor-pointer"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 tablet:p-5 space-y-4">
          {/* MEK Live Calculator Summary Card */}
          <div className="grid grid-cols-2 tablet:grid-cols-4 gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 p-3 dark:bg-primary/10">
            <div>
              <p className="text-label-caps uppercase font-bold text-on-surface-variant">
                Semester Berjalan
              </p>
              <p className="text-body-sm font-bold text-primary mt-0.5">{mekStats.termLabel}</p>
            </div>
            <div>
              <p className="text-label-caps uppercase font-bold text-on-surface-variant">
                Total Rentang
              </p>
              <p className="text-body-sm font-bold text-on-surface mt-0.5">
                {mekStats.totalWeeks} Minggu ({mekStats.totalDays} Hari)
              </p>
            </div>
            <div>
              <p className="text-label-caps uppercase font-bold text-on-surface-variant">
                Hari Libur di Semester
              </p>
              <p className="text-body-sm font-bold text-secondary mt-0.5">
                {mekStats.holidayCount} Agenda Libur
              </p>
            </div>
            <div>
              <p className="text-label-caps uppercase font-bold text-emerald-700 dark:text-emerald-400">
                Minggu Efektif (MEK)
              </p>
              <p className="text-body-sm font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                ~{mekStats.effectiveWeeks} Minggu Kuliah
              </p>
            </div>
          </div>

          {/* Date pickers for Ganjil & Genap */}
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3.5">
            {/* Semester Ganjil */}
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-3.5 space-y-2.5 dark:bg-surface-container-high/20">
              <h3 className="text-body-xs font-bold text-on-surface flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Semester Ganjil (1, 3, 5, 7)
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">
                    Mulai (Tgl & Bln)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={customCal.ganjilStartDay}
                      onChange={(e) =>
                        onCustomCalChange((c) => ({ ...c, ganjilStartDay: e.target.value }))
                      }
                      className="w-14 shrink-0 rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-1.5 text-center font-mono text-body-sm font-bold text-on-surface shadow-2xs"
                    />
                    <MonthSelectDropdown
                      value={customCal.ganjilStartMonth}
                      onChange={(idx) =>
                        onCustomCalChange((c) => ({ ...c, ganjilStartMonth: idx }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">
                    Selesai (Tgl & Bln)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={customCal.ganjilEndDay}
                      onChange={(e) =>
                        onCustomCalChange((c) => ({ ...c, ganjilEndDay: e.target.value }))
                      }
                      className="w-14 shrink-0 rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-1.5 text-center font-mono text-body-sm font-bold text-on-surface shadow-2xs"
                    />
                    <MonthSelectDropdown
                      value={customCal.ganjilEndMonth}
                      onChange={(idx) =>
                        onCustomCalChange((c) => ({ ...c, ganjilEndMonth: idx }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Semester Genap */}
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-3.5 space-y-2.5 dark:bg-surface-container-high/20">
              <h3 className="text-body-xs font-bold text-on-surface flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Semester Genap (2, 4, 6, 8)
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">
                    Mulai (Tgl & Bln)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={customCal.genapStartDay}
                      onChange={(e) =>
                        onCustomCalChange((c) => ({ ...c, genapStartDay: e.target.value }))
                      }
                      className="w-14 shrink-0 rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-1.5 text-center font-mono text-body-sm font-bold text-on-surface shadow-2xs"
                    />
                    <MonthSelectDropdown
                      value={customCal.genapStartMonth}
                      onChange={(idx) =>
                        onCustomCalChange((c) => ({ ...c, genapStartMonth: idx }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">
                    Selesai (Tgl & Bln)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={customCal.genapEndDay}
                      onChange={(e) =>
                        onCustomCalChange((c) => ({ ...c, genapEndDay: e.target.value }))
                      }
                      className="w-14 shrink-0 rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-1.5 text-center font-mono text-body-sm font-bold text-on-surface shadow-2xs"
                    />
                    <MonthSelectDropdown
                      value={customCal.genapEndMonth}
                      onChange={(idx) =>
                        onCustomCalChange((c) => ({ ...c, genapEndMonth: idx }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-outline-variant/15 mt-4 shrink-0">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-body-xs font-semibold cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-full px-5 py-2 font-bold shadow-xs text-body-xs bg-teal-800 hover:bg-teal-900 text-white cursor-pointer active:scale-98 transition-all"
            >
              {saving ? (
                <Icon name="progress_activity" size={16} className="mr-1.5 animate-spin" />
              ) : (
                <Icon name="save" size={16} className="mr-1.5" />
              )}
              {saving ? 'Menyimpan...' : 'Simpan Batas Kalender'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
