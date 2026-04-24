import type {
  ExerciseBlockVM,
  MuscleGroup,
  SetRowVM,
  Unit,
  Workout,
  WorkoutDraft,
} from '../types'

export function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function todayLocalDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseLocalDateString(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function toCanonicalKg(value: number | null, unit: Unit) {
  if (value === null || Number.isNaN(value)) {
    return null
  }

  return unit === 'kg' ? value : Number((value / 2.20462).toFixed(2))
}

export function fromCanonicalKg(value: number | null, unit: Unit) {
  if (value === null || Number.isNaN(value)) {
    return null
  }

  return unit === 'kg' ? Number(value.toFixed(1)) : Number((value * 2.20462).toFixed(1))
}

export function formatWeight(value: number | null, unit: Unit) {
  if (value === null || Number.isNaN(value)) {
    return '--'
  }

  const display =
    unit === 'kg' ? Number(value.toFixed(1)).toString() : Math.round(value).toString()
  return `${display} ${unit.toUpperCase()}`
}

export function displayWeightFromSet(setRow: SetRowVM, preferredUnit: Unit) {
  const converted = fromCanonicalKg(setRow.canonicalKg, preferredUnit)
  if (converted === null) {
    return ''
  }

  return preferredUnit === 'kg'
    ? converted.toFixed(converted % 1 === 0 ? 0 : 1)
    : Math.round(converted).toString()
}

export function formatDateLabel(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(parseLocalDateString(date))
}

export function formatWorkoutDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
    .format(parseLocalDateString(date))
    .toUpperCase()
}

export function formatLongDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parseLocalDateString(date))
}

export function sortWorkoutsByDate(workouts: Workout[]) {
  return [...workouts].sort((left, right) => {
    if (right.workoutDate !== left.workoutDate) {
      return right.workoutDate.localeCompare(left.workoutDate)
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })
}

export function getWorkoutSummary(blocks: ExerciseBlockVM[]) {
  return blocks
    .slice(0, 4)
    .map((block) => block.name)
    .join(', ')
}

export function workoutHasPr(workout: Workout) {
  return workout.hitPR ?? workout.exerciseBlocks.some((block) => block.sets.some((setRow) => setRow.hasPR))
}

export function deriveWorkoutTitle(
  draft: Pick<WorkoutDraft, 'muscleGroupIds' | 'workoutDate'>,
  muscleGroups: MuscleGroup[],
) {
  const mapped = draft.muscleGroupIds
    .map((muscleId) => muscleGroups.find((group) => group.id === muscleId)?.name)
    .filter(Boolean) as string[]

  if (mapped.length > 0) {
    return mapped.join(', ')
  }

  return `Workout on ${draft.workoutDate}`
}

export function cloneSets(sets: SetRowVM[]) {
  return sets.map((setRow) => ({ ...setRow }))
}

export function renumberSets(sets: SetRowVM[]) {
  return sets.map((setRow, index) => ({
    ...setRow,
    orderIndex: index + 1,
  }))
}

export function createBlankSet(orderIndex: number, unit: Unit): SetRowVM {
  return {
    id: makeId('set'),
    orderIndex,
    weightValue: null,
    weightUnit: unit,
    canonicalKg: null,
    reps: null,
    note: '',
    hasPR: false,
  }
}
