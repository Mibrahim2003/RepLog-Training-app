import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components'
import { useAppContext } from '../context/AppContext'
import type { EditorTarget } from '../types'

export function ExerciseSearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { muscleGroups, createCustomExercise } = useAppContext()
  const [customName, setCustomName] = useState('')
  const [primaryMuscleGroupId, setPrimaryMuscleGroupId] = useState(muscleGroups[0]?.id ?? 'chest')

  const target: EditorTarget =
    searchParams.get('editor') === 'edit' && searchParams.get('workoutId')
      ? {
          kind: 'edit',
          workoutId: searchParams.get('workoutId') as string,
        }
      : { kind: 'new' }

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
        <div className="section-heading">
          <h1>Enter Exercise</h1>
        </div>

        <section className="section-stack">
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
              Enter Exercise
            </button>
          </div>
        </section>
      </section>
    </AppShell>
  )
}
