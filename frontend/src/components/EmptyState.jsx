import { Icon } from './Icon'
import { Button } from './Button'

export function EmptyState({ title, description, icon = 'inbox', actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center px-md py-xl text-center">
      <div className="mb-md flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
        <Icon name={icon} size={32} className="text-primary" />
      </div>
      <h2 className="text-title-md text-on-surface">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-sm text-body-lg text-on-surface-variant">{description}</p>
      ) : null}
      {actionLabel ? (
        <Button className="mt-md" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
