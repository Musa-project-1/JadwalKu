import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { StatusBanner } from '../../components/StatusBanner'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { useFirestore } from '../../hooks/useFirestore'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { archiveSemester } from '../../lib/semesterArchive'
import { saveSettings, deriveTahunAjaran, syncProdiFromExistingData } from '../../lib/publishHelpers'
import {
  doc,
  getDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebaseClient'
import { DatabaseBackupRestoreModal } from '../../components/admin/DatabaseBackupRestoreModal'
import { FeatureDocsModal } from '../../components/student/FeatureDocsModal'

const QUICK_ACTIONS = [
  {
    to: '/admin/jadwal',
    icon: 'upload_file',
    label: 'Upload & Kelola Jadwal',
    description: 'Import Excel / JSON jadwal mingguan',
    tone: 'bg-primary/10 text-primary border-primary/20',
  },
  {
    to: '/admin/mata-kuliah',
    icon: 'person_add',
    label: '+ Tambah MK & Dosen',
    description: 'Master kurikulum, SKS, & kontak dosen',
    tone: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  {
    to: '/admin/ujian',
    icon: 'add_task',
    label: '+ Jadwalkan Ujian',
    description: 'Kelola jadwal UTS dan UAS prodi',
    tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  {
    to: '/admin/pengaturan-akademik',
    icon: 'settings_suggest',
    label: 'Master Kalender Akademik',
    description: 'Tahun ajaran, semester, & tanggal libur',
    tone: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
]

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

function formatDateID(iso) {
  if (!iso) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

function getEntityBadge(entity = '') {
  const lower = entity.toLowerCase()
  if (lower.includes('jadwal') && !lower.includes('ujian')) {
    return { label: 'JADWAL', style: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' }
  }
  if (lower.includes('mk') || lower.includes('mata kuliah') || lower.includes('dosen')) {
    return { label: 'MATA KULIAH', style: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' }
  }
  if (lower.includes('ujian') || lower.includes('uts') || lower.includes('uas')) {
    return { label: 'UJIAN', style: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' }
  }
  if (lower.includes('prodi') || lower.includes('program studi')) {
    return { label: 'PRODI', style: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' }
  }
  return { label: entity.toUpperCase() || 'SISTEM', style: 'bg-surface-variant/80 text-on-surface-variant border-outline-variant/30' }
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
        meta: CLASS_TYPE_META[key] || { label: key, tone: 'bg-surface-variant/80 text-on-surface-variant border-outline-variant/30' },
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
    <div className="space-y-4 tablet:space-y-4.5 w-full max-w-full overflow-x-hidden">
      {/* ── 1. Page Header (Comfortable & Generous) ── */}
      <header className="flex flex-col desktop:flex-row desktop:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="flex h-10 w-10 tablet:h-11 tablet:w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
            <Icon name="dashboard" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl tablet:text-2xl font-bold tracking-tight text-on-surface">
              Dashboard Admin
            </h1>
            <p className="text-body-xs tablet:text-body-sm font-normal text-on-surface-variant truncate">
              Pusat kendali jadwal perkuliahan, kurikulum & ujian kampus.
            </p>
          </div>
        </div>

        {/* System Status Badges & Admin Docs */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            onClick={() => setDocsModalOpen(true)}
            className="rounded-full px-3 py-1.5 font-bold shadow-2xs cursor-pointer text-label-caps shrink-0"
            title="Buka Pusat Panduan & Tutorial Administrator"
          >
            <Icon name="menu_book" size={15} className="mr-1 text-primary" />
            <span>Panduan Admin</span>
          </Button>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-label-caps font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Sync</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-surface-container-high/70 border border-outline-variant/30 px-3 py-1 text-label-caps font-bold text-on-surface font-mono shadow-2xs">
            TA {deriveTahunAjaran()}
          </span>
        </div>
      </header>

      {/* Global Sync Prodi Notification if empty */}
      {!loadingProdi && !loadingCourses && programs.length === 0 && courses.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-3 text-body-xs font-semibold text-primary">
          <span>Ditemukan {courses.length} MK tanpa master prodi tersimpan.</span>
          <button
            type="button"
            onClick={handleSyncProdi}
            disabled={syncingProdi}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-body-xs font-bold text-on-primary shadow-xs cursor-pointer hover:bg-primary/90"
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
      <section className="grid grid-cols-2 desktop:grid-cols-4 gap-3 tablet:gap-4 items-stretch" aria-label="Statistik Sistem">
        {/* Stat 1: Total Prodi */}
        <Link
          to="/admin/pengaturan-akademik"
          className="group rounded-2xl tablet:rounded-3xl bg-surface-container-lowest border-l-4 border-l-emerald-500 border border-outline-variant/15 p-3.5 tablet:p-4 shadow-2xs hover:shadow-xs transition-all dark:bg-surface-container-low flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1">
            <p className="text-[11px] uppercase font-bold text-on-surface-variant tracking-wider truncate">Prodi Aktif</p>
            <div className="flex h-7 w-7 tablet:h-8 tablet:w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <Icon name="school" size={17} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl tablet:text-3xl font-extrabold text-on-surface tracking-tight">{loadingProdi ? '...' : programs.length}</h3>
            <span className="text-body-xs text-on-surface-variant font-medium">Program Studi</span>
          </div>
        </Link>

        {/* Stat 2: Total Mata Kuliah */}
        <Link
          to="/admin/mata-kuliah"
          className="group rounded-2xl tablet:rounded-3xl bg-surface-container-lowest border-l-4 border-l-blue-500 border border-outline-variant/15 p-3.5 tablet:p-4 shadow-2xs hover:shadow-xs transition-all dark:bg-surface-container-low flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1">
            <p className="text-[11px] uppercase font-bold text-on-surface-variant tracking-wider truncate">Mata Kuliah</p>
            <div className="flex h-7 w-7 tablet:h-8 tablet:w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <Icon name="menu_book" size={17} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl tablet:text-3xl font-extrabold text-on-surface tracking-tight">{loadingCourses ? '...' : courses.length}</h3>
            <span className="text-body-xs text-on-surface-variant font-medium">Master MK</span>
          </div>
        </Link>

        {/* Stat 3: Sesi Jadwal Aktif */}
        <Link
          to="/admin/jadwal"
          className="group rounded-2xl tablet:rounded-3xl bg-surface-container-lowest border-l-4 border-l-purple-500 border border-outline-variant/15 p-3.5 tablet:p-4 shadow-2xs hover:shadow-xs transition-all dark:bg-surface-container-low flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1">
            <p className="text-[11px] uppercase font-bold text-on-surface-variant tracking-wider truncate">Sesi Jadwal</p>
            <div className="flex h-7 w-7 tablet:h-8 tablet:w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
              <Icon name="calendar_month" size={17} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl tablet:text-3xl font-extrabold text-on-surface tracking-tight">{loadingSchedules ? '...' : schedules.length}</h3>
            <span className="text-body-xs text-on-surface-variant font-medium">Sesi Kuliah</span>
          </div>
        </Link>

        {/* Stat 4: Jadwal Ujian */}
        <Link
          to="/admin/ujian"
          className="group rounded-2xl tablet:rounded-3xl bg-surface-container-lowest border-l-4 border-l-amber-500 border border-outline-variant/15 p-3.5 tablet:p-4 shadow-2xs hover:shadow-xs transition-all dark:bg-surface-container-low flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1">
            <p className="text-[11px] uppercase font-bold text-on-surface-variant tracking-wider truncate">Jadwal Ujian</p>
            <div className="flex h-7 w-7 tablet:h-8 tablet:w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <Icon name="event_note" size={17} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl tablet:text-3xl font-extrabold text-on-surface tracking-tight">{loadingExams ? '...' : exams.length}</h3>
            <span className="text-body-xs text-on-surface-variant font-medium">Sesi UTS/UAS</span>
          </div>
        </Link>
      </section>

      {/* ── 3. Main 2-Column Balanced & Aligned Grid (Desktop & Mobile) ── */}
      <div className="grid gap-3.5 tablet:gap-4 desktop:grid-cols-12 desktop:items-stretch">
        {/* Kolom Kiri: Riwayat Perubahan Data (Desktop: Kolom Kiri 7 / Mobile: Order 2) */}
        <section className="desktop:col-span-7 h-full flex flex-col order-2 desktop:order-1">
          <div className="h-full flex flex-col justify-between rounded-2xl tablet:rounded-3xl bg-surface-container-lowest p-3.5 tablet:p-4.5 dark:bg-surface-container-low border border-outline-variant/20 shadow-2xs">
            <div>
              <div className="mb-3 flex items-center justify-between border-b border-outline-variant/15 pb-2.5">
                <div className="flex items-center gap-2">
                  <Icon name="history" size={20} className="text-primary" />
                  <h3 className="text-body-sm tablet:text-title-sm text-on-surface font-bold">
                    Riwayat Perubahan Data
                  </h3>
                </div>
                <span className="text-label-caps font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                  {history.length} Log
                </span>
              </div>

              {loadingHistory ? (
                <div className="space-y-2.5">
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                </div>
              ) : recentHistory.length === 0 ? (
                <EmptyState
                  icon="history"
                  title="Belum ada aktivitas tercatat"
                  description="Riwayat perubahan akan muncul otomatis saat admin melakukan upload, edit, atau publish."
                />
              ) : (
                <div className="relative pl-3.5">
                  {/* Timeline vertical bar */}
                  <div className="absolute left-[6px] top-2.5 bottom-2.5 w-0.5 bg-outline-variant/30" />
                  <ol className="space-y-2">
                    {recentHistory.map((entry) => {
                      const badge = getEntityBadge(entry.entitas)
                      return (
                        <li key={entry.id} className="relative">
                          <span
                            aria-hidden="true"
                            className={`absolute -left-[18px] top-3.5 h-2.5 w-2.5 rounded-full border-2 bg-surface-container-lowest ${
                              entry.field === 'hapus'
                                ? 'border-error bg-error/20'
                                : 'border-primary bg-primary/20'
                            }`}
                          />
                          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/50 p-2.5 tablet:p-3 transition-all duration-200 hover:scale-[1.005] hover:shadow-2xs dark:bg-surface-container-high/30">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${badge.style}`}
                                >
                                  {badge.label}
                                </span>
                                <span className="text-[10.5px] text-on-surface-variant font-medium truncate">
                                  {entry.timestamp?.toDate
                                    ? formatDateID(entry.timestamp.toDate().toISOString())
                                    : formatDateID(entry.timestamp)}
                                </span>
                              </div>

                              {/* Top-Right: Actor info */}
                              <span
                                className="inline-flex items-center gap-1 text-[10.5px] text-on-surface-variant font-medium shrink-0 max-w-[160px] truncate"
                                title={`Oleh: ${entry.aktor || 'Sistem'}`}
                              >
                                <Icon name="person" size={12} className="text-secondary shrink-0" />
                                <span className="truncate">{entry.aktor || 'Sistem'}</span>
                              </span>
                            </div>

                            <p className="break-words text-body-xs font-semibold text-on-surface leading-tight">
                              {entry.detail ??
                                `${entry.field}: ${entry.nilaiLama ?? '∅'} → ${entry.nilaiBaru ?? '∅'}`}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              )}
            </div>

            {/* Link / Button "Lihat Semua Log Aktivitas" */}
            {sortedHistory.length > 0 && (
              <div className="mt-3 border-t border-outline-variant/15 pt-2.5">
                <button
                  type="button"
                  onClick={() => setShowAllHistoryModal(true)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-surface-container-high/50 hover:bg-primary/10 hover:text-primary text-on-surface py-2.5 text-body-xs font-bold transition-all active:scale-[0.99] cursor-pointer border border-outline-variant/25 shadow-2xs"
                >
                  <Icon name="read_more" size={16} />
                  <span>Lihat Semua Log Aktivitas ({sortedHistory.length}) →</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Kolom Kanan: Aksi Cepat, Aksi Musiman & Status Sistem (Desktop: Kolom Kanan 5 / Mobile: Order 1) */}
        <section className="desktop:col-span-5 h-full flex flex-col justify-between space-y-3 tablet:space-y-3.5 order-1 desktop:order-2">
          {/* Card 1: Aksi Cepat Administratif */}
          <div className="rounded-2xl tablet:rounded-3xl bg-surface-container-lowest p-3.5 tablet:p-4.5 dark:bg-surface-container-low border border-outline-variant/20 shadow-2xs flex-1 flex flex-col justify-between">
            <div>
              <h3 className="mb-2.5 text-body-sm tablet:text-title-sm text-on-surface font-bold flex items-center gap-2">
                <Icon name="bolt" size={18} className="text-primary" />
                <span>Aksi Cepat Administratif</span>
              </h3>
              <nav className="grid grid-cols-1 sm:grid-cols-2 desktop:grid-cols-1 gap-2.5">
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex items-center gap-3 p-2.5 tablet:p-3 bg-surface-container-low/50 hover:bg-surface-container-high/60 rounded-xl border border-outline-variant/20 transition-all group hover:scale-[1.01] hover:border-primary/30 cursor-pointer shadow-2xs"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${action.tone}`}
                    >
                      <Icon name={action.icon} size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-body-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                        {action.label}
                      </p>
                      <p className="text-[10.5px] text-on-surface-variant font-medium truncate mt-0.5">
                        {action.description}
                      </p>
                    </div>
                    <Icon
                      name="chevron_right"
                      size={17}
                      className="text-on-surface-variant/50 group-hover:text-primary transition-colors shrink-0"
                    />
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Card 2: Aksi Musiman & Manajemen Data (Aligns with Left Column Bottom Edge) */}
          <div className="rounded-2xl tablet:rounded-3xl bg-surface-container-lowest p-3.5 tablet:p-4.5 dark:bg-surface-container-low border border-outline-variant/20 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  <Icon name="sync_alt" size={16} />
                </div>
                <div>
                  <h3 className="text-body-xs font-bold text-on-surface">
                    Aksi Musiman & Data
                  </h3>
                  <p className="text-[10.5px] text-on-surface-variant">
                    Manajemen semester & arsip backup
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setArchiveOpen(true)}
                disabled={busy}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 py-2 px-2.5 text-body-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                <Icon name="sync_alt" size={14} />
                <span>Semester Baru</span>
              </button>

              <button
                type="button"
                onClick={() => setBackupRestoreOpen(true)}
                disabled={busy}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 py-2 px-2.5 text-body-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                <Icon name="cloud_sync" size={14} />
                <span>Backup / Restore</span>
              </button>
            </div>

            {/* Cloud Sync Status Strip */}
            <div className="pt-2 border-t border-outline-variant/15 flex items-center justify-between text-body-xs">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300 text-[10.5px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Firebase Real-time Sync
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium">
                {appSettings?.lastPublishedAt ? `Update: ${formatDateID(appSettings.lastPublishedAt).split(' pukul ')[0]}` : 'Online'}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* ── 4. Bottom Analytics — Isi Ruang Kosong (3 Kolom Sejajar) ── */}
      <section
        className="grid grid-cols-1 desktop:grid-cols-3 gap-3.5 tablet:gap-4 items-stretch"
        aria-label="Dashboard Analitik"
      >
        {/* Panel 1: Sebaran Sesi per Hari */}
        <div className="rounded-2xl tablet:rounded-3xl bg-surface-container-lowest p-3.5 tablet:p-4.5 dark:bg-surface-container-low border border-outline-variant/20 shadow-2xs flex flex-col">
          <div className="mb-3 flex items-center gap-2 border-b border-outline-variant/15 pb-2.5">
            <Icon name="calendar_month" size={18} className="text-primary" />
            <h3 className="text-body-sm tablet:text-title-sm text-on-surface font-bold">
              Sebaran Sesi per Hari
            </h3>
          </div>
          <div className="flex-1 space-y-2.5">
            {dayBreakdown.map((item) => (
              <div key={item.day} className="space-y-1">
                <div className="flex items-center justify-between text-body-xs font-semibold text-on-surface-variant">
                  <span>{item.day}</span>
                  <span className="font-bold text-on-surface">{item.count} sesi</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-container-high/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Komposisi Tipe Kelas */}
        <div className="rounded-2xl tablet:rounded-3xl bg-surface-container-lowest p-3.5 tablet:p-4.5 dark:bg-surface-container-low border border-outline-variant/20 shadow-2xs flex flex-col">
          <div className="mb-3 flex items-center gap-2 border-b border-outline-variant/15 pb-2.5">
            <Icon name="menu_book" size={18} className="text-primary" />
            <h3 className="text-body-sm tablet:text-title-sm text-on-surface font-bold">
              Komposisi Tipe Kelas
            </h3>
          </div>
          <div className="flex-1 space-y-2">
            {classTypeBreakdown.length === 0 ? (
              <EmptyState
                icon="menu_book"
                title="Belum ada kelas"
                description="Tambah kelas untuk melihat komposisi tipe."
              />
            ) : (
              classTypeBreakdown.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-2.5 dark:bg-surface-container-high/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-bold border ${item.meta.tone}`}
                    >
                      {item.key}
                    </span>
                    <span className="text-body-xs font-semibold text-on-surface-variant truncate">
                      {item.meta.label}
                    </span>
                  </div>
                  <span className="shrink-0 text-body-sm font-extrabold text-on-surface">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel 3: Ringkasan Prodi */}
        <div className="rounded-2xl tablet:rounded-3xl bg-surface-container-lowest p-3.5 tablet:p-4.5 dark:bg-surface-container-low border border-outline-variant/20 shadow-2xs flex flex-col">
          <div className="mb-3 flex items-center gap-2 border-b border-outline-variant/15 pb-2.5">
            <Icon name="school" size={18} className="text-primary" />
            <h3 className="text-body-sm tablet:text-title-sm text-on-surface font-bold">
              Ringkasan Prodi
            </h3>
          </div>
          <div className="flex-1 space-y-2">
            {prodiBreakdown.length === 0 ? (
              <EmptyState
                icon="school"
                title="Belum ada prodi"
                description="Sinkronkan atau tambah program studi."
              />
            ) : (
              <div className="space-y-2">
                {prodiBreakdown.slice(0, 6).map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-2.5 dark:bg-surface-container-high/30"
                  >
                    <div className="min-w-0">
                      <p className="text-body-xs font-bold text-on-surface truncate">{p.name}</p>
                      <p className="text-[10.5px] text-on-surface-variant font-medium">
                        {p.mkCount} MK · {p.sessionCount} sesi
                      </p>
                    </div>
                    <span className="shrink-0 text-body-sm font-extrabold text-primary">{p.sessionCount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

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

function FullHistoryModal({ historyList, onClose }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return historyList.filter((item) => {
      const matchSearch =
        !search ||
        (item.entitas ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (item.detail ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (item.aktor ?? '').toLowerCase().includes(search.toLowerCase())

      if (!matchSearch) return false

      if (filter === 'all') return true
      const entity = (item.entitas ?? '').toLowerCase()
      if (filter === 'jadwal') return entity.includes('jadwal') && !entity.includes('ujian')
      if (filter === 'ujian') return entity.includes('ujian')
      if (filter === 'mk') return entity.includes('mk') || entity.includes('mata kuliah') || entity.includes('dosen')
      if (filter === 'prodi') return entity.includes('prodi')
      return true
    })
  }, [historyList, filter, search])

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-level-4 dark:bg-surface-container-low overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/15 p-5 tablet:p-6 bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Icon name="history" size={22} />
            </div>
            <div>
              <h2 className="text-title-md font-bold text-on-surface">Log Aktivitas Sistem</h2>
              <p className="text-body-xs text-on-surface-variant font-medium">
                Total {historyList.length} rekaman audit perubahan data
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-surface-variant text-on-surface-variant transition-colors cursor-pointer"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-4 border-b border-outline-variant/15 space-y-3 bg-surface-container-lowest dark:bg-surface-container-low">
          <div className="relative">
            <Icon
              name="search"
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              placeholder="Cari log berdasarkan kata kunci atau admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/60 pl-9 pr-3 py-2 text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { value: 'all', label: 'Semua' },
              { value: 'jadwal', label: 'Jadwal Kuliah' },
              { value: 'ujian', label: 'Jadwal Ujian' },
              { value: 'mk', label: 'Mata Kuliah & Dosen' },
              { value: 'prodi', label: 'Program Studi' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={`rounded-xl px-3 py-1 text-body-xs font-bold transition-all cursor-pointer ${
                  filter === tab.value
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-5 tablet:p-6 space-y-3">
          {filtered.length === 0 ? (
            <EmptyState
              icon="search_off"
              title="Tidak ada log ditemukan"
              description="Coba ubah kata kunci pencarian atau filter kategori."
            />
          ) : (
            <ol className="space-y-3">
              {filtered.map((entry) => {
                const badge = getEntityBadge(entry.entitas)
                return (
                  <li
                    key={entry.id}
                    className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-3.5 dark:bg-surface-container-high/30"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-medium truncate">
                          {entry.timestamp?.toDate
                            ? formatDateID(entry.timestamp.toDate().toISOString())
                            : formatDateID(entry.timestamp)}
                        </span>
                      </div>

                      <span
                        className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant font-medium shrink-0 max-w-[200px] truncate"
                        title={`Oleh: ${entry.aktor || 'Sistem'}`}
                      >
                        <Icon name="person" size={13} className="text-secondary shrink-0" />
                        <span className="truncate">{entry.aktor || 'Sistem'}</span>
                      </span>
                    </div>
                    <p className="break-words text-body-sm font-semibold text-on-surface leading-snug">
                      {entry.detail ??
                        `${entry.field}: ${entry.nilaiLama ?? '∅'} → ${entry.nilaiBaru ?? '∅'}`}
                    </p>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-outline-variant/15 p-4 bg-surface-container-low/30 flex justify-end">
          <Button variant="secondary" onClick={onClose} className="rounded-xl px-5 py-2 text-body-sm font-bold">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}
