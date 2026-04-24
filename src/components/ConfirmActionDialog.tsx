interface ConfirmActionDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmActionDialog({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmActionDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card brutal-card" role="dialog" aria-modal="true">
        <p className="eyebrow">Confirm Action</p>
        <h2>{title}</h2>
        <p className="muted-copy">{message}</p>

        <div className="template-card__actions">
          <button type="button" className="brutal-button brutal-button--secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="brutal-button brutal-button--primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
