import { useState } from 'react'
import { updateDocument, deleteDocument } from '../../../lib/adminData'
import { appendHistory } from '../../../lib/publishHelpers'

// Hook untuk aksi massal terhadap banyak dokumen jadwal sekaligus:
// ubah status (publish/archive/draft) dan hapus massal.
export function useBulkMutations({ ctx, setBusy, setBanner }) {
  const { actor } = ctx
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  async function handleBulkStatusChange(selectedIds, setSelectedIds, newStatus) {
    if (selectedIds.size === 0) return
    setBusy(true)
    const results = await Promise.allSettled(
      Array.from(selectedIds).map((id) => updateDocument('jadwal', id, { status: newStatus }, actor)),
    )
    const okCount = results.filter((r) => r.status === 'fulfilled' && r.value?.ok).length
    setBusy(false)
    setSelectedIds(new Set())
    if (okCount > 0) {
      await appendHistory({
        entitas: 'jadwal',
        field: 'bulk_status',
        nilaiLama: null,
        nilaiBaru: { count: okCount, status: newStatus },
        aktor: actor,
        detail: `Ubah status ${okCount} jadwal menjadi ${newStatus}`,
      })
      setBanner({ ok: true, message: `${okCount} jadwal berhasil diubah menjadi ${newStatus}!` })
    } else {
      setBanner({ ok: false, message: 'Gagal mengubah status jadwal massal.' })
    }
  }

  async function handleBulkDelete(selectedIds, setSelectedIds) {
    if (selectedIds.size === 0) return
    setBusy(true)
    const count = selectedIds.size
    const results = await Promise.allSettled(Array.from(selectedIds).map((id) => deleteDocument('jadwal', id)))
    const okCount = results.filter((r) => r.status === 'fulfilled' && r.value?.ok).length
    setBusy(false)
    setBulkDeleteOpen(false)
    setSelectedIds(new Set())
    if (okCount > 0) {
      await appendHistory({
        entitas: 'jadwal',
        field: 'bulk_hapus',
        nilaiLama: null,
        nilaiBaru: { count: okCount },
        aktor: actor,
        detail: `Hapus massal ${okCount} jadwal`,
      })
      setBanner({ ok: true, message: `${okCount} dari ${count} jadwal berhasil dihapus!` })
    } else {
      setBanner({ ok: false, message: 'Gagal menghapus jadwal terpilih.' })
    }
  }

  return { bulkDeleteOpen, setBulkDeleteOpen, handleBulkStatusChange, handleBulkDelete }
}
