import { Link } from 'react-router-dom'

interface SecondaryAction {
  label: string
  to: string
}

interface EmptyStateProps {
  title: string
  message: string
  actionLabel: string
  actionTo: string
  secondaryActions?: SecondaryAction[]
}

export function EmptyState({
  title,
  message,
  actionLabel,
  actionTo,
  secondaryActions,
}: EmptyStateProps) {
  return (
    <section className="empty-state brutal-card">
      <p className="eyebrow">Nothing Here Yet</p>
      <h2>{title}</h2>
      <p>{message}</p>
      <Link to={actionTo} className="brutal-button brutal-button--primary">
        {actionLabel}
      </Link>
      {secondaryActions && secondaryActions.length > 0 ? (
        <div className="empty-state__secondary">
          {secondaryActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="brutal-button brutal-button--secondary"
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  )
}
