import { Icon } from '../../Icon'
import { EmptyState } from '../../EmptyState'

const CLASS_TYPE_META = {
  K1:   { label: 'Offline (K1)',    tone: 'bg-status-k1-bg text-status-k1 border-status-k1-border' },
  K2:   { label: 'Online (K2)',     tone: 'bg-status-k2-bg text-status-k2 border-status-k2-border' },
  HB:   { label: 'Hybrid (HB)',     tone: 'bg-status-hb-bg text-status-hb border-status-hb-border' },
  HBH:  { label: 'Hybrid (HBH)',    tone: 'bg-status-hb-bg text-status-hb border-status-hb-border' },
  HBD:  { label: 'Hybrid (HBD)',    tone: 'bg-status-hb-bg text-status-hb border-status-hb-border' },
  GBK1: { label: 'Gabungan (GBK1)', tone: 'bg-status-gbk-bg text-status-gbk border-status-gbk-border' },
  GBK2: { label: 'Gabungan (GBK2)', tone: 'bg-status-gbk-bg text-status-gbk border-status-gbk-border' },
}

export function DashboardAnalytics({ dayBreakdown, classTypeBreakdown }) {
  return (
    <section
      className="desktop:col-span-5 h-full flex flex-col justify-between gap-3 min-h-0 order-1 desktop:order-2"
      aria-label="Ringkasan Analitik Sistem"
    >
      {/* Panel 1: Sebaran Sesi per Hari */}
      <div className="rounded-2xl bg-surface-container-lowest p-3.5 tablet:p-4 dark:bg-surface-container-low border border-outline-variant/20 shadow-level-1 flex-1 flex flex-col justify-between min-h-0">
        <div>
          <div className="mb-2.5 flex items-center justify-between border-b border-outline-variant/15 pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs shrink-0">
                <Icon name="calendar_month" size={16} />
              </span>
              <h3 className="text-title-sm text-on-surface font-bold truncate">
                Sebaran Sesi per Hari
              </h3>
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
              Mingguan
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            {dayBreakdown.map((item) => (
              <div key={item.day} className="space-y-0.5">
                <div className="flex items-center justify-between text-label-caps font-semibold text-on-surface-variant">
                  <span>{item.day}</span>
                  <span className="font-bold text-on-surface">{item.count} sesi</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-container-high/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel 2: Komposisi Tipe Kelas */}
      <div className="rounded-2xl bg-surface-container-lowest p-3.5 tablet:p-4 dark:bg-surface-container-low border border-outline-variant/20 shadow-level-1 flex-1 flex flex-col justify-between min-h-0">
        <div>
          <div className="mb-2.5 flex items-center justify-between border-b border-outline-variant/15 pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs shrink-0">
                <Icon name="pie_chart" size={16} />
              </span>
              <h3 className="text-title-sm text-on-surface font-bold truncate">
                Komposisi Tipe Kelas
              </h3>
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
              Format
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            {classTypeBreakdown.length === 0 ? (
              <EmptyState
                icon="menu_book"
                title="Belum ada kelas"
                description="Tambah kelas untuk melihat komposisi tipe."
              />
            ) : (
              classTypeBreakdown.slice(0, 4).map((item) => {
                const meta = CLASS_TYPE_META[item.key] || {
                  label: item.key,
                  tone: 'bg-status-sys-bg text-status-sys border-status-sys-border',
                }
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 px-2.5 py-1.5 dark:bg-surface-container-high/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${meta.tone}`}
                      >
                        {item.key}
                      </span>
                      <span className="text-label-caps font-semibold text-on-surface-variant truncate">
                        {meta.label}
                      </span>
                    </div>
                    <span className="shrink-0 text-body-xs font-bold text-on-surface">
                      {item.count}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
