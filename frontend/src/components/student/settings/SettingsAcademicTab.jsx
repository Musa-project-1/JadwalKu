import { Icon } from '../../Icon'
import { Button } from '../../Button'

export function SettingsAcademicTab({
  language,
  fakultasNama,
  program,
  semester,
  taLabel,
  onClose,
  navigate,
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-title-sm font-bold text-on-surface">
          {language === 'en' ? 'Academic Profile & Program' : 'Profil Akademik & Program'}
        </h3>
        <p className="text-body-xs text-on-surface-variant mt-0.5">
          {language === 'en'
            ? 'Active study program, enrolled semester, and academic year'
            : 'Program studi, semester aktif, dan penetapan tahun ajaran Anda'}
        </p>
      </div>

      <div className="rounded-2xl border border-outline-variant/20 bg-gradient-to-br from-primary/10 via-primary/5 to-surface-container-high/40 p-5 shadow-2xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-level-1">
              <Icon name="school" size={26} />
            </div>
            <div className="min-w-0">
              <p className="text-label-caps uppercase font-extrabold tracking-wider text-primary">
                {fakultasNama || (language === 'en' ? 'Campus Faculty' : 'Fakultas')}
              </p>
              <h4 className="text-title-md font-bold text-on-surface leading-snug truncate">
                {program || (language === 'en' ? 'Not selected' : 'Belum dipilih')}
              </h4>
              <p className="text-body-xs text-on-surface-variant font-medium mt-0.5">
                {language === 'en' ? `Semester ${semester || '-'}` : `Semester ${semester || '-'}`}{' '}
                {taLabel ? `· Tahun Ajaran ${taLabel}` : ''}
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              onClose?.()
              navigate('/onboarding/wizard')
            }}
            className="shrink-0 px-4 py-2 text-body-xs font-bold shadow-level-1 cursor-pointer rounded-2xl"
          >
            <Icon name="edit" size={14} className="mr-1.5" />
            <span>{language === 'en' ? 'Change Program' : 'Ganti Prodi'}</span>
          </Button>
        </div>

        <div className="pt-3 border-t border-outline-variant/20 flex flex-wrap items-center justify-between text-label-caps text-on-surface-variant gap-2 font-medium">
          <span>Sistem Otomasi: Kalender Akademik (Kaldik)</span>
          <span className="text-primary font-bold">Terintegrasi Sinkron</span>
        </div>
      </div>
    </div>
  )
}
