import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/Button'
import { samplePrograms } from '../../data/samplePrograms'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'
import { useFirestore } from '../../hooks/useFirestore'
import { useApp } from '../../hooks/useApp'

function RoleSelection() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-md sm:p-lg">
      <div className="flex w-full max-w-[800px] flex-col items-center">
        <header className="mb-xl text-center">
          <h1 className="mb-base text-display text-primary">
            Selamat Datang di Jadwal Kampus
          </h1>
          <p className="text-body-lg text-on-surface-variant">
            Pilih peran Anda untuk melanjutkan
          </p>
        </header>
        <div className="grid w-full grid-cols-1 gap-lg tablet:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate('/onboarding/prodi')}
            className="group flex flex-col items-center justify-center rounded-3xl border-2 border-transparent bg-surface-container-lowest p-xl text-center shadow-level-1 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-level-2 focus:outline-none focus:ring-4 focus:ring-primary/20 dark:bg-surface-container-low"
          >
            <div className="mb-md flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 transition-colors duration-300 group-hover:bg-primary">
              <Icon name="school" size={40} filled className="text-primary transition-colors duration-300 group-hover:text-on-primary" />
            </div>
            <h2 className="mb-xs text-title-md text-on-surface font-semibold">
              Masuk sebagai Mahasiswa
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              Akses jadwal dan informasi akademik
            </p>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            className="group flex flex-col items-center justify-center rounded-3xl border-2 border-transparent bg-surface-container-lowest p-xl text-center shadow-level-1 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-level-2 focus:outline-none focus:ring-4 focus:ring-primary/20 dark:bg-surface-container-low"
          >
            <div className="mb-md flex h-24 w-24 items-center justify-center rounded-full bg-surface-container-highest transition-colors duration-300 group-hover:bg-primary dark:bg-surface-container-high">
              <Icon name="admin_panel_settings" size={40} className="text-on-surface-variant transition-colors duration-300 group-hover:text-on-primary" />
            </div>
            <h2 className="mb-xs text-title-md text-on-surface font-semibold">
              Masuk sebagai Admin
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              Kelola data dan jadwal kampus
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}

function ProdiStep() {
  const navigate = useNavigate()
  const [prodi, setProdi] = useState(() => getItem(STORAGE_KEYS.program, null))
  // Daftar prodi dikelola admin (koleksi `prodi`); fallback ke sample saat
  // Firestore kosong / belum terkonfigurasi.
  const { data: prodiDocs } = useFirestore('prodi')
  const programs = useMemo(() => {
    if (prodiDocs.length > 0) {
      return prodiDocs
        .map((p) => ({
          nama: p.nama,
          semesterMin: p.semesterMin ?? 1,
          semesterMax: p.semesterMax ?? 8,
        }))
        .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
    }
    return samplePrograms
  }, [prodiDocs])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-transparent p-md sm:p-lg">
      <p className="mb-base text-label-caps text-primary">LANGKAH 1/2</p>
      {/* Track progress bar memakai token surface-container-high yang otomatis berubah di mode gelap */}
      <div className="mb-lg h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full w-1/2 rounded-full bg-primary transition-all" />
      </div>
      <h1 className="mb-sm text-headline-lg text-on-surface">Pilih Program Studi</h1>
      <p className="mb-lg text-body-lg text-on-surface-variant">
        Jadwal akan difilter otomatis sesuai prodi Anda
      </p>

      <div className="flex flex-1 flex-col gap-sm">
        {programs.map((p) => (
          <button
            key={p.nama}
            type="button"
            onClick={() => setProdi(p.nama)}
            className={`flex items-center justify-between rounded-2xl border-2 bg-surface-container-lowest px-md py-sm text-left transition-colors dark:bg-surface-container-low ${
              prodi === p.nama
                ? 'border-primary'
                : 'border-transparent hover:border-outline-variant'
            }`}
          >
            <span className="text-title-md text-on-surface">{p.nama}</span>
            {prodi === p.nama && <Icon name="check_circle" filled className="text-primary" />}
          </button>
        ))}
      </div>

      <div className="mt-lg flex gap-sm">
        <Button variant="secondary" onClick={() => navigate('/onboarding')} className="px-lg">
          Kembali
        </Button>
        <Button className="flex-1 py-sm" disabled={!prodi} onClick={() => navigate('/onboarding/semester', { state: { prodi } })}>
          Lanjutkan
        </Button>
      </div>
    </div>
  )
}

function SemesterStep() {
  const navigate = useNavigate()
  const location = useLocation()
  // Setter context: tanpa ini, perubahan prodi/semester hanya tersimpan di
  // localStorage dan UI tetap memakai nilai lama sampai reload penuh.
  const { setProgram, setSemester: setSemesterContext } = useApp()
  const prodi = location.state?.prodi ?? getItem(STORAGE_KEYS.program)
  const [semester, setSemester] = useState(() => getItem(STORAGE_KEYS.semester, null))

  const program = useMemo(
    () => samplePrograms.find((p) => p.nama === prodi),
    [prodi],
  )
  const semesters = useMemo(() => {
    const min = program?.semesterMin ?? 1
    const max = program?.semesterMax ?? 8
    return Array.from({ length: max - min + 1 }, (_, i) => min + i)
  }, [program])

  function handleSave() {
    // Sinkronkan ke context App agar perubahan langsung terasa tanpa reload.
    setProgram(prodi)
    setSemesterContext(semester)
    setItem(STORAGE_KEYS.program, prodi)
    setItem(STORAGE_KEYS.semester, semester)
    setItem(STORAGE_KEYS.onboardingDone, true)
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-transparent p-md sm:p-lg">
      <p className="mb-base text-label-caps text-primary">LANGKAH 2/2</p>
      {/* Track progress bar memakai token surface-container-high yang otomatis berubah di mode gelap */}
      <div className="mb-lg h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full w-full rounded-full bg-primary transition-all" />
      </div>
      <h1 className="mb-sm text-headline-lg text-on-surface">Pilih Semester</h1>
      <p className="mb-lg text-body-lg text-on-surface-variant">
        Semester untuk {prodi ?? 'prodi Anda'}
      </p>

      <div className="grid flex-1 grid-cols-4 gap-sm content-start">
        {semesters.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSemester(s)}
            className={`flex h-16 items-center justify-center rounded-2xl border-2 bg-surface-container-lowest text-title-md transition-colors dark:bg-surface-container-low ${
              semester === s
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface hover:border-outline-variant'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-lg flex gap-sm">
        <Button variant="secondary" onClick={() => navigate('/onboarding/prodi')} className="px-lg">
          Kembali
        </Button>
        <Button className="flex-1 py-sm" disabled={!semester} onClick={handleSave}>
          Simpan & Lanjutkan
        </Button>
      </div>
      <p className="mt-sm text-center text-body-sm text-on-surface-variant">
        Bisa diubah kapan saja di pengaturan
      </p>
    </div>
  )
}

export default function Onboarding() {
  return <RoleSelection />
}

export { ProdiStep, SemesterStep }
