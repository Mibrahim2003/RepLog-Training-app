export type Unit = 'kg' | 'lb'
export type MuscleSize = 'major' | 'minor'
export type ExerciseSource = 'system' | 'custom'
export type SessionStatus = 'loading' | 'authenticated' | 'signed_out'
export type EditorTarget =
  | {
      kind: 'new'
    }
  | {
      kind: 'edit'
      workoutId: string
    }

export interface AuthSession {
  status: SessionStatus
  uid?: string
}

export interface UserProfile {
  id: string
  email: string
  displayName: string
  preferredUnit: Unit
}

export interface UserProfileDoc {
  email: string
  displayName: string
  preferredUnit: Unit
  createdAt?: string
  updatedAt?: string
}

export interface MuscleGroup {
  id: string
  name: string
  sizeCategory: MuscleSize
}

export interface ExerciseDefinition {
  id: string
  ownerUserId: string | null
  name: string
  source: ExerciseSource
  primaryMuscleGroupId: string
  secondaryMuscleGroupIds: string[]
}

export interface SetRowVM {
  id: string
  orderIndex: number
  weightValue: number | null
  weightUnit: Unit
  canonicalKg: number | null
  reps: number | null
  note?: string
  hasPR?: boolean
}

export interface SetEntryDoc {
  id: string
  orderIndex: number
  weightValue: number | null
  weightUnit: Unit
  canonicalKg: number | null
  reps: number | null
  note?: string
}

export interface ExerciseBlockVM {
  workoutExerciseId: string
  exerciseId: string
  name: string
  note?: string
  isDuplicateInstance: boolean
  duplicateWarning?: boolean
  sets: SetRowVM[]
}

export interface ExerciseBlockDoc {
  workoutExerciseId: string
  exerciseId: string
  name: string
  note?: string
  isDuplicateInstance: boolean
  sets: SetEntryDoc[]
}

export interface Workout {
  id: string
  title: string
  workoutDate: string
  durationMinutes?: number
  muscleGroupIds: string[]
  createdAt: string
  updatedAt: string
  exerciseBlocks: ExerciseBlockVM[]
  hitPR?: boolean
}

export interface WorkoutDoc {
  title: string
  workoutDate: string
  durationMinutes?: number
  muscleGroupIds: string[]
  exerciseBlocks: ExerciseBlockDoc[]
  createdAt?: string
  updatedAt?: string
}

export interface WorkoutDraft {
  id: string
  sourceWorkoutId?: string
  workoutDate: string
  muscleGroupIds: string[]
  exerciseBlocks: ExerciseBlockVM[]
}

export interface WorkoutCardVM {
  id: string
  dateLabel: string
  durationMinutes?: number
  muscleGroups: string[]
  exerciseCount: number
  hitPR: boolean
  title?: string
  summary?: string
}

export interface TemplateExercise {
  exerciseId: string
  orderIndex: number
  defaultSetCount: number
}

export interface TemplateDoc {
  name: string
  muscleGroupIds: string[]
  exercises: TemplateExercise[]
  lastUsedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface TemplateCardVM {
  id: string
  name: string
  muscleGroupIds: string[]
  exerciseCount: number
  lastUsedAt?: string
  createdAt?: string
  updatedAt?: string
  exercises: TemplateExercise[]
}

export interface ExerciseHistoryPoint {
  workoutDate: string
  heaviestWeightCanonicalKg: number
  displayWeight: string
}

export interface CustomExerciseDoc {
  name: string
  primaryMuscleGroupId: string
  secondaryMuscleGroupIds: string[]
  createdAt?: string
  updatedAt?: string
}

export interface DraftReference {
  key: string
  target: EditorTarget
  route: string
  label: string
  updatedAt: string
}

export interface StoredDraftPayload {
  target: EditorTarget
  draft: WorkoutDraft
  updatedAt: string
}
