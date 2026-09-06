import { formatRuang } from "../../../lib/scheduleUtils"

export function PrintPreviewPocket({
  program,
  semester,
  tahunAjaran,
  customTitle,
  currentDateFormatted,
  totalSks,
  scheduleEntries,
  groupedByDay,
  courseMap,
  showRoom,
  showLecturer,
}) {
  return (
    <div className="space-y-2">
      <div className="text-[9px] text-neutral-500 italic mb-1 flex items-center gap-1">
        <span>💡 Lipat kertas menjadi 8 bagian sesuai garis panduan lipatan (Pocket Booklet A4).</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 border border-dashed border-neutral-400 p-2 rounded bg-neutral-50/40">
        {/* Panel 1: Cover */}
        <div className="border border-neutral-300 rounded p-2 bg-white flex flex-col justify-between h-[155px] text-center">
          <div>
            <div className="text-[8px] uppercase tracking-widest text-neutral-500 font-bold">JADWAL KULIAH</div>
            <div className="text-[12px] font-extrabold text-neutral-900 mt-1 leading-tight">{program || "KAMPUS"}</div>
            <div className="text-[9px] font-bold text-neutral-700 mt-0.5">SEMESTER {semester}</div>
            <div className="text-[8px] text-neutral-500 mt-0.5">TA {tahunAjaran}</div>
          </div>
          {customTitle && (
            <div className="text-[9px] font-bold text-neutral-800 bg-neutral-100 p-1 rounded">
              {customTitle}
            </div>
          )}
          <div className="text-[7.5px] text-neutral-500 border-t border-neutral-200 pt-1">
            {totalSks} SKS · {scheduleEntries.length} Kelas
          </div>
        </div>

        {/* Panel 2-6: Hari Senin-Jumat */}
        {["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].map((d) => {
          const entries = groupedByDay.get(d) || []
          return (
            <div key={d} className="border border-neutral-300 rounded p-1.5 bg-white flex flex-col h-[155px] overflow-hidden text-left">
              <div className="bg-neutral-100 px-1 py-0.5 font-bold text-[9px] text-neutral-800 border-b border-neutral-200 flex justify-between">
                <span>{d.toUpperCase()}</span>
                <span className="text-[7.5px] font-normal text-neutral-500">{entries.length} MK</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-0.5 text-[8.5px]">
                {entries.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[8px] text-neutral-400 italic">
                    Libur
                  </div>
                ) : (
                  entries.map((e, idx) => {
                    const c = courseMap.get(e.kodeMK)
                    return (
                      <div key={idx} className="leading-tight border-b border-neutral-100 pb-0.5 last:border-0">
                        <div className="font-bold text-neutral-900 truncate">
                          {c?.namaMK || e.kodeMK}
                        </div>
                        <div className="text-[7.5px] text-neutral-600 flex justify-between font-mono">
                          <span>{e.jamMulai}</span>
                          {showRoom && <span>{formatRuang(e.ruang, e.tipeKelas)}</span>}
                        </div>
                        {showLecturer && c?.dosen && (
                          <div className="text-[7px] text-neutral-500 truncate">{c.dosen}</div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}

        {/* Panel 7: Kontak & Catatan */}
        <div className="border border-neutral-300 rounded p-2 bg-white flex flex-col justify-between h-[155px] text-left">
          <div className="text-[8.5px] font-bold text-neutral-800 border-b border-neutral-200 pb-1">
            TARGET & CATATAN
          </div>
          <div className="space-y-1.5 flex-1 mt-1">
            <div className="h-2 border-b border-dotted border-neutral-300" />
            <div className="h-2 border-b border-dotted border-neutral-300" />
            <div className="h-2 border-b border-dotted border-neutral-300" />
            <div className="h-2 border-b border-dotted border-neutral-300" />
          </div>
          <div className="text-[7.5px] text-neutral-500 pt-1 border-t border-neutral-200">
            Dicetak: {currentDateFormatted}
          </div>
        </div>

        {/* Panel 8: Back Cover */}
        <div className="border border-neutral-300 rounded p-2 bg-white flex flex-col items-center justify-center h-[155px] text-center">
          <div className="text-[14px] font-extrabold text-neutral-900 tracking-tight">JadwalKu</div>
          <div className="text-[8px] text-neutral-500 mt-1">Simpan jadwal kuliah di saku Anda</div>
        </div>
      </div>
    </div>
  )
}
