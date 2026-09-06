import { useEffect, useMemo, useRef, useState } from "react"
import { Icon } from "../Icon"
import { NoticeboardConfigSidebar } from "./noticeboard/NoticeboardConfigSidebar"
import { NoticeboardPaperPreview } from "./noticeboard/NoticeboardPaperPreview"
import { NoticeboardPrintArea } from "./noticeboard/NoticeboardPrintArea"

export function OfficialNoticeboardModal({
  isOpen,
  onClose,
  allSchedules = [],
  courses = [],
  currentTA = "",
}) {
  const modalRef = useRef(null)

  // Formal Institutional Header State
  const [univName, setUnivName] = useState("UNIVERSITAS TEKNOLOGI KAMPUSKU")
  const [facultyName, setFacultyName] = useState("FAKULTAS TEKNIK & ILMU KOMPUTER")
  const [docTitle, setDocTitle] = useState("JADWAL PERKULIAHAN RESMI SEMESTER")

  // Filter State
  const [prodiFilter, setProdiFilter] = useState("")
  const [semesterFilter, setSemesterFilter] = useState("")
  const [dosenFilter, setDosenFilter] = useState("")
  const [hariFilter, setHariFilter] = useState("")

  // Sign-off State
  const currentDateFormatted = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date())

  const [cityDate, setCityDate] = useState(`Jakarta, ${currentDateFormatted}`)
  const [officialRole, setOfficialRole] = useState("Ketua Program Studi")
  const [officialName, setOfficialName] = useState("Dr. Eng. Hendra Wijaya, M.T.")
  const [officialNip, setOfficialNip] = useState("NIP. 19820415 200812 1 002")

  const courseMap = useMemo(() => {
    const map = new Map()
    courses.forEach((c) => {
      if (c?.kodeMK) map.set(c.kodeMK, c)
    })
    return map
  }, [courses])

  const prodiOptions = useMemo(() => {
    const set = new Set()
    allSchedules.forEach((s) => {
      if (s.prodi) set.add(s.prodi)
    })
    return [{ value: "", label: "Semua Program Studi" }, ...[...set].sort().map((p) => ({ value: p, label: p }))]
  }, [allSchedules])

  const lecturerOptions = useMemo(() => {
    const set = new Set()
    courses.forEach((c) => {
      if (c.dosen && c.dosen.trim() !== "-") set.add(c.dosen.trim())
    })
    return [{ value: "", label: "Semua Dosen Pengampu" }, ...[...set].sort().map((d) => ({ value: d, label: d }))]
  }, [courses])

  const filtered = useMemo(() => {
    return allSchedules.filter((s) => {
      if (prodiFilter && s.prodi !== prodiFilter) return false
      if (semesterFilter && Number(s.semester) !== Number(semesterFilter)) return false
      if (hariFilter && s.hari !== hariFilter) return false
      if (dosenFilter) {
        const course = courseMap.get(s.kodeMK)
        if (course?.dosen !== dosenFilter) return false
      }
      return true
    })
  }, [allSchedules, prodiFilter, semesterFilter, hariFilter, dosenFilter, courseMap])

  const sortedSchedules = useMemo(() => {
    const dayOrder = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6 }
    return [...filtered].sort((a, b) => {
      const orderA = dayOrder[a.hari] || 99
      const orderB = dayOrder[b.hari] || 99
      if (orderA !== orderB) return orderA - orderB
      const [aStartH, aStartM] = String(a.jamMulai).split(":").map(Number)
      const [bStartH, bStartM] = String(b.jamMulai).split(":").map(Number)
      return aStartH * 60 + aStartM - (bStartH * 60 + bStartM)
    })
  }, [filtered])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) onClose()
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function handleTriggerPrint() {
    window.print()
  }

  return (
    <>
      <div
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="official-noticeboard-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-6 bg-black/65 backdrop-blur-xs animate-fade-in print:hidden"
      >
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className="relative flex flex-col w-full max-w-5xl h-[92vh] max-h-[760px] rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-level-3 overflow-hidden animate-fade-up"
        >
          {/* Header Modal */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-800 p-4 tablet:px-6 tablet:py-4 text-white flex items-center justify-between border-b border-white/10 shrink-0 shadow-level-1">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-level-1 backdrop-blur-md">
                <Icon name="verified" size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 id="official-noticeboard-title" className="text-base tablet:text-lg font-bold text-white tracking-tight truncate">
                    Dokumen Mading & Papan Pengumuman Resmi
                  </h3>
                  <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-label-caps font-extrabold uppercase tracking-wide border border-white/25 shadow-level-1 backdrop-blur-md">
                    Kop Resmi
                  </span>
                </div>
                <p className="text-label-caps text-white/80 font-medium truncate mt-0.5">
                  Format tabel baku perguruan tinggi dengan kop surat dan legalitas tanda tangan pimpinan
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all border border-white/20 cursor-pointer"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          {/* Body: Split 2 Kolom (Config di Kiri, Preview di Kanan) */}
          <div className="flex-1 min-h-0 grid grid-cols-1 tablet:grid-cols-12 overflow-hidden">
            <NoticeboardConfigSidebar
              prodiFilter={prodiFilter}
              setProdiFilter={setProdiFilter}
              prodiOptions={prodiOptions}
              semesterFilter={semesterFilter}
              setSemesterFilter={setSemesterFilter}
              hariFilter={hariFilter}
              setHariFilter={setHariFilter}
              dosenFilter={dosenFilter}
              setDosenFilter={setDosenFilter}
              lecturerOptions={lecturerOptions}
              univName={univName}
              setUnivName={setUnivName}
              facultyName={facultyName}
              setFacultyName={setFacultyName}
              docTitle={docTitle}
              setDocTitle={setDocTitle}
              cityDate={cityDate}
              setCityDate={setCityDate}
              officialRole={officialRole}
              setOfficialRole={setOfficialRole}
              officialName={officialName}
              setOfficialName={setOfficialName}
              officialNip={officialNip}
              setOfficialNip={setOfficialNip}
            />

            <NoticeboardPaperPreview
              univName={univName}
              facultyName={facultyName}
              docTitle={docTitle}
              currentTA={currentTA}
              prodiFilter={prodiFilter}
              semesterFilter={semesterFilter}
              sortedSchedules={sortedSchedules}
              courseMap={courseMap}
              cityDate={cityDate}
              officialRole={officialRole}
              officialName={officialName}
              officialNip={officialNip}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-outline-variant/20 px-4 tablet:px-6 py-3 bg-surface-container-low/40 shrink-0">
            <div className="text-body-xs text-on-surface-variant font-medium">
              <span>{sortedSchedules.length} Sesi Terpilih</span>
              <span className="mx-2 text-outline-variant">·</span>
              <span>Siap dicetak pada ukuran kertas A4 Portrait</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-body-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleTriggerPrint}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-body-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Icon name="print" size={16} />
                <span>Cetak / Ekspor PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <NoticeboardPrintArea
        univName={univName}
        facultyName={facultyName}
        docTitle={docTitle}
        currentTA={currentTA}
        prodiFilter={prodiFilter}
        semesterFilter={semesterFilter}
        sortedSchedules={sortedSchedules}
        courseMap={courseMap}
        cityDate={cityDate}
        officialRole={officialRole}
        officialName={officialName}
        officialNip={officialNip}
      />
    </>
  )
}
