import { formatRuang } from '../../../lib/scheduleUtils'
import { getItem, STORAGE_KEYS } from '../../../lib/storage'
import { parseTimeToMinutes } from '../../../lib/scheduleGridUtils'
import { parseLecturers } from '../../../lib/lecturerUtils'

export function PrintablePageArea({
  layoutFormat,
  program,
  semester,
  tahunAjaran,
  customTitle,
  currentDateFormatted,
  totalSks,
  scheduleEntries,
  activeDays,
  groupedByDay,
  courseMap,
  showRoom,
  showLecturer,
  showSks,
  showNotes,
  showMemoSpace,
}) {
  return (
    <div id="printable-schedule-area" className="hidden print:block text-neutral-900 bg-white p-2">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-schedule-area, #printable-schedule-area * {
                visibility: visible !important;
              }
              #printable-schedule-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
                color: #111 !important;
                display: block !important;
              }
            }
          `,
        }}
      />

      {/* Paper Header */}
      <div className="border-b-2 border-neutral-900 pb-2 mb-3 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight uppercase text-neutral-900">
            JADWAL KULIAH MAHASISWA
          </h1>
          <p className="text-xs font-bold text-neutral-800 mt-0.5">
            {program} · Semester {semester} {tahunAjaran ? `· Tahun Ajaran ${tahunAjaran}` : ''}
          </p>
          {customTitle && (
            <p className="text-xs font-semibold text-neutral-800 mt-1">
              {customTitle}
            </p>
          )}
        </div>
        <div className="text-right text-[10px] text-neutral-700 font-medium">
          <p>Total Beban: <strong>{totalSks} SKS</strong> ({scheduleEntries.length} Kelas)</p>
          <p className="mt-0.5">Tanggal Cetak: {currentDateFormatted}</p>
        </div>
      </div>

      {/* Content */}
      {layoutFormat === 'wall' ? (
        <div className="space-y-2.5">
          {activeDays.map((day) => {
            const entries = groupedByDay.get(day) || []
            return (
              <div key={day} className="border border-neutral-400 rounded overflow-hidden">
                <div className="bg-neutral-100 px-2.5 py-1 font-bold text-xs text-neutral-900 border-b border-neutral-400 flex items-center justify-between">
                  <span>HARI {day.toUpperCase()}</span>
                  <span className="font-normal text-[10px] text-neutral-700">{entries.length} mata kuliah</span>
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-300 bg-neutral-50 text-[10px] text-neutral-700 uppercase font-bold">
                      <th className="py-1 px-2.5 w-[90px]">Waktu</th>
                      <th className="py-1 px-2.5">Mata Kuliah</th>
                      {showRoom && <th className="py-1 px-2.5 w-[120px]">Ruangan</th>}
                      {showLecturer && <th className="py-1 px-2.5">Dosen Pengampu</th>}
                      {showSks && <th className="py-1 px-2.5 w-[50px] text-center">SKS</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e, idx) => {
                      const c = courseMap.get(e.kodeMK)
                      const note = getItem(`${STORAGE_KEYS.courseNotes}:${e.kodeMK}`, '')
                      return (
                        <tr key={e.id || idx} className="border-b border-neutral-200 last:border-0">
                          <td className="py-1 px-2.5 font-bold whitespace-nowrap">
                            {e.jamMulai} - {e.jamSelesai}
                          </td>
                          <td className="py-1 px-2.5">
                            <div className="font-bold">{c?.namaMK || e.kodeMK}</div>
                            {showNotes && note && (
                              <div className="text-[9px] text-neutral-600 italic">
                                Catatan: {note}
                              </div>
                            )}
                          </td>
                          {showRoom && <td className="py-1 px-2.5">{formatRuang(e.ruang, e.tipeKelas)}</td>}
                          {showLecturer && (
                            <td className="py-1 px-2.5 text-[9.5px] leading-snug text-neutral-700">
                              {c?.dosen ? parseLecturers(c.dosen).join(' · ') : '-'}
                            </td>
                          )}
                          {showSks && <td className="py-1 px-2.5 text-center font-bold">{c?.sks || 2}</td>}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      ) : layoutFormat === 'matrix' ? (
        <div className="border border-neutral-400 rounded overflow-hidden">
          <table className="w-full text-left border-collapse text-[10px] table-fixed">
            <thead>
              <tr className="border-b border-neutral-400 bg-neutral-100 text-neutral-900 font-bold uppercase text-[9px]">
                <th className="w-[75px] p-2 border-r border-neutral-400 text-center">Sesi / Waktu</th>
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((d) => (
                  <th key={d} className="p-2 border-r last:border-r-0 border-neutral-400 text-center">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {[
                { id: 'pagi', label: 'Pagi', time: '07.00 - 11.30' },
                { id: 'siang', label: 'Siang', time: '13.00 - 15.00' },
                { id: 'sore', label: 'Sore', time: '15.30 - 17.45' },
                { id: 'malam', label: 'Malam', time: '18.30 - 21.00' },
              ].map((sess) => (
                <tr key={sess.id} className="align-top">
                  <td className="p-2 border-r border-neutral-400 bg-neutral-50 text-center font-bold">
                    <div className="text-[11px] text-neutral-900">{sess.label}</div>
                    <div className="text-[9px] text-neutral-600 font-mono mt-0.5">{sess.time}</div>
                  </td>
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((d) => {
                    const dayEntries = (groupedByDay.get(d) || []).filter((e) => {
                      const startMin = parseTimeToMinutes(e.jamMulai)
                      if (sess.id === 'pagi') return startMin < 12 * 60
                      if (sess.id === 'siang') return startMin >= 12 * 60 && startMin < 15 * 60 + 15
                      if (sess.id === 'sore') return startMin >= 15 * 60 + 15 && startMin < 18 * 60
                      return startMin >= 18 * 60
                    })

                    return (
                      <td key={d} className="p-1.5 border-r last:border-r-0 border-neutral-300 min-h-[60px]">
                        {dayEntries.length === 0 ? (
                          <div className="h-8" />
                        ) : (
                          <div className="space-y-1.5">
                            {dayEntries.map((e, i) => {
                              const c = courseMap.get(e.kodeMK)
                              return (
                                <div key={i} className="border border-neutral-400 rounded p-1 bg-neutral-50/80 leading-tight">
                                  <div className="flex items-center justify-between text-[9px] font-bold text-neutral-700">
                                    <span>{e.tipeKelas || 'K1'}</span>
                                    <span className="font-mono">{e.jamMulai}</span>
                                  </div>
                                  <div className="font-bold text-[10px] text-neutral-900 line-clamp-2">
                                    {c?.namaMK || e.kodeMK}
                                  </div>
                                  {showRoom && (
                                    <div className="text-[9px] text-neutral-600 font-medium">
                                      {formatRuang(e.ruang, e.tipeKelas)}
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
      ) : null}

      {/* Memo Box */}
      {showMemoSpace && (
        <div className="mt-4 pt-3 border-t border-neutral-400">
          <div className="flex items-center justify-between text-[10px] text-neutral-800 font-bold mb-1">
            <span>CATATAN / TARGET BELAJAR SEMESTER:</span>
            <span>TARGET IPK: [____]</span>
          </div>
          <div className="border border-dashed border-neutral-400 rounded h-16 bg-neutral-50/50 p-2 text-[9px] text-neutral-500 font-medium">
            (Area catatan tangan atau pengingat tugas penting)
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-center text-[9px] text-neutral-600 font-medium">
        JadwalKu · Sistem Manajemen Jadwal Mahasiswa
      </div>
    </div>
  )
}
