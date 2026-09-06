import { Icon } from '../../Icon'
import { daysUntil } from '../../../lib/scheduleUtils'
import { PRIORITY_STRIPE, PRIORITY_LABEL, formatDeadline } from './taskUtils'

export function TaskCard({ task, onToggle, onDelete }) {
  const isPast = daysUntil(task.deadline) < 0 && !task.selesai
  const deadlineLabel = formatDeadline(task.deadline)

  return (
    <div
      className={`relative flex items-start gap-3 rounded-2xl border p-4 shadow-level-1 transition-all ${
        task.selesai
          ? 'border-outline-variant/20 bg-surface-container-low/40 opacity-75 dark:bg-surface-container-high/20'
          : isPast
          ? 'border-error/40 bg-error/5 dark:bg-error/10'
          : 'border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low hover:border-outline-variant/40'
      }`}
    >
      {/* Priority Stripe on Left */}
      <div
        className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${
          PRIORITY_STRIPE[task.prioritas] ?? 'bg-secondary'
        }`}
      />

      {/* Checkbox Button */}
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-all cursor-pointer ${
          task.selesai
            ? 'border-primary bg-primary text-on-primary shadow-level-1'
            : 'border-outline-variant bg-surface-container'
        }`}
      >
        {task.selesai && <Icon name="check" size={14} />}
      </button>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              {task.kodeMK && (
                <span className="font-mono text-label-caps font-extrabold text-primary bg-primary/10 border border-primary/20 px-2 py-0.2 rounded-md">
                  {task.kodeMK}
                </span>
              )}
              <span
                className={`rounded-md px-1.5 py-0.2 text-label-caps font-bold ${
                  task.isProdi
                    ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/25'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {task.isProdi ? 'Tugas Prodi' : 'Pribadi'}
              </span>
            </div>

            <h4
              className={`text-body-sm font-extrabold leading-snug truncate ${
                task.selesai ? 'line-through text-on-surface-variant' : 'text-on-surface'
              }`}
            >
              {task.judul}
            </h4>
          </div>

          {/* Deadline Badge */}
          <span
            className={`shrink-0 rounded-xl px-2.5 py-1 text-label-caps font-extrabold ${
              task.selesai
                ? 'bg-surface-container text-on-surface-variant'
                : isPast
                ? 'bg-error text-white'
                : task.prioritas === 'tinggi'
                ? 'bg-error/15 text-error border border-error/25'
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}
          >
            {deadlineLabel}
          </span>
        </div>

        {task.catatan && (
          <p className="text-label-caps text-on-surface-variant/90 leading-relaxed line-clamp-2 bg-surface-container-low/50 dark:bg-surface-container-high/40 p-2 rounded-xl border border-outline-variant/15 mt-1">
            {task.catatan}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between border-t border-outline-variant/15 pt-1.5">
          <span className="text-body-xs text-on-surface-variant font-medium">
            Prioritas: <strong className="text-on-surface">{PRIORITY_LABEL[task.prioritas] ?? task.prioritas}</strong>
            {task.dibuatOleh && <span className="opacity-70"> · {task.dibuatOleh}</span>}
          </span>
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
            aria-label="Hapus tugas"
          >
            <Icon name="delete" size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
