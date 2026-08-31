import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../hooks/useApp'
import { useFirestore } from '../../hooks/useFirestore'
import { Icon } from '../../components/Icon'
import { sampleSchedule } from '../../data/sampleSchedule'
import { firebaseReady } from '../../lib/firebaseClient'
import { downloadIcs } from '../../lib/icsExport'
import { renderScheduleImage, shareOrDownloadScheduleImage } from '../../lib/scheduleImage'
import { expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'

const OPTIONS = [
  {
    value: 'all',
    label: 'Semua kelas',
    description: 'Seluruh jadwal yang terpublikasi',
  },
  {
    value: 'semester',
    label: 'Semester ini saja',
    description: 'Hanya jadwal sesuai prodi & semester aktif',
  },
]

export default function ExportShare() {
  const navigate = useNavigate()
  const { program, semester } = useApp()
  const [scope, setScope] = useState('semester')
  const [shared, setShared] = useState(false)
  const [imageStatus, setImageStatus] = useState(null) // { ok: boolean, text: string }

  // TA sesuai kalender kampus — dipakai di teks ringkasan & label ekspor.
  const ta = expectedTahunAjaranForSemester(semester)

  // Query TANPA filter semester — supaya opsi cakupan "Semua kelas"
  // benar-benar memuat semua semester prodi ini (filter semester dilakukan
  // di klien sesuai pilihan cakupan).
  const { data: jadwal } = useFirestore(
    'jadwal',
    firebaseReady
      ? [
          ['prodi', '==', program ?? ''],
          ['status', '==', 'published'],
        ]
      : [],
  )
  const { data: mataKuliah } = useFirestore('mataKuliah')

  const courseMap = useMemo(() => {
    return new Map(mataKuliah.map((c) => [c.kodeMK, c]))
  }, [mataKuliah])

  const entries = useMemo(() => {
    if (scope === 'all') return jadwal
    return jadwal.filter((e) => e.semester === Number(semester))
  }, [jadwal, scope, semester])

  // Fallback sample untuk dev tanpa Firebase.
  const source =
    entries.length > 0
      ? entries
      : !firebaseReady
        ? sampleSchedule.filter((e) => e.prodi === program && e.semester === Number(semester))
        : []

  async function handleShare() {
    const text = `Jadwal ${program} Semester ${semester} · TA ${ta} - ${source.length} kelas per minggu (dibagikan dari Jadwal Kampus)`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Jadwal Kampus', text })
      } else {
        await navigator.clipboard.writeText(text)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      }
    } catch {
      // user membatalkan share — abaikan
    }
  }

  async function handleShareImage() {
    try {
      const canvas = renderScheduleImage(source, { prodi: program, semester, tahunAjaran: ta })
      const result = await shareOrDownloadScheduleImage(
        canvas,
        `jadwal-${(program ?? 'kampus').toLowerCase().replace(/\s+/g, '-')}-sem-${semester}.png`,
      )
      setImageStatus({ ok: true, text: result === 'shared' ? 'Dibagikan!' : 'Tersimpan!' })
    } catch {
      // Jangan diam-diam: beri tahu user kalau rendering/share gagal.
      setImageStatus({ ok: false, text: 'Gagal membuat gambar' })
    }
    setTimeout(() => setImageStatus(null), 2500)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-lg">
      <header className="flex items-center gap-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
          aria-label="Kembali"
        >
          <Icon name="arrow_back" size={22} />
        </button>
        <h2 className="text-display text-on-surface">Bagikan Jadwal</h2>
      </header>

      {/* Pilihan cakupan */}
      <section className="space-y-sm">
        <p className="text-label-caps uppercase tracking-wider text-on-surface-variant">Pilih Cakupan</p>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setScope(opt.value)}
            className={`flex w-full items-center gap-md rounded-2xl bg-surface-container-lowest p-md text-left transition-colors dark:bg-surface-container-low ${
              scope === opt.value ? 'border-2 border-primary' : 'border-2 border-transparent shadow-level-1'
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-title-md text-on-surface">{opt.label}</p>
              <p className="text-body-sm text-on-surface-variant">
                {opt.description}
              </p>
            </div>
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                scope === opt.value ? 'border-primary' : 'border-outline-variant'
              }`}
            >
              {scope === opt.value && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
            </span>
          </button>
        ))}
      </section>

      {/* Opsi export */}
      <section className="space-y-sm">
        <p className="text-label-caps uppercase tracking-wider text-on-surface-variant">Opsi Ekspor</p>
        <OptionCard
          icon="event"
          iconBg="bg-primary/10 text-primary"
          title="Kalender Smartphone (.ics)"
          description="Google Calendar, Apple iCal, Outlook (dengan Alarm Otomatis)"
          status={null}
          onAction={() =>
            downloadIcs(source, {
              prodi: program,
              semester,
              tahunAjaran: ta,
              courseMap,
            })
          }
        />
        <OptionCard
          icon="share"
          iconBg="bg-tertiary-container/40 text-tertiary"
          title="Bagikan Teks"
          description="Salin ringkasan ke clipboard"
          status={shared ? 'Tersalin!' : null}
          onAction={handleShare}
        />
        <OptionCard
          icon="image"
          iconBg="bg-error-container/60 text-error dark:bg-error-container/30"
          title="Bagikan Gambar"
          description="Simpan/kirim jadwal sebagai PNG"
          status={imageStatus?.text ?? null}
          statusOk={imageStatus?.ok ?? true}
          onAction={handleShareImage}
        />
      </section>

      <p className="text-center">
        <span className="rounded-full bg-surface-container px-3 py-1.5 text-body-sm text-on-surface-variant dark:bg-surface-container-high">
          {source.length} kelas akan diekspor
        </span>
      </p>
    </div>
  )
}

function OptionCard({ icon, iconBg, title, description, status, statusOk = true, onAction }) {
  return (
    <button
      type="button"
      onClick={onAction}
      className="flex w-full items-center gap-md rounded-2xl bg-surface-container-lowest p-md border border-outline-variant/15 text-left transition-colors hover:bg-surface-container-low dark:bg-surface-container-low"
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
        <Icon name={icon} size={24} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-title-md text-on-surface">{title}</span>
        <span className="block text-body-sm text-on-surface-variant">{description}</span>
      </span>
      {status ? (
        <span
          className={`shrink-0 text-label-caps font-medium ${statusOk ? 'text-success' : 'text-error'}`}
        >
          {status}
        </span>
      ) : (
        <Icon name="chevron_right" size={22} className="shrink-0 text-on-surface-variant" />
      )}
    </button>
  )
}
