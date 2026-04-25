import { useToast } from '../context/ToastContext'

export function ToastOverlay() {
  const { toast, dismissToast } = useToast()

  if (!toast) {
    return (
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true" />
    )
  }

  const variantClass =
    toast.variant === 'error'
      ? 'toast--error'
      : toast.variant === 'info'
        ? 'toast--info'
        : 'toast--success'

  return (
    <>
      {/* Screen-reader live region */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {toast.message}
      </div>

      {/* Visual toast */}
      <div className={`toast brutal-card ${variantClass}`} aria-hidden="true">
        <p>{toast.message}</p>
        <button
          type="button"
          className="toast__dismiss icon-button icon-button--small"
          onClick={dismissToast}
          aria-label="Dismiss notification"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </>
  )
}
