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
import { addDocument, deleteDocument, setDocument as setDocHelper } from '../../lib/adminData'

import { AdminAppearanceTab } from './settings/AdminAppearanceTab'
import { AdminProfileTab } from './settings/AdminProfileTab'
import { AdminAcademicMasterTab } from './settings/AdminAcademicMasterTab'
import { AdminHolidaysTab } from './settings/AdminHolidaysTab'
import { AdminRoomsTab } from './settings/AdminRoomsTab'
import { AdminDatabaseTab } from './settings/AdminDatabaseTab'
import { AdminSettingsSubModals } from './settings/AdminSettingsSubModals'

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
      if (holidayTypeFilter !== 'semua') {
        const hType = (h.tipe || 'nasional').toLowerCase()
        if (holidayTypeFilter === 'nasional' && hType !== 'nasional') return false
        if (holidayTypeFilter === 'kampus' && hType !== 'kampus') return false
        if (holidayTypeFilter === 'prodi' && hType !== 'prodi') return false
        if (holidayTypeFilter === 'semester' && hType !== 'semester') return false
      }
      if (holidayProdiFilter) {
        if (!h.prodi) return false
        if (String(h.prodi).toLowerCase() !== holidayProdiFilter.toLowerCase()) return false
      }
      return true
    })
  }, [sortedHolidays, holidayTypeFilter, holidayProdiFilter])

  // ESC key to close modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !backupRestoreOpen && !calendarOpen && !kaldikImportOpen && !roomModalOpen && !addHolidayModalOpen && !syncHolidayModalOpen) {
        onClose?.()
      }
    }
    if (isOpen) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, backupRestoreOpen, calendarOpen, kaldikImportOpen, roomModalOpen, addHolidayModalOpen, syncHolidayModalOpen])

  async function handleSaveCalendar(newCal) {
    setSavingCal(true)
    const payload = {
      ganjilStart: { month: newCal.ganjilStartMonth, day: newCal.ganjilStartDay },
      ganjilEnd: { month: newCal.ganjilEndMonth, day: newCal.ganjilEndDay },
      genapStart: { month: newCal.genapStartMonth, day: newCal.genapStartDay },
      genapEnd: { month: newCal.genapEndMonth, day: newCal.genapEndDay },
      updatedAt: new Date().toISOString(),
    }
    await setDocument('settings', 'academicCalendar', payload, actor)
    await appendHistory({
      entitas: 'settings',
      field: 'academicCalendar',
      nilaiLama: calDoc,
      nilaiBaru: payload,
      aktor: actor,
      detail: 'Update konfigurasi kalender akademik sistem',
    })
    setSavingCal(false)
    setCalendarOpen(false)
  }

  async function handleImportCalendar(events) {
    setSavingKaldik(true)
    const payload = {
      ...(calDoc || {}),
      events,
      updatedAt: new Date().toISOString(),
    }
    await setDocument('settings', 'academicCalendar', payload, actor)
    await appendHistory({
      entitas: 'settings',
      field: 'academicCalendarEvents',
      nilaiLama: calDoc?.events || [],
      nilaiBaru: events,
      aktor: actor,
      detail: `Impor ${events.length} agenda kalender akademik resmi`,
    })
    setSavingKaldik(false)
    setKaldikImportOpen(false)
  }

  const TABS = useMemo(() => [
    { id: 'appearance', label: language === 'en' ? 'Appearance' : 'Tampilan', icon: 'palette', badge: null },
    { id: 'admin-profile', label: language === 'en' ? 'Admin Profile' : 'Profil Admin', icon: 'admin_panel_settings', badge: 'Active' },
    { id: 'academic-master', label: language === 'en' ? 'Academic Master' : 'Master Akademik', icon: 'school', badge: currentComputedTA },
    { id: 'holidays-master', label: language === 'en' ? 'Campus Holidays' : 'Hari Libur', icon: 'event_busy', badge: `${holidays?.length || 0} Hari` },
    { id: 'rooms-master', label: language === 'en' ? 'Rooms & Wayfinding' : 'Ruangan & Denah', icon: 'domain', badge: `${rooms?.length || 0} Ruang` },
    { id: 'database', label: language === 'en' ? 'Database & Backup' : 'Database & Backup', icon: 'database', badge: 'JSON' },
  ], [language, currentComputedTA, holidays, rooms])

  if (!isOpen) return null

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-settings-title"
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
                  <h2 id="admin-settings-title" className="text-title-sm tablet:text-title-md font-bold text-on-surface truncate">
                    {language === 'en' ? 'System Settings' : 'Pengaturan Sistem'}
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
              aria-label="Tutup modal"
              className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors cursor-pointer"
            >
              <Icon name="close" size={18} />
            </button>
          </header>

          {/* 2-Column Split Body */}
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
                <span>Admin Console</span>
                <span className="text-[9.5px] opacity-80">JadwalKu Engine</span>
              </div>
            </aside>

            {/* SISI KANAN: Canvas Konten Kategori */}
            <main className="flex-1 min-w-0 p-4 tablet:p-6 overflow-y-auto custom-scrollbar space-y-5">
              {activeTab === 'appearance' && (
                <AdminAppearanceTab
                  theme={theme}
                  setTheme={setTheme}
                  language={language}
                  setLanguage={setLanguage}
                  fontSize={fontSize}
                  setFontSize={setFontSize}
                  highContrast={highContrast}
                  setHighContrast={setHighContrast}
                  t={t}
                />
              )}

              {activeTab === 'admin-profile' && (
                <AdminProfileTab
                  user={user}
                  signOutAdmin={signOutAdmin}
                  language={language}
                />
              )}

              {activeTab === 'academic-master' && (
                <AdminAcademicMasterTab
                  language={language}
                  setCalendarOpen={setCalendarOpen}
                  setKaldikImportOpen={setKaldikImportOpen}
                />
              )}

              {activeTab === 'holidays-master' && (
                <AdminHolidaysTab
                  language={language}
                  filteredHolidays={filteredHolidays}
                  sortedHolidaysCount={sortedHolidays.length}
                  programsList={programsList}
                  holidayTypeFilter={holidayTypeFilter}
                  setHolidayTypeFilter={setHolidayTypeFilter}
                  holidayProdiFilter={holidayProdiFilter}
                  setHolidayProdiFilter={setHolidayProdiFilter}
                  onOpenAddModal={() => setAddHolidayModalOpen(true)}
                  onOpenSyncModal={() => setSyncHolidayModalOpen(true)}
                  onDeleteTarget={(h) => setDeleteHolidayTarget(h)}
                />
              )}

              {activeTab === 'rooms-master' && (
                <AdminRoomsTab
                  language={language}
                  rooms={rooms}
                  loadingRooms={loadingRooms}
                  setEditingRoom={setEditingRoom}
                  setRoomModalOpen={setRoomModalOpen}
                  setDeleteRoomTarget={setDeleteRoomTarget}
                />
              )}

              {activeTab === 'database' && (
                <AdminDatabaseTab
                  language={language}
                  setBackupRestoreOpen={setBackupRestoreOpen}
                />
              )}
            </main>
          </div>
        </div>
      </div>

      <AdminSettingsSubModals
        backupRestoreOpen={backupRestoreOpen}
        setBackupRestoreOpen={setBackupRestoreOpen}
        calendarOpen={calendarOpen}
        setCalendarOpen={setCalendarOpen}
        customCal={customCal}
        setCustomCal={setCustomCal}
        mekStats={mekStats}
        currentComputedTA={currentComputedTA}
        savingCal={savingCal}
        handleSaveCalendar={handleSaveCalendar}
        kaldikImportOpen={kaldikImportOpen}
        setKaldikImportOpen={setKaldikImportOpen}
        handleImportCalendar={handleImportCalendar}
        calDoc={calDoc}
        savingKaldik={savingKaldik}
        addHolidayModalOpen={addHolidayModalOpen}
        setAddHolidayModalOpen={setAddHolidayModalOpen}
        handleSaveHoliday={async (h) => {
          setSavingHoliday(true)
          await addDocument('libur', h, actor)
          setSavingHoliday(false)
          setAddHolidayModalOpen(false)
        }}
        savingHoliday={savingHoliday}
        syncHolidayModalOpen={syncHolidayModalOpen}
        setSyncHolidayModalOpen={setSyncHolidayModalOpen}
        selectedSyncYear={selectedSyncYear}
        setSelectedSyncYear={setSelectedSyncYear}
        syncingHolidays={syncingHolidays}
        handleSyncHolidays={async () => {
          setSyncingHolidays(true)
          const preset = NATIONAL_HOLIDAYS_PRESET[selectedSyncYear] || []
          for (const h of preset) {
            await addDocument('libur', h, actor)
          }
          setSyncingHolidays(false)
          setSyncHolidayModalOpen(false)
        }}
        deleteHolidayTarget={deleteHolidayTarget}
        setDeleteHolidayTarget={setDeleteHolidayTarget}
        handleDeleteHoliday={async () => {
          if (!deleteHolidayTarget) return
          await deleteDocument('libur', deleteHolidayTarget.id)
          setDeleteHolidayTarget(null)
        }}
        roomModalOpen={roomModalOpen}
        setRoomModalOpen={setRoomModalOpen}
        editingRoom={editingRoom}
        setEditingRoom={setEditingRoom}
        savingRoom={savingRoom}
        handleSaveRoom={async (payload) => {
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
        deleteRoomTarget={deleteRoomTarget}
        setDeleteRoomTarget={setDeleteRoomTarget}
        handleDeleteRoom={async () => {
          if (!deleteRoomTarget) return
          await deleteDocument('rooms', deleteRoomTarget.id)
          setDeleteRoomTarget(null)
        }}
      />
    </>
  )
}
