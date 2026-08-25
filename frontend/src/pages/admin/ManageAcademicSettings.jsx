import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { addDocument, deleteDocument, setDocument, updateDocument } from '../../lib/adminData'
import { appendHistory, syncProdiFromExistingData } from '../../lib/publishHelpers'
import { ACADEMIC_CALENDAR, deriveTahunAjaran, deriveTerm, getTermLabel } from '../../lib/tahunAjaran'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

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
      setBanner({ ok: true, message: 'Batas Kalender Akademik berhasil disimpan.' })
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

  // ── 3. Holidays State ──
  const [addHolidayModalOpen, setAddHolidayModalOpen] = useState(false)
  const [holidayNama, setHolidayNama] = useState('')
  const [holidayMulai, setHolidayMulai] = useState(todayISO())
  const [holidaySelesai, setHolidaySelesai] = useState(todayISO())
  const [holidayTipe, setHolidayTipe] = useState('nasional')
  const [holidayFormError, setHolidayFormError] = useState('')
  const [deleteHolidayTarget, setDeleteHolidayTarget] = useState(null)
  const [savingHoliday, setSavingHoliday] = useState(false)

  const sortedHolidays = useMemo(
    () => [...holidays].sort((a, b) => String(b.mulai || '').localeCompare(String(a.mulai || ''))),
    [holidays],
  )

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
        detail: `Tambah libur ${data.nama} (${data.mulai})`,
      })
      setBanner({ ok: true, message: `Hari libur "${data.nama}" berhasil ditambahkan.` })
      setHolidayNama('')
      setHolidayMulai(todayISO())
      setHolidaySelesai(todayISO())
      setAddHolidayModalOpen(false)
    } else {
      setBanner({ ok: false, message: result.error })
    }
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

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* ── 1. Header & Live Quick Stats ── */}
      <header className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-container/60 text-secondary shadow-xs dark:bg-secondary-container/30">
            <Icon name="settings_suggest" size={26} />
          </span>
          <div>
            <h1 className="text-headline-lg font-bold tracking-tight text-on-surface">Master & Pengaturan Akademik</h1>
            <p className="text-body-sm font-medium text-on-surface-variant mt-0.5">
              Pusat konfigurasi kalender akademik, master program studi, dan hari libur kampus.
            </p>
          </div>
        </div>

        {/* Quick Stats Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-2.5 py-1 dark:bg-primary/20">
            <Icon name="school" size={14} className="text-primary" />
            <span className="text-[11px] font-bold text-primary">{programs.length} Prodi</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-secondary/20 bg-secondary/10 px-2.5 py-1 dark:bg-secondary/20">
            <Icon name="event_available" size={14} className="text-secondary" />
            <span className="text-[11px] font-bold text-secondary">{holidays.length} Hari Libur</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 dark:bg-indigo-500/20">
            <Icon name="event" size={14} className="text-indigo-700 dark:text-indigo-300" />
            <span className="font-mono text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
              TA {currentComputedTA}
            </span>
          </div>
        </div>
      </header>

      {banner && (
        <StatusBanner
          ok={banner.ok}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* ── 2. Section 1: Kalender Akademik ── */}
      <section className="space-y-3">
        <form
          onSubmit={handleSaveCalendar}
          className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-xs dark:bg-surface-container-low dark:border-outline-variant/15 space-y-5"
        >
          <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:justify-between border-b border-outline-variant/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon name="tune" size={22} />
              </span>
              <div>
                <h2 className="text-title-md font-bold tracking-tight text-on-surface">
                  Batas Kalender Akademik & Tahun Ajaran
                </h2>
                <p className="text-body-xs font-medium text-on-surface-variant">
                  Formula kalkulasi dinamis untuk Tahun Ajaran berjalan dan masa libur semester otomatis.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-body-xs font-bold text-primary">
                TA Aktif: {currentComputedTA}
              </span>
              <span className="rounded-full bg-secondary/10 px-3 py-1 text-body-xs font-bold text-secondary">
                Term: {getTermLabel(currentComputedTerm)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 pt-1">
            {/* Semester Ganjil Bounds */}
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-4 space-y-3 dark:bg-surface-container-high/20">
              <h3 className="text-body-md font-bold text-on-surface flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Semester Ganjil (1, 3, 5, 7)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Mulai (Tgl & Bln)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={customCal.ganjilStartDay}
                      onChange={(e) => setCustomCal((c) => ({ ...c, ganjilStartDay: e.target.value }))}
                      className="w-14 rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-1.5 text-center font-mono text-body-sm font-bold text-on-surface"
                    />
                    <select
                      value={customCal.ganjilStartMonth}
                      onChange={(e) => setCustomCal((c) => ({ ...c, ganjilStartMonth: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-1.5 text-body-sm font-semibold text-on-surface"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Selesai (Tgl & Bln)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={customCal.ganjilEndDay}
                      onChange={(e) => setCustomCal((c) => ({ ...c, ganjilEndDay: e.target.value }))}
                      className="w-14 rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-1.5 text-center font-mono text-body-sm font-bold text-on-surface"
                    />
                    <select
                      value={customCal.ganjilEndMonth}
                      onChange={(e) => setCustomCal((c) => ({ ...c, ganjilEndMonth: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-1.5 text-body-sm font-semibold text-on-surface"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Semester Genap Bounds */}
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-4 space-y-3 dark:bg-surface-container-high/20">
              <h3 className="text-body-md font-bold text-on-surface flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Semester Genap (2, 4, 6, 8)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Mulai (Tgl & Bln)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={customCal.genapStartDay}
                      onChange={(e) => setCustomCal((c) => ({ ...c, genapStartDay: e.target.value }))}
                      className="w-14 rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-1.5 text-center font-mono text-body-sm font-bold text-on-surface"
                    />
                    <select
                      value={customCal.genapStartMonth}
                      onChange={(e) => setCustomCal((c) => ({ ...c, genapStartMonth: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-1.5 text-body-sm font-semibold text-on-surface"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Selesai (Tgl & Bln)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={customCal.genapEndDay}
                      onChange={(e) => setCustomCal((c) => ({ ...c, genapEndDay: e.target.value }))}
                      className="w-14 rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-1.5 text-center font-mono text-body-sm font-bold text-on-surface"
                    />
                    <select
                      value={customCal.genapEndMonth}
                      onChange={(e) => setCustomCal((c) => ({ ...c, genapEndMonth: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-1.5 text-body-sm font-semibold text-on-surface"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={savingCal} className="font-bold cursor-pointer">
              <Icon name="save" size={18} className="mr-1.5" />
              {savingCal ? 'Menyimpan...' : 'Simpan Batas Kalender'}
            </Button>
          </div>
        </form>
      </section>

      {/* ── 3. Section 2 & 3: Master Program Studi & Hari Libur ── */}
      <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6">
        {/* ── Panel 1: Master Program Studi ── */}
        <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-xs dark:bg-surface-container-low dark:border-outline-variant/15 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:justify-between border-b border-outline-variant/10 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name="school" size={20} />
                </span>
                <div>
                  <h2 className="text-title-md font-bold tracking-tight text-on-surface">Program Studi ({programs.length})</h2>
                  <p className="text-body-xs font-medium text-on-surface-variant">Master data jurusan & rentang semester</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncProdi}
                  disabled={syncingProdi}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-3 py-1.5 text-[12px] font-bold text-on-surface shadow-2xs hover:border-primary hover:text-primary cursor-pointer transition-colors whitespace-nowrap"
                  title="Sinkronisasi dari data Jadwal & MK"
                >
                  <Icon name="sync" size={14} className={syncingProdi ? 'animate-spin' : ''} />
                  <span>{syncingProdi ? 'Menyinkronkan...' : 'Sinkron'}</span>
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-[12px] font-bold text-on-primary shadow-xs hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Icon name="add_circle" size={15} />
                  <span>Tambah Prodi</span>
                </button>
              </div>
            </div>

            {/* List Program Studi */}
            {loadingProdi ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
              </div>
            ) : sortedProdi.length === 0 ? (
              <EmptyState icon="school" title="Belum ada program studi" description="Tambahkan prodi baru atau klik sinkron otomatis." />
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {sortedProdi.map((p) => {
                  const isEditing = editingProdiId === p.id
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 rounded-2xl border border-outline-variant/15 bg-surface-container-low/30 p-3.5 dark:bg-surface-container-high/15 transition-colors hover:border-primary/30"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            type="text"
                            value={editProdiDraft.nama}
                            onChange={(e) => setEditProdiDraft((d) => ({ ...d, nama: e.target.value }))}
                            className="flex-1 rounded-xl border border-outline-variant/30 bg-surface px-2.5 py-1.5 text-body-sm font-semibold text-on-surface"
                          />
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              max="14"
                              value={editProdiDraft.semesterMin}
                              onChange={(e) => setEditProdiDraft((d) => ({ ...d, semesterMin: Number(e.target.value) }))}
                              className="w-12 rounded-xl border border-outline-variant/30 bg-surface px-2 py-1.5 text-center text-body-xs font-bold"
                            />
                            <span>–</span>
                            <input
                              type="number"
                              min="1"
                              max="14"
                              value={editProdiDraft.semesterMax}
                              onChange={(e) => setEditProdiDraft((d) => ({ ...d, semesterMax: Number(e.target.value) }))}
                              className="w-12 rounded-xl border border-outline-variant/30 bg-surface px-2 py-1.5 text-center text-body-xs font-bold"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEditProdi(p)}
                              className="rounded-lg bg-primary/10 px-2 py-1 text-body-xs font-bold text-primary hover:bg-primary/20"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProdiId(null)}
                              className="rounded-lg px-2 py-1 text-body-xs font-bold text-on-surface-variant hover:bg-surface-container"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="min-w-0">
                            <p className="font-bold text-body-md text-on-surface truncate">{p.nama}</p>
                            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary mt-0.5">
                              Semester {p.semesterMin ?? 1} – {p.semesterMax ?? 8}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProdiId(p.id)
                                setEditProdiDraft({ nama: p.nama, semesterMin: p.semesterMin ?? 1, semesterMax: p.semesterMax ?? 8 })
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer"
                              title="Edit Prodi"
                            >
                              <Icon name="edit" size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteProdiTarget(p)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer"
                              title="Hapus Prodi"
                            >
                              <Icon name="delete" size={16} />
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

        {/* ── Panel 2: Hari Libur & Cuti Kampus ── */}
        <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-xs dark:bg-surface-container-low dark:border-outline-variant/15 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:justify-between border-b border-outline-variant/10 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <Icon name="event_busy" size={20} />
                </span>
                <div>
                  <h2 className="text-title-md font-bold tracking-tight text-on-surface">Hari Libur & Cuti ({holidays.length})</h2>
                  <p className="text-body-xs font-medium text-on-surface-variant">Libur nasional dan cuti bersama akademik</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setHolidayNama('')
                  setHolidayMulai(todayISO())
                  setHolidaySelesai(todayISO())
                  setHolidayTipe('nasional')
                  setHolidayFormError('')
                  setAddHolidayModalOpen(true)
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-1.5 text-[12px] font-bold text-on-secondary shadow-xs hover:bg-secondary/90 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Icon name="add_circle" size={15} />
                <span>Tambah Libur</span>
              </button>
            </div>

            {/* List Hari Libur */}
            {loadingHolidays ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
              </div>
            ) : sortedHolidays.length === 0 ? (
              <EmptyState icon="event_busy" title="Belum ada data hari libur" description="Tambahkan agenda libur melalui tombol di atas." />
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {sortedHolidays.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-outline-variant/15 bg-surface-container-low/30 p-3.5 dark:bg-surface-container-high/15 transition-colors hover:border-secondary/30"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-body-md text-on-surface truncate">{h.nama}</p>
                        <span className="rounded-md bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary uppercase">
                          {h.tipe || 'nasional'}
                        </span>
                      </div>
                      <p className="font-mono text-body-xs text-on-surface-variant mt-0.5">
                        {h.mulai} {h.selesai && h.selesai !== h.mulai ? `s.d ${h.selesai}` : ''}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeleteHolidayTarget(h)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer"
                      title="Hapus Hari Libur"
                    >
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                ))}
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
                  <select
                    value={prodiMin}
                    onChange={(e) => setProdiMin(Number(e.target.value))}
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-2.5 py-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  >
                    {SEMESTER_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Semester Max</label>
                  <select
                    value={prodiMax}
                    onChange={(e) => setProdiMax(Number(e.target.value))}
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-2.5 py-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  >
                    {SEMESTER_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
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

      {/* ── Modal Tambah Hari Libur ── */}
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
                  placeholder="mis. Hari Raya Idul Fitri"
                  value={holidayNama}
                  onChange={(e) => setHolidayNama(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-3 py-2 text-body-sm font-semibold text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-label-caps uppercase text-on-surface-variant block mb-1">Jenis Libur</label>
                <select
                  value={holidayTipe}
                  onChange={(e) => setHolidayTipe(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-3 py-2 text-body-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                >
                  <option value="nasional">Libur Nasional</option>
                  <option value="kampus">Libur / Cuti Kampus</option>
                  <option value="semester">Libur Semester</option>
                </select>
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

