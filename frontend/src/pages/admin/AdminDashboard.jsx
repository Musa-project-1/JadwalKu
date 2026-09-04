import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { syncProdiFromExistingData } from '../../lib/publishHelpers'
import { FeatureDocsModal } from '../../components/student/FeatureDocsModal'

// Modular Components
import { DashboardHeader } from '../../components/admin/adminDashboard/DashboardHeader'
import { RecentActivityTimeline } from '../../components/admin/adminDashboard/RecentActivityTimeline'
import { DashboardAnalytics } from '../../components/admin/adminDashboard/DashboardAnalytics'
import { FullHistoryModal } from '../../components/admin/adminDashboard/FullHistoryModal'

const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const CLASS_TYPE_META = {
  K1: { label: 'Offline (K1)', tone: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  K2: { label: 'Online (K2)', tone: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  HB: { label: 'Hybrid (HB)', tone: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30' },
  HBH: { label: 'Hybrid (HBH)', tone: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30' },
  HBD: { label: 'Hybrid (HBD)', tone: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30' },
  GBK1: { label: 'Gabungan (GBK1)', tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  GBK2: { label: 'Gabungan (GBK2)', tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
}

export default function AdminDashboard() {
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

  const { data: programs, loading: loadingProdi } = useFirestore('prodi')
  const { data: courses, loading: loadingCourses } = useFirestore('mataKuliah')
  const { data: schedules, loading: loadingSchedules, error: scheduleError } = useFirestore('jadwal', [], { limit: 500 })
  const { data: exams, loading: loadingExams } = useFirestore('ujian')
  const { data: history, loading: loadingHistory, error: historyError } = useFirestore('riwayat', [], { limit: 100, orderByField: 'timestamp', orderByDir: 'desc' })

  const [banner, setBanner] = useState(null)
  const [syncingProdi, setSyncingProdi] = useState(false)
  const [showAllHistoryModal, setShowAllHistoryModal] = useState(false)
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

  return (
    <div className="h-full flex flex-col gap-4 tablet:gap-4 pb-20 tablet:pb-0 w-full max-w-full overflow-x-hidden min-h-0 flex-1 animate-fade-in">
      {/* ── 1. Page Header (Tampilan & Metrik 1:1 Home Mahasiswa) ── */}
      <DashboardHeader
        onOpenDocs={() => setDocsModalOpen(true)}
        counts={{
          prodi: loadingProdi ? null : programs.length,
          mk: loadingCourses ? null : courses.length,
          jadwal: loadingSchedules ? null : schedules.length,
          ujian: loadingExams ? null : exams.length,
        }}
      />

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
      {historyError && (
        <StatusBanner ok={false} message={`Gagal memuat riwayat: ${historyError.message || historyError.code || 'Unknown error'}`} onClose={() => {}} />
      )}
      {scheduleError && (
        <StatusBanner ok={false} message={`Gagal memuat jadwal: ${scheduleError.message || scheduleError.code || 'Unknown error'}`} onClose={() => {}} />
      )}

      {/* ── 2. Grid Dashboard 2-Kolom Seimbang (Zero-Scroll 1 Layar) ── */}
      <div className="flex-1 flex flex-col min-h-0 grid gap-3.5 tablet:gap-4 desktop:grid-cols-12 desktop:items-stretch overflow-hidden">
        {/* Kolom Kiri (span-7): Riwayat Aktivitas Sistem */}
        <RecentActivityTimeline
          history={history}
          recentHistory={recentHistory}
          loadingHistory={loadingHistory}
          onOpenFullHistory={() => setShowAllHistoryModal(true)}
        />

        {/* Kolom Kanan (span-5): Ringkasan Analitik Sistem */}
        <DashboardAnalytics
          dayBreakdown={dayBreakdown}
          classTypeBreakdown={classTypeBreakdown}
        />
      </div>

      {/* Modal: Lihat Semua Log Aktivitas */}
      {showAllHistoryModal && (
        <FullHistoryModal
          historyList={sortedHistory}
          onClose={() => setShowAllHistoryModal(false)}
        />
      )}

      {/* Modal: Pusat Panduan & Tutorial Admin */}
      <FeatureDocsModal
        isOpen={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
        mode="admin"
      />
    </div>
  )
}
