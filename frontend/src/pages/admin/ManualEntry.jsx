import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { FormSelect } from '../../components/FormSelect'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { addDocument, setDocument } from '../../lib/adminData'
import { appendHistory, publishDocuments } from '../../lib/publishHelpers'
import { deriveTahunAjaran } from '../../lib/tahunAjaran'
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
      setBanner({ ok: true, message: `Mata kuliah ${kodeMK} tersimpan - bisa dipakai di sesi.` })
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
    const draftResults = await Promise.allSettled(
      sessions.map((session) => {
        const { _id, ...data } = session
        return addDocument(
          'jadwal',
          {
            ...data,
            tahunAjaran: session.tahunAjaran || deriveTahunAjaran(),
            status: 'draft',
          },
          actor,
        )
      }),
    )
    let okCount = 0
    let failCount = 0
    draftResults.forEach((r) => {
      if (r.status === 'fulfilled' && r.value?.ok) okCount += 1
      else failCount += 1
    })
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
    const publishResults = await Promise.allSettled(
      sessions.map((session) => {
        const { _id, ...data } = session
        return addDocument(
          'jadwal',
          {
            ...data,
            tahunAjaran: session.tahunAjaran || deriveTahunAjaran(),
            status: 'draft',
          },
          actor,
        )
      }),
    )
    const ids = publishResults.filter((r) => r.status === 'fulfilled' && r.value?.ok).map((r) => r.value.id)
    if (ids.length === 0) {
      setBanner({ ok: false, message: 'Gagal menyimpan sesi.' })
      setBusy(false)
      return
    }
    const pubResult = await publishDocuments('jadwal', ids, actor)
    if (pubResult.ok) {
      await appendHistory({
        entitas: 'jadwal',
        field: 'publish',
        nilaiLama: null,
        nilaiBaru: `${ids.length} entri manual`,
        aktor: actor,
      })
    }
    setBanner(
      pubResult.ok
        ? { ok: true, message: `${pubResult.publishedCount} sesi dipublikasikan ke mahasiswa.` }
        : { ok: false, message: `Publikasi gagal: ${pubResult.error}` },
    )
    if (pubResult.ok) setSessions([])
    setBusy(false)
  }

  return (
    <div className="h-full flex flex-col gap-4 tablet:gap-4 pb-20 tablet:pb-0 animate-fade-in w-full max-w-full overflow-x-hidden min-h-0 flex-1">
      <header className="shrink-0">
        <div className="flex items-center gap-md">
          <span className="flex h-10 w-10 tablet:h-11 tablet:w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary-container/60 text-secondary shadow-level-1 dark:bg-secondary-container/30">
            <Icon name="edit_note" size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl tablet:text-2xl font-bold tracking-tight text-on-surface">Input Jadwal Manual</h2>
            <p className="text-label-caps tablet:text-body-xs font-normal text-on-surface-variant truncate">Tambah satu per satu sesi kelas tanpa upload file — kumpulkan lalu simpan/publish.</p>
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

      {/* Form mata kuliah baru */}
      <section className="shrink-0 rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 tablet:p-5 shadow-level-1 dark:bg-surface-container-low">
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
        className="shrink-0 grid gap-3 tablet:gap-4 rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 tablet:p-5 shadow-level-1 dark:bg-surface-container-low tablet:grid-cols-4 desktop:grid-cols-8"
      >
        <h3 className="col-span-full text-body-sm tablet:text-title-sm font-bold text-on-surface">Sesi Kelas</h3>
        <div>
          <label className="mb-1 block text-body-sm font-semibold text-on-surface-variant">Hari</label>
          <FormSelect
            value={form.hari}
            onChange={(val) => update('hari', val)}
            options={DAYS.map((day) => ({ value: day, label: day }))}
          />
        </div>
        <Input label="Jam Mulai" type="time" value={form.jamMulai} onChange={(e) => update('jamMulai', e.target.value)} />
        <Input label="Jam Selesai" type="time" value={form.jamSelesai} onChange={(e) => update('jamSelesai', e.target.value)} />
        <Input label="Prodi" value={form.prodi} onChange={(e) => update('prodi', e.target.value)} placeholder="mis. Informatika" />
        <Input label="Semester" type="number" min="1" max="14" value={form.semester} onChange={(e) => update('semester', Number(e.target.value))} />
        <div>
          <label className="mb-1 block text-body-sm font-semibold text-on-surface-variant">Kode MK</label>
          <FormSelect
            value={form.kodeMK}
            onChange={(val) => update('kodeMK', val)}
            placeholder="- Pilih MK -"
            options={courses.map((c) => ({
              value: c.kodeMK,
              label: `${c.kodeMK} - ${c.namaMK}`,
            }))}
          />
        </div>
        <Input label="Ruang" value={form.ruang} onChange={(e) => update('ruang', e.target.value)} placeholder="mis. R.302" />
        <div>
          <label className="mb-1 block text-body-sm font-semibold text-on-surface-variant">Tipe Kelas</label>
          <FormSelect
            value={form.tipeKelas}
            onChange={(val) => update('tipeKelas', val)}
            options={CLASS_TYPE_CODES.map((code) => ({ value: code, label: code }))}
          />
        </div>
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
        <section className="flex-1 flex flex-col min-h-0 rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 tablet:p-5 shadow-level-1 dark:bg-surface-container-low">
          <h3 className="text-body-sm tablet:text-title-sm font-bold text-on-surface shrink-0 pb-3 border-b border-outline-variant/15">
            Sesi Siap Simpan ({sessions.length})
          </h3>
          <ul className="flex-1 divide-y divide-outline-variant/15 overflow-y-auto min-h-0 mt-2 pr-1">
            {sessions.map((session) => (
              <li key={session._id} className="flex items-center justify-between gap-2 py-2.5">
                <span className="min-w-0 truncate text-body-sm text-on-surface">
                  <strong>{session.kodeMK}</strong> • {session.hari}, {session.jamMulai}-{session.jamSelesai} • {session.prodi} Sem {session.semester} • {session.ruang} ({session.tipeKelas})
                </span>
                <button
                  type="button"
                  onClick={() => setSessions((list) => list.filter((s) => s._id !== session._id))}
                  className="shrink-0 rounded-full p-2 text-on-surface-variant hover:bg-error/10 hover:text-error cursor-pointer"
                  aria-label={`Hapus sesi ${session.kodeMK}`}
                >
                  <Icon name="close" size={18} />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/15 shrink-0 mt-2">
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
        <div className="flex-1 flex flex-col items-center justify-center rounded-3xl border border-outline-variant/20 bg-surface-container-lowest/50 p-8 dark:bg-surface-container-low/40 min-h-[180px]">
          <Icon name="inbox" size={28} className="text-on-surface-variant/40 mb-2" />
          <p className="text-body-sm font-medium text-on-surface-variant">Sesi yang ditambahkan muncul di sini sebelum disimpan.</p>
        </div>
      )}
    </div>
  )
}
