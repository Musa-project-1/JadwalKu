import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { AdminPageCard } from '../../components/admin/AdminPageCard'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { addDocument, deleteDocument, updateDocument } from '../../lib/adminData'
import { appendHistory, syncProdiFromExistingData } from '../../lib/publishHelpers'
import { AddProdiForm } from '../../components/admin/prodi/AddProdiForm'
import { ProdiTableList } from '../../components/admin/prodi/ProdiTableList'

const SEMESTER_OPTIONS = Array.from({ length: 14 }, (_, i) => i + 1)

export default function ManageProdi() {
  const { data: programs, loading } = useFirestore('prodi')
  const { data: fakultasList } = useFirestore('fakultas')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

  const [search, setSearch] = useState('')
  const [fakultasFilter, setFakultasFilter] = useState('Semua')
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Form states
  const [nama, setNama] = useState('')
  const [semesterMin, setSemesterMin] = useState(1)
  const [semesterMax, setSemesterMax] = useState(8)
  const [fakultasId, setFakultasId] = useState('')
  const [formError, setFormError] = useState('')

  const [banner, setBanner] = useState(null)
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

  const filtered = useMemo(() => {
    return sorted.filter((p) => {
      const matchSearch =
        !search ||
        p.nama.toLowerCase().includes(search.toLowerCase()) ||
        (fakultasNameMap.get(p.fakultasId) || '').toLowerCase().includes(search.toLowerCase())

      const matchFakultas =
        fakultasFilter === 'Semua' ||
        (fakultasFilter === '__tanpa__' ? !p.fakultasId : String(p.fakultasId) === String(fakultasFilter))

      return matchSearch && matchFakultas
    })
  }, [sorted, search, fakultasFilter, fakultasNameMap])

  const groupedByFakultas = useMemo(() => {
    const groups = new Map()
    for (const pr of filtered) {
      const fid = String(pr.fakultasId || '').trim()
      const key = fid || '__tanpa__'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(pr)
    }
    return groups
  }, [filtered])

  async function handleSync() {
    setSyncing(true)
    setBanner(null)
    const result = await syncProdiFromExistingData(actor)
    setSyncing(false)
    if (result.ok) {
      setBanner({
        ok: true,
        message:
          result.count > 0
            ? `${result.count} program studi berhasil disinkronkan dari data Jadwal & Mata Kuliah.`
            : 'Semua program studi sudah sinkron atau belum ada data jadwal/MK.',
      })
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    setFormError('')
    if (!nama.trim()) {
      setFormError('Nama program studi wajib diisi.')
      return
    }
    if (semesterMin > semesterMax) {
      setFormError('Semester awal tidak boleh lebih besar dari semester akhir.')
      return
    }
    const exists = programs.some(
      (p) => p.nama.trim().toLowerCase() === nama.trim().toLowerCase(),
    )
    if (exists) {
      setFormError('Program studi dengan nama ini sudah terdaftar.')
      return
    }

    setSaving(true)
    const payload = {
      nama: nama.trim(),
      semesterMin: Number(semesterMin),
      semesterMax: Number(semesterMax),
      fakultasId: fakultasId || null,
    }
    const result = await addDocument('prodi', payload, actor)
    setSaving(false)
    if (result.ok) {
      await appendHistory({
        entitas: 'prodi',
        field: 'tambah',
        nilaiLama: null,
        nilaiBaru: payload,
        aktor: actor,
      })
      setNama('')
      setSemesterMin(1)
      setSemesterMax(8)
      setFakultasId('')
      setIsAddOpen(false)
      setBanner({ ok: true, message: `Prodi "${payload.nama}" berhasil ditambahkan.` })
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  function startEdit(program) {
    setEditingId(program.id)
    setEditDraft({
      nama: program.nama,
      semesterMin: program.semesterMin ?? 1,
      semesterMax: program.semesterMax ?? 8,
      fakultasId: program.fakultasId ?? '',
    })
  }

  async function handleEditSave(program) {
    if (!editDraft.nama.trim()) return
    if (editDraft.semesterMin > editDraft.semesterMax) {
      setBanner({ ok: false, message: 'Semester awal tidak boleh lebih besar dari semester akhir.' })
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
    <div className="h-full flex flex-col gap-3.5 tablet:gap-4 pb-20 tablet:pb-0 w-full max-w-full overflow-x-hidden min-h-0 flex-1 animate-fade-in">
      {banner && (
        <div className="shrink-0">
          <StatusBanner
            variant={banner.ok ? 'success' : 'error'}
            message={banner.message}
            onClose={() => setBanner(null)}
          />
        </div>
      )}

      {/* Single Unified Card Container (<AdminPageCard>) */}
      <AdminPageCard>
        {/* 1. Page Header */}
        <header className="p-3 tablet:px-4 tablet:py-2.5 border-b border-outline-variant/15 flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between w-full shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <Icon name="school" size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg tablet:text-xl font-bold tracking-tight text-on-surface">
                  Program Studi
                </h1>
                <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-label-caps font-bold border border-primary/20">
                  {programs.length} Prodi
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant font-medium truncate">
                Master jurusan, kurikulum semester, dan pemetaan fakultas
              </p>
            </div>
          </div>

          {/* Right side: Action Cluster */}
          <div className="flex items-center gap-1.5 tablet:gap-2 shrink-0 flex-wrap tablet:flex-nowrap">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="flex h-9 items-center gap-1.5 px-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/60 hover:bg-surface-container hover:text-primary transition-colors cursor-pointer shadow-2xs text-body-xs font-semibold text-on-surface-variant disabled:opacity-50"
              title="Sinkronisasi dari data Jadwal & MK"
            >
              <Icon name="sync" size={16} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Menyinkronkan...' : 'Sinkron Data'}</span>
            </button>

            <div className="h-6 w-px bg-outline-variant/20 mx-0.5" />

            <Button
              onClick={() => setIsAddOpen((v) => !v)}
              className="rounded-full px-3.5 py-1.5 font-bold shadow-xs cursor-pointer text-body-xs shrink-0 bg-primary text-on-primary"
              title="Tambah Program Studi"
              aria-label="Tambah Prodi"
            >
              <Icon name={isAddOpen ? 'expand_less' : 'add'} size={16} className="mr-1" />
              <span>{isAddOpen ? 'Tutup Form' : 'Tambah Prodi'}</span>
            </Button>
          </div>
        </header>

        {/* 2. Collapsible Inline Form Tambah Prodi */}
        <AddProdiForm
          isAddOpen={isAddOpen}
          handleAdd={handleAdd}
          nama={nama}
          setNama={setNama}
          fakultasId={fakultasId}
          setFakultasId={setFakultasId}
          fakultasList={fakultasList}
          semesterMin={semesterMin}
          setSemesterMin={setSemesterMin}
          semesterMax={semesterMax}
          setSemesterMax={setSemesterMax}
          semesterOptions={SEMESTER_OPTIONS}
          saving={saving}
          formError={formError}
        />

        {/* 3. Toolbar Pencarian & Filter Fakultas */}
        <div className="p-3 tablet:p-3.5 flex items-center justify-between gap-3 border-b border-outline-variant/15 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Icon
              name="search"
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari program studi..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low/50 text-body-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-all dark:bg-surface-container-high/40"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <Icon name="close" size={15} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-bold text-on-surface-variant mr-1">Fakultas:</span>
            {['Semua', ...Array.from(new Set((fakultasList || []).map((f) => String(f.id)))), '__tanpa__'].map((f) => {
              const label = f === 'Semua' ? 'Semua' : f === '__tanpa__' ? 'Tanpa Fakultas' : (fakultasNameMap.get(f) || f)
              const active = fakultasFilter === f
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFakultasFilter(f)}
                  className={`px-3 py-1 rounded-full text-label-caps font-bold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container-high/70 text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 4. Konten Tabel Master Prodi */}
        <div className="p-3 tablet:p-4 flex-1 overflow-y-auto min-h-[350px]">
          <ProdiTableList
            loading={loading}
            filtered={filtered}
            groupedByFakultas={groupedByFakultas}
            fakultasNameMap={fakultasNameMap}
            fakultasList={fakultasList}
            editingId={editingId}
            editDraft={editDraft}
            setEditDraft={setEditDraft}
            handleEditSave={handleEditSave}
            setEditingId={setEditingId}
            startEdit={startEdit}
            setDeleteTarget={setDeleteTarget}
            semesterOptions={SEMESTER_OPTIONS}
            search={search}
            fakultasFilter={fakultasFilter}
          />
        </div>
      </AdminPageCard>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Program Studi?"
        message={`Apakah Anda yakin ingin menghapus prodi "${deleteTarget?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
