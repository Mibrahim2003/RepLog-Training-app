import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppShell, ExerciseBlockCard, UndoSnackbar } from '../components'
import { useAppContext } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import type { EditorTarget, WorkoutDraft } from '../types'
import { deriveWorkoutTitle, formatLongDate } from '../utils/format'
import { saveDeletionBackup } from '../utils/backups'

interface WorkoutEditorPageProps {
  mode: 'new' | 'edit'
}

export function WorkoutEditorPage({ mode }: WorkoutEditorPageProps) {
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const {
    muscleGroups,
    profile,
    ensureNewDraft,
    ensureEditDraft,
    getDraft,
    replaceDraft,
    updateDraftMeta,
    addMuscleGroup,
    toggleMuscleGroup,
    updateExerciseNote,
    updateSetField,
    addSet,
    duplicateLastSet,
    deleteSet,
    deleteExerciseBlock,
    saveWorkout,
  } = useAppContext()
  const { showToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [customMuscleName, setCustomMuscleName] = useState('')
  const [undoState, setUndoState] = useState<{ message: string; snapshot: WorkoutDraft } | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const target = useMemo<EditorTarget>(() => {
    if (mode === 'edit' && params.id) {
      return { kind: 'edit', workoutId: params.id }
    }

    return { kind: 'new' }
  }, [mode, params.id])

  useEffect(() => {
    if (mode === 'new') {
      ensureNewDraft()
      return
    }

    if (params.id) {
      ensureEditDraft(params.id)
    }
  }, [ensureEditDraft, ensureNewDraft, mode, params.id])

  const draft = getDraft(target)
  const isLogStep = mode === 'edit' || searchParams.get('step') === 'log'

  const queueUndo = (message: string, snapshot: WorkoutDraft) => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
    }

    setUndoState({ message, snapshot })
    undoTimerRef.current = setTimeout(() => {
      setUndoState(null)
      undoTimerRef.current = null
    }, 7000)
  }

  const clearUndo = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }
    setUndoState(null)
  }

  const cloneDraft = (value: WorkoutDraft) => JSON.parse(JSON.stringify(value)) as WorkoutDraft

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current)
      }
    }
  }, [])

  if (!draft) {
    return (
      <AppShell activeTab="log">
        <section className="page-stack">
          <div className="empty-state brutal-card">
            <h2>Loading workout…</h2>
          </div>
        </section>
      </AppShell>
    )
  }

  const openExerciseSearch = () => {
    const href =
      target.kind === 'new'
        ? '/exercise-search?editor=new'
        : `/exercise-search?editor=edit&workoutId=${target.workoutId}`

    navigate(href)
  }

  const handleAddMuscleGroup = () => {
    const groupId = addMuscleGroup(customMuscleName)
    if (!groupId) {
      return
    }

    toggleMuscleGroup(target, groupId)
    setCustomMuscleName('')
  }

  const handleSave = () => {
    void (async () => {
      setIsSaving(true)
      setSaveError(false)
      try {
        const savedId = await saveWorkout(target, draft!)
        if (savedId) {
          showToast('Workout saved')
          navigate(`/workouts/${savedId}`)
        }
      } catch {
        setSaveError(true)
        showToast("Couldn't save — retry", 'error')
      } finally {
        setIsSaving(false)
      }
    })()
  }

  if (!isLogStep) {
    return (
      <AppShell activeTab="log">
        <section className="page-stack">
          <div className="section-heading">
            <h1>New Workout</h1>
          </div>

          <section className="setup-card brutal-card">
            <div className="setup-field-row">
              <label className="field-label" htmlFor="workout-date">
                Date
              </label>
              <input
                id="workout-date"
                type="date"
                className="brutal-input"
                value={draft.workoutDate}
                onChange={(event) =>
                  updateDraftMeta(target, {
                    workoutDate: event.target.value,
                  })
                }
              />
            </div>
          </section>

          <section className="section-stack">
            <div className="section-heading">
              <h2>Select Muscle Groups</h2>
            </div>

            <div className="muscle-grid">
              {muscleGroups.map((group) => {
                const selected = draft.muscleGroupIds.includes(group.id)
                return (
                  <button
                    key={group.id}
                    type="button"
                    className={`muscle-chip${selected ? ' muscle-chip--selected' : ''}`}
                    onClick={() => toggleMuscleGroup(target, group.id)}
                  >
                    {group.name}
                  </button>
                )
              })}
            </div>

            <div className="muscle-add-row">
              <input
                className="brutal-input"
                placeholder="Add custom muscle group"
                value={customMuscleName}
                onChange={(event) => setCustomMuscleName(event.target.value)}
              />
              <button
                type="button"
                className="brutal-button brutal-button--secondary"
                onClick={handleAddMuscleGroup}
              >
                + Add
              </button>
            </div>
          </section>

          <button
            type="button"
            className="brutal-button brutal-button--primary brutal-button--full sticky-action"
            onClick={() => navigate('/exercise-search?editor=new')}
          >
            Log Exercise
          </button>
        </section>
      </AppShell>
    )
  }

  return (
    <AppShell activeTab="log">
      <section className="page-stack page-stack--editor">
        <div className="tag-row">
          {draft.muscleGroupIds.map((muscleId) => {
            const muscleName = muscleGroups.find((group) => group.id === muscleId)?.name
            return muscleName ? (
              <span key={muscleId} className="tag">
                [{muscleName}]
              </span>
            ) : null
          })}
        </div>

        <section className="editor-banner brutal-card">
          <div>
            <p className="eyebrow">{mode === 'new' ? 'Workout in Progress' : 'Editing Workout'}</p>
            <h1>{deriveWorkoutTitle(draft, muscleGroups)}</h1>
            <p>
              {formatLongDate(draft.workoutDate)}
            </p>
          </div>

          <button
            type="button"
            className={`brutal-button ${saveError ? 'brutal-button--error' : 'brutal-button--primary'}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : saveError ? 'Retry Save' : mode === 'new' ? 'Save Workout' : 'Save Changes'}
          </button>
        </section>

        <div className="card-stack">
          {draft.exerciseBlocks.map((block) => (
            <ExerciseBlockCard
              key={block.workoutExerciseId}
              block={block}
              preferredUnit={profile.preferredUnit}
              editable
              onExerciseNoteChange={(workoutExerciseId, note) =>
                updateExerciseNote(target, workoutExerciseId, note)
              }
              onSetChange={(workoutExerciseId, setId, field, value) =>
                updateSetField(target, workoutExerciseId, setId, field, value)
              }
              onAddSet={(workoutExerciseId) => addSet(target, workoutExerciseId)}
              onDuplicateLastSet={(workoutExerciseId) =>
                duplicateLastSet(target, workoutExerciseId)
              }
              onDeleteSet={(workoutExerciseId, setId) => {
                const snapshot = cloneDraft(draft)
                saveDeletionBackup('set', {
                  target,
                  workoutExerciseId,
                  setId,
                  snapshot,
                })

                deleteSet(target, workoutExerciseId, setId)
                queueUndo('Set deleted.', snapshot)
              }}
              onDeleteExercise={(workoutExerciseId) => {
                const snapshot = cloneDraft(draft)
                saveDeletionBackup('exercise', {
                  target,
                  workoutExerciseId,
                  snapshot,
                })

                deleteExerciseBlock(target, workoutExerciseId)
                queueUndo('Exercise block deleted.', snapshot)
              }}
            />
          ))}
        </div>

        <button
          type="button"
          className="fab-add brutal-button brutal-button--primary"
          onClick={openExerciseSearch}
        >
          + Exercise
        </button>

        {undoState ? (
          <UndoSnackbar
            message={undoState.message}
            onUndo={() => {
              replaceDraft(target, undoState.snapshot)
              clearUndo()
            }}
            onDismiss={clearUndo}
          />
        ) : null}
      </section>
    </AppShell>
  )
}
