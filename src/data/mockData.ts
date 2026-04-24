import type {
  ExerciseBlockVM,
  ExerciseDefinition,
  MuscleGroup,
  TemplateCardVM,
  Unit,
  Workout,
  WorkoutDraft,
} from '../types'
import { createBlankSet, makeId, todayLocalDateString } from '../utils/format'

export const muscleGroups: MuscleGroup[] = [
  { id: 'chest', name: 'Chest', sizeCategory: 'major' },
  { id: 'back', name: 'Back', sizeCategory: 'major' },
  { id: 'shoulders', name: 'Shoulders', sizeCategory: 'major' },
  { id: 'legs', name: 'Legs', sizeCategory: 'major' },
  { id: 'biceps', name: 'Biceps', sizeCategory: 'minor' },
  { id: 'triceps', name: 'Triceps', sizeCategory: 'minor' },
  { id: 'core', name: 'Core', sizeCategory: 'minor' },
]

export const exerciseCatalog: ExerciseDefinition[] = [
  {
    id: 'bench-press',
    ownerUserId: null,
    name: 'Bench Press',
    source: 'system',
    primaryMuscleGroupId: 'chest',
    secondaryMuscleGroupIds: ['triceps', 'shoulders'],
  },
  {
    id: 'incline-db-press',
    ownerUserId: null,
    name: 'Incline DB Press',
    source: 'system',
    primaryMuscleGroupId: 'chest',
    secondaryMuscleGroupIds: ['shoulders', 'triceps'],
  },
  {
    id: 'cable-fly',
    ownerUserId: null,
    name: 'Cable Fly',
    source: 'system',
    primaryMuscleGroupId: 'chest',
    secondaryMuscleGroupIds: [],
  },
  {
    id: 'pull-up',
    ownerUserId: null,
    name: 'Pull-Up',
    source: 'system',
    primaryMuscleGroupId: 'back',
    secondaryMuscleGroupIds: ['biceps'],
  },
  {
    id: 'barbell-row',
    ownerUserId: null,
    name: 'Barbell Row',
    source: 'system',
    primaryMuscleGroupId: 'back',
    secondaryMuscleGroupIds: ['biceps'],
  },
  {
    id: 'lat-pulldown',
    ownerUserId: null,
    name: 'Lat Pulldown',
    source: 'system',
    primaryMuscleGroupId: 'back',
    secondaryMuscleGroupIds: ['biceps'],
  },
  {
    id: 'deadlift',
    ownerUserId: null,
    name: 'Deadlift',
    source: 'system',
    primaryMuscleGroupId: 'legs',
    secondaryMuscleGroupIds: ['back'],
  },
  {
    id: 'squat',
    ownerUserId: null,
    name: 'Back Squat',
    source: 'system',
    primaryMuscleGroupId: 'legs',
    secondaryMuscleGroupIds: ['core'],
  },
  {
    id: 'leg-press',
    ownerUserId: null,
    name: 'Leg Press',
    source: 'system',
    primaryMuscleGroupId: 'legs',
    secondaryMuscleGroupIds: [],
  },
  {
    id: 'romanian-deadlift',
    ownerUserId: null,
    name: 'Romanian Deadlift',
    source: 'system',
    primaryMuscleGroupId: 'legs',
    secondaryMuscleGroupIds: ['back'],
  },
  {
    id: 'calf-raise',
    ownerUserId: null,
    name: 'Calf Raise',
    source: 'system',
    primaryMuscleGroupId: 'legs',
    secondaryMuscleGroupIds: [],
  },
  {
    id: 'tricep-pushdown',
    ownerUserId: null,
    name: 'Tricep Pushdown',
    source: 'system',
    primaryMuscleGroupId: 'triceps',
    secondaryMuscleGroupIds: [],
  },
  {
    id: 'shoulder-press',
    ownerUserId: null,
    name: 'Shoulder Press',
    source: 'system',
    primaryMuscleGroupId: 'shoulders',
    secondaryMuscleGroupIds: ['triceps'],
  },
  {
    id: 'bicep-curl',
    ownerUserId: null,
    name: 'Bicep Curl',
    source: 'system',
    primaryMuscleGroupId: 'biceps',
    secondaryMuscleGroupIds: [],
  },
  {
    id: 'plank',
    ownerUserId: null,
    name: 'Plank',
    source: 'system',
    primaryMuscleGroupId: 'core',
    secondaryMuscleGroupIds: [],
  },
  {
    id: 'russian-twist',
    ownerUserId: null,
    name: 'Russian Twist',
    source: 'system',
    primaryMuscleGroupId: 'core',
    secondaryMuscleGroupIds: [],
  },
  {
    id: 'battle-rope-slam',
    ownerUserId: null,
    name: 'Battle Rope Slam',
    source: 'system',
    primaryMuscleGroupId: 'shoulders',
    secondaryMuscleGroupIds: ['core', 'biceps'],
  },
]

export const defaultProfile = {
  id: '',
  email: '',
  displayName: 'Athlete',
  preferredUnit: 'lb' as Unit,
}

export function createEmptyDraft(workoutDate = todayLocalDateString()): WorkoutDraft {
  return {
    id: makeId('draft'),
    workoutDate,
    muscleGroupIds: [],
    exerciseBlocks: [],
  }
}

export function createDraftFromWorkout(workout: Workout): WorkoutDraft {
  return {
    id: makeId('draft'),
    sourceWorkoutId: workout.id,
    workoutDate: workout.workoutDate,
    muscleGroupIds: [...workout.muscleGroupIds],
    exerciseBlocks: workout.exerciseBlocks.map((block) => ({
      ...block,
      duplicateWarning: false,
      sets: block.sets.map((setRow) => ({ ...setRow, hasPR: false })),
    })),
  }
}

export function buildBlocksFromTemplate(
  template: TemplateCardVM,
  preferredUnit: Unit,
  exercises: ExerciseDefinition[],
) {
  return template.exercises
    .slice()
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map((templateExercise) => {
      const exercise = exercises.find((item) => item.id === templateExercise.exerciseId)
      const setCount = Math.max(templateExercise.defaultSetCount, 1)

      return {
        workoutExerciseId: makeId('block'),
        exerciseId: templateExercise.exerciseId,
        name: exercise?.name ?? 'Custom Exercise',
        note: '',
        isDuplicateInstance: false,
        duplicateWarning: false,
        sets: Array.from({ length: setCount }, (_, index) =>
          createBlankSet(index + 1, preferredUnit),
        ),
      } satisfies ExerciseBlockVM
    })
}
