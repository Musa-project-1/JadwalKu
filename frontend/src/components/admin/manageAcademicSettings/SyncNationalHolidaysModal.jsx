import { useEffect } from 'react'
import { Button } from '../../Button'
import { Icon } from '../../Icon'
import { NATIONAL_HOLIDAYS_PRESET } from '../../../constants/academicConstants'

export default function SyncNationalHolidaysModal({
  open,
  onClose,
  selectedYear,
  onYearChange,
  syncing,
  onSync,
}) {
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !syncing) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, syncing, onClose])

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
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl overflow-hidden animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0">
        <div aria-hidden className="hidden max-[599px]:flex justify-center pt-3 pb-1 shrink-0">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>
        <header className="flex items-center justify-between p-5 border-b border-outline-variant/15 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Icon name="cloud_sync" size={20} />
            </span>
            <h3 className="text-title-lg font-bold text-on-surface">Sinkron Libur Nasional</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container cursor-pointer"
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 tablet:p-6">
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 tablet:gap-5">
            <div className="space-y-4">
              <p className="text-body-sm text-on-surface-variant">
                Impor daftar resmi hari libur nasional Indonesia secara otomatis. Sistem
                akan melewati libur yang sudah terdaftar untuk mencegah data duplikat.
              </p>
              <div>
                <label className="text-label-caps uppercase text-on-surface-variant block mb-1">
                  Pilih Tahun Kalender
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[2026, 2027].map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => onYearChange(year)}
                      className={`rounded-2xl border p-3 text-center transition-all cursor-pointer ${
                        selectedYear === year
                          ? 'border-secondary bg-secondary/10 text-secondary font-bold shadow-xs'
                          : 'border-outline-variant/30 bg-surface-container-low/40 text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      <span className="block text-title-md font-bold">{year}</span>
                      <span className="text-[11px] font-medium opacity-80">
                        {NATIONAL_HOLIDAYS_PRESET[year]?.length || 0} Hari Libur Resmi
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl bg-surface-container-low p-3 text-[11px] text-on-surface-variant space-y-1">
                <p className="font-bold text-on-surface">Termasuk di dalamnya:</p>
                <p>• Hari Raya Idul Fitri & Cuti Bersama</p>
                <p>• Tahun Baru Masehi, Imlek, Nyepi, Waisak, Natal</p>
                <p>• Hari Kemerdekaan RI, Lahir Pancasila, Maulid Nabi, dsb.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-outline-variant/15 shrink-0">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="button"
            disabled={syncing}
            onClick={() => onSync(selectedYear)}
            className="font-bold"
          >
            {syncing ? (
              <Icon name="progress_activity" size={16} className="mr-1.5 animate-spin" />
            ) : (
              <Icon name="download" size={16} className="mr-1.5" />
            )}
            {syncing ? 'Menyinkronkan...' : `Impor Libur ${selectedYear}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
