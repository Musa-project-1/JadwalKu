import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../Icon'
import { DAYS } from '../../lib/uploadValidator'
import { formatRuang, sortByTime } from '../../lib/scheduleUtils'
import { getItem, STORAGE_KEYS } from '../../lib/storage'

export function PrintScheduleModal({
  isOpen,
  onClose,
  scheduleEntries = [],
  courses = [],
  program = '',
  semester = 1,
  tahunAjaran = '',
}) {
  const modalRef = useRef(null)
  const [layoutFormat, setLayoutFormat] = useState('wall') // 'wall' | 'pocket'
  const [showLecturer, setShowLecturer] = useState(true)
  const [showRoom, setShowRoom] = useState(true)
  const [showNotes, setShowNotes] = useState(true)
  const [showSks, setShowSks] = useState(true)
  const [showMemoSpace, setShowMemoSpace] = useState(true)
  const [customTitle, setCustomTitle] = useState('')

  const courseMap = useMemo(() => {
    const map = new Map()
    courses.forEach((c) => {
      if (c?.kodeMK) map.set(c.kodeMK, c)
    })
    return map
  }, [courses])

  // Hitung total SKS
  const totalSks = useMemo(() => {
    const sksSet = new Set(scheduleEntries.map((e) => e.kodeMK))
    let count = 0
    sksSet.forEach((kode) => {
      const c = courseMap.get(kode)
      count += c?.sks || 2
    })
    return count
  }, [scheduleEntries, courseMap])

  // Kelompokkan jadwal per hari
  const groupedByDay = useMemo(() => {
    const map = new Map()
    DAYS.forEach((day) => map.set(day, []))
    scheduleEntries.forEach((entry) => {
      const list = map.get(entry.hari) || []
      list.push(entry)
      map.set(entry.hari, list)
    })
    // Urutkan per hari
    DAYS.forEach((day) => {
      map.set(day, sortByTime(map.get(day) || []))
    })
    return map
  }, [scheduleEntries])

  // Active days with at least 1 class
  const activeDays = useMemo(() => {
    return DAYS.filter((day) => (groupedByDay.get(day) || []).length > 0)
  }, [groupedByDay])

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

  const currentDateFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <>
      {/* 1. Modal Interaktif di Layar */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-5 animate-fade-in print:hidden">
        <div
          ref={modalRef}
          className="flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl animate-fade-up"
        >
          {/* Header Modal */}
          <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4 shrink-0 bg-surface-container-low/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20">
                <Icon name="print" size={22} />
              </div>
              <div>
                <h2 className="text-title-md font-bold text-on-surface">Cetak Jadwal Kuliah</h2>
                <p className="text-body-xs text-on-surface-variant font-medium">
                  Format hemat tinta untuk dinding kamar kos / meja belajar / saku dompet
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

          {/* Body: Side-by-Side Flex Layout (Left: Slim Controls, Right: Live Sheet Preview) */}
          <div className="flex-1 overflow-y-auto flex flex-col desktop:flex-row items-stretch gap-5 p-5">
            {/* Kolom Pengaturan Kiri (Slim Sidebar Controls) */}
            <div className="w-full desktop:w-[340px] shrink-0 space-y-3.5">
              {/* Pilihan Format */}
              <div>
                <label className="block text-label-caps uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">
                  Format Desain
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLayoutFormat('wall')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      layoutFormat === 'wall'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-outline-variant/25 bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <Icon name="table_chart" size={22} className="mb-1" />
                    <span className="text-[11.5px] leading-tight font-semibold">Meja / Dinding (A4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutFormat('pocket')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      layoutFormat === 'pocket'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-outline-variant/25 bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <Icon name="badge" size={22} className="mb-1" />
                    <span className="text-[11.5px] leading-tight font-semibold">Kartu Saku Lipat</span>
                  </button>
                </div>
              </div>

              {/* Judul Kustom */}
              <div>
                <label className="block text-label-caps uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">
                  Nama / Catatan Header (Opsional)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Misal: Musa (NIM. 220101001)"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                />
              </div>

              {/* Elemen yang Disertakan — Compact 2-Column Tile Grid */}
              <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/50 dark:bg-surface-container-high/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                    Informasi Disertakan
                  </label>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {[showLecturer, showRoom, showSks, showNotes, showMemoSpace].filter(Boolean).length}/5 Aktif
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <label className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none group ${
                    showLecturer
                      ? 'border-primary/40 bg-primary/10 text-primary font-bold shadow-2xs dark:bg-primary/15'
                      : 'border-outline-variant/20 bg-surface-container-lowest/80 text-on-surface-variant hover:border-outline-variant/40 dark:bg-surface-container-low'
                  }`}>
                    <input
                      type="checkbox"
                      checked={showLecturer}
                      onChange={(e) => setShowLecturer(e.target.checked)}
                      className="h-3.5 w-3.5 rounded text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon name="person" size={15} className={showLecturer ? 'text-primary' : 'text-on-surface-variant'} />
                      <span className="text-[11.5px] truncate">Dosen</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none group ${
                    showRoom
                      ? 'border-primary/40 bg-primary/10 text-primary font-bold shadow-2xs dark:bg-primary/15'
                      : 'border-outline-variant/20 bg-surface-container-lowest/80 text-on-surface-variant hover:border-outline-variant/40 dark:bg-surface-container-low'
                  }`}>
                    <input
                      type="checkbox"
                      checked={showRoom}
                      onChange={(e) => setShowRoom(e.target.checked)}
                      className="h-3.5 w-3.5 rounded text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon name="meeting_room" size={15} className={showRoom ? 'text-primary' : 'text-on-surface-variant'} />
                      <span className="text-[11.5px] truncate">Ruangan</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none group ${
                    showSks
                      ? 'border-primary/40 bg-primary/10 text-primary font-bold shadow-2xs dark:bg-primary/15'
                      : 'border-outline-variant/20 bg-surface-container-lowest/80 text-on-surface-variant hover:border-outline-variant/40 dark:bg-surface-container-low'
                  }`}>
                    <input
                      type="checkbox"
                      checked={showSks}
                      onChange={(e) => setShowSks(e.target.checked)}
                      className="h-3.5 w-3.5 rounded text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon name="menu_book" size={15} className={showSks ? 'text-primary' : 'text-on-surface-variant'} />
                      <span className="text-[11.5px] truncate">Beban SKS</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none group ${
                    showNotes
                      ? 'border-primary/40 bg-primary/10 text-primary font-bold shadow-2xs dark:bg-primary/15'
                      : 'border-outline-variant/20 bg-surface-container-lowest/80 text-on-surface-variant hover:border-outline-variant/40 dark:bg-surface-container-low'
                  }`}>
                    <input
                      type="checkbox"
                      checked={showNotes}
                      onChange={(e) => setShowNotes(e.target.checked)}
                      className="h-3.5 w-3.5 rounded text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon name="sticky_note_2" size={15} className={showNotes ? 'text-primary' : 'text-on-surface-variant'} />
                      <span className="text-[11.5px] truncate">Catatan Sesi</span>
                    </div>
                  </label>

                  <label className={`col-span-2 flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none group ${
                    showMemoSpace
                      ? 'border-primary/40 bg-primary/10 text-primary font-bold shadow-2xs dark:bg-primary/15'
                      : 'border-outline-variant/20 bg-surface-container-lowest/80 text-on-surface-variant hover:border-outline-variant/40 dark:bg-surface-container-low'
                  }`}>
                    <input
                      type="checkbox"
                      checked={showMemoSpace}
                      onChange={(e) => setShowMemoSpace(e.target.checked)}
                      className="h-3.5 w-3.5 rounded text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon name="draw" size={15} className={showMemoSpace ? 'text-primary' : 'text-on-surface-variant'} />
                      <span className="text-[11.5px] truncate">Kolom Memo & Target Belajar</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Tips Cetak */}
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3 text-[11px] text-amber-950 dark:text-amber-200 leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Icon name="lightbulb" size={14} className="text-amber-600" />
                  Tips Hemat Tinta:
                </p>
                <p>
                  Pilih opsi cetak <strong>"Save as PDF"</strong> atau atur warna printer ke <strong>"Monochrome / Grayscale"</strong> untuk hasil paling hemat tinta.
                </p>
              </div>
            </div>

            {/* Kolom Kanan: Pratinjau Lembar Cetak (Live Paper Preview) */}
            <div className="flex-1 min-w-0 flex flex-col items-center">
              <p className="text-label-caps uppercase tracking-wider text-on-surface-variant self-start mb-2 font-bold">
                Pratinjau Lembar Cetak
              </p>
              <div className="w-full max-h-[540px] overflow-y-auto rounded-2xl border border-outline-variant/35 bg-neutral-300/80 dark:bg-neutral-900/90 p-3 sm:p-5 shadow-inner">
                {/* Simulated Sheet — 100% Solid White Paper Container */}
                <div
                  className="w-full max-w-[595px] mx-auto bg-white text-neutral-900 p-5 rounded-lg shadow-md font-sans text-[11px] leading-normal border border-neutral-300 isolate"
                  style={{ backgroundColor: '#ffffff', color: '#171717' }}
                >
                  {/* Paper Header */}
                  <div className="border-b-2 border-neutral-900 pb-2.5 mb-3 flex items-start justify-between">
                    <div>
                      <h1 className="text-base font-extrabold tracking-tight uppercase text-neutral-900">
                        JADWAL KULIAH MAHASISWA
                      </h1>
                      <p className="text-[10px] font-bold text-neutral-700">
                        {program} · Semester {semester} {tahunAjaran ? `· TA ${tahunAjaran}` : ''}
                      </p>
                      {customTitle && (
                        <p className="text-[10.5px] font-semibold text-neutral-800 mt-0.5">
                          {customTitle}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-[9.5px] text-neutral-600 font-medium">
                      <p>Total: <strong>{totalSks} SKS</strong> · {scheduleEntries.length} Kelas</p>
                      <p className="mt-0.5">Dicetak: {currentDateFormatted}</p>
                    </div>
                  </div>

                  {/* Layout Wall: List Grouped by Day */}
                  {layoutFormat === 'wall' ? (
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
                                  const note = getItem(`${STORAGE_KEYS.courseNotes}:${e.kodeMK}`, '')
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
                                        <td className="py-1.5 px-2 text-neutral-800 whitespace-nowrap font-medium">
                                          {formatRuang(e.ruang, e.tipeKelas)}
                                        </td>
                                      )}
                                      {showLecturer && (
                                        <td className="py-1.5 px-2 text-neutral-800 truncate max-w-[130px]">
                                          {c?.dosen || '-'}
                                        </td>
                                      )}
                                      {showSks && (
                                        <td className="py-1.5 px-2 text-center text-neutral-900 font-bold">
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
                  ) : (
                    /* Layout Pocket: 2-Column Grid Card */
                    <div className="grid grid-cols-2 gap-2">
                      {activeDays.map((day) => {
                        const entries = groupedByDay.get(day) || []
                        return (
                          <div key={day} className="border border-neutral-400 rounded-md p-1.5 bg-neutral-50 text-neutral-900">
                            <div className="font-extrabold text-[10px] uppercase border-b border-neutral-300 pb-0.5 mb-1 text-neutral-900">
                              {day}
                            </div>
                            <div className="space-y-1.5">
                              {entries.map((e, idx) => {
                                const c = courseMap.get(e.kodeMK)
                                return (
                                  <div key={e.id || idx} className="text-[9px] leading-tight">
                                    <div className="font-bold text-neutral-900 truncate">
                                      {c?.namaMK || e.kodeMK}
                                    </div>
                                    <div className="text-neutral-700 flex items-center justify-between text-[8px] mt-0.5 font-medium">
                                      <span>{e.jamMulai}-{e.jamSelesai}</span>
                                      {showRoom && <span>{formatRuang(e.ruang, e.tipeKelas)}</span>}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Memo Space Box */}
                  {showMemoSpace && (
                    <div className="mt-3 pt-2.5 border-t border-neutral-300">
                      <div className="flex items-center justify-between text-[9px] text-neutral-700 font-bold mb-1">
                        <span>MEMO / CATATAN TARGET KULIAH:</span>
                        <span>TARGET IPK: [____]</span>
                      </div>
                      <div className="border border-dashed border-neutral-400 rounded-md h-12 bg-neutral-50 p-1.5 text-[8.5px] text-neutral-500 font-medium">
                        (Ruang catatan tangan / tugas penting semester ini)
                      </div>
                    </div>
                  )}

                  {/* Footer App */}
                  <div className="mt-3 text-center text-[8.5px] text-neutral-500 font-medium">
                    JadwalKu · Solusi Manajemen Jadwal Perkuliahan Mahasiswa
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-outline-variant/20 px-5 py-3.5 bg-surface-container-low/40 shrink-0">
            <span className="text-[11px] text-on-surface-variant font-medium">
              Siap dicetak pada ukuran kertas A4
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
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-on-primary text-body-xs font-bold shadow-sm hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
              >
                <Icon name="print" size={16} />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED PRINT DOM CONTAINER (Visible ONLY when printing) */}
      <div id="printable-schedule-area" className="hidden print:block text-neutral-900 bg-white p-2">
        <style dangerouslySetInnerHTML={{
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
          `
        }} />

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
                            <td className="py-1.5 px-2.5 font-bold whitespace-nowrap text-neutral-900">
                              {e.jamMulai} - {e.jamSelesai}
                            </td>
                            <td className="py-1.5 px-2.5">
                              <div className="font-bold text-neutral-900">{c?.namaMK || e.kodeMK}</div>
                              {showNotes && note && (
                                <div className="text-[9.5px] text-neutral-600 italic mt-0.5">
                                  Catatan: {note}
                                </div>
                              )}
                            </td>
                            {showRoom && (
                              <td className="py-1.5 px-2.5 text-neutral-800 whitespace-nowrap">
                                {formatRuang(e.ruang, e.tipeKelas)}
                              </td>
                            )}
                            {showLecturer && (
                              <td className="py-1.5 px-2.5 text-neutral-800">
                                {c?.dosen || '-'}
                              </td>
                            )}
                            {showSks && (
                              <td className="py-1.5 px-2.5 text-center text-neutral-800 font-semibold">
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
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {activeDays.map((day) => {
              const entries = groupedByDay.get(day) || []
              return (
                <div key={day} className="border border-neutral-500 rounded p-2 bg-white">
                  <div className="font-extrabold text-xs uppercase border-b-2 border-neutral-400 pb-0.5 mb-1.5 text-neutral-900">
                    {day}
                  </div>
                  <div className="space-y-2">
                    {entries.map((e, idx) => {
                      const c = courseMap.get(e.kodeMK)
                      return (
                        <div key={e.id || idx} className="text-[10.5px] leading-tight border-b border-neutral-200 pb-1 last:border-0">
                          <div className="font-bold text-neutral-900">
                            {c?.namaMK || e.kodeMK}
                          </div>
                          <div className="text-neutral-700 flex items-center justify-between text-[9.5px] mt-0.5">
                            <span className="font-semibold">{e.jamMulai} - {e.jamSelesai}</span>
                            {showRoom && <span>{formatRuang(e.ruang, e.tipeKelas)}</span>}
                          </div>
                          {showLecturer && c?.dosen && (
                            <div className="text-[9px] text-neutral-600 truncate mt-0.5">
                              {c.dosen}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Memo Space */}
        {showMemoSpace && (
          <div className="mt-4 pt-2 border-t-2 border-neutral-300">
            <div className="flex items-center justify-between text-[10px] text-neutral-800 font-bold mb-1">
              <span>MEMO / TARGET PERKULIAHAN:</span>
              <span>TARGET IPK: [______]</span>
            </div>
            <div className="border border-dashed border-neutral-400 rounded h-14 bg-neutral-50/50 p-2 text-[9px] text-neutral-400">
              (Gunakan ruang ini untuk mencatat tugas penting, jadwal UTS/UAS, atau target semester ini)
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 text-center text-[9px] text-neutral-500">
          JadwalKu · Solusi Cerdas Manajemen Jadwal Kuliah Mahasiswa
        </div>
      </div>
    </>
  )
}

