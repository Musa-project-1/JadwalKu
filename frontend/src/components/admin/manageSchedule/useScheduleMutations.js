import { useState } from 'react'
import { setDocument, updateDocument, deleteDocument } from '../../../lib/adminData'
import { appendHistory } from '../../../lib/publishHelpers'
import { expectedTahunAjaranForSemester } from '../../../lib/tahunAjaran'
import { validateScheduleEntry } from '../../../lib/uploadValidator'
import { jadwalDocId } from '../../../lib/scheduleUtils'
import { useCourseMutations } from './useCourseMutations'
import { useBulkMutations } from './useBulkMutations'

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

// Hook utama orkestrasi mutasi jadwal. Mengomposisikan useCourseMutations
// (impor universal + MK cepat) dan useBulkMutations (aksi massal) agar tiap
// modul tetap kecil, kohesif, dan di bawah batas 450 baris.
export function useScheduleMutations({ actor, currentTA, prodiFakultasMap, academicCalendar, setBanner, setImportModalOpen }) {
  const [busy, setBusy] = useState(false)

  // State Input Manual Modal
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [manualForm, setManualForm] = useState(EMPTY_SESSION)
  const [manualErrors, setManualErrors] = useState([])

  // State Edit Jadwal Modal
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_SESSION)
  const [editErrors, setEditErrors] = useState([])

  // State Group Edit Modal
  const [groupEditing, setGroupEditing] = useState(null)

  // State Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState(null)

  const ctx = { actor, currentTA, prodiFakultasMap, setImportModalOpen, setManualForm }
  const course = useCourseMutations({ ctx, setBusy, setBanner })
  const bulk = useBulkMutations({ ctx, setBusy, setBanner })

  // Handler Tambah Sesi Manual
  async function handleAddManualSession(e) {
    e.preventDefault()
    const errors = validateScheduleEntry(manualForm)
    setManualErrors(errors)
    if (errors.length > 0) return

    setBusy(true)
    const _manualTA =
      expectedTahunAjaranForSemester(Number(manualForm.semester) || 1, new Date(), academicCalendar) || currentTA
    const docId = jadwalDocId(manualForm, _manualTA)
    const newDoc = {
      ...manualForm,
      semester: Number(manualForm.semester),
      fakultasId: String(prodiFakultasMap.get(String(manualForm.prodi || '')) || '').trim() || null,
      tahunAjaran: _manualTA,
      status: 'published',
    }

    const result = await setDocument('jadwal', docId, newDoc, actor)
    setBusy(false)
    if (result.ok) {
      await appendHistory({
        entitas: 'jadwal',
        field: 'tambah_manual',
        nilaiLama: null,
        nilaiBaru: newDoc,
        aktor: actor,
        detail: `Tambah jadwal manual ${newDoc.kodeMK} (${newDoc.hari} ${newDoc.jamMulai})`,
      })
      setBanner({ ok: true, message: `Sesi jadwal ${newDoc.kodeMK} (${newDoc.hari}) berhasil disimpan!` })
      setManualForm(EMPTY_SESSION)
      setManualErrors([])
      setAddModalOpen(false)
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  // Handler Edit Jadwal
  function openEditModal(item) {
    setEditingItem(item)
    setEditForm({
      prodi: item.prodi,
      semester: item.semester,
      hari: item.hari,
      jamMulai: item.jamMulai,
      jamSelesai: item.jamSelesai,
      kodeMK: item.kodeMK,
      ruang: item.ruang ?? '',
      tipeKelas: item.tipeKelas ?? 'K1',
      status: item.status ?? 'published',
    })
    setEditErrors([])
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    const errors = validateScheduleEntry(editForm)
    setEditErrors(errors)
    if (errors.length > 0) return

    setBusy(true)
    const updatedData = { ...editForm, semester: Number(editForm.semester) }
    const result = await updateDocument('jadwal', editingItem.id, updatedData, actor)
    setBusy(false)
    if (result.ok) {
      await appendHistory({
        entitas: 'jadwal',
        field: 'edit',
        nilaiLama: editingItem,
        nilaiBaru: updatedData,
        aktor: actor,
        detail: `Edit jadwal ${editingItem.kodeMK} (${updatedData.hari} ${updatedData.jamMulai})`,
      })
      setBanner({ ok: true, message: `Jadwal ${editingItem.kodeMK} berhasil diperbarui!` })
      setEditingItem(null)
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  // Handler Duplikasi Sesi
  function handleDuplicate(item) {
    const nextType = item.tipeKelas === 'K1' ? 'K2' : item.tipeKelas === 'K2' ? 'K3' : 'K1'
    setManualForm({
      prodi: item.prodi,
      semester: item.semester,
      hari: item.hari,
      jamMulai: item.jamMulai,
      jamSelesai: item.jamSelesai,
      kodeMK: item.kodeMK,
      ruang: item.ruang,
      tipeKelas: nextType,
    })
    setManualErrors([])
    setAddModalOpen(true)
  }

  // Handler Hapus Jadwal (single atau grup)
  async function handleDeleteSingle() {
    if (!deleteTarget) return
    const target = deleteTarget
    if (target._group) {
      const ids = target._group.items.map((it) => it.id)
      setBusy(true)
      const delResults = await Promise.allSettled(ids.map((id) => deleteDocument('jadwal', id)))
      const okCount = delResults.filter((r) => r.status === 'fulfilled' && r.value?.ok).length
      setBusy(false)
      setDeleteTarget(null)
      if (okCount > 0) {
        await appendHistory({
          entitas: 'jadwal',
          field: 'hapus_grup',
          nilaiLama: target._group,
          nilaiBaru: null,
          aktor: actor,
          detail: `Hapus grup ${target._group.items[0]?.kodeMK} (${okCount} sesi)`,
        })
        setBanner({ ok: true, message: `${okCount} sesi grup ${target._group.items[0]?.kodeMK} berhasil dihapus!` })
      } else {
        setBanner({ ok: false, message: 'Gagal menghapus grup.' })
      }
      return
    }
    setBusy(true)
    const result = await deleteDocument('jadwal', target.id)
    setBusy(false)
    setDeleteTarget(null)
    if (result.ok) {
      await appendHistory({
        entitas: 'jadwal',
        field: 'hapus',
        nilaiLama: target,
        nilaiBaru: null,
        aktor: actor,
        detail: `Hapus jadwal ${target.kodeMK} (${target.hari})`,
      })
      setBanner({ ok: true, message: `Jadwal ${target.kodeMK} berhasil dihapus!` })
    } else {
      setBanner({ ok: false, message: result.error })
    }
  }

  // Group Edit
  function openGroupEditModal(group) {
    const first = group.items[0]
    setGroupEditing({
      group,
      editForm: {
        hari: first.hari,
        jamMulai: first.jamMulai,
        jamSelesai: first.jamSelesai,
        kodeMK: first.kodeMK,
        ruang: first.ruang ?? '',
        tipeKelas: first.tipeKelas ?? 'K1',
        status: first.status ?? 'published',
      },
    })
    setEditErrors([])
  }

  function patchGroupForm(patch) {
    setGroupEditing((s) => (s ? { ...s, editForm: { ...s.editForm, ...patch } } : s))
  }

  async function handleSaveGroupEdit(e) {
    e.preventDefault()
    if (!groupEditing) return
    const errors = validateScheduleEntry({
      ...groupEditing.editForm,
      prodi: groupEditing.group.items[0].prodi,
      semester: groupEditing.group.items[0].semester,
    })
    setEditErrors(errors)
    if (errors.length > 0) return

    setBusy(true)
    const results = await Promise.allSettled(
      groupEditing.group.items.map((item) => updateDocument('jadwal', item.id, { ...groupEditing.editForm }, actor)),
    )
    const okCount = results.filter((r) => r.status === 'fulfilled' && r.value?.ok).length
    setBusy(false)
    if (okCount > 0) {
      await appendHistory({
        entitas: 'jadwal',
        field: 'edit_grup',
        nilaiLama: groupEditing.group,
        nilaiBaru: groupEditing.editForm,
        aktor: actor,
        detail: `Edit grup ${groupEditing.group.items[0].kodeMK} (${okCount} sesi)`,
      })
      setBanner({ ok: true, message: `Grup ${groupEditing.group.items[0].kodeMK} (${okCount} sesi) berhasil diperbarui!` })
      setGroupEditing(null)
    } else {
      setBanner({ ok: false, message: 'Gagal menyimpan edit grup.' })
    }
  }

  return {
    busy,
    setBusy,
    addModalOpen,
    setAddModalOpen,
    manualForm,
    setManualForm,
    manualErrors,
    setManualErrors,
    editingItem,
    setEditingItem,
    editForm,
    setEditForm,
    editErrors,
    setEditErrors,
    groupEditing,
    setGroupEditing,
    deleteTarget,
    setDeleteTarget,
    handleAddManualSession,
    openEditModal,
    handleSaveEdit,
    handleDuplicate,
    handleDeleteSingle,
    openGroupEditModal,
    patchGroupForm,
    handleSaveGroupEdit,
    EMPTY_SESSION,
    ...course,
    ...bulk,
  }
}
