import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { archiveSemester } from '../../lib/semesterArchive'
import { saveSettings, deriveTahunAjaran, syncProdiFromExistingData } from '../../lib/publishHelpers'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebaseClient'
import { DatabaseBackupRestoreModal } from '../../components/admin/DatabaseBackupRestoreModal'
import { FeatureDocsModal } from '../../components/student/FeatureDocsModal'

// Modular Components
import { DashboardHeader } from '../../components/admin/adminDashboard/DashboardHeader'
import { DashboardStatCards } from '../../components/admin/adminDashboard/DashboardStatCards'
import { RecentActivityTimeline } from '../../components/admin/adminDashboard/RecentActivityTimeline'
import { QuickAdminActions } from '../../components/admin/adminDashboard/QuickAdminActions'
import { DashboardAnalytics } from '../../components/admin/adminDashboard/DashboardAnalytics'
import { FullHistoryModal } from '../../components/admin/adminDashboard/FullHistoryModal'

const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const CLASS_TYPE_META = {
  K1: { label: 'Offline (K1)', tone: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  K2: { label: 'Online (K2)', tone: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' },
  HB: { label: 'Hybrid (HB)', tone: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' },
  HBH: { label: 'Hybrid (HBH)', tone: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' },
  HBD: { label: 'Hybrid (HBD)', tone: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' },
  GBK1: { label: 'Gabungan (GBK1)', tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  GBK2: { label: 'Gabungan (GBK2)', tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
}

export default function AdminDashboard() {
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

  const { data: programs, loading: loadingProdi } = useFirestore('prodi')
  const { data: courses, loading: loadingCourses } = useFirestore('mataKuliah')
  const { data: schedules, loading: loadingSchedules } = useFirestore('jadwal')
  const { data: exams, loading: loadingExams } = useFirestore('ujian')
  const { data: history, loading: loadingHistory } = useFirestore('riwayat')
  const { data: settingsDocs } = useFirestore('settings')

  const appSettings = useMemo(
    () => settingsDocs.find((d) => d.id === 'app') ?? null,
    [settingsDocs],
  )

  const [archiveOpen, setArchiveOpen] = useState(false)
  const [newSemester, setNewSemester] = useState('')
  const [banner, setBanner] = useState(null)
  const [busy, setBusy] = useState(false)
  const [syncingProdi, setSyncingProdi] = useState(false)
  const [showAllHistoryModal, setShowAllHistoryModal] = useState(false)
  const [backupRestoreOpen, setBackupRestoreOpen] = useState(false)
  const [docsModalOpen, setDocsModalOpen] = useState(false)

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) => (b.timestamp?.toMillis?.() ?? 0) - (a.timestamp?.toMillis?.() ?? 0),
      ),
    [history],
  )

  const recentHistory = useMemo(() => sortedHistory.slice(0, 5), [sortedHistory])

  const dayBreakdown = useMemo(() => {
    const counts = DAY_ORDER.map((day) => ({
      day,
      count: schedules.filter((s) => s.hari === day).length,
    }))
    const max = Math.max(1, ...counts.map((c) => c.count))
    return counts.map((c) => ({ ...c, percent: Math.round((c.count / max) * 100) }))
  }, [schedules])

  const classTypeBreakdown = useMemo(() => {
    const groups = {}
    schedules.forEach((s) => {
      const t = s.tipeKelas || 'K1'
      groups[t] = (groups[t] || 0) + 1
    })
    return Object.entries(groups)
      .map(([key, count]) => ({
        key,
        count,
        meta: CLASS_TYPE_META[key] || {
          label: key,
          tone: 'bg-surface-variant/80 text-on-surface-variant border-outline-variant/30',
        },
      }))
      .sort((a, b) => b.count - a.count)
  }, [schedules])

  const prodiBreakdown = useMemo(() => {
    return programs
      .map((p) => {
        const name = p.nama || String(p.id || '')
        const prodiSchedules = schedules.filter((s) => s.prodi === name)
        return {
          name,
          sessionCount: prodiSchedules.length,
          mkCount: new Set(prodiSchedules.map((s) => s.kodeMK)).size,
        }
      })
      .filter((p) => p.sessionCount > 0 || p.mkCount > 0)
      .sort((a, b) => b.sessionCount - a.sessionCount)
  }, [programs, schedules])

  async function handleSyncProdi() {
    setSyncingProdi(true)
    setBanner(null)
    const result = await syncProdiFromExistingData(actor)
    setSyncingProdi(false)
    if (result.ok) {
      setBanner({
        ok: true,
        message:
          result.count > 0
            ? `${result.count} program studi berhasil disinkronkan ke database.`
            : 'Semua program studi sudah sinkron.',
      })
    } else {
      setBanner({ ok: false, message: `Gagal sinkronisasi prodi: ${result.error}` })
    }
  }

  async function handleArchive() {
    const target = Number(newSemester)
    if (!Number.isInteger(target) || target < 1 || target > 14) {
      setBanner({ ok: false, message: 'Nomor semester baru harus angka bulat 1-14.' })
      return
    }
    setBusy(true)
    let oldSemester = 1
    try {
      const snap = await getDoc(doc(db, 'settings', 'app'))
      oldSemester = Number(snap.data()?.currentSemester) || 1
      const result = await archiveSemester({
        oldSemester,
        newSemester: target,
        actor,
      })
      if (!result.ok) {
        setBanner({ ok: false, message: `Gagal mulai semester baru: ${result.error}` })
        setBusy(false)
        return
      }
      await saveSettings({
        currentSemester: target,
        currentTahunAjaran: deriveTahunAjaran(),
        lastArchivedAt: new Date().toISOString(),
      })
      setBanner({
        ok: true,
        message: `Semester ${oldSemester} diarsipkan (${result.archivedCount} dokumen). Semester aktif kini ${target}.`,
      })
    } catch (err) {
      setBanner({ ok: false, message: `Gagal mulai semester: ${err?.message ?? err}` })
    }
    setBusy(false)
    setArchiveOpen(false)
  }

  return (
    <div className="h-full flex flex-col gap-4 tablet:gap-4 pb-20 tablet:pb-0 w-full max-w-full overflow-x-hidden min-h-0 flex-1 animate-fade-in">
      {/* ── 1. Page Header ── */}
      <DashboardHeader onOpenDocs={() => setDocsModalOpen(true)} />

      {/* Global Sync Prodi Notification if empty */}
      {!loadingProdi && !loadingCourses && programs.length === 0 && courses.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-3 text-body-xs font-semibold text-primary">
          <span>Ditemukan {courses.length} MK tanpa master prodi tersimpan.</span>
          <button
            type="button"
            onClick={handleSyncProdi}
            disabled={syncingProdi}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-body-xs font-bold text-on-primary shadow-level-1 cursor-pointer hover:bg-primary/90"
          >
            <Icon name="sync" size={14} className={syncingProdi ? 'animate-spin' : ''} />
            <span>Sinkronkan Prodi</span>
          </button>
        </div>
      )}

      {banner && (
        <StatusBanner
          ok={banner.ok}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* ── 2. Stat Cards (4-Column Balanced Grid) ── */}
      <DashboardStatCards
        loadingProdi={loadingProdi}
        programsCount={programs.length}
        loadingCourses={loadingCourses}
        coursesCount={courses.length}
        loadingSchedules={loadingSchedules}
        schedulesCount={schedules.length}
        loadingExams={loadingExams}
        examsCount={exams.length}
      />

      {/* ── 3. Main 2-Column Balanced & Aligned Grid ── */}
      <div className="flex-1 flex flex-col min-h-0 grid gap-4 tablet:gap-4 desktop:grid-cols-12 desktop:items-stretch">
        {/* Kolom Kiri: Riwayat Perubahan Data */}
        <RecentActivityTimeline
          history={history}
          recentHistory={recentHistory}
          loadingHistory={loadingHistory}
          onOpenFullHistory={() => setShowAllHistoryModal(true)}
        />

        {/* Kolom Kanan: Aksi Cepat Administratif & Aksi Musiman */}
        <QuickAdminActions
          onOpenArchive={() => setArchiveOpen(true)}
          onOpenBackupRestore={() => setBackupRestoreOpen(true)}
          busy={busy}
          appSettings={appSettings}
        />
      </div>

      {/* ── 4. Bottom Analytics (3 Kolom Sejajar) ── */}
      <DashboardAnalytics
        dayBreakdown={dayBreakdown}
        classTypeBreakdown={classTypeBreakdown}
        prodiBreakdown={prodiBreakdown}
      />

      {/* Confirm Dialog: Mulai Semester Baru */}
      <ConfirmDialog
        open={archiveOpen}
        title="Mulai Semester Baru?"
        description={`Seluruh jadwal & ujian pada semester aktif akan diarsipkan (status "archived") dan tidak lagi tampil ke mahasiswa. Masukkan nomor semester baru:`}
        confirmLabel={busy ? 'Memproses…' : 'Arsipkan Semester'}
        cancelLabel="Batal"
        onConfirm={handleArchive}
        onCancel={() => setArchiveOpen(false)}
      >
        <label className="mt-3 block">
          <span className="mb-1.5 block text-body-sm font-bold text-on-surface">
            Nomor Semester Baru (1 - 14)
          </span>
          <input
            type="number"
            min="1"
            max="14"
            value={newSemester}
            onChange={(e) => setNewSemester(e.target.value)}
            placeholder="Contoh: 3"
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface dark:bg-surface-container-high focus:outline-hidden focus:border-primary"
          />
        </label>
      </ConfirmDialog>

      {/* Modal: Lihat Semua Log Aktivitas */}
      {showAllHistoryModal && (
        <FullHistoryModal
          historyList={sortedHistory}
          onClose={() => setShowAllHistoryModal(false)}
        />
      )}

      {/* Modal: Backup & Restore Database */}
      <DatabaseBackupRestoreModal
        isOpen={backupRestoreOpen}
        onClose={() => setBackupRestoreOpen(false)}
        actor={actor}
        onSuccess={(msg) => setBanner({ ok: true, message: msg })}
      />

      {/* Modal: Pusat Panduan & Tutorial Admin */}
      <FeatureDocsModal
        isOpen={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
        mode="admin"
      />
    </div>
  )
}
