import { useState, useMemo, useEffect } from 'react'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/Button'
import { FormSelect } from '../../components/FormSelect'
import { CustomDatePicker } from '../../components/CustomDatePicker'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { useFirestore } from '../../hooks/useFirestore'
import { StatusBanner } from '../../components/StatusBanner'
import { useDebounce } from '../../hooks/useDebounce'
import { addDocument, updateDocument, deleteDocument } from '../../lib/adminData'
import { useCampus } from '../../context/useCampus'

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
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-4 max-[599px]:items-end max-[599px]:p-0"
        >
          <div
            onClick={() => setModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-level-3 dark:bg-surface-container-low dark:border-outline-variant/15 overflow-hidden animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0">
            <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1 -mx-2 shrink-0">
              <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
            </div>

            {/* Header Banner - Rich Full-Width Teal/Emerald Gradient matching the student design system */}
            <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-800 p-4 tablet:p-5 text-white flex items-center justify-between border-b border-white/10 shrink-0 shadow-level-1">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-level-1 backdrop-blur-md">
                  <Icon name={editingItem ? 'edit_note' : 'campaign'} size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base tablet:text-lg font-bold text-white tracking-tight truncate">
                      {editingItem ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
                    </h3>
                    <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-label-caps font-extrabold uppercase tracking-wide border border-white/25 shadow-level-1 backdrop-blur-md">
                      {editingItem ? 'Update Siaran' : 'Siaran Langsung'}
                    </span>
                  </div>
                  <p className="text-label-caps text-white/80 font-medium truncate mt-0.5">
                    {editingItem ? 'Perbarui informasi siaran pengumuman' : 'Siarkan info akademik atau kuliah pengganti ke mahasiswa'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Tutup modal"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all border border-white/20 cursor-pointer"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 tablet:p-6">
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 tablet:gap-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-body-xs font-bold text-on-surface mb-1">
                      Judul Pengumuman *
                    </label>
                    <input
                      type="text"
                      value={formJudul}
                      onChange={(e) => setFormJudul(e.target.value)}
                      placeholder="Contoh: Kuliah Pengganti Basis Data / Pindah ke Lab 2"
                      required
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-4 py-2 text-body-xs font-semibold text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                    />
                  </div>

                  <div>
                    <label className="block text-body-xs font-bold text-on-surface mb-1">
                      Kategori Pengumuman *
                    </label>
                    <FormSelect
                      value={formKategori}
                      onChange={setFormKategori}
                      options={[
                        { value: 'info', label: '🔵 Info Umum (Akademik/KRS/Umum)' },
                        { value: 'warning', label: '🟡 Penting / Kuliah Pengganti' },
                        { value: 'urgent', label: '🔴 Darurat / Perubahan Ruangan' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-body-xs font-bold text-on-surface mb-1">
                      Isi / Detail Pengumuman
                    </label>
                    <textarea
                      id="form-isi-pengumuman"
                      name="form-isi-pengumuman"
                      value={formIsi}
                      onChange={(e) => setFormIsi(e.target.value)}
                      rows={3}
                      placeholder="Tuliskan petunjuk jelas, waktu pengganti, atau pesan dosen..."
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-3 text-body-xs text-on-surface focus:border-primary focus:outline-none dark:bg-surface-container-high/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-body-xs font-bold text-on-surface mb-1">
                        Target Program Studi
                      </label>
                      <FormSelect
                        value={formProdi}
                        onChange={setFormProdi}
                        options={[
                          { value: 'all', label: '🌐 Semua Prodi' },
                          ...availableProdis.map((p) => ({ value: p, label: p })),
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-body-xs font-bold text-on-surface mb-1">
                        Target Semester
                      </label>
                      <FormSelect
                        value={formSemester}
                        onChange={setFormSemester}
                        options={[
                          { value: 'all', label: 'Semua Semester' },
                          ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14].map((s) => ({
                            value: String(s),
                            label: `Semester ${s}`,
                          })),
                        ]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-body-xs font-bold text-on-surface mb-1">
                        Berlaku Hingga (Opsional)
                      </label>
                      <CustomDatePicker
                        value={formBerlakuHingga}
                        onChange={setFormBerlakuHingga}
                        placeholder="Pilih batas waktu..."
                      />
                    </div>

                    <div className="pt-5 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="chkAktif"
                        checked={formAktif}
                        onChange={(e) => setFormAktif(e.target.checked)}
                        className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
                      />
                      <label htmlFor="chkAktif" className="text-body-xs font-bold text-on-surface cursor-pointer">
                        Siarkan Langsung (Aktif)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-4">
                    <span className="block text-label-caps font-extrabold text-on-surface-variant uppercase tracking-wider mb-2.5">
                      Pratinjau Tampilan Mahasiswa
                    </span>
                    <div className={`rounded-2xl border p-4 text-body-xs shadow-level-1 ${
                      formKategori === 'urgent'
                        ? 'bg-error/10 border-error/30 text-error-950 dark:text-error-100'
                        : formKategori === 'warning'
                        ? 'bg-amber-500/15 border-amber-500/35 text-amber-950 dark:text-amber-100'
                        : 'bg-blue-500/10 border-blue-500/25 text-blue-950 dark:text-blue-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon
                          name={formKategori === 'urgent' ? 'error' : formKategori === 'warning' ? 'warning' : 'info'}
                          size={16}
                          className={
                            formKategori === 'urgent'
                              ? 'text-error'
                              : formKategori === 'warning'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-blue-700 dark:text-blue-400'
                          }
                        />
                        <p className="font-extrabold text-body-sm">{formJudul || 'Judul Pengumuman...'}</p>
                      </div>
                      <p className="opacity-90 leading-relaxed">{formIsi || 'Isi pengumuman akan tampil di sini...'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <footer className="flex items-center justify-end gap-2 pt-4 border-t border-outline-variant/15 mt-5 col-span-full">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full px-4 py-2 text-body-xs font-semibold cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-full px-5 py-2 font-bold shadow-level-1 text-body-xs bg-teal-800 hover:bg-teal-900 text-white cursor-pointer active:scale-98 transition-all"
                >
                  <Icon name="campaign" size={17} className="mr-1.5" />
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
