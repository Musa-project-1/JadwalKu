import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { FormSelect } from '../../components/FormSelect'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { addDocument, deleteDocument, setDocument } from '../../lib/adminData'
import { appendHistory } from '../../lib/publishHelpers'
import { ACADEMIC_CALENDAR, deriveTahunAjaran, deriveTerm, getTermLabel } from '../../lib/tahunAjaran'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function todayISO() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
}

function AcademicCalendarForm({ calDoc, actor, setBanner }) {
  const [savingCal, setSavingCal] = useState(false)
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

  const currentComputedTA = deriveTahunAjaran(new Date(), calDoc)
  const currentComputedTerm = deriveTerm(new Date(), calDoc)

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
    setSavingCal(false)
  }

  return (
    <form
      onSubmit={handleSaveCalendar}
      className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm dark:bg-surface-container-low dark:border-outline-variant/15 space-y-5"
    >
      <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:justify-between">
        <div>
          <h3 className="text-title-md font-bold text-on-surface flex items-center gap-2">
            <Icon name="tune" size={20} className="text-primary" />
            Batas Kalender Akademik & Tahun Ajaran
          </h3>
          <p className="text-body-xs text-on-surface-variant mt-0.5">
            Menentukan formula perhitungan Tahun Ajaran berjalan dan masa libur semester otomatis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
            TA Aktif: {currentComputedTA}
          </span>
          <span className="rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-bold text-secondary">
            Term: {getTermLabel(currentComputedTerm)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 pt-2">
        {/* Semester Ganjil Bounds */}
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-4 space-y-3 dark:bg-surface-container-high/30">
          <h4 className="text-body-md font-bold text-on-surface flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Semester Ganjil (1, 3, 5, 7)
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">Mulai (Tgl & Bln)</label>
              <div className="flex gap-1.5 items-center">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={customCal.ganjilStartDay}
                  onChange={(e) => setCustomCal((c) => ({ ...c, ganjilStartDay: e.target.value }))}
                  className="w-14 rounded-xl border border-outline-variant/30 bg-surface px-2 py-1.5 text-center text-body-sm font-bold text-on-surface"
                />
                <FormSelect
                  value={customCal.ganjilStartMonth}
                  onChange={(val) => setCustomCal((c) => ({ ...c, ganjilStartMonth: Number(val) }))}
                  options={MONTH_NAMES.map((m, idx) => ({ value: idx, label: m }))}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">Selesai (Tgl & Bln)</label>
              <div className="flex gap-1.5 items-center">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={customCal.ganjilEndDay}
                  onChange={(e) => setCustomCal((c) => ({ ...c, ganjilEndDay: e.target.value }))}
                  className="w-14 rounded-xl border border-outline-variant/30 bg-surface px-2 py-1.5 text-center text-body-sm font-bold text-on-surface"
                />
                <FormSelect
                  value={customCal.ganjilEndMonth}
                  onChange={(val) => setCustomCal((c) => ({ ...c, ganjilEndMonth: Number(val) }))}
                  options={MONTH_NAMES.map((m, idx) => ({ value: idx, label: m }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Semester Genap Bounds */}
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-4 space-y-3 dark:bg-surface-container-high/30">
          <h4 className="text-body-md font-bold text-on-surface flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Semester Genap (2, 4, 6, 8)
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">Mulai (Tgl & Bln)</label>
              <div className="flex gap-1.5 items-center">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={customCal.genapStartDay}
                  onChange={(e) => setCustomCal((c) => ({ ...c, genapStartDay: e.target.value }))}
                  className="w-14 rounded-xl border border-outline-variant/30 bg-surface px-2 py-1.5 text-center text-body-sm font-bold text-on-surface"
                />
                <FormSelect
                  value={customCal.genapStartMonth}
                  onChange={(val) => setCustomCal((c) => ({ ...c, genapStartMonth: Number(val) }))}
                  options={MONTH_NAMES.map((m, idx) => ({ value: idx, label: m }))}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">Selesai (Tgl & Bln)</label>
              <div className="flex gap-1.5 items-center">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={customCal.genapEndDay}
                  onChange={(e) => setCustomCal((c) => ({ ...c, genapEndDay: e.target.value }))}
                  className="w-14 rounded-xl border border-outline-variant/30 bg-surface px-2 py-1.5 text-center text-body-sm font-bold text-on-surface"
                />
                <FormSelect
                  value={customCal.genapEndMonth}
                  onChange={(val) => setCustomCal((c) => ({ ...c, genapEndMonth: Number(val) }))}
                  options={MONTH_NAMES.map((m, idx) => ({ value: idx, label: m }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={savingCal} className="cursor-pointer">
          <Icon name="save" size={18} className="mr-1" />
          {savingCal ? 'Menyimpan...' : 'Simpan Batas Kalender'}
        </Button>
      </div>
    </form>
  )
}

export default function ManageHolidays() {
  const { data: holidays, loading } = useFirestore('libur')
  const { data: settingsDocs } = useFirestore('settings')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

  const [tanggal, setTanggal] = useState('')
  const [label, setLabel] = useState('')
  const [formError, setFormError] = useState('')
  const [banner, setBanner] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  // Dokumen kalender akademik dari Firestore
  const calDoc = settingsDocs.find((d) => d.id === 'academicCalendar')

  const today = todayISO()

  const sorted = useMemo(
    () => [...holidays].sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal))),
    [holidays],
  )

  async function handleAdd(e) {
    e.preventDefault()
    setFormError('')
    if (!tanggal) {
      setFormError('Tanggal wajib dipilih.')
      return
    }
    if (!label.trim()) {
      setFormError('Keterangan libur wajib diisi.')
      return
    }
    // Tolak tanggal ganda — tanpa ini libur yang sama bisa masuk berkali-kali.
    if (holidays.some((h) => String(h.tanggal) === tanggal)) {
      setFormError(`Tanggal ${tanggal} sudah ada di daftar libur.`)
      return
    }

    setSaving(true)
    const data = { tanggal, label: label.trim() }
    const result = await addDocument('libur', data, actor)
    if (result.ok) {
      await appendHistory({
        entitas: 'libur',
        field: 'tambah',
        nilaiLama: null,
        nilaiBaru: data,
        aktor: actor,
      })
      setBanner({ ok: true, message: `Libur "${data.label}" ditambahkan.` })
      setTanggal('')
      setLabel('')
    } else {
      setBanner({ ok: false, message: result.error })
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const result = await deleteDocument('libur', deleteTarget.id)
    setDeleteTarget(null)
    if (result.ok) {
      await appendHistory({
        entitas: 'libur',
        field: 'hapus',
        nilaiLama: deleteTarget,
        nilaiBaru: null,
        aktor: actor,
      })
      setBanner({ ok: true, message: 'Hari libur dihapus.' })
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  return (
    <div className="space-y-lg">
      <header>
        <div className="flex items-center gap-md">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tertiary-container/50 dark:bg-tertiary-container/25 text-tertiary">
            <Icon name="event_note" size={26} />
          </span>
          <div>
            <h2 className="text-headline-lg font-bold text-on-surface">Kelola Libur & Kalender Akademik</h2>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Atur batas tanggal semester dan hari libur perkuliahan kampus.
            </p>
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

      {/* Form Konfigurasi Kalender Akademik */}
      <AcademicCalendarForm
        key={calDoc?.updatedAt || 'default-cal'}
        calDoc={calDoc}
        actor={actor}
        setBanner={setBanner}
      />

      {/* Form tambah libur */}
      <form
        onSubmit={handleAdd}
        className="rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low"
      >
        <h3 className="mb-md text-title-md text-on-surface">Tambah Hari Libur Kuliah</h3>
        <div className="grid gap-md tablet:grid-cols-[auto_1fr_auto] tablet:items-end">
          <Input
            label="Tanggal"
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
          />
          <Input
            label="Keterangan"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="mis. Cuti Bersama Idul Fitri"
          />
          <Button type="submit" disabled={saving} className="justify-center">
            <Icon name="add" size={20} />
            Tambah
          </Button>
        </div>
        {formError && <p className="mt-sm text-body-sm text-error">{formError}</p>}
      </form>

      {/* Daftar */}
      {loading ? (
        <div className="space-y-sm">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="calendar_today"
          title="Belum ada hari libur"
          description="Tambahkan tanggal libur agar kelas otomatis disembunyikan pada hari tersebut."
        />
      ) : (
        <ul className="space-y-sm">
          {sorted.map((holiday) => {
            const isPast = String(holiday.tanggal) < today
            const dayNumber = Number(String(holiday.tanggal).slice(8, 10))
            return (
              <li
                key={holiday.id}
                className={`flex items-center gap-md rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low ${
                  isPast ? 'opacity-60' : ''
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <span className="text-title-md font-bold leading-none">{dayNumber}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-on-surface">
                    {holiday.label}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    {dateFormatter.format(new Date(`${holiday.tanggal}T00:00:00`))}
                    {isPast && <span className="ml-sm text-label-caps">Sudah lewat</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(holiday)}
                  className="rounded-full p-sm text-on-surface-variant hover:bg-error/10 hover:text-error"
                  aria-label={`Hapus ${holiday.label}`}
                >
                  <Icon name="delete" size={20} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus hari libur?"
        description={`"${deleteTarget?.label}" akan dihapus dari daftar libur.`}
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
