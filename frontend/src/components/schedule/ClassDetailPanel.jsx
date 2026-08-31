import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTasks } from '../../hooks/useTasks'
import { useAttendance } from '../../hooks/useAttendance'
import { Icon } from '../../components/Icon'
import { RoomLocationModal } from '../../components/student/RoomLocationModal'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'
import { getClassType, TONE_CLASSES } from '../../lib/classTypes'
import { formatRuang } from '../../lib/scheduleUtils'

function formatWhatsAppUrl(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  const formatted = digits.startsWith('0') ? '62' + digits.slice(1) : digits
  return `https://wa.me/${formatted}`
}

/** Validasi URL eksternal hanya untuk http/https (cegah javascript:/data: XSS). */
function safeExternalUrl(url) {
  try {
    const u = new URL(String(url || ''))
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

/** Theme mapping dinamis per jenis warna tipe kelas (K1 Offline, K2 Online, HB Hybrid, GBK Gabungan) */
const CLASS_TONE_THEMES = {
  offline: {
    headerGradient: 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800',
    typeBadge: 'bg-emerald-950/40 text-emerald-100 border border-emerald-300/30',
    accentText: 'text-emerald-700 dark:text-emerald-400',
    accentBg: 'bg-emerald-500/15',
    accentBorder: 'border-emerald-500/30',
    activeTabRing: 'text-emerald-700 dark:text-emerald-300',
    iconName: 'corporate_fare',
    dotColor: 'bg-emerald-500',
  },
  online: {
    headerGradient: 'bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-800',
    typeBadge: 'bg-blue-950/40 text-blue-100 border border-blue-300/30',
    accentText: 'text-blue-700 dark:text-blue-400',
    accentBg: 'bg-blue-500/15',
    accentBorder: 'border-blue-500/30',
    activeTabRing: 'text-blue-700 dark:text-blue-300',
    iconName: 'videocam',
    dotColor: 'bg-blue-500',
  },
  hybrid: {
    headerGradient: 'bg-gradient-to-r from-purple-900 via-violet-700 to-indigo-900',
    typeBadge: 'bg-purple-950/40 text-purple-100 border border-purple-300/30',
    accentText: 'text-purple-700 dark:text-purple-400',
    accentBg: 'bg-purple-500/15',
    accentBorder: 'border-purple-500/30',
    activeTabRing: 'text-purple-700 dark:text-purple-300',
    iconName: 'sync_alt',
    dotColor: 'bg-purple-500',
  },
  combined: {
    headerGradient: 'bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700',
    typeBadge: 'bg-amber-950/40 text-amber-100 border border-amber-300/30',
    accentText: 'text-amber-800 dark:text-amber-300',
    accentBg: 'bg-amber-500/15',
    accentBorder: 'border-amber-500/30',
    activeTabRing: 'text-amber-800 dark:text-amber-300',
    iconName: 'groups',
    dotColor: 'bg-amber-500',
  },
  neutral: {
    headerGradient: 'bg-gradient-to-r from-primary via-primary/95 to-primary-container',
    typeBadge: 'bg-black/25 text-white/95 border border-white/10',
    accentText: 'text-primary',
    accentBg: 'bg-primary/15',
    accentBorder: 'border-primary/30',
    activeTabRing: 'text-primary',
    iconName: 'school',
    dotColor: 'bg-primary',
  },
}

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
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const saveTimeoutRef = useRef(null)

  const [links, setLinks] = useState(() =>
    getItem(`${STORAGE_KEYS.courseLinks}:${kode}`, {
      lmsUrl: '',
      meetingUrl: '',
      waGroupUrl: '',
    }),
  )
  const [editingLinks, setEditingLinks] = useState(false)
  const [formLinks, setFormLinks] = useState({
    lmsUrl: links.lmsUrl || '',
    meetingUrl: links.meetingUrl || '',
    waGroupUrl: links.waGroupUrl || '',
  })
  const [roomModalOpen, setRoomModalOpen] = useState(false)

  // Find the next upcoming/unfilled session (1-16)
  const nextSessionNum = Array.from({ length: 16 }, (_, i) => i + 1).find(
    (n) => !attendanceInfo.sessions[n]
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

  function handleSaveLinks(e) {
    if (e) e.preventDefault()
    setItem(`${STORAGE_KEYS.courseLinks}:${kode}`, formLinks)
    setLinks(formLinks)
    setEditingLinks(false)
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
      {/* Backdrop overlay - clicking outside dismisses modal */}
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
                </div>
                <h2 id="class-detail-title" className="text-xl tablet:text-2xl font-bold tracking-tight truncate">
                  {course?.namaMK ?? entry.kodeMK}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-body-xs tablet:text-body-sm text-white/90 font-medium">
                  <Icon name="schedule" size={15} className="shrink-0 opacity-90" />
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

          {/* 2-Column Split Body (Left-Right Layout on tablet & desktop) */}
          <div className="grid grid-cols-1 tablet:grid-cols-12 flex-1 min-h-0 overflow-y-auto tablet:overflow-hidden">
            {/* LEFT COLUMN: Logistics, Room, Lecturer, Links, Reminder */}
            <div className="tablet:col-span-5 tablet:overflow-y-auto p-4 tablet:p-5 space-y-3.5 border-b tablet:border-b-0 tablet:border-r border-outline-variant/20 bg-surface-container-low/40 dark:bg-surface-container-high/20 custom-scrollbar">
              {/* Back-to-Back Class Transition Warning */}
              {transition && (
                <div className="rounded-2xl border border-orange-500/40 bg-orange-500/10 p-3.5 space-y-1.5 dark:bg-orange-500/15 shadow-xs">
                  <div className="flex items-center gap-2 text-orange-950 dark:text-orange-200 font-extrabold text-body-xs">
                    <Icon name="directions_run" size={17} className="text-orange-600 dark:text-orange-400 shrink-0 animate-bounce" />
                    <span>Peringatan Pindah Ruang</span>
                  </div>
                  <p className="text-body-xs text-orange-950 dark:text-orange-100 leading-relaxed font-medium">
                    {transition.type === 'incoming' ? (
                      <>
                        Dimulai <strong>{transition.gapMinutes === 0 ? 'langsung tanpa jeda' : `${transition.gapMinutes} menit`}</strong> setelah kelas sebelumnya di <strong>{transition.fromRoom}</strong>.
                      </>
                    ) : (
                      <>
                        Kelas berikutnya di <strong>{transition.toRoom}</strong> dengan jeda waktu <strong>{transition.gapMinutes === 0 ? '0 menit (langsung)' : `${transition.gapMinutes} menit`}</strong>.
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Room & Building Location Card (Tone-Aware Accent) */}
              <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 space-y-2 shadow-xs ring-1 ring-outline-variant/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                    <Icon name={theme.iconName} size={16} className={theme.accentText} />
                    Ruangan Kuliah
                  </span>
                  <button
                    type="button"
                    onClick={() => setRoomModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-bold border border-outline-variant/30 transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Icon name="explore" size={13} className={theme.accentText} />
                    <span>Denah Lokasi</span>
                  </button>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-body-md font-extrabold text-on-surface truncate">
                    {formatRuang(entry.ruang, entry.tipeKelas)}
                  </p>
                  {classType.label && (
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${TONE_CLASSES[classType.tone] ?? 'bg-surface-container text-on-surface-variant'}`}>
                      {classType.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Lecturer Info & WhatsApp Action (Highlighted) */}
              <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 space-y-2.5 shadow-xs ring-1 ring-outline-variant/10">
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${theme.accentBg} ${theme.accentText} font-bold shadow-2xs`}>
                    <Icon name="person" size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-on-surface-variant">Dosen Pengampu</p>
                    <p className="text-body-sm font-extrabold text-on-surface mt-0.5 leading-snug">
                      {course?.dosen ?? 'Dosen belum ditentukan'}
                    </p>
                  </div>
                </div>

                {course?.kontakDosen ? (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/15">
                    <a
                      href={formatWhatsAppUrl(course.kontakDosen)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-body-xs font-bold transition-all shadow-2xs group"
                    >
                      <Icon name="chat" size={15} className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span className="truncate">{course.kontakDosen}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(course.kontakDosen)
                        setCopiedPhone(true)
                        setTimeout(() => setCopiedPhone(false), 2000)
                      }}
                      className="flex h-8 items-center gap-1 px-2.5 rounded-xl bg-surface-container text-[11px] font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/20"
                    >
                      <Icon name={copiedPhone ? 'check' : 'content_copy'} size={13} className={copiedPhone ? 'text-emerald-500' : ''} />
                      <span>{copiedPhone ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-on-surface-variant font-medium pt-1 border-t border-outline-variant/15">
                    Kontak WhatsApp dosen belum tersedia
                  </p>
                )}
              </div>

              {/* Tautan Perkuliahan (LMS, Zoom, WA Group) */}
              <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 space-y-2.5 shadow-xs ring-1 ring-outline-variant/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon name="link" size={16} className={theme.accentText} />
                    <h3 className="text-body-xs font-extrabold uppercase tracking-wider text-on-surface">Tautan Perkuliahan</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormLinks({
                        lmsUrl: links.lmsUrl || '',
                        meetingUrl: links.meetingUrl || '',
                        waGroupUrl: links.waGroupUrl || '',
                      })
                      setEditingLinks(!editingLinks)
                    }}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Icon name={editingLinks ? 'close' : 'edit'} size={12} />
                    <span>{editingLinks ? 'Batal' : 'Atur Link'}</span>
                  </button>
                </div>

                {editingLinks ? (
                  <form onSubmit={handleSaveLinks} className="space-y-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                        🏫 LMS / Classroom / GDrive
                      </label>
                      <input
                        type="url"
                        value={formLinks.lmsUrl}
                        onChange={(e) => setFormLinks((prev) => ({ ...prev, lmsUrl: e.target.value }))}
                        placeholder="https://classroom.google.com/..."
                        className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                        📹 Link Meeting (Zoom / Meet)
                      </label>
                      <input
                        type="url"
                        value={formLinks.meetingUrl}
                        onChange={(e) => setFormLinks((prev) => ({ ...prev, meetingUrl: e.target.value }))}
                        placeholder="https://zoom.us/j/... atau Meet"
                        className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                        💬 Grup WA Mata Kuliah
                      </label>
                      <input
                        type="url"
                        value={formLinks.waGroupUrl}
                        onChange={(e) => setFormLinks((prev) => ({ ...prev, waGroupUrl: e.target.value }))}
                        placeholder="https://chat.whatsapp.com/..."
                        className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingLinks(false)}
                        className="px-3 py-1 rounded-xl text-[11px] font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1 rounded-xl bg-primary text-on-primary text-[11px] font-bold shadow-xs hover:bg-primary/90 cursor-pointer"
                      >
                        Simpan
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {/* LMS */}
                    {safeExternalUrl(links.lmsUrl) ? (
                      <a
                        href={safeExternalUrl(links.lmsUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/15 via-blue-500/10 to-transparent hover:from-blue-500/25 text-blue-900 dark:text-blue-200 border border-blue-500/35 ring-1 ring-blue-500/20 transition-all shadow-2xs font-bold text-body-xs group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon name="school" size={17} className="text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="truncate">LMS / Classroom</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-blue-600 dark:text-blue-400">
                          <span>Buka</span>
                          <Icon name="open_in_new" size={12} className="opacity-80 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingLinks(true)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-outline-variant/40 hover:border-primary hover:bg-primary/5 text-on-surface-variant hover:text-primary transition-all text-body-xs font-semibold cursor-pointer"
                      >
                        <Icon name="add" size={14} />
                        <span>Atur Link LMS / Materi</span>
                      </button>
                    )}

                    {/* Zoom / Meet (Prominently Highlighted for Online/K2) */}
                    {links.meetingUrl || isOnlineClass ? (
                      <a
                        href={safeExternalUrl(links.meetingUrl) || 'https://zoom.us/join'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-transparent hover:from-blue-500/30 text-blue-950 dark:text-blue-200 border border-blue-500/40 ring-1 ring-blue-500/25 transition-all shadow-xs font-bold text-body-xs group cursor-pointer`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
                            <Icon name="videocam" size={15} />
                          </div>
                          <span className="truncate font-extrabold">{links.meetingUrl ? 'Zoom / Meet Kelas' : 'Buka Aplikasi Zoom'}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-blue-700 dark:text-blue-300">
                          <span>Masuk</span>
                          <Icon name="open_in_new" size={12} className="opacity-80 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingLinks(true)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-outline-variant/40 hover:border-primary hover:bg-primary/5 text-on-surface-variant hover:text-primary transition-all text-body-xs font-semibold cursor-pointer"
                      >
                        <Icon name="add" size={14} />
                        <span>Atur Link Zoom / Meet</span>
                      </button>
                    )}

                    {/* WA Group */}
                    {safeExternalUrl(links.waGroupUrl) ? (
                      <a
                        href={safeExternalUrl(links.waGroupUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent hover:from-emerald-500/25 text-emerald-950 dark:text-emerald-200 border border-emerald-500/35 ring-1 ring-emerald-500/20 transition-all shadow-2xs font-bold text-body-xs group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon name="groups" size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">Grup WhatsApp Kelas</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300">
                          <span>Gabung</span>
                          <Icon name="open_in_new" size={12} className="opacity-80 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingLinks(true)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-outline-variant/40 hover:border-primary hover:bg-primary/5 text-on-surface-variant hover:text-primary transition-all text-body-xs font-semibold cursor-pointer"
                      >
                        <Icon name="add" size={14} />
                        <span>Atur Grup WhatsApp Kelas</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 15-Minute Reminder Toggle */}
              <div className={`flex items-center justify-between rounded-2xl border px-3.5 py-2.5 shadow-2xs transition-all ${
                reminderOn
                  ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/15 dark:bg-primary/10'
                  : 'border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Icon name="notifications_active" size={18} className={reminderOn ? theme.accentText : 'text-on-surface-variant'} />
                  <span className="text-[12px] font-bold text-on-surface">Pengingat 15m sebelum kelas</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={reminderOn}
                  aria-label={`Pengingat untuk ${course?.namaMK ?? kode}`}
                  onClick={handleReminderToggle}
                  className={`relative h-5 w-10 shrink-0 rounded-full transition-colors cursor-pointer ${
                    reminderOn ? (tone === 'offline' ? 'bg-emerald-600' : tone === 'online' ? 'bg-blue-600' : tone === 'hybrid' ? 'bg-purple-600' : tone === 'combined' ? 'bg-amber-600' : 'bg-primary') : 'bg-surface-variant'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all shadow-xs ${
                      reminderOn ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Tabs (Presensi & Sisa Absen / Catatan & Tugas) */}
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

              {/* TAB 1: PRESENSI & JATAH ABSEN */}
              {activeTab === 'presensi' && (
                <div className="space-y-4 animate-fade-in flex-1">
                  {/* Quota & Sisa Absen Banner */}
                  <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-surface-container-low/80 to-transparent dark:from-emerald-500/15 dark:to-transparent ring-1 ring-emerald-500/20 shadow-xs">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                        Status Presensi Kuliah
                      </p>
                      <p className="text-body-xs text-on-surface font-semibold mt-0.5">
                        Tercatat <strong className="text-emerald-700 dark:text-emerald-300 text-[13px]">{attendanceInfo.counts.hadir}</strong> hadir dari {attendanceInfo.counts.totalFilled || 0} pertemuan
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-body-xs font-extrabold shadow-xs ${
                        attendanceInfo.statusTier === 'danger'
                          ? 'bg-error text-white'
                          : attendanceInfo.statusTier === 'warning'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      <Icon
                        name={
                          attendanceInfo.statusTier === 'danger'
                            ? 'error'
                            : attendanceInfo.statusTier === 'warning'
                            ? 'warning'
                            : 'check_circle'
                        }
                        size={15}
                      />
                      <span>
                        {attendanceInfo.statusTier === 'danger'
                          ? 'Jatah Habis (0x)'
                          : `Sisa Jatah: ${attendanceInfo.remainingAbsences}x`}
                      </span>
                    </span>
                  </div>

                  {/* Progress Bar UAS Requirement */}
                  <div className="space-y-2 p-3.5 rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 dark:bg-surface-container-high/30 shadow-2xs">
                    <div className="flex items-center justify-between text-body-xs font-semibold">
                      <span className="text-on-surface-variant font-bold">Tingkat Kehadiran Mahasiswa:</span>
                      <span className={attendanceInfo.attendancePercent >= 75 ? 'text-emerald-700 dark:text-emerald-300 font-black' : 'text-error font-black'}>
                        {attendanceInfo.attendancePercent}% (Target UAS: 75%)
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-highest">
                      <div
                        className={`h-full transition-all duration-300 rounded-full shadow-2xs ${
                          attendanceInfo.attendancePercent >= 75 ? 'bg-emerald-500' : 'bg-error'
                        }`}
                        style={{ width: `${Math.min(100, attendanceInfo.attendancePercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Increment Log Buttons */}
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-2">
                      Catat Cepat Pertemuan Berikutnya:
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => quickIncrement(kode, 'hadir')}
                        className="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 text-emerald-800 dark:text-emerald-200 border border-emerald-500/35 ring-1 ring-emerald-500/20 font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <span className="text-body-xs font-black">+ Hadir</span>
                        <span className="text-[10.5px] font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">{attendanceInfo.counts.hadir}x</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => quickIncrement(kode, 'izin')}
                        className="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl bg-blue-500/15 hover:bg-blue-500/25 active:scale-95 text-blue-800 dark:text-blue-200 border border-blue-500/35 ring-1 ring-blue-500/20 font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <span className="text-body-xs font-black">+ Izin</span>
                        <span className="text-[10.5px] font-extrabold text-blue-700 dark:text-blue-300 mt-0.5">{attendanceInfo.counts.izin}x</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => quickIncrement(kode, 'sakit')}
                        className="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-900 dark:text-amber-200 border border-amber-500/35 ring-1 ring-amber-500/20 font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <span className="text-body-xs font-black">+ Sakit</span>
                        <span className="text-[10.5px] font-extrabold text-amber-800 dark:text-amber-300 mt-0.5">{attendanceInfo.counts.sakit}x</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => quickIncrement(kode, 'alpa')}
                        className="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl bg-error/15 hover:bg-error/25 active:scale-95 text-error border border-error/35 ring-1 ring-error/20 font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <span className="text-body-xs font-black">+ Alpa</span>
                        <span className="text-[10.5px] font-extrabold text-error mt-0.5">{attendanceInfo.counts.alpa}x</span>
                      </button>
                    </div>
                  </div>

                  {/* 16-Meeting Matrix (Split into UTS: 1-8 & UAS: 9-16) */}
                  <div className="pt-2 border-t border-outline-variant/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                        Matriks 16 Pertemuan
                      </span>
                      {attendanceInfo.counts.totalFilled > 0 && (
                        <button
                          type="button"
                          onClick={() => resetCourseAttendance(kode)}
                          className="text-[11px] font-bold text-error hover:underline transition-colors cursor-pointer"
                        >
                          Reset Presensi
                        </button>
                      )}
                    </div>

                    {/* Sesi 1-8 (Pra-UTS) */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-on-surface-variant">Sesi 1 - 8 (Pra-UTS):</span>
                      <div className="grid grid-cols-8 gap-1.5">
                        {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => {
                          const status = attendanceInfo.sessions[num]
                          const isNext = num === nextSessionNum
                          let bg = isNext
                            ? 'bg-primary/10 text-primary border-2 border-primary ring-2 ring-primary/25 font-black animate-pulse'
                            : 'bg-surface-container text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-high'
                          let label = num

                          if (status === 'hadir') {
                            bg = 'bg-emerald-500 text-white font-extrabold shadow-2xs border border-emerald-600'
                            label = 'H'
                          } else if (status === 'izin') {
                            bg = 'bg-blue-500 text-white font-extrabold shadow-2xs border border-blue-600'
                            label = 'I'
                          } else if (status === 'sakit') {
                            bg = 'bg-amber-500 text-white font-extrabold shadow-2xs border border-amber-600'
                            label = 'S'
                          } else if (status === 'alpa') {
                            bg = 'bg-error text-white font-extrabold shadow-2xs border border-red-700'
                            label = 'A'
                          }

                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                const nextStatus =
                                  !status
                                    ? 'hadir'
                                    : status === 'hadir'
                                    ? 'izin'
                                    : status === 'izin'
                                    ? 'sakit'
                                    : status === 'sakit'
                                    ? 'alpa'
                                    : null
                                setMeetingStatus(kode, num, nextStatus)
                              }}
                              title={`Sesi ${num}: ${status ? status.toUpperCase() : isNext ? 'Sesi Berikutnya' : 'Belum diisi'} (Klik ubah)`}
                              className={`flex h-8 w-full items-center justify-center rounded-xl text-body-xs font-bold transition-all active:scale-90 cursor-pointer ${bg}`}
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Sesi 9-16 (Pra-UAS) */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-on-surface-variant">Sesi 9 - 16 (Pra-UAS):</span>
                      <div className="grid grid-cols-8 gap-1.5">
                        {Array.from({ length: 8 }, (_, i) => i + 9).map((num) => {
                          const status = attendanceInfo.sessions[num]
                          const isNext = num === nextSessionNum
                          let bg = isNext
                            ? 'bg-primary/10 text-primary border-2 border-primary ring-2 ring-primary/25 font-black animate-pulse'
                            : 'bg-surface-container text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-high'
                          let label = num

                          if (status === 'hadir') {
                            bg = 'bg-emerald-500 text-white font-extrabold shadow-2xs border border-emerald-600'
                            label = 'H'
                          } else if (status === 'izin') {
                            bg = 'bg-blue-500 text-white font-extrabold shadow-2xs border border-blue-600'
                            label = 'I'
                          } else if (status === 'sakit') {
                            bg = 'bg-amber-500 text-white font-extrabold shadow-2xs border border-amber-600'
                            label = 'S'
                          } else if (status === 'alpa') {
                            bg = 'bg-error text-white font-extrabold shadow-2xs border border-red-700'
                            label = 'A'
                          }

                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                const nextStatus =
                                  !status
                                    ? 'hadir'
                                    : status === 'hadir'
                                    ? 'izin'
                                    : status === 'izin'
                                    ? 'sakit'
                                    : status === 'sakit'
                                    ? 'alpa'
                                    : null
                                setMeetingStatus(kode, num, nextStatus)
                              }}
                              title={`Sesi ${num}: ${status ? status.toUpperCase() : isNext ? 'Sesi Berikutnya' : 'Belum diisi'} (Klik ubah)`}
                              className={`flex h-8 w-full items-center justify-center rounded-xl text-body-xs font-bold transition-all active:scale-90 cursor-pointer ${bg}`}
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <p className="text-[10.5px] text-on-surface-variant text-center pt-1 font-medium">
                      Klik sesi untuk memutar status: <strong className="text-emerald-600 dark:text-emerald-400">H (Hadir)</strong> &rarr; <strong className="text-blue-600 dark:text-blue-400">I (Izin)</strong> &rarr; <strong className="text-amber-600 dark:text-amber-400">S (Sakit)</strong> &rarr; <strong className="text-error">A (Alpa)</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: CATATAN & TUGAS TERKAIT */}
              {activeTab === 'notes' && (
                <div className="space-y-4 animate-fade-in flex-1">
                  {/* Catatan Sesi Kuliah */}
                  <section className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-1.5 text-body-xs font-extrabold uppercase tracking-wider text-on-surface">
                        <Icon name="sticky_note_2" size={16} className="text-amber-500" />
                        Catatan Kuliah (Auto-save)
                      </h3>
                      <div className="flex items-center gap-2">
                        {noteSaved && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Icon name="check" size={13} />
                            Tersimpan
                          </span>
                        )}
                        {note && (
                          <>
                            <button
                              type="button"
                              onClick={handleCopyNote}
                              className="text-[11px] font-bold text-primary hover:underline transition-colors cursor-pointer flex items-center gap-0.5"
                            >
                              <Icon name={copiedNote ? 'check' : 'content_copy'} size={12} />
                              <span>{copiedNote ? 'Tersalin' : 'Salin'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleClearNote}
                              className="text-[11px] font-bold text-error/80 hover:text-error transition-colors cursor-pointer"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Quick Tag Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-extrabold text-on-surface-variant uppercase">
                        Pintasan:
                      </span>
                      {QUICK_NOTE_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => appendTag(tag)}
                          className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[11px] font-bold text-amber-900 dark:text-amber-200 border border-amber-500/30 transition-all shadow-2xs cursor-pointer active:scale-95"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <textarea
                      id="course-note-input"
                      name="course-note"
                      aria-label="Catatan kuliah"
                      value={note}
                      onChange={(e) => handleNoteChange(e.target.value)}
                      placeholder="Tulis catatan penting perkuliahan, instruksi dosen, tugas, atau kuis..."
                      className="min-h-[110px] w-full resize-none rounded-2xl border border-outline-variant/35 bg-surface-container-low/40 p-3.5 text-body-sm text-on-surface placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none dark:bg-surface-container-high/40 shadow-xs leading-relaxed"
                    />
                  </section>

                  {/* Tugas Terkait Section */}
                  <section className="pt-2 border-t border-outline-variant/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-1.5 text-body-xs font-extrabold uppercase tracking-wider text-on-surface">
                        <Icon name="assignment" size={16} className="text-primary" />
                        Tugas Tertaut
                      </h3>
                      <Link
                        to="/tugas"
                        state={{ createKodeMK: kode }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 px-3 py-1 text-[11px] font-bold transition-all shadow-2xs"
                      >
                        <Icon name="add" size={13} />
                        <span>Tambah Tugas</span>
                      </Link>
                    </div>

                    {relatedTasks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-outline-variant/40 p-4 text-center">
                        <p className="text-body-xs text-on-surface-variant font-medium">
                          Belum ada tugas untuk mata kuliah ini.
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {relatedTasks.map((task) => (
                          <li
                            key={task.id}
                            className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low/60 px-3.5 py-2.5 border border-outline-variant/25 shadow-2xs"
                          >
                            <span
                              className={`min-w-0 truncate text-body-xs font-bold ${
                                task.selesai
                                  ? 'text-outline line-through'
                                  : 'text-on-surface'
                              }`}
                            >
                              {task.judul}
                            </span>
                            <span className="shrink-0 text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">
                              {task.deadline ?? '-'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
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
