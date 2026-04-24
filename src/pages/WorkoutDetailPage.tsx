import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell, ExerciseBlockCard } from '../components'
import { useAppContext } from '../context/AppContext'
import { formatLongDate } from '../utils/format'

export function WorkoutDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const { getWorkout, muscleGroups, profile, deleteWorkout } = useAppContext()
  const workout = params.id ? getWorkout(params.id) : null

  const muscleNames = useMemo(
    () =>
      workout?.muscleGroupIds
        .map((muscleId) => muscleGroups.find((group) => group.id === muscleId)?.name)
        .filter(Boolean) as string[],
    [muscleGroups, workout],
  )

  if (!workout) {
    return (
      <AppShell activeTab="stats">
        <section className="page-stack">
          <div className="empty-state brutal-card">
            <h2>Workout not found.</h2>
          </div>
        </section>
      </AppShell>
    )
  }

  return (
    <AppShell activeTab="stats">
      <section className="page-stack">
        <section className="detail-hero">
          <div>
            <p className="eyebrow">Workout Detail</p>
            <h1>{workout.title}</h1>
            <p>
              {formatLongDate(workout.workoutDate)}
            </p>
          </div>

          <div className="detail-actions">
            <button
              type="button"
              className="brutal-button brutal-button--primary"
              onClick={() => navigate(`/workouts/${workout.id}/edit`)}
            >
              Edit
            </button>
            <button
              type="button"
              className="brutal-button brutal-button--secondary"
              onClick={() => {
                void (async () => {
                  await deleteWorkout(workout.id)
                  navigate('/history')
                })()
              }}
            >
              Delete
            </button>
          </div>
        </section>

        <div className="tag-row">
          {muscleNames.map((name) => (
            <span key={name} className="tag">
              [{name}]
            </span>
          ))}
        </div>

        <div className="card-stack">
          {workout.exerciseBlocks.map((block) => (
            <ExerciseBlockCard
              key={block.workoutExerciseId}
              block={block}
              preferredUnit={profile.preferredUnit}
              historyHref={`/exercises/${block.exerciseId}`}
            />
          ))}
        </div>
      </section>
    </AppShell>
  )
}
