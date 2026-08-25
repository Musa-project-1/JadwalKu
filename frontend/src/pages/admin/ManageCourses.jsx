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
import {
  deleteDocument,
  setDocument,
  updateDocument,
} from '../../lib/adminData'
import { appendHistory } from '../../lib/publishHelpers'
import { validateCourseEntry } from '../../lib/uploadValidator'

const EMPTY_FORM = { kodeMK: '', namaMK: '', dosen: '', kontakDosen: '', sks: 2, durasi: 100 }

export default function ManageCourses() {
  const { data: courses, loading } = useFirestore('mataKuliah')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

  const [search, setSearch] = useState('')
  const [dosenFilter, setDosenFilter] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)

  const lecturers = useMemo(
    () => [...new Set(courses.map((c) => c.dosen).filter(Boolean))].sort(),
    [courses],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return courses
      .filter((c) => (dosenFilter ? c.dosen === dosenFilter : true))
      .filter((c) =>
        q
          ? [c.kodeMK, c.namaMK, c.dosen].some((v) => String(v).toLowerCase().includes(q))
          : true,
      )
      .sort((a, b) => String(a.kodeMK).localeCompare(String(b.kodeMK)))
  }, [courses, search, dosenFilter])

  async function handleAdd(e) {
    e.preventDefault()
    const errors = validateCourseEntry(form)
    setFormErrors(errors)
    if (errors.length > 0) return

    setSaving(true)
    const kodeMK = form.kodeMK.trim().toUpperCase()
    // Tolak duplikat: setDocument dengan merge akan menimpa MK yang sudah
    // ada secara diam-diam — "Tambah" harus benar-benar tambah.
    if (courses.some((c) => c.kodeMK === kodeMK)) {
      setSaving(false)
      setFormErrors([`Kode MK ${kodeMK} sudah terdaftar. Gunakan tombol Edit untuk mengubahnya.`])
      return
    }
    const result = await setDocument('mataKuliah', kodeMK, { ...form, kodeMK }, actor)
    if (result.ok) {
      await appendHistory({
        entitas: 'mataKuliah',
        field: 'tambah',
        nilaiLama: null,
        nilaiBaru: form,
        aktor: actor,
      })
      setBanner({ ok: true, message: `Mata kuliah ${kodeMK} ditambahkan.` })
      setForm(EMPTY_FORM)
      setAdding(false)
    } else {
      setBanner({ ok: false, message: result.error })
    }
    setSaving(false)
  }

  function startEdit(course) {
    setEditingId(course.id)
    setEditDraft({
      kodeMK: course.kodeMK,
      namaMK: course.namaMK,
      dosen: course.dosen ?? '',
      kontakDosen: course.kontakDosen ?? '',
      sks: course.sks,
      durasi: course.durasi,
    })
  }

  async function handleEditSave(course) {
    const errors = validateCourseEntry(editDraft)
    if (errors.length > 0) {
      setBanner({ ok: false, message: errors[0] })
      return
    }

    const result = await updateDocument('mataKuliah', course.id, editDraft, actor)
    if (result.ok) {
      await appendHistory({
        entitas: 'mataKuliah',
        field: 'edit',
        nilaiLama: course,
        nilaiBaru: editDraft,
        aktor: actor,
      })
      setBanner({ ok: true, message: `Mata kuliah ${course.kodeMK} diperbarui.` })
      setEditingId(null)
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    const result = await deleteDocument('mataKuliah', target.id)
    setDeleteTarget(null)
    if (result.ok) {
      await appendHistory({
        entitas: 'mataKuliah',
        field: 'hapus',
        nilaiLama: target,
        nilaiBaru: null,
        aktor: actor,
      })
      setBanner({ ok: true, message: `Mata kuliah ${target.kodeMK} dihapus.` })
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  return (
    <div className="space-y-lg">
      <header>
        <div className="flex items-center gap-md">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary-container/50 dark:bg-secondary-container/25 text-secondary">
            <Icon name="menu_book" size={26} />
          </span>
          <h2 className="text-headline-lg font-bold text-on-surface">Kelola MK & Dosen</h2>
        </div>
        <p className="text-body-lg text-on-surface-variant">
          Daftar mata kuliah dan dosen pengampu (lookup untuk validasi jadwal).
        </p>
      </header>

      {banner && (
        <StatusBanner
          ok={banner.ok}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-md tablet:flex-row tablet:items-center">
        <div className="relative flex-1">
          <Icon
            name="search"
            size={20}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode MK, nama mata kuliah, atau dosen…"
            aria-label="Cari mata kuliah"
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-3 text-body-lg text-on-surface placeholder:text-outline focus:border-primary focus:outline-none dark:bg-surface-container-low"
          />
        </div>
        <select
          value={dosenFilter}
          onChange={(e) => setDosenFilter(e.target.value)}
          aria-label="Filter berdasarkan dosen"
          className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface dark:bg-surface-container-low"
        >
          <option value="">Semua Dosen</option>
          {lecturers.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {!adding && (
          <Button onClick={() => setAdding(true)} className="justify-center whitespace-nowrap">
            <Icon name="add" size={20} />
            Tambah MK
          </Button>
        )}
      </div>

      {/* Form tambah */}
      {adding && (
        <form
          onSubmit={handleAdd}
          className="grid gap-md rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low tablet:grid-cols-4 desktop:grid-cols-7"
        >
          <Input label="Kode MK" value={form.kodeMK} onChange={(e) => setForm((f) => ({ ...f, kodeMK: e.target.value }))} placeholder="mis. IF301" />
          <Input label="Nama MK" value={form.namaMK} onChange={(e) => setForm((f) => ({ ...f, namaMK: e.target.value }))} placeholder="Nama mata kuliah" />
          <Input label="Dosen" value={form.dosen} onChange={(e) => setForm((f) => ({ ...f, dosen: e.target.value }))} placeholder="Dosen pengampu" />
          <Input label="Kontak" value={form.kontakDosen} onChange={(e) => setForm((f) => ({ ...f, kontakDosen: e.target.value }))} placeholder="No. HP/WA" />
          <Input label="SKS" type="number" min="1" max="6" value={form.sks} onChange={(e) => setForm((f) => ({ ...f, sks: Number(e.target.value) }))} />
          <Input label="Durasi (menit)" type="number" min="30" max="300" step="10" value={form.durasi} onChange={(e) => setForm((f) => ({ ...f, durasi: Number(e.target.value) }))} />
          <div className="flex items-end gap-xs">
            <Button type="submit" disabled={saving}>
              <Icon name="save" size={20} />
              Simpan
            </Button>
            <Button variant="secondary" onClick={() => { setAdding(false); setFormErrors([]); setForm(EMPTY_FORM) }}>
              Batal
            </Button>
          </div>
          {formErrors.length > 0 && (
            <ul className="col-span-full list-inside list-disc text-body-sm text-error">
              {formErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
        </form>
      )}

      {/* Daftar */}
      {loading ? (
        <div className="space-y-sm">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="folder_shared"
          title="Belum ada mata kuliah"
          description="Mulai dengan menambahkan mata kuliah baru, atau ubah filter pencarian."
        />
      ) : (
        <>
          {/* Tabel — desktop */}
          <div className="hidden overflow-x-auto rounded-xl border border-surface-variant bg-surface-container-lowest shadow-sm tablet:block dark:bg-surface-container-high">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-surface-variant">
                  <th className="px-md py-sm text-label-caps uppercase tracking-wide text-on-surface-variant">Kode</th>
                  <th className="px-md py-sm text-label-caps uppercase tracking-wide text-on-surface-variant">Nama Mata Kuliah</th>
                  <th className="px-md py-sm text-label-caps uppercase tracking-wide text-on-surface-variant">Dosen</th>
                  <th className="px-md py-sm text-label-caps uppercase tracking-wide text-on-surface-variant">Kontak</th>
                  <th className="px-md py-sm text-label-caps uppercase tracking-wide text-on-surface-variant">SKS</th>
                  <th className="px-md py-sm text-label-caps uppercase tracking-wide text-on-surface-variant">Durasi</th>
                  <th className="px-md py-sm text-label-caps uppercase tracking-wide text-on-surface-variant">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((course) =>
                  editingId === course.id ? (
                    <tr key={course.id} className="border-b border-surface-variant bg-surface-container-low dark:bg-black/20">
                      <td className="px-md py-sm"><input disabled value={editDraft.kodeMK} className="w-24 rounded-md border border-outline-variant bg-surface-container-high px-2 py-1 font-mono text-xs text-on-surface-variant dark:bg-surface-container-high" /></td>
                      <td className="px-md py-sm"><input value={editDraft.namaMK} onChange={(e) => setEditDraft((d) => ({ ...d, namaMK: e.target.value }))} className="w-56 rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 text-body-sm text-on-surface dark:bg-surface-container-low" /></td>
                      <td className="px-md py-sm"><input value={editDraft.dosen} onChange={(e) => setEditDraft((d) => ({ ...d, dosen: e.target.value }))} className="w-44 rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 text-body-sm text-on-surface dark:bg-surface-container-low" /></td>
                      <td className="px-md py-sm"><input value={editDraft.kontakDosen} onChange={(e) => setEditDraft((d) => ({ ...d, kontakDosen: e.target.value }))} className="w-32 rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 text-body-sm text-on-surface dark:bg-surface-container-low" /></td>
                      <td className="px-md py-sm"><input type="number" min="1" max="6" value={editDraft.sks} onChange={(e) => setEditDraft((d) => ({ ...d, sks: Number(e.target.value) }))} className="w-16 rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 text-body-sm text-on-surface dark:bg-surface-container-low" /></td>
                      <td className="px-md py-sm"><input type="number" min="30" max="300" step="10" value={editDraft.durasi} onChange={(e) => setEditDraft((d) => ({ ...d, durasi: Number(e.target.value) }))} className="w-20 rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 text-body-sm text-on-surface dark:bg-surface-container-low" /></td>
                      <td className="px-md py-sm">
                        <div className="flex gap-xs">
                          <button type="button" onClick={() => handleEditSave(course)} className="rounded-full p-sm text-primary hover:bg-primary/10" aria-label="Simpan"><Icon name="save" size={20} /></button>
                          <button type="button" onClick={() => setEditingId(null)} className="rounded-full p-sm text-on-surface-variant hover:bg-surface-container" aria-label="Batal"><Icon name="close" size={20} /></button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={course.id} className="border-b border-surface-variant last:border-b-0 hover:bg-surface-container-low dark:hover:bg-black/20">
                      <td className="px-md py-sm font-mono text-xs font-semibold text-primary">{course.kodeMK}</td>
                      <td className="px-md py-sm text-body-sm text-on-surface">{course.namaMK}</td>
                      <td className="px-md py-sm text-body-sm text-on-surface-variant">{course.dosen}</td>
                      <td className="px-md py-sm text-body-sm text-on-surface-variant">{course.kontakDosen || '-'}</td>
                      <td className="px-md py-sm text-body-sm text-on-surface">{course.sks}</td>
                      <td className="px-md py-sm text-body-sm text-on-surface-variant">{course.durasi} mnt</td>
                      <td className="px-md py-sm">
                        <div className="flex gap-xs">
                          <button type="button" onClick={() => startEdit(course)} className="rounded-full p-sm text-on-surface-variant hover:bg-surface-container hover:text-primary" aria-label={`Edit ${course.kodeMK}`}><Icon name="edit" size={20} /></button>
                          <button type="button" onClick={() => setDeleteTarget(course)} className="rounded-full p-sm text-on-surface-variant hover:bg-error/10 hover:text-error" aria-label={`Hapus ${course.kodeMK}`}><Icon name="delete" size={20} /></button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          {/* Kartu — mobile */}
          <ul className="space-y-sm tablet:hidden">
            {filtered.map((course) =>
              editingId === course.id ? (
                <li key={course.id} className="space-y-sm rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low">
                  <Input label="Nama MK" value={editDraft.namaMK} onChange={(e) => setEditDraft((d) => ({ ...d, namaMK: e.target.value }))} />
                  <Input label="Dosen" value={editDraft.dosen} onChange={(e) => setEditDraft((d) => ({ ...d, dosen: e.target.value }))} />
                  <Input label="Kontak" value={editDraft.kontakDosen} onChange={(e) => setEditDraft((d) => ({ ...d, kontakDosen: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-sm">
                    <Input label="SKS" type="number" min="1" max="6" value={editDraft.sks} onChange={(e) => setEditDraft((d) => ({ ...d, sks: Number(e.target.value) }))} />
                    <Input label="Durasi" type="number" min="30" max="300" step="10" value={editDraft.durasi} onChange={(e) => setEditDraft((d) => ({ ...d, durasi: Number(e.target.value) }))} />
                  </div>
                  <div className="flex justify-end gap-xs">
                    <Button onClick={() => handleEditSave(course)}><Icon name="save" size={20} /> Simpan</Button>
                    <Button variant="secondary" onClick={() => setEditingId(null)}>Batal</Button>
                  </div>
                </li>
              ) : (
                <li key={course.id} className="rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low">
                  <div className="flex items-start justify-between gap-sm">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-primary">{course.kodeMK}</p>
                      <p className="truncate font-semibold text-on-surface">{course.namaMK}</p>
                      <p className="text-body-sm text-on-surface-variant">{course.dosen}{course.kontakDosen ? ` • ${course.kontakDosen}` : ''}</p>
                      <p className="text-body-sm text-on-surface-variant">{course.sks} SKS • {course.durasi} menit</p>
                    </div>
                    <div className="flex shrink-0 gap-xs">
                      <button type="button" onClick={() => startEdit(course)} className="rounded-full p-sm text-on-surface-variant hover:bg-surface-container hover:text-primary" aria-label={`Edit ${course.kodeMK}`}><Icon name="edit" size={20} /></button>
                      <button type="button" onClick={() => setDeleteTarget(course)} className="rounded-full p-sm text-on-surface-variant hover:bg-error/10 hover:text-error" aria-label={`Hapus ${course.kodeMK}`}><Icon name="delete" size={20} /></button>
                    </div>
                  </div>
                </li>
              ),
            )}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus mata kuliah?"
        description={`${deleteTarget?.kodeMK} - ${deleteTarget?.namaMK} akan dihapus. Jadwal yang memakai kode ini akan gagal validasi saat upload.`}
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
