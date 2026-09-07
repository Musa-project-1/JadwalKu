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
import { COLLECTIONS_CONFIG } from './backup/backupConfig'
import { BackupTab } from './backup/BackupTab'
import { RestoreTab } from './backup/RestoreTab'

export function DatabaseBackupRestoreModal({
  isOpen: rawIsOpen,
  open: rawOpen,
  onClose,
  actor = 'admin',
  onSuccess,
}) {
  const isOpen = rawIsOpen ?? rawOpen ?? false
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
          try {
            const snap = await getDocs(collection(db, col.id))
            counts[col.id] = snap.size
          } catch {
            counts[col.id] = 0
          }
        }
        if (isMounted) setDbCounts(counts)
      } catch {
        // Fallback silent
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

  // Handlers: Backup
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
        metadata: {},
        collections: {},
      }

      const exportResults = await Promise.all(
        Array.from(selectedBackupCols).map(async (colId) => {
          try {
            const snap = await getDocs(collection(db, colId))
            const docs = snap.docs.map((d) => ({
              _id: d.id,
              ...d.data(),
            }))
            return { colId, docs }
          } catch {
            return { colId, docs: [] }
          }
        }),
      )
      for (const { colId, docs } of exportResults) {
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

  // Handlers: Restore
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

        // Backward compatibility: map legacy pengumuman to announcements
        if (cols.pengumuman && !cols.announcements) {
          cols.announcements = cols.pengumuman
        }

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

  function resetRestoreFile() {
    setRestoreFile(null)
    setRestoreData(null)
    setRestoreError(null)
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
      const rawCols = restoreData.collections || restoreData
      const sourceCollections = {
        ...rawCols,
        ...(rawCols.pengumuman && !rawCols.announcements ? { announcements: rawCols.pengumuman } : {}),
      }

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
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-level-3 animate-fade-up overflow-hidden max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0">
        {/* Header Modal */}
        <div aria-hidden className="hidden max-[599px]:flex justify-center pt-3 pb-1 shrink-0">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>
        {/* Header Banner */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-800 p-4 tablet:p-5 text-white flex items-center justify-between border-b border-white/10 shrink-0 shadow-level-1">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-level-1 backdrop-blur-md">
              <Icon name="cloud_sync" size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base tablet:text-lg font-bold text-white tracking-tight truncate">
                  Pusat Backup & Restore Database
                </h3>
                <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-label-caps font-extrabold uppercase tracking-wide border border-white/25 shadow-level-1 backdrop-blur-md">
                  JSON Safe
                </span>
              </div>
              <p className="text-label-caps text-white/80 font-medium truncate mt-0.5">
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
                ? 'border-teal-700 text-teal-800 dark:text-teal-400'
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
                ? 'border-teal-700 text-teal-800 dark:text-teal-400'
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
            <BackupTab
              selectedBackupCols={selectedBackupCols}
              toggleBackupCol={toggleBackupCol}
              selectAllBackupCols={selectAllBackupCols}
              clearAllBackupCols={clearAllBackupCols}
              dbCounts={dbCounts}
              loadingStats={loadingStats}
              exporting={exporting}
              handleExportBackup={handleExportBackup}
            />
          ) : (
            <RestoreTab
              restoreFile={restoreFile}
              restoreData={restoreData}
              restoreError={restoreError}
              restoreSuccess={restoreSuccess}
              selectedRestoreCols={selectedRestoreCols}
              toggleRestoreCol={toggleRestoreCol}
              restoreMode={restoreMode}
              setRestoreMode={setRestoreMode}
              restoring={restoring}
              restoreProgress={restoreProgress}
              handleDrop={handleDrop}
              handleFileSelected={handleFileSelected}
              fileInputRef={fileInputRef}
              resetRestoreFile={resetRestoreFile}
              handleExecuteRestore={handleExecuteRestore}
              dbCounts={dbCounts}
            />
          )}
        </div>
      </div>
    </div>
  )
}
