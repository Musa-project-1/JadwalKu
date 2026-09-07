import { parseTimeToMinutes } from "../../../lib/scheduleGridUtils"
import { formatRuang } from "../../../lib/scheduleUtils"
import { parseLecturers } from "../../../lib/lecturerUtils"

export function PrintPreviewMatrix({
  groupedByDay,
  courseMap,
  showRoom,
  showLecturer,
}) {
  return (
    <div className="border border-neutral-300 rounded-md overflow-hidden bg-white">
      <table className="w-full text-left border-collapse text-[9.5px] table-fixed">
        <thead>
          <tr className="border-b border-neutral-300 bg-neutral-100 text-neutral-800 font-bold uppercase text-[9px]">
            <th className="w-[68px] p-1.5 border-r border-neutral-300 text-center">Sesi / Waktu</th>
            {["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].map((d) => (
              <th key={d} className="p-1.5 border-r last:border-r-0 border-neutral-300 text-center">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {[
            { id: "pagi", label: "Pagi", time: "07.00 - 11.30" },
            { id: "siang", label: "Siang", time: "13.00 - 15.00" },
            { id: "sore", label: "Sore", time: "15.30 - 17.45" },
            { id: "malam", label: "Malam", time: "18.30 - 21.00" },
          ].map((sess) => (
            <tr key={sess.id} className="align-top">
              <td className="p-1.5 border-r border-neutral-300 bg-neutral-50 text-center font-bold">
                <div className="text-[10px] text-neutral-900">{sess.label}</div>
                <div className="text-[8px] text-neutral-500 font-mono mt-0.5">{sess.time}</div>
              </td>
              {["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].map((d) => {
                const dayEntries = (groupedByDay.get(d) || []).filter((e) => {
                  const startMin = parseTimeToMinutes(e.jamMulai)
                  if (sess.id === "pagi") return startMin < 12 * 60
                  if (sess.id === "siang") return startMin >= 12 * 60 && startMin < 15 * 60 + 15
                  if (sess.id === "sore") return startMin >= 15 * 60 + 15 && startMin < 18 * 60
                  return startMin >= 18 * 60
                })

                return (
                  <td key={d} className="p-1 border-r last:border-r-0 border-neutral-200 min-h-[48px]">
                    {dayEntries.length === 0 ? (
                      <div className="h-6" />
                    ) : (
                      <div className="space-y-1">
                        {dayEntries.map((e, i) => {
                          const c = courseMap.get(e.kodeMK)
                          return (
                            <div
                              key={i}
                              className="border border-neutral-300 rounded p-1 bg-neutral-50/80 leading-tight"
                            >
                              <div className="flex items-center justify-between text-[8.5px] font-bold text-neutral-700">
                                <span>{e.tipeKelas || "K1"}</span>
                                <span className="font-mono">{e.jamMulai}</span>
                              </div>
                              <div className="font-bold text-[9.5px] text-neutral-900 line-clamp-2">
                                {c?.namaMK || e.kodeMK}
                              </div>
                              {showRoom && (
                                <div className="text-[8.5px] text-neutral-600 font-medium">
                                  {formatRuang(e.ruang, e.tipeKelas)}
                                </div>
                              )}
                              {showLecturer && c?.dosen && (
                                <div className="text-[8px] text-neutral-500 truncate">
                                  {parseLecturers(c.dosen).join(' · ')}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
