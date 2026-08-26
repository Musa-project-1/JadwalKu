import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { FormSelect } from '../../components/FormSelect'
import {
  HolidayProdiFilterDropdown,
  MonthSelectDropdown,
} from '../../components/admin/AdminFilterDropdowns'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { addDocument, deleteDocument, setDocument, updateDocument } from '../../lib/adminData'
import { appendHistory, syncProdiFromExistingData } from '../../lib/publishHelpers'
import { ACADEMIC_CALENDAR, deriveTahunAjaran, deriveTerm, getTermLabel } from '../../lib/tahunAjaran'
import { MONTH_NAMES, NATIONAL_HOLIDAYS_PRESET } from '../../constants/academicConstants'

const SEMESTER_OPTIONS = Array.from({ length: 14 }, (_, i) => i + 1)

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
  const [savingCal, setSavingCal] = useState(false)
  const [calendarModalOpen, setCalendarModalOpen] = useState(false)

  // ── Minggu Efektif Kuliah (MEK) Computation ──
  const mekStats = useMemo(() => {
    const isGanjil = currentComputedTerm === 'ganjil'
    const startM = isGanjil ? customCal.ganjilStartMonth : customCal.genapStartMonth
    const startD = isGanjil ? customCal.ganjilStartDay : customCal.genapStartDay
    const endM = isGanjil ? customCal.ganjilEndMonth : customCal.genapEndMonth
    const endD = isGanjil ? customCal.ganjilEndDay : customCal.genapEndDay

    const now = new Date()
    const curYear = now.getFullYear()
    const startDate = new Date(curYear, startM, startD)
    let endDate = new Date(curYear, endM, endD)
    if (endDate < startDate) {
      endDate = new Date(curYear + 1, endM, endD)
    }

    const totalDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)))
    const totalWeeks = Math.floor(totalDays / 7)

    // Count holidays in this period
    const periodHolidays = holidays.filter((h) => {
      if (!h.mulai) return false
      const hDate = new Date(h.mulai)
      return hDate >= startDate && hDate <= endDate
    })

    // Estimated teaching weeks (standard 14 weeks + 2 exam weeks)
    const effectiveWeeks = Math.max(12, Math.min(totalWeeks, 16))

    return {
      totalDays,
      totalWeeks,
      holidayCount: periodHolidays.length,
      effectiveWeeks,
      termLabel: getTermLabel(currentComputedTerm),
    }
  }, [customCal, currentComputedTerm, holidays])

  async function handleSaveCalendar(e) {
    e.preventDefault()
    setSavingCal(true)
    const payload = {
      ganjilStart: { month: Number(customCal.ganjilStartMonth), day: Number(customCal.ganjilStartDay) },
      ganjilEnd: { month: Number(customCal.ganjilEndMonth), day: Number(customCal.ganjilEndDay) },
      genapStart: { month: Number(customCal.genapStartMonth), day: Number(customCal.genapStartDay) },
      genapEnd: { month: Number(customCal.genapEndMonth), day: Number(customCal.genapEndDay) },
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

  // ── 2. Prodi State ──
  const [addProdiModalOpen, setAddProdiModalOpen] = useState(false)
  const [prodiNama, setProdiNama] = useState('')
  const [prodiMin, setProdiMin] = useState(1)
  const [prodiMax, setProdiMax] = useState(8)
  const [prodiFormError, setProdiFormError] = useState('')
  const [editingProdiId, setEditingProdiId] = useState(null)
  const [editProdiDraft, setEditProdiDraft] = useState({ nama: '', semesterMin: 1, semesterMax: 8 })
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
    const data = { nama: prodiNama.trim(), semesterMin: Number(prodiMin), semesterMax: Number(prodiMax) }
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
    if (!editProdiDraft.nama.trim() || editProdiDraft.semesterMin >= editProdiDraft.semesterMax) {
      setBanner({ ok: false, message: 'Nama wajib diisi dan semester awal < akhir.' })
      return
    }
    const result = await updateDocument('prodi', program.id, editProdiDraft, actor)
    if (result.ok) {
      await appendHistory({
        entitas: 'prodi',
        field: 'edit',
        nilaiLama: { nama: program.nama, semesterMin: program.semesterMin, semesterMax: program.semesterMax },
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
    const result = await deleteDocument('prodi', deleteProdiTarget.id)
    const target = deleteProdiTarget
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
        message: result.count > 0
          ? `${result.count} program studi berhasil disinkronkan dari data Jadwal & Mata Kuliah.`
          : 'Semua program studi sudah sinkron dengan jadwal & mata kuliah.',
      })
    } else {
      setBanner({ ok: false, message: `Gagal sinkronisasi: ${result.error}` })
    }
  }

  // ── 3. Holidays State & Filters ──
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

  // Holidays Filter Toolbar
  const [holidayTypeFilter, setHolidayTypeFilter] = useState('semua')
  const [holidayProdiFilter, setHolidayProdiFilter] = useState('semua')

  const sortedHolidays = useMemo(
    () => [...holidays].sort((a, b) => String(b.mulai || '').localeCompare(String(a.mulai || ''))),
    [holidays],
  )

  const filteredHolidays = useMemo(() => {
    return sortedHolidays.filter((h) => {
      // Type Filter
      if (holidayTypeFilter !== 'semua' && (h.tipe || 'nasional') !== holidayTypeFilter) {
        return false
      }
      // Prodi Filter
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

  // 1-Click National Holidays Sync Preset
  async function handleSyncNationalHolidays(year) {
    const preset = NATIONAL_HOLIDAYS_PRESET[year]
    if (!preset || preset.length === 0) return

    setSyncingHolidays(true)
    let addedCount = 0
    let skippedCount = 0

    // Compare with existing holidays by date + name
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
    const result = await deleteDocument('libur', deleteHolidayTarget.id)
    const target = deleteHolidayTarget
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

  // ── Ekspor Master Akademik ke Excel ──
  function exportAcademicSettingsToExcel() {
    const wb = XLSX.utils.book_new()

    // 1. Sheet Kalender
    const calData = [
      { Parameter: 'Tahun Ajaran Aktif', Nilai: currentComputedTA },
      { Parameter: 'Term Aktif', Nilai: getTermLabel(currentComputedTerm) },
      { Parameter: 'Mulai Semester Ganjil', Nilai: `Tgl ${customCal.ganjilStartDay} ${MONTH_NAMES[customCal.ganjilStartMonth]}` },
      { Parameter: 'Selesai Semester Ganjil', Nilai: `Tgl ${customCal.ganjilEndDay} ${MONTH_NAMES[customCal.ganjilEndMonth]}` },
      { Parameter: 'Mulai Semester Genap', Nilai: `Tgl ${customCal.genapStartDay} ${MONTH_NAMES[customCal.genapStartMonth]}` },
      { Parameter: 'Selesai Semester Genap', Nilai: `Tgl ${customCal.genapEndDay} ${MONTH_NAMES[customCal.genapEndMonth]}` },
      { Parameter: 'Minggu Efektif Kuliah (MEK)', Nilai: `${mekStats.effectiveWeeks} Minggu` },
    ]
    const wsCal = XLSX.utils.json_to_sheet(calData)
    XLSX.utils.book_append_sheet(wb, wsCal, 'Kalender_Akademik')

    // 2. Sheet Program Studi
    const prodiData = sortedProdi.map((p) => ({
      'Nama Program Studi': p.nama,
      'Semester Minimal': p.semesterMin ?? 1,
      'Semester Maksimal': p.semesterMax ?? 8,
    }))
    const wsProdi = XLSX.utils.json_to_sheet(prodiData)
    XLSX.utils.book_append_sheet(wb, wsProdi, 'Program_Studi')

    // 3. Sheet Hari Libur
    const liburData = sortedHolidays.map((h) => ({
      'Nama Hari Libur / Agenda': h.nama,
      'Jenis Libur': (h.tipe || 'nasional').toUpperCase(),
      'Cakupan Prodi': h.prodi || 'Semua',
      'Tanggal Mulai': h.mulai,
      'Tanggal Selesai': h.selesai || h.mulai,
    }))
    const wsLibur = XLSX.utils.json_to_sheet(liburData)
    XLSX.utils.book_append_sheet(wb, wsLibur, 'Daftar_Hari_Libur')

    XLSX.writeFile(wb, `Master_Akademik_${currentComputedTA.replace('/', '-')}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in w-full max-w-full overflow-x-hidden">
      {/* ── 1. Header & Live Quick Stats — 1 Horizontal Row on Desktop ── */}
      <header className="flex flex-col gap-2.5 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 tablet:h-11 tablet:w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary-container/60 text-secondary shadow-xs dark:bg-secondary-container/30">
            <Icon name="settings_suggest" size={22} />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl tablet:text-2xl font-bold tracking-tight text-on-surface">
              Master Akademik
            </h1>
            <p className="text-[11.5px] tablet:text-body-xs font-normal text-on-surface-variant truncate">
              Kalender perkuliahan, program studi, dan hari libur kampus.
            </p>
          </div>
        </div>

        {/* Right side: 3 Stat Chips + Tombol Atur Kalender + Tombol Ekspor */}
        <div className="flex items-center gap-2 tablet:gap-2.5 shrink-0 flex-wrap tablet:flex-nowrap">
          <div className="grid grid-cols-3 gap-1.5 w-full tablet:flex tablet:w-auto tablet:gap-2">
            <div className="flex items-center gap-1.5 rounded-2xl border border-primary/20 bg-primary/10 px-2.5 py-1.5 dark:bg-primary/20 min-w-0 shadow-2xs">
              <Icon name="school" size={15} className="text-primary shrink-0" />
              <span className="text-body-xs font-bold text-primary truncate">{programs.length} Prodi</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-2xl border border-secondary/20 bg-secondary/10 px-2.5 py-1.5 dark:bg-secondary/20 min-w-0 shadow-2xs">
              <Icon name="event_available" size={15} className="text-secondary shrink-0" />
              <span className="text-body-xs font-bold text-secondary truncate">{holidays.length} Libur</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1.5 dark:bg-indigo-500/20 min-w-0 shadow-2xs">
              <Icon name="event" size={15} className="text-indigo-700 dark:text-indigo-300 shrink-0" />
              <span className="font-mono text-body-xs font-bold text-indigo-700 dark:text-indigo-300 truncate">
                TA {currentComputedTA}
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setCalendarModalOpen(true)}
            className="rounded-2xl px-3.5 py-2 font-bold shadow-xs cursor-pointer text-body-xs shrink-0"
            title="Atur Batas Kalender Akademik & Live MEK"
          >
            <Icon name="tune" size={16} className="mr-1" />
            <span>Atur Kalender</span>
          </Button>

          <button
            type="button"
            onClick={exportAcademicSettingsToExcel}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-outline-variant/30 bg-surface-container-low/60 px-3 py-2 text-body-xs font-semibold text-on-surface shadow-2xs hover:border-primary hover:text-primary cursor-pointer transition-colors"
            title="Ekspor Seluruh Master Data ke Excel"
          >
            <Icon name="file_download" size={15} className="text-secondary" />
            <span>Ekspor</span>
          </button>
        </div>
      </header>

      {banner && (
        <StatusBanner
          ok={banner.ok}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* ── 2. Master Program Studi & Hari Libur (Grid 2 Kolom Penuh & Seimbang) ── */}
      <div className="grid grid-cols-1 desktop:grid-cols-2 gap-4 tablet:gap-4.5 desktop:items-stretch">
        {/* ── Panel 1: Master Program Studi ── */}
        <section className="h-full flex flex-col justify-between rounded-2xl tablet:rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 tablet:p-5 shadow-2xs dark:bg-surface-container-low min-h-[460px] tablet:min-h-[500px] space-y-3">
          <div className="flex-1 flex flex-col space-y-3 min-h-0">
            <div className="flex items-center justify-between gap-2 border-b border-outline-variant/15 pb-2.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Icon name="school" size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-body-sm tablet:text-title-sm font-bold tracking-tight text-on-surface">Master Program Studi</h2>
                  <p className="text-body-xs font-normal text-on-surface-variant truncate">Daftar prodi aktif & rentang semester</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSyncProdi}
                  disabled={syncingProdi}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-3 py-1.5 text-body-xs font-bold text-on-surface shadow-2xs hover:border-primary hover:text-primary cursor-pointer transition-colors"
                  title="Sinkronisasi dari data Jadwal & MK"
                >
                  <Icon name="sync" size={14} className={syncingProdi ? 'animate-spin' : ''} />
                  <span className="hidden tablet:inline">{syncingProdi ? 'Menyinkronkan...' : 'Sinkron'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProdiNama('')
                    setProdiMin(1)
                    setProdiMax(8)
                    setProdiFormError('')
                    setAddProdiModalOpen(true)
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-body-xs font-bold text-on-primary shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
                  title="Tambah Program Studi"
                  aria-label="Tambah Prodi"
                >
                  <Icon name="add" size={16} />
                  <span className="hidden tablet:inline">Tambah Prodi</span>
                </button>
              </div>
            </div>

            {/* List Program Studi */}
            {loadingProdi ? (
              <div className="space-y-2.5">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
              </div>
            ) : sortedProdi.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10">
                <EmptyState icon="school" title="Belum ada program studi" description="Tambahkan prodi baru atau klik sinkron otomatis." />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
                {sortedProdi.map((p) => {
                  const isEditing = editingProdiId === p.id
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 p-3 tablet:p-3.5 dark:bg-surface-container-high/20 transition-all hover:border-primary/30 shadow-2xs"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            type="text"
                            value={editProdiDraft.nama}
                            onChange={(e) => setEditProdiDraft((d) => ({ ...d, nama: e.target.value }))}
                            className="flex-1 rounded-xl border border-outline-variant/30 bg-surface px-3 py-1.5 text-body-sm font-semibold text-on-surface"
                          />
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              max="14"
                              value={editProdiDraft.semesterMin}
                              onChange={(e) => setEditProdiDraft((d) => ({ ...d, semesterMin: Number(e.target.value) }))}
                              className="w-12 rounded-xl border border-outline-variant/30 bg-surface px-2 py-1.5 text-center text-body-sm font-bold"
                            />
                            <span>–</span>
                            <input
                              type="number"
                              min="1"
                              max="14"
                              value={editProdiDraft.semesterMax}
                              onChange={(e) => setEditProdiDraft((d) => ({ ...d, semesterMax: Number(e.target.value) }))}
                              className="w-12 rounded-xl border border-outline-variant/30 bg-surface px-2 py-1.5 text-center text-body-sm font-bold"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveEditProdi(p)}
                              className="rounded-xl bg-primary px-3 py-1.5 text-body-xs font-bold text-on-primary hover:bg-primary/90 cursor-pointer shadow-2xs"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProdiId(null)}
                              className="rounded-xl px-3 py-1.5 text-body-xs font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-body-sm text-on-surface truncate">{p.nama}</p>
                            <span className="inline-flex items-center rounded-lg bg-primary/10 px-2 py-0.5 text-label-caps font-bold text-primary mt-1 border border-primary/20">
                              Semester {p.semesterMin ?? 1} – {p.semesterMax ?? 8}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProdiId(p.id)
                                setEditProdiDraft({ nama: p.nama, semesterMin: p.semesterMin ?? 1, semesterMax: p.semesterMax ?? 8 })
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer border border-outline-variant/15"
                              title="Edit Prodi"
                            >
                              <Icon name="edit" size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteProdiTarget(p)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer border border-outline-variant/15"
                              title="Hapus Prodi"
                            >
                              <Icon name="delete" size={15} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── Panel 2: Hari Libur, Cuti & Agenda Khusus Prodi ── */}
        <section className="h-full flex flex-col justify-between rounded-2xl tablet:rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 tablet:p-5 shadow-2xs dark:bg-surface-container-low min-h-[460px] tablet:min-h-[500px] space-y-3">
          <div className="flex-1 flex flex-col space-y-3 min-h-0">
            <div className="flex items-center justify-between gap-2 border-b border-outline-variant/15 pb-2.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary border border-secondary/20">
                  <Icon name="event_busy" size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-body-sm tablet:text-title-sm font-bold tracking-tight text-on-surface">Hari Libur & Cuti ({filteredHolidays.length})</h2>
                  <p className="text-body-xs font-normal text-on-surface-variant truncate">Libur nasional, cuti bersama & prodi</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSyncHolidayModalOpen(true)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-secondary/30 bg-secondary/10 px-2.5 py-1.5 text-body-xs font-bold text-secondary hover:bg-secondary/20 transition-colors cursor-pointer shadow-2xs"
                  title="Impor Libur Resmi Nasional Otomatis"
                >
                  <Icon name="cloud_sync" size={15} />
                  <span className="hidden tablet:inline">Sinkron Libur</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHolidayNama('')
                    setHolidayMulai(todayISO())
                    setHolidaySelesai(todayISO())
                    setHolidayTipe('nasional')
                    setHolidayProdi('Semua')
                    setHolidayFormError('')
                    setAddHolidayModalOpen(true)
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-secondary px-3 py-1.5 text-body-xs font-bold text-on-secondary shadow-xs hover:bg-secondary/90 transition-colors cursor-pointer"
                  title="Tambah Hari Libur"
                  aria-label="Tambah Libur"
                >
                  <Icon name="add" size={16} />
                  <span className="hidden tablet:inline">Tambah Libur</span>
                </button>
              </div>
            </div>

            {/* Filter Toolbar for Holidays — 1-Row Swipeable Chip Strip */}
            <div className="flex items-center gap-2 overflow-x-auto tablet:overflow-visible no-scrollbar w-full max-w-full pb-0.5 relative z-30">
              {/* Type Filter Buttons */}
              <div className="flex items-center rounded-xl bg-surface-container-low p-1 dark:bg-surface-container-high/30 shrink-0">
                {[
                  { id: 'semua', label: 'Semua' },
                  { id: 'nasional', label: 'Nasional' },
                  { id: 'kampus', label: 'Kampus' },
                  { id: 'semester', label: 'Semester' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHolidayTypeFilter(tab.id)}
                    className={`rounded-lg px-2.5 py-1 text-body-xs font-bold transition-all cursor-pointer ${
                      holidayTypeFilter === tab.id
                        ? 'bg-surface-container-highest text-on-surface shadow-2xs font-extrabold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Prodi Scope Filter with Modern Popover */}
              <HolidayProdiFilterDropdown
                programs={programs}
                selected={holidayProdiFilter}
                onSelect={setHolidayProdiFilter}
              />
            </div>

            {/* List Hari Libur */}
            {loadingHolidays ? (
              <div className="space-y-2.5">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
              </div>
            ) : filteredHolidays.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10">
                <EmptyState
                  icon="event_busy"
                  title="Tidak ada hari libur yang cocok"
                  description={
                    holidays.length === 0
                      ? 'Belum ada hari libur terdaftar. Klik "Sinkron Libur" untuk mengimpor hari libur nasional otomatis.'
                      : 'Coba ubah filter kategori atau scope prodi di atas.'
                  }
                />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
                {filteredHolidays.map((h) => {
                  const isProdiScoped = h.prodi && h.prodi !== 'Semua'
                  return (
                    <div
                      key={h.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 p-3 tablet:p-3.5 dark:bg-surface-container-high/20 transition-all hover:border-secondary/30 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-body-sm text-on-surface truncate">{h.nama}</p>
                          <span
                            className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${
                              h.tipe === 'nasional'
                                ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20'
                                : h.tipe === 'kampus'
                                ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20'
                                : 'bg-secondary/10 text-secondary border border-secondary/20'
                            }`}
                          >
                            {h.tipe || 'nasional'}
                          </span>

                          {/* Prodi Scope Badge */}
                          {isProdiScoped ? (
                            <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                              🎓 {h.prodi}
                            </span>
                          ) : (
                            <span className="rounded-lg bg-surface-container px-2 py-0.5 text-[10px] font-medium text-on-surface-variant">
                              Semua Prodi
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-body-xs text-on-surface-variant mt-1">
                          {h.mulai} {h.selesai && h.selesai !== h.mulai ? `s.d ${h.selesai}` : ''}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeleteHolidayTarget(h)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer shrink-0 border border-outline-variant/15"
                        title="Hapus Hari Libur"
                      >
                        <Icon name="delete" size={15} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Modal Tambah Program Studi ── */}
      {addProdiModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setAddProdiModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in" />
          <div className="relative w-full max-w-md rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 shadow-2xl dark:bg-surface-container-low animate-fade-up space-y-4">
            <header className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name="school" size={20} />
                </span>
                <h3 className="text-title-lg font-bold text-on-surface">Tambah Program Studi</h3>
              </div>
              <button type="button" onClick={() => setAddProdiModalOpen(false)} className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container cursor-pointer">
                <Icon name="close" size={18} />
              </button>
            </header>

            <form onSubmit={handleAddProdi} className="space-y-4">
              <div>
                <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Nama Program Studi</label>
                <input
                  type="text"
                  placeholder="mis. Teknik Biomedis"
                  value={prodiNama}
                  onChange={(e) => setProdiNama(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-3 py-2 text-body-sm font-semibold text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Semester Min</label>
                  <FormSelect
                    value={prodiMin}
                    onChange={(val) => setProdiMin(Number(val))}
                    options={SEMESTER_OPTIONS.map((s) => ({ value: s, label: String(s) }))}
                  />
                </div>
                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Semester Max</label>
                  <FormSelect
                    value={prodiMax}
                    onChange={(val) => setProdiMax(Number(val))}
                    options={SEMESTER_OPTIONS.map((s) => ({ value: s, label: String(s) }))}
                  />
                </div>
              </div>

              {prodiFormError && (
                <p className="text-body-xs font-semibold text-error">{prodiFormError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/15">
                <Button type="button" variant="secondary" onClick={() => setAddProdiModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={savingProdi} className="font-bold">
                  {savingProdi ? 'Menyimpan...' : 'Simpan Prodi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Tambah Hari Libur (Dengan Dukungan Tiap Prodi) ── */}
      {addHolidayModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setAddHolidayModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in" />
          <div className="relative w-full max-w-md rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 shadow-2xl dark:bg-surface-container-low animate-fade-up space-y-4">
            <header className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <Icon name="event_busy" size={20} />
                </span>
                <h3 className="text-title-lg font-bold text-on-surface">Tambah Hari Libur / Agenda</h3>
              </div>
              <button type="button" onClick={() => setAddHolidayModalOpen(false)} className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container cursor-pointer">
                <Icon name="close" size={18} />
              </button>
            </header>

            <form onSubmit={handleAddHoliday} className="space-y-4">
              <div>
                <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Nama Hari Libur / Agenda</label>
                <input
                  type="text"
                  placeholder="mis. Libur Studi Ekskursi / Dies Natalis"
                  value={holidayNama}
                  onChange={(e) => setHolidayNama(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-3 py-2 text-body-sm font-semibold text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Jenis Libur</label>
                  <FormSelect
                    value={holidayTipe}
                    onChange={setHolidayTipe}
                    options={[
                      { value: 'nasional', label: 'Libur Nasional' },
                      { value: 'kampus', label: 'Libur / Cuti Kampus' },
                      { value: 'semester', label: 'Libur Semester' },
                    ]}
                  />
                </div>

                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Cakupan Prodi</label>
                  <FormSelect
                    value={holidayProdi}
                    onChange={setHolidayProdi}
                    options={[
                      { value: 'Semua', label: 'Semua Prodi (Umum)' },
                      ...programs.map((p) => ({
                        value: p.nama,
                        label: `Khusus: ${p.nama}`,
                      })),
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={holidayMulai}
                    onChange={(e) => setHolidayMulai(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-3 py-2 font-mono text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={holidaySelesai}
                    onChange={(e) => setHolidaySelesai(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-3 py-2 font-mono text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {holidayFormError && (
                <p className="text-body-xs font-semibold text-error">{holidayFormError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/15">
                <Button type="button" variant="secondary" onClick={() => setAddHolidayModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={savingHoliday} className="font-bold">
                  {savingHoliday ? 'Menyimpan...' : 'Simpan Libur'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Sinkron Libur Nasional (Pilihan Tahun 2026 / 2027) ── */}
      {syncHolidayModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setSyncHolidayModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in" />
          <div className="relative w-full max-w-md rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 shadow-2xl dark:bg-surface-container-low animate-fade-up space-y-4">
            <header className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <Icon name="cloud_sync" size={20} />
                </span>
                <h3 className="text-title-lg font-bold text-on-surface">Sinkron Libur Nasional</h3>
              </div>
              <button type="button" onClick={() => setSyncHolidayModalOpen(false)} className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container cursor-pointer">
                <Icon name="close" size={18} />
              </button>
            </header>

            <div className="space-y-3">
              <p className="text-body-sm text-on-surface-variant">
                Impor daftar resmi hari libur nasional Indonesia secara otomatis. Sistem akan melewati libur yang sudah terdaftar untuk mencegah data duplikat.
              </p>

              <div>
                <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Pilih Tahun Kalender</label>
                <div className="grid grid-cols-2 gap-3">
                  {[2026, 2027].map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setSelectedSyncYear(year)}
                      className={`rounded-2xl border p-3 text-center transition-all cursor-pointer ${
                        selectedSyncYear === year
                          ? 'border-secondary bg-secondary/10 text-secondary font-bold shadow-xs'
                          : 'border-outline-variant/30 bg-surface-container-low/40 text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      <span className="block text-title-md font-bold">{year}</span>
                      <span className="text-[11px] font-medium opacity-80">
                        {NATIONAL_HOLIDAYS_PRESET[year]?.length || 0} Hari Libur Resmi
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-surface-container-low p-3 text-[11px] text-on-surface-variant space-y-1">
                <p className="font-bold text-on-surface">Termasuk di dalamnya:</p>
                <p>• Hari Raya Idul Fitri & Cuti Bersama</p>
                <p>• Tahun Baru Masehi, Imlek, Nyepi, Waisak, Natal</p>
                <p>• Hari Kemerdekaan RI, Lahir Pancasila, Maulid Nabi, dsb.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/15">
              <Button type="button" variant="secondary" onClick={() => setSyncHolidayModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="button"
                disabled={syncingHolidays}
                onClick={() => handleSyncNationalHolidays(selectedSyncYear)}
                className="font-bold"
              >
                {syncingHolidays ? (
                  <Icon name="progress_activity" size={16} className="mr-1.5 animate-spin" />
                ) : (
                  <Icon name="download" size={16} className="mr-1.5" />
                )}
                {syncingHolidays ? 'Menyinkronkan...' : `Impor Libur ${selectedSyncYear}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Dialog: Batas Kalender Akademik & Live MEK Calculator ── */}
      {calendarModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setCalendarModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />
          <div className="relative w-full max-w-2xl rounded-3xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl overflow-hidden z-10 animate-fade-up">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-outline-variant/15 p-4 tablet:p-5 bg-surface-container-low/50">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <Icon name="tune" size={22} />
                </span>
                <div>
                  <h2 className="text-title-md font-bold text-on-surface">
                    Batas Kalender Akademik & MEK
                  </h2>
                  <p className="text-body-xs text-on-surface-variant font-medium">
                    Formula kalkulasi dinamis untuk TA berjalan dan estimasi Minggu Efektif Kuliah.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-label-caps font-bold text-primary">
                  TA: {currentComputedTA}
                </span>
                <button
                  type="button"
                  onClick={() => setCalendarModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-surface-variant text-on-surface-variant transition-colors cursor-pointer"
                  title="Tutup Modal"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Form & MEK Calculator */}
            <form onSubmit={handleSaveCalendar} className="p-4 tablet:p-5 space-y-4">
              {/* MEK Live Calculator Summary Card */}
              <div className="grid grid-cols-2 tablet:grid-cols-4 gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 p-3 dark:bg-primary/10">
                <div>
                  <p className="text-label-caps uppercase font-bold text-on-surface-variant">Semester Berjalan</p>
                  <p className="text-body-sm font-bold text-primary mt-0.5">{mekStats.termLabel}</p>
                </div>
                <div>
                  <p className="text-label-caps uppercase font-bold text-on-surface-variant">Total Rentang</p>
                  <p className="text-body-sm font-bold text-on-surface mt-0.5">{mekStats.totalWeeks} Minggu ({mekStats.totalDays} Hari)</p>
                </div>
                <div>
                  <p className="text-label-caps uppercase font-bold text-on-surface-variant">Hari Libur di Semester</p>
                  <p className="text-body-sm font-bold text-secondary mt-0.5">{mekStats.holidayCount} Agenda Libur</p>
                </div>
                <div>
                  <p className="text-label-caps uppercase font-bold text-emerald-700 dark:text-emerald-400">Minggu Efektif (MEK)</p>
                  <p className="text-body-sm font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">~{mekStats.effectiveWeeks} Minggu Kuliah</p>
                </div>
              </div>

              {/* Date pickers for Ganjil & Genap */}
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3.5">
                {/* Semester Ganjil */}
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-3.5 space-y-2.5 dark:bg-surface-container-high/20">
                  <h3 className="text-body-xs font-bold text-on-surface flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Semester Ganjil (1, 3, 5, 7)
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Mulai (Tgl & Bln)</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={customCal.ganjilStartDay}
                          onChange={(e) => setCustomCal((c) => ({ ...c, ganjilStartDay: e.target.value }))}
                          className="w-14 shrink-0 rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-1.5 text-center font-mono text-body-sm font-bold text-on-surface shadow-2xs"
                        />
                        <MonthSelectDropdown
                          value={customCal.ganjilStartMonth}
                          onChange={(idx) => setCustomCal((c) => ({ ...c, ganjilStartMonth: idx }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Selesai (Tgl & Bln)</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={customCal.ganjilEndDay}
                          onChange={(e) => setCustomCal((c) => ({ ...c, ganjilEndDay: e.target.value }))}
                          className="w-14 shrink-0 rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-1.5 text-center font-mono text-body-sm font-bold text-on-surface shadow-2xs"
                        />
                        <MonthSelectDropdown
                          value={customCal.ganjilEndMonth}
                          onChange={(idx) => setCustomCal((c) => ({ ...c, ganjilEndMonth: idx }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Semester Genap */}
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-3.5 space-y-2.5 dark:bg-surface-container-high/20">
                  <h3 className="text-body-xs font-bold text-on-surface flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Semester Genap (2, 4, 6, 8)
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Mulai (Tgl & Bln)</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={customCal.genapStartDay}
                          onChange={(e) => setCustomCal((c) => ({ ...c, genapStartDay: e.target.value }))}
                          className="w-14 shrink-0 rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-1.5 text-center font-mono text-body-sm font-bold text-on-surface shadow-2xs"
                        />
                        <MonthSelectDropdown
                          value={customCal.genapStartMonth}
                          onChange={(idx) => setCustomCal((c) => ({ ...c, genapStartMonth: idx }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Selesai (Tgl & Bln)</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={customCal.genapEndDay}
                          onChange={(e) => setCustomCal((c) => ({ ...c, genapEndDay: e.target.value }))}
                          className="w-14 shrink-0 rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-1.5 text-center font-mono text-body-sm font-bold text-on-surface shadow-2xs"
                        />
                        <MonthSelectDropdown
                          value={customCal.genapEndMonth}
                          onChange={(idx) => setCustomCal((c) => ({ ...c, genapEndMonth: idx }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/15">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCalendarModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-body-xs font-bold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={savingCal}
                  className="rounded-xl px-5 py-2 text-body-xs font-bold shadow-xs cursor-pointer"
                >
                  {savingCal ? (
                    <Icon name="progress_activity" size={16} className="mr-1.5 animate-spin" />
                  ) : (
                    <Icon name="save" size={16} className="mr-1.5" />
                  )}
                  {savingCal ? 'Menyimpan...' : 'Simpan Batas Kalender'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Dialog Konfirmasi Hapus Prodi ── */}
      <ConfirmDialog
        open={Boolean(deleteProdiTarget)}
        title="Hapus Program Studi?"
        description={`Program Studi "${deleteProdiTarget?.nama}" akan dihapus dari daftar master.`}
        confirmLabel="Hapus Prodi"
        onConfirm={handleDeleteProdi}
        onCancel={() => setDeleteProdiTarget(null)}
      />

      {/* ── Dialog Konfirmasi Hapus Libur ── */}
      <ConfirmDialog
        open={Boolean(deleteHolidayTarget)}
        title="Hapus Hari Libur?"
        description={`Hari libur "${deleteHolidayTarget?.nama}" (${deleteHolidayTarget?.mulai}) akan dihapus dari kalender.`}
        confirmLabel="Hapus Libur"
        onConfirm={handleDeleteHoliday}
        onCancel={() => setDeleteHolidayTarget(null)}
      />
    </div>
  )
}

