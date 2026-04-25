import { useEffect, useRef } from 'react'

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
  const dialogRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement

    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusableElements && focusableElements.length > 0) {
      // Focus the secondary button (cancel) by default to prevent accidental deletion
      const defaultButton = Array.from(focusableElements).find(el => el.textContent === cancelLabel)
      if (defaultButton) {
        defaultButton.focus()
      } else {
        focusableElements[0].focus()
      }
    } else {
      dialogRef.current?.focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
        return
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const elements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (elements.length === 0) return

        const firstElement = elements[0]
        const lastElement = elements[elements.length - 1]

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            event.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            event.preventDefault()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [onCancel, cancelLabel])

  return (
    <div className="modal-backdrop" role="presentation">
      <section 
        className="modal-card brutal-card" 
        role="dialog" 
        aria-modal="true"
        ref={dialogRef}
        tabIndex={-1}
      >
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
