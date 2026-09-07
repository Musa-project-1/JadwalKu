import { formatRuang } from "../../../lib/scheduleUtils"
import { getItem, STORAGE_KEYS } from "../../../lib/storage"
import { parseLecturers } from "../../../lib/lecturerUtils"

export function PrintPreviewWall({
  activeDays,
  groupedByDay,
  courseMap,
  showRoom,
  showLecturer,
  showSks,
  showNotes,
}) {
  return (
    <div className="space-y-2.5">
      {activeDays.map((day) => {
        const entries = groupedByDay.get(day) || []
        return (
          <div key={day} className="border border-neutral-300 rounded-md overflow-hidden bg-white">
            <div className="bg-neutral-100 px-2.5 py-1 font-bold text-[10.5px] text-neutral-900 border-b border-neutral-300 flex items-center justify-between">
              <span>HARI {day.toUpperCase()}</span>
              <span className="font-semibold text-[9px] text-neutral-600">{entries.length} mata kuliah</span>
            </div>
            <table className="w-full text-left border-collapse text-[10px] bg-white">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-[9px] text-neutral-700 uppercase font-bold">
                  <th className="py-1.5 px-2 w-[85px]">Waktu</th>
                  <th className="py-1.5 px-2">Mata Kuliah</th>
                  {showRoom && <th className="py-1.5 px-2 w-[100px]">Ruang</th>}
                  {showLecturer && <th className="py-1.5 px-2">Dosen Pengampu</th>}
                  {showSks && <th className="py-1.5 px-2 w-[45px] text-center">SKS</th>}
                </tr>
              </thead>
              <tbody className="bg-white text-neutral-900">
                {entries.map((e, idx) => {
                  const c = courseMap.get(e.kodeMK)
                  const note = getItem(`${STORAGE_KEYS.courseNotes}:${e.kodeMK}`, "")
                  return (
                    <tr key={e.id || idx} className="border-b border-neutral-200/80 last:border-0 bg-white">
                      <td className="py-1.5 px-2 font-bold whitespace-nowrap text-neutral-900">
                        {e.jamMulai} - {e.jamSelesai}
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="font-bold text-neutral-900">{c?.namaMK || e.kodeMK}</div>
                        {showNotes && note && (
                          <div className="text-[8.5px] text-neutral-600 italic mt-0.5">
                            Catatan: {note}
                          </div>
                        )}
                      </td>
                      {showRoom && (
                        <td className="py-1.5 px-2 text-neutral-800">
                          {formatRuang(e.ruang, e.tipeKelas)}
                        </td>
                      )}
                      {showLecturer && (
                        <td className="py-1.5 px-2 text-neutral-700 text-[9px] leading-snug">
                          {c?.dosen ? parseLecturers(c.dosen).join(' · ') : "-"}
                        </td>
                      )}
                      {showSks && (
                        <td className="py-1.5 px-2 text-center font-bold text-neutral-900">
                          {c?.sks || 2}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
