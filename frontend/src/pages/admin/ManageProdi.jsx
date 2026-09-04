import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { FormSelect } from '../../components/FormSelect'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Skeleton } from '../../components/Skeleton'
import { AdminPageCard } from '../../components/admin/AdminPageCard'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { addDocument, deleteDocument, updateDocument } from '../../lib/adminData'
import { appendHistory, syncProdiFromExistingData } from '../../lib/publishHelpers'
import { getProdiColorClasses, getProdiTokenMap } from '../../lib/prodiColors'

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
    <div className="flex flex-col space-y-2 pb-16 tablet:pb-0 animate-fade-in w-full max-w-full overflow-hidden">
      {banner && (
        <div className="shrink-0">
          <StatusBanner
            ok={banner.ok}
            message={banner.message}
            onClose={() => setBanner(null)}
          />
        </div>
      )}

      {/* ── Single Unified Card Container (<AdminPageCard>) ── */}
      <AdminPageCard>
        {/* ── 1. Page Header (Border-b divider inside card) ── */}
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

        {/* ── 2. Collapsible Inline Form Tambah Prodi ── */}
        {isAddOpen && (
          <form
            onSubmit={handleAdd}
            className="p-3.5 tablet:p-4 bg-surface-container-low/40 dark:bg-surface-container-high/20 border-b border-outline-variant/15 animate-fade-in"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-body-sm font-bold text-on-surface flex items-center gap-2">
                <Icon name="add_circle" size={16} className="text-primary" />
                <span>Formulir Program Studi Baru</span>
              </h3>
            </div>
            <div className="grid gap-3 tablet:grid-cols-[1.5fr_1.2fr_auto_auto_auto] tablet:items-end">
              <Input
                label="Nama Program Studi"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="mis. Teknik Informatika"
                required
              />
              <div>
                <label className="mb-1 block text-body-sm font-semibold text-on-surface-variant">Fakultas</label>
                <FormSelect
                  value={fakultasId}
                  onChange={(val) => setFakultasId(String(val || ''))}
                  options={[
                    { value: '', label: 'Tanpa Fakultas' },
                    ...(fakultasList || []).map((f) => ({
                      value: String(f.id),
                      label: String(f.nama || f.singkatan || f.id),
                    })),
                  ]}
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
              <Button type="submit" disabled={saving} className="rounded-xl h-[38px] justify-center px-4 font-bold shadow-xs">
                <Icon name="check" size={18} className="mr-1" />
                Simpan
              </Button>
            </div>
            {formError && <p className="mt-2 text-body-xs font-semibold text-error">{formError}</p>}
          </form>
        )}

        {/* ── 3. Toolbar Pencarian & Filter Fakultas ── */}
        <div className="p-3 tablet:p-3.5 flex items-center justify-between gap-3 border-b border-outline-variant/15 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Icon
              name="search"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari program studi atau fakultas…"
              aria-label="Cari program studi"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 py-1.5 pl-8 pr-7 text-body-xs font-medium text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:bg-surface focus:outline-none dark:bg-surface-container-high/30 transition-all shadow-level-1"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:bg-surface-container rounded-full p-0.5 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <Icon name="close" size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-label-caps uppercase font-bold text-on-surface-variant">Fakultas:</span>
            <div className="w-48">
              <FormSelect
                value={fakultasFilter}
                onChange={setFakultasFilter}
                options={[
                  { value: 'Semua', label: 'Semua Fakultas' },
                  { value: '__tanpa__', label: 'Tanpa Fakultas' },
                  ...(fakultasList || []).map((f) => ({
                    value: String(f.id),
                    label: String(f.nama || f.singkatan || f.id),
                  })),
                ]}
              />
            </div>
          </div>
        </div>

        {/* ── 4. Konten Tabel Master Prodi ── */}
        <div className="p-3 tablet:p-4 flex-1 overflow-y-auto min-h-[350px]">
          {loading ? (
            <div className="space-y-2.5">
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-level-1">
                <Icon name="school" size={24} />
              </div>
              <p className="mt-2.5 text-body-xs font-bold text-on-surface">Tidak ada program studi ditemukan</p>
              <p className="text-label-caps text-on-surface-variant max-w-xs mt-0.5">
                {search || fakultasFilter !== 'Semua'
                  ? 'Coba sesuaikan kata kunci pencarian atau filter fakultas.'
                  : 'Klik tombol "+ Tambah Prodi" di atas untuk menambahkan jurusan baru.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(groupedByFakultas.entries()).map(([fid, prodis]) => (
                <div key={fid} className="space-y-2">
                  <div className="flex items-center gap-2 text-label-caps font-extrabold uppercase tracking-wider text-on-surface-variant/80 px-1">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span>{fid === '__tanpa__' ? 'Tanpa Fakultas Terhubung' : (fakultasNameMap.get(fid) || fid)}</span>
                    <span className="rounded-full bg-surface-container-high px-2 py-0.2 text-[10px] font-bold border border-outline-variant/20">
                      {prodis.length}
                    </span>
                    <span className="h-px flex-1 bg-outline-variant/20" />
                  </div>

                  <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low overflow-hidden shadow-2xs divide-y divide-outline-variant/15">
                    {prodis.map((program) => {
                      const isEditing = editingId === program.id
                      const colors = getProdiTokenMap(program.nama)
                      return (
                        <div
                          key={program.id}
                          className="p-3 tablet:px-4 flex items-center justify-between gap-3 hover:bg-surface-container-low/40 transition-colors"
                        >
                          {isEditing ? (
                            <div className="grid flex-1 gap-2 tablet:grid-cols-[1.5fr_1.2fr_auto_auto_auto] tablet:items-center">
                              <Input
                                value={editDraft.nama}
                                onChange={(e) => setEditDraft((d) => ({ ...d, nama: e.target.value }))}
                              />
                              <FormSelect
                                value={editDraft.fakultasId || ''}
                                onChange={(val) => setEditDraft((d) => ({ ...d, fakultasId: String(val || '') }))}
                                options={[
                                  { value: '', label: 'Tanpa Fakultas' },
                                  ...(fakultasList || []).map((f) => ({
                                    value: String(f.id),
                                    label: String(f.nama || f.singkatan || f.id),
                                  })),
                                ]}
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
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEditSave(program)}
                                  className="h-8 w-8 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs hover:opacity-90"
                                  title="Simpan"
                                >
                                  <Icon name="check" size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="h-8 w-8 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center hover:text-on-surface"
                                  title="Batal"
                                >
                                  <Icon name="close" size={16} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-body-xs font-bold border shadow-2xs ${colors.bg} ${colors.text} ${colors.border}`}>
                                  {program.nama.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-body-sm text-on-surface tracking-tight truncate block">
                                    {program.nama}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="rounded-full bg-surface-container-high/80 px-2 py-0.2 text-[10.5px] font-bold text-on-surface-variant border border-outline-variant/20">
                                      Semester {program.semesterMin ?? 1} – {program.semesterMax ?? 8}
                                    </span>
                                    {program.fakultasId && (
                                      <span className="text-[11px] text-on-surface-variant/80 truncate">
                                        · {fakultasNameMap.get(program.fakultasId) || program.fakultasId}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => startEdit(program)}
                                  className="h-8 w-8 rounded-xl border border-outline-variant/20 bg-surface-container-low/60 hover:bg-surface-container text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                  title="Edit Prodi"
                                >
                                  <Icon name="edit" size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(program)}
                                  className="h-8 w-8 rounded-xl border border-outline-variant/20 bg-surface-container-low/60 hover:bg-error/10 text-on-surface-variant hover:text-error flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
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
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminPageCard>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Program Studi?"
        description={`Program Studi "${deleteTarget?.nama}" akan dihapus secara permanen.`}
        confirmLabel="Hapus Prodi"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
