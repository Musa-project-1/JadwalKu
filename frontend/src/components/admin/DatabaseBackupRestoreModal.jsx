import { useState, useRef, useEffect } from 'react'
import { Icon } from '../Icon'
import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../lib/firebaseClient'
import { appendHistory } from '../../lib/publishHelpers'

const COLLECTIONS_CONFIG = [
  { id: 'jadwal', label: 'Jadwal Perkuliahan', icon: 'calendar_month', desc: 'Seluruh sesi perkuliahan aktif & draft' },
  { id: 'mataKuliah', label: 'Master Mata Kuliah & Dosen', icon: 'menu_book', desc: 'Daftar MK, SKS, dosen pengampu & kontak' },
  { id: 'ujian', label: 'Jadwal Ujian (UTS & UAS)', icon: 'assignment', desc: 'Jadwal ujian semester' },
  { id: 'prodi', label: 'Daftar Program Studi', icon: 'school', desc: 'Daftar prodi aktif di kampus' },
  { id: 'libur', label: 'Kalender Libur & Cuti', icon: 'event_busy', desc: 'Tanggal libur nasional dan cuti bersama' },
  { id: 'pengumuman', label: 'Pengumuman Kampus', icon: 'campaign', desc: 'Banner broadcast dan info jadwal' },
  { id: 'settings', label: 'Pengaturan Sistem', icon: 'tune', desc: 'Kalender akademik & konfigurasi aplikasi' },
]

export function DatabaseBackupRestoreModal({
  isOpen,
  onClose,
  actor = 'admin',
  onSuccess,
}) {
  const [activeTab, setActiveTab] = useState('backup') // 'backup' | 'restore'
  const [loadingStats, setLoadingStats] = useState(false)
  const [dbCounts, setDbCounts] = useState({})

  // Backup State
  const [selectedBackupCols, setSelectedBackupCols] = useState(
    () => new Set(COLLECTIONS_CONFIG.map((c) => c.id)),
  )
  const [exporting, setExporting] = useState(false)

  // Restore State
  const [restoreFile, setRestoreFile] = useState(null)
  const [restoreData, setRestoreData] = useState(null)
  const [restoreError, setRestoreError] = useState(null)
  const [selectedRestoreCols, setSelectedRestoreCols] = useState(new Set())
  const [restoreMode, setRestoreMode] = useState('merge') // 'merge' | 'replace'
  const [restoring, setRestoring] = useState(false)
  const [restoreProgress, setRestoreProgress] = useState({ current: 0, total: 0, collection: '' })
  const [restoreSuccess, setRestoreSuccess] = useState(null)

  const fileInputRef = useRef(null)

  // Load current DB document counts when modal opens
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    async function fetchCounts() {
      setLoadingStats(true)
      const counts = {}
      try {
        for (const col of COLLECTIONS_CONFIG) {
          const snap = await getDocs(collection(db, col.id))
          counts[col.id] = snap.size
        }
        if (isMounted) setDbCounts(counts)
      } catch (err) {
        console.error('Failed to count collections:', err)
      } finally {
        if (isMounted) setLoadingStats(false)
      }
    }

    fetchCounts()
    return () => {
      isMounted = false
    }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !restoring && !exporting) onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, restoring, exporting, onClose])

  if (!isOpen) return null

  // ── Handlers: Backup ──
  function toggleBackupCol(id) {
    setSelectedBackupCols((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllBackupCols() {
    setSelectedBackupCols(new Set(COLLECTIONS_CONFIG.map((c) => c.id)))
  }

  function clearAllBackupCols() {
    setSelectedBackupCols(new Set())
  }

  async function handleExportBackup() {
    if (selectedBackupCols.size === 0) return
    setExporting(true)

    try {
      const payload = {
        app: 'jadwalku-kampus',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        exportedBy: actor,
        collections: {},
        metadata: {},
      }

      for (const colId of selectedBackupCols) {
        const snap = await getDocs(collection(db, colId))
        const docs = snap.docs.map((d) => ({ _id: d.id, ...d.data() }))
        payload.collections[colId] = docs
        payload.metadata[colId] = { count: docs.length }
      }

      const jsonStr = JSON.stringify(payload, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      a.href = url
      a.download = `backup-jadwalku-${timestamp}.json`
      a.click()
      URL.revokeObjectURL(url)

      await appendHistory({
        entitas: 'sistem',
        field: 'backup_export',
        nilaiLama: null,
        nilaiBaru: payload.metadata,
        aktor: actor,
        detail: `Ekspor cadangan database JSON (${selectedBackupCols.size} koleksi)`,
      })

      if (onSuccess) onSuccess('File cadangan database berhasil diunduh.')
    } catch (err) {
      console.error('Export error:', err)
      alert(`Gagal mengekspor data: ${err.message}`)
    } finally {
      setExporting(false)
    }
  }

  // ── Handlers: Restore ──
  function handleFileSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  function processFile(file) {
    if (!file.name.endsWith('.json')) {
      setRestoreError('Berkas harus berupa file format JSON (.json)')
      return
    }

    setRestoreFile(file)
    setRestoreError(null)
    setRestoreSuccess(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        const cols = parsed.collections || parsed
        const availableCols = []

        for (const config of COLLECTIONS_CONFIG) {
          if (cols[config.id] && Array.isArray(cols[config.id])) {
            availableCols.push(config.id)
          }
        }

        if (availableCols.length === 0) {
          setRestoreError('File JSON tidak mengandung koleksi database yang valid.')
          setRestoreData(null)
          return
        }

        setRestoreData(parsed)
        setSelectedRestoreCols(new Set(availableCols))
      } catch (err) {
        setRestoreError(`Gagal membaca file JSON: ${err.message}`)
        setRestoreData(null)
      }
    }
    reader.readAsText(file)
  }

  function toggleRestoreCol(id) {
    setSelectedRestoreCols((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleExecuteRestore() {
    if (!restoreData || selectedRestoreCols.size === 0) return

    const confirmMsg =
      restoreMode === 'replace'
        ? `PERINGATAN: Mode 'Timpa Bersih' akan MENGHAPUS seluruh data aktif pada ${selectedRestoreCols.size} koleksi terpilih dan menggantinya dengan data dari file backup. Lanjutkan?`
        : `Konfirmasi: Pulihkan data pada ${selectedRestoreCols.size} koleksi terpilih? Data lama akan digabungkan/diperbarui.`

    if (!window.confirm(confirmMsg)) return

    setRestoring(true)
    setRestoreError(null)

    try {
      const sourceCollections = restoreData.collections || restoreData
      const totalDocs = Array.from(selectedRestoreCols).reduce(
        (sum, colId) => sum + (sourceCollections[colId]?.length || 0),
        0,
      )

      let processedDocs = 0
      setRestoreProgress({ current: 0, total: totalDocs, collection: 'Memulai...' })

      for (const colId of selectedRestoreCols) {
        const docsToRestore = sourceCollections[colId] || []
        setRestoreProgress({ current: processedDocs, total: totalDocs, collection: colId })

        if (restoreMode === 'replace') {
          const existingSnap = await getDocs(collection(db, colId))
          const chunks = []
          for (let i = 0; i < existingSnap.docs.length; i += 400) {
            chunks.push(existingSnap.docs.slice(i, i + 400))
          }
          for (const chunk of chunks) {
            const batch = writeBatch(db)
            chunk.forEach((d) => batch.delete(d.ref))
            await batch.commit()
          }
        }

        const chunks = []
        for (let i = 0; i < docsToRestore.length; i += 400) {
          chunks.push(docsToRestore.slice(i, i + 400))
        }

        for (const chunk of chunks) {
          const batch = writeBatch(db)
          for (const item of chunk) {
            const docId = item._id || item.id || item.kodeMK || item.prodi || doc(collection(db, colId)).id
            const cleanData = { ...item }
            delete cleanData._id
            delete cleanData.id

            const ref = doc(db, colId, String(docId))
            batch.set(ref, cleanData, { merge: restoreMode === 'merge' })
          }
          await batch.commit()
          processedDocs += chunk.length
          setRestoreProgress({ current: processedDocs, total: totalDocs, collection: colId })
        }
      }

      await appendHistory({
        entitas: 'sistem',
        field: 'backup_restore',
        nilaiLama: { mode: restoreMode },
        nilaiBaru: { collections: Array.from(selectedRestoreCols), totalDocs: processedDocs },
        aktor: actor,
        detail: `Pemulihan database JSON mode ${restoreMode} (${processedDocs} dokumen dipulihkan)`,
      })

      setRestoreSuccess(`Berhasil memulihkan ${processedDocs} dokumen pada ${selectedRestoreCols.size} koleksi.`)
      if (onSuccess) onSuccess(`Database berhasil dipulihkan (${processedDocs} dokumen).`)
    } catch (err) {
      console.error('Restore error:', err)
      setRestoreError(`Gagal memulihkan database: ${err.message}`)
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-4 max-[599px]:items-end max-[599px]:p-0 bg-black/65 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl animate-fade-up overflow-hidden max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0">
        {/* Header Modal */}
        <div aria-hidden className="hidden max-[599px]:flex justify-center pt-3 pb-1 shrink-0"><span className="h-1 w-10 rounded-full bg-outline-variant/60" /></div>
        {/* Header Banner - Rich Full-Width Teal/Emerald Gradient matching the student design system */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-950 via-teal-800 to-emerald-900 p-4 tablet:p-5 text-white flex items-center justify-between border-b border-white/10 shrink-0 shadow-level-1">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-xs backdrop-blur-md">
              <Icon name="cloud_sync" size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base tablet:text-lg font-bold text-white tracking-tight truncate">
                  Pusat Backup & Restore Database
                </h3>
                <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border border-white/25 shadow-2xs backdrop-blur-md">
                  JSON Safe
                </span>
              </div>
              <p className="text-[11.5px] text-white/80 font-medium truncate mt-0.5">
                Amankan seluruh data perkuliahan atau pulihkan data dari berkas cadangan JSON
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={restoring || exporting}
            aria-label="Tutup modal"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all border border-white/20 cursor-pointer disabled:opacity-50"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-outline-variant/15 px-5 bg-surface-container-low/40 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 py-3 px-4 text-body-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'border-teal-700 text-teal-800 dark:text-teal-300'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon name="download" size={16} />
            <span>Ekspor Cadangan (.json)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`flex items-center gap-2 py-3 px-4 text-body-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'restore'
                ? 'border-teal-700 text-teal-800 dark:text-teal-300'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon name="upload" size={16} />
            <span>Pulihkan Cadangan (.json)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'backup' ? (
            /* ── TAB 1: BACKUP EXPORT ── */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-body-sm font-bold text-on-surface">Pilih Koleksi untuk Dicadangkan</h3>
                  <p className="text-[11px] text-on-surface-variant">
                    Pilih modul database yang ingin disertakan ke dalam berkas cadangan JSON
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllBackupCols}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-outline-variant/40">|</span>
                  <button
                    type="button"
                    onClick={clearAllBackupCols}
                    className="text-[11px] font-bold text-on-surface-variant hover:text-error cursor-pointer"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              {/* Grid Koleksi */}
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
                {COLLECTIONS_CONFIG.map((col) => {
                  const isChecked = selectedBackupCols.has(col.id)
                  const count = dbCounts[col.id] ?? 0

                  return (
                    <div
                      key={col.id}
                      onClick={() => toggleBackupCol(col.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'border-teal-600 bg-teal-500/10 dark:bg-teal-950/30 ring-1 ring-teal-500/40 shadow-xs'
                          : 'border-outline-variant/20 bg-surface-container-low/50 hover:bg-surface-container-low dark:bg-surface-container/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-body-xs font-bold text-on-surface flex items-center gap-1.5">
                            <Icon name={col.icon} size={15} className="text-teal-600 dark:text-teal-400" />
                            <span>{col.label}</span>
                          </p>
                          <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-extrabold text-on-surface-variant">
                            {loadingStats ? '...' : `${count} Dok`}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-on-surface-variant mt-0.5 truncate">
                          {col.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Box Info */}
              <div className="flex items-start gap-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 p-3.5 text-[11px] text-teal-900 dark:text-teal-200">
                <Icon name="info" size={16} className="shrink-0 mt-0.5 text-teal-600 dark:text-teal-400" />
                <span>
                  File JSON yang diunduh mencakup seluruh struktur data, id dokumen, serta stempel waktu ekspor. File ini dapat disimpan di Google Drive / flashdisk sebagai arsip semester.
                </span>
              </div>
            </div>
          ) : (
            /* ── TAB 2: RESTORE IMPORT ── */
            <div className="space-y-4">
              {/* Dropzone File */}
              {!restoreFile ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-outline-variant/40 bg-surface-container-low/40 hover:bg-surface-container-low hover:border-teal-500/50 transition-all cursor-pointer text-center group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelected}
                    className="hidden"
                  />
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 mb-3 group-hover:bg-teal-500/20 transition-colors">
                    <Icon name="upload_file" size={28} />
                  </div>
                  <h4 className="text-body-sm font-bold text-on-surface">
                    Tarik & Lepas File Cadangan JSON di sini
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    atau klik untuk memilih berkas dari komputer Anda (.json)
                  </p>
                </div>
              ) : (
                /* File Loaded Preview */
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-teal-500/30 bg-teal-500/10 dark:bg-teal-950/30">
                    <div className="flex items-center gap-3">
                      <Icon name="description" size={24} className="text-teal-600 dark:text-teal-400" />
                      <div>
                        <p className="text-body-xs font-bold text-on-surface">{restoreFile.name}</p>
                        <p className="text-[10px] text-on-surface-variant">
                          {(restoreFile.size / 1024).toFixed(1)} KB · Terbaca oleh sistem
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRestoreFile(null)
                        setRestoreData(null)
                        setRestoreError(null)
                      }}
                      className="text-body-xs font-bold text-error hover:underline cursor-pointer"
                    >
                      Ganti File
                    </button>
                  </div>

                  {restoreError && (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-error/10 border border-error/25 text-error text-body-xs font-semibold">
                      <Icon name="warning" size={16} />
                      <span>{restoreError}</span>
                    </div>
                  )}

                  {restoreSuccess && (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-body-xs font-bold">
                      <Icon name="check_circle" size={16} />
                      <span>{restoreSuccess}</span>
                    </div>
                  )}

                  {restoreData && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                          Pilih Koleksi yang Ingin Dipulihkan
                        </p>
                        <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">
                          {selectedRestoreCols.size} Koleksi Dipilih
                        </span>
                      </div>

                      {/* Koleksi Table in Backup File */}
                      <div className="rounded-2xl border border-outline-variant/25 overflow-hidden">
                        <table className="w-full text-left text-body-xs">
                          <thead className="bg-surface-container border-b border-outline-variant/20">
                            <tr>
                              <th className="py-2.5 px-3 w-[40px] text-center">Pilih</th>
                              <th className="py-2.5 px-3">Koleksi</th>
                              <th className="py-2.5 px-3 text-center">Data di File</th>
                              <th className="py-2.5 px-3 text-center">Data di Database</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/15 bg-surface-container-lowest">
                            {COLLECTIONS_CONFIG.map((config) => {
                              const sourceCols = restoreData.collections || restoreData
                              const fileDocs = sourceCols[config.id] || []
                              if (!Array.isArray(fileDocs) || fileDocs.length === 0) return null

                              const isChecked = selectedRestoreCols.has(config.id)
                              const dbCount = dbCounts[config.id] ?? 0

                              return (
                                <tr
                                  key={config.id}
                                  onClick={() => toggleRestoreCol(config.id)}
                                  className={`cursor-pointer hover:bg-surface-container-low/50 transition-colors ${
                                    isChecked ? 'bg-teal-500/5' : ''
                                  }`}
                                >
                                  <td className="py-2.5 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-on-surface flex items-center gap-2">
                                    <Icon name={config.icon} size={15} className="text-teal-600 dark:text-teal-400" />
                                    <span>{config.label}</span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-bold text-teal-700 dark:text-teal-300">
                                    {fileDocs.length} Dokumen
                                  </td>
                                  <td className="py-2.5 px-3 text-center text-on-surface-variant font-medium">
                                    {dbCount} Dokumen
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Restore Strategy Selector */}
                      <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/50 p-4 space-y-2.5">
                        <p className="text-body-xs font-bold text-on-surface">Metode Pemulihan Data (*Strategy*):</p>
                        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-2.5">
                          <label
                            onClick={() => setRestoreMode('merge')}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                              restoreMode === 'merge'
                                ? 'border-teal-600 bg-teal-500/10 dark:bg-teal-950/30 ring-1 ring-teal-500/40'
                                : 'border-outline-variant/20 bg-surface-container-lowest hover:bg-surface-container-low'
                            }`}
                          >
                            <input
                              type="radio"
                              name="restoreMode"
                              checked={restoreMode === 'merge'}
                              onChange={() => setRestoreMode('merge')}
                              className="mt-0.5 text-teal-600 cursor-pointer"
                            />
                            <div>
                              <p className="text-body-xs font-bold text-on-surface">🔄 Gabungkan & Update</p>
                              <p className="text-[10.5px] text-on-surface-variant mt-0.5">
                                Menambah atau menimpa dokumen yang sama tanpa menghapus data lain.
                              </p>
                            </div>
                          </label>

                          <label
                            onClick={() => setRestoreMode('replace')}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                              restoreMode === 'replace'
                                ? 'border-error bg-error/10 ring-1 ring-error/40'
                                : 'border-outline-variant/20 bg-surface-container-lowest hover:bg-surface-container-low'
                            }`}
                          >
                            <input
                              type="radio"
                              name="restoreMode"
                              checked={restoreMode === 'replace'}
                              onChange={() => setRestoreMode('replace')}
                              className="mt-0.5 text-error cursor-pointer"
                            />
                            <div>
                              <p className="text-body-xs font-bold text-error">⚠️ Timpa Bersih (Clean Replace)</p>
                              <p className="text-[10.5px] text-on-surface-variant mt-0.5">
                                Menghapus seluruh data lama pada koleksi terpilih sebelum memasukkan data backup.
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Indicator */}
              {restoring && (
                <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4 space-y-2">
                  <div className="flex items-center justify-between text-body-xs font-bold text-teal-900 dark:text-teal-200">
                    <span>Sedang memulihkan: {restoreProgress.collection}...</span>
                    <span>
                      {restoreProgress.current} / {restoreProgress.total} Dokumen
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-teal-950/20 overflow-hidden">
                    <div
                      className="h-full bg-teal-600 transition-all duration-200"
                      style={{
                        width: `${restoreProgress.total > 0 ? (restoreProgress.current / restoreProgress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <footer className="flex items-center justify-between border-t border-outline-variant/20 px-5 py-3.5 bg-surface-container-low/40 shrink-0">
          <span className="text-[11px] text-on-surface-variant font-bold">
            {activeTab === 'backup'
              ? `${selectedBackupCols.size} dari ${COLLECTIONS_CONFIG.length} koleksi dipilih`
              : restoreData
              ? `${selectedRestoreCols.size} koleksi siap dipulihkan`
              : 'Pilih file JSON untuk memulai restore'}
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={restoring || exporting}
              className="px-4 py-1.5 rounded-full text-body-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-50"
            >
              Tutup
            </button>

            {activeTab === 'backup' ? (
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={exporting || selectedBackupCols.size === 0}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-teal-800 text-white text-body-xs font-bold shadow-xs hover:bg-teal-900 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Icon name={exporting ? 'sync' : 'download'} size={16} className={exporting ? 'animate-spin' : ''} />
                <span>{exporting ? 'Mengekspor JSON...' : 'Unduh Cadangan Database (.json)'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={restoring || !restoreData || selectedRestoreCols.size === 0}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-teal-800 text-white text-body-xs font-bold shadow-xs hover:bg-teal-900 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Icon name={restoring ? 'sync' : 'restore'} size={16} className={restoring ? 'animate-spin' : ''} />
                <span>{restoring ? 'Memulihkan Data...' : 'Mulai Pulihkan Data'}</span>
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
