import { useState } from 'react'
import { setDocument } from '../../../lib/adminData'
import { publishDocuments, appendHistory, saveSettings } from '../../../lib/publishHelpers'
import { validateCourseEntry } from '../../../lib/uploadValidator'
import { jadwalDocId } from '../../../lib/scheduleUtils'

export const EMPTY_COURSE = {
  kodeMK: '',
  namaMK: '',
  dosen: '',
  kontakDosen: '',
  sks: 2,
  durasi: 100,
  semester: 1,
}

// Hook untuk mutasi tingkat mata kuliah: impor jadwal universal (yang ikut
// menyimpan MK + jadwal + ujian) dan pembuatan MK cepat dari modal.
export function useCourseMutations({ ctx, setBusy, setBanner }) {
  const { actor, currentTA, prodiFakultasMap, setImportModalOpen, setManualForm } = ctx

  const [newCourseOpen, setNewCourseOpen] = useState(false)
  const [newCourseForm, setNewCourseForm] = useState(EMPTY_COURSE)
  const [newCourseErrors, setNewCourseErrors] = useState([])
  const [savingCourse, setSavingCourse] = useState(false)

  async function persistImportCourses(courses) {
    const results = await Promise.allSettled(
      (courses || []).filter((c) => c.kodeMK).map((c) => setDocument('mataKuliah', c.kodeMK, c, actor)),
    )
    const failed = results.filter((r) => r.status === 'rejected' || !r.value?.ok).length
    if (failed > 0) setBanner({ ok: false, message: `${failed} mata kuliah gagal disimpan. Periksa koneksi/rules.` })
  }

  async function persistImportSchedules(entries, targetTA) {
    const docs = (entries || []).map((e) => {
      const _fId = String(prodiFakultasMap.get(String(e.prodi || '')) || '').trim() || null
      return { ...e, id: jadwalDocId(e, targetTA), fakultasId: _fId, tahunAjaran: targetTA, status: 'published' }
    })
    const results = await Promise.allSettled(
      docs.map(async (doc) => {
        const { id, ...data } = doc
        return setDocument('jadwal', id, data, actor)
      }),
    )
    const failed = results.filter((r) => r.status === 'rejected' || !r.value?.ok).length
    if (failed > 0) setBanner({ ok: false, message: `${failed} sesi jadwal gagal disimpan.` })
    const res = await publishDocuments('jadwal', docs.map((d) => d.id), actor)
    return { docs, res }
  }

  async function persistImportExams(exams, targetTA) {
    if (!exams || exams.length === 0) return
    const docs = exams.map((ex) => ({
      id: `${ex.prodi}|${ex.kodeMK}|${ex.jenis}|${ex.tanggal}`.replace(/[/#?[\]]/g, '-'),
      ...ex,
      tahunAjaran: targetTA,
      status: 'published',
    }))
    await Promise.allSettled(
      docs.map(async (doc) => {
        const { id, ...data } = doc
        return setDocument('ujian', id, data, actor)
      }),
    )
    await publishDocuments('ujian', docs.map((d) => d.id), actor)
  }

  async function handleUniversalImportSave(parsedData) {
    setBusy(true)
    const targetTA = parsedData.tahunAjaran || currentTA

    await persistImportCourses(parsedData.courses)
    const { docs: scheduleDocs, res } = await persistImportSchedules(parsedData.scheduleEntries, targetTA)
    await persistImportExams(parsedData.exams, targetTA)

    setBusy(false)
    if (res.ok) {
      await saveSettings({ lastUpdated: new Date().toISOString() }, actor)
      await appendHistory({
        entitas: 'jadwal',
        field: 'upload_universal',
        nilaiLama: null,
        nilaiBaru: { count: scheduleDocs.length, tahunAjaran: targetTA },
        aktor: actor,
        detail: `Impor jadwal universal TA ${targetTA} (${scheduleDocs.length} jadwal)`,
      })
      setBanner({
        ok: true,
        message: `Berhasil mengimpor & mempublikasikan ${scheduleDocs.length} sesi jadwal untuk TA ${targetTA}!`,
      })
      setImportModalOpen(false)
    } else {
      setBanner({ ok: false, message: res.error || 'Gagal menyimpan berkas jadwal' })
    }
  }

  async function handleSaveNewCourse(e, onSaved) {
    e.preventDefault()
    const errors = validateCourseEntry(newCourseForm)
    setNewCourseErrors(errors)
    if (errors.length > 0) return

    setSavingCourse(true)
    const kodeMK = newCourseForm.kodeMK.trim().toUpperCase()
    const result = await setDocument('mataKuliah', kodeMK, { ...newCourseForm, kodeMK }, actor)
    setSavingCourse(false)
    if (result.ok) {
      await appendHistory({
        entitas: 'mataKuliah',
        field: 'tambah',
        nilaiLama: null,
        nilaiBaru: newCourseForm,
        aktor: actor,
        detail: `Tambah MK baru ${kodeMK}`,
      })
      setBanner({ ok: true, message: `Mata kuliah ${kodeMK} berhasil ditambahkan!` })
      // Isi otomatis kodeMK ke form sesi manual agar admin lanjut input jadwal.
      if (typeof setManualForm === 'function') setManualForm((f) => ({ ...f, kodeMK }))
      if (typeof onSaved === 'function') onSaved(kodeMK)
      setNewCourseForm(EMPTY_COURSE)
      setNewCourseOpen(false)
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  return {
    newCourseOpen,
    setNewCourseOpen,
    newCourseForm,
    setNewCourseForm,
    newCourseErrors,
    setNewCourseErrors,
    savingCourse,
    handleUniversalImportSave,
    handleSaveNewCourse,
  }
}
