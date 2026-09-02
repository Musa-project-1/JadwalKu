import { useState, useEffect } from 'react'
import { Icon } from '../Icon'
import { Button } from '../Button'
import { parseRoomLocation } from '../../lib/locationUtils'
import { useFirestore } from '../../hooks/useFirestore'

export function RoomLocationModal({
  isOpen,
  onClose,
  ruang,
  tipeKelas = 'K1',
  scheduleEntries = [],
  currentCourseName = '',
}) {
  const [copied, setCopied] = useState(false)
  const { data: roomMasterList } = useFirestore('rooms', [], { limit: 200 })

  // Escape key handler
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }
    if (isOpen) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const loc = parseRoomLocation(ruang, tipeKelas, roomMasterList)

  // Find other classes using the same room today
  const roomScheduleToday = scheduleEntries.filter(
    (e) => String(e.ruang || '').trim().toLowerCase() === String(ruang || '').trim().toLowerCase(),
  )

  function handleCopyGuidance() {
    const text = `🗺️ *PANDUAN LOKASI RUANGAN KAMPUS*\n• *Ruangan:* ${loc.roomNumber}\n• *Gedung:* ${loc.building}\n• *Lantai:* ${loc.floor}\n• *Tipe Ruang:* ${loc.roomType}\n• *Petunjuk Arah:* ${loc.guidance}\n\n_Dibagikan via JadwalKu Kampus_`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-4 max-[599px]:items-end max-[599px]:p-0"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low dark:border-outline-variant/15 overflow-hidden animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0">
        <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1 -mx-2 shrink-0">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        {/* Header Banner - Rich Full-Width Teal/Emerald Gradient matching the student design system */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-950 via-teal-800 to-emerald-900 p-4 tablet:p-5 text-white flex items-center justify-between border-b border-white/10 shrink-0 shadow-level-1">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-xs backdrop-blur-md">
              <Icon name={loc.icon} size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base tablet:text-lg font-bold text-white tracking-tight truncate">
                  {loc.roomNumber}
                </h3>
                <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border border-white/25 shadow-2xs backdrop-blur-md">
                  {loc.buildingCode}
                </span>
              </div>
              <p className="text-[11.5px] text-white/80 font-medium truncate mt-0.5">
                {currentCourseName ? `${currentCourseName} · ` : ''}Informasi Lokasi & Denah Lantai
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {/* Card 1: Gedung & Lantai Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 dark:bg-surface-container-high/40 p-3.5 space-y-1">
              <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Icon name="apartment" size={14} className="text-primary" />
                <span>Gedung Kampus</span>
              </p>
              <p className="text-body-sm font-bold text-on-surface leading-snug">
                {loc.building}
              </p>
            </div>

            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 dark:bg-surface-container-high/40 p-3.5 space-y-1">
              <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Icon name="layers" size={14} className="text-secondary" />
                <span>Posisi Lantai</span>
              </p>
              <p className="text-body-sm font-bold text-on-surface leading-snug">
                {loc.floor}
              </p>
            </div>
          </div>

          {/* Card 2: Panduan Arah Menuju Ruangan (Wayfinding) */}
          <div className="rounded-2xl border border-teal-500/25 bg-teal-500/10 p-4 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-extrabold text-body-xs">
              <Icon name="explore" size={16} />
              <span>Panduan Arah Mahasiswa</span>
            </div>
            <p className="text-[12px] text-on-surface leading-relaxed font-medium">
              {loc.guidance}
            </p>
          </div>

          {/* Card 3: Fasilitas Standar Ruangan */}
          {Array.isArray(loc.facilities) && loc.facilities.length > 0 && (
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 dark:bg-surface-container-high/30 p-4 space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Icon name="check_circle" size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Fasilitas Ruangan</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {loc.facilities.map((fac) => (
                  <span
                    key={fac}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-lowest dark:bg-surface-container-low text-[10.5px] font-semibold text-on-surface border border-outline-variant/20 shadow-2xs"
                  >
                    <Icon name="done" size={12} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{fac}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Card 4: Jadwal Penggunaan Ruangan Hari Ini (Occupancy) */}
          {roomScheduleToday.length > 1 && (
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-3.5 space-y-2">
              <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Icon name="schedule" size={13} className="text-primary" />
                <span>Sesi Kuliah Lain di Ruang Ini Hari Ini ({roomScheduleToday.length})</span>
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                {roomScheduleToday.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/15 text-[11px]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-on-surface truncate">{entry.mataKuliah || entry.kodeMK}</p>
                      <p className="text-[10px] text-on-surface-variant">{entry.prodi} · S{entry.semester}</p>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-primary shrink-0 ml-2">
                      {entry.jamMulai} - {entry.jamSelesai}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-outline-variant/15 bg-surface-container-low/40 shrink-0">
          <button
            type="button"
            onClick={handleCopyGuidance}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-bold text-teal-800 dark:text-teal-300 hover:bg-teal-500/15 transition-colors cursor-pointer"
          >
            <Icon name={copied ? 'check' : 'content_copy'} size={14} />
            <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Panduan'}</span>
          </button>

          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="rounded-full px-5 py-1.5 text-body-xs font-semibold cursor-pointer"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}
