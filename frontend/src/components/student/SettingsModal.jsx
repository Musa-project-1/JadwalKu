import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'
import { useApp } from '../../hooks/useApp'
import { Icon } from '../Icon'
import { Button } from '../Button'
import { expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'
import { FeatureDocsModal } from './FeatureDocsModal'

export function SettingsModal({ isOpen, onClose, initialTab = 'appearance' }) {
  const navigate = useNavigate()
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    t,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    fakultasNama,
    program,
    semester,
    showPrayerDividers,
    setShowPrayerDividers,
  } = useApp()

  const [activeTab, setActiveTab] = useState(initialTab)
  const [prevOpen, setPrevOpen] = useState(isOpen)
  const [showDocsModal, setShowDocsModal] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // Sync activeTab when modal transitions from closed to open (standard React state-during-render pattern)
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    if (isOpen && initialTab) {
      setActiveTab(initialTab)
    }
  }

  // ESC key to close modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose?.()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const taLabel = semester ? expectedTahunAjaranForSemester(semester) : null

  function handleManualSync() {
    setIsSyncing(true)
    setTimeout(() => {
      setIsSyncing(false)
    }, 800)
  }

  function handleClearCache() {
    if (window.confirm('Reset cache lokal aplikasi? Data jadwal akan dimuat ulang dari server.')) {
      window.location.reload()
    }
  }

  const TABS = useMemo(() => [
    { id: 'appearance', label: language === 'en' ? 'Appearance' : 'Tampilan', icon: 'palette', badge: null },
    { id: 'academic', label: language === 'en' ? 'Academic Profile' : 'Profil Akademik', icon: 'school', badge: program ? `${program}` : null },
    { id: 'notifications', label: language === 'en' ? 'Reminders & Push' : 'Pengingat & Suara', icon: 'notifications_active', badge: null },
    { id: 'storage', label: language === 'en' ? 'Data & Storage' : 'Data & Cache', icon: 'database', badge: 'PWA' },
    { id: 'about', label: language === 'en' ? 'Guides & About' : 'Panduan & FAQ', icon: 'help_outline', badge: '13 Fitur' },
  ], [language, program])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-6 bg-black/65 backdrop-blur-xs animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-4xl h-[92vh] max-h-[720px] rounded-3xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low shadow-level-3 overflow-hidden"
      >
        {/* Modal Top Header */}
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/20 bg-surface-container-low/40 dark:bg-surface-container-high/30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
              <Icon name="settings" size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="settings-modal-title" className="text-title-sm tablet:text-title-md font-bold text-on-surface truncate">
                  {t ? t('settings.title') : 'Pengaturan'}
                </h2>
                <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold border border-primary/20">
                  V1.3.0 PWA
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t ? t('modal.close') : 'Tutup modal'}
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors cursor-pointer"
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        {/* 2-Column Split Body (Master-Detail) */}
        <div className="flex-1 min-h-0 flex flex-col desktop:flex-row overflow-hidden">
          {/* SISI KIRI: Navigasi Sidebar */}
          <aside className="w-full desktop:w-60 shrink-0 border-b desktop:border-b-0 desktop:border-r border-outline-variant/20 bg-surface-container-low/30 dark:bg-surface-container-high/15 p-2.5 desktop:p-3.5 flex flex-row desktop:flex-col justify-between gap-1 overflow-x-auto no-scrollbar">
            <div className="flex flex-row desktop:flex-col gap-1 w-full">
              <span className="hidden desktop:block text-[10.5px] font-extrabold uppercase tracking-wider text-on-surface-variant/70 px-3 py-1.5">
                {language === 'en' ? 'Categories' : 'Kategori'}
              </span>

              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-body-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-level-1'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon name={tab.icon} size={17} className={isActive ? 'text-on-primary' : 'text-primary'} />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="hidden desktop:flex flex-col gap-0.5 pt-2.5 border-t border-outline-variant/15 text-[10.5px] text-on-surface-variant/70 px-2">
              <span>JadwalKu PWA</span>
              <span className="text-[9.5px] opacity-80">Zero-API · 100% Offline</span>
            </div>
          </aside>

          {/* SISI KANAN: Canvas Konten Kategori */}
          <main className="flex-1 min-w-0 p-4 tablet:p-6 overflow-y-auto custom-scrollbar space-y-5">
            {activeTab === 'appearance' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-title-sm font-bold text-on-surface">
                    {language === 'en' ? 'Appearance & Theme' : 'Tampilan & Suasana'}
                  </h3>
                  <p className="text-body-xs text-on-surface-variant mt-0.5">
                    {language === 'en' ? 'Customize visual theme, language, contrast, and time markers' : 'Sesuaikan tema visual, bahasa, ukuran font, kontras, dan garis penanda waktu'}
                  </p>
                </div>

                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-4 space-y-4 shadow-2xs divide-y divide-outline-variant/15">
                  {/* Mode Gelap */}
                  <div className="flex items-center justify-between gap-4 pt-1 first:pt-0">
                    <div className="min-w-0">
                      <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
                        <Icon name="dark_mode" size={17} className="text-primary" />
                        <span>{language === 'en' ? 'Appearance Theme' : 'Mode Tampilan'}</span>
                      </span>
                      <p className="text-body-xs text-on-surface-variant mt-0.5">
                        {language === 'en' ? 'Select visual theme' : 'Pilih tema visual aplikasi'}
                      </p>
                    </div>
                    <div className="flex rounded-full bg-surface-container-high/60 p-1 border border-outline-variant/25 shadow-level-1 shrink-0">
                      {[
                        { value: 'light', icon: 'light_mode', label: language === 'en' ? 'Light' : 'Terang' },
                        { value: 'dark', icon: 'dark_mode', label: language === 'en' ? 'Dark' : 'Gelap' },
                        { value: 'system', icon: 'settings_brightness', label: language === 'en' ? 'System' : 'Sistem' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTheme(opt.value)}
                          title={`Tema ${opt.label}`}
                          aria-label={`Tema ${opt.label}`}
                          className={`flex h-7 w-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer active:opacity-80 ${
                            theme === opt.value
                              ? 'bg-surface text-primary shadow-level-1'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          <Icon name={opt.icon} size={16} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bahasa / Language */}
                  <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-3 pt-3.5">
                    <div className="min-w-0">
                      <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
                        <Icon name="language" size={17} className="text-secondary" />
                        <span>{t ? t('settings.language') : 'Bahasa / Language'}</span>
                      </span>
                      <p className="text-body-xs text-on-surface-variant mt-0.5">
                        {language === 'en' ? 'Select interface language' : 'Pilih bahasa antarmuka aplikasi'}
                      </p>
                    </div>
                    <div className="flex rounded-full bg-surface-container-high/60 p-1 border border-outline-variant/25 shadow-level-1 shrink-0 min-w-[190px]">
                      {[
                        { value: 'id', label: '🇮🇩 Indonesia' },
                        { value: 'en', label: '🇬🇧 English' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setLanguage(opt.value)}
                          className={`flex-1 rounded-full py-1 px-2.5 text-body-xs font-bold transition-all duration-200 cursor-pointer active:opacity-80 ${
                            (language || 'id') === opt.value
                              ? 'bg-surface text-primary shadow-level-1'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ukuran Font */}
                  <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-3 pt-3.5">
                    <div className="min-w-0">
                      <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
                        <Icon name="format_size" size={17} className="text-primary" />
                        <span>{language === 'en' ? 'Font Size' : 'Ukuran Font'}</span>
                      </span>
                      <p className="text-body-xs text-on-surface-variant mt-0.5">
                        {language === 'en' ? 'Adjust typography scale' : 'Atur ukuran skala tulisan'}
                      </p>
                    </div>
                    <div className="flex rounded-full bg-surface-container-high/60 p-1 border border-outline-variant/25 shadow-level-1 shrink-0 min-w-[220px]">
                      {[
                        { value: 'sm', label: language === 'en' ? 'Small' : 'Kecil' },
                        { value: 'md', label: language === 'en' ? 'Medium' : 'Sedang' },
                        { value: 'lg', label: language === 'en' ? 'Large' : 'Besar' },
                        { value: 'xl', label: language === 'en' ? 'Extra' : 'Sangat Besar' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFontSize(opt.value)}
                          className={`flex-1 rounded-full py-1 text-body-xs font-bold transition-all duration-200 cursor-pointer active:opacity-80 ${
                            fontSize === opt.value
                              ? 'bg-surface text-primary shadow-level-1'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kontras Tinggi */}
                  <div className="flex items-center justify-between gap-4 pt-3.5">
                    <div className="min-w-0">
                      <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
                        <Icon name="contrast" size={17} className="text-primary" />
                        <span>{language === 'en' ? 'High Contrast (WCAG AAA)' : 'Kontras Tinggi'}</span>
                      </span>
                      <p className="text-body-xs text-on-surface-variant mt-0.5">
                        {language === 'en' ? 'Enhance text clarity' : 'Perkuat batas border dan ketajaman teks'}
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
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all shadow-level-1 ${
                          highContrast ? 'left-[22px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Pembatas Sholat */}
                  <div className="flex items-center justify-between gap-4 pt-3.5">
                    <div className="min-w-0">
                      <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
                        <Icon name="mosque" size={17} className="text-secondary" />
                        <span>{language === 'en' ? 'Prayer Time Dividers' : 'Pembatas Waktu Sholat'}</span>
                      </span>
                      <p className="text-body-xs text-on-surface-variant mt-0.5">
                        {language === 'en'
                          ? 'Show dynamic Dhuhr, Asr, and Maghrib dividers in matrix schedule'
                          : 'Tampilkan garis pembatas Dzuhur, Ashar, dan Maghrib pada tabel matriks'}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={showPrayerDividers}
                      onClick={() => setShowPrayerDividers(!showPrayerDividers)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                        showPrayerDividers ? 'bg-primary' : 'bg-surface-variant'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all shadow-level-1 ${
                          showPrayerDividers ? 'left-[22px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-title-sm font-bold text-on-surface">
                    {language === 'en' ? 'Academic Profile & Program' : 'Profil Akademik & Program'}
                  </h3>
                  <p className="text-body-xs text-on-surface-variant mt-0.5">
                    {language === 'en' ? 'Active study program, enrolled semester, and academic year' : 'Program studi, semester aktif, dan penetapan tahun ajaran Anda'}
                  </p>
                </div>

                <div className="rounded-2xl border border-outline-variant/20 bg-gradient-to-br from-primary/10 via-primary/5 to-surface-container-high/40 p-5 shadow-2xs space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-level-1">
                        <Icon name="school" size={26} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-label-caps uppercase font-extrabold tracking-wider text-primary">
                          {fakultasNama || (language === 'en' ? 'Campus Faculty' : 'Fakultas')}
                        </p>
                        <h4 className="text-title-md font-bold text-on-surface leading-snug truncate">
                          {program || (language === 'en' ? 'Not selected' : 'Belum dipilih')}
                        </h4>
                        <p className="text-body-xs text-on-surface-variant font-medium mt-0.5">
                          {language === 'en' ? `Semester ${semester || '-'}` : `Semester ${semester || '-'}`} {taLabel ? `· Tahun Ajaran ${taLabel}` : ''}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      onClick={() => {
                        onClose?.()
                        navigate('/onboarding/wizard')
                      }}
                      className="shrink-0 px-4 py-2 text-body-xs font-bold shadow-level-1 cursor-pointer rounded-2xl"
                    >
                      <Icon name="edit" size={14} className="mr-1.5" />
                      <span>{language === 'en' ? 'Change Program' : 'Ganti Prodi'}</span>
                    </Button>
                  </div>

                  <div className="pt-3 border-t border-outline-variant/20 flex flex-wrap items-center justify-between text-label-caps text-on-surface-variant gap-2 font-medium">
                    <span>Sistem Otomasi: Kalender Akademik (Kaldik)</span>
                    <span className="text-primary font-bold">Terintegrasi Sinkron</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-title-sm font-bold text-on-surface">
                    {language === 'en' ? 'Reminders & Notifications' : 'Pengingat & Suara'}
                  </h3>
                  <p className="text-body-xs text-on-surface-variant mt-0.5">
                    {language === 'en' ? 'Configure class alerts, task deadlines, and audio chime' : 'Atur waktu alarm sebelum kelas, peringatan deadline tugas, dan nada dering'}
                  </p>
                </div>

                <NotificationSettingsSection language={language} />
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-title-sm font-bold text-on-surface">
                    {language === 'en' ? 'Data, Cache & Storage' : 'Data & Penyimpanan'}
                  </h3>
                  <p className="text-body-xs text-on-surface-variant mt-0.5">
                    {language === 'en' ? 'Manage local offline PWA cache and cloud synchronization' : 'Kelola cache offline PWA, sinkronisasi data cloud, dan pembersihan memori'}
                  </p>
                </div>

                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-5 space-y-4 shadow-2xs divide-y divide-outline-variant/15">
                  <div className="flex items-center justify-between gap-4 pt-1 first:pt-0">
                    <div className="min-w-0">
                      <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
                        <Icon name="cloud_done" size={17} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Progressive Web App (PWA)</span>
                      </span>
                      <p className="text-body-xs text-on-surface-variant mt-0.5">
                        Aplikasi terpasang dan dapat beroperasi 100% tanpa internet
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 text-label-caps font-bold border border-emerald-500/25 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Tersedia Offline</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-4">
                    <div className="min-w-0">
                      <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
                        <Icon name="sync" size={17} className="text-primary" />
                        <span>Sinkronisasi Data Kampus</span>
                      </span>
                      <p className="text-body-xs text-on-surface-variant mt-0.5">
                        Perbarui jadwal kuliah & ujian langsung dari server akademik
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="px-4 py-2 rounded-xl bg-primary text-on-primary text-body-xs font-bold shadow-level-1 hover:bg-primary/90 transition-all cursor-pointer shrink-0"
                    >
                      {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-4">
                    <div className="min-w-0">
                      <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
                        <Icon name="delete_sweep" size={17} className="text-error" />
                        <span>Reset Cache Lokal</span>
                      </span>
                      <p className="text-body-xs text-on-surface-variant mt-0.5">
                        Bersihkan data tersimpan di browser jika jadwal mengalami bentrok tampilan
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearCache}
                      className="px-4 py-2 rounded-xl border border-error/30 bg-error/10 hover:bg-error/20 text-error text-body-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      Reset Cache
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-title-sm font-bold text-on-surface">
                    {language === 'en' ? 'Guides, FAQ & Documentation' : 'Panduan & Bantuan'}
                  </h3>
                  <p className="text-body-xs text-on-surface-variant mt-0.5">
                    {language === 'en' ? 'Learn all features, class color schemes, and frequently asked questions' : 'Pelajari panduan 13 fitur mahasiswa, keterangan warna, dan tanya jawab'}
                  </p>
                </div>

                <div className="grid grid-cols-1 tablet:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDocsModal(true)}
                    className="flex flex-col items-start p-3.5 rounded-2xl border border-primary/25 bg-primary/10 hover:bg-primary/15 transition-all text-left cursor-pointer shadow-2xs group"
                  >
                    <Icon name="menu_book" size={22} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-body-sm text-on-surface">Pusat Tutorial Fitur</span>
                    <span className="text-[11px] text-on-surface-variant mt-0.5">Buka panduan 13 fitur</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate('/riwayat')
                    }}
                    className="flex flex-col items-start p-3.5 rounded-2xl border border-outline-variant/25 bg-surface-container-low/50 hover:bg-surface-container transition-all text-left cursor-pointer shadow-2xs group"
                  >
                    <Icon name="history" size={22} className="text-secondary mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-body-sm text-on-surface">Riwayat Perubahan</span>
                    <span className="text-[11px] text-on-surface-variant mt-0.5">Log update admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate('/tentang')
                    }}
                    className="flex flex-col items-start p-3.5 rounded-2xl border border-outline-variant/25 bg-surface-container-low/50 hover:bg-surface-container transition-all text-left cursor-pointer shadow-2xs group"
                  >
                    <Icon name="help_outline" size={22} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-body-sm text-on-surface">Tentang & FAQ</span>
                    <span className="text-[11px] text-on-surface-variant mt-0.5">Info & tanya jawab</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-4 space-y-3 shadow-2xs">
                  <h4 className="text-body-sm font-bold text-on-surface flex items-center gap-2">
                    <Icon name="palette" size={17} className="text-primary" />
                    <span>Keterangan Warna Format Perkuliahan</span>
                  </h4>
                  <ul className="grid grid-cols-2 tablet:grid-cols-4 gap-2">
                    {[
                      { code: 'K1', label: language === 'en' ? 'Offline Class' : 'Kelas Offline', dot: 'bg-status-offline' },
                      { code: 'K2', label: language === 'en' ? 'Online Class' : 'Kelas Online', dot: 'bg-status-online' },
                      { code: 'HB', label: language === 'en' ? 'Hybrid Class' : 'Hybrid', dot: 'bg-status-hybrid' },
                      { code: 'GBK', label: language === 'en' ? 'Combined Class' : 'Kelas Gabungan', dot: 'bg-status-combined' },
                    ].map((item) => (
                      <li
                        key={item.code}
                        className="flex items-center gap-2 rounded-xl bg-surface-container-low/50 dark:bg-surface-container-high/40 p-2 border border-outline-variant/20"
                      >
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.dot}`} />
                        <div className="min-w-0">
                          <span className="block font-bold text-[10.5px] text-on-surface leading-tight">{item.code}</span>
                          <span className="text-[9.5px] text-on-surface-variant font-medium truncate block">{item.label}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Auxiliary Sub-Modals */}
      <FeatureDocsModal isOpen={showDocsModal} onClose={() => setShowDocsModal(false)} mode="student" />
    </div>
  )
}

function NotificationSettingsSection({ language }) {
  const [prefs, setPrefs] = useState(() => ({
    kelas: true,
    ujian: true,
    tugas: true,
    nativePush: false,
    classWindow: 15,
    sound: true,
    ...getItem(STORAGE_KEYS.reminderPrefs, {}),
  }))

  function updatePref(key, value) {
    const next = { ...prefs, [key]: value }
    setItem(STORAGE_KEYS.reminderPrefs, next)
    setPrefs(next)
  }

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-4 tablet:p-5 space-y-4 shadow-2xs divide-y divide-outline-variant/15">
      <div className="flex items-center justify-between gap-2 pt-1 first:pt-0">
        <div>
          <p className="font-bold text-body-sm text-on-surface">{language === 'en' ? 'Lecture Schedule Alarms' : 'Pengingat Jadwal Kuliah'}</p>
          <p className="text-body-xs text-on-surface-variant">{language === 'en' ? 'Alerts before lecture sessions start' : 'Alarm waktu sebelum sesi kelas dimulai'}</p>
        </div>
        <ToggleSwitch checked={prefs.kelas} onChange={(v) => updatePref('kelas', v)} />
      </div>

      <div className="flex items-center justify-between gap-2 pt-3.5">
        <div>
          <p className="font-bold text-body-sm text-on-surface">{language === 'en' ? 'Assignment Deadline Alarms' : 'Pengingat Deadline Tugas'}</p>
          <p className="text-body-xs text-on-surface-variant">{language === 'en' ? 'Warnings on due date & 1 day prior' : 'Peringatan tenggat tugas H-1 & Hari-H'}</p>
        </div>
        <ToggleSwitch checked={prefs.tugas} onChange={(v) => updatePref('tugas', v)} />
      </div>

      <div className="flex items-center justify-between gap-2 pt-3.5">
        <div>
          <p className="font-bold text-body-sm text-on-surface">{language === 'en' ? 'Semester Exam Reminders' : 'Pengingat Ujian Semester'}</p>
          <p className="text-body-xs text-on-surface-variant">{language === 'en' ? 'Midterm & Final exam warnings 3 days prior' : 'Peringatan jadwal UTS dan UAS H-3 hari'}</p>
        </div>
        <ToggleSwitch checked={prefs.ujian} onChange={(v) => updatePref('ujian', v)} />
      </div>

      <div className="flex items-center justify-between gap-2 pt-3.5">
        <div>
          <p className="font-bold text-body-sm text-on-surface">{language === 'en' ? 'Audio Chime Sound' : 'Bunyi Nada Pengingat (Audio Chime)'}</p>
          <p className="text-body-xs text-on-surface-variant">{language === 'en' ? 'Play gentle harmonic chime upon receiving alerts' : 'Mainkan nada lembut saat notifikasi masuk'}</p>
        </div>
        <ToggleSwitch checked={prefs.sound} onChange={(v) => updatePref('sound', v)} />
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
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all shadow-level-1 ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}
