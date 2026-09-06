import { useState, useRef, useEffect } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { useAttendance } from '../../hooks/useAttendance'
import { Icon } from '../Icon'
import { RoomLocationModal } from '../student/RoomLocationModal'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'
import { getClassType } from '../../lib/classTypes'
import { CLASS_TONE_THEMES } from './classDetail/classDetailTheme'
import { ClassDetailInfoColumn } from './classDetail/ClassDetailInfoColumn'
import { ClassDetailAttendanceTab } from './classDetail/ClassDetailAttendanceTab'
import { ClassDetailNotesTab } from './classDetail/ClassDetailNotesTab'

export default function ClassDetailPanel({ entry, course, transition, onClose }) {
  const { tasks } = useTasks()
  const { getCourseAttendance, setMeetingStatus, quickIncrement, resetCourseAttendance } = useAttendance()
  const kode = entry.kodeMK ?? ''
  const attendanceInfo = getCourseAttendance(kode)

  const [activeTab, setActiveTab] = useState('presensi') // 'presensi' | 'notes'
  const [note, setNote] = useState(() => getItem(`${STORAGE_KEYS.courseNotes}:${kode}`, ''))
  const [reminderOn, setReminderOn] = useState(() =>
    getItem(`${STORAGE_KEYS.courseReminders}:${kode}`, true),
  )
  const [copiedNote, setCopiedNote] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const saveTimeoutRef = useRef(null)

  const [links, setLinks] = useState(() =>
    getItem(`${STORAGE_KEYS.courseLinks}:${kode}`, {
      lmsUrl: '',
      meetingUrl: '',
      waGroupUrl: '',
    }),
  )
  const [roomModalOpen, setRoomModalOpen] = useState(false)

  // Find the next upcoming/unfilled session (1-16)
  const nextSessionNum =
    Array.from({ length: 16 }, (_, i) => i + 1).find(
      (n) => !attendanceInfo.sessions[n],
    ) || null

  const classType = getClassType(entry.tipeKelas || entry.ruang)
  const tone = classType.tone || 'neutral'
  const theme = CLASS_TONE_THEMES[tone] ?? CLASS_TONE_THEMES.neutral

  const isOnlineClass =
    tone === 'online' ||
    classType.label?.toLowerCase().includes('online') ||
    entry.ruang?.toLowerCase().includes('online') ||
    entry.ruang?.toLowerCase().includes('zoom') ||
    entry.tipeKelas === 'K2' ||
    entry.tipeKelas === 'GBK2'

  // Support ESC key to close modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function saveLinksToStorage(newLinks) {
    setItem(`${STORAGE_KEYS.courseLinks}:${kode}`, newLinks)
  }

  const relatedTasks = tasks.filter((t) => t.kodeMK === kode)

  function handleNoteChange(value) {
    setNote(value)
    setItem(`${STORAGE_KEYS.courseNotes}:${kode}`, value)
    setNoteSaved(true)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => setNoteSaved(false), 2500)
  }

  const QUICK_NOTE_TAGS = [
    '💻 Bawa Laptop',
    '📝 Ada Kuis',
    '📚 Materi Bab Baru',
    '⏰ Jam Khusus',
    '👥 Tugas Kelompok',
  ]

  function appendTag(tag) {
    const next = note ? `${note}\n• ${tag}: ` : `• ${tag}: `
    handleNoteChange(next)
  }

  function handleCopyNote() {
    if (!note) return
    navigator.clipboard.writeText(note)
    setCopiedNote(true)
    setTimeout(() => setCopiedNote(false), 2000)
  }

  function handleClearNote() {
    handleNoteChange('')
  }

  function handleReminderToggle() {
    const next = !reminderOn
    setItem(`${STORAGE_KEYS.courseReminders}:${kode}`, next)
    setReminderOn(next)
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-6 bg-black/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="class-detail-title"
      >
        {/* Centered Modal Container */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[92vh] tablet:max-h-[85vh] flex flex-col rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl overflow-hidden animate-fade-up"
        >
          {/* Header Banner - Dynamically Styled with Class Type Tone */}
          <div className={`sticky top-0 z-20 ${theme.headerGradient} p-4 tablet:p-5 text-white shadow-level-1 shrink-0 transition-colors duration-300`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="rounded-lg bg-white/25 px-2.5 py-0.5 text-label-caps font-extrabold tracking-wide shadow-2xs border border-white/20">
                    {entry.kodeMK}
                  </span>
                  {course?.sks && (
                    <span className="rounded-lg bg-white/15 px-2.5 py-0.5 text-[11px] font-bold border border-white/20">
                      {course.sks} SKS
                    </span>
                  )}
                  {classType.label && (
                    <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-bold shadow-2xs ${theme.typeBadge}`}>
                      <span className={`h-2 w-2 rounded-full ${theme.dotColor}`} />
                      <span>{classType.label}</span>
                    </span>
                  )}
                  {entry.tipeKelas && entry.tipeKelas !== 'Reguler' && (
                    <span className="rounded-lg bg-black/20 px-2 py-0.5 text-[10.5px] font-bold border border-white/15">
                      {entry.tipeKelas}
                    </span>
                  )}
                </div>
                <h2 id="class-detail-title" className="text-title-md tablet:text-title-lg font-black tracking-tight leading-tight drop-shadow-xs">
                  {course?.namaMK ?? entry.kodeMK}
                </h2>
                <p className="text-body-xs font-semibold opacity-90 mt-1 flex items-center gap-2 flex-wrap">
                  <span>Semester {entry.semester}</span>
                  <span>•</span>
                  <span>Kelas {entry.kelas ?? 'A'}</span>
                  <span>•</span>
                  <span>
                    {entry.hari}, {entry.jamMulai} - {entry.jamSelesai} WIB
                  </span>
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup panel"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
          </div>

          {/* 2-Column Split Body */}
          <div className="grid grid-cols-1 tablet:grid-cols-12 flex-1 min-h-0 overflow-y-auto tablet:overflow-hidden">
            {/* LEFT COLUMN */}
            <ClassDetailInfoColumn
              entry={entry}
              course={course}
              transition={transition}
              classType={classType}
              theme={theme}
              isOnlineClass={isOnlineClass}
              links={links}
              setLinks={setLinks}
              reminderOn={reminderOn}
              handleReminderToggle={handleReminderToggle}
              setRoomModalOpen={setRoomModalOpen}
              kode={kode}
              saveLinksToStorage={saveLinksToStorage}
            />

            {/* RIGHT COLUMN */}
            <div className="tablet:col-span-7 tablet:overflow-y-auto p-4 tablet:p-5 flex flex-col space-y-4 bg-surface-container-lowest dark:bg-surface-container-low custom-scrollbar">
              {/* Segmented Tab Navigation */}
              <div className="flex items-center p-1 rounded-2xl bg-surface-container-low dark:bg-surface-container-high border border-outline-variant/25 shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('presensi')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-body-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'presensi'
                      ? `bg-surface-container-lowest dark:bg-surface-container-lowest ${theme.activeTabRing} shadow-xs ring-1 ring-outline-variant/15`
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Icon name="fact_check" size={16} />
                  <span>Presensi & Absen</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold shadow-2xs ${
                    attendanceInfo.attendancePercent >= 75
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-error/15 text-error border border-error/30'
                  }`}>
                    {attendanceInfo.attendancePercent}%
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-body-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'notes'
                      ? `bg-surface-container-lowest dark:bg-surface-container-lowest ${theme.activeTabRing} shadow-xs ring-1 ring-outline-variant/15`
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Icon name="sticky_note_2" size={16} />
                  <span>Catatan & Tugas</span>
                  {relatedTasks.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 bg-secondary/20 text-secondary border border-secondary/30 rounded-full font-extrabold">
                      {relatedTasks.length}
                    </span>
                  )}
                </button>
              </div>

              {activeTab === 'presensi' && (
                <ClassDetailAttendanceTab
                  attendanceInfo={attendanceInfo}
                  quickIncrement={quickIncrement}
                  kode={kode}
                  resetCourseAttendance={resetCourseAttendance}
                  nextSessionNum={nextSessionNum}
                  setMeetingStatus={setMeetingStatus}
                />
              )}

              {activeTab === 'notes' && (
                <ClassDetailNotesTab
                  kode={kode}
                  note={note}
                  handleNoteChange={handleNoteChange}
                  noteSaved={noteSaved}
                  handleCopyNote={handleCopyNote}
                  copiedNote={copiedNote}
                  handleClearNote={handleClearNote}
                  appendTag={appendTag}
                  QUICK_NOTE_TAGS={QUICK_NOTE_TAGS}
                  relatedTasks={relatedTasks}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auxiliary Room Location Modal */}
      <RoomLocationModal
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        ruang={entry.ruang}
        tipeKelas={entry.tipeKelas}
        currentCourseName={course?.namaMK ?? entry.kodeMK}
      />
    </>
  )
}
