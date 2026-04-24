import type { DraftReference } from '../types'

interface DraftResumeDialogProps {
  drafts: DraftReference[]
  onResume: (draftRef: DraftReference) => void
  onDiscard: (draftRef: DraftReference) => void
}

export function DraftResumeDialog({
  drafts,
  onResume,
  onDiscard,
}: DraftResumeDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card brutal-card" role="dialog" aria-modal="true">
        <p className="eyebrow">Draft Recovery</p>
        <h2>Resume your draft?</h2>
        <p className="muted-copy">
          RepLog found in-progress workout data from this browser session.
        </p>

        <div className="modal-list">
          {drafts.map((draftRef) => (
            <div key={draftRef.key} className="modal-list__item">
              <div>
                <strong>{draftRef.label}</strong>
                <p>{new Date(draftRef.updatedAt).toLocaleString()}</p>
              </div>
              <div className="template-card__actions">
                <button
                  type="button"
                  className="brutal-button brutal-button--primary"
                  onClick={() => onResume(draftRef)}
                >
                  Resume
                </button>
                <button
                  type="button"
                  className="brutal-button brutal-button--secondary"
                  onClick={() => onDiscard(draftRef)}
                >
                  Discard
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
