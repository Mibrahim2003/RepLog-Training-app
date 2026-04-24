import { useDeferredValue, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components'
import { useAppContext } from '../context/AppContext'
import type { EditorTarget } from '../types'
import { sortWorkoutsByDate } from '../utils/format'

export function ExerciseSearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { exercises, workouts, muscleGroups, addExerciseToDraft, createCustomExercise } =
    useAppContext()
  const [query, setQuery] = useState('')
  const [showCreator, setShowCreator] = useState(false)
  const [customName, setCustomName] = useState('')
  const [primaryMuscleGroupId, setPrimaryMuscleGroupId] = useState(muscleGroups[0]?.id ?? 'chest')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const target: EditorTarget =
    searchParams.get('editor') === 'edit' && searchParams.get('workoutId')
      ? {
          kind: 'edit',
          workoutId: searchParams.get('workoutId') as string,
        }
      : { kind: 'new' }

  const filteredExercises = useMemo(() => {
    if (!deferredQuery) {
      return exercises
    }

    return exercises.filter((exercise) => exercise.name.toLowerCase().includes(deferredQuery))
  }, [deferredQuery, exercises])

  const recentExerciseIds = useMemo(() => {
    return sortWorkoutsByDate(workouts)
      .flatMap((workout) => workout.exerciseBlocks.map((block) => block.exerciseId))
      .filter((exerciseId, index, array) => array.indexOf(exerciseId) === index)
      .slice(0, 6)
  }, [workouts])

  const grouped = useMemo(() => {
    const recent = filteredExercises.filter((exercise) => recentExerciseIds.includes(exercise.id))
    const system = filteredExercises.filter(
      (exercise) => exercise.source === 'system' && !recentExerciseIds.includes(exercise.id),
    )
    const custom = filteredExercises.filter((exercise) => exercise.source === 'custom')
    return { recent, system, custom }
  }, [filteredExercises, recentExerciseIds])

  const handleSelect = (exerciseId: string) => {
    addExerciseToDraft(target, exerciseId)
    navigate(target.kind === 'new' ? '/workouts/new?step=log' : `/workouts/${target.workoutId}/edit`)
  }

  const handleCreateCustom = () => {
    void (async () => {
      if (!customName.trim()) {
        return
      }

      await createCustomExercise({
        name: customName,
        primaryMuscleGroupId,
        target,
      })
      navigate(target.kind === 'new' ? '/workouts/new?step=log' : `/workouts/${target.workoutId}/edit`)
    })()
  }

  return (
    <AppShell activeTab="log">
      <section className="page-stack">
        <div className="search-panel brutal-card">
          <label className="field-label" htmlFor="exercise-search">
            Search Exercises
          </label>
          <input
            id="exercise-search"
            className="brutal-input"
            placeholder="Bench press, row, fly..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {([
          ['Recents', grouped.recent],
          ['System', grouped.system],
          ['Custom', grouped.custom],
        ] as const).map(([label, list]) => (
          <section key={label} className="section-stack">
            <div className="section-heading">
              <h2>{label}</h2>
            </div>

            <div className="result-list brutal-card">
              {list.length === 0 ? (
                <p className="muted-copy">No matches in {label.toLowerCase()} yet.</p>
              ) : (
                list.map((exercise) => {
                  const muscleName = muscleGroups.find(
                    (group) => group.id === exercise.primaryMuscleGroupId,
                  )?.name

                  return (
                    <button
                      key={exercise.id}
                      type="button"
                      className="result-row"
                      onClick={() => handleSelect(exercise.id)}
                    >
                      <span className="result-row__name">{exercise.name}</span>
                      <span className="tag">[{muscleName}]</span>
                    </button>
                  )
                })
              )}
            </div>
          </section>
        ))}

        <section className="section-stack">
          <button
            type="button"
            className="brutal-button brutal-button--secondary brutal-button--full"
            onClick={() => setShowCreator((previous) => !previous)}
          >
            Create Custom Exercise
          </button>

          {showCreator ? (
            <div className="brutal-card create-custom-card">
              <div className="setup-field-row">
                <label className="field-label" htmlFor="custom-exercise-name">
                  Name
                </label>
                <input
                  id="custom-exercise-name"
                  className="brutal-input"
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  placeholder="Paused dumbbell press"
                />
              </div>

              <div className="setup-field-row">
                <label className="field-label" htmlFor="primary-muscle">
                  Primary Muscle Group
                </label>
                <select
                  id="primary-muscle"
                  className="brutal-input"
                  value={primaryMuscleGroupId}
                  onChange={(event) => setPrimaryMuscleGroupId(event.target.value)}
                >
                  {muscleGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="brutal-button brutal-button--primary brutal-button--full"
                onClick={handleCreateCustom}
              >
                Add Custom Exercise
              </button>
            </div>
          ) : null}
        </section>
      </section>
    </AppShell>
  )
}
