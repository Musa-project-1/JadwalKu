import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '../../hooks/useApp'
import { Icon } from '../Icon'
import { expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'
import { FeatureDocsModal } from './FeatureDocsModal'
import { SettingsAppearanceTab } from './settings/SettingsAppearanceTab'
import { SettingsAcademicTab } from './settings/SettingsAcademicTab'
import { SettingsNotificationTab } from './settings/SettingsNotificationTab'
import { SettingsStorageTab } from './settings/SettingsStorageTab'
import { SettingsAboutTab } from './settings/SettingsAboutTab'

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

  // Sync activeTab when modal transitions from closed to open
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
              <SettingsAppearanceTab
                theme={theme}
                setTheme={setTheme}
                language={language}
                setLanguage={setLanguage}
                t={t}
                fontSize={fontSize}
                setFontSize={setFontSize}
                highContrast={highContrast}
                setHighContrast={setHighContrast}
                showPrayerDividers={showPrayerDividers}
                setShowPrayerDividers={setShowPrayerDividers}
              />
            )}

            {activeTab === 'academic' && (
              <SettingsAcademicTab
                language={language}
                fakultasNama={fakultasNama}
                program={program}
                semester={semester}
                taLabel={taLabel}
                onClose={onClose}
                navigate={navigate}
              />
            )}

            {activeTab === 'notifications' && (
              <SettingsNotificationTab language={language} />
            )}

            {activeTab === 'storage' && (
              <SettingsStorageTab
                language={language}
                handleManualSync={handleManualSync}
                isSyncing={isSyncing}
                handleClearCache={handleClearCache}
              />
            )}

            {activeTab === 'about' && (
              <SettingsAboutTab
                language={language}
                setShowDocsModal={setShowDocsModal}
                onClose={onClose}
                navigate={navigate}
              />
            )}
          </main>
        </div>
      </div>

      {/* Modal Pusat Panduan Fitur */}
      <FeatureDocsModal isOpen={showDocsModal} onClose={() => setShowDocsModal(false)} mode="student" />
    </div>
  )
}
