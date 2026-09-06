import { useNavigate } from "react-router-dom"
import { Icon } from "../../components/Icon"
import { OnboardingWizard } from "../../components/student/onboarding/OnboardingWizard"

export { OnboardingWizard }

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
          <div className="rounded-3xl p-1 bg-surface-container-low/60 border border-outline-variant/15 shadow-level-1 dark:bg-surface-container-lowest/10 flex flex-col transition-all duration-200 hover:shadow-level-2 active:opacity-85 cursor-pointer group">
            <button
              type="button"
              onClick={() => navigate('/onboarding/wizard')}
              className="relative flex flex-col items-center justify-center rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-8 sm:p-10 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] dark:bg-surface-container-low w-full h-full focus:outline-none cursor-pointer"
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
              <div className="mt-4 flex items-center gap-1 text-body-sm font-semibold text-primary opacity-60 transition-all duration-300 group-hover:opacity-100">
                <span>Lanjutkan</span>
                <Icon name="arrow_forward" size={15} />
              </div>
            </button>
          </div>

          <div className="rounded-3xl p-1 bg-surface-container-low/60 border border-outline-variant/15 shadow-level-1 dark:bg-surface-container-lowest/10 flex flex-col transition-all duration-200 hover:shadow-level-2 active:opacity-85 cursor-pointer group">
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="relative flex flex-col items-center justify-center rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-8 sm:p-10 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] dark:bg-surface-container-low w-full h-full focus:outline-none cursor-pointer"
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
              <div className="mt-4 flex items-center gap-1 text-body-sm font-semibold text-primary opacity-60 transition-all duration-300 group-hover:opacity-100">
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


export default function Onboarding() {
  return <RoleSelection />
}
