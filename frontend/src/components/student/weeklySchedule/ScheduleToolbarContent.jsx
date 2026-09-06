import { Icon } from '../../Icon'

export function ScheduleToolbarContent({
  isCustomMode,
  setScheduleMode,
  customScheduleIds,
  language,
  setCustomModalOpen,
  setAttendanceModalOpen,
  setNotesModalOpen,
  setPrintModalOpen,
  setKrsSimulatorOpen,
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-surface-container-low/50 dark:bg-surface-container-high/20 border-b border-outline-variant/20 flex-nowrap overflow-x-auto no-scrollbar shrink-0 w-full">
      {/* Left: Mode Switcher & 4 Action Icon-Only Buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Mode Switcher */}
        <div className="flex items-center rounded-xl bg-surface-container-high/70 dark:bg-surface-container-highest/40 p-0.5 border border-outline-variant/30 shrink-0">
          <button
            type="button"
            onClick={() => setScheduleMode('regular')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-body-xs font-bold transition-all cursor-pointer ${
              !isCustomMode
                ? 'bg-surface shadow-level-1 text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon name="school" size={15} />
            <span>{language === 'en' ? 'Package Schedule' : 'Jadwal Paket'}</span>
          </button>
          <button
            type="button"
            onClick={() => setScheduleMode('custom')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-body-xs font-bold transition-all cursor-pointer ${
              isCustomMode
                ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 shadow-level-1 border border-amber-500/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon name="star" size={15} className={isCustomMode ? 'text-amber-500' : ''} />
            <span>{language === 'en' ? 'Custom Schedule' : 'Jadwal Kustom'} {customScheduleIds.length > 0 ? `(${customScheduleIds.length})` : ''}</span>
          </button>
        </div>

        {isCustomMode && (
          <button
            type="button"
            onClick={() => setCustomModalOpen(true)}
            className="flex items-center gap-1 rounded-xl bg-amber-500 text-slate-900 px-2.5 py-1 text-body-xs font-bold hover:bg-amber-400 active:opacity-80 transition-all shadow-level-1 cursor-pointer shrink-0"
          >
            <Icon name="tune" size={14} />
            <span>Atur Matkul</span>
          </button>
        )}

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-outline-variant/30 shrink-0" />

        {/* 4 Action Buttons (Kotak 32x32px, Icon Saja, Tooltip saat hover, warna ikon berbeda) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setAttendanceModalOpen(true)}
            title="Rekap Presensi – Lihat rekapitulasi kehadiran & sisa jatah absen seluruh mata kuliah"
            aria-label="Rekap Presensi"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 active:opacity-80 transition-all shadow-level-1 cursor-pointer"
          >
            <Icon name="fact_check" size={16} />
          </button>

          <button
            type="button"
            onClick={() => setNotesModalOpen(true)}
            title="Semua Catatan – Lihat seluruh catatan perkuliahan semester ini"
            aria-label="Semua Catatan"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 active:opacity-80 transition-all shadow-level-1 cursor-pointer"
          >
            <Icon name="sticky_note_2" size={16} />
          </button>

          <button
            type="button"
            onClick={() => setPrintModalOpen(true)}
            title="Cetak PDF – Unduh atau cetak jadwal format meja belajar / kartu saku"
            aria-label="Cetak PDF"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 active:opacity-80 transition-all shadow-level-1 cursor-pointer"
          >
            <Icon name="print" size={16} />
          </button>

          <button
            type="button"
            onClick={() => setKrsSimulatorOpen(true)}
            title="Simulator KRS – Simulasikan pemilihan KRS & cek bentrok waktu semester baru"
            aria-label="Simulator KRS"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 active:opacity-80 transition-all shadow-level-1 cursor-pointer"
          >
            <Icon name="science" size={16} />
          </button>
        </div>
      </div>

      {/* Right: Legend Acuan Warna Tipe Kelas (4 dot warna + label) */}
      <div className="flex items-center gap-2.5 tablet:gap-3 shrink-0 text-label-caps font-semibold text-on-surface-variant bg-surface-container/50 dark:bg-surface-container-high/40 px-3 py-1 rounded-xl border border-outline-variant/20">
        <span className="text-label-caps uppercase font-bold text-on-surface-variant/70 tracking-wider">Tipe:</span>
        <div className="flex items-center gap-1.5" title="K1: Kelas Reguler / Offline di Ruangan Fisik">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-level-1" />
          <span className="text-emerald-950 dark:text-emerald-200">K1 (Offline)</span>
        </div>
        <div className="flex items-center gap-1.5" title="K2: Kelas Karyawan / Online (Zoom/Google Meet)">
          <span className="h-2 w-2 rounded-full bg-blue-500 shadow-level-1" />
          <span className="text-blue-950 dark:text-blue-200">K2 (Online)</span>
        </div>
        <div className="flex items-center gap-1.5" title="HB: Hybrid (Kombinasi tatap muka & daring)">
          <span className="h-2 w-2 rounded-full bg-violet-500 shadow-level-1" />
          <span className="text-violet-950 dark:text-violet-200">HB (Hybrid)</span>
        </div>
        <div className="flex items-center gap-1.5" title="GBK: Kelas Gabungan Lintas Prodi/Angkatan">
          <span className="h-2 w-2 rounded-full bg-amber-500 shadow-level-1" />
          <span className="text-amber-950 dark:text-amber-200">GBK (Gabung)</span>
        </div>
      </div>
    </div>
  )
}
