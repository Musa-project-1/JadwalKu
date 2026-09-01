import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { FormSelect } from '../../components/FormSelect'
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
  const { data: fakultasList } = useFirestore('fakultas')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

  const [nama, setNama] = useState('')
  const [semesterMin, setSemesterMin] = useState(1)
  const [semesterMax, setSemesterMax] = useState(8)
  const [fakultasId, setFakultasId] = useState('')
  const [formError, setFormError] = useState('')
  const [banner, setBanner] = useState(null) // { ok, message }
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({ nama: '', semesterMin: 1, semesterMax: 8, fakultasId: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const sorted = useMemo(
    () => [...programs].sort((a, b) => a.nama.localeCompare(b.nama, 'id')),
    [programs],
  )

  const fakultasNameMap = useMemo(() => {
    const m = new Map()
    ;(fakultasList || []).forEach((f) => m.set(String(f.id), String(f.nama || f.singkatan || f.id)))
    return m
  }, [fakultasList])

  const groupedByFakultas = useMemo(() => {
    const groups = new Map()
    for (const pr of sorted) {
      const fid = String(pr.fakultasId || '').trim()
      const key = fid || '__tanpa__'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(pr)
    }
    return groups
  }, [sorted])

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
    const data = { nama: nama.trim(), semesterMin, semesterMax, ...(fakultasId ? { fakultasId } : {}) }
    const result = await setDocSafe(data)
    setSaving(false)

    if (result.ok) {
      setBanner({ ok: true, message: `Prodi "${data.nama}" ditambahkan.` })
      setNama('')
      setSemesterMin(1)
      setSemesterMax(8)
      setFakultasId('')
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
      fakultasId: program.fakultasId || '',
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
    <div className="h-full flex flex-col gap-3.5 tablet:gap-4 pb-20 tablet:pb-0 animate-fade-in w-full max-w-full overflow-x-hidden min-h-0 flex-1">
      <header className="flex flex-col gap-2.5 tablet:flex-row tablet:items-center tablet:justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 tablet:h-11 tablet:w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-container/50 dark:bg-primary-container/25 text-primary shadow-xs">
            <Icon name="list_alt" size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl tablet:text-2xl font-bold tracking-tight text-on-surface">Kelola Daftar Prodi</h2>
            <p className="text-[11.5px] tablet:text-body-xs font-normal text-on-surface-variant truncate">Daftar prodi & rentang semesternya.</p>
          </div>
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
        className="shrink-0 rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 tablet:p-5 shadow-xs dark:bg-surface-container-low"
      >
        <h3 className="text-body-sm tablet:text-title-sm font-bold text-on-surface shrink-0 mb-2.5">Tambah Prodi</h3>
        <div className="grid gap-3 tablet:grid-cols-[1fr_1fr_auto_auto_auto] tablet:items-end">
          <Input
            label="Nama Prodi"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="mis. Informatika"
          />
          <div>
            <label className="mb-1 block text-body-sm font-semibold text-on-surface-variant">Fakultas</label>
            <FormSelect
              value={fakultasId}
              onChange={(val) => setFakultasId(String(val || ''))}
              options={[{ value: '', label: 'Tanpa Fakultas' }, ...(fakultasList || []).map((f) => ({ value: String(f.id), label: String(f.nama || f.singkatan || f.id) }))]}
              placeholder="Pilih fakultas"
            />
          </div>
          <div>
            <label className="mb-1 block text-body-sm font-semibold text-on-surface-variant">Sem. Awal</label>
            <FormSelect
              value={semesterMin}
              onChange={(val) => setSemesterMin(Number(val))}
              options={SEMESTER_OPTIONS.map((n) => ({ value: n, label: String(n) }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-body-sm font-semibold text-on-surface-variant">Sem. Akhir</label>
            <FormSelect
              value={semesterMax}
              onChange={(val) => setSemesterMax(Number(val))}
              options={SEMESTER_OPTIONS.map((n) => ({ value: n, label: String(n) }))}
            />
          </div>
          <Button type="submit" disabled={saving} className="justify-center">
            <Icon name="add" size={20} />
            Tambah
          </Button>
        </div>
        {formError && <p className="mt-sm text-body-sm text-error">{formError}</p>}
      </form>

      {/* Daftar — flex-1 so it fills remaining height balancing with form above */}
      {loading ? (
        <div className="flex-1 flex flex-col gap-3 pt-2">
          <Skeleton className="h-20 w-full rounded-3xl" />
          <Skeleton className="h-20 w-full rounded-3xl" />
          <Skeleton className="h-20 w-full rounded-3xl" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center rounded-3xl border border-outline-variant/20 bg-surface-container-lowest/50 p-8 dark:bg-surface-container-low/40 min-h-[180px]">
          <EmptyState
            icon="list_alt"
            title="Belum ada prodi terdaftar"
            description="Tambahkan program studi agar mahasiswa bisa memilih prodi & semester saat onboarding."
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-h-0 pr-1">
          {Array.from(groupedByFakultas.entries()).map(([fid, prodis]) => (
            <div key={fid} className="space-y-2">
              <h4 className="flex items-center gap-2 text-body-xs font-bold tracking-widest uppercase text-on-surface-variant px-1">
                <span className="h-px flex-1 bg-outline-variant/30" />
                {fid === '__tanpa__' ? 'Tanpa Fakultas' : (fakultasNameMap.get(fid) || fid)}
                <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold border border-outline-variant/20">{prodis.length}</span>
                <span className="h-px flex-1 bg-outline-variant/30" />
              </h4>
              <ul className="flex flex-col gap-2">
                {prodis.map((program) => (
                  <li
                    key={program.id}
                    className="flex flex-wrap items-center gap-3 rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 tablet:p-5 shadow-xs dark:bg-surface-container-low"
                  >
              {editingId === program.id ? (
                <div className="grid flex-1 gap-2 tablet:grid-cols-[1fr_1fr_auto_auto_auto] tablet:items-center">
                  <Input
                    value={editDraft.nama}
                    onChange={(e) => setEditDraft((d) => ({ ...d, nama: e.target.value }))}
                  />
                  <FormSelect
                    value={editDraft.fakultasId || ''}
                    onChange={(val) => setEditDraft((d) => ({ ...d, fakultasId: String(val || '') }))}
                    options={[{ value: '', label: 'Tanpa Fakultas' }, ...(fakultasList || []).map((f) => ({ value: String(f.id), label: String(f.nama || f.singkatan || f.id) }))]}
                    placeholder="Fakultas"
                  />
                  <FormSelect
                    value={editDraft.semesterMin}
                    onChange={(val) => setEditDraft((d) => ({ ...d, semesterMin: Number(val) }))}
                    options={SEMESTER_OPTIONS.map((n) => ({ value: n, label: String(n) }))}
                  />
                  <FormSelect
                    value={editDraft.semesterMax}
                    onChange={(val) => setEditDraft((d) => ({ ...d, semesterMax: Number(val) }))}
                    options={SEMESTER_OPTIONS.map((n) => ({ value: n, label: String(n) }))}
                  />
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
            </div>
          ))}
        </div>
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
