import { useState, useRef } from 'react'
import { Icon } from '../../Icon'
import { exportStudentData, importStudentData } from '../../../lib/storage'

export function SettingsStorageTab({
  language,
  handleManualSync,
  isSyncing,
  handleClearCache,
}) {
  const [backupStatus, setBackupStatus] = useState(null)
  const [restoring, setRestoring] = useState(false)
  const fileInputRef = useRef(null)

  function handleExportBackup() {
    try {
      const payload = exportStudentData()
      const jsonStr = JSON.stringify(payload, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dateStr = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `jadwalku-backup-mahasiswa-${dateStr}.json`
      a.click()
      URL.revokeObjectURL(url)

      setBackupStatus({
        type: 'success',
        text: language === 'en' ? 'Backup file downloaded successfully.' : 'Berkas cadangan berhasil diunduh.',
      })
      setTimeout(() => setBackupStatus(null), 3000)
    } catch (err) {
      setBackupStatus({
        type: 'error',
        text: language === 'en' ? 'Failed to export backup.' : `Gagal mencadangkan data: ${err.message}`,
      })
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.json')) {
      setBackupStatus({
        type: 'error',
        text: language === 'en' ? 'File must be a valid JSON file.' : 'Berkas harus berupa file JSON (.json).',
      })
      return
    }

    setRestoring(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const result = importStudentData(event.target.result)
        if (result.ok) {
          setBackupStatus({
            type: 'success',
            text: language === 'en'
              ? `Successfully restored ${result.restoredCount} preference items. Reloading...`
              : `Berhasil memulihkan ${result.restoredCount} preferensi data. Memuat ulang...`,
          })
          setTimeout(() => {
            window.location.reload()
          }, 1200)
        } else {
          setBackupStatus({
            type: 'error',
            text: result.error,
          })
          setRestoring(false)
        }
      } catch (err) {
        setBackupStatus({
          type: 'error',
          text: `Gagal membaca berkas: ${err.message}`,
        })
        setRestoring(false)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-title-sm font-bold text-on-surface">
          {language === 'en' ? 'Data, Cache & Storage' : 'Data & Penyimpanan'}
        </h3>
        <p className="text-body-xs text-on-surface-variant mt-0.5">
          {language === 'en'
            ? 'Manage local offline PWA cache, cloud sync, and personal data backup'
            : 'Kelola cache offline PWA, sinkronisasi cloud, serta cadangan data pribadi'}
        </p>
      </div>

      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-5 space-y-4 shadow-2xs divide-y divide-outline-variant/15">
        {/* PWA Offline Status */}
        <div className="flex items-center justify-between gap-4 pt-1 first:pt-0">
          <div className="min-w-0">
            <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
              <Icon name="cloud_done" size={17} className="text-emerald-600 dark:text-emerald-400" />
              <span>Progressive Web App (PWA)</span>
            </span>
            <p className="text-body-xs text-on-surface-variant mt-0.5">
              {language === 'en'
                ? 'App is installed and operational 100% offline without internet'
                : 'Aplikasi terpasang dan dapat beroperasi 100% tanpa internet'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 text-label-caps font-bold border border-emerald-500/25 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{language === 'en' ? 'Available Offline' : 'Tersedia Offline'}</span>
          </span>
        </div>

        {/* Cloud Sync */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <div className="min-w-0">
            <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
              <Icon name="sync" size={17} className="text-primary" />
              <span>{language === 'en' ? 'Sync Campus Schedule' : 'Sinkronisasi Data Kampus'}</span>
            </span>
            <p className="text-body-xs text-on-surface-variant mt-0.5">
              {language === 'en'
                ? 'Refresh class timetable and exams directly from campus server'
                : 'Perbarui jadwal kuliah & ujian langsung dari server akademik'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-body-xs font-bold shadow-level-1 hover:bg-primary/90 transition-all cursor-pointer shrink-0"
          >
            {isSyncing
              ? (language === 'en' ? 'Syncing...' : 'Menyinkronkan...')
              : (language === 'en' ? 'Sync Now' : 'Sinkronkan Sekarang')}
          </button>
        </div>

        {/* Student Data Backup & Restore */}
        <div className="flex flex-col gap-3 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
                <Icon name="save" size={17} className="text-teal-600 dark:text-teal-400" />
                <span>{language === 'en' ? 'Backup & Restore Personal Data' : 'Cadangkan & Pulihkan Data Pribadi'}</span>
              </span>
              <p className="text-body-xs text-on-surface-variant mt-0.5">
                {language === 'en'
                  ? 'Backup tasks, notes, attendance history, and reminders into a JSON file'
                  : 'Amankan tugas, catatan, riwayat absensi, dan preferensi alarm ke berkas JSON'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={restoring}
                className="px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container hover:bg-surface-container-high text-on-surface text-body-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Icon name="upload" size={15} />
                <span>{language === 'en' ? 'Restore' : 'Pulihkan'}</span>
              </button>
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3 py-1.5 rounded-xl border border-teal-600/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-body-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Icon name="download" size={15} />
                <span>{language === 'en' ? 'Backup' : 'Cadangkan'}</span>
              </button>
            </div>
          </div>

          {backupStatus && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-body-xs font-semibold ${
                backupStatus.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-error/15 text-error border border-error/30'
              }`}
            >
              <Icon name={backupStatus.type === 'success' ? 'check_circle' : 'warning'} size={16} />
              <span>{backupStatus.text}</span>
            </div>
          )}
        </div>

        {/* Clear Cache */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <div className="min-w-0">
            <span className="text-body-sm font-bold text-on-surface flex items-center gap-2">
              <Icon name="delete_sweep" size={17} className="text-error" />
              <span>{language === 'en' ? 'Reset Local Cache' : 'Reset Cache Lokal'}</span>
            </span>
            <p className="text-body-xs text-on-surface-variant mt-0.5">
              {language === 'en'
                ? 'Clear locally stored browser cache if schedule views show display conflicts'
                : 'Bersihkan data tersimpan di browser jika jadwal mengalami bentrok tampilan'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearCache}
            className="px-4 py-2 rounded-xl border border-error/30 bg-error/10 hover:bg-error/20 text-error text-body-xs font-bold transition-all cursor-pointer shrink-0"
          >
            {language === 'en' ? 'Reset Cache' : 'Reset Cache'}
          </button>
        </div>
      </div>
    </div>
  )
}
