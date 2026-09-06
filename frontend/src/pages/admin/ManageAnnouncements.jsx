import { useState, useMemo, useEffect } from 'react'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/Button'
import { FormSelect } from '../../components/FormSelect'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { useFirestore } from '../../hooks/useFirestore'
import { StatusBanner } from '../../components/StatusBanner'
import { useDebounce } from '../../hooks/useDebounce'
import { addDocument, updateDocument, deleteDocument } from '../../lib/adminData'
import { useCampus } from '../../context/useCampus'
import { AnnouncementFormModal } from '../../components/admin/announcements/AnnouncementFormModal'

export default function ManageAnnouncements() {
  const { data: announcements, loading, error: announcementError } = useFirestore('announcements', [], { limit: 100, orderByField: 'createdAt', orderByDir: 'desc' })
  const { data: settingsDocs } = useFirestore('settings')

  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const debouncedSearchQuery = useDebounce(searchQuery, 250)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState(null)

  // Form State
  const [formJudul, setFormJudul] = useState('')
  const [formIsi, setFormIsi] = useState('')
  const [formKategori, setFormKategori] = useState('info')
  const [formProdi, setFormProdi] = useState('all')
  const [formSemester, setFormSemester] = useState('all')
  const [formBerlakuHingga, setFormBerlakuHingga] = useState('')
  const [formAktif, setFormAktif] = useState(true)

  const { prodiNames } = useCampus()

  const availableProdis = useMemo(() => {
    const appDoc = settingsDocs.find((d) => d.id === 'app')
    if (Array.isArray(appDoc?.prodis) && appDoc.prodis.length > 0) {
      return appDoc.prodis
    }
    return prodiNames.filter(Boolean)
  }, [settingsDocs, prodiNames])

  const filteredAnnouncements = useMemo(() => {
    let list = Array.isArray(announcements) ? [...announcements] : []

    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase().trim()
      list = list.filter(
        (a) =>
          a.judul?.toLowerCase().includes(q) ||
          a.isi?.toLowerCase().includes(q) ||
          a.targetProdi?.toLowerCase().includes(q),
      )
    }

    if (filterCategory !== 'all') {
      list = list.filter((a) => a.kategori === filterCategory)
    }

    if (filterStatus === 'active') {
      list = list.filter((a) => a.aktif !== false)
    } else if (filterStatus === 'inactive') {
      list = list.filter((a) => a.aktif === false)
    }

    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, [announcements, debouncedSearchQuery, filterCategory, filterStatus])

  // Support ESC key to close modal
  useEffect(() => {
    if (!modalOpen) return
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !saving) setModalOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalOpen, saving])

  function openAddModal() {
    setEditingItem(null)
    setFormJudul('')
    setFormIsi('')
    setFormKategori('info')
    setFormProdi('all')
    setFormSemester('all')
    setFormBerlakuHingga('')
    setFormAktif(true)
    setModalOpen(true)
  }

  function openEditModal(item) {
    setEditingItem(item)
    setFormJudul(item.judul || '')
    setFormIsi(item.isi || '')
    setFormKategori(item.kategori || 'info')
    setFormProdi(item.targetProdi || 'all')
    setFormSemester(item.targetSemester ? String(item.targetSemester) : 'all')
    setFormBerlakuHingga(item.berlakuHingga || '')
    setFormAktif(item.aktif !== false)
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!formJudul.trim()) return

    setSaving(true)
    try {
      const payload = {
        judul: formJudul.trim(),
        isi: formIsi.trim(),
        kategori: formKategori,
        targetProdi: formProdi,
        targetSemester: formSemester === 'all' ? 'all' : Number(formSemester),
        berlakuHingga: formBerlakuHingga || null,
        aktif: formAktif,
        updatedAt: new Date().toISOString(),
      }

      let res
      if (editingItem) {
        res = await updateDocument('announcements', editingItem.id, payload)
      } else {
        payload.createdAt = new Date().toISOString()
        res = await addDocument('announcements', payload)
      }
      if (!res.ok) {
        setBanner({ ok: false, message: res.error || 'Gagal menyimpan pengumuman.' })
        return
      }
      setBanner({ ok: true, message: editingItem ? '✓ Pengumuman berhasil diperbarui.' : '✓ Pengumuman berhasil dibuat.' })
      setModalOpen(false)
    } catch (err) {
      console.error('Failed to save announcement:', err)
      setBanner({ ok: false, message: `Gagal menyimpan pengumuman: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(item) {
    try {
      const res = await updateDocument('announcements', item.id, {
        aktif: !item.aktif,
        updatedAt: new Date().toISOString(),
      })
      if (!res.ok) setBanner({ ok: false, message: res.error || 'Gagal mengubah status.' })
    } catch (err) {
      console.error('Failed to toggle status:', err)
      setBanner({ ok: false, message: `Gagal mengubah status: ${err.message}` })
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      const res = await deleteDocument('announcements', deleteTarget.id)
      if (!res.ok) {
        setBanner({ ok: false, message: res.error || 'Gagal menghapus pengumuman.' })
        return
      }
      setBanner({ ok: true, message: '✓ Pengumuman telah dihapus.' })
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete announcement:', err)
      setBanner({ ok: false, message: `Gagal menghapus pengumuman: ${err.message}` })
    }
  }

  return (
    <div className="space-y-6">
      {/* ── 1. Page Header ── */}
      <header className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-3 tablet:px-4 tablet:py-3 shadow-level-1 flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between w-full shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-level-1 dark:bg-amber-500/10 dark:text-amber-400">
            <Icon name="campaign" size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl tablet:text-2xl font-bold tracking-tight text-on-surface">
                Kelola Pengumuman
              </h1>
              <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 text-label-caps font-bold border border-amber-500/20">
                Siaran Mahasiswa
              </span>
            </div>
            <p className="mt-0.5 text-body-xs text-on-surface-variant font-medium truncate">
              Siarkan informasi penting, kuliah pengganti, atau perubahan ruang ke beranda mahasiswa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            onClick={openAddModal}
            className="rounded-full px-4 py-2 font-bold shadow-level-1 cursor-pointer text-body-xs shrink-0 bg-primary text-on-primary"
          >
            <Icon name="add" size={16} className="mr-1" />
            <span>Buat Pengumuman</span>
          </Button>
        </div>
      </header>

      {/* ── 2. Toolbar & Filter Dropdowns (1-Row Horizontal Compact) ── */}
      <div className="flex flex-col tablet:flex-row items-center justify-between gap-2 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-level-1">
        <div className="relative flex-1 min-w-[200px] w-full">
          <Icon
            name="search"
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul atau isi pengumuman..."
            className="w-full rounded-full border border-outline-variant/30 bg-surface-container-lowest py-2 pl-9 pr-8 text-body-xs font-medium text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none dark:bg-surface-container-high transition-all shadow-level-1"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-on-surface-variant hover:bg-surface-container cursor-pointer"
            >
              <Icon name="close" size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full tablet:w-auto shrink-0">
          <FormSelect
            value={filterCategory}
            onChange={setFilterCategory}
            options={[
              { value: 'all', label: 'Semua Kategori' },
              { value: 'info', label: '🔵 Info Umum' },
              { value: 'warning', label: '🟡 Penting / Pengganti' },
              { value: 'urgent', label: '🔴 Darurat / Pindah Ruang' },
            ]}
          />

          <FormSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'active', label: '🟢 Aktif' },
              { value: 'inactive', label: '⚪ Nonaktif' },
            ]}
          />

          {(searchQuery || filterCategory !== 'all' || filterStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setFilterCategory('all')
                setFilterStatus('all')
              }}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-error/30 bg-error/10 px-3 py-2 text-label-caps font-bold text-error hover:bg-error/20 cursor-pointer transition-colors shadow-level-1"
            >
              <Icon name="refresh" size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {banner && <StatusBanner ok={banner.ok} message={banner.message} onClose={() => setBanner(null)} />}
      {announcementError && <StatusBanner ok={false} message={`Gagal memuat pengumuman: ${announcementError.message || announcementError.code || 'Unknown error'}`} onClose={() => {}} />}
      {/* Announcements List */}
      {loading ? (
        <div className="py-12 text-center text-on-surface-variant">Memuat pengumuman...</div>
      ) : filteredAnnouncements.length === 0 ? (
        <EmptyState
          icon="campaign"
          title="Belum ada pengumuman"
          description="Klik tombol 'Buat Pengumuman' di atas untuk menyiarkan informasi baru ke mahasiswa."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredAnnouncements.map((item) => {
            const isUrgent = item.kategori === 'urgent'
            const isWarning = item.kategori === 'warning'

            let badgeBg = 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25'
            let badgeLabel = 'Info Umum'
            if (isUrgent) {
              badgeBg = 'bg-error/15 text-error border-error/30'
              badgeLabel = 'Darurat / Pindah Ruang'
            } else if (isWarning) {
              badgeBg = 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/30'
              badgeLabel = 'Penting / Kuliah Pengganti'
            }

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 shadow-level-1 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.aktif === false
                    ? 'border-outline-variant/15 bg-surface-container-low/40 opacity-60'
                    : 'border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-body-xs font-bold border ${badgeBg}`}>
                      {badgeLabel}
                    </span>
                    <span className="text-label-caps font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {item.targetProdi === 'all' ? 'Semua Prodi' : item.targetProdi}
                      {item.targetSemester !== 'all' ? ` · Sem. ${item.targetSemester}` : ''}
                    </span>
                    {item.berlakuHingga && (
                      <span className="text-label-caps text-on-surface-variant font-medium">
                        s.d. {item.berlakuHingga}
                      </span>
                    )}
                  </div>

                  <h3 className="text-body-md font-bold text-on-surface">
                    {item.judul}
                  </h3>

                  {item.isi && (
                    <p className="text-body-xs text-on-surface-variant line-clamp-2">
                      {item.isi}
                    </p>
                  )}
                </div>

                {/* Actions & Active Toggle */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    className={`px-2.5 py-1 rounded-xl text-label-caps font-bold border transition-colors cursor-pointer ${
                      item.aktif !== false
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant/25 hover:bg-surface-container-high'
                    }`}
                    title="Klik untuk ubah status aktif/nonaktif"
                  >
                    {item.aktif !== false ? '🟢 Aktif' : '⚪ Nonaktif'}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors cursor-pointer"
                    title="Edit Pengumuman"
                  >
                    <Icon name="edit" size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="p-2 rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
                    title="Hapus Pengumuman"
                  >
                    <Icon name="delete" size={18} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Buat / Edit Pengumuman */}
      <AnnouncementFormModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        editingItem={editingItem}
        handleSave={handleSave}
        saving={saving}
        formJudul={formJudul}
        setFormJudul={setFormJudul}
        formIsi={formIsi}
        setFormIsi={setFormIsi}
        formKategori={formKategori}
        setFormKategori={setFormKategori}
        formProdi={formProdi}
        setFormProdi={setFormProdi}
        availableProdis={availableProdis}
        formSemester={formSemester}
        setFormSemester={setFormSemester}
        formBerlakuHingga={formBerlakuHingga}
        setFormBerlakuHingga={setFormBerlakuHingga}
        formAktif={formAktif}
        setFormAktif={setFormAktif}
      />

      {/* Modal Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Hapus Pengumuman?"
        message={`Apakah Anda yakin ingin menghapus pengumuman "${deleteTarget?.judul}"? Pengumuman ini akan langsung hilang dari beranda mahasiswa.`}
        confirmLabel="Hapus"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
