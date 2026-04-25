import { Link, useNavigate } from 'react-router-dom'
import { AppShell, EmptyState, WorkoutCard } from '../components'
import { useAppContext } from '../context/AppContext'
import { sortWorkoutsByDate } from '../utils/format'

const beginnerTemplates = [
  { label: 'Push Day', muscles: ['chest', 'shoulders', 'triceps'], icon: '💪' },
  { label: 'Pull Day', muscles: ['back', 'biceps'], icon: '🏋️' },
  { label: 'Leg Day', muscles: ['quads', 'hamstrings', 'glutes'], icon: '🦵' },
  { label: 'Full Body', muscles: ['chest', 'back', 'quads'], icon: '⚡' },
]

export function HomePage() {
  const { profile, workouts, muscleGroups, ensureNewDraft, toggleMuscleGroup } = useAppContext()
  const navigate = useNavigate()
  const recentWorkouts = sortWorkoutsByDate(workouts).slice(0, 4)

  const handleQuickStart = (template: typeof beginnerTemplates[number]) => {
    ensureNewDraft()
    const target = { kind: 'new' } as const
    for (const muscleName of template.muscles) {
      const group = muscleGroups.find(
        (g) => g.name.toLowerCase() === muscleName.toLowerCase()
      )
      if (group) {
        toggleMuscleGroup(target, group.id)
      }
    }
    navigate('/exercise-search?editor=new')
  }

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
            <>
              <EmptyState
                title="First workout incoming."
                message="Pick a template below to get started with pre-selected muscle groups, or create your own from scratch."
                actionLabel="Start First Workout"
                actionTo="/workouts/new"
                secondaryActions={[
                  { label: 'Browse History', to: '/history' },
                ]}
              />

              <div className="section-heading">
                <h2>Quick Start Templates</h2>
              </div>

              <div className="template-grid">
                {beginnerTemplates.map((template) => (
                  <button
                    key={template.label}
                    type="button"
                    className="template-card brutal-card"
                    onClick={() => handleQuickStart(template)}
                  >
                    <span className="template-card__icon">{template.icon}</span>
                    <strong>{template.label}</strong>
                    <span className="template-card__muscles">
                      {template.muscles.join(' · ')}
                    </span>
                  </button>
                ))}
              </div>
            </>
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
