import { Icon } from '../../Icon'

export function SettingsAboutTab({
  language,
  setShowDocsModal,
  onClose,
  navigate,
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-title-sm font-bold text-on-surface">
          {language === 'en' ? 'Guides, FAQ & Documentation' : 'Panduan & Bantuan'}
        </h3>
        <p className="text-body-xs text-on-surface-variant mt-0.5">
          {language === 'en'
            ? 'Learn all features, class color schemes, and frequently asked questions'
            : 'Pelajari panduan 13 fitur mahasiswa, keterangan warna, dan tanya jawab'}
        </p>
      </div>

      <div className="grid grid-cols-1 tablet:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setShowDocsModal(true)}
          className="flex flex-col items-start p-3.5 rounded-2xl border border-primary/25 bg-primary/10 hover:bg-primary/15 transition-all text-left cursor-pointer shadow-2xs group"
        >
          <Icon name="menu_book" size={22} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-body-sm text-on-surface">
            {language === 'en' ? 'Feature Tutorials' : 'Pusat Tutorial Fitur'}
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5">
            {language === 'en' ? 'Open 13 feature guides' : 'Buka panduan 13 fitur'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose?.()
            navigate('/riwayat')
          }}
          className="flex flex-col items-start p-3.5 rounded-2xl border border-outline-variant/25 bg-surface-container-low/50 hover:bg-surface-container transition-all text-left cursor-pointer shadow-2xs group"
        >
          <Icon name="history" size={22} className="text-secondary mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-body-sm text-on-surface">
            {language === 'en' ? 'Change History' : 'Riwayat Perubahan'}
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5">
            {language === 'en' ? 'Admin schedule update logs' : 'Log update admin'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose?.()
            navigate('/tentang')
          }}
          className="flex flex-col items-start p-3.5 rounded-2xl border border-outline-variant/25 bg-surface-container-low/50 hover:bg-surface-container transition-all text-left cursor-pointer shadow-2xs group"
        >
          <Icon name="help_outline" size={22} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-body-sm text-on-surface">
            {language === 'en' ? 'About & FAQ' : 'Tentang & FAQ'}
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5">
            {language === 'en' ? 'Info & QnA' : 'Info & tanya jawab'}
          </span>
        </button>
      </div>

      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-4 space-y-3 shadow-2xs">
        <h4 className="text-body-sm font-bold text-on-surface flex items-center gap-2">
          <Icon name="palette" size={17} className="text-primary" />
          <span>{language === 'en' ? 'Class Card Color Legend' : 'Keterangan Warna Kartu Kelas'}</span>
        </h4>
        <div className="grid grid-cols-2 tablet:grid-cols-4 gap-2 text-label-caps">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>K1 / Kuliah Teori</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 font-bold">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span>K2 / Online (Zoom)</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-800 dark:text-violet-300 font-bold">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            <span>HBH / Hybrid</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>GBK / Gabungan</span>
          </div>
        </div>
      </div>
    </div>
  )
}
