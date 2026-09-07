import { formatRuang } from "../../../lib/scheduleUtils"

export function NoticeboardPaperPreview({
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
    <div className="tablet:col-span-7 p-4 tablet:p-6 overflow-y-auto bg-surface-container-low/20 dark:bg-surface-container-high/10 flex justify-center items-start custom-scrollbar">
      <div className="w-full max-w-[660px] bg-white text-black p-6 tablet:p-8 rounded-2xl shadow-level-2 border border-neutral-300 min-h-full flex flex-col justify-between my-auto tablet:my-0">
        <div>
          {/* Header Kop Surat Formal */}
          <div className="border-b-2 border-black pb-3 text-center">
            <h2 className="text-body-sm font-extrabold tracking-wider uppercase">{univName}</h2>
            <h3 className="text-body-xs font-bold uppercase mt-0.5">{facultyName}</h3>
            <div className="h-0.5 w-full bg-black my-1" />
            <h4 className="text-title-sm font-black tracking-wide uppercase mt-2">{docTitle}</h4>
            <p className="text-label-caps font-semibold mt-0.5">
              TAHUN AJARAN {currentTA || "2026/2027"}
              {prodiFilter ? ` · PROGRAM STUDI ${prodiFilter.toUpperCase()}` : ""}
              {semesterFilter ? ` · SEMESTER ${semesterFilter}` : ""}
            </p>
          </div>

          {/* Tabel Jadwal Formal */}
          <div className="mt-4 border border-black overflow-hidden rounded-xs">
            <table className="w-full border-collapse text-[10px] text-left">
              <thead>
                <tr className="bg-neutral-100 border-b border-black font-extrabold uppercase text-[9px]">
                  <th className="p-1.5 border-r border-black w-8 text-center">No</th>
                  <th className="p-1.5 border-r border-black w-24">Hari & Jam</th>
                  <th className="p-1.5 border-r border-black w-20">Kode</th>
                  <th className="p-1.5 border-r border-black">Mata Kuliah & SKS</th>
                  <th className="p-1.5 border-r border-black w-32">Dosen Pengampu</th>
                  <th className="p-1.5 w-16 text-center">Ruang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300 font-medium">
                {sortedSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-neutral-500 italic">
                      Tidak ada jadwal yang sesuai dengan kriteria filter saat ini.
                    </td>
                  </tr>
                ) : (
                  sortedSchedules.map((s, idx) => {
                    const c = courseMap.get(s.kodeMK)
                    return (
                      <tr key={s.id || idx} className="hover:bg-neutral-50">
                        <td className="p-1.5 border-r border-neutral-300 text-center font-bold">{idx + 1}</td>
                        <td className="p-1.5 border-r border-neutral-300">
                          <span className="font-bold">{s.hari}</span>
                          <span className="block text-[9px] text-neutral-600 font-mono">
                            {s.jamMulai} - {s.jamSelesai}
                          </span>
                        </td>
                        <td className="p-1.5 border-r border-neutral-300 font-mono font-bold">{s.kodeMK}</td>
                        <td className="p-1.5 border-r border-neutral-300">
                          <span className="font-bold text-black">{c?.namaMK || s.kodeMK}</span>
                          <span className="block text-[9px] text-neutral-600">
                            {c?.sks || 2} SKS · Sem {s.semester} · {s.tipeKelas || "K1"}
                          </span>
                        </td>
                        <td className="p-1.5 border-r border-neutral-300 text-[9.5px] leading-tight">
                          {c?.dosen || "-"}
                        </td>
                        <td className="p-1.5 text-center font-bold">{formatRuang(s.ruang, s.tipeKelas)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Tanda Tangan Formal */}
        <div className="mt-8 pt-4 flex justify-between items-end text-[10px]">
          <div className="text-neutral-500 text-[9px]">
            <p>* Dokumen ini sah dan diterbitkan melalui Sistem Informasi JadwalKu.</p>
            <p>ID Dokumen: JDWL-{new Date().getFullYear()}-{sortedSchedules.length}SESI</p>
          </div>

          <div className="text-center min-w-[200px]">
            <p>{cityDate}</p>
            <p className="font-bold mt-0.5">{officialRole}</p>
            <div className="h-14" />
            <p className="font-bold underline text-[11px]">{officialName}</p>
            <p className="text-[9.5px] text-neutral-700">{officialNip}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
