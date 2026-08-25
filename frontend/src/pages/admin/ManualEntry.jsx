import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { addDocument, setDocument } from '../../lib/adminData'
import { appendHistory, publishDocuments } from '../../lib/publishHelpers'
import {
  DAYS,
  CLASS_TYPE_CODES,
  validateScheduleEntry,
  validateCourseEntry,
  findConflicts,
} from '../../lib/uploadValidator'

const EMPTY_SESSION = {
  prodi: '',
  semester: 1,
  hari: 'Senin',
  jamMulai: '',
  jamSelesai: '',
  kodeMK: '',
  ruang: '',
  tipeKelas: 'K1',
}

const EMPTY_COURSE = { kodeMK: '', namaMK: '', dosen: '', kontakDosen: '', sks: 2, durasi: 100 }

export default function ManualEntry() {
  const { data: courses, loading } = useFirestore('mataKuliah')
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

  const [sessions, setSessions] = useState([])
  const [form, setForm] = useState(EMPTY_SESSION)
  const [formErrors, setFormErrors] = useState([])
  const [courseOpen, setCourseOpen] = useState(false)
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE)
  const [courseErrors, setCourseErrors] = useState([])
  const [banner, setBanner] = useState(null)
  const [busy, setBusy] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function addSession(e) {
    e.preventDefault()
    const errors = validateScheduleEntry(form)
    setFormErrors(errors)
    if (errors.length > 0) return

    // Bentrok lokal dalam daftar sesi yang belum disimpan — pakai aturan
    // yang sama dengan validator upload (hari + prodi + semester + ruang +
    // tipe kelas), supaya K1/K2 paralel di ruang berbeda tidak salah flag.
    const candidate = { ...form, prodi: form.prodi.trim(), semester: Number(form.semester) }
    const conflicts = findConflicts([...sessions, candidate])
    const clashIndex = conflicts.findIndex((c) => c.b === sessions.length)
    if (clashIndex !== -1) {
      setFormErrors([conflicts[clashIndex].message])
      return
    }

    setSessions((list) => [...list, { ...form, prodi: form.prodi.trim(), semester: Number(form.semester), _id: crypto.randomUUID?.() ?? String(Date.now()) }])
    setForm(EMPTY_SESSION)
    setFormErrors([])
  }

  async function saveNewCourse(e) {
    e.preventDefault()
    const errors = validateCourseEntry(courseForm)
    setCourseErrors(errors)
    if (errors.length > 0) return

    const kodeMK = courseForm.kodeMK.trim().toUpperCase()
    const result = await setDocument('mataKuliah', kodeMK, { ...courseForm, kodeMK }, actor)
    if (result.ok) {
      await appendHistory({ entitas: 'mataKuliah', field: 'tambah', nilaiLama: null, nilaiBaru: courseForm, aktor: actor })
      setBanner({ ok: true, message: `Mata kuliah ${kodeMK} tersimpan — bisa dipakai di sesi.` })
      setCourseForm(EMPTY_COURSE)
      setCourseOpen(false)
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  async function saveDraft() {
    if (sessions.length === 0) {
      setBanner({ ok: false, message: 'Belum ada sesi untuk disimpan.' })
      return
    }
    setBusy(true)
    let okCount = 0
    let failCount = 0
    for (const session of sessions) {
      const { _id, ...data } = session
      const result = await addDocument('jadwal', { ...data, status: 'draft' }, actor)
      if (result.ok) okCount += 1
      else failCount += 1
    }
    if (okCount > 0) {
      await appendHistory({
        entitas: 'jadwal',
        field: 'input-manual',
        nilaiLama: null,
        nilaiBaru: `${okCount} entri`,
        aktor: actor,
      })
    }
    setBanner(
      failCount === 0
        ? { ok: true, message: `${okCount} sesi disimpan sebagai draft.` }
        : { ok: false, message: `${okCount} tersimpan, ${failCount} gagal.` },
    )
    if (failCount === 0) setSessions([])
    setBusy(false)
  }

  async function saveAndPublish() {
    if (sessions.length === 0) {
      setBanner({ ok: false, message: 'Belum ada sesi untuk dipublikasikan.' })
      return
    }
    setBusy(true)
    const ids = []
    for (const session of sessions) {
      const { _id, ...data } = session
      const result = await addDocument('jadwal', { ...data, status: 'draft' }, actor)
      if (result.ok) ids.push(result.id)
    }
    if (ids.length === 0) {
      setBanner({ ok: false, message: 'Gagal menyimpan sesi.' })
      setBusy(false)
      return
    }
    const pubResult = await publishDocuments('jadwal', ids, actor)
    await appendHistory({
      entitas: 'jadwal',
      field: 'publish',
      nilaiLama: null,
      nilaiBaru: `${ids.length} entri manual`,
      aktor: actor,
    })
    setBanner(
      pubResult.ok
        ? { ok: true, message: `${pubResult.publishedCount} sesi dipublikasikan ke mahasiswa.` }
        : { ok: false, message: `Publikasi gagal: ${pubResult.error}` },
    )
    if (pubResult.ok) setSessions([])
    setBusy(false)
  }

  return (
    <div className="space-y-lg">
      <header>
        <div className="flex items-center gap-md">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary-container/50 dark:bg-secondary-container/25 text-secondary">
            <Icon name="edit_note" size={26} />
          </span>
          <h2 className="text-headline-lg font-bold text-on-surface">Input Jadwal Manual</h2>
        </div>
        <p className="text-body-lg text-on-surface-variant">
          Tambah satu per satu sesi kelas tanpa upload file — kumpulkan lalu simpan/publish.
        </p>
      </header>

      {banner && (
        <StatusBanner
          ok={banner.ok}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* Form mata kuliah baru */}
      <section className="rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low">
        <button
          type="button"
          onClick={() => setCourseOpen((open) => !open)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-title-md text-on-surface">
            Mata Kuliah Baru (opsional)
          </span>
          <Icon name={courseOpen ? 'expand_less' : 'add'} size={22} className="text-primary" />
        </button>
        {courseOpen && (
          <form onSubmit={saveNewCourse} className="mt-md grid gap-md tablet:grid-cols-3">
            <Input label="Kode MK" value={courseForm.kodeMK} onChange={(e) => setCourseForm((f) => ({ ...f, kodeMK: e.target.value }))} placeholder="mis. IF305" />
            <Input label="Nama MK" value={courseForm.namaMK} onChange={(e) => setCourseForm((f) => ({ ...f, namaMK: e.target.value }))} />
            <Input label="Dosen" value={courseForm.dosen} onChange={(e) => setCourseForm((f) => ({ ...f, dosen: e.target.value }))} />
            <Input label="Kontak Dosen" value={courseForm.kontakDosen} onChange={(e) => setCourseForm((f) => ({ ...f, kontakDosen: e.target.value }))} />
            <Input label="SKS" type="number" min="1" max="6" value={courseForm.sks} onChange={(e) => setCourseForm((f) => ({ ...f, sks: Number(e.target.value) }))} />
            <Input label="Durasi (menit)" type="number" min="30" max="300" step="10" value={courseForm.durasi} onChange={(e) => setCourseForm((f) => ({ ...f, durasi: Number(e.target.value) }))} />
            <div className="col-span-full flex justify-end gap-sm">
              <Button type="submit" disabled={busy}>
                <Icon name="save" size={20} /> Simpan Mata Kuliah
              </Button>
            </div>
            {courseErrors.length > 0 && (
              <ul className="col-span-full list-inside list-disc text-body-sm text-error">
                {courseErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            )}
          </form>
        )}
      </section>

      {/* Form sesi */}
      <form
        onSubmit={addSession}
        className="grid gap-md rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low tablet:grid-cols-4 desktop:grid-cols-8"
      >
        <h3 className="col-span-full text-title-md text-on-surface">Sesi Kelas</h3>
        <label className="block">
          <span className="mb-1 block text-body-sm text-on-surface-variant">Hari</span>
          <select
            value={form.hari}
            onChange={(e) => update('hari', e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface dark:bg-surface-container-low"
          >
            {DAYS.map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </label>
        <Input label="Jam Mulai" type="time" value={form.jamMulai} onChange={(e) => update('jamMulai', e.target.value)} />
        <Input label="Jam Selesai" type="time" value={form.jamSelesai} onChange={(e) => update('jamSelesai', e.target.value)} />
        <Input label="Prodi" value={form.prodi} onChange={(e) => update('prodi', e.target.value)} placeholder="mis. Informatika" />
        <Input label="Semester" type="number" min="1" max="14" value={form.semester} onChange={(e) => update('semester', Number(e.target.value))} />
        <label className="block">
          <span className="mb-1 block text-body-sm text-on-surface-variant">Kode MK</span>
          <select
            value={form.kodeMK}
            onChange={(e) => update('kodeMK', e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface dark:bg-surface-container-low"
          >
            <option value="">— Pilih MK —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.kodeMK}>
                {c.kodeMK} — {c.namaMK}
              </option>
            ))}
          </select>
        </label>
        <Input label="Ruang" value={form.ruang} onChange={(e) => update('ruang', e.target.value)} placeholder="mis. R.302" />
        <label className="block">
          <span className="mb-1 block text-body-sm text-on-surface-variant">Tipe Kelas</span>
          <select
            value={form.tipeKelas}
            onChange={(e) => update('tipeKelas', e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface dark:bg-surface-container-low"
          >
            {CLASS_TYPE_CODES.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </label>
        <div className="col-span-full flex justify-end">
          <Button type="submit" disabled={loading}>
            <Icon name="add" size={20} /> Tambah ke Daftar Sesi
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

      {/* Daftar sesi yang dikumpulkan */}
      {sessions.length > 0 && (
        <section className="rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low">
          <h3 className="mb-md text-title-md text-on-surface">
            Sesi Siap Simpan ({sessions.length})
          </h3>
          <ul className="divide-y divide-surface-variant">
            {sessions.map((session) => (
              <li key={session._id} className="flex items-center justify-between gap-sm py-sm">
                <span className="min-w-0 truncate text-body-sm text-on-surface">
                  <strong>{session.kodeMK}</strong> • {session.hari}, {session.jamMulai}–{session.jamSelesai} • {session.prodi} Sem {session.semester} • {session.ruang} ({session.tipeKelas})
                </span>
                <button
                  type="button"
                  onClick={() => setSessions((list) => list.filter((s) => s._id !== session._id))}
                  className="shrink-0 rounded-full p-xs text-on-surface-variant hover:bg-error/10 hover:text-error"
                  aria-label={`Hapus sesi ${session.kodeMK}`}
                >
                  <Icon name="close" size={18} />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-md flex justify-end gap-sm">
            <Button variant="secondary" onClick={saveDraft} disabled={busy}>
              <Icon name="save" size={20} /> Simpan sebagai Draft
            </Button>
            <Button onClick={saveAndPublish} disabled={busy}>
              <Icon name="publish" size={20} /> Publikasikan Sekarang
            </Button>
          </div>
        </section>
      )}

      {sessions.length === 0 && !loading && (
        <p className="py-md text-center text-body-sm text-on-surface-variant">
          Sesi yang ditambahkan muncul di sini sebelum disimpan.
        </p>
      )}
    </div>
  )
}
