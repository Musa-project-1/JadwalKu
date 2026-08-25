import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../hooks/useApp'
import { useFirestore } from '../hooks/useFirestore'
import { Icon } from './Icon'
import { sampleSchedule } from '../data/sampleSchedule'
import { firebaseReady } from '../lib/firebaseClient'
import { downloadIcs } from '../lib/icsExport'
import { renderScheduleImage, shareOrDownloadScheduleImage } from '../lib/scheduleImage'
import { expectedTahunAjaranForSemester } from '../lib/tahunAjaran'

const SCOPE_OPTIONS = [
  {
    value: 'semester',
    label: 'Semester ini saja',
    description: 'Hanya jadwal sesuai prodi & semester aktif',
  },
  {
    value: 'all',
    label: 'Semua kelas',
    description: 'Seluruh jadwal yang terpublikasi',
  },
]

export function ShareModal({ open, onClose }) {
  const { program, semester } = useApp()
  const [scope, setScope] = useState('semester')
  const [copied, setCopied] = useState(false)
  const [imageStatus, setImageStatus] = useState(null) // { ok: boolean, text: string }
  const modalRef = useRef(null)

  const ta = expectedTahunAjaranForSemester(semester)

  const { data: jadwal } = useFirestore(
    'jadwal',
    firebaseReady
      ? [
          ['prodi', '==', program ?? ''],
          ['status', '==', 'published'],
        ]
      : [],
  )

  const entries = useMemo(() => {
    if (scope === 'all') return jadwal
    return jadwal.filter((e) => e.semester === Number(semester))
  }, [jadwal, scope, semester])

  const source =
    entries.length > 0
      ? entries
      : !firebaseReady
        ? sampleSchedule.filter((e) => e.prodi === program && (scope === 'all' || e.semester === Number(semester)))
        : []

  // Close on Escape or click outside
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && open) onClose()
    }
    function handleClickOutside(e) {
      if (open && modalRef.current && !modalRef.current.contains(e.target)) {
        onClose()
      }
    }
    if (open) {
      window.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onClose])

  if (!open) return null

  async function handleShareText() {
    const text = `Jadwal ${program} Semester ${semester} · TA ${ta} - ${source.length} kelas per minggu (dibagikan dari JadwalKu)`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'JadwalKu', text })
      } else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // User cancelled
    }
  }

  async function handleShareImage() {
    try {
      setImageStatus({ ok: true, text: 'Membuat gambar...' })
      const canvas = renderScheduleImage(source, { prodi: program, semester, tahunAjaran: ta })
      const result = await shareOrDownloadScheduleImage(
        canvas,
        `jadwal-${(program ?? 'kampus').toLowerCase().replace(/\s+/g, '-')}-sem-${semester}.png`,
      )
      setImageStatus({ ok: true, text: result === 'shared' ? 'Dibagikan!' : 'Tersimpan!' })
    } catch {
      setImageStatus({ ok: false, text: 'Gagal membuat gambar' })
    }
    setTimeout(() => setImageStatus(null), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div
        ref={modalRef}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest/95 backdrop-blur-2xl dark:bg-surface-container-low/95 shadow-level-3 animate-fade-up"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20">
              <Icon name="ios_share" size={22} />
            </div>
            <div>
              <h2 className="text-title-md font-bold text-on-surface">Bagikan Jadwal</h2>
              <p className="text-body-sm text-on-surface-variant font-medium">
                {program} · Semester {semester} · TA {ta}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Pilihan Cakupan */}
          <div>
            <p className="text-label-caps uppercase tracking-wider text-on-surface-variant mb-2.5">
              Pilih Cakupan
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SCOPE_OPTIONS.map((opt) => {
                const isSelected = scope === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setScope(opt.value)}
                    className={`flex items-start gap-3 rounded-2xl p-3.5 text-left transition-all border ${
                      isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
                        : 'border-outline-variant/20 bg-surface-container-low/50 hover:bg-surface-container-low dark:bg-surface-container/40'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        isSelected ? 'border-primary' : 'border-outline-variant'
                      }`}
                    >
                      {isSelected && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm font-bold text-on-surface leading-tight">
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Opsi Ekspor */}
          <div>
            <p className="text-label-caps uppercase tracking-wider text-on-surface-variant mb-2.5">
              Opsi Ekspor
            </p>
            <div className="space-y-2.5">
              {/* Google Calendar */}
              <button
                type="button"
                onClick={() => downloadIcs(source, { prodi: program, semester, tahunAjaran: ta })}
                className="group flex w-full items-center gap-3.5 rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 p-3.5 text-left transition-all hover:border-primary/40 hover:bg-surface-container-low hover:shadow-sm dark:bg-surface-container/40"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <Icon name="event" size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-body-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                    Google Calendar / Kalender HP
                  </span>
                  <span className="block text-[11px] text-on-surface-variant">
                    Sinkron otomatis ke kalender HP via file .ics
                  </span>
                </div>
                <Icon name="chevron_right" size={20} className="shrink-0 text-on-surface-variant group-hover:text-primary transition-colors" />
              </button>

              {/* Salin Teks */}
              <button
                type="button"
                onClick={handleShareText}
                className="group flex w-full items-center gap-3.5 rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 p-3.5 text-left transition-all hover:border-primary/40 hover:bg-surface-container-low hover:shadow-sm dark:bg-surface-container/40"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                  <Icon name="share" size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-body-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                    Bagikan Teks
                  </span>
                  <span className="block text-[11px] text-on-surface-variant">
                    Salin ringkasan jadwal untuk WhatsApp / Telegram
                  </span>
                </div>
                {copied ? (
                  <span className="shrink-0 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-bold text-success">
                    Tersalin!
                  </span>
                ) : (
                  <Icon name="chevron_right" size={20} className="shrink-0 text-on-surface-variant group-hover:text-primary transition-colors" />
                )}
              </button>

              {/* Bagikan Gambar */}
              <button
                type="button"
                onClick={handleShareImage}
                className="group flex w-full items-center gap-3.5 rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 p-3.5 text-left transition-all hover:border-primary/40 hover:bg-surface-container-low hover:shadow-sm dark:bg-surface-container/40"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300">
                  <Icon name="image" size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-body-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                    Bagikan Gambar (PNG)
                  </span>
                  <span className="block text-[11px] text-on-surface-variant">
                    Simpan / kirim kartu grafis jadwal sebagai PNG
                  </span>
                </div>
                {imageStatus ? (
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    imageStatus.ok ? 'bg-success/15 text-success' : 'bg-error/15 text-error'
                  }`}>
                    {imageStatus.text}
                  </span>
                ) : (
                  <Icon name="chevron_right" size={20} className="shrink-0 text-on-surface-variant group-hover:text-primary transition-colors" />
                )}
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-center pt-1">
            <span className="rounded-full bg-surface-container px-3.5 py-1 text-label-caps font-semibold text-on-surface-variant border border-outline-variant/15">
              {source.length} kelas akan diekspor
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
