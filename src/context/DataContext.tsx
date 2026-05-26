/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import type { Unsubscribe } from 'firebase/auth'
import {
  createCustomExerciseDoc,
  deleteWorkoutDoc,
  restoreWorkoutDoc,
  subscribeToCustomExercises,
  subscribeToWorkouts,
  upsertWorkout,
} from '../firebase/firestore'
import {
  exerciseCatalog,
  muscleGroups as seedMuscleGroups,
} from '../data/mockData'
import type {
  DraftReference,
  EditorTarget,
  ExerciseDefinition,
  MuscleGroup,
  Workout,
  WorkoutDraft,
} from '../types'
import {
  clearDraftFromSession,
  discardStoredDraft,
  listDraftReferences,
  readDraftPayload,
} from '../utils/drafts'
import { deriveWorkoutTitle, makeId } from '../utils/format'
import { useAuth } from './AuthContext'

interface DataContextValue {
  muscleGroups: MuscleGroup[]
  exercises: ExerciseDefinition[]
  workouts: Workout[]
  pendingDrafts: DraftReference[]
  
  addMuscleGroup: (name: string) => string
  createCustomExercise: (name: string, primaryMuscleGroupId: string) => Promise<string>
  saveWorkout: (target: EditorTarget, draft: WorkoutDraft) => Promise<string | null>
  deleteWorkout: (workoutId: string) => Promise<void>
  restoreWorkout: (workout: Workout) => Promise<void>
  getWorkout: (workoutId: string) => Workout | null
  getExercise: (exerciseId: string) => ExerciseDefinition | null
  resumeDraft: (draftRef: DraftReference) => string | null
  discardDraft: (draftRef: DraftReference) => void
  refreshDrafts: () => void
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: PropsWithChildren) {
  const { session } = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [customExercises, setCustomExercises] = useState<ExerciseDefinition[]>([])
  const [customMuscleGroups, setCustomMuscleGroups] = useState<MuscleGroup[]>([])
  const [pendingDrafts, setPendingDrafts] = useState<DraftReference[]>([])
  const subscriptionsRef = useRef<Unsubscribe[]>([])

  const teardownSubscriptions = () => {
    for (const unsubscribe of subscriptionsRef.current) {
      unsubscribe()
    }
    subscriptionsRef.current = []
  }

  // Effect to manage subscriptions and state wiping based on auth
  useEffect(() => {
    if (session.status !== 'authenticated' || !session.uid) {
      teardownSubscriptions()
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWorkouts([])
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomExercises([])
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomMuscleGroups([])
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingDrafts([])
      return
    }

    const uid = session.uid
    subscriptionsRef.current = [
      subscribeToWorkouts(uid, setWorkouts),
      subscribeToCustomExercises(uid, setCustomExercises),
    ]

    setPendingDrafts(listDraftReferences(uid))

    return () => teardownSubscriptions()
  }, [session])

  const refreshDrafts = () => {
    if (session.status === 'authenticated' && session.uid) {
      setPendingDrafts(listDraftReferences(session.uid))
    }
  }

  const workoutsById = useMemo(
    () => new Map(workouts.map((workout) => [workout.id, workout])),
    [workouts]
  )

  const exercises = useMemo(
    () => [...exerciseCatalog, ...customExercises],
    [customExercises]
  )

  const muscleGroups = useMemo(
    () => [...seedMuscleGroups, ...customMuscleGroups],
    [customMuscleGroups]
  )

  const getWorkout = (workoutId: string) => workoutsById.get(workoutId) ?? null

  const getExercise = (exerciseId: string) =>
    exercises.find((exercise) => exercise.id === exerciseId) ?? null

  const addMuscleGroup = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return ''

    const existing = muscleGroups.find(
      (group) => group.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (existing) return existing.id

    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const id = `custom-${slug || makeId('muscle')}`
    setCustomMuscleGroups((previous) => [
      ...previous,
      { id, name: trimmed, sizeCategory: 'minor' },
    ])
    return id
  }

  const createCustomExercise = async (name: string, primaryMuscleGroupId: string) => {
    const trimmedName = name.trim()
    if (!trimmedName || session.status !== 'authenticated' || !session.uid) {
      return ''
    }

    const created = await createCustomExerciseDoc(session.uid, {
      name: trimmedName,
      primaryMuscleGroupId,
      secondaryMuscleGroupIds: [],
    })

    setCustomExercises((previous) => {
      const next = previous.filter((exercise) => exercise.id !== created.id)
      return [created, ...next]
    })

    return created.id
  }

  const saveWorkout = async (target: EditorTarget, draft: WorkoutDraft) => {
    if (session.status !== 'authenticated' || !session.uid) {
      return null
    }

    const normalizeMuscleKey = (muscleIds: string[]) =>
      [...new Set(muscleIds)].sort((left, right) => left.localeCompare(right)).join('|')

    let draftToSave = draft
    let existingWorkout =
      target.kind === 'edit' && draft.sourceWorkoutId ? getWorkout(draft.sourceWorkoutId) : null

    if (target.kind === 'new') {
      const draftKey = normalizeMuscleKey(draft.muscleGroupIds)
      const mergeTarget = workouts.find(
        (workout) =>
          workout.workoutDate === draft.workoutDate &&
          normalizeMuscleKey(workout.muscleGroupIds) === draftKey
      )

      if (mergeTarget) {
        existingWorkout = mergeTarget
        draftToSave = {
          ...draft,
          sourceWorkoutId: mergeTarget.id,
          exerciseBlocks: [...mergeTarget.exerciseBlocks, ...draft.exerciseBlocks],
        }
      }
    }

    const title = deriveWorkoutTitle(draftToSave, muscleGroups)
    const workoutId = await upsertWorkout(session.uid, draftToSave, title, existingWorkout)

    clearDraftFromSession(session.uid, target)
    refreshDrafts()

    return workoutId
  }

  const deleteWorkout = async (workoutId: string) => {
    if (session.status !== 'authenticated' || !session.uid) {
      return
    }

    await deleteWorkoutDoc(session.uid, workoutId)
    clearDraftFromSession(session.uid, { kind: 'edit', workoutId })
    refreshDrafts()
  }

  const restoreWorkout = async (workout: Workout) => {
    if (session.status !== 'authenticated' || !session.uid) {
      return
    }

    await restoreWorkoutDoc(session.uid, workout)
  }

  const resumeDraft = (draftRef: DraftReference) => {
    const payload = readDraftPayload(draftRef.key)
    if (!payload) {
      refreshDrafts()
      return null
    }

    refreshDrafts()
    return draftRef.route
  }

  const discardDraft = (draftRef: DraftReference) => {
    discardStoredDraft(draftRef)
    refreshDrafts()
  }

  const value: DataContextValue = {
    muscleGroups,
    exercises,
    workouts,
    pendingDrafts,
    addMuscleGroup,
    createCustomExercise,
    saveWorkout,
    deleteWorkout,
    restoreWorkout,
    getWorkout,
    getExercise,
    resumeDraft,
    discardDraft,
    refreshDrafts,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used inside DataProvider')
  }
  return context
}
