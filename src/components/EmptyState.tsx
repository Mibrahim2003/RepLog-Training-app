import { Link } from 'react-router-dom'

interface EmptyStateProps {
  title: string
  message: string
  actionLabel: string
  actionTo: string
}

export function EmptyState({
  title,
  message,
  actionLabel,
  actionTo,
}: EmptyStateProps) {
  return (
    <section className="empty-state brutal-card">
      <p className="eyebrow">Nothing Here Yet</p>
      <h2>{title}</h2>
      <p>{message}</p>
      <Link to={actionTo} className="brutal-button brutal-button--primary">
        {actionLabel}
      </Link>
    </section>
  )
}
