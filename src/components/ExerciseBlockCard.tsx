import { Link } from 'react-router-dom'
import type { ExerciseBlockVM, Unit } from '../types'
import { displayWeightFromSet } from '../utils/format'

interface ExerciseBlockCardProps {
  block: ExerciseBlockVM
  preferredUnit: Unit
  editable?: boolean
  historyHref?: string
  onExerciseNoteChange?: (workoutExerciseId: string, note: string) => void
  onSetChange?: (
    workoutExerciseId: string,
    setId: string,
    field: 'weightValue' | 'reps' | 'note',
    value: string,
  ) => void
  onAddSet?: (workoutExerciseId: string) => void
  onDuplicateLastSet?: (workoutExerciseId: string) => void
  onDeleteSet?: (workoutExerciseId: string, setId: string) => void
  onDeleteExercise?: (workoutExerciseId: string) => void
}

export function ExerciseBlockCard({
  block,
  preferredUnit,
  editable = false,
  historyHref,
  onExerciseNoteChange,
  onSetChange,
  onAddSet,
  onDuplicateLastSet,
  onDeleteSet,
  onDeleteExercise,
}: ExerciseBlockCardProps) {
  return (
    <article className="exercise-block brutal-card">
      <div className="exercise-block__header">
        <div>
          <h3>{block.name}</h3>
          {block.duplicateWarning ? (
            <p className="inline-warning">Duplicate exercise added. Keeping it as a separate block.</p>
          ) : null}
        </div>
        {editable ? (
          <button
            type="button"
            className="icon-button icon-button--small"
            aria-label={`Remove ${block.name}`}
            onClick={() => onDeleteExercise?.(block.workoutExerciseId)}
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        ) : historyHref ? (
          <Link to={historyHref} className="brutal-button brutal-button--secondary exercise-block__link">
            Stats
          </Link>
        ) : null}
      </div>

      {editable ? (
        <div className="exercise-note">
          <label htmlFor={`${block.workoutExerciseId}-note`}>Block note</label>
          <input
            id={`${block.workoutExerciseId}-note`}
            className="brutal-input"
            placeholder="Paused reps, left knee felt off..."
            value={block.note ?? ''}
            onChange={(event) =>
              onExerciseNoteChange?.(block.workoutExerciseId, event.target.value)
            }
          />
        </div>
      ) : block.note ? (
        <p className="exercise-note__display">{block.note}</p>
      ) : null}

      <div className="set-table">
        <div className="set-table__header">
          <span>Set</span>
          <span>{preferredUnit.toUpperCase()}</span>
          <span>Reps</span>
          <span>Note</span>
          <span>{editable ? 'Delete' : 'PR'}</span>
        </div>

        {block.sets.map((setRow) => (
          <div key={setRow.id} className="set-table__row">
            <span className="set-table__order">{setRow.orderIndex}</span>

            {editable ? (
              <input
                className="brutal-input brutal-input--data"
                type="number"
                value={displayWeightFromSet(setRow, preferredUnit)}
                placeholder="-"
                onChange={(event) =>
                  onSetChange?.(
                    block.workoutExerciseId,
                    setRow.id,
                    'weightValue',
                    event.target.value,
                  )
                }
              />
            ) : (
              <span className="data-cell">{displayWeightFromSet(setRow, preferredUnit) || '--'}</span>
            )}

            {editable ? (
              <input
                className="brutal-input brutal-input--data"
                type="number"
                value={setRow.reps ?? ''}
                placeholder="-"
                onChange={(event) =>
                  onSetChange?.(block.workoutExerciseId, setRow.id, 'reps', event.target.value)
                }
              />
            ) : (
              <span className="data-cell">{setRow.reps ?? '--'}</span>
            )}

            {editable ? (
              <input
                className="brutal-input brutal-input--note"
                value={setRow.note ?? ''}
                placeholder="Short note"
                onChange={(event) =>
                  onSetChange?.(block.workoutExerciseId, setRow.id, 'note', event.target.value)
                }
              />
            ) : (
              <span className="note-cell">{setRow.note || '—'}</span>
            )}

            {editable ? (
              <button
                type="button"
                className="icon-button icon-button--small"
                aria-label={`Delete set ${setRow.orderIndex}`}
                onClick={() => onDeleteSet?.(block.workoutExerciseId, setRow.id)}
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            ) : setRow.hasPR ? (
              <span className="mini-pr">PR</span>
            ) : (
              <span className="note-cell">—</span>
            )}
          </div>
        ))}
      </div>

      {editable ? (
        <div className="exercise-block__actions">
          <button
            type="button"
            className="brutal-button brutal-button--secondary"
            onClick={() => onDuplicateLastSet?.(block.workoutExerciseId)}
          >
            Duplicate Last Set
          </button>
          <button
            type="button"
            className="brutal-button brutal-button--secondary"
            onClick={() => onAddSet?.(block.workoutExerciseId)}
          >
            Add Set
          </button>
        </div>
      ) : null}
    </article>
  )
}
