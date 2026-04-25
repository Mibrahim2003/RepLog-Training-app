import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components'
import { useAppContext } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import type { EditorTarget } from '../types'

export function ExerciseSearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { muscleGroups, createCustomExercise, getDraft } = useAppContext()
  const { showToast } = useToast()
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

  const selectedMuscleGroups = useMemo(() => {
    const selectedIds = draft?.muscleGroupIds ?? []
    if (selectedIds.length === 0) {
      return muscleGroups
    }

    return muscleGroups.filter((group) => selectedIds.includes(group.id))
  }, [draft?.muscleGroupIds, muscleGroups])

  const isSingleSelected = selectedMuscleGroups.length === 1

  const effectivePrimaryMuscleGroupId = selectedMuscleGroups.some(
    (group) => group.id === primaryMuscleGroupId,
  )
    ? primaryMuscleGroupId
    : (selectedMuscleGroups[0]?.id ?? '')

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
              Enter Exercise
            </button>
          </div>
        </section>
      </section>
    </AppShell>
  )
}
