import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../Icon'
import { useApp } from '../../hooks/useApp'
import { DAYS } from '../../lib/uploadValidator'
import { sortByTime } from '../../lib/scheduleUtils'
import { PrintOptionsPanel } from './print/PrintOptionsPanel'
import { PrintPreviewWall } from './print/PrintPreviewWall'
import { PrintPreviewMatrix } from './print/PrintPreviewMatrix'
import { PrintPreviewPocket } from './print/PrintPreviewPocket'
import { PrintablePageArea } from './print/PrintablePageArea'

export function PrintScheduleModal({
  isOpen: rawIsOpen,
  open: rawOpen,
  onClose,
  scheduleEntries: rawScheduleEntries,
  scheduleSource,
  courses = [],
  program = '',
  semester = 1,
  tahunAjaran: rawTahunAjaran,
  selectedTA,
}) {
  const isOpen = rawIsOpen ?? rawOpen ?? false
  const scheduleEntries = useMemo(
    () => ((rawScheduleEntries && rawScheduleEntries.length > 0) ? rawScheduleEntries : (scheduleSource || [])),
    [rawScheduleEntries, scheduleSource],
  )
  const tahunAjaran = rawTahunAjaran || selectedTA || ''
  const { t } = useApp()
  const modalRef = useRef(null)
  const [layoutFormat, setLayoutFormat] = useState('wall') // 'wall' | 'matrix' | 'pocket'
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
          className="relative flex flex-col w-full max-w-5xl h-[92vh] max-h-[760px] rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-level-3 overflow-hidden animate-fade-up"
        >
          {/* Header Modal */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-800 p-4 tablet:px-6 tablet:py-4 text-white flex items-center justify-between border-b border-white/10 shrink-0 shadow-level-1">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-level-1 backdrop-blur-md">
                <Icon name="print" size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 id="print-schedule-title" className="text-title-sm tablet:text-title-md font-bold text-white tracking-tight truncate">
                    {t ? t('print.title') : 'Cetak & Simpan Jadwal Kuliah'}
                  </h3>
                  <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-label-caps font-extrabold uppercase tracking-wide border border-white/25 shadow-level-1 backdrop-blur-md">
                    Ink-Friendly A4
                  </span>
                </div>
                <p className="text-label-caps text-white/80 font-medium truncate mt-0.5">
                  {program} · Semester {semester} {tahunAjaran ? `· TA ${tahunAjaran}` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t ? t('action.close') : 'Tutup modal'}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all border border-white/20 cursor-pointer"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          {/* Modal Body: Split 2 Kolom (Pengaturan di Kiri, Pratinjau Kertas di Kanan) */}
          <div className="flex-1 min-h-0 flex flex-col tablet:flex-row overflow-hidden">
            {/* SISI KIRI: Controls & Options */}
            <PrintOptionsPanel
              layoutFormat={layoutFormat}
              setLayoutFormat={setLayoutFormat}
              customTitle={customTitle}
              setCustomTitle={setCustomTitle}
              showLecturer={showLecturer}
              setShowLecturer={setShowLecturer}
              showRoom={showRoom}
              setShowRoom={setShowRoom}
              showSks={showSks}
              setShowSks={setShowSks}
              showNotes={showNotes}
              setShowNotes={setShowNotes}
              showMemoSpace={showMemoSpace}
              setShowMemoSpace={setShowMemoSpace}
              activeOptionsCount={activeOptionsCount}
              t={t}
            />

            {/* SISI KANAN: Preview Lembar Cetak Kertas A4 */}
            <div className="flex-1 min-w-0 p-4 tablet:p-6 overflow-y-auto custom-scrollbar bg-surface-container-low/25 dark:bg-surface-container-high/10 flex justify-center">
              <div className="w-full max-w-[620px] bg-white text-neutral-900 border border-neutral-300 rounded-xl shadow-level-2 p-5 tablet:p-7 min-h-[580px] flex flex-col justify-between">
                <div>
                  {/* Paper Header */}
                  <div className="border-b border-neutral-800 pb-2.5 mb-3.5 flex items-start justify-between">
                    <div>
                      <h4 className="text-title-sm font-extrabold tracking-tight text-neutral-900 uppercase">
                        JADWAL KULIAH MAHASISWA
                      </h4>
                      <p className="text-[10px] font-bold text-neutral-700 mt-0.5">
                        {program || 'SEMUA PROGRAM STUDI'} · SEMESTER {semester} {tahunAjaran ? `· TA ${tahunAjaran}` : ''}
                      </p>
                      {customTitle && (
                        <p className="text-[10.5px] font-semibold text-neutral-900 mt-1 italic">
                          {customTitle}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-[9.5px] text-neutral-600 font-medium">
                      <p>Total: <strong>{totalSks} SKS</strong> · {scheduleEntries.length} Kelas</p>
                      <p className="mt-0.5">Dicetak: {currentDateFormatted}</p>
                    </div>
                  </div>

                  {/* Layout Renderers */}
                  {layoutFormat === 'wall' && (
                    <PrintPreviewWall
                      activeDays={activeDays}
                      groupedByDay={groupedByDay}
                      courseMap={courseMap}
                      showRoom={showRoom}
                      showLecturer={showLecturer}
                      showSks={showSks}
                      showNotes={showNotes}
                    />
                  )}

                  {layoutFormat === 'matrix' && (
                    <PrintPreviewMatrix
                      groupedByDay={groupedByDay}
                      courseMap={courseMap}
                      showRoom={showRoom}
                      showLecturer={showLecturer}
                    />
                  )}

                  {layoutFormat === 'pocket' && (
                    <PrintPreviewPocket
                      program={program}
                      semester={semester}
                      tahunAjaran={tahunAjaran}
                      customTitle={customTitle}
                      currentDateFormatted={currentDateFormatted}
                      totalSks={totalSks}
                      scheduleEntries={scheduleEntries}
                      groupedByDay={groupedByDay}
                      courseMap={courseMap}
                      showRoom={showRoom}
                      showLecturer={showLecturer}
                    />
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
      <PrintablePageArea
        layoutFormat={layoutFormat}
        program={program}
        semester={semester}
        tahunAjaran={tahunAjaran}
        customTitle={customTitle}
        currentDateFormatted={currentDateFormatted}
        totalSks={totalSks}
        scheduleEntries={scheduleEntries}
        activeDays={activeDays}
        groupedByDay={groupedByDay}
        courseMap={courseMap}
        showRoom={showRoom}
        showLecturer={showLecturer}
        showSks={showSks}
        showNotes={showNotes}
        showMemoSpace={showMemoSpace}
      />
    </>
  )
}
