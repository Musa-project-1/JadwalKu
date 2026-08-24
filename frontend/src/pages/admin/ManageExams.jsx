import { useMemo, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Badge } from '../../components/Badge'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { addDocument, deleteDocument, updateDocument } from '../../lib/adminData'
import { publishDocuments } from '../../lib/publishHelpers'
import { parseWorkbook } from '../../lib/xlsxParser'

const EMPTY_FORM = {
  jenis: 'UTS',
  prodi: '',
  semester: 1,
  kodeMK: '',
  tanggal: '',
  jam: '',
  ruang: '',
  mode: 'Offline',
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default function ManageExams() {
  const { data: exams, loading } = useFirestore('ujian')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

  const [filter, setFilter] = useState('Semua') // Semua | UTS | UAS
  const [form, setForm] = useState(EMPTY_FORM)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formError, setFormError] = useState('')
  const [banner, setBanner] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [imported, setImported] = useState(null) // parsed rows awaiting confirm
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef(null)

  const filtered = useMemo(() => {
    const list = filter === 'Semua' ? exams : exams.filter((e) => e.jenis === filter)
    return [...list].sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)))
  }, [exams, filter])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const exam of filtered) {
      const key = String(exam.tanggal)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(exam)
    }
    return [...map.entries()]
  }, [filtered])

  const draftCount = exams.filter((e) => e.status === 'draft').length

  function validate(values) {
    const errors = []
    if (!values.prodi.trim()) errors.push('Program studi wajib diisi')
    if (!Number.isInteger(Number(values.semester)) || values.semester < 1 || values.semester > 14) {
      errors.push('Semester harus angka bulat 1–14')
    }
    if (!values.kodeMK.trim()) errors.push('Kode MK wajib diisi')
    if (!values.tanggal) errors.push('Tanggal wajib dipilih')
    if (!values.jam) errors.push('Jam wajib diisi')
    return errors
  }

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(exam) {
    setEditingId(exam.id)
    setForm({
      jenis: exam.jenis,
      prodi: exam.prodi ?? '',
      semester: Number(exam.semester) || 1,
      kodeMK: exam.kodeMK ?? '',
      tanggal: String(exam.tanggal ?? '').slice(0, 10),
      jam: exam.jam ?? '',
      ruang: exam.ruang ?? '',
      mode: exam.mode ?? 'Offline',
    })
    setFormError('')
    setFormOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = validate(form)
    setFormError(errors.join('. '))
    if (errors.length > 0) return

    setBusy(true)
    const data = { ...form, semester: Number(form.semester), kodeMK: form.kodeMK.trim().toUpperCase() }
    const result = editingId
      ? await updateDocument('ujian', editingId, data, actor)
      : await addDocument('ujian', { ...data, status: 'draft' }, actor)

    if (result.ok) {
      setBanner({ ok: true, message: editingId ? 'Jadwal ujian diperbarui.' : 'Jadwal ujian ditambahkan (draft).' })
      setFormOpen(false)
    } else {
      setBanner({ ok: false, message: result.error })
    }
    setBusy(false)
  }

  async function handlePublish(ids) {
    setBusy(true)
    const result = await publishDocuments('ujian', ids, actor)
    setBusy(false)
    if (result.ok) {
      setBanner({ ok: true, message: `${result.publishedCount} ujian dipublikasikan.` })
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const result = await deleteDocument('ujian', deleteTarget.id)
    setDeleteTarget(null)
    setBanner(
      result.ok
        ? { ok: true, message: 'Jadwal ujian dihapus.' }
        : { ok: false, message: result.error },
    )
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // izinkan memilih file yang sama dua kali
    if (!file) return

    try {
      const buffer = await file.arrayBuffer()
      const parsed = parseWorkbook(buffer)
      if (parsed.exams.length === 0) {
        setBanner({ ok: false, message: 'Tidak ada baris ujian terbaca dari file tersebut.' })
        return
      }
      setImported(parsed.exams)
    } catch (err) {
      setBanner({ ok: false, message: `Gagal membaca file: ${err?.message ?? err}` })
    }
  }

  async function confirmImport() {
    if (!imported) return
    setBusy(true)
    let okCount = 0
    let failCount = 0
    for (const row of imported) {
      const result = await addDocument('ujian', { ...row, status: 'draft' }, actor)
      if (result.ok) okCount += 1
      else failCount += 1
    }
    setBusy(false)
    setImported(null)
    setBanner(
      failCount === 0
        ? { ok: true, message: `${okCount} ujian diimpor sebagai draft.` }
        : { ok: false, message: `${okCount} berhasil, ${failCount} gagal disimpan.` },
    )
  }

  return (
    <div className="space-y-lg">
      <header className="flex flex-col gap-md tablet:flex-row tablet:items-center tablet:justify-between">
        <div>
          <div className="flex items-center gap-md">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning-container/50 dark:bg-warning-container/25 text-warning">
            <Icon name="event_note" size={26} />
          </span>
          <h2 className="text-headline-lg font-bold text-on-surface">Kelola Jadwal Ujian</h2>
        </div>
          <p className="text-body-lg text-on-surface-variant">
            Ujian baru masuk sebagai draft sampai dipublikasikan.
          </p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Icon name="upload_file" size={20} />
            Impor CSV/XLSX
          </Button>
          {!formOpen && (
            <Button onClick={openAdd}>
              <Icon name="add" size={20} />
              Tambah Ujian
            </Button>
          )}
        </div>
      </header>

      {banner && (
        <StatusBanner
          ok={banner.ok}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* Preview impor */}
      {imported && (
        <div className="flex flex-wrap items-center justify-between gap-sm rounded-xl border border-tertiary/30 bg-tertiary/10 p-lg">
          <p className="text-body-lg text-on-surface">
            {imported.length} baris ujian terbaca. Tambahkan sebagai draft?
          </p>
          <div className="flex gap-sm">
            <Button onClick={confirmImport} disabled={busy}>
              <Icon name="save" size={20} />
              Ya, Impor
            </Button>
            <Button variant="secondary" onClick={() => setImported(null)}>Batal</Button>
          </div>
        </div>
      )}

      {/* Filter + publish draft */}
      <div className="flex flex-wrap items-center gap-sm">
        {['Semua', 'UTS', 'UAS'].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={`rounded-full px-md py-sm text-body-sm transition-colors ${
              filter === option
                ? 'bg-primary font-semibold text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high dark:bg-surface-container-high'
            }`}
          >
            {option}
          </button>
        ))}
        {draftCount > 0 && (
          <Button
            variant="ghost"
            onClick={() => handlePublish(exams.filter((e) => e.status === 'draft').map((e) => e.id))}
            disabled={busy}
            className="ml-auto"
          >
            <Icon name="publish" size={20} />
            Publikasikan {draftCount} Draft
          </Button>
        )}
      </div>

      {/* Form tambah/edit */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-md rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low tablet:grid-cols-4"
        >
          <h3 className="col-span-full text-title-md text-on-surface">
            {editingId ? 'Edit Jadwal Ujian' : 'Tambah Jadwal Ujian'}
          </h3>
          <label className="block">
            <span className="mb-1 block text-body-sm text-on-surface-variant">Jenis</span>
            <select
              value={form.jenis}
              onChange={(e) => setForm((f) => ({ ...f, jenis: e.target.value }))}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface dark:bg-surface-container-low"
            >
              <option value="UTS">UTS</option>
              <option value="UAS">UAS</option>
            </select>
          </label>
          <Input label="Prodi" value={form.prodi} onChange={(e) => setForm((f) => ({ ...f, prodi: e.target.value }))} placeholder="mis. Informatika" />
          <Input label="Semester" type="number" min="1" max="14" value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: Number(e.target.value) }))} />
          <Input label="Kode MK" value={form.kodeMK} onChange={(e) => setForm((f) => ({ ...f, kodeMK: e.target.value }))} placeholder="mis. IF301" />
          <Input label="Tanggal" type="date" value={form.tanggal} onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))} />
          <Input label="Jam" type="time" value={form.jam} onChange={(e) => setForm((f) => ({ ...f, jam: e.target.value }))} />
          <Input label="Ruang (opsional)" value={form.ruang} onChange={(e) => setForm((f) => ({ ...f, ruang: e.target.value }))} />
          <label className="block">
            <span className="mb-1 block text-body-sm text-on-surface-variant">Mode</span>
            <select
              value={form.mode}
              onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface dark:bg-surface-container-low"
            >
              <option value="Offline">Offline</option>
              <option value="Online">Online</option>
            </select>
          </label>
          <div className="col-span-full flex justify-end gap-sm">
            <Button type="submit" disabled={busy}>
              <Icon name="save" size={20} />
              {editingId ? 'Simpan Perubahan' : 'Tambah sebagai Draft'}
            </Button>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Batal</Button>
          </div>
          {formError && <p className="col-span-full text-body-sm text-error">{formError}</p>}
        </form>
      )}

      {/* Daftar per tanggal */}
      {loading ? (
        <div className="space-y-sm">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState
          icon="event_note"
          title="Belum ada jadwal ujian"
          description="Tambahkan ujian secara manual atau impor dari file CSV/XLSX."
        />
      ) : (
        <div className="space-y-lg">
          {grouped.map(([tanggal, items]) => (
            <section key={tanggal}>
              <h3 className="mb-sm text-title-md text-on-surface">
                {dateFormatter.format(new Date(`${tanggal}T00:00:00`))}
              </h3>
              <ul className="space-y-sm">
                {items.map((exam) => (
                  <li
                    key={exam.id}
                    className="flex flex-wrap items-center gap-sm rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low"
                  >
                    <Badge tone={exam.jenis === 'UTS' ? 'neutral' : 'tertiary'}>{exam.jenis}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-on-surface">
                        {exam.kodeMK}
                        <span className="ml-sm font-normal text-body-sm text-on-surface-variant">
                          {exam.prodi} • Semester {exam.semester}
                        </span>
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        {exam.jam}
                        {exam.ruang ? ` • ${exam.ruang}` : ''} • {exam.mode}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-sm py-xs text-label-caps ${
                        exam.status === 'published'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-tertiary/10 text-tertiary'
                      }`}
                    >
                      {exam.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    {exam.status !== 'published' && (
                      <button
                        type="button"
                        onClick={() => handlePublish([exam.id])}
                        disabled={busy}
                        className="rounded-full p-sm text-primary hover:bg-primary/10"
                        aria-label={`Publikasikan ${exam.kodeMK}`}
                      >
                        <Icon name="publish" size={20} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(exam)}
                      className="rounded-full p-sm text-on-surface-variant hover:bg-surface-container hover:text-primary"
                      aria-label={`Edit ${exam.kodeMK}`}
                    >
                      <Icon name="edit" size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(exam)}
                      className="rounded-full p-sm text-on-surface-variant hover:bg-error/10 hover:text-error"
                      aria-label={`Hapus ${exam.kodeMK}`}
                    >
                      <Icon name="delete" size={20} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus jadwal ujian?"
        description={`${deleteTarget?.kodeMK} (${deleteTarget?.jenis}, ${deleteTarget?.tanggal}) akan dihapus.`}
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
