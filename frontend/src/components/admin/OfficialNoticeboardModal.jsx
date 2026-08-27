import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../Icon'
import { DAYS } from '../../lib/uploadValidator'
import { formatRuang } from '../../lib/scheduleUtils'

export function OfficialNoticeboardModal({
  isOpen,
  onClose,
  allSchedules = [],
  courses = [],
  currentTA = '',
}) {
  const modalRef = useRef(null)

  // 1. Formal Institutional Header State
  const [univName, setUnivName] = useState('UNIVERSITAS TEKNOLOGI KAMPUSKU')
  const [facultyName, setFacultyName] = useState('FAKULTAS TEKNIK & ILMU KOMPUTER')
  const [docTitle, setDocTitle] = useState('JADWAL PERKULIAHAN RESMI SEMESTER')

  // 2. Filter State
  const [prodiFilter, setProdiFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [dosenFilter, setDosenFilter] = useState('')
  const [hariFilter, setHariFilter] = useState('')

  // 3. Sign-off State
  const currentDateFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const [cityDate, setCityDate] = useState(`Jakarta, ${currentDateFormatted}`)
  const [officialRole, setOfficialRole] = useState('Ketua Program Studi')
  const [officialName, setOfficialName] = useState('Dr. Eng. Hendra Wijaya, M.T.')
  const [officialNip, setOfficialNip] = useState('NIP. 19820415 200812 1 002')

  // Course map
  const courseMap = useMemo(() => {
    const map = new Map()
    courses.forEach((c) => {
      if (c?.kodeMK) map.set(c.kodeMK, c)
    })
    return map
  }, [courses])

  // List of distinct Prodis
  const prodiOptions = useMemo(() => {
    const set = new Set()
    allSchedules.forEach((s) => {
      if (s.prodi) set.add(s.prodi)
    })
    return [{ value: '', label: 'Semua Program Studi' }, ...[...set].sort().map((p) => ({ value: p, label: p }))]
  }, [allSchedules])

  // List of distinct Lecturers
  const lecturerOptions = useMemo(() => {
    const set = new Set()
    courses.forEach((c) => {
      if (c.dosen && c.dosen.trim() !== '-') set.add(c.dosen.trim())
    })
    return [{ value: '', label: 'Semua Dosen Pengampu' }, ...[...set].sort().map((d) => ({ value: d, label: d }))]
  }, [courses])

  // Filtered schedules
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

  // Group and sort by day
  const sortedSchedules = useMemo(() => {
    const dayOrder = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6 }
    return [...filtered].sort((a, b) => {
      const orderA = dayOrder[a.hari] || 99
      const orderB = dayOrder[b.hari] || 99
      if (orderA !== orderB) return orderA - orderB
      const [aStartH, aStartM] = String(a.jamMulai).split(':').map(Number)
      const [bStartH, bStartM] = String(b.jamMulai).split(':').map(Number)
      return aStartH * 60 + aStartM - (bStartH * 60 + bStartM)
    })
  }, [filtered])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function handleTriggerPrint() {
    window.print()
  }

  return (
    <>
      {/* 1. Modal Preview & Settings in Screen */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-5 animate-fade-in print:hidden">
        <div
          ref={modalRef}
          className="flex flex-col w-full max-w-6xl max-h-[94vh] overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl animate-fade-up"
        >
          {/* Header Modal */}
          <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4 shrink-0 bg-surface-container-low/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Icon name="table_chart" size={22} />
              </div>
              <div>
                <h2 className="text-title-md font-bold text-on-surface">Cetak Mading A4 Landscape Resmi</h2>
                <p className="text-body-xs text-on-surface-variant font-medium">
                  Format tabel formal A4 horizontal siap pasang di mading kampus atau dibagikan ke dosen
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          {/* Body: Sidebar Pengaturan Kiri & Preview Dokumen Kanan */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 p-5">
            {/* Sidebar Kontrol (Kiri: 4 Kolom) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Filter Lingkup Cetak */}
              <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/50 dark:bg-surface-container/30 p-3.5 space-y-2.5">
                <p className="text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                  Lingkup Jadwal
                </p>

                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                    Program Studi
                  </label>
                  <select
                    value={prodiFilter}
                    onChange={(e) => setProdiFilter(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface font-semibold focus:outline-none focus:border-primary dark:bg-surface-container-high"
                  >
                    {prodiOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                      Semester
                    </label>
                    <select
                      value={semesterFilter}
                      onChange={(e) => setSemesterFilter(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface font-semibold focus:outline-none focus:border-primary dark:bg-surface-container-high"
                    >
                      <option value="">Semua Sem</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                      Hari
                    </label>
                    <select
                      value={hariFilter}
                      onChange={(e) => setHariFilter(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface font-semibold focus:outline-none focus:border-primary dark:bg-surface-container-high"
                    >
                      <option value="">Semua Hari</option>
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                    Dosen Pengampu
                  </label>
                  <select
                    value={dosenFilter}
                    onChange={(e) => setDosenFilter(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface font-semibold focus:outline-none focus:border-primary dark:bg-surface-container-high"
                  >
                    {lecturerOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kop Surat & Institusi */}
              <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/50 dark:bg-surface-container/30 p-3.5 space-y-2.5">
                <p className="text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                  Kop Surat Institusi
                </p>

                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                    Nama Universitas
                  </label>
                  <input
                    type="text"
                    value={univName}
                    onChange={(e) => setUnivName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                    Fakultas / Jurusan
                  </label>
                  <input
                    type="text"
                    value={facultyName}
                    onChange={(e) => setFacultyName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                    Judul Dokumen
                  </label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                  />
                </div>
              </div>

              {/* Pengesahan Tanda Tangan */}
              <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/50 dark:bg-surface-container/30 p-3.5 space-y-2.5">
                <p className="text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                  Pengesahan Dokumen
                </p>

                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                    Kota & Tanggal
                  </label>
                  <input
                    type="text"
                    value={cityDate}
                    onChange={(e) => setCityDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={officialRole}
                      onChange={(e) => setOfficialRole(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                      Nama Pejabat
                    </label>
                    <input
                      type="text"
                      value={officialName}
                      onChange={(e) => setOfficialName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                    NIP / NIDN
                  </label>
                  <input
                    type="text"
                    value={officialNip}
                    onChange={(e) => setOfficialNip(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                  />
                </div>
              </div>
            </div>

            {/* Preview Dokumen Landscape (Kanan: 8 Kolom) */}
            <div className="lg:col-span-8 flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-2">
                <p className="text-label-caps uppercase tracking-wider text-on-surface-variant">
                  Pratinjau Lembar Mading (A4 Landscape)
                </p>
                <span className="text-[11px] font-bold text-on-surface-variant">
                  {sortedSchedules.length} Sesi Terjadwal
                </span>
              </div>

              {/* Landscape Paper Simulation Wrapper */}
              <div className="w-full max-h-[580px] overflow-y-auto rounded-2xl border border-outline-variant/35 bg-neutral-300/80 dark:bg-neutral-900/90 p-3 sm:p-5 shadow-inner">
                <div
                  className="w-full max-w-[800px] mx-auto bg-white text-neutral-900 p-6 rounded-lg shadow-md font-serif text-[10px] leading-normal border border-neutral-300 isolate"
                  style={{ backgroundColor: '#ffffff', color: '#171717' }}
                >
                  {/* Kop Surat Formal */}
                  <div className="border-b-[3px] border-double border-neutral-900 pb-3 mb-3 text-center">
                    <h2 className="text-xs font-bold tracking-wider uppercase text-neutral-800">
                      {univName}
                    </h2>
                    <h1 className="text-sm font-extrabold tracking-wide uppercase text-neutral-900 mt-0.5">
                      {facultyName}
                    </h1>
                    <div className="text-[10px] font-bold text-neutral-800 mt-1 uppercase tracking-tight">
                      {docTitle} {currentTA ? `· TAHUN AKADEMIK ${currentTA}` : ''}
                    </div>
                    {prodiFilter && (
                      <p className="text-[10px] font-semibold text-neutral-700 mt-0.5">
                        PROGRAM STUDI: {prodiFilter.toUpperCase()} {semesterFilter ? `(SEMESTER ${semesterFilter})` : ''}
                      </p>
                    )}
                    {dosenFilter && (
                      <p className="text-[10px] font-semibold text-neutral-700 mt-0.5">
                        DOSEN PENGAMPU: {dosenFilter.toUpperCase()}
                      </p>
                    )}
                  </div>

                  {/* Tabel Jadwal Formal */}
                  {sortedSchedules.length === 0 ? (
                    <div className="py-12 text-center text-neutral-500 font-sans">
                      Tidak ada jadwal yang sesuai dengan filter pilihan.
                    </div>
                  ) : (
                    <table className="w-full border-collapse border border-neutral-800 text-left text-[9.5px] font-sans">
                      <thead>
                        <tr className="bg-neutral-100 border-b border-neutral-800 font-bold text-center text-neutral-900">
                          <th className="border-r border-neutral-800 py-1.5 px-1.5 w-[30px]">NO</th>
                          <th className="border-r border-neutral-800 py-1.5 px-2 w-[55px]">HARI</th>
                          <th className="border-r border-neutral-800 py-1.5 px-2 w-[85px]">WAKTU (WIB)</th>
                          <th className="border-r border-neutral-800 py-1.5 px-2 w-[65px]">KODE</th>
                          <th className="border-r border-neutral-800 py-1.5 px-2">MATA KULIAH</th>
                          <th className="border-r border-neutral-800 py-1.5 px-1.5 w-[35px]">SKS</th>
                          <th className="border-r border-neutral-800 py-1.5 px-2 w-[50px]">KELAS</th>
                          <th className="border-r border-neutral-800 py-1.5 px-2 w-[90px]">RUANGAN</th>
                          <th className="py-1.5 px-2">DOSEN PENGAMPU</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSchedules.map((item, idx) => {
                          const course = courseMap.get(item.kodeMK)
                          return (
                            <tr key={item.id || idx} className="border-b border-neutral-300 last:border-0 hover:bg-neutral-50">
                              <td className="border-r border-neutral-800 py-1 px-1.5 text-center font-medium">
                                {idx + 1}
                              </td>
                              <td className="border-r border-neutral-800 py-1 px-2 font-bold text-neutral-900">
                                {item.hari}
                              </td>
                              <td className="border-r border-neutral-800 py-1 px-2 whitespace-nowrap font-mono">
                                {item.jamMulai} - {item.jamSelesai}
                              </td>
                              <td className="border-r border-neutral-800 py-1 px-2 font-bold text-neutral-900">
                                {item.kodeMK}
                              </td>
                              <td className="border-r border-neutral-800 py-1 px-2 font-semibold text-neutral-900">
                                {course?.namaMK || item.kodeMK}
                              </td>
                              <td className="border-r border-neutral-800 py-1 px-1.5 text-center font-bold">
                                {course?.sks || 2}
                              </td>
                              <td className="border-r border-neutral-800 py-1 px-2 text-center font-semibold">
                                {item.tipeKelas || 'K1'}
                              </td>
                              <td className="border-r border-neutral-800 py-1 px-2 text-neutral-800 whitespace-nowrap">
                                {formatRuang(item.ruang, item.tipeKelas)}
                              </td>
                              <td className="py-1 px-2 text-neutral-800 truncate max-w-[140px]">
                                {course?.dosen || '-'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* Sign-off Section */}
                  <div className="mt-6 flex justify-end font-sans">
                    <div className="text-center w-[220px]">
                      <p className="text-[9.5px] text-neutral-800">{cityDate}</p>
                      <p className="text-[9.5px] font-bold text-neutral-900 mt-0.5">{officialRole},</p>
                      <div className="h-14 flex items-center justify-center">
                        <span className="text-[9px] text-neutral-300 italic">(Tanda Tangan & Cap)</span>
                      </div>
                      <p className="text-[10px] font-bold text-neutral-900 underline underline-offset-2">
                        {officialName}
                      </p>
                      <p className="text-[9px] text-neutral-700 mt-0.5">{officialNip}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-outline-variant/20 px-5 py-3.5 bg-surface-container-low/40 shrink-0">
            <span className="text-[11px] text-on-surface-variant font-medium">
              Format cetak otomatis berorientasi A4 Landscape
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-body-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleTriggerPrint}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-white text-body-xs font-bold shadow-sm hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
              >
                <Icon name="print" size={16} />
                <span>Cetak Dokumen Mading / Simpan PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Dedicated Official Print Container (Visible ONLY on print) */}
      <div id="official-noticeboard-print-area" className="hidden print:block text-neutral-900 bg-white p-3">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 landscape;
                margin: 6mm 8mm;
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
                color: #111 !important;
                display: block !important;
              }
            }
          `
        }} />

        {/* Formal Kop */}
        <div className="border-b-[3px] border-double border-neutral-900 pb-2 mb-3 text-center">
          <h2 className="text-xs font-bold tracking-wider uppercase text-neutral-800">
            {univName}
          </h2>
          <h1 className="text-base font-extrabold tracking-wide uppercase text-neutral-900 mt-0.5">
            {facultyName}
          </h1>
          <div className="text-xs font-bold text-neutral-900 mt-1 uppercase">
            {docTitle} {currentTA ? `· TAHUN AKADEMIK ${currentTA}` : ''}
          </div>
          {prodiFilter && (
            <p className="text-xs font-semibold text-neutral-800 mt-0.5">
              PROGRAM STUDI: {prodiFilter.toUpperCase()} {semesterFilter ? `(SEMESTER ${semesterFilter})` : ''}
            </p>
          )}
          {dosenFilter && (
            <p className="text-xs font-semibold text-neutral-800 mt-0.5">
              DOSEN PENGAMPU: {dosenFilter.toUpperCase()}
            </p>
          )}
        </div>

        {/* Table */}
        <table className="w-full border-collapse border border-neutral-900 text-left text-xs font-sans">
          <thead>
            <tr className="bg-neutral-100 border-b border-neutral-900 font-bold text-center text-neutral-900">
              <th className="border-r border-neutral-900 py-1.5 px-1 w-[35px]">NO</th>
              <th className="border-r border-neutral-900 py-1.5 px-2 w-[65px]">HARI</th>
              <th className="border-r border-neutral-900 py-1.5 px-2 w-[100px]">WAKTU (WIB)</th>
              <th className="border-r border-neutral-900 py-1.5 px-2 w-[80px]">KODE</th>
              <th className="border-r border-neutral-900 py-1.5 px-2">MATA KULIAH</th>
              <th className="border-r border-neutral-900 py-1.5 px-1.5 w-[40px]">SKS</th>
              <th className="border-r border-neutral-900 py-1.5 px-2 w-[60px]">KELAS</th>
              <th className="border-r border-neutral-900 py-1.5 px-2 w-[110px]">RUANGAN</th>
              <th className="py-1.5 px-2">DOSEN PENGAMPU</th>
            </tr>
          </thead>
          <tbody>
            {sortedSchedules.map((item, idx) => {
              const course = courseMap.get(item.kodeMK)
              return (
                <tr key={item.id || idx} className="border-b border-neutral-300 last:border-0">
                  <td className="border-r border-neutral-900 py-1.5 px-1 text-center font-medium">
                    {idx + 1}
                  </td>
                  <td className="border-r border-neutral-900 py-1.5 px-2 font-bold text-neutral-900">
                    {item.hari}
                  </td>
                  <td className="border-r border-neutral-900 py-1.5 px-2 whitespace-nowrap font-mono font-medium">
                    {item.jamMulai} - {item.jamSelesai}
                  </td>
                  <td className="border-r border-neutral-900 py-1.5 px-2 font-bold text-neutral-900">
                    {item.kodeMK}
                  </td>
                  <td className="border-r border-neutral-900 py-1.5 px-2 font-semibold text-neutral-900">
                    {course?.namaMK || item.kodeMK}
                  </td>
                  <td className="border-r border-neutral-900 py-1.5 px-1.5 text-center font-bold">
                    {course?.sks || 2}
                  </td>
                  <td className="border-r border-neutral-900 py-1.5 px-2 text-center font-semibold">
                    {item.tipeKelas || 'K1'}
                  </td>
                  <td className="border-r border-neutral-900 py-1.5 px-2 text-neutral-800 whitespace-nowrap">
                    {formatRuang(item.ruang, item.tipeKelas)}
                  </td>
                  <td className="py-1.5 px-2 text-neutral-800">
                    {course?.dosen || '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Sign-off */}
        <div className="mt-6 flex justify-end font-sans">
          <div className="text-center w-[240px]">
            <p className="text-xs text-neutral-800">{cityDate}</p>
            <p className="text-xs font-bold text-neutral-900 mt-0.5">{officialRole},</p>
            <div className="h-16 flex items-center justify-center">
              <span className="text-[10px] text-neutral-300 italic">(Tanda Tangan & Cap)</span>
            </div>
            <p className="text-xs font-bold text-neutral-900 underline underline-offset-4">
              {officialName}
            </p>
            <p className="text-[10px] text-neutral-700 mt-0.5">{officialNip}</p>
          </div>
        </div>
      </div>
    </>
  )
}
