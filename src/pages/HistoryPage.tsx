import { AppShell, EmptyState, WorkoutCard } from '../components'
import { useAppContext } from '../context/AppContext'
import { sortWorkoutsByDate } from '../utils/format'

export function HistoryPage() {
  const { workouts, muscleGroups } = useAppContext()
  const sorted = sortWorkoutsByDate(workouts)

  return (
    <AppShell activeTab="stats">
      <section className="page-stack">
        <div className="section-heading">
          <h1>Workout History</h1>
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            title="No history yet."
            message="Once you save a workout it will show up here with PR flags and muscle tags."
            actionLabel="Log Workout"
            actionTo="/workouts/new"
          />
        ) : (
          <div className="card-stack">
            {sorted.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                muscleGroups={muscleGroups}
                href={`/workouts/${workout.id}`}
                showSummary
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  )
}
