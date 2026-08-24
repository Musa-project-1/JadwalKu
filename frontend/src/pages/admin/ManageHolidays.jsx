import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { addDocument, deleteDocument } from '../../lib/adminData'
import { appendHistory } from '../../lib/publishHelpers'

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

export default function ManageHolidays() {
  const { data: holidays, loading } = useFirestore('libur')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

  const [tanggal, setTanggal] = useState('')
  const [label, setLabel] = useState('')
  const [formError, setFormError] = useState('')
  const [banner, setBanner] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

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
            <Icon name="beach_access" size={26} />
          </span>
          <h2 className="text-headline-lg font-bold text-on-surface">Kelola Hari Libur</h2>
        </div>
        <p className="text-body-lg text-on-surface-variant">
          Tanggal libur otomatis menyembunyikan kelas pada tampilan mahasiswa.
        </p>
      </header>

      {banner && (
        <StatusBanner
          ok={banner.ok}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* Form tambah */}
      <form
        onSubmit={handleAdd}
        className="rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low"
      >
        <h3 className="mb-md text-title-md text-on-surface">Tambah Hari Libur</h3>
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
