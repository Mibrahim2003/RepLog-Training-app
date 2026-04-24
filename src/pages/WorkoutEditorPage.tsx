import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppShell, ExerciseBlockCard } from '../components'
import { useAppContext } from '../context/AppContext'
import type { EditorTarget } from '../types'
import { deriveWorkoutTitle, formatLongDate } from '../utils/format'

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
  const [isSaving, setIsSaving] = useState(false)
  const [customMuscleName, setCustomMuscleName] = useState('')

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
      const savedId = await saveWorkout(target, draft)
      setIsSaving(false)

      if (savedId) {
        navigate(`/workouts/${savedId}`)
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
            className="brutal-button brutal-button--primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : mode === 'new' ? 'Save Workout' : 'Save Changes'}
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
              onDeleteSet={(workoutExerciseId, setId) =>
                deleteSet(target, workoutExerciseId, setId)
              }
              onDeleteExercise={(workoutExerciseId) =>
                deleteExerciseBlock(target, workoutExerciseId)
              }
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
      </section>
    </AppShell>
  )
}
