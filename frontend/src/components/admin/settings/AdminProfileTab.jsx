import { Icon } from '../../Icon'

export function AdminProfileTab({
  user,
  signOutAdmin,
  language,
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-title-sm font-bold text-on-surface">
          {language === 'en' ? 'Administrator Account' : 'Akun Administrator'}
        </h3>
        <p className="text-body-xs text-on-surface-variant mt-0.5">
          {language === 'en' ? 'Information about the authenticated administrator session' : 'Informasi tentang sesi admin yang sedang aktif'}
        </p>
      </div>

      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <Icon name="admin_panel_settings" size={32} />
          </div>
          <div className="min-w-0">
            <p className="text-title-sm font-bold text-on-surface truncate">
              {user?.email || 'admin@kampus.ac.id'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-label-caps font-bold">
                Active Admin
              </span>
              <span className="text-body-xs text-on-surface-variant">
                Firebase Auth
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-outline-variant/20 pt-4 flex items-center justify-between">
          <div>
            <span className="text-body-xs font-semibold text-on-surface">Sesi Login</span>
            <p className="text-[11.5px] text-on-surface-variant">Keluar dari mode admin dan kembali ke beranda mahasiswa</p>
          </div>
          <button
            type="button"
            onClick={signOutAdmin}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-error/10 hover:bg-error/20 text-error text-body-xs font-bold transition-all cursor-pointer"
          >
            <Icon name="logout" size={16} />
            <span>Keluar Akun Admin</span>
          </button>
        </div>
      </div>
    </div>
  )
}
