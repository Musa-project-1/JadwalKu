import { Icon } from '../../Icon'
import { Button } from '../../Button'
import { deriveTahunAjaran } from '../../../lib/publishHelpers'

export function DashboardHeader({
  onOpenDocs,
}) {
  return (
    <header className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-3 tablet:px-4 tablet:py-3 shadow-xs flex flex-col gap-3.5 tablet:flex-row tablet:items-center tablet:justify-between w-full shrink-0">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
          <Icon name="dashboard" size={24} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl tablet:text-2xl font-bold tracking-tight text-on-surface">
              Dashboard Admin
            </h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-bold border border-primary/20">
              Konsol Utama
            </span>
          </div>
          <p className="mt-0.5 text-body-xs text-on-surface-variant font-medium truncate">
            Pusat kendali jadwal perkuliahan, kurikulum & ujian kampus
          </p>
        </div>
      </div>

      {/* System Status Badges & Admin Docs */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap tablet:flex-nowrap">
        <Button
          variant="secondary"
          onClick={onOpenDocs}
          className="rounded-full px-3.5 py-1.5 font-bold shadow-2xs cursor-pointer text-body-xs shrink-0"
          title="Buka Pusat Panduan & Tutorial Administrator"
        >
          <Icon name="menu_book" size={16} className="mr-1 text-primary" />
          <span>Panduan Admin</span>
        </Button>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 text-[11.5px] font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Sync</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11.5px] font-bold text-primary font-mono shadow-2xs">
          TA {deriveTahunAjaran()}
        </span>
      </div>
    </header>
  )
}
