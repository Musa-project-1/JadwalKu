import { Icon } from "../../Icon"

export function PrintOptionsPanel({
  layoutFormat,
  setLayoutFormat,
  customTitle,
  setCustomTitle,
  showLecturer,
  setShowLecturer,
  showRoom,
  setShowRoom,
  showSks,
  setShowSks,
  showNotes,
  setShowNotes,
  showMemoSpace,
  setShowMemoSpace,
  activeOptionsCount,
  t,
}) {
  return (
    <div className="w-full tablet:w-80 shrink-0 p-3 tablet:p-5 border-b tablet:border-b-0 tablet:border-r border-outline-variant/20 bg-surface-container-low/40 dark:bg-surface-container-high/20 flex flex-col justify-between space-y-2.5 tablet:space-y-4 overflow-y-auto custom-scrollbar">
      <div className="space-y-2.5 tablet:space-y-3.5">
        {/* Layout Format Selector Card */}
        <div className="rounded-xl tablet:rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-2.5 tablet:p-3.5 space-y-1.5 shadow-2xs">
          <label className="block text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold">
            {t ? t("print.layout_format") : "Format Tata Letak"}
          </label>
          <div className="grid grid-cols-3 gap-1 bg-surface-container-high/60 p-0.5 rounded-lg border border-outline-variant/20">
            {[
              { id: "wall", label: t ? t("print.format_wall") : "Meja", icon: "table_chart" },
              { id: "matrix", label: t ? t("print.format_matrix") : "Matriks", icon: "grid_view" },
              { id: "pocket", label: t ? t("print.format_pocket") : "Saku", icon: "menu_book" },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setLayoutFormat(fmt.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md text-center transition-all cursor-pointer ${
                  layoutFormat === fmt.id
                    ? "bg-teal-700 text-white font-bold shadow-level-1"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <Icon name={fmt.icon} size={16} className="mb-0.5" />
                <span className="text-[10.5px] font-bold leading-tight">{fmt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Header Title Input Card */}
        <div className="rounded-xl tablet:rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-2.5 tablet:p-3.5 space-y-1 shadow-2xs">
          <label className="block text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold">
            {t ? t("print.header_note") : "Nama / Catatan Header"}
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder={t ? t("print.header_placeholder") : "Misal: Nama (NIM) atau Catatan"}
            className="w-full px-2.5 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-low/60 text-body-xs text-on-surface focus:outline-none focus:border-teal-600 dark:bg-surface-container-high/60 shadow-2xs"
          />
        </div>

        {/* Elemen yang Disertakan Card */}
        <div className="rounded-xl tablet:rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-2.5 tablet:p-3.5 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="block text-[10.5px] uppercase tracking-wider text-on-surface-variant font-extrabold">
              {t ? t("print.info_included") : "Informasi Disertakan"}
            </label>
            <span className="text-[9.5px] font-extrabold text-teal-800 dark:text-teal-300 bg-teal-500/15 border border-teal-500/25 px-1.5 py-0.2 rounded-full">
              {t ? t("print.active_options", { count: activeOptionsCount }) : `${activeOptionsCount}/5 Aktif`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <label className={`flex items-center gap-1.5 p-1.5 px-2 rounded-lg border transition-all cursor-pointer select-none group ${
              showLecturer
                ? "border-teal-600/40 bg-teal-500/15 text-teal-900 dark:text-teal-200 font-bold shadow-2xs"
                : "border-outline-variant/20 bg-surface-container-low/50 text-on-surface-variant hover:border-outline-variant/40 dark:bg-surface-container-high/30"
            }`}>
              <input
                type="checkbox"
                checked={showLecturer}
                onChange={(e) => setShowLecturer(e.target.checked)}
                className="h-3.5 w-3.5 rounded text-teal-600 focus:ring-teal-600 cursor-pointer accent-teal-600 shrink-0"
              />
              <div className="flex items-center gap-1 min-w-0">
                <Icon name="person" size={14} className={showLecturer ? "text-teal-700 dark:text-teal-400" : "text-on-surface-variant"} />
                <span className="text-[10.5px] font-bold leading-tight">{t ? t("print.lecturer") : "Dosen"}</span>
              </div>
            </label>

            <label className={`flex items-center gap-1.5 p-1.5 px-2 rounded-lg border transition-all cursor-pointer select-none group ${
              showRoom
                ? "border-teal-600/40 bg-teal-500/15 text-teal-900 dark:text-teal-200 font-bold shadow-2xs"
                : "border-outline-variant/20 bg-surface-container-low/50 text-on-surface-variant hover:border-outline-variant/40 dark:bg-surface-container-high/30"
            }`}>
              <input
                type="checkbox"
                checked={showRoom}
                onChange={(e) => setShowRoom(e.target.checked)}
                className="h-3.5 w-3.5 rounded text-teal-600 focus:ring-teal-600 cursor-pointer accent-teal-600 shrink-0"
              />
              <div className="flex items-center gap-1 min-w-0">
                <Icon name="meeting_room" size={14} className={showRoom ? "text-teal-700 dark:text-teal-400" : "text-on-surface-variant"} />
                <span className="text-[10.5px] font-bold leading-tight">{t ? t("print.room") : "Ruangan"}</span>
              </div>
            </label>

            <label className={`flex items-center gap-1.5 p-1.5 px-2 rounded-lg border transition-all cursor-pointer select-none group ${
              showSks
                ? "border-teal-600/40 bg-teal-500/15 text-teal-900 dark:text-teal-200 font-bold shadow-2xs"
                : "border-outline-variant/20 bg-surface-container-low/50 text-on-surface-variant hover:border-outline-variant/40 dark:bg-surface-container-high/30"
            }`}>
              <input
                type="checkbox"
                checked={showSks}
                onChange={(e) => setShowSks(e.target.checked)}
                className="h-3.5 w-3.5 rounded text-teal-600 focus:ring-teal-600 cursor-pointer accent-teal-600 shrink-0"
              />
              <div className="flex items-center gap-1 min-w-0">
                <Icon name="menu_book" size={14} className={showSks ? "text-teal-700 dark:text-teal-400" : "text-on-surface-variant"} />
                <span className="text-[10.5px] font-bold leading-tight">{t ? t("print.sks") : "SKS"}</span>
              </div>
            </label>

            <label className={`flex items-center gap-1.5 p-1.5 px-2 rounded-lg border transition-all cursor-pointer select-none group ${
              showNotes
                ? "border-teal-600/40 bg-teal-500/15 text-teal-900 dark:text-teal-200 font-bold shadow-2xs"
                : "border-outline-variant/20 bg-surface-container-low/50 text-on-surface-variant hover:border-outline-variant/40 dark:bg-surface-container-high/30"
            }`}>
              <input
                type="checkbox"
                checked={showNotes}
                onChange={(e) => setShowNotes(e.target.checked)}
                className="h-3.5 w-3.5 rounded text-teal-600 focus:ring-teal-600 cursor-pointer accent-teal-600 shrink-0"
              />
              <div className="flex items-center gap-1 min-w-0">
                <Icon name="sticky_note_2" size={14} className={showNotes ? "text-teal-700 dark:text-teal-400" : "text-on-surface-variant"} />
                <span className="text-[10.5px] font-bold leading-tight">{t ? t("print.notes") : "Catatan"}</span>
              </div>
            </label>

            <label className={`col-span-2 flex items-center gap-1.5 p-1.5 px-2 rounded-lg border transition-all cursor-pointer select-none group ${
              showMemoSpace
                ? "border-teal-600/40 bg-teal-500/15 text-teal-900 dark:text-teal-200 font-bold shadow-2xs"
                : "border-outline-variant/20 bg-surface-container-low/50 text-on-surface-variant hover:border-outline-variant/40 dark:bg-surface-container-high/30"
            }`}>
              <input
                type="checkbox"
                checked={showMemoSpace}
                onChange={(e) => setShowMemoSpace(e.target.checked)}
                className="h-3.5 w-3.5 rounded text-teal-600 focus:ring-teal-600 cursor-pointer accent-teal-600 shrink-0"
              />
              <div className="flex items-center gap-1 min-w-0">
                <Icon name="draw" size={14} className={showMemoSpace ? "text-teal-700 dark:text-teal-400" : "text-on-surface-variant"} />
                <span className="text-[10.5px] font-bold leading-tight">{t ? t("print.memo_space") : "Kolom Memo Tulis Tangan"}</span>
              </div>
            </label>
          </div>
        </div>

        {/* Tips Cetak Card */}
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2 text-[10px] tablet:text-[10.5px] text-amber-950 dark:text-amber-200 leading-snug space-y-0.5 shadow-2xs">
          <p className="font-bold flex items-center gap-1 text-amber-900 dark:text-amber-300">
            <Icon name="lightbulb" size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Tips Hemat Tinta:</span>
          </p>
          <p className="font-medium">
            Pilih opsi <strong>&quot;Save as PDF&quot;</strong> atau atur printer ke <strong>&quot;Monochrome&quot;</strong> untuk hasil bersih dan hemat tinta.
          </p>
        </div>
      </div>
    </div>
  )
}
