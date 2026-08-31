import { useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
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
      <div className="flex w-full max-w-[800px] flex-col items-center animate-fade-in">
        <header className="mb-xl text-center flex flex-col items-center">
          <img
            src={`${import.meta.env.BASE_URL}logo.svg`}
            alt="Logo JadwalKu"
            className="mb-4 h-16 w-16 drop-shadow-md transition-opacity duration-300 hover:opacity-90"
          />
          <h1 className="text-display font-bold font-sans tracking-[-0.02em] mb-1">
            <span className="text-on-surface">Jadwal</span>
            <span className="text-primary">Ku</span>
          </h1>
          <p className="text-body-lg text-on-surface-variant">
            Pilih peran Anda untuk melanjutkan
          </p>
        </header>
        <div className="grid w-full grid-cols-1 gap-lg tablet:grid-cols-2">
          {/* Mahasiswa Card */}
          <div className="rounded-[2rem] p-1 bg-surface-container-low/60 border border-outline-variant/15 shadow-2xs dark:bg-surface-container-lowest/10 flex flex-col transition-all duration-200 hover:shadow-md active:opacity-85 cursor-pointer group">
            <button
              type="button"
              onClick={() => navigate('/onboarding/prodi')}
              className="relative flex flex-col items-center justify-center rounded-[calc(2rem-0.25rem)] border border-outline-variant/20 bg-surface-container-lowest p-8 sm:p-10 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] dark:bg-surface-container-low w-full h-full focus:outline-none cursor-pointer"
            >
              <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 transition-colors duration-300 ease-out group-hover:bg-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:group-hover:bg-emerald-500/25">
                <Icon name="school" size={40} filled className="text-emerald-700 dark:text-emerald-300" />
              </div>
              <h2 className="mb-1 text-title-md font-bold text-on-surface transition-colors duration-300 group-hover:text-primary">
                Masuk sebagai Mahasiswa
              </h2>
              <p className="text-body-sm text-on-surface-variant font-medium max-w-[260px]">
                Akses jadwal kelas, ujian, dan informasi akademik
              </p>
              <div className="mt-4 flex items-center gap-1 text-[13px] font-semibold text-primary opacity-60 transition-all duration-300 group-hover:opacity-100">
                <span>Lanjutkan</span>
                <Icon name="arrow_forward" size={15} />
              </div>
            </button>
          </div>

          {/* Admin Card */}
          <div className="rounded-[2rem] p-1 bg-surface-container-low/60 border border-outline-variant/15 shadow-2xs dark:bg-surface-container-lowest/10 flex flex-col transition-all duration-200 hover:shadow-md active:opacity-85 cursor-pointer group">
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="relative flex flex-col items-center justify-center rounded-[calc(2rem-0.25rem)] border border-outline-variant/20 bg-surface-container-lowest p-8 sm:p-10 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] dark:bg-surface-container-low w-full h-full focus:outline-none cursor-pointer"
            >
              <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 ease-out group-hover:bg-primary/20 dark:bg-primary/15 dark:text-primary dark:group-hover:bg-primary/25">
                <Icon name="admin_panel_settings" size={40} className="text-primary" />
              </div>
              <h2 className="mb-1 text-title-md font-bold text-on-surface transition-colors duration-300 group-hover:text-primary">
                Masuk sebagai Admin
              </h2>
              <p className="text-body-sm text-on-surface-variant font-medium max-w-[260px]">
                Kelola data jadwal, prodi, dan pengaturan kampus
              </p>
              <div className="mt-4 flex items-center gap-1 text-[13px] font-semibold text-primary opacity-60 transition-all duration-300 group-hover:opacity-100">
                <span>Masuk Panel</span>
                <Icon name="arrow_forward" size={15} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getProdiMeta(nama) {
  const lower = String(nama || '').toLowerCase()
  if (lower.includes('informatika')) return { icon: 'computer', code: 'IF', color: 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10' }
  if (lower.includes('bisnis')) return { icon: 'trending_up', code: 'BD', color: 'text-blue-600 dark:text-blue-300 bg-blue-500/10' }
  if (lower.includes('sipil')) return { icon: 'construction', code: 'TS', color: 'text-amber-600 dark:text-amber-300 bg-amber-500/10' }
  if (lower.includes('arsitektur')) return { icon: 'architecture', code: 'AR', color: 'text-violet-600 dark:text-violet-300 bg-violet-500/10' }
  if (lower.includes('wirausaha')) return { icon: 'rocket_launch', code: 'KW', color: 'text-rose-600 dark:text-rose-300 bg-rose-500/10' }
  return { icon: 'school', code: (nama || 'MK').slice(0, 2).toUpperCase(), color: 'text-primary bg-primary/10' }
}

function ProdiStep() {
  const navigate = useNavigate()
  const [prodi, setProdi] = useState(() => getItem(STORAGE_KEYS.program, null))
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
    <div className="flex min-h-screen items-center justify-center bg-transparent p-md sm:p-lg">
      <div className="w-full max-w-[520px] rounded-[2rem] p-1 bg-surface-container-low/60 border border-outline-variant/15 shadow-2xs dark:bg-surface-container-lowest/10 animate-fade-in">
        <div className="w-full rounded-[calc(2rem-0.25rem)] border border-outline-variant/20 bg-surface-container-lowest p-6 sm:p-8 shadow-xs dark:bg-surface-container-low">
          {/* Step Indicator Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-label-caps font-bold text-primary tracking-wider">LANGKAH 1 DARI 2</span>
              <span className="text-body-xs font-semibold text-on-surface-variant">50% Selesai</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full w-1/2 rounded-full bg-primary transition-all duration-300" />
            </div>
          </div>

          <header className="mb-5">
            <h1 className="text-headline-md font-bold text-on-surface">Pilih Program Studi</h1>
            <p className="mt-1 text-body-sm text-on-surface-variant font-medium">
              Jadwal perkuliahan akan disesuaikan otomatis dengan prodi Anda.
            </p>
          </header>

          {/* Prodi List — zero scrolling, all items fit cleanly */}
          <div className="space-y-2">
            {programs.map((p) => {
              const meta = getProdiMeta(p.nama)
              const isSelected = prodi === p.nama
              return (
                <button
                  key={p.nama}
                  type="button"
                  onClick={() => setProdi(p.nama)}
                  className={`group flex w-full items-center justify-between rounded-2xl border px-3.5 py-2.5 sm:px-4 sm:py-3 text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm dark:bg-primary/20'
                      : 'border-outline-variant/30 bg-surface-container-low/50 hover:border-primary/40 hover:bg-surface-container-low dark:bg-surface-container-high/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold transition-all duration-200 ${meta.color} ${
                        isSelected ? 'ring-2 ring-primary/30' : 'group-hover:brightness-105'
                      }`}
                    >
                      <Icon name={meta.icon} size={18} />
                    </div>
                    <div>
                      <p
                        className={`text-body-md font-bold leading-snug transition-colors ${
                          isSelected ? 'text-primary' : 'text-on-surface group-hover:text-primary'
                        }`}
                      >
                        {p.nama}
                      </p>
                      <p className="text-[11px] font-semibold text-on-surface-variant/80">
                        Semester {p.semesterMin} - {p.semesterMax}
                      </p>
                    </div>
                  </div>
                  {isSelected ? (
                    <Icon name="check_circle" filled size={20} className="text-primary shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-outline-variant/40 group-hover:border-primary/50 shrink-0 transition-colors" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-3 pt-1">
            <Button
              variant="secondary"
              onClick={() => navigate('/onboarding')}
              className="rounded-full px-5 py-2.5 font-semibold text-body-sm"
            >
              Kembali
            </Button>
            <Button
              className="flex-1 rounded-full py-2.5 font-bold text-body-sm shadow-md"
              disabled={!prodi}
              onClick={() => navigate('/onboarding/semester', { state: { prodi } })}
            >
              <span>Lanjutkan</span>
              <Icon name="arrow_forward" size={18} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SemesterStep() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setProgram, setSemester: setSemesterContext } = useApp()
  const prodi = location.state?.prodi ?? getItem(STORAGE_KEYS.program)
  const [semester, setSemester] = useState(() => getItem(STORAGE_KEYS.semester, null))
  const { data: dbPrograms } = useFirestore('prodi')

  const program = useMemo(() => {
    const pool = dbPrograms.length > 0 ? dbPrograms : samplePrograms
    return pool.find((p) => p.nama === prodi)
  }, [dbPrograms, prodi])

  const semesters = useMemo(() => {
    const min = program?.semesterMin ?? 1
    const max = program?.semesterMax ?? 8
    return Array.from({ length: max - min + 1 }, (_, i) => min + i)
  }, [program])

  function handleSave() {
    // flushSync memaksa React memproses state update secara sinkron
    // sebelum navigasi, sehingga Home.jsx langsung menerima program & semester yang benar.
    flushSync(() => {
      setProgram(prodi)
      setSemesterContext(semester)
    })
    setItem(STORAGE_KEYS.program, prodi)
    setItem(STORAGE_KEYS.semester, semester)
    setItem(STORAGE_KEYS.onboardingDone, true)
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-md sm:p-lg">
      <div className="w-full max-w-[520px] rounded-[2rem] p-1 bg-surface-container-low/60 border border-outline-variant/15 shadow-2xs dark:bg-surface-container-lowest/10 animate-fade-in">
        <div className="w-full rounded-[calc(2rem-0.25rem)] border border-outline-variant/20 bg-surface-container-lowest p-6 sm:p-8 shadow-xs dark:bg-surface-container-low">
          {/* Step Indicator Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-label-caps font-bold text-primary tracking-wider">LANGKAH 2 DARI 2</span>
              <span className="text-body-xs font-semibold text-emerald-600 dark:text-emerald-400">Langkah Terakhir</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full w-full rounded-full bg-primary transition-all duration-300" />
            </div>
          </div>

          <header className="mb-6">
            <h1 className="text-headline-md font-bold text-on-surface">Pilih Semester</h1>
            <p className="mt-1 text-body-sm text-on-surface-variant font-medium">
              Semester aktif untuk prodi <span className="font-bold text-primary">{prodi ?? 'Anda'}</span>
            </p>
          </header>

          {/* Semester Grid */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            {semesters.map((s) => {
              const isSelected = semester === s
              const isGanjil = s % 2 !== 0
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSemester(s)}
                  className={`group flex flex-col items-center justify-center rounded-2xl border py-4 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary text-on-primary font-bold shadow-md ring-2 ring-primary/40'
                      : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface hover:border-primary/40 hover:bg-surface-container-low hover:shadow-sm dark:bg-surface-container-high/30'
                  }`}
                >
                  <span className="text-headline-sm font-bold leading-none mb-1">{s}</span>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isSelected ? 'text-white/80' : 'text-on-surface-variant/70'
                    }`}
                  >
                    {isGanjil ? 'Ganjil' : 'Genap'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => navigate('/onboarding/prodi')}
              className="rounded-full px-5 py-2.5 font-semibold text-body-sm"
            >
              Kembali
            </Button>
            <Button
              className="flex-1 rounded-full py-2.5 font-bold text-body-sm shadow-md"
              disabled={!semester}
              onClick={handleSave}
            >
              <Icon name="check" size={18} className="mr-1" />
              <span>Simpan & Mulai</span>
            </Button>
          </div>
          <p className="mt-4 text-center text-body-xs text-on-surface-variant/70">
            Pilihan prodi & semester dapat diubah kapan saja di menu Pengaturan.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Onboarding() {
  return <RoleSelection />
}

export { ProdiStep, SemesterStep }
