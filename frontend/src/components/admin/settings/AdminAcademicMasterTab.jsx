import { Icon } from '../../Icon'

export function AdminAcademicMasterTab({
  language,
  setCalendarOpen,
  setKaldikImportOpen,
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-title-sm font-bold text-on-surface">
          {language === 'en' ? 'Master Academic Settings' : 'Konfigurasi Master Akademik'}
        </h3>
        <p className="text-body-xs text-on-surface-variant mt-0.5">
          {language === 'en'
            ? 'Manage academic calendars, programs (prodi), holidays, and room coordinates'
            : 'Kelola kalender akademik, program studi, hari libur, dan ruangan kampus'}
        </p>
      </div>

      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3.5">
        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          className="group p-4 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low hover:border-primary/50 transition-all flex flex-col justify-between shadow-2xs text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Icon name="calendar_month" size={20} />
            </div>
            <div>
              <h4 className="text-body-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                Kalender Akademik & Libur
              </h4>
              <p className="text-[11.5px] text-on-surface-variant">Batas semester, TA, dan kalender libur</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end text-label-caps text-primary font-bold">
            <span>Konfigurasi Kalender →</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setKaldikImportOpen(true)}
          className="group p-4 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low hover:border-secondary/50 transition-all flex flex-col justify-between shadow-2xs text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20">
              <Icon name="upload_file" size={20} />
            </div>
            <div>
              <h4 className="text-body-sm font-bold text-on-surface group-hover:text-secondary transition-colors">
                Impor Kaldik Resmi (PDF / Excel)
              </h4>
              <p className="text-[11.5px] text-on-surface-variant">Ekstrak otomatis tanggal semester & libur</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end text-label-caps text-secondary font-bold">
            <span>Impor Berkas →</span>
          </div>
        </button>
      </div>
    </div>
  )
}
