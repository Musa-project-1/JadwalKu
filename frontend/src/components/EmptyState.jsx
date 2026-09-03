import { Icon } from './Icon'
import { Button } from './Button'

export function EmptyState({ title, description, icon = 'inbox', actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 tablet:p-10 text-center rounded-3xl border border-dashed border-outline-variant/35 bg-surface-container-low/25 dark:bg-surface-container-high/10 max-w-lg mx-auto w-full my-4">
      <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high/60 text-primary border border-outline-variant/25 shadow-level-1">
        <Icon name={icon} size={28} />
      </div>
      <h3 className="text-title-sm tablet:text-title-md font-bold tracking-tight text-on-surface">
        {title}
      </h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-body-xs text-on-surface-variant/85 leading-relaxed">
          {description}
        </p>
      ) : null}
      {actionLabel ? (
        <Button className="mt-4 rounded-full px-5 py-2 text-body-xs font-bold shadow-level-1 cursor-pointer" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
