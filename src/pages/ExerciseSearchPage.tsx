import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components'
import { useAppContext } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import type { EditorTarget, ExerciseDefinition } from '../types'

function scoreExerciseMatch(exercise: ExerciseDefinition, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return 1
  }

  const name = exercise.name.toLowerCase()
  if (name.startsWith(normalized)) {
    return 4
  }

  if (name.includes(` ${normalized}`)) {
    return 3
  }

  if (name.includes(normalized)) {
    return 2
  }

  return 0
}

export function ExerciseSearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { muscleGroups, exercises, addExerciseToDraft, createCustomExercise, getDraft } = useAppContext()
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [customName, setCustomName] = useState('')
  const [primaryMuscleGroupId, setPrimaryMuscleGroupId] = useState('')

  const target: EditorTarget =
    searchParams.get('editor') === 'edit' && searchParams.get('workoutId')
      ? {
          kind: 'edit',
          workoutId: searchParams.get('workoutId') as string,
        }
      : { kind: 'new' }

  const draft = getDraft(target)

  const selectedIds = draft?.muscleGroupIds ?? []
  const selectedMuscleGroups =
    selectedIds.length === 0
      ? muscleGroups
      : muscleGroups.filter((group) => selectedIds.includes(group.id))

  const selectedMuscleIds = new Set(selectedMuscleGroups.map((group) => group.id))
  const inScope = exercises.filter((exercise) => {
    if (selectedMuscleIds.size === 0) {
      return true
    }

    return (
      selectedMuscleIds.has(exercise.primaryMuscleGroupId) ||
      exercise.secondaryMuscleGroupIds.some((muscleId) => selectedMuscleIds.has(muscleId))
    )
  })

  const recommendedExercises = inScope
    .map((exercise) => ({
      exercise,
      score: scoreExerciseMatch(exercise, searchQuery),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return left.exercise.name.localeCompare(right.exercise.name)
    })
    .slice(0, 10)
    .map((item) => item.exercise)

  const isSingleSelected = selectedMuscleGroups.length === 1

  const effectivePrimaryMuscleGroupId = selectedMuscleGroups.some(
    (group) => group.id === primaryMuscleGroupId,
  )
    ? primaryMuscleGroupId
    : (selectedMuscleGroups[0]?.id ?? '')

  const handlePickExercise = (exerciseId: string) => {
    addExerciseToDraft(target, exerciseId)
    showToast('Exercise added')
    navigate(target.kind === 'new' ? '/workouts/new?step=log' : `/workouts/${target.workoutId}/edit`)
  }

  const handleCreateCustom = () => {
    void (async () => {
      if (!customName.trim()) {
        return
      }

      if (!effectivePrimaryMuscleGroupId) {
        return
      }

      try {
        await createCustomExercise({
          name: customName,
          primaryMuscleGroupId: effectivePrimaryMuscleGroupId,
          target,
        })
        showToast('Exercise created')
        navigate(target.kind === 'new' ? '/workouts/new?step=log' : `/workouts/${target.workoutId}/edit`)
      } catch {
        showToast("Couldn't create exercise — retry", 'error')
      }
    })()
  }

  return (
    <AppShell activeTab="log">
      <section className="page-stack">
        <div className="section-heading">
          <h1>Exercise Search</h1>
        </div>

        <section className="search-panel brutal-card">
          <div className="setup-field-row exercise-search">
            <label className="field-label" htmlFor="exercise-query">
              Search Exercise
            </label>
            <input
              id="exercise-query"
              className="brutal-input"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Start typing like: row, curl, pulldown..."
              autoComplete="off"
              role="combobox"
              aria-expanded="true"
              aria-controls="exercise-suggestions"
            />

            <div className="tag-row">
              {selectedMuscleGroups.map((group) => (
                <span key={group.id} className="tag">
                  [{group.name}]
                </span>
              ))}
            </div>

            <div id="exercise-suggestions" className="result-list exercise-suggestions" role="listbox">
              {recommendedExercises.length === 0 ? (
                <div className="chart-empty">No matching exercises for these muscle groups yet.</div>
              ) : (
                recommendedExercises.map((exercise) => {
                  const primary = muscleGroups.find(
                    (group) => group.id === exercise.primaryMuscleGroupId,
                  )?.name
                  return (
                    <button
                      key={exercise.id}
                      type="button"
                      className="result-row"
                      onClick={() => handlePickExercise(exercise.id)}
                      role="option"
                    >
                      <div>
                        <div className="result-row__name">{exercise.name}</div>
                        <p className="muted-copy">{primary ? `[${primary}]` : '[Custom]'}</p>
                      </div>
                      <span className="material-symbols-outlined">north_west</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </section>

        <section className="section-stack">
          <div className="section-heading">
            <h2>Create Custom Exercise</h2>
          </div>
          <div className="brutal-card create-custom-card">
            <div className="setup-field-row">
              <label className="field-label" htmlFor="custom-exercise-name">
                Exercise Name
              </label>
              <input
                id="custom-exercise-name"
                className="brutal-input"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="Hammer curls"
              />
            </div>

            {!isSingleSelected ? (
              <div className="setup-field-row">
                <label className="field-label" htmlFor="primary-muscle">
                  Primary Muscle Group
                </label>
                <select
                  id="primary-muscle"
                  className="brutal-input"
                  value={effectivePrimaryMuscleGroupId}
                  onChange={(event) => setPrimaryMuscleGroupId(event.target.value)}
                >
                  {selectedMuscleGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <button
              type="button"
              className="brutal-button brutal-button--primary brutal-button--full"
              onClick={handleCreateCustom}
            >
              Create + Add Exercise
            </button>
          </div>
        </section>
      </section>
    </AppShell>
  )
}
