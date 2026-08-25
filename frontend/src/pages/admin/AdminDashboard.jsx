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
import { saveSettings, deriveTahunAjaran } from '../../lib/publishHelpers'
import {
  collection,
  doc,
  getDocs,
  getDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebaseClient'

const QUICK_ACTIONS = [
  { to: '/admin/upload', icon: 'upload_file', label: 'Upload Jadwal Baru', tone: 'bg-primary/10 text-primary' },
  { to: '/admin/mata-kuliah', icon: 'group', label: 'Kelola MK & Dosen', tone: 'bg-secondary/10 text-secondary' },
  { to: '/admin/ujian', icon: 'event_note', label: 'Kelola Jadwal Ujian', tone: 'bg-tertiary/10 text-tertiary' },
  { to: '/admin/prodi', icon: 'list_alt', label: 'Kelola Daftar Prodi', tone: 'bg-info-container text-info' },
  { to: '/admin/libur', icon: 'event_busy', label: 'Kelola Hari Libur', tone: 'bg-warning-container text-warning' },
]

function formatDateID(iso) {
  if (!iso) return '—'
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

  const recentHistory = useMemo(
    () =>
      // timestamp adalah Firestore Timestamp — bandingkan epoch millis,
      // bukan String() (urutan leksikografisnya tidak kronologis).
      [...history]
        .sort((a, b) => (b.timestamp?.toMillis?.() ?? 0) - (a.timestamp?.toMillis?.() ?? 0))
        .slice(0, 6),
    [history],
  )

  async function handleArchive() {
    const target = Number(newSemester)
    if (!Number.isInteger(target) || target < 1 || target > 14) {
      setBanner({ ok: false, message: 'Nomor semester baru harus angka bulat 1–14.' })
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

      {/* Grid utama */}
      <div className="grid gap-lg desktop:grid-cols-12">
        {/* Kolom kiri — statistik + riwayat */}
        <section className="space-y-lg desktop:col-span-8">
          <div className="grid gap-md tablet:grid-cols-3">
            {/* Stat prodi — tonal primary */}
            <div className="relative overflow-hidden rounded-3xl bg-primary-container/30 p-lg transition-shadow hover:shadow-level-2 dark:bg-surface-container-high
              dark:text-on-surface">
              <div
                aria-hidden="true"
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"
              >
                <Icon name="domain" size={26} className="text-primary" />
              </div>
              <p className="mb-sm text-label-caps uppercase tracking-wider text-on-surface-variant">Total Prodi</p>
              {loadingProdi ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <h3 className="text-display text-primary">{programs.length}</h3>
              )}
              <p className="mt-sm flex items-center gap-xs text-body-sm font-medium text-primary">
                <Icon name="check_circle" size={16} /> Aktif
              </p>
            </div>

            {/* Stat MK — tonal secondary */}
            <div className="relative overflow-hidden rounded-3xl bg-secondary-container/30 p-lg transition-shadow hover:shadow-level-2 dark:bg-surface-container-high">
              <div
                aria-hidden="true"
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10"
              >
                <Icon name="menu_book" size={26} className="text-secondary" />
              </div>
              <p className="mb-sm text-label-caps uppercase tracking-wider text-on-surface-variant">Total Mata Kuliah</p>
              {loadingCourses ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <h3 className="text-display text-secondary">{courses.length}</h3>
              )}
              <p className="mt-sm flex items-center gap-xs text-body-sm font-medium text-secondary">
                <Icon name="book" size={16} /> Terdaftar
              </p>
            </div>

            {/* Stat semester aktif — tonal tertiary */}
            <div className="relative overflow-hidden rounded-3xl bg-tertiary-container/30 p-lg transition-shadow hover:shadow-level-2 dark:bg-surface-container-high">
              <div
                aria-hidden="true"
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/10"
              >
                <Icon name="sync_alt" size={26} className="text-tertiary" />
              </div>
              <p className="mb-sm text-label-caps uppercase tracking-wider text-on-surface-variant">Aksi Musiman</p>
              <h3 className="mb-xs text-title-md text-on-surface">Transisi Semester</h3>
              <Button variant="secondary" onClick={() => setArchiveOpen(true)} disabled={busy} className="mt-sm w-full justify-center">
                <Icon name="sync_alt" size={20} />
                Mulai Semester Baru
              </Button>
              <Button variant="ghost" onClick={handleExportBackup} disabled={busy} className="mt-xs w-full justify-center">
                <Icon name="download" size={20} />
                Export Backup JSON
              </Button>
            </div>
          </div>

          {/* Riwayat */}
          <div className="rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low">
            <div className="mb-lg flex items-center justify-between border-b border-surface-variant pb-sm">
              <h3 className="text-title-md text-on-surface">Riwayat Perubahan</h3>
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
              <ol className="ml-sm space-y-md border-l-2 border-surface-container-high pl-lg">
                {recentHistory.map((entry) => (
                  <li key={entry.id} className="relative">
                    <span
                      aria-hidden="true"
                      className={`absolute -left-[25px] top-3 h-4 w-4 rounded-full border-2 bg-surface-container-lowest ${
                        entry.field === 'hapus' ? 'border-error' : 'border-primary'
                      }`}
                    />
                    <div className="rounded-lg border border-transparent bg-surface-container p-sm transition-colors hover:border-outline-variant dark:bg-black/20">
                      <p className="break-words text-body-sm text-on-surface">
                        <span className="font-semibold">{entry.entitas}</span>
                        {' • '}
                        {entry.detail ?? `${entry.field}: ${entry.nilaiLama ?? '∅'} → ${entry.nilaiBaru ?? '∅'}`}
                      </p>
                      <p className="mt-xs text-body-sm text-on-surface-variant">
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
            )}
          </div>
        </section>

        {/* Kolom kanan — quick actions */}
        <section className="desktop:col-span-4">
          <div className="h-full rounded-3xl bg-surface-container-lowest p-lg dark:bg-surface-container-low">
            <h3 className="mb-lg text-title-md text-on-surface">Quick Actions</h3>
            <nav className="grid grid-cols-1 gap-sm tablet:grid-cols-2 desktop:grid-cols-1">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="group flex items-center gap-md rounded-lg border border-transparent p-sm transition-colors hover:border-outline-variant hover:bg-surface-container dark:hover:bg-black/20"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${action.tone}`}>
                    <Icon name={action.icon} size={22} />
                  </span>
                  <span className="min-w-0 truncate text-title-md text-on-surface group-hover:text-primary">
                    {action.label}
                  </span>
                </Link>
              ))}
            </nav>
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
