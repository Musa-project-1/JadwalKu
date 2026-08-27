import { useState } from 'react'
import { Icon } from '../Icon'
import { parseRoomLocation } from '../../lib/locationUtils'

export function RoomLocationModal({
  isOpen,
  onClose,
  ruang,
  tipeKelas = 'K1',
  scheduleEntries = [],
  currentCourseName = '',
}) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const loc = parseRoomLocation(ruang, tipeKelas)

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl animate-fade-up overflow-hidden">
        {/* Header Modal */}
        <header className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4 shrink-0 bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
              <Icon name={loc.icon} size={22} />
            </div>
            <div>
              <h2 className="text-title-md font-bold text-on-surface flex items-center gap-2">
                <span>{loc.roomNumber}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${loc.badgeTone}`}>
                  {loc.buildingCode}
                </span>
              </h2>
              <p className="text-body-xs text-on-surface-variant font-medium">
                {currentCourseName ? `${currentCourseName} · ` : ''}Informasi Lokasi & Denah Lantai
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
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
          <div className="rounded-2xl border border-primary/25 bg-primary/5 dark:bg-primary-container/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-body-xs">
              <Icon name="explore" size={17} />
              <span>Panduan Arah Mahasiswa Baru</span>
            </div>
            <p className="text-body-xs text-on-surface leading-relaxed font-medium">
              {loc.guidance}
            </p>
          </div>

          {/* Card 3: Fasilitas Standar Ruangan */}
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 dark:bg-surface-container-high/30 p-4 space-y-2.5">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <Icon name="check_circle" size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Fasilitas Ruangan</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {loc.facilities.map((fac) => (
                <span
                  key={fac}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-container text-[11px] font-semibold text-on-surface border border-outline-variant/25"
                >
                  <Icon name="done" size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{fac}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Card 4: Jadwal Penggunaan Ruangan Hari Ini (Occupancy) */}
          {roomScheduleToday.length > 0 && (
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 dark:bg-surface-container-high/30 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <Icon name="calendar_month" size={14} className="text-secondary" />
                  <span>Jadwal Ruangan Hari Ini</span>
                </p>
                <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                  {roomScheduleToday.length} Sesi
                </span>
              </div>

              <div className="space-y-1.5">
                {roomScheduleToday.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/20 text-body-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-on-surface truncate">
                        {item.namaMK || item.kodeMK}
                      </p>
                      <p className="text-[10.5px] text-on-surface-variant truncate">
                        {item.prodi ? `${item.prodi} · ` : ''}Sem {item.semester || '-'}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-primary shrink-0 bg-primary/10 px-2 py-1 rounded-lg">
                      {item.jamMulai} - {item.jamSelesai}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <footer className="flex items-center justify-between border-t border-outline-variant/20 px-5 py-3.5 bg-surface-container-low/50 shrink-0">
          <button
            type="button"
            onClick={handleCopyGuidance}
            className="flex items-center gap-1.5 text-body-xs font-bold text-primary hover:underline cursor-pointer"
          >
            <Icon name={copied ? 'check' : 'content_copy'} size={15} />
            <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Panduan'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-body-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </footer>
      </div>
    </div>
  )
}

