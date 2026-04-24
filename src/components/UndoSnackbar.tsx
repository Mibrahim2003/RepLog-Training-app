interface UndoSnackbarProps {
  message: string
  onUndo: () => void
  onDismiss: () => void
}

export function UndoSnackbar({ message, onUndo, onDismiss }: UndoSnackbarProps) {
  return (
    <section className="undo-snackbar brutal-card" role="status" aria-live="polite">
      <p>{message}</p>
      <div className="undo-snackbar__actions">
        <button type="button" className="brutal-button brutal-button--secondary" onClick={onUndo}>
          Undo
        </button>
        <button type="button" className="brutal-button brutal-button--secondary" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </section>
  )
}
