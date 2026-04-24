import { Link } from 'react-router-dom'
import { AppShell, EmptyState, WorkoutCard } from '../components'
import { useAppContext } from '../context/AppContext'
import { sortWorkoutsByDate } from '../utils/format'

export function HomePage() {
  const { profile, workouts, muscleGroups } = useAppContext()
  const recentWorkouts = sortWorkoutsByDate(workouts).slice(0, 4)

  return (
    <AppShell activeTab="log">
      <section className="page-stack">
        <header className="hero-panel">
          <p className="eyebrow">Daily Log</p>
          <h1>Hello, {profile.displayName || 'Athlete'}</h1>
          <p>Ready to crush it today.</p>
        </header>

        <Link to="/workouts/new" className="brutal-button brutal-button--primary brutal-button--full">
          New Workout
        </Link>

        <section className="section-stack">
          <div className="section-heading">
            <h2>Recent Workouts</h2>
          </div>

          {recentWorkouts.length === 0 ? (
            <EmptyState
              title="First workout incoming."
              message="Nothing logged yet. Start a session and your recent cards will land here."
              actionLabel="New Workout"
              actionTo="/workouts/new"
            />
          ) : (
            <div className="card-stack">
              {recentWorkouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  muscleGroups={muscleGroups}
                  href={`/workouts/${workout.id}`}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </AppShell>
  )
}
