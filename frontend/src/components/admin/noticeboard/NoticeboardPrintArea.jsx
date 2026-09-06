import { formatRuang } from "../../../lib/scheduleUtils"

export function NoticeboardPrintArea({
  univName,
  facultyName,
  docTitle,
  currentTA,
  prodiFilter,
  semesterFilter,
  sortedSchedules,
  courseMap,
  cityDate,
  officialRole,
  officialName,
  officialNip,
}) {
  return (
    <div id="official-noticeboard-print-area" className="hidden print:block text-black bg-white p-4">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm 12mm;
              }
              body * {
                visibility: hidden !important;
              }
              #official-noticeboard-print-area, #official-noticeboard-print-area * {
                visibility: visible !important;
              }
              #official-noticeboard-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
                color: black !important;
                display: block !important;
              }
            }
          `,
        }}
      />

      <div className="border-b-2 border-black pb-2 text-center">
        <h2 className="text-sm font-extrabold tracking-wider uppercase">{univName}</h2>
        <h3 className="text-xs font-bold uppercase mt-0.5">{facultyName}</h3>
        <div className="h-0.5 w-full bg-black my-1" />
        <h4 className="text-base font-black tracking-wide uppercase mt-2">{docTitle}</h4>
        <p className="text-[10px] font-semibold mt-0.5">
          TAHUN AJARAN {currentTA || "2026/2027"}
          {prodiFilter ? ` · PROGRAM STUDI ${prodiFilter.toUpperCase()}` : ""}
          {semesterFilter ? ` · SEMESTER ${semesterFilter}` : ""}
        </p>
      </div>

      <table className="w-full border-collapse text-[10px] text-left mt-3 border border-black">
        <thead>
          <tr className="bg-neutral-100 border-b border-black font-extrabold uppercase text-[9px]">
            <th className="p-1.5 border-r border-black w-8 text-center">No</th>
            <th className="p-1.5 border-r border-black w-24">Hari & Jam</th>
            <th className="p-1.5 border-r border-black w-20">Kode</th>
            <th className="p-1.5 border-r border-black">Mata Kuliah & SKS</th>
            <th className="p-1.5 border-r border-black w-36">Dosen Pengampu</th>
            <th className="p-1.5 w-16 text-center">Ruang</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-300 font-medium">
          {sortedSchedules.map((s, idx) => {
            const c = courseMap.get(s.kodeMK)
            return (
              <tr key={idx}>
                <td className="p-1.5 border-r border-neutral-300 text-center font-bold">{idx + 1}</td>
                <td className="p-1.5 border-r border-neutral-300">
                  <span className="font-bold">{s.hari}</span>
                  <span className="block text-[8.5px] text-neutral-600 font-mono">
                    {s.jamMulai} - {s.jamSelesai}
                  </span>
                </td>
                <td className="p-1.5 border-r border-neutral-300 font-mono font-bold">{s.kodeMK}</td>
                <td className="p-1.5 border-r border-neutral-300">
                  <span className="font-bold text-black">{c?.namaMK || s.kodeMK}</span>
                  <span className="block text-[8.5px] text-neutral-600">
                    {c?.sks || 2} SKS · Sem {s.semester} · {s.tipeKelas || "K1"}
                  </span>
                </td>
                <td className="p-1.5 border-r border-neutral-300 text-[9.5px]">{c?.dosen || "-"}</td>
                <td className="p-1.5 text-center font-bold">{formatRuang(s.ruang, s.tipeKelas)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="mt-8 pt-4 flex justify-between items-end text-[10px] break-inside-avoid">
        <div className="text-neutral-500 text-[9px]">
          <p>* Dokumen resmi akademik JadwalKu.</p>
        </div>
        <div className="text-center min-w-[200px]">
          <p>{cityDate}</p>
          <p className="font-bold mt-0.5">{officialRole}</p>
          <div className="h-16" />
          <p className="font-bold underline text-[11px]">{officialName}</p>
          <p className="text-[9.5px] text-neutral-700">{officialNip}</p>
        </div>
      </div>
    </div>
  )
}
