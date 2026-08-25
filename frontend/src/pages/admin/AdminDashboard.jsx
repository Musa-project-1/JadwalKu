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
  collection,
  doc,
  getDocs,
  getDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebaseClient'

const QUICK_ACTIONS = [
  { to: '/admin/jadwal', icon: 'edit_calendar', label: 'Kelola & Upload Jadwal', tone: 'bg-primary/10 text-primary' },
  { to: '/admin/mata-kuliah', icon: 'group', label: 'Kelola MK & Dosen', tone: 'bg-secondary/10 text-secondary' },
  { to: '/admin/ujian', icon: 'event_note', label: 'Kelola Jadwal Ujian', tone: 'bg-tertiary/10 text-tertiary' },
  { to: '/admin/pengaturan-akademik', icon: 'settings_suggest', label: 'Master & Pengaturan Akademik', tone: 'bg-info-container text-info' },
]

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

export default function AdminDashboard() {
  const { user } = useAdminAuth()
  const actor = user?.email ?? ''

  const { data: programs, loading: loadingProdi } = useFirestore('prodi')
  const { data: courses, loading: loadingCourses } = useFirestore('mataKuliah')
  const { data: history, loading: loadingHistory } = useFirestore('riwayat')

  const [archiveOpen, setArchiveOpen] = useState(false)
  const [newSemester, setNewSemester] = useState('')
  const [banner, setBanner] = useState(null)
  const [busy, setBusy] = useState(false)
  const [syncingProdi, setSyncingProdi] = useState(false)

  const recentHistory = useMemo(
    () =>
      // timestamp adalah Firestore Timestamp — bandingkan epoch millis,
      // bukan String() (urutan leksikografisnya tidak kronologis).
      [...history]
        .sort((a, b) => (b.timestamp?.toMillis?.() ?? 0) - (a.timestamp?.toMillis?.() ?? 0))
        .slice(0, 6),
    [history],
  )

  async function handleSyncProdi() {
    setSyncingProdi(true)
    setBanner(null)
    const result = await syncProdiFromExistingData(actor)
    setSyncingProdi(false)
    if (result.ok) {
      setBanner({
        ok: true,
        message: result.count > 0
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
    // Semester aktif saat ini dibaca dari settings; default 1 bila belum ada.
    let oldSemester = 1
    try {
      const snap = await getDoc(doc(db, 'settings', 'app'))
      oldSemester = Number(snap.data()?.currentSemester) || 1
    } catch {
      // tanpa backend / dokumen belum ada → pakai default
    }

    const result = await archiveSemester({
      oldSemester,
      newSemester: target,
      actor,
    })

    if (result.ok) {
      await saveSettings({
        currentSemester: target,
        currentTahunAjaran: deriveTahunAjaran(),
        lastArchivedAt: new Date().toISOString(),
      })
      setBanner({
        ok: true,
        message: `Semester ${oldSemester} diarsipkan (${result.archivedCount} dokumen). Semester aktif kini ${target}.`,
      })
    } else {
      setBanner({ ok: false, message: result.error })
    }
    setBusy(false)
    setArchiveOpen(false)
  }

  async function handleExportBackup() {
    setBusy(true)
    try {
      const snapshot = {}
      for (const name of ['jadwal', 'mataKuliah', 'ujian', 'prodi', 'libur', 'settings']) {
        const snap = await getDocs(collection(db, name))
        snapshot[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      }
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...snapshot }, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-jadwal-kampus-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      setBanner({ ok: true, message: 'Backup JSON berhasil diunduh.' })
    } catch (err) {
      setBanner({ ok: false, message: `Gagal export backup: ${err?.message ?? err}` })
    }
    setBusy(false)
  }

  return (
    <div className="space-y-lg">
      <header>
        <div className="flex items-center gap-md">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-container/50 dark:bg-primary-container/25 text-primary">
            <Icon name="dashboard" size={26} />
          </span>
          <h2 className="text-headline-lg font-bold text-on-surface">Dashboard Overview</h2>
        </div>
        <p className="text-body-lg text-on-surface-variant">
          Status sistem dan aksi administratif cepat.
        </p>
      </header>

      {banner && (
        <StatusBanner
          ok={banner.ok}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* Baris 1: 3 Statistik Utama — Full Width di atas */}
      <section className="grid gap-md tablet:grid-cols-3">
        {/* Stat prodi — tonal mint */}
        <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest border-l-[4px] border-l-emerald-500 border border-outline-variant/15 p-lg shadow-level-1 transition-shadow hover:shadow-level-2 dark:bg-surface-container-low">
          <div
            aria-hidden="true"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15"
          >
            <Icon name="domain" size={26} className="text-secondary" />
          </div>
          <p className="mb-sm text-label-caps uppercase tracking-wider text-on-surface-variant font-semibold">Total Prodi</p>
          {loadingProdi ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <h3 className="text-display text-on-surface font-bold">{programs.length}</h3>
          )}
          <div className="mt-sm flex flex-wrap items-center justify-between gap-xs">
            <p className="flex items-center gap-xs text-body-sm font-medium text-secondary">
              <Icon name="check_circle" size={16} /> Aktif
            </p>
            {!loadingProdi && !loadingCourses && programs.length === 0 && courses.length > 0 && (
              <button
                type="button"
                onClick={handleSyncProdi}
                disabled={syncingProdi}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <Icon name="sync" size={14} className={syncingProdi ? 'animate-spin' : ''} />
                Sinkronkan dari {courses.length} MK
              </button>
            )}
          </div>
        </div>

        {/* Stat MK — tonal blue */}
        <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest border-l-[4px] border-l-blue-500 border border-outline-variant/15 p-lg shadow-level-1 transition-shadow hover:shadow-level-2 dark:bg-surface-container-low">
          <div
            aria-hidden="true"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-info/15"
          >
            <Icon name="menu_book" size={26} className="text-info" />
          </div>
          <p className="mb-sm text-label-caps uppercase tracking-wider text-on-surface-variant font-semibold">Total Mata Kuliah</p>
          {loadingCourses ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <h3 className="text-display text-on-surface font-bold">{courses.length}</h3>
          )}
          <p className="mt-sm flex items-center gap-xs text-body-sm font-medium text-info">
            <Icon name="book" size={16} /> Terdaftar
          </p>
        </div>

        {/* Stat semester aktif — tonal peach */}
        <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest border-l-[4px] border-l-amber-500 border border-outline-variant/15 p-lg shadow-level-1 transition-shadow hover:shadow-level-2 dark:bg-surface-container-low">
          <div
            aria-hidden="true"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15"
          >
            <Icon name="sync_alt" size={26} className="text-warning" />
          </div>
          <p className="mb-sm text-label-caps uppercase tracking-wider text-on-surface-variant font-semibold">Aksi Musiman</p>
          <h3 className="mb-xs text-title-md text-on-surface font-semibold">Transisi Semester</h3>
          <Button variant="secondary" onClick={() => setArchiveOpen(true)} disabled={busy} className="mt-sm w-full justify-center">
            <Icon name="sync_alt" size={20} />
            Mulai Semester Baru
          </Button>
          <Button variant="ghost" onClick={handleExportBackup} disabled={busy} className="mt-xs w-full justify-center">
            <Icon name="download" size={20} />
            Export Backup JSON
          </Button>
        </div>
      </section>

      {/* Baris 2: Riwayat Perubahan (8 col) + Quick Actions & Info (4 col) */}
      <div className="grid gap-lg desktop:grid-cols-12 items-start">
        {/* Kolom kiri — riwayat */}
        <section className="desktop:col-span-8">
          <div className="rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low border border-outline-variant/10">
            <div className="mb-lg flex items-center justify-between border-b border-surface-variant pb-sm">
              <h3 className="text-title-md text-on-surface font-bold">Riwayat Perubahan</h3>
            </div>
            {loadingHistory ? (
              <div className="space-y-sm">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : recentHistory.length === 0 ? (
              <EmptyState
                icon="history"
                title="Belum ada aktivitas tercatat"
                description="Riwayat perubahan akan muncul setelah admin melakukan upload, edit, atau publish."
              />
            ) : (
              <div className="relative pl-6">
                {/* Vertical timeline line */}
                <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-outline-variant/30" />
                <ol className="space-y-md">
                  {recentHistory.map((entry) => (
                    <li key={entry.id} className="relative">
                      <span
                        aria-hidden="true"
                        className={`absolute -left-[27px] top-3 h-4 w-4 rounded-full border-2 bg-surface ${
                          entry.field === 'hapus' ? 'border-error' : 'border-primary'
                        }`}
                      />
                      <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-4 transition-all duration-200 hover:scale-[1.005] hover:shadow-level-2 dark:bg-black/20">
                        <p className="break-words text-body-sm text-on-surface font-semibold">
                          <span>{entry.entitas}</span>
                          {' • '}
                          {entry.detail ?? `${entry.field}: ${entry.nilaiLama ?? '∅'} → ${entry.nilaiBaru ?? '∅'}`}
                        </p>
                        <p className="mt-xs text-body-sm text-on-surface-variant font-medium">
                          {entry.timestamp?.toDate
                            ? formatDateID(entry.timestamp.toDate().toISOString())
                            : formatDateID(entry.timestamp)}
                          {' • Oleh '}
                          {entry.aktor || 'Sistem'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </section>

        {/* Kolom kanan — quick actions + status ringkas */}
        <section className="space-y-md desktop:col-span-4">
          <div className="rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low border border-outline-variant/10">
            <h3 className="mb-md text-title-md text-on-surface font-bold">Quick Actions</h3>
            <nav className="grid grid-cols-1 gap-sm">
              {QUICK_ACTIONS.map((action) => (
                <div key={action.to} className="border border-outline-variant/10 rounded-2xl bg-surface-container-lowest p-0.5 shadow-sm group hover:scale-[1.002] transition-all">
                  <Link
                    to={action.to}
                    className="flex w-full items-center gap-sm px-3 py-2.5 bg-surface-container rounded-[14px] text-body-md text-on-surface-variant hover:bg-surface-container-high transition-colors font-semibold"
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${action.tone}`}>
                      <Icon name={action.icon} size={18} />
                    </span>
                    <span>
                      {action.label}
                    </span>
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          <div className="rounded-3xl bg-surface-container-lowest/70 p-md dark:bg-surface-container-low/70 border border-outline-variant/10">
            <div className="flex items-center gap-2 text-label-caps text-on-surface-variant font-medium mb-1">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Sistem JadwalKampus Aktif
            </div>
            <p className="text-[12px] text-on-surface-variant/80">
              Perubahan pada prodi, MK, atau jadwal langsung tersinkronisasi ke seluruh mahasiswa secara realtime.
            </p>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={archiveOpen}
        title="Mulai semester baru?"
        description={`Seluruh jadwal & ujian pada semester aktif akan diarsipkan (status "archived") dan tidak lagi tampil ke mahasiswa. Masukkan nomor semester baru:`}
        confirmLabel={busy ? 'Memproses…' : 'Arsipkan'}
        cancelLabel="Batal"
        onConfirm={handleArchive}
        onCancel={() => setArchiveOpen(false)}
      >
        <label className="mt-md block">
          <span className="mb-1 block text-body-sm text-on-surface-variant">Nomor semester baru</span>
          <input
            type="number"
            min="1"
            max="14"
            value={newSemester}
            onChange={(e) => setNewSemester(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-lg text-on-surface dark:bg-surface-container-high"
          />
        </label>
      </ConfirmDialog>
    </div>
  )
}
