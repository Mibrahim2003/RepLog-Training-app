import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell, ExerciseBlockCard } from '../components'
import { useAppContext } from '../context/AppContext'
import { makeId } from '../utils/format'
import { formatLongDate } from '../utils/format'

export function WorkoutDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const { getWorkout, muscleGroups, profile, deleteWorkout, saveTemplate } = useAppContext()
  const workout = params.id ? getWorkout(params.id) : null
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)

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

  const handleSaveTemplate = () => {
    void (async () => {
      setIsSavingTemplate(true)
      await saveTemplate({
        id: makeId('template'),
        name: `${workout.title} Template`,
        muscleGroupIds: [...workout.muscleGroupIds],
        exerciseCount: workout.exerciseBlocks.length,
        exercises: workout.exerciseBlocks.map((block, index) => ({
          exerciseId: block.exerciseId,
          orderIndex: index + 1,
          defaultSetCount: Math.max(block.sets.length, 1),
        })),
      })
      setIsSavingTemplate(false)
      navigate('/templates')
    })()
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
              {workout.durationMinutes ? ` • ${workout.durationMinutes} min` : ''}
            </p>
          </div>

          <div className="detail-actions">
            <button
              type="button"
              className="brutal-button brutal-button--primary"
              onClick={handleSaveTemplate}
              disabled={isSavingTemplate}
            >
              {isSavingTemplate ? 'Saving...' : 'Save as Template'}
            </button>
            <button
              type="button"
              className="brutal-button brutal-button--secondary"
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
