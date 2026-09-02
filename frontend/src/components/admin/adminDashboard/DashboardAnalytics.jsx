import { Icon } from '../../Icon'
import { EmptyState } from '../../EmptyState'

// CLASS_TYPE_META sekarang pakai token status-kelas — dark-mode aware
const CLASS_TYPE_META = {
  K1:   { label: 'Offline (K1)',    tone: 'bg-status-k1-bg text-status-k1 border-status-k1-border' },
  K2:   { label: 'Online (K2)',     tone: 'bg-status-k2-bg text-status-k2 border-status-k2-border' },
  HB:   { label: 'Hybrid (HB)',     tone: 'bg-status-hb-bg text-status-hb border-status-hb-border' },
  HBH:  { label: 'Hybrid (HBH)',    tone: 'bg-status-hb-bg text-status-hb border-status-hb-border' },
  HBD:  { label: 'Hybrid (HBD)',    tone: 'bg-status-hb-bg text-status-hb border-status-hb-border' },
  GBK1: { label: 'Gabungan (GBK1)', tone: 'bg-status-gbk-bg text-status-gbk border-status-gbk-border' },
  GBK2: { label: 'Gabungan (GBK2)', tone: 'bg-status-gbk-bg text-status-gbk border-status-gbk-border' },
}

export function DashboardAnalytics({ dayBreakdown, classTypeBreakdown, prodiBreakdown }) {
  return (
    <section
      className="shrink-0 grid grid-cols-1 desktop:grid-cols-3 gap-3.5 tablet:gap-4 items-stretch"
      aria-label="Dashboard Analitik"
    >
      {/* Panel 1: Sebaran Sesi per Hari */}
      <div className="rounded-2xl bg-surface-container-lowest p-4 tablet:p-5 dark:bg-surface-container-low border border-outline-variant/20 shadow-level-1 flex flex-col">
        <div className="mb-3.5 flex items-center gap-2.5 border-b border-outline-variant/15 pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-level-1">
            <Icon name="calendar_month" size={18} />
          </span>
          <h3 className="text-title-sm text-on-surface font-bold">
            Sebaran Sesi per Hari
          </h3>
        </div>
        <div className="flex-1 space-y-2.5">
          {dayBreakdown.map((item) => (
            <div key={item.day} className="space-y-1">
              <div className="flex items-center justify-between text-body-xs font-semibold text-on-surface-variant">
                <span>{item.day}</span>
                <span className="font-bold text-on-surface">{item.count} sesi</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-container-high/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel 2: Komposisi Tipe Kelas */}
      <div className="rounded-2xl bg-surface-container-lowest p-4 tablet:p-5 dark:bg-surface-container-low border border-outline-variant/20 shadow-level-1 flex flex-col">
        <div className="mb-3.5 flex items-center gap-2.5 border-b border-outline-variant/15 pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-level-1">
            <Icon name="menu_book" size={18} />
          </span>
          <h3 className="text-title-sm text-on-surface font-bold">
            Komposisi Tipe Kelas
          </h3>
        </div>
        <div className="flex-1 space-y-2">
          {classTypeBreakdown.length === 0 ? (
            <EmptyState
              icon="menu_book"
              title="Belum ada kelas"
              description="Tambah kelas untuk melihat komposisi tipe."
            />
          ) : (
            classTypeBreakdown.map((item) => {
              const meta = CLASS_TYPE_META[item.key] || {
                label: item.key,
                tone: 'bg-status-sys-bg text-status-sys border-status-sys-border',
              }
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-2.5 tablet:p-3 dark:bg-surface-container-high/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-label-caps font-bold border ${meta.tone}`}
                    >
                      {item.key}
                    </span>
                    <span className="text-body-xs font-semibold text-on-surface-variant truncate">
                      {meta.label}
                    </span>
                  </div>
                  <span className="shrink-0 text-body-sm font-bold text-on-surface">
                    {item.count}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Panel 3: Ringkasan Prodi */}
      <div className="rounded-2xl bg-surface-container-lowest p-4 tablet:p-5 dark:bg-surface-container-low border border-outline-variant/20 shadow-level-1 flex flex-col">
        <div className="mb-3.5 flex items-center gap-2.5 border-b border-outline-variant/15 pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-level-1">
            <Icon name="school" size={18} />
          </span>
          <h3 className="text-title-sm text-on-surface font-bold">
            Ringkasan Prodi
          </h3>
        </div>
        <div className="flex-1 space-y-2">
          {prodiBreakdown.length === 0 ? (
            <EmptyState
              icon="school"
              title="Belum ada prodi"
              description="Sinkronkan atau tambah program studi."
            />
          ) : (
            <div className="space-y-2">
              {prodiBreakdown.slice(0, 6).map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-2.5 tablet:p-3 dark:bg-surface-container-high/30"
                >
                  <div className="min-w-0">
                    <p className="text-body-xs font-bold text-on-surface truncate">{p.name}</p>
                    <p className="text-label-caps text-on-surface-variant font-medium mt-0.5">
                      {p.mkCount} MK · {p.sessionCount} sesi
                    </p>
                  </div>
                  <span className="shrink-0 text-body-sm font-bold text-primary">
                    {p.sessionCount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
