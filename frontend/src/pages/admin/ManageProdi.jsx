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
import { addDocument, deleteDocument, updateDocument } from '../../lib/adminData'
import { appendHistory, syncProdiFromExistingData } from '../../lib/publishHelpers'

const SEMESTER_OPTIONS = Array.from({ length: 14 }, (_, i) => i + 1)

export default function ManageProdi() {
  const { data: programs, loading } = useFirestore('prodi')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

  const [nama, setNama] = useState('')
  const [semesterMin, setSemesterMin] = useState(1)
  const [semesterMax, setSemesterMax] = useState(8)
  const [formError, setFormError] = useState('')
  const [banner, setBanner] = useState(null) // { ok, message }
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({ nama: '', semesterMin: 1, semesterMax: 8 })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const sorted = useMemo(
    () => [...programs].sort((a, b) => a.nama.localeCompare(b.nama, 'id')),
    [programs],
  )

  async function handleSync() {
    setSyncing(true)
    setBanner(null)
    const result = await syncProdiFromExistingData(actor)
    setSyncing(false)
    if (result.ok) {
      setBanner({
        ok: true,
        message: result.count > 0
          ? `${result.count} program studi berhasil disinkronkan dari data Jadwal & Mata Kuliah.`
          : 'Semua program studi sudah sinkron atau belum ada data jadwal/MK.',
      })
    } else {
      setBanner({ ok: false, message: `Gagal sinkronisasi: ${result.error}` })
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    setFormError('')
    if (!nama.trim()) {
      setFormError('Nama prodi wajib diisi.')
      return
    }
    if (semesterMin >= semesterMax) {
      setFormError('Semester awal harus lebih kecil dari semester akhir.')
      return
    }

    setSaving(true)
    const data = { nama: nama.trim(), semesterMin, semesterMax }
    const result = await setDocSafe(data)
    setSaving(false)

    if (result.ok) {
      setBanner({ ok: true, message: `Prodi "${data.nama}" ditambahkan.` })
      setNama('')
      setSemesterMin(1)
      setSemesterMax(8)
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  async function setDocSafe(data) {
    const result = await addDocument('prodi', data, actor)
    if (result.ok) {
      await appendHistory({
        entitas: 'prodi',
        field: 'tambah',
        nilaiLama: null,
        nilaiBaru: data,
        aktor: actor,
      })
    }
    return result
  }

  function startEdit(program) {
    setEditingId(program.id)
    setEditDraft({
      nama: program.nama,
      semesterMin: program.semesterMin,
      semesterMax: program.semesterMax,
    })
  }

  async function handleEditSave(program) {
    if (!editDraft.nama.trim() || editDraft.semesterMin >= editDraft.semesterMax) {
      setBanner({ ok: false, message: 'Nama wajib diisi dan semester awal < akhir.' })
      return
    }
    const result = await updateDocument('prodi', program.id, editDraft, actor)
    if (result.ok) {
      await appendHistory({
        entitas: 'prodi',
        field: 'edit',
        nilaiLama: { nama: program.nama, semesterMin: program.semesterMin, semesterMax: program.semesterMax },
        nilaiBaru: editDraft,
        aktor: actor,
      })
      setBanner({ ok: true, message: 'Perubahan prodi tersimpan.' })
      setEditingId(null)
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const result = await deleteDocument('prodi', deleteTarget.id)
    setDeleteTarget(null)
    if (result.ok) {
      await appendHistory({
        entitas: 'prodi',
        field: 'hapus',
        nilaiLama: deleteTarget,
        nilaiBaru: null,
        aktor: actor,
      })
      setBanner({ ok: true, message: 'Prodi dihapus.' })
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  return (
    <div className="space-y-lg">
      <header className="flex flex-col gap-sm tablet:flex-row tablet:items-center tablet:justify-between">
        <div>
          <div className="flex items-center gap-md">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-container/50 dark:bg-primary-container/25 text-primary">
              <Icon name="list_alt" size={26} />
            </span>
            <h2 className="text-headline-lg font-bold text-on-surface">Kelola Daftar Prodi</h2>
          </div>
          <p className="text-body-lg text-on-surface-variant">
            Daftar program studi beserta rentang semesternya.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleSync}
          disabled={syncing}
          className="shrink-0 gap-1.5 self-start tablet:self-auto"
        >
          <Icon name="sync" size={18} className={syncing ? 'animate-spin' : ''} />
          Sinkronkan dari Jadwal & MK
        </Button>
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
        <h3 className="mb-md text-title-md text-on-surface">Tambah Prodi</h3>
        <div className="grid gap-md tablet:grid-cols-[1fr_auto_auto_auto] tablet:items-end">
          <Input
            label="Nama Prodi"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="mis. Informatika"
          />
          <label className="block">
            <span className="mb-1 block text-body-sm text-on-surface-variant">Sem. Awal</span>
            <select
              value={semesterMin}
              onChange={(e) => setSemesterMin(Number(e.target.value))}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface dark:bg-surface-container-low"
            >
              {SEMESTER_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-body-sm text-on-surface-variant">Sem. Akhir</span>
            <select
              value={semesterMax}
              onChange={(e) => setSemesterMax(Number(e.target.value))}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface dark:bg-surface-container-low"
            >
              {SEMESTER_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
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
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="list_alt"
          title="Belum ada prodi terdaftar"
          description="Tambahkan program studi agar mahasiswa bisa memilih prodi & semester saat onboarding."
        />
      ) : (
        <ul className="space-y-sm">
          {sorted.map((program) => (
            <li
              key={program.id}
              className="flex flex-wrap items-center gap-md rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low"
            >
              {editingId === program.id ? (
                <div className="grid flex-1 gap-sm tablet:grid-cols-[1fr_auto_auto_auto] tablet:items-center">
                  <Input
                    value={editDraft.nama}
                    onChange={(e) => setEditDraft((d) => ({ ...d, nama: e.target.value }))}
                  />
                  <select
                    value={editDraft.semesterMin}
                    onChange={(e) => setEditDraft((d) => ({ ...d, semesterMin: Number(e.target.value) }))}
                    className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface dark:bg-surface-container-low"
                  >
                    {SEMESTER_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <select
                    value={editDraft.semesterMax}
                    onChange={(e) => setEditDraft((d) => ({ ...d, semesterMax: Number(e.target.value) }))}
                    className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface dark:bg-surface-container-low"
                  >
                    {SEMESTER_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <div className="flex gap-xs">
                    <Button onClick={() => handleEditSave(program)} className="!px-3 !py-2">
                      <Icon name="save" size={20} />
                    </Button>
                    <Button variant="secondary" onClick={() => setEditingId(null)} className="!px-3 !py-2">
                      <Icon name="close" size={20} />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-on-surface">{program.nama}</p>
                    <p className="text-body-sm text-on-surface-variant">
                      Semester {program.semesterMin}-{program.semesterMax}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(program)}
                    className="rounded-full p-sm text-on-surface-variant hover:bg-surface-container hover:text-primary"
                    aria-label={`Edit ${program.nama}`}
                  >
                    <Icon name="edit" size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(program)}
                    className="rounded-full p-sm text-on-surface-variant hover:bg-error/10 hover:text-error"
                    aria-label={`Hapus ${program.nama}`}
                  >
                    <Icon name="delete" size={20} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus prodi?"
        description={`"${deleteTarget?.nama}" akan dihapus dari daftar program studi.`}
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
