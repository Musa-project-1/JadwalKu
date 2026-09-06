import { Icon } from '../../Icon'

export function ScheduleActionRail({
  isCustomMode,
  setScheduleMode,
  language,
  setCustomModalOpen,
  setAttendanceModalOpen,
  setNotesModalOpen,
  setPrintModalOpen,
  setKrsSimulatorOpen,
}) {
  return (
    <aside className="w-12 shrink-0 flex flex-col justify-between py-2.5 px-1 bg-surface-container-low/30 dark:bg-surface-container-high/20">
      <div className="flex flex-col gap-2 items-center">
        {/* Mode Switcher: Icon Only (Paket vs Kustom) */}
        <div className="flex flex-col rounded-xl bg-surface-container-high/60 dark:bg-surface-container-highest/40 p-0.5 border border-outline-variant/30 gap-1">
          <button
            type="button"
            onClick={() => setScheduleMode('regular')}
            title={language === 'en' ? 'Package Schedule' : 'Jadwal Paket'}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all cursor-pointer ${
              !isCustomMode
                ? 'bg-surface shadow-level-1 text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon name="school" size={17} />
          </button>

          <button
            type="button"
            onClick={() => setScheduleMode('custom')}
            title={language === 'en' ? 'Custom Schedule' : 'Jadwal Kustom'}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all cursor-pointer ${
              isCustomMode
                ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 shadow-level-1 border border-amber-500/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon name="star" size={17} className={isCustomMode ? 'text-amber-500' : ''} />
          </button>
        </div>

        {/* Tombol Atur Matkul jika mode kustom (Icon Only) */}
        {isCustomMode && (
          <button
            type="button"
            onClick={() => setCustomModalOpen(true)}
            title={language === 'en' ? 'Select Courses' : 'Atur Matkul Kustom'}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-900 shadow-level-1 hover:bg-amber-400 active:opacity-80 transition-all cursor-pointer"
          >
            <Icon name="tune" size={15} />
          </button>
        )}

        {/* 4 Tombol Aksi Vertikal Minimalis (Icon Only) */}
        <div className="w-full pt-1.5 border-t border-outline-variant/20 flex flex-col gap-1 items-center">
          <button
            type="button"
            onClick={() => setAttendanceModalOpen(true)}
            title={language === 'en' ? 'Attendance' : 'Rekap Presensi'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            <Icon name="fact_check" size={16} />
          </button>
          <button
            type="button"
            onClick={() => setNotesModalOpen(true)}
            title={language === 'en' ? 'Course Notes' : 'Semua Catatan'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            <Icon name="sticky_note_2" size={16} />
          </button>
          <button
            type="button"
            onClick={() => setPrintModalOpen(true)}
            title={language === 'en' ? 'Print PDF' : 'Cetak PDF'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            <Icon name="print" size={16} />
          </button>
          <button
            type="button"
            onClick={() => setKrsSimulatorOpen(true)}
            title={language === 'en' ? 'KRS Simulator' : 'Simulator KRS'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            <Icon name="science" size={16} />
          </button>
        </div>
      </div>

      {/* Status Mini Indicator Bawah */}
      <div className="pt-1.5 border-t border-outline-variant/15 flex flex-col items-center justify-center text-center">
        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </aside>
  )
}
