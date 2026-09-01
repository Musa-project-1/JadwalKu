import { useState, useMemo } from 'react'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { useFirestore } from '../../hooks/useFirestore'
import { addDocument, updateDocument, deleteDocument } from '../../lib/adminData'
import { PRODIS } from '../../constants/academicConstants'

const CATEGORY_OPTIONS = [
  { value: 'info', label: '🔵 Info Umum (Akademik/KRS/Umum)' },
  { value: 'warning', label: '🟡 Penting / Kuliah Pengganti' },
  { value: 'urgent', label: '🔴 Darurat / Perubahan Ruangan' },
]

export default function ManageAnnouncements() {
  const { data: announcements, loading } = useFirestore('announcements')
  const { data: settingsDocs } = useFirestore('settings')

  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  // Form State
  const [formJudul, setFormJudul] = useState('')
  const [formIsi, setFormIsi] = useState('')
  const [formKategori, setFormKategori] = useState('info')
  const [formProdi, setFormProdi] = useState('all')
  const [formSemester, setFormSemester] = useState('all')
  const [formBerlakuHingga, setFormBerlakuHingga] = useState('')
  const [formAktif, setFormAktif] = useState(true)

  const availableProdis = useMemo(() => {
    const appDoc = settingsDocs.find((d) => d.id === 'app')
    if (Array.isArray(appDoc?.prodis) && appDoc.prodis.length > 0) {
      return appDoc.prodis
    }
    return PRODIS.map((p) => p.value).filter(Boolean)
  }, [settingsDocs])

  const filteredAnnouncements = useMemo(() => {
    let list = Array.isArray(announcements) ? [...announcements] : []

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
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
  }, [announcements, searchQuery, filterCategory, filterStatus])

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

      if (editingItem) {
        await updateDocument('announcements', editingItem.id, payload)
      } else {
        payload.createdAt = new Date().toISOString()
        await addDocument('announcements', payload)
      }

      setModalOpen(false)
    } catch (err) {
      console.error('Failed to save announcement:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(item) {
    try {
      await updateDocument('announcements', item.id, {
        aktif: !item.aktif,
        updatedAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error('Failed to toggle status:', err)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteDocument('announcements', deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete announcement:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
              <Icon name="campaign" size={22} />
            </div>
            <div>
              <h2 className="text-title-lg font-bold text-on-surface">
                Kelola Pengumuman & Kuliah Pengganti
              </h2>
              <p className="text-body-xs text-on-surface-variant">
                Siarkan informasi penting, kuliah pengganti, atau perubahan ruang ke beranda mahasiswa
              </p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 font-bold shadow-xs shrink-0"
        >
          <Icon name="add" size={18} />
          <span>Buat Pengumuman</span>
        </Button>
      </header>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-xs flex-wrap">
        <div className="relative flex-1 min-w-[240px] w-full">
          <Icon
            name="search"
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul atau isi pengumuman..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-body-sm text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-body-xs font-semibold text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
          >
            <option value="all">Semua Kategori</option>
            <option value="info">🔵 Info Umum</option>
            <option value="warning">🟡 Penting / Pengganti</option>
            <option value="urgent">🔴 Darurat / Pindah Ruang</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-body-xs font-semibold text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
          >
            <option value="all">Semua Status</option>
            <option value="active">🟢 Aktif</option>
            <option value="inactive">⚪ Nonaktif</option>
          </select>
        </div>
      </div>

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

            let badgeBg = 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25'
            let badgeLabel = 'Info Umum'
            if (isUrgent) {
              badgeBg = 'bg-error/15 text-error border-error/30'
              badgeLabel = 'Darurat / Pindah Ruang'
            } else if (isWarning) {
              badgeBg = 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
              badgeLabel = 'Penting / Kuliah Pengganti'
            }

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.aktif === false
                    ? 'border-outline-variant/15 bg-surface-container-low/40 opacity-60'
                    : 'border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${badgeBg}`}>
                      {badgeLabel}
                    </span>
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {item.targetProdi === 'all' ? 'Semua Prodi' : item.targetProdi}
                      {item.targetSemester !== 'all' ? ` · Sem. ${item.targetSemester}` : ''}
                    </span>
                    {item.berlakuHingga && (
                      <span className="text-[11px] text-on-surface-variant font-medium">
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
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                      item.aktif !== false
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
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
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 max-[599px]:items-end max-[599px]:p-0"
        >
          <div
            onClick={() => setModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none overflow-hidden">
            <div aria-hidden className="hidden max-[599px]:flex justify-center pt-3 pb-1 shrink-0"><span className="h-1 w-10 rounded-full bg-outline-variant/60" /></div>
            <header className="flex items-center justify-between p-5 border-b border-outline-variant/15 shrink-0">
              <h3 className="text-title-md font-bold text-on-surface">
                {editingItem ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                <Icon name="close" size={20} />
              </button>
            </header>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 tablet:p-6">
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 tablet:gap-5">
                <div className="space-y-4">
              <Input
                label="Judul Pengumuman *"
                value={formJudul}
                onChange={(e) => setFormJudul(e.target.value)}
                placeholder="Contoh: Kuliah Pengganti Basis Data / Pindah ke Lab 2"
                required
              />

              <div className="space-y-1">
                <label className="block text-label-caps font-bold text-on-surface-variant uppercase">
                  Kategori Pengumuman *
                </label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest text-body-sm font-semibold text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-label-caps font-bold text-on-surface-variant uppercase">
                  Isi / Detail Pengumuman
                </label>
                <textarea
                  id="form-isi-pengumuman"
                  name="form-isi-pengumuman"
                  value={formIsi}
                  onChange={(e) => setFormIsi(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan petunjuk jelas, waktu pengganti, atau pesan dosen..."
                  className="w-full p-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest text-body-sm text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-label-caps font-bold text-on-surface-variant uppercase">
                    Target Program Studi
                  </label>
                  <select
                    value={formProdi}
                    onChange={(e) => setFormProdi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs font-semibold text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                  >
                    <option value="all">🌐 Semua Prodi</option>
                    {availableProdis.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-label-caps font-bold text-on-surface-variant uppercase">
                    Target Semester
                  </label>
                  <select
                    value={formSemester}
                    onChange={(e) => setFormSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs font-semibold text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
                  >
                    <option value="all">Semua Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <Input
                  type="date"
                  label="Berlaku Hingga (Opsional)"
                  value={formBerlakuHingga}
                  onChange={(e) => setFormBerlakuHingga(e.target.value)}
                />

                <div className="pt-5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chkAktif"
                    checked={formAktif}
                    onChange={(e) => setFormAktif(e.target.checked)}
                    className="h-4 w-4 rounded text-primary focus:ring-primary"
                  />
                  <label htmlFor="chkAktif" className="text-body-sm font-bold text-on-surface cursor-pointer">
                    Siarkan Langsung (Aktif)
                  </label>
                </div>
              </div>

                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-3.5">
                <span className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Pratinjau Tampilan Mahasiswa
                </span>
                <div className={`rounded-2xl border p-3 text-body-xs ${
                  formKategori === 'urgent'
                    ? 'bg-error/10 border-error/30 text-error-950 dark:text-error-100'
                    : formKategori === 'warning'
                    ? 'bg-amber-500/15 border-amber-500/35 text-amber-950 dark:text-amber-100'
                    : 'bg-blue-500/10 border-blue-500/25 text-blue-950 dark:text-blue-200'
                }`}>
                  <p className="font-extrabold">{formJudul || 'Judul Pengumuman...'}</p>
                  <p className="opacity-90 mt-0.5">{formIsi || 'Isi pengumuman akan tampil di sini...'}</p>
                </div>
                  </div>
                </div>
              </div>

              <footer className="flex items-center justify-end gap-2 pt-4 border-t border-outline-variant/15 mt-4 shrink-0">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={saving} className="font-bold">
                  {saving ? 'Menyimpan...' : 'Simpan Pengumuman'}
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}

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
