import { Link } from 'react-router-dom'
import type { MuscleGroup, Workout } from '../types'
import { formatWorkoutDate, getWorkoutSummary, workoutHasPr } from '../utils/format'

interface WorkoutCardProps {
  workout: Workout
  muscleGroups: MuscleGroup[]
  href: string
  showSummary?: boolean
}

export function WorkoutCard({
  workout,
  muscleGroups,
  href,
  showSummary = false,
}: WorkoutCardProps) {
  const mappedMuscles = workout.muscleGroupIds
    .map((muscleId) => muscleGroups.find((group) => group.id === muscleId)?.name)
    .filter(Boolean) as string[]

  const hasPR = workoutHasPr(workout)

  return (
    <Link to={href} className="workout-card brutal-card">
      {hasPR ? <span className="pr-badge">PR</span> : null}
      <div className="workout-card__header">
        <div>
          <div className="workout-card__date">{formatWorkoutDate(workout.workoutDate)}</div>
          {typeof workout.durationMinutes === 'number' ? (
            <div className="duration-badge">
              <span className="material-symbols-outlined">timer</span>
              <span>{workout.durationMinutes} min</span>
            </div>
          ) : null}
        </div>
        <span className="material-symbols-outlined workout-card__arrow">chevron_right</span>
      </div>

      <div className="workout-card__body">
        {showSummary ? <h3 className="workout-card__title">{workout.title}</h3> : null}
        {showSummary ? <p className="workout-card__summary">{getWorkoutSummary(workout.exerciseBlocks)}</p> : null}

        <div className="tag-row">
          {mappedMuscles.map((name) => (
            <span key={name} className="tag">
              [{name}]
            </span>
          ))}
        </div>

        <p className="workout-card__count">{workout.exerciseBlocks.length} exercises</p>
      </div>
    </Link>
  )
}
