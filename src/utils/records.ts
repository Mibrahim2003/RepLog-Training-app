import type { Workout } from '../types'

interface ExerciseMetrics {
  maxWeight: number
  maxReps: number
  maxVolume: number
}

export function annotateWorkoutsWithPrs(workouts: Workout[]) {
  const globalMetrics = new Map<string, ExerciseMetrics>()
  const workoutMetrics = new Map<
    string,
    Map<string, { maxWeight: number; maxReps: number; totalVolume: number }>
  >()

  for (const workout of workouts) {
    const perWorkout = new Map<string, { maxWeight: number; maxReps: number; totalVolume: number }>()

    for (const block of workout.exerciseBlocks) {
      for (const setRow of block.sets) {
        const exerciseEntry = perWorkout.get(block.exerciseId) ?? {
          maxWeight: 0,
          maxReps: 0,
          totalVolume: 0,
        }

        exerciseEntry.maxWeight = Math.max(exerciseEntry.maxWeight, setRow.canonicalKg ?? 0)
        exerciseEntry.maxReps = Math.max(exerciseEntry.maxReps, setRow.reps ?? 0)
        exerciseEntry.totalVolume += (setRow.canonicalKg ?? 0) * (setRow.reps ?? 0)
        perWorkout.set(block.exerciseId, exerciseEntry)
      }
    }

    workoutMetrics.set(workout.id, perWorkout)

    for (const [exerciseId, metrics] of perWorkout) {
      const global = globalMetrics.get(exerciseId) ?? {
        maxWeight: 0,
        maxReps: 0,
        maxVolume: 0,
      }

      global.maxWeight = Math.max(global.maxWeight, metrics.maxWeight)
      global.maxReps = Math.max(global.maxReps, metrics.maxReps)
      global.maxVolume = Math.max(global.maxVolume, metrics.totalVolume)
      globalMetrics.set(exerciseId, global)
    }
  }

  return workouts.map((workout) => {
    const perWorkout = workoutMetrics.get(workout.id) ?? new Map()
    let hitPR = false

    const exerciseBlocks = workout.exerciseBlocks.map((block) => {
      const metrics = globalMetrics.get(block.exerciseId)
      const workoutEntry = perWorkout.get(block.exerciseId)

      if (metrics && workoutEntry) {
        if (
          (metrics.maxWeight > 0 && workoutEntry.maxWeight === metrics.maxWeight) ||
          (metrics.maxReps > 0 && workoutEntry.maxReps === metrics.maxReps) ||
          (metrics.maxVolume > 0 && workoutEntry.totalVolume === metrics.maxVolume)
        ) {
          hitPR = true
        }
      }

      return {
        ...block,
        duplicateWarning: false,
        sets: block.sets.map((setRow) => {
          const hasWeightPr =
            (metrics?.maxWeight ?? 0) > 0 && setRow.canonicalKg === metrics?.maxWeight
          const hasRepPr = (metrics?.maxReps ?? 0) > 0 && setRow.reps === metrics?.maxReps

          return {
            ...setRow,
            hasPR: hasWeightPr || hasRepPr,
          }
        }),
      }
    })

    return {
      ...workout,
      exerciseBlocks,
      hitPR,
    }
  })
}
