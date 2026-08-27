import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'
import { useApp } from '../../hooks/useApp'
import { useFirestore } from '../../hooks/useFirestore'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/Button'
import { expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'
import { sendBrowserNotification, playNotificationChime } from '../../lib/notificationEngine'
import { FeatureDocsModal } from '../../components/student/FeatureDocsModal'

const FONT_SIZES = [
  { value: 'sm', label: 'Kecil' },
  { value: 'md', label: 'Sedang' },
  { value: 'lg', label: 'Besar' },
  { value: 'xl', label: 'Sangat Besar' },
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

  const [showDocsModal, setShowDocsModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  // TA sesuai kalender kampus (tahunAjaran.js)
  const taLabel = semester ? expectedTahunAjaranForSemester(semester) : null

  // Metadata global settings
  const { data: settingsDocs } = useFirestore('settings', [])
  const appSettings = useMemo(
    () => settingsDocs.find((d) => d.id === 'app') ?? null,
    [settingsDocs],
  )

  function handleManualSync() {
    setIsSyncing(true)
    setSyncMessage('')
    setTimeout(() => {
      setIsSyncing(false)
      setSyncMessage('Data berhasil disinkronkan!')
      setTimeout(() => setSyncMessage(''), 3000)
    }, 800)
  }

  function handleClearCache() {
    if (window.confirm('Reset cache lokal aplikasi? Data jadwal akan dimuat ulang dari server.')) {
      window.location.reload()
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header Halaman — Bold Title + Top Right Action Buttons */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Icon name="settings" size={26} />
          </div>
          <div>
            <h2 className="text-2xl tablet:text-3xl font-bold tracking-tight text-on-surface">
              Pengaturan
            </h2>
            <p className="mt-0.5 text-body-sm text-on-surface-variant font-normal">
              Kelola preferensi program studi, tema visual, dan integrasi kalender.
            </p>
          </div>
        </div>

        {/* Action Buttons in Header: Tutorial, Riwayat & Bantuan */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowDocsModal(true)}
            title="Buka Pusat Panduan & Tutorial 19 Fitur Lengkap"
            className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2.5 text-body-sm font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Icon name="menu_book" size={19} className="text-primary" />
            <span>Tutorial 19 Fitur</span>
          </button>
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            title="Buka Riwayat Perubahan Jadwal"
            className="flex items-center gap-2 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-2.5 text-body-sm font-bold text-on-surface shadow-level-1 transition-all hover:bg-surface-container-high hover:scale-[1.02] cursor-pointer dark:bg-surface-container-low"
          >
            <Icon name="history" size={19} className="text-primary" />
            <span>Riwayat</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAboutModal(true)}
            title="Buka Tentang & Bantuan (FAQ)"
            className="flex items-center gap-2 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-2.5 text-body-sm font-bold text-on-surface shadow-level-1 transition-all hover:bg-surface-container-high hover:scale-[1.02] cursor-pointer dark:bg-surface-container-low"
          >
            <Icon name="help_outline" size={19} className="text-secondary" />
            <span>Tentang & FAQ</span>
          </button>
        </div>
      </header>

      {/* ── HERO BANNER: PUSAT PANDUAN & DOKUMENTASI 19 FITUR ── */}
      <div className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 dark:from-primary/15 dark:to-surface-container-high p-5 tablet:p-6 shadow-level-1 flex flex-col tablet:flex-row items-start tablet:items-center justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-xs">
            <Icon name="auto_stories" size={26} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-title-md font-bold text-on-surface">Pusat Panduan & Tutorial Seluruh Fitur</h3>
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-extrabold text-primary uppercase tracking-wide border border-primary/30">
                19 Fitur Lengkap
              </span>
            </div>
            <p className="text-body-xs text-on-surface-variant mt-1 leading-relaxed max-w-2xl">
              Bingung dengan fitur yang ada? Buka dokumentasi interaktif langkah demi langkah: simulator KRS, notifikasi alarm chime, ekspor kalender HP (.ics), poster gambar WA, peta lokasi ruangan, kalkulator presensi, hingga backup & restore database.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDocsModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-on-primary hover:brightness-105 active:scale-95 text-body-sm font-bold shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap ml-auto tablet:ml-0"
        >
          <Icon name="explore" size={18} />
          <span>Buka Panduan Tutorial</span>
        </button>
      </div>

      {/* Main 2x2 Symmetrical Grid Layout — Generous & Perfectly Aligned */}
      <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6 items-stretch">
        {/* ROW 1 - LEFT: Setelan Saat Ini */}
        <section className="flex flex-col justify-between rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 tablet:p-7 shadow-level-1 dark:bg-surface-container-low">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">
                SETELAN SAAT INI
              </p>
              <h3 className="mt-1 text-title-lg font-bold text-on-surface leading-snug">
                {program ?? 'Belum dipilih'} · Semester {semester ?? '-'}
              </h3>
              {taLabel && (
                <span className="inline-block mt-1.5 text-body-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  Tahun Ajaran {taLabel}
                </span>
              )}
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate('/onboarding/prodi')}
              className="shrink-0 px-4 py-2 text-body-sm font-bold shadow-xs cursor-pointer rounded-2xl"
            >
              Ganti
            </Button>
          </div>

          {/* Subteks Status Terakhir Diperbarui Admin & Badge Offline PWA */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5 border-t border-outline-variant/15 pt-4 text-body-xs text-on-surface-variant font-medium">
            <div className="flex items-center gap-2">
              <Icon name="history_toggle_off" size={16} className="text-secondary shrink-0" />
              <span>
                Update: <strong className="text-on-surface font-semibold">{formatLastUpdated(appSettings)}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-body-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/15 px-3 py-0.5 rounded-full border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Offline PWA Aktif</span>
            </div>
          </div>
        </section>

        {/* ROW 1 - RIGHT: Tampilan */}
        <section className="flex flex-col justify-between rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 tablet:p-7 shadow-level-1 dark:bg-surface-container-low">
          <h3 className="mb-3 flex items-center gap-2.5 text-title-sm font-bold text-on-surface">
            <Icon name="dark_mode" size={20} className="text-primary" />
            Tampilan
          </h3>
          <div className="space-y-4 pt-0.5">
            {/* Mode Gelap */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-body-sm font-bold text-on-surface">Mode Gelap</span>
                <p className="text-body-xs text-on-surface-variant">Pilih tema visual aplikasi</p>
              </div>
              <div className="flex rounded-full bg-surface-container-high/60 p-1 border border-outline-variant/25 shadow-xs">
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
                    className={`flex h-8 w-11 items-center justify-center rounded-full transition-all duration-200 cursor-pointer active:scale-95 ${
                      theme === opt.value
                        ? 'bg-surface text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Icon name={opt.icon} size={18} />
                  </button>
                ))}
              </div>
            </div>

            {/* Ukuran Font */}
            <div className="border-t border-outline-variant/15 pt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-body-sm font-bold text-on-surface">Ukuran Font</span>
                <span className="text-body-xs font-semibold text-primary capitalize">{fontSize}</span>
              </div>
              <div className="flex rounded-full bg-surface-container-high/60 p-1 border border-outline-variant/25 shadow-xs">
                {FONT_SIZES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFontSize(opt.value)}
                    className={`flex-1 rounded-full py-1.5 text-body-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                      fontSize === opt.value
                        ? 'bg-surface text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kontras Tinggi */}
            <div className="flex items-center justify-between border-t border-outline-variant/15 pt-3">
              <div>
                <p className="text-body-sm font-bold text-on-surface">Kontras Tinggi</p>
                <p className="text-body-xs text-on-surface-variant">
                  Perkuat kontras teks dan garis pembatas
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={highContrast}
                onClick={() => setHighContrast(!highContrast)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                  highContrast ? 'bg-primary' : 'bg-surface-variant'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all shadow-xs ${
                    highContrast ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* ROW 2 - LEFT: Keterangan Warna Kelas & Sinkronisasi */}
        <section className="flex flex-col justify-between rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 tablet:p-7 shadow-level-1 dark:bg-surface-container-low">
          <div>
            <h3 className="mb-2.5 flex items-center gap-2.5 text-title-sm font-bold text-on-surface">
              <Icon name="palette" size={20} className="text-primary" />
              Keterangan Warna Kelas
            </h3>
            <p className="text-body-xs text-on-surface-variant font-medium mb-3">
              Identifikasi jenis format perkuliahan pada jadwal mingguan:
            </p>
            <ul className="grid grid-cols-2 gap-3">
              {LEGEND.map((item) => (
                <li
                  key={item.code}
                  className="flex items-center gap-3 rounded-2xl bg-surface-container-low/50 dark:bg-surface-container-high/40 p-3 border border-outline-variant/20 shadow-xs"
                >
                  <span className={`h-3 w-3 rounded-full shrink-0 ${item.dot}`} />
                  <div className="min-w-0">
                    <span className="block font-bold text-body-sm text-on-surface">{item.code}</span>
                    <span className="text-body-xs text-on-surface-variant font-medium truncate block">{item.label}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Sync & Cache Actions */}
          <div className="border-t border-outline-variant/15 pt-4 mt-4">
            <div className="flex items-center justify-between text-body-xs text-on-surface-variant mb-2.5">
              <span>Cloud Firestore:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {syncMessage || 'Tersinkronisasi'}
              </span>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary py-2 text-body-sm font-bold transition-all active:scale-95 cursor-pointer border border-primary/20 disabled:opacity-50"
              >
                <Icon name={isSyncing ? "sync" : "refresh"} size={16} className={isSyncing ? "animate-spin" : ""} />
                <span>{isSyncing ? "Menyinkronkan..." : "Sinkronkan Data"}</span>
              </button>
              <button
                type="button"
                onClick={handleClearCache}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-surface-container-high/60 hover:bg-error/10 hover:text-error hover:border-error/20 text-on-surface-variant px-3.5 py-2 text-body-sm font-semibold transition-all active:scale-95 cursor-pointer border border-outline-variant/20"
                title="Reset cache lokal aplikasi"
              >
                <Icon name="delete_outline" size={16} />
                <span>Reset Cache</span>
              </button>
            </div>
          </div>
        </section>

        {/* ROW 2 - RIGHT: Pengingat & Notifikasi Web Push */}
        <section className="flex flex-col justify-between rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 tablet:p-7 shadow-level-1 dark:bg-surface-container-low">
          <NotificationSettingsSection navigate={navigate} />
        </section>
      </div>

      {/* Modals */}
      <FeatureDocsModal isOpen={showDocsModal} onClose={() => setShowDocsModal(false)} />
      {showHistoryModal && <HistoryModal onClose={() => setShowHistoryModal(false)} />}
      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
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

function NotificationSettingsSection({ navigate }) {
  const [prefs, setPrefs] = useState(() => ({
    kelas: true,
    ujian: true,
    tugas: true,
    nativePush: false,
    classWindow: 15,
    sound: true,
    ...getItem(STORAGE_KEYS.reminderPrefs, {}),
  }))

  const [permission, setPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'unsupported'
  })

  const [testSent, setTestSent] = useState(false)

  function updatePref(key, value) {
    const next = { ...prefs, [key]: value }
    setItem(STORAGE_KEYS.reminderPrefs, next)
    setPrefs(next)
  }

  async function requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser Anda tidak mendukung Web Notification API.')
      return
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'granted') {
        updatePref('nativePush', true)
        playNotificationChime()
        sendBrowserNotification('🔔 Notifikasi JadwalKu Aktif!', {
          body: 'Anda akan menerima pengingat otomatis sebelum kelas dimulai dan menjelang batas tugas.',
        })
      }
    } catch (err) {
      console.error('Request permission error:', err)
    }
  }

  function handleTestNotification() {
    if (prefs.sound) {
      playNotificationChime()
    }
    sendBrowserNotification('🧪 Uji Coba Pengingat JadwalKu', {
      body: `Pengingat kelas ${prefs.classWindow} menit sebelum jam kuliah berjalan dengan normal!`,
    })
    setTestSent(true)
    setTimeout(() => setTestSent(false), 2500)
  }

  const CLASS_WINDOW_OPTIONS = [10, 15, 30, 45, 60]

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <h3 className="flex items-center gap-2.5 text-title-sm font-bold text-on-surface">
            <Icon name="notifications_active" size={20} className="text-primary" />
            <span>Pengingat & Web Push</span>
          </h3>

          {/* Browser Permission Badge */}
          {permission === 'granted' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 px-2.5 py-0.5 text-[10.5px] font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Browser Aktif</span>
            </span>
          ) : permission === 'denied' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-error/15 text-error border border-error/25 px-2.5 py-0.5 text-[10.5px] font-bold">
              <Icon name="block" size={12} />
              <span>Diblokir</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25 px-2.5 py-0.5 text-[10.5px] font-bold">
              <Icon name="info" size={12} />
              <span>Belum Aktif</span>
            </span>
          )}
        </div>

        {/* Browser Permission Request Strip */}
        {permission !== 'granted' && permission !== 'unsupported' && (
          <div className="mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-body-xs font-bold text-amber-900 dark:text-amber-200">
                Izinkan Pop-up Notifikasi Browser
              </p>
              <p className="text-[11px] text-on-surface-variant">
                Terima pengingat kelas & tugas langsung di layar komputer atau HP
              </p>
            </div>
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-[11px] font-bold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            >
              Izinkan Notifikasi
            </button>
          </div>
        )}

        {/* Waktu Pengingat Kelas Selector */}
        <div className="rounded-2xl bg-surface-container-low/50 dark:bg-surface-container-high/40 p-3 border border-outline-variant/20 mb-3 space-y-2">
          <div className="flex items-center justify-between text-body-xs">
            <span className="font-bold text-on-surface flex items-center gap-1.5">
              <Icon name="schedule" size={15} className="text-primary" />
              <span>Waktu Pengingat Kelas</span>
            </span>
            <span className="font-extrabold text-primary">{prefs.classWindow} Menit Sebelum</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {CLASS_WINDOW_OPTIONS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => updatePref('classWindow', mins)}
                className={`px-2.5 py-1 rounded-xl text-body-xs font-bold transition-all cursor-pointer ${
                  prefs.classWindow === mins
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {mins} Mnt
              </button>
            ))}
          </div>
        </div>

        {/* Reminder Module Toggles */}
        <ul className="divide-y divide-outline-variant/15 text-body-sm">
          {/* Kelas Toggle */}
          <li className="flex items-center justify-between gap-3 py-2.5">
            <div>
              <p className="font-bold text-on-surface">Pengingat Jadwal Kuliah</p>
              <p className="text-body-xs text-on-surface-variant">Alarm waktu sebelum sesi kelas dimulai</p>
            </div>
            <ToggleSwitch checked={prefs.kelas} onChange={(v) => updatePref('kelas', v)} />
          </li>

          {/* Tugas Toggle */}
          <li className="flex items-center justify-between gap-3 py-2.5">
            <div>
              <p className="font-bold text-on-surface">Pengingat Deadline Tugas</p>
              <p className="text-body-xs text-on-surface-variant">Peringatan tenggat tugas H-1 & Hari-H</p>
            </div>
            <ToggleSwitch checked={prefs.tugas} onChange={(v) => updatePref('tugas', v)} />
          </li>

          {/* Ujian Toggle */}
          <li className="flex items-center justify-between gap-3 py-2.5">
            <div>
              <p className="font-bold text-on-surface">Pengingat Ujian Semester</p>
              <p className="text-body-xs text-on-surface-variant">Peringatan jadwal UTS dan UAS H-3 hari</p>
            </div>
            <ToggleSwitch checked={prefs.ujian} onChange={(v) => updatePref('ujian', v)} />
          </li>

          {/* Sound Alarm Toggle */}
          <li className="flex items-center justify-between gap-3 py-2.5">
            <div>
              <p className="font-bold text-on-surface flex items-center gap-1.5">
                <Icon name="volume_up" size={16} className="text-secondary" />
                <span>Bunyi Nada Pengingat (Audio Chime)</span>
              </p>
              <p className="text-body-xs text-on-surface-variant">Mainkan nada lembut saat notifikasi masuk</p>
            </div>
            <ToggleSwitch checked={prefs.sound} onChange={(v) => updatePref('sound', v)} />
          </li>
        </ul>
      </div>

      {/* Test Notification & Calendar CTA */}
      <div className="border-t border-outline-variant/15 pt-3.5 space-y-3">
        {permission === 'granted' && (
          <button
            type="button"
            onClick={handleTestNotification}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface py-2 text-body-xs font-bold transition-all border border-outline-variant/25 cursor-pointer shadow-2xs"
          >
            <Icon name={testSent ? 'check' : 'notifications'} size={15} className="text-primary" />
            <span>{testSent ? 'Notifikasi Terkirim!' : '🧪 Uji Coba Notifikasi Browser'}</span>
          </button>
        )}

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-body-sm font-bold text-on-surface">Integrasi Kalender</p>
            <p className="text-body-xs text-on-surface-variant">Ekspor jadwal ke Google / Apple Calendar</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate('/bagikan')}
            className="shrink-0 px-4 py-2 text-body-sm font-bold rounded-2xl cursor-pointer"
          >
            <Icon name="event" size={16} className="mr-1.5 text-secondary" />
            Ekspor .ics
          </Button>
        </div>
      </div>
    </div>
  )
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
        checked ? 'bg-primary' : 'bg-surface-variant'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all shadow-xs ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}



const HISTORY_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'jadwal', label: 'Jadwal Kuliah' },
  { value: 'ujian', label: 'Jadwal Ujian' },
  { value: 'mataKuliah', label: 'Mata Kuliah' },
]

function HistoryModal({ onClose }) {
  const [filter, setFilter] = useState('all')
  const { data: riwayat, loading } = useFirestore('riwayat')

  const filtered = useMemo(
    () =>
      [...riwayat]
        .filter((r) => filter === 'all' || r.entitas === filter)
        .sort((a, b) => (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0)),
    [riwayat, filter],
  )

  const grouped = useMemo(() => {
    const groups = new Map()
    for (const entry of filtered) {
      const ts = entry.timestamp?.toDate ? entry.timestamp.toDate() : null
      const label = ts
        ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(ts)
        : 'Tanpa tanggal'
      if (!groups.has(label)) groups.set(label, [])
      groups.get(label).push(entry)
    }
    return [...groups.entries()]
  }, [filtered])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} role="presentation" />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-level-3 dark:bg-surface-container-low animate-fade-up overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/15 p-5 tablet:p-6 bg-surface-container-lowest/90 dark:bg-surface-container-low/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Icon name="history" size={22} />
            </div>
            <div>
              <h3 className="text-title-md font-bold text-on-surface">Riwayat Perubahan Jadwal</h3>
              <p className="text-body-xs text-on-surface-variant">Log aktivitas sinkronisasi dan update dari akademik</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-4 border-b border-outline-variant/10 bg-surface-container-low/30 no-scrollbar">
          {HISTORY_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`shrink-0 rounded-full px-3.5 py-1 text-body-xs font-bold transition-all cursor-pointer ${
                filter === f.value
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 tablet:p-6 space-y-5">
          {loading ? (
            <div className="space-y-3">
              <div className="h-16 rounded-2xl bg-surface-container-high/50 animate-pulse" />
              <div className="h-16 rounded-2xl bg-surface-container-high/50 animate-pulse" />
            </div>
          ) : grouped.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-outline-variant/30 p-8 text-center bg-surface-container-low/30">
              <Icon name="history_toggle_off" size={32} className="mx-auto mb-2 text-on-surface-variant/70" />
              <p className="text-body-sm font-bold text-on-surface">Belum ada riwayat perubahan</p>
              <p className="text-body-xs text-on-surface-variant mt-1">Perubahan data jadwal atau ujian oleh admin akan tercatat otomatis di sini.</p>
            </div>
          ) : (
            grouped.map(([dateLabel, entries]) => (
              <section key={dateLabel} className="space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80 border-b border-outline-variant/15 pb-1">
                  {dateLabel}
                </h4>
                <div className="space-y-2">
                  {entries.map((entry) => {
                    const ent = String(entry.entitas ?? '').toLowerCase()
                    const accent = ent.includes('hapus')
                      ? 'bg-error'
                      : ent.includes('jadwal')
                        ? 'bg-primary'
                        : 'bg-secondary'
                    return (
                      <div
                        key={entry.id}
                        className="flex gap-3 overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-low/40 dark:bg-surface-container-high/30 p-3.5 shadow-xs"
                      >
                        <div className={`w-1 shrink-0 rounded-full ${accent}`} />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-md bg-surface-container-highest px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                              {entry.entitas ?? 'perubahan'}
                            </span>
                            <span className="text-[11px] text-on-surface-variant font-medium">{entry.field ?? ''}</span>
                          </div>
                          <p className="text-body-sm font-bold text-on-surface leading-snug">
                            {entry.detail ?? `${entry.entitas}: ${entry.field} diperbarui`}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-on-surface-variant">
                            {entry.nilaiLama != null && (
                              <>
                                <span className="line-through text-outline opacity-75">{String(entry.nilaiLama)}</span>
                                <Icon name="arrow_forward" size={12} className="text-outline" />
                              </>
                            )}
                            {entry.nilaiBaru != null && (
                              <span className="font-bold text-primary">{String(entry.nilaiBaru)}</span>
                            )}
                            {entry.aktor && (
                              <span className="ml-auto text-[10px] text-on-surface-variant font-medium opacity-80">
                                oleh {entry.aktor}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-outline-variant/15 p-4 flex justify-end bg-surface-container-lowest/90 dark:bg-surface-container-low/90">
          <Button onClick={onClose} className="px-5 py-2 text-body-sm font-bold rounded-full">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}

const FAQS = [
  {
    icon: 'sync',
    q: 'Kenapa jadwal perkuliahan belum update?',
    a: 'Jadwal akan diperbarui secara otomatis setelah administrator kampus mempublikasikan berkas jadwal baru. Pastikan perangkat Anda terhubung ke internet saat membuka aplikasi untuk mengunduh versi terbaru.',
  },
  {
    icon: 'tune',
    q: 'Bagaimana cara mengganti program studi atau semester?',
    a: 'Buka menu Pengaturan, lalu klik tombol "Ganti" pada kartu profil akademik di bagian atas. Pilihan program studi dan semester akan langsung disimpan di perangkat ini.',
  },
  {
    icon: 'notifications_active',
    q: 'Bagaimana cara kerja pengingat kelas?',
    a: 'Aplikasi menyediakan pengingat in-app untuk jadwal kelas aktif Anda. Anda juga dapat mengekspor seluruh jadwal ke Google Calendar atau Apple Calendar melalui menu Bagikan Jadwal.',
  },
  {
    icon: 'wifi_off',
    q: 'Apakah aplikasi bisa dibuka tanpa koneksi internet?',
    a: 'Ya, 100% bisa! JadwalKu menggunakan arsitektur Offline-First & Progressive Web App (PWA). Seluruh jadwal, ujian, catatan, dan tugas yang pernah dimuat tersimpan aman di penyimpanan lokal perangkat Anda.',
  },
  {
    icon: 'ios_share',
    q: 'Bagaimana cara membagikan jadwal ke teman atau grup?',
    a: 'Tekan tombol Bagikan Jadwal di menu samping. Anda dapat menyalin ringkasan teks untuk WhatsApp/Telegram, menyimpan kartu gambar PNG, atau mengunduh berkas kalender .ics.',
  },
]

function AboutModal({ onClose }) {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} role="presentation" />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-level-3 dark:bg-surface-container-low animate-fade-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/15 p-5 tablet:p-6 bg-surface-container-lowest/90 dark:bg-surface-container-low/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/15 text-secondary border border-secondary/20">
              <Icon name="help_outline" size={22} />
            </div>
            <div>
              <h3 className="text-title-md font-bold text-on-surface">Tentang & Bantuan</h3>
              <p className="text-body-xs text-on-surface-variant">Panduan penggunaan, fitur sistem, & tanya jawab (FAQ)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 tablet:p-6 space-y-6">
          {/* Brand Card */}
          <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low/50 dark:bg-surface-container-high/40 p-6 text-center">
            <h4 className="text-2xl font-bold font-brand tracking-[-0.025em] text-on-surface">
              <span>Jadwal</span>
              <span className="text-primary">Ku</span>
            </h4>
            <p className="font-brand mt-0.5 text-[10.5px] font-bold tracking-[0.09em] uppercase text-primary">
              SCHEDULE SMARTER · CAMPUS TIMETABLE
            </p>
            <p className="mt-2 text-body-xs text-on-surface-variant max-w-sm mx-auto">
              Aplikasi jadwal perkuliahan, ujian, dan manajemen tugas akademik modern Universitas.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-3 py-1 text-[10px] font-bold text-on-surface-variant">
              <span>Versi 1.3.0 PWA</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400">Offline Ready</span>
            </div>
          </div>

          {/* Accordion FAQ */}
          <div>
            <h4 className="text-title-sm font-bold text-on-surface mb-3 flex items-center gap-2">
              <Icon name="help" size={18} className="text-primary" />
              Pertanyaan yang Sering Diajukan (FAQ)
            </h4>
            <div className="space-y-2">
              {FAQS.map((faq, index) => {
                const isOpen = openIndex === index
                return (
                  <div
                    key={faq.q}
                    className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 dark:bg-surface-container-high/30 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between p-3.5 text-left text-body-sm font-bold text-on-surface hover:text-primary transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon name={faq.icon} size={18} className="text-secondary shrink-0" />
                        <span>{faq.q}</span>
                      </div>
                      <Icon
                        name="expand_more"
                        size={18}
                        className={`text-on-surface-variant transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-outline-variant/15 px-4 py-3 text-body-xs text-on-surface-variant leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-outline-variant/15 p-4 flex justify-end bg-surface-container-lowest/90 dark:bg-surface-container-low/90">
          <Button onClick={onClose} className="px-5 py-2 text-body-sm font-bold rounded-full">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}




