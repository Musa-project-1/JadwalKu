import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../hooks/useApp'
import { useFirestore } from '../hooks/useFirestore'
import { Icon } from './Icon'
import { sampleSchedule } from '../data/sampleSchedule'
import { firebaseReady } from '../lib/firebaseClient'
import { downloadIcs } from '../lib/icsExport'
import { renderScheduleImage, shareOrDownloadScheduleImage } from '../lib/scheduleImage'
import { expectedTahunAjaranForSemester } from '../lib/tahunAjaran'
import { PrintScheduleModal } from './student/PrintScheduleModal'

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
  const [printModalOpen, setPrintModalOpen] = useState(false)
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
      if (e.key === 'Escape' && open) onClose?.()
    }
    if (open) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
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
    <>
      <div
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-6 bg-black/65 backdrop-blur-xs animate-fade-in"
      >
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[92vh] tablet:max-h-[88vh] overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl animate-fade-up flex flex-col"
        >
          {/* Header Modal - Gradient Teal/Indigo Hero */}
          <header className="sticky top-0 z-20 bg-gradient-to-r from-teal-950 via-teal-800 to-indigo-950 p-4 tablet:p-5 text-white shadow-level-1 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-xs">
                  <Icon name="ios_share" size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h2 id="share-modal-title" className="text-xl tablet:text-2xl font-bold tracking-tight text-white truncate">
                      Bagikan Jadwal
                    </h2>
                    <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border border-white/25 shadow-2xs">
                      Export & Sync
                    </span>
                  </div>
                  <p className="text-body-xs text-white/80 font-medium truncate">
                    {program} · Semester {semester} · TA {ta}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup modal"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
          </header>

          <div className="p-4 tablet:p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            {/* Pilihan Cakupan */}
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-2.5">
                Pilih Cakupan
              </p>
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-2.5">
                {SCOPE_OPTIONS.map((opt) => {
                  const isSelected = scope === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setScope(opt.value)}
                      className={`flex items-start gap-3 rounded-2xl p-3.5 text-left transition-all border cursor-pointer select-none ${
                        isSelected
                          ? 'border-teal-600 bg-teal-500/10 dark:bg-teal-950/30 ring-1 ring-teal-500/30 shadow-xs'
                          : 'border-outline-variant/20 bg-surface-container-low/50 hover:bg-surface-container-low hover:border-outline-variant/40 dark:bg-surface-container/30'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          isSelected ? 'border-teal-600' : 'border-outline-variant'
                        }`}
                      >
                        {isSelected && <span className="h-2 w-2 rounded-full bg-teal-600" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-body-sm font-extrabold text-on-surface leading-tight">
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

            {/* Opsi Ekspor - 2-Column Responsive Card Grid */}
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-2.5">
                Opsi Ekspor & Integrasi
              </p>
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
                {/* Google Calendar */}
                <button
                  type="button"
                  onClick={() => downloadIcs(source, { prodi: program, semester, tahunAjaran: ta })}
                  className="group flex items-start gap-3.5 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 text-left transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:shadow-xs cursor-pointer"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shadow-2xs group-hover:scale-105 transition-transform">
                    <Icon name="event" size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-body-sm font-extrabold text-on-surface group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                      Google Calendar / HP
                    </span>
                    <span className="block text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                      Sinkron otomatis via file kalender .ics
                    </span>
                  </div>
                </button>

                {/* Salin Teks */}
                <button
                  type="button"
                  onClick={handleShareText}
                  className="group flex items-start gap-3.5 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 text-left transition-all hover:border-blue-500/40 hover:bg-blue-500/5 hover:shadow-xs cursor-pointer"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25 shadow-2xs group-hover:scale-105 transition-transform">
                    <Icon name="share" size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-body-sm font-extrabold text-on-surface group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                      Bagikan Teks
                    </span>
                    <span className="block text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                      Salin ringkasan untuk WhatsApp / Telegram
                    </span>
                  </div>
                  {copied && (
                    <span className="shrink-0 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-extrabold">
                      Tersalin!
                    </span>
                  )}
                </button>

                {/* Bagikan Gambar */}
                <button
                  type="button"
                  onClick={handleShareImage}
                  className="group flex items-start gap-3.5 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 text-left transition-all hover:border-purple-500/40 hover:bg-purple-500/5 hover:shadow-xs cursor-pointer"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25 shadow-2xs group-hover:scale-105 transition-transform">
                    <Icon name="image" size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-body-sm font-extrabold text-on-surface group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                      Bagikan Gambar (PNG)
                    </span>
                    <span className="block text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                      Simpan / kirim kartu grafis visual jadwal
                    </span>
                  </div>
                  {imageStatus && (
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                      imageStatus.ok
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-error/15 text-error border border-error/30'
                    }`}>
                      {imageStatus.text}
                    </span>
                  )}
                </button>

                {/* Cetak PDF / Kartu Saku */}
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(true)}
                  className="group flex items-start gap-3.5 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 text-left transition-all hover:border-sky-500/40 hover:bg-sky-500/5 hover:shadow-xs cursor-pointer"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/25 shadow-2xs group-hover:scale-105 transition-transform">
                    <Icon name="print" size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-body-sm font-extrabold text-on-surface group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                      Cetak PDF / Kartu Saku
                    </span>
                    <span className="block text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                      Format A4 meja belajar atau kartu saku hemat tinta
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <footer className="flex items-center justify-between p-4 border-t border-outline-variant/15 bg-surface-container-low/40 shrink-0">
            <span className="text-[11px] font-extrabold text-teal-800 dark:text-teal-300 bg-teal-500/15 border border-teal-500/25 px-2.5 py-1 rounded-xl shadow-2xs">
              {source.length} kelas akan diekspor
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-body-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </footer>
        </div>
      </div>

      <PrintScheduleModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        scheduleEntries={source}
        courses={[]}
        program={program}
        semester={semester}
        tahunAjaran={ta}
      />
    </>
  )
}
