import { useMemo, useState, useEffect, useRef } from 'react'
import { Icon } from '../Icon'
import { useApp } from '../../hooks/useApp'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { useFirestore } from '../../hooks/useFirestore'
import { setDocument } from '../../lib/adminData'
import { appendHistory } from '../../lib/publishHelpers'
import { ACADEMIC_CALENDAR, deriveTahunAjaran, deriveTerm } from '../../lib/tahunAjaran'
import { computeMekStats } from '../../lib/academicCalendar'
import { NATIONAL_HOLIDAYS_PRESET } from '../../constants/academicConstants'
import { DatabaseBackupRestoreModal } from './DatabaseBackupRestoreModal'
import CalendarSettingsModal from './manageAcademicSettings/CalendarSettingsModal'
import { AcademicCalendarImportModal } from './AcademicCalendarImportModal'
import { RoomListPanel } from './manageAcademicSettings/RoomListPanel'
import { AddEditRoomModal } from './manageAcademicSettings/AddEditRoomModal'
import { HolidayListPanel } from './manageAcademicSettings/HolidayListPanel'
import AddHolidayModal from './manageAcademicSettings/AddHolidayModal'
import SyncNationalHolidaysModal from './manageAcademicSettings/SyncNationalHolidaysModal'
import { ConfirmDialog } from '../ConfirmDialog'
import { addDocument, deleteDocument, setDocument as setDocHelper } from '../../lib/adminData'

/**
 * AdminSettingsModal
 * Modal Pengaturan Khusus Admin dengan arsitektur 2-Column Split Master-Detail
 * Identik dengan SettingsModal pada student.
 */
export function AdminSettingsModal({ isOpen, onClose, initialTab = 'appearance' }) {
  const { theme, setTheme, language, setLanguage, fontSize, setFontSize, highContrast, setHighContrast, t } = useApp()
  const { user, signOutAdmin } = useAdminAuth()
  const actor = user?.email || ''

  const { data: settingsDocs } = useFirestore('settings')
  const { data: holidays } = useFirestore('libur')

  const calDoc = useMemo(
    () => settingsDocs?.find((s) => s.id === 'academicCalendar'),
    [settingsDocs],
  )
  const currentComputedTA = deriveTahunAjaran(new Date(), calDoc)
  const currentComputedTerm = deriveTerm(new Date(), calDoc)

  const [customCal, setCustomCal] = useState(() => ({
    ganjilStartMonth: calDoc?.ganjilStart?.month ?? ACADEMIC_CALENDAR.ganjilStart.month,
    ganjilStartDay: calDoc?.ganjilStart?.day ?? ACADEMIC_CALENDAR.ganjilStart.day,
    ganjilEndMonth: calDoc?.ganjilEnd?.month ?? ACADEMIC_CALENDAR.ganjilEnd.month,
    ganjilEndDay: calDoc?.ganjilEnd?.day ?? ACADEMIC_CALENDAR.ganjilEnd.day,
    genapStartMonth: calDoc?.genapStart?.month ?? ACADEMIC_CALENDAR.genapStart.month,
    genapStartDay: calDoc?.genapStart?.day ?? ACADEMIC_CALENDAR.genapStart.day,
    genapEndMonth: calDoc?.genapEnd?.month ?? ACADEMIC_CALENDAR.genapEnd.month,
    genapEndDay: calDoc?.genapEnd?.day ?? ACADEMIC_CALENDAR.genapEnd.day,
  }))

  const calHydratedRef = useRef(false)
  useEffect(() => {
    if (calHydratedRef.current || !calDoc) return
    setCustomCal({
      ganjilStartMonth: calDoc.ganjilStart?.month ?? ACADEMIC_CALENDAR.ganjilStart.month,
      ganjilStartDay: calDoc.ganjilStart?.day ?? ACADEMIC_CALENDAR.ganjilStart.day,
      ganjilEndMonth: calDoc.ganjilEnd?.month ?? ACADEMIC_CALENDAR.ganjilEnd.month,
      ganjilEndDay: calDoc.ganjilEnd?.day ?? ACADEMIC_CALENDAR.ganjilEnd.day,
      genapStartMonth: calDoc.genapStart?.month ?? ACADEMIC_CALENDAR.genapStart.month,
      genapStartDay: calDoc.genapStart?.day ?? ACADEMIC_CALENDAR.genapStart.day,
      genapEndMonth: calDoc.genapEnd?.month ?? ACADEMIC_CALENDAR.genapEnd.month,
      genapEndDay: calDoc.genapEnd?.day ?? ACADEMIC_CALENDAR.genapEnd.day,
    })
    calHydratedRef.current = true
  }, [calDoc])

  const mekStats = useMemo(
    () => computeMekStats({ customCal, currentComputedTerm, holidays: holidays || [] }),
    [customCal, currentComputedTerm, holidays],
  )

  const [savingCal, setSavingCal] = useState(false)
  const [savingKaldik, setSavingKaldik] = useState(false)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [backupRestoreOpen, setBackupRestoreOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [kaldikImportOpen, setKaldikImportOpen] = useState(false)
  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [savingRoom, setSavingRoom] = useState(false)
  const [deleteRoomTarget, setDeleteRoomTarget] = useState(null)
  const { data: rooms, loading: loadingRooms } = useFirestore('rooms')

  const [addHolidayModalOpen, setAddHolidayModalOpen] = useState(false)
  const [syncHolidayModalOpen, setSyncHolidayModalOpen] = useState(false)
  const [selectedSyncYear, setSelectedSyncYear] = useState(() => new Date().getFullYear())
  const [syncingHolidays, setSyncingHolidays] = useState(false)
  const [deleteHolidayTarget, setDeleteHolidayTarget] = useState(null)
  const [savingHoliday, setSavingHoliday] = useState(false)

  const [holidayTypeFilter, setHolidayTypeFilter] = useState('semua')
  const [holidayProdiFilter, setHolidayProdiFilter] = useState('')
  const { data: programsList } = useFirestore('prodi')

  const sortedHolidays = useMemo(
    () => (holidays ? [...holidays].sort((a, b) => (a.mulai || '').localeCompare(b.mulai || '')) : []),
    [holidays],
  )

  const filteredHolidays = useMemo(() => {
    return sortedHolidays.filter((h) => {
      if (holidayTypeFilter !== 'semua' && h.tipe !== holidayTypeFilter) return false
      if (holidayProdiFilter && h.prodi && h.prodi !== 'Semua' && h.prodi !== holidayProdiFilter) return false
      return true
    })
  }, [sortedHolidays, holidayTypeFilter, holidayProdiFilter])

  async function handleSaveCalendar(e) {
    if (e?.preventDefault) e.preventDefault()
    setSavingCal(true)
    const payload = {
      ganjilStart: {
        month: Number(customCal.ganjilStartMonth),
        day: Number(customCal.ganjilStartDay),
      },
      ganjilEnd: {
        month: Number(customCal.ganjilEndMonth),
        day: Number(customCal.ganjilEndDay),
      },
      genapStart: {
        month: Number(customCal.genapStartMonth),
        day: Number(customCal.genapStartDay),
      },
      genapEnd: {
        month: Number(customCal.genapEndMonth),
        day: Number(customCal.genapEndDay),
      },
      updatedAt: new Date().toISOString(),
    }
    const result = await setDocument('settings', 'academicCalendar', payload, actor)
    setSavingCal(false)
    if (result.ok) {
      await appendHistory({
        entitas: 'settings',
        field: 'academicCalendar',
        nilaiLama: calDoc ?? null,
        nilaiBaru: payload,
        aktor: actor,
        detail: 'Konfigurasi batas kalender akademik diperbarui',
      })
      setCalendarOpen(false)
    }
  }

  async function handleImportCalendar({ events, bounds }) {
    setSavingKaldik(true)
    const payload = {
      ganjilStart: bounds?.ganjilStart ?? calDoc?.ganjilStart ?? ACADEMIC_CALENDAR.ganjilStart,
      ganjilEnd: bounds?.ganjilEnd ?? calDoc?.ganjilEnd ?? ACADEMIC_CALENDAR.ganjilEnd,
      genapStart: bounds?.genapStart ?? calDoc?.genapStart ?? ACADEMIC_CALENDAR.genapStart,
      genapEnd: bounds?.genapEnd ?? calDoc?.genapEnd ?? ACADEMIC_CALENDAR.genapEnd,
      events,
      updatedAt: new Date().toISOString(),
    }
    const result = await setDocument('settings', 'academicCalendar', payload, actor)
    setSavingKaldik(false)
    if (result.ok) {
      await appendHistory({
        entitas: 'settings',
        field: 'academicCalendar',
        nilaiLama: calDoc ?? null,
        nilaiBaru: payload,
        aktor: actor,
        detail: `Impor Kalender Akademik: ${events.length} event`,
      })
      setKaldikImportOpen(false)
    }
  }

  const TABS = useMemo(() => [
    { id: 'appearance', label: language === 'en' ? 'Appearance' : 'Tampilan', icon: 'palette', badge: null },
    { id: 'admin-profile', label: language === 'en' ? 'Admin Profile' : 'Profil Admin', icon: 'admin_panel_settings', badge: 'Auth' },
    { id: 'academic-master', label: language === 'en' ? 'Academic Master' : 'Master Akademik', icon: 'school', badge: 'Kaldik' },
    { id: 'holidays-master', label: language === 'en' ? 'Campus Holidays' : 'Hari Libur Kampus', icon: 'event_busy', badge: 'Libur' },
    { id: 'rooms-master', label: language === 'en' ? 'Rooms & Wayfinding' : 'Ruangan Kampus', icon: 'meeting_room', badge: 'Denah' },
    { id: 'database', label: language === 'en' ? 'Database & Backup' : 'Database & Backup', icon: 'database', badge: 'Cloud' },
  ], [language])

  if (!isOpen) return null

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-settings-modal-title"
        onClick={onClose}
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 tablet:p-6 bg-black/65 backdrop-blur-xs animate-fade-in"
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
                  <h2 id="admin-settings-modal-title" className="text-title-sm tablet:text-title-md font-bold text-on-surface truncate">
                    {language === 'en' ? 'Admin Settings' : 'Pengaturan Admin'}
                  </h2>
                  <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold border border-primary/20">
                    Admin Console
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
            {/* SISI KIRI: Navigasi Kategori */}
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
                      {tab.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full border font-bold ${
                          isActive
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="hidden desktop:flex flex-col gap-0.5 pt-2.5 border-t border-outline-variant/15 text-[10.5px] text-on-surface-variant/70 px-2">
                <span>JadwalKu Console</span>
                <span className="text-[9.5px] opacity-80">Administrator Scope</span>
              </div>
            </aside>

            {/* SISI KANAN: Canvas Konten Kategori */}
            <main className="flex-1 min-w-0 p-4 tablet:p-6 overflow-y-auto custom-scrollbar space-y-5">
              {/* TAB 1: TAMPILAN */}
              {activeTab === 'appearance' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h3 className="text-title-sm font-bold text-on-surface">
                      {language === 'en' ? 'Appearance & Interface' : 'Tampilan & Suasana'}
                    </h3>
                    <p className="text-body-xs text-on-surface-variant mt-0.5">
                      {language === 'en' ? 'Customize visual theme, language, contrast, and scaling' : 'Sesuaikan tema visual, bahasa, ukuran font, dan kontras panel admin'}
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
                            highContrast ? 'left-5.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PROFIL ADMIN */}
              {activeTab === 'admin-profile' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h3 className="text-title-sm font-bold text-on-surface">
                      {language === 'en' ? 'Administrator Account' : 'Akun Administrator'}
                    </h3>
                    <p className="text-body-xs text-on-surface-variant mt-0.5">
                      {language === 'en' ? 'Information about the authenticated administrator session' : 'Informasi tentang sesi admin yang sedang aktif'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                        <Icon name="admin_panel_settings" size={32} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-title-sm font-bold text-on-surface truncate">
                          {user?.email || 'admin@kampus.ac.id'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-label-caps font-bold">
                            Active Admin
                          </span>
                          <span className="text-body-xs text-on-surface-variant">
                            Firebase Auth
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-outline-variant/20 pt-4 flex items-center justify-between">
                      <div>
                        <span className="text-body-xs font-semibold text-on-surface">Sesi Login</span>
                        <p className="text-[11.5px] text-on-surface-variant">Keluar dari mode admin dan kembali ke beranda mahasiswa</p>
                      </div>
                      <button
                        type="button"
                        onClick={signOutAdmin}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-error/10 hover:bg-error/20 text-error text-body-xs font-bold transition-all cursor-pointer"
                      >
                        <Icon name="logout" size={16} />
                        <span>Keluar Admin</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MASTER AKADEMIK */}
              {activeTab === 'academic-master' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h3 className="text-title-sm font-bold text-on-surface">
                      {language === 'en' ? 'Master Academic Settings' : 'Konfigurasi Master Akademik'}
                    </h3>
                    <p className="text-body-xs text-on-surface-variant mt-0.5">
                      {language === 'en' ? 'Manage academic calendars, programs (prodi), holidays, and room coordinates' : 'Kelola kalender akademik, program studi, hari libur, dan ruangan kampus'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => setCalendarOpen(true)}
                      className="group p-4 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low hover:border-primary/50 transition-all flex flex-col justify-between shadow-2xs text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                          <Icon name="calendar_month" size={20} />
                        </div>
                        <div>
                          <h4 className="text-body-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                            Kalender Akademik & Libur
                          </h4>
                          <p className="text-[11.5px] text-on-surface-variant">Batas semester, TA, dan kalender libur</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-end text-label-caps text-primary font-bold">
                        <span>Konfigurasi Kalender →</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setKaldikImportOpen(true)}
                      className="group p-4 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low hover:border-secondary/50 transition-all flex flex-col justify-between shadow-2xs text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20">
                          <Icon name="upload_file" size={20} />
                        </div>
                        <div>
                          <h4 className="text-body-sm font-bold text-on-surface group-hover:text-secondary transition-colors">
                            Impor Kaldik Resmi (PDF / Excel)
                          </h4>
                          <p className="text-[11.5px] text-on-surface-variant">Ekstrak otomatis tanggal semester & libur</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-end text-label-caps text-secondary font-bold">
                        <span>Impor Berkas →</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: HARI LIBUR KAMPUS */}
              {activeTab === 'holidays-master' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h3 className="text-title-sm font-bold text-on-surface">
                      {language === 'en' ? 'Campus Holiday Calendar' : 'Daftar Hari Libur Kampus'}
                    </h3>
                    <p className="text-body-xs text-on-surface-variant mt-0.5">
                      {language === 'en' ? 'Manage official campus holidays, breaks, and national calendar sync' : 'Kelola hari libur nasional, jeda perkuliahan, dan agenda libur kampus'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-4 shadow-2xs">
                    <HolidayListPanel
                      filteredHolidays={filteredHolidays}
                      totalHolidaysCount={sortedHolidays.length}
                      loadingHolidays={false}
                      programs={programsList || []}
                      holidayTypeFilter={holidayTypeFilter}
                      setHolidayTypeFilter={setHolidayTypeFilter}
                      holidayProdiFilter={holidayProdiFilter}
                      setHolidayProdiFilter={setHolidayProdiFilter}
                      onOpenAddModal={() => setAddHolidayModalOpen(true)}
                      onOpenSyncModal={() => setSyncHolidayModalOpen(true)}
                      onDeleteTarget={(h) => setDeleteHolidayTarget(h)}
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: RUANGAN KAMPUS */}
              {activeTab === 'rooms-master' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h3 className="text-title-sm font-bold text-on-surface">
                      {language === 'en' ? 'Campus Rooms & Wayfinding' : 'Master Denah & Ruangan Kampus'}
                    </h3>
                    <p className="text-body-xs text-on-surface-variant mt-0.5">
                      {language === 'en' ? 'Configure physical room directories, floor locations, and facilities' : 'Kelola direktori nama ruang kelas, lantai gedung, dan fasilitas kampus'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-4 shadow-2xs">
                    <RoomListPanel
                      rooms={rooms || []}
                      loadingRooms={loadingRooms}
                      extractingRooms={false}
                      onExtractRooms={() => {}}
                      onOpenAddRoom={() => {
                        setEditingRoom(null)
                        setRoomModalOpen(true)
                      }}
                      onEditRoom={(r) => {
                        setEditingRoom(r)
                        setRoomModalOpen(true)
                      }}
                      onDeleteRoom={(r) => setDeleteRoomTarget(r)}
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: DATABASE & BACKUP */}
              {activeTab === 'database' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h3 className="text-title-sm font-bold text-on-surface">
                      {language === 'en' ? 'Database & Cloud Storage' : 'Cadangan & Pemulihan Database'}
                    </h3>
                    <p className="text-body-xs text-on-surface-variant mt-0.5">
                      {language === 'en' ? 'Export full backup snapshots or restore schedules safely' : 'Unduh berkas JSON cadangan seluruh koleksi atau pulihkan jadwal secara aman'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
                          <Icon name="cloud_sync" size={22} />
                        </div>
                        <div>
                          <h4 className="text-body-sm font-bold text-on-surface">Snapshot Cadangan Koleksi</h4>
                          <p className="text-[11.5px] text-on-surface-variant">Jadwal, Mata Kuliah, Ujian, Pengumuman, Ruang, dan Kalender</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBackupRestoreOpen(true)}
                        className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-body-xs shadow-level-1 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                      >
                        Buka Backup & Restore
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {backupRestoreOpen && (
        <DatabaseBackupRestoreModal
          open={backupRestoreOpen}
          onClose={() => setBackupRestoreOpen(false)}
        />
      )}

      {calendarOpen && (
        <CalendarSettingsModal
          open={calendarOpen}
          onClose={() => setCalendarOpen(false)}
          customCal={customCal}
          onCustomCalChange={setCustomCal}
          mekStats={mekStats}
          currentComputedTA={currentComputedTA}
          saving={savingCal}
          onSubmit={handleSaveCalendar}
        />
      )}

      {kaldikImportOpen && (
        <AcademicCalendarImportModal
          open={kaldikImportOpen}
          onClose={() => setKaldikImportOpen(false)}
          onImport={handleImportCalendar}
          existingEvents={calDoc?.events || []}
          actor={actor}
          busySaving={savingKaldik}
        />
      )}

      {addHolidayModalOpen && (
        <AddHolidayModal
          open={addHolidayModalOpen}
          onClose={() => setAddHolidayModalOpen(false)}
          onAdd={async (h) => {
            setSavingHoliday(true)
            await addDocument('libur', h, actor)
            setSavingHoliday(false)
            setAddHolidayModalOpen(false)
          }}
          saving={savingHoliday}
          todayISO={new Date().toISOString().slice(0, 10)}
        />
      )}

      {syncHolidayModalOpen && (
        <SyncNationalHolidaysModal
          open={syncHolidayModalOpen}
          onClose={() => setSyncHolidayModalOpen(false)}
          selectedYear={selectedSyncYear}
          onYearChange={setSelectedSyncYear}
          syncing={syncingHolidays}
          onSync={async () => {
            setSyncingHolidays(true)
            const preset = NATIONAL_HOLIDAYS_PRESET[selectedSyncYear] || []
            for (const h of preset) {
              await addDocument('libur', h, actor)
            }
            setSyncingHolidays(false)
            setSyncHolidayModalOpen(false)
          }}
        />
      )}

      {deleteHolidayTarget && (
        <ConfirmDialog
          open={Boolean(deleteHolidayTarget)}
          title="Hapus Hari Libur?"
          description={`Hari libur "${deleteHolidayTarget?.nama}" akan dihapus dari kalender.`}
          confirmLabel="Hapus Libur"
          onConfirm={async () => {
            if (!deleteHolidayTarget) return
            await deleteDocument('libur', deleteHolidayTarget.id)
            setDeleteHolidayTarget(null)
          }}
          onCancel={() => setDeleteHolidayTarget(null)}
        />
      )}

      {roomModalOpen && (
        <AddEditRoomModal
          open={roomModalOpen}
          onClose={() => {
            setRoomModalOpen(false)
            setEditingRoom(null)
          }}
          room={editingRoom}
          saving={savingRoom}
          onSave={async (payload) => {
            setSavingRoom(true)
            if (editingRoom?.id) {
              await setDocHelper('rooms', editingRoom.id, payload, actor)
            } else {
              const docId = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
              await setDocHelper('rooms', docId, payload, actor)
            }
            setSavingRoom(false)
            setRoomModalOpen(false)
            setEditingRoom(null)
          }}
        />
      )}

      {deleteRoomTarget && (
        <ConfirmDialog
          open={Boolean(deleteRoomTarget)}
          title="Hapus Ruangan?"
          description={`Ruangan "${deleteRoomTarget?.name}" akan dihapus dari direktori denah kampus.`}
          confirmLabel="Hapus Ruang"
          onConfirm={async () => {
            if (!deleteRoomTarget) return
            await deleteDocument('rooms', deleteRoomTarget.id)
            setDeleteRoomTarget(null)
          }}
          onCancel={() => setDeleteRoomTarget(null)}
        />
      )}
    </>
  )
}
