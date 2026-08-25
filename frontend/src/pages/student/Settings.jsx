import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'
import { useApp } from '../../hooks/useApp'
import { useTasks } from '../../hooks/useTasks'
import { useFirestore } from '../../hooks/useFirestore'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/Button'
import { sampleSchedule } from '../../data/sampleSchedule'
import { firebaseReady } from '../../lib/firebaseClient'
import { expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'

const FONT_SIZES = [
  { value: 'sm', label: 'Kecil' },
  { value: 'md', label: 'Sedang' },
  { value: 'lg', label: 'Besar' },
  { value: 'xl', label: 'Sangat Besar' },
]

const REMINDER_ITEMS = [
  {
    key: 'kelas',
    label: 'Pengingat Kelas',
    description: 'Notifikasi 15 menit sebelum kelas dimulai.',
  },
  {
    key: 'ujian',
    label: 'Pengingat Ujian',
    description: 'Pengingat ujian hingga 3 hari ke depan.',
  },
  {
    key: 'tugas',
    label: 'Pengingat Tugas',
    description: 'Peringatan tenggat tugas H-1 dan hari-H.',
  },
]

const LEGEND = [
  { code: 'K1', label: 'Kelas Offline', dot: 'bg-status-offline' },
  { code: 'K2', label: 'Kelas Online', dot: 'bg-status-online' },
  { code: 'HB', label: 'Hybrid', dot: 'bg-status-hybrid' },
  { code: 'GBK', label: 'Kelas Gabungan', dot: 'bg-status-combined' },
]

export default function Settings() {
  const navigate = useNavigate()
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    program,
    semester,
  } = useApp()
  const { tasks } = useTasks()

  // TA sesuai kalender kampus (tahunAjaran.js) — semester ganjil saat
  // libur Jul–Sep sudah mengarah ke TA berikutnya.
  const taLabel = semester ? expectedTahunAjaranForSemester(semester) : null

  const { data: jadwal } = useFirestore(
    'jadwal',
    firebaseReady
      ? [
          ['prodi', '==', program ?? ''],
          ['semester', '==', Number(semester) || 0],
          ['status', '==', 'published'],
        ]
      : [],
  )

  // Metadata global (dokumen "app" di koleksi settings) — untuk banner
  // "Terakhir diperbarui oleh Admin".
  const { data: settingsDocs } = useFirestore('settings', [])
  const appSettings = useMemo(
    () => settingsDocs.find((d) => d.id === 'app') ?? null,
    [settingsDocs],
  )

  const stats = useMemo(() => {
    const source = firebaseReady && jadwal.length > 0 ? jadwal : sampleSchedule
    const mine = source.filter(
      (e) => e.prodi === program && e.semester === Number(semester),
    )
    const sksSet = new Set(mine.map((e) => e.kodeMK))
    return {
      totalSks: sksSet.size * 3, // aproksimasi: 3 SKS per MK unik
      totalKelas: mine.length,
      tugasSelesai: tasks.filter((t) => t.selesai).length,
    }
  }, [jadwal, program, semester, tasks])

  return (
    <div className="mx-auto max-w-2xl space-y-lg">
      <header>
        <h2 className="text-display text-on-surface">Pengaturan</h2>
      </header>

      {/* Prodi & semester saat ini */}
      <section className="rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low">
        <div className="flex items-center justify-between gap-md">
          <div>
            <p className="text-label-caps text-on-surface-variant">SETELAN SAAT INI</p>
            <p className="mt-1 text-title-md text-on-surface">
              {program ?? 'Belum dipilih'} · Semester {semester ?? '-'}
              {taLabel ? ` · TA ${taLabel}` : ''}
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/onboarding/prodi')}>
            Ganti
          </Button>
        </div>
      </section>

      {/* Info sistem: terakhir diperbarui admin */}
      <section className="flex items-center gap-md rounded-schedule border border-surface-variant bg-surface-container-low p-md">
        <Icon name="info" size={24} className="shrink-0 text-secondary" />
        <div className="min-w-0">
          <p className="text-body-sm text-on-surface-variant">
            Terakhir diperbarui oleh Admin:
          </p>
          <p className="text-title-md text-on-surface">
            {formatLastUpdated(appSettings)}
          </p>
        </div>
      </section>

      {/* Statistik */}
      <section className="grid grid-cols-3 gap-sm">
        <StatCard icon="menu_book" value={stats.totalSks} label="SKS semester ini" tone="primary" />
        <StatCard icon="calendar_month" value={stats.totalKelas} label="Kelas / minggu" tone="info" />
        <StatCard icon="task_alt" value={stats.tugasSelesai} label="Tugas selesai" tone="success" />
      </section>

      {/* Pengingat */}
      <SettingsSection title="Pengingat" icon="notifications_active">
        <p className="text-body-sm text-on-surface-variant">
          Pengingat muncul di dalam aplikasi (in-app) saat aplikasi terbuka.
        </p>
        <ul className="mt-sm divide-y divide-surface-variant">
          {REMINDER_ITEMS.map((item) => (
            <ReminderToggle
              key={item.key}
              prefKey={item.key}
              label={item.label}
              description={item.description}
            />
          ))}
        </ul>
      </SettingsSection>

      {/* Tampilan */}
      <SettingsSection title="Tampilan" icon="dark_mode">
        <div className="flex items-center justify-between py-sm">
          <span className="text-body-lg text-on-surface">Mode gelap</span>
          <div className="flex rounded-full bg-surface-container p-1 dark:bg-surface-container-high">
            {[
              { value: 'light', icon: 'light_mode', label: 'Terang' },
              { value: 'dark', icon: 'dark_mode', label: 'Gelap' },
              { value: 'system', icon: 'settings_brightness', label: 'Sistem' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                title={`Tema ${opt.label}`}
                aria-label={`Tema ${opt.label}`}
                className={`flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
                  theme === opt.value
                    ? 'bg-primary text-on-primary shadow-level-1'
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                }`}
              >
                <Icon name={opt.icon} size={18} />
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-surface-variant py-sm">
          <p className="mb-sm text-body-lg text-on-surface">Ukuran font</p>
          <div className="flex rounded-full bg-surface-container p-1 dark:bg-surface-container-high">
            {FONT_SIZES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFontSize(opt.value)}
                className={`flex-1 rounded-full py-1 text-body-sm font-medium transition-all duration-200 active:scale-95 ${
                  fontSize === opt.value
                    ? 'bg-primary text-on-primary shadow-level-1'
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-surface-variant py-sm">
          <div>
            <p className="text-body-lg text-on-surface">Kontras tinggi</p>
            <p className="text-body-sm text-on-surface-variant">
              Perkuat kontras teks & border
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={highContrast}
            onClick={() => setHighContrast(!highContrast)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              highContrast ? 'bg-primary' : 'bg-surface-variant'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                highContrast ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </SettingsSection>

      {/* Legend warna */}
      <SettingsSection title="Keterangan Warna Kelas" icon="palette">
        <ul className="grid grid-cols-2 gap-sm">
          {LEGEND.map((item) => (
            <li key={item.code} className="flex items-center gap-sm text-body-sm text-on-surface">
              <span className={`h-3 w-3 rounded-full ${item.dot}`} />
              <span className="font-semibold">{item.code}</span> {item.label}
            </li>
          ))}
        </ul>
      </SettingsSection>

      <div className="border border-outline-variant/10 rounded-2xl bg-surface-container-lowest p-0.5 shadow-sm group hover:scale-[1.002] transition-all">
        <button
          type="button"
          onClick={() => navigate('/riwayat')}
          className="flex w-full items-center justify-between px-4 py-3 bg-primary/5 rounded-[14px] text-body-lg text-primary group-hover:bg-primary/10 transition-colors font-semibold"
        >
          Riwayat Perubahan Jadwal
          <Icon name="chevron_right" size={20} />
        </button>
      </div>

      <div className="border border-outline-variant/10 rounded-2xl bg-surface-container-lowest p-0.5 shadow-sm group hover:scale-[1.002] transition-all">
        <button
          type="button"
          onClick={() => navigate('/tentang')}
          className="flex w-full items-center justify-between px-4 py-3 bg-surface-container rounded-[14px] text-body-lg text-on-surface hover:bg-surface-container-high transition-colors font-semibold"
        >
          Tentang & Bantuan
          <Icon name="chevron_right" size={20} className="text-on-surface-variant" />
        </button>
      </div>

      <div className="border border-outline-variant/10 rounded-2xl bg-surface-container-lowest p-0.5 shadow-sm group hover:scale-[1.002] transition-all">
        <button
          type="button"
          onClick={() => navigate('/admin/login')}
          className="flex w-full items-center justify-between px-4 py-3 bg-surface-container-low rounded-[14px] text-body-lg text-on-surface-variant hover:bg-surface-container dark:bg-surface-container-low transition-all font-semibold"
        >
          <span className="flex items-center gap-sm">
            <Icon name="admin_panel_settings" size={20} />
            Panel Admin
          </span>
          <Icon name="chevron_right" size={20} />
        </button>
      </div>
    </div>
  )
}

function formatLastUpdated(settings) {
  const iso = settings?.lastPublishedAt ?? settings?.lastUploadedAt
  if (!iso) return 'Belum ada pembaruan'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Belum ada pembaruan'
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function ReminderToggle({ prefKey, label, description }) {
  const [prefs, setPrefs] = useState(() => getItem(STORAGE_KEYS.reminderPrefs, {}))
  const enabled = prefs[prefKey] ?? true

  function handleToggle() {
    // Hitung nilai berikutnya di luar updater — updater harus murni
    // (StrictMode bisa memanggilnya dua kali).
    const next = { ...prefs, [prefKey]: !(prefs[prefKey] ?? true) }
    setItem(STORAGE_KEYS.reminderPrefs, next)
    setPrefs(next)
  }

  return (
    <li className="flex items-center justify-between gap-md py-sm">
      <div className="min-w-0">
        <p className="text-body-lg text-on-surface">{label}</p>
        <p className="text-body-sm text-on-surface-variant">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={handleToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          enabled ? 'bg-primary' : 'bg-surface-variant'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            enabled ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </li>
  )
}

function SettingsSection({ title, icon, children }) {
  return (
    <section className="rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low">
      <h3 className="mb-sm flex items-center gap-sm text-title-md text-on-surface">
        <Icon name={icon} size={20} className="text-primary" />
        {title}
      </h3>
      {children}
    </section>
  )
}

const STAT_TONES = {
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  info: { bg: 'bg-info-container/60 dark:bg-info-container/30', text: 'text-info' },
  success: { bg: 'bg-success-container/60 dark:bg-success-container/30', text: 'text-success' },
}

function StatCard({ icon, value, label, tone = 'primary' }) {
  const t = STAT_TONES[tone] ?? STAT_TONES.primary
  return (
    <div className="flex flex-col items-center rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-4 text-center shadow-sm transition-all duration-200 hover:scale-[1.005] hover:shadow-md dark:bg-surface-container-low">
      <span className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${t.bg}`}>
        <Icon name={icon} size={22} className={t.text} />
      </span>
      <span className="text-[20px] font-bold text-on-surface">{value}</span>
      <span className="text-[11px] text-on-surface-variant font-medium mt-1 leading-tight">{label}</span>
    </div>
  )
}
