import { useEffect, useMemo, useRef, useState } from 'react'
import { StatusBanner } from '../../components/StatusBanner'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { addDocument, deleteDocument, setDocument, updateDocument } from '../../lib/adminData'
import { appendHistory, syncProdiFromExistingData } from '../../lib/publishHelpers'
import { ACADEMIC_CALENDAR, deriveTahunAjaran, deriveTerm } from '../../lib/tahunAjaran'
import { NATIONAL_HOLIDAYS_PRESET } from '../../constants/academicConstants'
import { computeMekStats } from '../../lib/academicCalendar'
import { exportAcademicSettingsToExcel } from '../../lib/academicExcelExport'

// Modular Components
import { AcademicSettingsHeader } from '../../components/admin/manageAcademicSettings/AcademicSettingsHeader'
import { ProgramListPanel } from '../../components/admin/manageAcademicSettings/ProgramListPanel'
import { HolidayListPanel } from '../../components/admin/manageAcademicSettings/HolidayListPanel'
import AddProdiModal from '../../components/admin/manageAcademicSettings/AddProdiModal'
import AddHolidayModal from '../../components/admin/manageAcademicSettings/AddHolidayModal'
import SyncNationalHolidaysModal from '../../components/admin/manageAcademicSettings/SyncNationalHolidaysModal'
import CalendarSettingsModal from '../../components/admin/manageAcademicSettings/CalendarSettingsModal'
import { DatabaseBackupRestoreModal } from '../../components/admin/DatabaseBackupRestoreModal'
import { AcademicCalendarImportModal } from '../../components/admin/AcademicCalendarImportModal'

function todayISO() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
}

export default function ManageAcademicSettings() {
  const { data: programs, loading: loadingProdi } = useFirestore('prodi')
  const { data: holidays, loading: loadingHolidays } = useFirestore('libur')
  const { data: settingsDocs } = useFirestore('settings')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

  const [banner, setBanner] = useState(null)
  const [backupRestoreOpen, setBackupRestoreOpen] = useState(false)

  // ── 1. Academic Calendar State ──
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

  const [savingCal, setSavingCal] = useState(false)
  const [calendarModalOpen, setCalendarModalOpen] = useState(false)
  const [kaldikImportOpen, setKaldikImportOpen] = useState(false)
  const [savingKaldik, setSavingKaldik] = useState(false)

  // ── Minggu Efektif Kuliah (MEK) Computation ──
  const mekStats = useMemo(
    () => computeMekStats({ customCal, currentComputedTerm, holidays }),
    [customCal, currentComputedTerm, holidays],
  )

  async function handleSaveCalendar(e) {
    e.preventDefault()
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
      setBanner({ ok: true, message: '✓ Perubahan kalender akademik berhasil disimpan.' })
      setCalendarModalOpen(false)
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  // ── Import Kalender Akademik (Kaldik) ──
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
      setBanner({
        ok: true,
        message: `✓ Berhasil mengimpor ${events.length} event Kalender Akademik. Batas ganjil/genap diperbarui otomatis.`,
      })
      setKaldikImportOpen(false)
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  // ── 2. Prodi State & Handlers ──
  const [addProdiModalOpen, setAddProdiModalOpen] = useState(false)
  const [prodiNama, setProdiNama] = useState('')
  const [prodiMin, setProdiMin] = useState(1)
  const [prodiMax, setProdiMax] = useState(8)
  const [prodiFormError, setProdiFormError] = useState('')
  const [editingProdiId, setEditingProdiId] = useState(null)
  const [editProdiDraft, setEditProdiDraft] = useState({
    nama: '',
    semesterMin: 1,
    semesterMax: 8,
  })
  const [deleteProdiTarget, setDeleteProdiTarget] = useState(null)
  const [savingProdi, setSavingProdi] = useState(false)
  const [syncingProdi, setSyncingProdi] = useState(false)

  const sortedProdi = useMemo(
    () => [...programs].sort((a, b) => (a.nama || '').localeCompare(b.nama || '', 'id')),
    [programs],
  )

  async function handleAddProdi(e) {
    e.preventDefault()
    setProdiFormError('')
    if (!prodiNama.trim()) {
      setProdiFormError('Nama prodi wajib diisi.')
      return
    }
    if (prodiMin >= prodiMax) {
      setProdiFormError('Semester awal harus lebih kecil dari semester akhir.')
      return
    }

    setSavingProdi(true)
    const data = {
      nama: prodiNama.trim(),
      semesterMin: Number(prodiMin),
      semesterMax: Number(prodiMax),
    }
    const result = await addDocument('prodi', data, actor)
    setSavingProdi(false)

    if (result.ok) {
      await appendHistory({
        entitas: 'prodi',
        field: 'tambah',
        nilaiLama: null,
        nilaiBaru: data,
        aktor: actor,
        detail: `Tambah prodi ${data.nama}`,
      })
      setBanner({ ok: true, message: `Program Studi "${data.nama}" berhasil ditambahkan.` })
      setProdiNama('')
      setProdiMin(1)
      setProdiMax(8)
      setAddProdiModalOpen(false)
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  async function handleSaveEditProdi(program) {
    if (
      !editProdiDraft.nama.trim() ||
      editProdiDraft.semesterMin >= editProdiDraft.semesterMax
    ) {
      setBanner({ ok: false, message: 'Nama wajib diisi dan semester awal < akhir.' })
      return
    }
    const result = await updateDocument('prodi', program.id, editProdiDraft, actor)
    if (result.ok) {
      await appendHistory({
        entitas: 'prodi',
        field: 'edit',
        nilaiLama: {
          nama: program.nama,
          semesterMin: program.semesterMin,
          semesterMax: program.semesterMax,
        },
        nilaiBaru: editProdiDraft,
        aktor: actor,
        detail: `Edit prodi ${editProdiDraft.nama}`,
      })
      setBanner({ ok: true, message: 'Perubahan program studi berhasil disimpan.' })
      setEditingProdiId(null)
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  async function handleDeleteProdi() {
    if (!deleteProdiTarget) return
    const target = deleteProdiTarget
    const result = await deleteDocument('prodi', target.id)
    setDeleteProdiTarget(null)
    if (result.ok) {
      await appendHistory({
        entitas: 'prodi',
        field: 'hapus',
        nilaiLama: target,
        nilaiBaru: null,
        aktor: actor,
        detail: `Hapus prodi ${target.nama}`,
      })
      setBanner({ ok: true, message: `Program Studi "${target.nama}" berhasil dihapus.` })
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  async function handleSyncProdi() {
    setSyncingProdi(true)
    setBanner(null)
    const result = await syncProdiFromExistingData(actor)
    setSyncingProdi(false)
    if (result.ok) {
      setBanner({
        ok: true,
        message:
          result.count > 0
            ? `${result.count} program studi berhasil disinkronkan dari data Jadwal & Mata Kuliah.`
            : 'Semua program studi sudah sinkron dengan jadwal & mata kuliah.',
      })
    } else {
      setBanner({ ok: false, message: `Gagal sinkronisasi: ${result.error}` })
    }
  }

  // ── 3. Holidays State & Handlers ──
  const [addHolidayModalOpen, setAddHolidayModalOpen] = useState(false)
  const [syncHolidayModalOpen, setSyncHolidayModalOpen] = useState(false)
  const [selectedSyncYear, setSelectedSyncYear] = useState(2026)
  const [syncingHolidays, setSyncingHolidays] = useState(false)

  const [holidayNama, setHolidayNama] = useState('')
  const [holidayMulai, setHolidayMulai] = useState(todayISO())
  const [holidaySelesai, setHolidaySelesai] = useState(todayISO())
  const [holidayTipe, setHolidayTipe] = useState('nasional')
  const [holidayProdi, setHolidayProdi] = useState('Semua')
  const [holidayFormError, setHolidayFormError] = useState('')
  const [deleteHolidayTarget, setDeleteHolidayTarget] = useState(null)
  const [savingHoliday, setSavingHoliday] = useState(false)

  const [holidayTypeFilter, setHolidayTypeFilter] = useState('semua')
  const [holidayProdiFilter, setHolidayProdiFilter] = useState('semua')

  const sortedHolidays = useMemo(
    () =>
      [...holidays].sort((a, b) =>
        String(b.mulai || '').localeCompare(String(a.mulai || '')),
      ),
    [holidays],
  )

  const filteredHolidays = useMemo(() => {
    return sortedHolidays.filter((h) => {
      if (holidayTypeFilter !== 'semua' && (h.tipe || 'nasional') !== holidayTypeFilter) {
        return false
      }
      if (holidayProdiFilter === 'umum' && h.prodi && h.prodi !== 'Semua') {
        return false
      }
      if (holidayProdiFilter !== 'semua' && holidayProdiFilter !== 'umum') {
        if (h.prodi !== holidayProdiFilter && h.prodi !== 'Semua') return false
      }
      return true
    })
  }, [sortedHolidays, holidayTypeFilter, holidayProdiFilter])

  async function handleAddHoliday(e) {
    e.preventDefault()
    setHolidayFormError('')
    if (!holidayNama.trim()) {
      setHolidayFormError('Nama libur / agenda wajib diisi.')
      return
    }
    if (holidaySelesai < holidayMulai) {
      setHolidayFormError('Tanggal selesai tidak boleh sebelum tanggal mulai.')
      return
    }

    setSavingHoliday(true)
    const data = {
      nama: holidayNama.trim(),
      mulai: holidayMulai,
      selesai: holidaySelesai,
      tipe: holidayTipe,
      prodi: holidayProdi || 'Semua',
    }
    const result = await addDocument('libur', data, actor)
    setSavingHoliday(false)

    if (result.ok) {
      await appendHistory({
        entitas: 'libur',
        field: 'tambah',
        nilaiLama: null,
        nilaiBaru: data,
        aktor: actor,
        detail: `Tambah libur ${data.nama} (${data.mulai}) [${data.prodi}]`,
      })
      setBanner({ ok: true, message: `Hari libur "${data.nama}" berhasil ditambahkan.` })
      setHolidayNama('')
      setHolidayMulai(todayISO())
      setHolidaySelesai(todayISO())
      setHolidayProdi('Semua')
      setAddHolidayModalOpen(false)
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  async function handleSyncNationalHolidays(year) {
    const preset = NATIONAL_HOLIDAYS_PRESET[year]
    if (!preset || preset.length === 0) return

    setSyncingHolidays(true)
    let addedCount = 0
    let skippedCount = 0

    const existingKeySet = new Set(
      holidays.map((h) => `${h.mulai}_${(h.nama || '').trim().toLowerCase()}`),
    )

    for (const item of preset) {
      const key = `${item.mulai}_${item.nama.trim().toLowerCase()}`
      if (!existingKeySet.has(key)) {
        const res = await addDocument('libur', item, actor)
        if (res.ok) {
          addedCount += 1
          existingKeySet.add(key)
        }
      } else {
        skippedCount += 1
      }
    }

    if (addedCount > 0) {
      await appendHistory({
        entitas: 'libur',
        field: 'sinkron_preset',
        nilaiLama: null,
        nilaiBaru: { tahun: year, totalImpor: addedCount },
        aktor: actor,
        detail: `Sinkronisasi otomatis ${addedCount} hari libur nasional tahun ${year}`,
      })
    }

    setSyncingHolidays(false)
    setSyncHolidayModalOpen(false)
    setBanner({
      ok: true,
      message:
        addedCount > 0
          ? `✓ Sukses sinkronisasi: ${addedCount} hari libur nasional ${year} ditambahkan (${skippedCount} sudah terdaftar).`
          : `Semua hari libur nasional tahun ${year} sudah terdaftar lengkap (${skippedCount} libur).`,
    })
  }

  async function handleDeleteHoliday() {
    if (!deleteHolidayTarget) return
    const target = deleteHolidayTarget
    const result = await deleteDocument('libur', target.id)
    setDeleteHolidayTarget(null)
    if (result.ok) {
      await appendHistory({
        entitas: 'libur',
        field: 'hapus',
        nilaiLama: target,
        nilaiBaru: null,
        aktor: actor,
        detail: `Hapus libur ${target.nama}`,
      })
      setBanner({ ok: true, message: `Hari libur "${target.nama}" berhasil dihapus.` })
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  function handleExportExcel() {
    exportAcademicSettingsToExcel({
      currentComputedTA,
      currentComputedTerm,
      customCal,
      mekStats,
      sortedProdi,
      sortedHolidays,
    })
  }

  return (
    <div className="h-full flex flex-col gap-3.5 tablet:gap-4 pb-20 tablet:pb-0 w-full max-w-full overflow-x-hidden min-h-0 flex-1 animate-fade-in">
      {/* ── 1. Header & Live Quick Stats ── */}
      <AcademicSettingsHeader
        programsCount={programs.length}
        holidaysCount={holidays.length}
        currentComputedTA={currentComputedTA}
        onOpenCalendarModal={() => setCalendarModalOpen(true)}
        onOpenKaldikImport={() => setKaldikImportOpen(true)}
        onOpenBackupRestore={() => setBackupRestoreOpen(true)}
        onExportExcel={handleExportExcel}
      />

      {banner && (
        <StatusBanner
          ok={banner.ok}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* ── 2. Master Program Studi & Hari Libur (Grid 2 Kolom Penuh & Seimbang) ── */}
      <div className="flex-1 flex flex-col min-h-0 grid grid-cols-1 desktop:grid-cols-2 gap-4 tablet:gap-4.5 desktop:items-stretch">
        {/* Panel 1: Master Program Studi */}
        <ProgramListPanel
          programs={sortedProdi}
          loadingProdi={loadingProdi}
          syncingProdi={syncingProdi}
          onSyncProdi={handleSyncProdi}
          onOpenAddModal={() => {
            setProdiNama('')
            setProdiMin(1)
            setProdiMax(8)
            setProdiFormError('')
            setAddProdiModalOpen(true)
          }}
          editingProdiId={editingProdiId}
          setEditingProdiId={setEditingProdiId}
          editProdiDraft={editProdiDraft}
          setEditProdiDraft={setEditProdiDraft}
          onSaveEditProdi={handleSaveEditProdi}
          onDeleteTarget={(p) => setDeleteProdiTarget(p)}
        />

        {/* Panel 2: Hari Libur & Cuti */}
        <HolidayListPanel
          filteredHolidays={filteredHolidays}
          totalHolidaysCount={holidays.length}
          loadingHolidays={loadingHolidays}
          programs={programs}
          holidayTypeFilter={holidayTypeFilter}
          setHolidayTypeFilter={setHolidayTypeFilter}
          holidayProdiFilter={holidayProdiFilter}
          setHolidayProdiFilter={setHolidayProdiFilter}
          onOpenSyncModal={() => setSyncHolidayModalOpen(true)}
          onOpenAddModal={() => {
            setHolidayNama('')
            setHolidayMulai(todayISO())
            setHolidaySelesai(todayISO())
            setHolidayTipe('nasional')
            setHolidayProdi('Semua')
            setHolidayFormError('')
            setAddHolidayModalOpen(true)
          }}
          onDeleteTarget={(h) => setDeleteHolidayTarget(h)}
        />
      </div>

      {/* ── Modals & Dialogs ── */}
      <AddProdiModal
        open={addProdiModalOpen}
        onClose={() => setAddProdiModalOpen(false)}
        nama={prodiNama}
        onNamaChange={setProdiNama}
        min={prodiMin}
        onMinChange={setProdiMin}
        max={prodiMax}
        onMaxChange={setProdiMax}
        error={prodiFormError}
        saving={savingProdi}
        onSubmit={handleAddProdi}
      />

      <AddHolidayModal
        open={addHolidayModalOpen}
        onClose={() => setAddHolidayModalOpen(false)}
        nama={holidayNama}
        onNamaChange={setHolidayNama}
        mulai={holidayMulai}
        onMulaiChange={setHolidayMulai}
        selesai={holidaySelesai}
        onSelesaiChange={setHolidaySelesai}
        tipe={holidayTipe}
        onTipeChange={setHolidayTipe}
        prodi={holidayProdi}
        onProdiChange={setHolidayProdi}
        error={holidayFormError}
        saving={savingHoliday}
        onSubmit={handleAddHoliday}
        programs={programs}
      />

      <SyncNationalHolidaysModal
        open={syncHolidayModalOpen}
        onClose={() => setSyncHolidayModalOpen(false)}
        selectedYear={selectedSyncYear}
        onYearChange={setSelectedSyncYear}
        syncing={syncingHolidays}
        onSync={handleSyncNationalHolidays}
      />

      <CalendarSettingsModal
        open={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        customCal={customCal}
        onCustomCalChange={setCustomCal}
        mekStats={mekStats}
        currentComputedTA={currentComputedTA}
        saving={savingCal}
        onSubmit={handleSaveCalendar}
      />

      <ConfirmDialog
        open={Boolean(deleteProdiTarget)}
        title="Hapus Program Studi?"
        description={`Program Studi "${deleteProdiTarget?.nama}" akan dihapus dari daftar master.`}
        confirmLabel="Hapus Prodi"
        onConfirm={handleDeleteProdi}
        onCancel={() => setDeleteProdiTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteHolidayTarget)}
        title="Hapus Hari Libur?"
        description={`Hari libur "${deleteHolidayTarget?.nama}" (${deleteHolidayTarget?.mulai}) akan dihapus dari kalender.`}
        confirmLabel="Hapus Libur"
        onConfirm={handleDeleteHoliday}
        onCancel={() => setDeleteHolidayTarget(null)}
      />

      <AcademicCalendarImportModal
        open={kaldikImportOpen}
        onClose={() => setKaldikImportOpen(false)}
        onImport={handleImportCalendar}
        existingEvents={calDoc?.events || []}
        actor={actor}
        busySaving={savingKaldik}
      />

      <DatabaseBackupRestoreModal
        isOpen={backupRestoreOpen}
        onClose={() => setBackupRestoreOpen(false)}
        actor={actor}
        onSuccess={(msg) => setBanner({ ok: true, message: msg })}
      />
    </div>
  )
}
