import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../Icon'
import { useApp } from '../../hooks/useApp'
import { DAYS } from '../../lib/uploadValidator'
import { formatRuang, sortByTime } from '../../lib/scheduleUtils'
import { parseTimeToMinutes } from '../../lib/scheduleGridUtils'
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
  const { language, t } = useApp()
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

  const activeOptionsCount = [showLecturer, showRoom, showSks, showNotes, showMemoSpace].filter(Boolean).length

  return (
    <>
      {/* 1. Interactive Centered Modal on Screen */}
      <div
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-schedule-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-6 bg-black/65 backdrop-blur-xs animate-fade-in print:hidden"
      >
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col w-full max-w-5xl max-h-[92vh] tablet:max-h-[88vh] overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl animate-fade-up"
        >
          {/* Header Banner - Rich Full-Width Teal/Emerald Gradient matching the design system */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-950 via-teal-800 to-emerald-900 p-4 tablet:p-5 text-white shadow-level-1 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-xs">
                  <Icon name="print" size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h2 id="print-schedule-title" className="text-xl tablet:text-2xl font-bold tracking-tight text-white truncate">
                      {t ? t('print.modal_title') : 'Cetak Jadwal Kuliah'}
                    </h2>
                    <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border border-white/25 shadow-2xs">
                      A4 Ready
                    </span>
                  </div>
                  <p className="text-body-xs text-white/80 font-medium truncate">
                    Format hemat tinta untuk dinding kamar kos / meja belajar / saku dompet
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label={t ? t('action.close') : 'Tutup modal'}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
          </div>

          {/* 2-Column Split Body (Left: Slim Controls, Right: Live Sheet Preview) */}
          <div className="grid grid-cols-1 tablet:grid-cols-12 flex-1 min-h-0 overflow-y-auto tablet:overflow-hidden">
            {/* LEFT COLUMN: Configuration Controls */}
            <div className="tablet:col-span-5 tablet:overflow-y-auto p-4 tablet:p-5 space-y-3.5 border-b tablet:border-b-0 tablet:border-r border-outline-variant/20 bg-surface-container-low/40 dark:bg-surface-container-high/20 custom-scrollbar">
              {/* Pilihan Format Desain */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-on-surface-variant mb-1.5 font-extrabold">
                  Format Desain
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLayoutFormat('wall')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      layoutFormat === 'wall'
                        ? 'border-teal-600 bg-teal-500/15 text-teal-900 dark:text-teal-200 font-bold shadow-xs ring-1 ring-teal-500/30'
                        : 'border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <Icon name="table_chart" size={20} className="mb-1 text-teal-700 dark:text-teal-400" />
                    <span className="text-[11px] leading-tight font-extrabold">Meja (Tabel A4)</span>
                    <span className="text-[9px] opacity-75 font-medium mt-0.5">Tabel Lengkap</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutFormat('matrix')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      layoutFormat === 'matrix'
                        ? 'border-teal-600 bg-teal-500/15 text-teal-900 dark:text-teal-200 font-bold shadow-xs ring-1 ring-teal-500/30'
                        : 'border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <Icon name="calendar_view_week" size={20} className="mb-1 text-teal-700 dark:text-teal-400" />
                    <span className="text-[11px] leading-tight font-extrabold">Matriks Sesi</span>
                    <span className="text-[9px] opacity-75 font-medium mt-0.5">Pagi – Malam</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutFormat('pocket')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer col-span-2 ${
                      layoutFormat === 'pocket'
                        ? 'border-teal-600 bg-teal-500/15 text-teal-900 dark:text-teal-200 font-bold shadow-xs ring-1 ring-teal-500/30'
                        : 'border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <Icon name="badge" size={20} className="mb-1 text-teal-700 dark:text-teal-400" />
                    <span className="text-[11px] leading-tight font-extrabold">Kartu Saku Lipat</span>
                    <span className="text-[9px] opacity-75 font-medium mt-0.5">Ukuran Saku Praktis</span>
                  </button>
                </div>
              </div>

              {/* Judul Kustom Card */}
              <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 space-y-1.5 shadow-2xs">
                <label className="block text-[11px] uppercase tracking-wider text-on-surface-variant font-extrabold">
                  Nama / Catatan Header (Opsional)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Misal: Musa (NIM. 220101001)"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low/60 text-body-xs text-on-surface focus:outline-none focus:border-teal-600 dark:bg-surface-container-high/60 shadow-2xs"
                />
              </div>

              {/* Elemen yang Disertakan Card */}
              <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] uppercase tracking-wider text-on-surface-variant font-extrabold">
                    Informasi Disertakan
                  </label>
                  <span className="text-[10px] font-extrabold text-teal-800 dark:text-teal-300 bg-teal-500/15 border border-teal-500/25 px-2 py-0.5 rounded-full">
                    {activeOptionsCount}/5 Aktif
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <label className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none group ${
                    showLecturer
                      ? 'border-teal-600/40 bg-teal-500/15 text-teal-900 dark:text-teal-200 font-bold shadow-2xs'
                      : 'border-outline-variant/20 bg-surface-container-low/50 text-on-surface-variant hover:border-outline-variant/40 dark:bg-surface-container-high/30'
                  }`}>
                    <input
                      type="checkbox"
                      checked={showLecturer}
                      onChange={(e) => setShowLecturer(e.target.checked)}
                      className="h-3.5 w-3.5 rounded text-teal-600 focus:ring-teal-600 cursor-pointer accent-teal-600 shrink-0"
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon name="person" size={15} className={showLecturer ? 'text-teal-700 dark:text-teal-400' : 'text-on-surface-variant'} />
                      <span className="text-[11.5px] truncate">Dosen</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none group ${
                    showRoom
                      ? 'border-teal-600/40 bg-teal-500/15 text-teal-900 dark:text-teal-200 font-bold shadow-2xs'
                      : 'border-outline-variant/20 bg-surface-container-low/50 text-on-surface-variant hover:border-outline-variant/40 dark:bg-surface-container-high/30'
                  }`}>
                    <input
                      type="checkbox"
                      checked={showRoom}
                      onChange={(e) => setShowRoom(e.target.checked)}
                      className="h-3.5 w-3.5 rounded text-teal-600 focus:ring-teal-600 cursor-pointer accent-teal-600 shrink-0"
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon name="meeting_room" size={15} className={showRoom ? 'text-teal-700 dark:text-teal-400' : 'text-on-surface-variant'} />
                      <span className="text-[11.5px] truncate">Ruangan</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none group ${
                    showSks
                      ? 'border-teal-600/40 bg-teal-500/15 text-teal-900 dark:text-teal-200 font-bold shadow-2xs'
                      : 'border-outline-variant/20 bg-surface-container-low/50 text-on-surface-variant hover:border-outline-variant/40 dark:bg-surface-container-high/30'
                  }`}>
                    <input
                      type="checkbox"
                      checked={showSks}
                      onChange={(e) => setShowSks(e.target.checked)}
                      className="h-3.5 w-3.5 rounded text-teal-600 focus:ring-teal-600 cursor-pointer accent-teal-600 shrink-0"
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon name="menu_book" size={15} className={showSks ? 'text-teal-700 dark:text-teal-400' : 'text-on-surface-variant'} />
                      <span className="text-[11.5px] truncate">Beban SKS</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none group ${
                    showNotes
                      ? 'border-teal-600/40 bg-teal-500/15 text-teal-900 dark:text-teal-200 font-bold shadow-2xs'
                      : 'border-outline-variant/20 bg-surface-container-low/50 text-on-surface-variant hover:border-outline-variant/40 dark:bg-surface-container-high/30'
                  }`}>
                    <input
                      type="checkbox"
                      checked={showNotes}
                      onChange={(e) => setShowNotes(e.target.checked)}
                      className="h-3.5 w-3.5 rounded text-teal-600 focus:ring-teal-600 cursor-pointer accent-teal-600 shrink-0"
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon name="sticky_note_2" size={15} className={showNotes ? 'text-teal-700 dark:text-teal-400' : 'text-on-surface-variant'} />
                      <span className="text-[11.5px] truncate">Catatan Sesi</span>
                    </div>
                  </label>

                  <label className={`col-span-2 flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none group ${
                    showMemoSpace
                      ? 'border-teal-600/40 bg-teal-500/15 text-teal-900 dark:text-teal-200 font-bold shadow-2xs'
                      : 'border-outline-variant/20 bg-surface-container-low/50 text-on-surface-variant hover:border-outline-variant/40 dark:bg-surface-container-high/30'
                  }`}>
                    <input
                      type="checkbox"
                      checked={showMemoSpace}
                      onChange={(e) => setShowMemoSpace(e.target.checked)}
                      className="h-3.5 w-3.5 rounded text-teal-600 focus:ring-teal-600 cursor-pointer accent-teal-600 shrink-0"
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon name="draw" size={15} className={showMemoSpace ? 'text-teal-700 dark:text-teal-400' : 'text-on-surface-variant'} />
                      <span className="text-[11.5px] truncate font-semibold">Kolom Memo & Target Belajar</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Tips Cetak Card */}
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-[11px] text-amber-950 dark:text-amber-200 leading-relaxed space-y-1 shadow-2xs">
                <p className="font-bold flex items-center gap-1 text-amber-900 dark:text-amber-300">
                  <Icon name="lightbulb" size={15} className="text-amber-600 dark:text-amber-400" />
                  Tips Hemat Tinta:
                </p>
                <p className="font-medium">
                  Pilih opsi cetak <strong>&quot;Save as PDF&quot;</strong> atau atur printer ke <strong>&quot;Monochrome / Grayscale&quot;</strong> untuk hasil paling bersih dan hemat tinta.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Live Sheet Preview */}
            <div className="tablet:col-span-7 tablet:overflow-y-auto p-4 tablet:p-5 flex flex-col items-center bg-surface-container-lowest dark:bg-surface-container-low custom-scrollbar">
              <div className="flex items-center justify-between w-full mb-2.5">
                <p className="text-[11px] uppercase tracking-wider text-on-surface-variant font-extrabold">
                  Pratinjau Lembar Cetak ({layoutFormat === 'wall' ? 'Tabel A4' : 'Kartu Saku'})
                </p>
                <span className="text-[10.5px] font-extrabold text-teal-800 dark:text-teal-300 bg-teal-500/15 border border-teal-500/25 px-2.5 py-0.5 rounded-full shadow-2xs">
                  {scheduleEntries.length} Kelas Terjadwal
                </span>
              </div>

              <div className="w-full flex-1 max-h-[560px] overflow-y-auto rounded-2xl border border-outline-variant/35 bg-neutral-200/80 dark:bg-neutral-900/90 p-3 tablet:p-5 shadow-inner custom-scrollbar">
                {/* Simulated Sheet — 100% Solid White Paper Container with Real Shadow */}
                <div
                  className="w-full max-w-[595px] mx-auto bg-white text-neutral-900 p-5 rounded-lg shadow-xl font-sans text-[11px] leading-normal border border-neutral-300 isolate"
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
                                        <td className="py-1.5 px-2 text-neutral-800">
                                          {formatRuang(e.ruang, e.tipeKelas)}
                                        </td>
                                      )}
                                      {showLecturer && (
                                        <td className="py-1.5 px-2 text-neutral-700 text-[9.5px]">
                                          {c?.dosen || '-'}
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
                  ) : layoutFormat === 'matrix' ? (
                    /* Layout Matrix: Visual Session Grid */
                    <div className="border border-neutral-300 rounded-md overflow-hidden bg-white">
                      <table className="w-full text-left border-collapse text-[9.5px] table-fixed">
                        <thead>
                          <tr className="border-b border-neutral-300 bg-neutral-100 text-neutral-800 font-bold uppercase text-[9px]">
                            <th className="w-[68px] p-1.5 border-r border-neutral-300 text-center">Sesi / Waktu</th>
                            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((d) => (
                              <th key={d} className="p-1.5 border-r last:border-r-0 border-neutral-300 text-center">
                                {d}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {[
                            { id: 'pagi', label: 'Pagi', time: '07.00 - 11.30' },
                            { id: 'siang', label: 'Siang', time: '13.00 - 15.00' },
                            { id: 'sore', label: 'Sore', time: '15.30 - 17.45' },
                            { id: 'malam', label: 'Malam', time: '18.30 - 21.00' },
                          ].map((sess) => (
                            <tr key={sess.id} className="align-top">
                              <td className="p-1.5 border-r border-neutral-300 bg-neutral-50 text-center font-bold">
                                <div className="text-[10px] text-neutral-900">{sess.label}</div>
                                <div className="text-[8px] text-neutral-500 font-mono mt-0.5">{sess.time}</div>
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
                                                <span>{e.tipeKelas || 'K1'}</span>
                                                <span className="font-mono">{e.jamMulai}-{e.jamSelesai}</span>
                                              </div>
                                              <div className="font-extrabold text-[9.5px] text-neutral-900 my-0.5 break-words">
                                                {c?.namaMK || e.kodeMK}
                                              </div>
                                              {showRoom && (
                                                <div className="text-[8.5px] text-neutral-600">
                                                  {formatRuang(e.ruang, e.tipeKelas)}
                                                </div>
                                              )}
                                              {showLecturer && c?.dosen && (
                                                <div className="text-[8px] text-neutral-500 truncate">
                                                  {c.dosen}
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
          <div className="flex items-center justify-between border-t border-outline-variant/20 px-4 tablet:px-6 py-3.5 bg-surface-container-low/40 shrink-0">
            <span className="text-[11px] text-on-surface-variant font-medium">
              Siap dicetak pada ukuran kertas A4
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-body-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                {t ? t('action.cancel') : 'Batal'}
              </button>
              <button
                type="button"
                onClick={handleTriggerPrint}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-body-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Icon name="print" size={16} />
                <span>{t ? t('print.action_btn') : 'Cetak / Simpan PDF'}</span>
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
                              <td className="py-1.5 px-2.5 text-neutral-800 whitespace-nowrap font-medium">
                                {formatRuang(e.ruang, e.tipeKelas)}
                              </td>
                            )}
                            {showLecturer && (
                              <td className="py-1.5 px-2.5 text-neutral-800 truncate max-w-[140px]">
                                {c?.dosen || '-'}
                              </td>
                            )}
                            {showSks && (
                              <td className="py-1.5 px-2.5 text-center text-neutral-900 font-bold">
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
          <div className="grid grid-cols-2 gap-2.5">
            {activeDays.map((day) => {
              const entries = groupedByDay.get(day) || []
              return (
                <div key={day} className="border border-neutral-500 rounded p-2 text-xs">
                  <div className="font-extrabold uppercase border-b border-neutral-300 pb-0.5 mb-1.5">
                    {day}
                  </div>
                  <div className="space-y-1.5">
                    {entries.map((e, idx) => {
                      const c = courseMap.get(e.kodeMK)
                      return (
                        <div key={e.id || idx} className="text-[11px] leading-tight">
                          <div className="font-bold text-neutral-900">
                            {c?.namaMK || e.kodeMK}
                          </div>
                          <div className="text-neutral-700 flex items-center justify-between text-[10px] mt-0.5 font-medium">
                            <span>{e.jamMulai} - {e.jamSelesai}</span>
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
          <div className="mt-3 pt-2 border-t border-neutral-400">
            <div className="flex items-center justify-between text-[10px] text-neutral-800 font-bold mb-1">
              <span>MEMO / CATATAN TARGET KULIAH:</span>
              <span>TARGET IPK: [_______]</span>
            </div>
            <div className="border border-dashed border-neutral-400 rounded h-14 p-2 text-[10px] text-neutral-500">
              (Ruang catatan tangan / tugas penting semester ini)
            </div>
          </div>
        )}

        {/* Footer App */}
        <div className="mt-3 text-center text-[10px] text-neutral-600 font-medium">
          JadwalKu · Solusi Manajemen Jadwal Perkuliahan Mahasiswa
        </div>
      </div>
    </>
  )
}
