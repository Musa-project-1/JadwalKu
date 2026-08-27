import { useMemo, useState } from 'react'
import { Icon } from '../Icon'
import { Button } from '../Button'
import { DAYS } from '../../lib/uploadValidator'
import { formatRuang, getTodayName, sortByTime } from '../../lib/scheduleUtils'
import { formatWhatsAppUrl, getLecturerInitials } from '../../lib/lecturerUtils'
import { getClassType, TONE_CLASSES } from '../../lib/classTypes'

function toMin(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function LecturerTimetableModal({
  isOpen,
  onClose,
  lecturerName,
  lecturerContact,
  allSchedules = [],
  courses = [],
}) {
  const [copied, setCopied] = useState(false)

  const courseMap = useMemo(() => {
    const map = new Map()
    for (const c of courses) {
      if (c.kodeMK) map.set(c.kodeMK, c)
    }
    return map
  }, [courses])

  // Cari seluruh jadwal yang diampu oleh dosen ini
  const lecturerSchedules = useMemo(() => {
    if (!lecturerName) return []
    const target = lecturerName.trim().toLowerCase()

    return allSchedules.filter((s) => {
      const course = courseMap.get(s.kodeMK)
      const dosenName = (course?.dosen || s.dosen || '').trim().toLowerCase()
      return dosenName === target || dosenName.includes(target)
    })
  }, [lecturerName, allSchedules, courseMap])

  // Total SKS yang diajar
  const totalSksTaught = useMemo(() => {
    const countedMks = new Set()
    let sum = 0
    lecturerSchedules.forEach((s) => {
      if (s.kodeMK && !countedMks.has(s.kodeMK)) {
        countedMks.add(s.kodeMK)
        const course = courseMap.get(s.kodeMK)
        sum += Number(course?.sks) || 2
      }
    })
    return sum
  }, [lecturerSchedules, courseMap])

  // Grouping jadwal berdasarkan hari (Senin s.d. Sabtu)
  const groupedByDay = useMemo(() => {
    const groups = {}
    DAYS.forEach((d) => {
      groups[d] = []
    })

    lecturerSchedules.forEach((s) => {
      if (groups[s.hari]) {
        groups[s.hari].push(s)
      } else {
        groups[s.hari] = [s]
      }
    })

    const result = []
    DAYS.forEach((day) => {
      const entries = groups[day] || []
      if (entries.length > 0) {
        result.push({
          day,
          entries: sortByTime(entries),
        })
      }
    })
    return result
  }, [lecturerSchedules])

  // Status mengajar live hari ini
  const liveStatus = useMemo(() => {
    const todayName = getTodayName()
    const now = new Date()
    const nowMin = now.getHours() * 60 + now.getMinutes()

    const todayClasses = lecturerSchedules.filter((s) => s.hari === todayName)
    if (todayClasses.length === 0) {
      return {
        type: 'free',
        message: 'Tidak ada jadwal mengajar hari ini',
      }
    }

    // Cek apakah sedang berlangsung saat ini
    for (const c of todayClasses) {
      const start = toMin(c.jamMulai)
      const end = toMin(c.jamSelesai)
      if (nowMin >= start && nowMin <= end) {
        const course = courseMap.get(c.kodeMK)
        return {
          type: 'ongoing',
          message: `Sedang mengajar ${course?.namaMK || c.kodeMK} di ${formatRuang(c.ruang, c.tipeKelas)} (s.d. ${c.jamSelesai} WIB)`,
          currentClass: c,
        }
      }
    }

    // Cek kelas berikutnya hari ini
    const upcoming = todayClasses
      .filter((c) => toMin(c.jamMulai) > nowMin)
      .sort((a, b) => toMin(a.jamMulai) - toMin(b.jamMulai))[0]

    if (upcoming) {
      const course = courseMap.get(upcoming.kodeMK)
      return {
        type: 'upcoming',
        message: `Ada kelas hari ini: ${course?.namaMK || upcoming.kodeMK} pukul ${upcoming.jamMulai} WIB di ${formatRuang(upcoming.ruang, upcoming.tipeKelas)}`,
        upcomingClass: upcoming,
      }
    }

    return {
      type: 'done',
      message: 'Seluruh jadwal mengajar hari ini telah selesai',
    }
  }, [lecturerSchedules, courseMap])

  if (!isOpen || !lecturerName) return null

  const initials = getLecturerInitials(lecturerName)

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 max-[599px]:items-end max-[599px]:justify-stretch max-[599px]:p-0"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0 max-[599px]:max-h-[95vh] overflow-hidden">
        {/* Mobile handle */}
        <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        {/* Header Profil Dosen */}
        <header className="p-5 border-b border-outline-variant/15 bg-surface-container/30 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-extrabold text-lg shadow-sm border border-primary/20">
                {initials}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Dosen Pengampu
                </span>
                <h3 className="text-title-lg font-bold text-on-surface truncate">
                  {lecturerName}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-md bg-surface-container-highest px-2 py-0.5 text-label-caps font-bold text-on-surface">
                    <Icon name="calendar_month" size={13} />
                    {lecturerSchedules.length} Sesi Kelas
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-surface-container-highest px-2 py-0.5 text-label-caps font-bold text-on-surface">
                    <Icon name="book" size={13} />
                    {totalSksTaught} SKS
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer shrink-0"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          {/* Kontak WhatsApp Card */}
          {lecturerContact ? (
            <div className="mt-4 flex items-center justify-between gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
              <div className="flex items-center gap-2 min-w-0">
                <Icon name="chat" size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-body-sm font-bold text-emerald-950 dark:text-emerald-200 truncate">
                  {lecturerContact}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(lecturerContact)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-container text-body-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                  title="Salin Nomor"
                >
                  <Icon name={copied ? 'check' : 'content_copy'} size={13} className={copied ? 'text-emerald-500' : ''} />
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>
                <a
                  href={formatWhatsAppUrl(lecturerContact)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-body-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Icon name="open_in_new" size={13} />
                  <span>Chat WA</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-3 text-body-xs text-on-surface-variant italic">
              Kontak WhatsApp belum ditambahkan oleh Admin.
            </div>
          )}
        </header>

        {/* Live Teaching Status Banner */}
        <div className={`p-3.5 border-b border-outline-variant/15 flex items-center gap-2.5 text-body-xs font-bold shrink-0 ${
          liveStatus.type === 'ongoing'
            ? 'bg-error/10 text-error border-b-error/20'
            : liveStatus.type === 'upcoming'
            ? 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-b-blue-500/20'
            : 'bg-surface-container-low text-on-surface-variant'
        }`}>
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
            liveStatus.type === 'ongoing'
              ? 'bg-error animate-ping'
              : liveStatus.type === 'upcoming'
              ? 'bg-blue-500'
              : 'bg-outline-variant'
          }`} />
          <span className="truncate">{liveStatus.message}</span>
        </div>

        {/* Schedule List Grouped by Day */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {groupedByDay.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant">
              <Icon name="event_busy" size={36} className="mx-auto text-outline-variant" />
              <p className="text-body-sm font-semibold mt-2">
                Belum ada jadwal mengajar terpublikasi untuk dosen ini.
              </p>
            </div>
          ) : (
            groupedByDay.map(({ day, entries }) => (
              <div key={day} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                    {day}
                  </span>
                  <span className="text-[11px] font-semibold text-on-surface-variant">
                    ({entries.length} kelas)
                  </span>
                </div>

                <div className="space-y-2">
                  {entries.map((entry) => {
                    const course = courseMap.get(entry.kodeMK)
                    const classType = getClassType(entry.tipeKelas || entry.ruang)

                    return (
                      <div
                        key={entry.id ?? `${entry.kodeMK}-${entry.hari}-${entry.jamMulai}`}
                        className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-3.5 shadow-xs dark:bg-surface-container-low space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-label-caps font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                {entry.kodeMK}
                              </span>
                              <h4 className="text-body-md font-bold text-on-surface truncate">
                                {course?.namaMK || entry.kodeMK}
                              </h4>
                              {course?.sks && (
                                <span className="text-label-caps text-on-surface-variant font-semibold">
                                  ({course.sks} SKS)
                                </span>
                              )}
                            </div>
                            <p className="text-body-xs text-on-surface-variant font-medium mt-0.5">
                              {entry.prodi} · Semester {entry.semester}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-body-sm font-extrabold text-on-surface">
                              {entry.jamMulai} - {entry.jamSelesai}
                            </span>
                            <span className="block text-[10px] font-semibold text-on-surface-variant uppercase">
                              WIB
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-outline-variant/15 flex items-center justify-between gap-2 text-body-xs">
                          <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                            <Icon name="meeting_room" size={14} className="text-primary" />
                            <span>{formatRuang(entry.ruang, entry.tipeKelas)}</span>
                          </div>

                          {classType.label && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TONE_CLASSES[classType.tone] || 'bg-surface-container'}`}>
                              {classType.label}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end p-4 border-t border-outline-variant/15 bg-surface-container/20 shrink-0">
          <Button type="button" onClick={onClose} className="font-bold">
            Tutup
          </Button>
        </footer>
      </div>
    </div>
  )
}

