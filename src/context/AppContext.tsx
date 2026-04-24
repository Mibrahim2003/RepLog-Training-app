/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type Dispatch,
  type SetStateAction,
} from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type AuthError,
  type Unsubscribe,
} from 'firebase/auth'
import { auth, firebaseSetupMessage, googleProvider, isFirebaseConfigured } from '../firebase/config'
import {
  createCustomExerciseDoc,
  defaultProfileFromAuthUser,
  deleteWorkoutDoc,
  ensureUserProfile,
  noopUnsubscribe,
  saveProfilePatch,
  subscribeToCustomExercises,
  subscribeToProfile,
  subscribeToWorkouts,
  upsertWorkout,
} from '../firebase/firestore'
import {
  createDraftFromWorkout,
  createEmptyDraft,
  defaultProfile,
  exerciseCatalog,
  muscleGroups as seedMuscleGroups,
} from '../data/mockData'
import type {
  AuthSession,
  DraftReference,
  EditorTarget,
  ExerciseDefinition,
  MuscleGroup,
  UserProfile,
  Workout,
  WorkoutDraft,
} from '../types'
import {
  clearAllDraftsForUser,
  clearDraftFromSession,
  discardStoredDraft,
  listDraftReferences,
  persistDraftToSession,
  readDraftPayload,
} from '../utils/drafts'
import {
  createBlankSet,
  deriveWorkoutTitle,
  makeId,
  renumberSets,
  toCanonicalKg,
} from '../utils/format'

interface AppContextValue {
  session: AuthSession
  authError: string | null
  isFirebaseConfigured: boolean
  firebaseSetupMessage: string | null
  profile: UserProfile
  muscleGroups: MuscleGroup[]
  exercises: ExerciseDefinition[]
  workouts: Workout[]
  pendingDrafts: DraftReference[]
  newDraft: WorkoutDraft | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearAuthError: () => void
  updateProfile: (patch: Partial<Pick<UserProfile, 'displayName' | 'preferredUnit'>>) => Promise<void>
  ensureNewDraft: () => void
  ensureEditDraft: (workoutId: string) => void
  getDraft: (target: EditorTarget) => WorkoutDraft | null
  updateDraftMeta: (
    target: EditorTarget,
    patch: Partial<Pick<WorkoutDraft, 'workoutDate'>>,
  ) => void
  addMuscleGroup: (name: string) => string
  toggleMuscleGroup: (target: EditorTarget, muscleGroupId: string) => void
  addExerciseToDraft: (target: EditorTarget, exerciseId: string) => void
  createCustomExercise: (input: {
    name: string
    primaryMuscleGroupId: string
    target?: EditorTarget
  }) => Promise<string>
  updateExerciseNote: (
    target: EditorTarget,
    workoutExerciseId: string,
    note: string,
  ) => void
  updateSetField: (
    target: EditorTarget,
    workoutExerciseId: string,
    setId: string,
    field: 'weightValue' | 'reps' | 'note',
    value: string,
  ) => void
  addSet: (target: EditorTarget, workoutExerciseId: string) => void
  duplicateLastSet: (target: EditorTarget, workoutExerciseId: string) => void
  deleteSet: (target: EditorTarget, workoutExerciseId: string, setId: string) => void
  deleteExerciseBlock: (target: EditorTarget, workoutExerciseId: string) => void
  saveWorkout: (target: EditorTarget, draft: WorkoutDraft) => Promise<string | null>
  deleteWorkout: (workoutId: string) => Promise<void>
  getWorkout: (workoutId: string) => Workout | null
  getExercise: (exerciseId: string) => ExerciseDefinition | null
  resumeDraft: (draftRef: DraftReference) => string | null
  discardDraft: (draftRef: DraftReference) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function formatAuthError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return 'Something went wrong during sign-in.'
  }

  const authError = error as Partial<AuthError>
  switch (authError.code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled before it completed.'
    case 'auth/network-request-failed':
      return 'The network request failed. Please try again.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Authentication yet.'
    default:
      return authError.message ?? 'Something went wrong during sign-in.'
  }
}

function updateDraftByTarget(
  target: EditorTarget,
  newDraft: WorkoutDraft | null,
  setNewDraft: Dispatch<SetStateAction<WorkoutDraft | null>>,
  setEditDrafts: Dispatch<SetStateAction<Record<string, WorkoutDraft>>>,
  updater: (draft: WorkoutDraft) => WorkoutDraft,
  sourceWorkout?: Workout | null,
) {
  if (target.kind === 'new') {
    setNewDraft((previous) => {
      const baseDraft = previous ?? newDraft
      return baseDraft ? updater(baseDraft) : previous
    })
    return
  }

  setEditDrafts((previous) => {
    const existing = previous[target.workoutId]
    const baseDraft = existing ?? (sourceWorkout ? createDraftFromWorkout(sourceWorkout) : undefined)

    if (!baseDraft) {
      return previous
    }

    return {
      ...previous,
      [target.workoutId]: updater(baseDraft),
    }
  })
}

export function AppProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession>({
    status: isFirebaseConfigured ? 'loading' : 'signed_out',
  })
  const [authError, setAuthError] = useState<string | null>(firebaseSetupMessage)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [customExercises, setCustomExercises] = useState<ExerciseDefinition[]>([])
  const [customMuscleGroups, setCustomMuscleGroups] = useState<MuscleGroup[]>([])
  const [newDraft, setNewDraft] = useState<WorkoutDraft | null>(null)
  const [editDrafts, setEditDrafts] = useState<Record<string, WorkoutDraft>>({})
  const [pendingDrafts, setPendingDrafts] = useState<DraftReference[]>([])
  const subscriptionsRef = useRef<Unsubscribe[]>([])

  const teardownSubscriptions = () => {
    for (const unsubscribe of subscriptionsRef.current) {
      unsubscribe()
    }
    subscriptionsRef.current = []
  }

  const workoutsById = useMemo(
    () => new Map(workouts.map((workout) => [workout.id, workout])),
    [workouts],
  )

  const exercises = useMemo(
    () => [...exerciseCatalog, ...customExercises],
    [customExercises],
  )

  const primaryMuscleByExerciseId = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise.primaryMuscleGroupId])),
    [exercises],
  )

  const muscleGroups = useMemo(
    () => [...seedMuscleGroups, ...customMuscleGroups],
    [customMuscleGroups],
  )

  const getWorkout = (workoutId: string) => workoutsById.get(workoutId) ?? null

  const getExercise = (exerciseId: string) =>
    exercises.find((exercise) => exercise.id === exerciseId) ?? null

  const deriveMuscleGroupsFromBlocks = (
    blocks: WorkoutDraft['exerciseBlocks'],
    fallback: string[],
    overrides: Record<string, string> = {},
  ) => {
    const muscleIds = blocks
      .map((block) => overrides[block.exerciseId] ?? primaryMuscleByExerciseId.get(block.exerciseId))
      .filter((muscleId): muscleId is string => Boolean(muscleId))

    if (muscleIds.length === 0) {
      return fallback
    }

    return [...new Set(muscleIds)]
  }

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return noopUnsubscribe
    }

    let authUnsubscribe: Unsubscribe = noopUnsubscribe

    ;(async () => {
      authUnsubscribe = onAuthStateChanged(auth, async (user) => {
        teardownSubscriptions()

        if (!user) {
          setSession({ status: 'signed_out' })
          setProfile(defaultProfile)
          setWorkouts([])
          setCustomExercises([])
          setCustomMuscleGroups([])
          setNewDraft(null)
          setEditDrafts({})
          setPendingDrafts([])
          return
        }

        setSession({ status: 'authenticated', uid: user.uid })
        setProfile(defaultProfileFromAuthUser(user))

        try {
          await ensureUserProfile(user.uid, user)
        } catch (error) {
          setAuthError(formatAuthError(error))
        }

        subscriptionsRef.current = [
          subscribeToProfile(user.uid, setProfile),
          subscribeToWorkouts(user.uid, setWorkouts),
          subscribeToCustomExercises(user.uid, setCustomExercises),
        ]

        setPendingDrafts(listDraftReferences(user.uid))
      })
    })()

    return () => {
      authUnsubscribe()
      teardownSubscriptions()
    }
  }, [])

  useEffect(() => {
    if (session.status !== 'authenticated' || !session.uid) {
      return
    }

    if (newDraft) {
      persistDraftToSession(session.uid, { kind: 'new' }, newDraft)
    }
  }, [newDraft, session])

  useEffect(() => {
    if (session.status !== 'authenticated' || !session.uid) {
      return
    }

    for (const [workoutId, draft] of Object.entries(editDrafts)) {
      persistDraftToSession(session.uid, { kind: 'edit', workoutId }, draft)
    }
  }, [editDrafts, session])

  const ensureNewDraft = () => {
    setNewDraft((previous) => previous ?? createEmptyDraft())
  }

  const ensureEditDraft = (workoutId: string) => {
    const workout = getWorkout(workoutId)
    if (!workout) {
      return
    }

    setEditDrafts((previous) => {
      if (previous[workoutId]) {
        return previous
      }

      return {
        ...previous,
        [workoutId]: createDraftFromWorkout(workout),
      }
    })
  }

  const getDraft = (target: EditorTarget) => {
    if (target.kind === 'new') {
      return newDraft
    }

    return editDrafts[target.workoutId] ?? null
  }

  const updateDraftMeta: AppContextValue['updateDraftMeta'] = (target, patch) => {
    updateDraftByTarget(
      target,
      newDraft,
      setNewDraft,
      setEditDrafts,
      (draft) => ({
        ...draft,
        ...patch,
      }),
      target.kind === 'edit' ? getWorkout(target.workoutId) : null,
    )
  }

  const addMuscleGroup: AppContextValue['addMuscleGroup'] = (name) => {
    const trimmed = name.trim()
    if (!trimmed) {
      return ''
    }

    const existing = muscleGroups.find(
      (group) => group.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (existing) {
      return existing.id
    }

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

  const toggleMuscleGroup: AppContextValue['toggleMuscleGroup'] = (target, muscleGroupId) => {
    updateDraftByTarget(
      target,
      newDraft,
      setNewDraft,
      setEditDrafts,
      (draft) => {
        const alreadySelected = draft.muscleGroupIds.includes(muscleGroupId)
        return {
          ...draft,
          muscleGroupIds: alreadySelected
            ? draft.muscleGroupIds.filter((id) => id !== muscleGroupId)
            : [...draft.muscleGroupIds, muscleGroupId],
        }
      },
      target.kind === 'edit' ? getWorkout(target.workoutId) : null,
    )
  }

  const addExerciseToDraft: AppContextValue['addExerciseToDraft'] = (target, exerciseId) => {
    const definition = getExercise(exerciseId)
    if (!definition) {
      return
    }

    updateDraftByTarget(
      target,
      newDraft,
      setNewDraft,
      setEditDrafts,
      (draft) => {
        const duplicateCount = draft.exerciseBlocks.filter(
          (block) => block.exerciseId === exerciseId,
        ).length

        const nextBlocks: WorkoutDraft['exerciseBlocks'] = [
          ...draft.exerciseBlocks,
          {
            workoutExerciseId: `block-${makeId('exercise')}`,
            exerciseId: definition.id,
            name: definition.name,
            note: '',
            isDuplicateInstance: duplicateCount > 0,
            duplicateWarning: duplicateCount > 0,
            sets: [createBlankSet(1, profile.preferredUnit)],
          },
        ]

        return {
          ...draft,
          muscleGroupIds: deriveMuscleGroupsFromBlocks(nextBlocks, [definition.primaryMuscleGroupId]),
          exerciseBlocks: nextBlocks,
        }
      },
      target.kind === 'edit' ? getWorkout(target.workoutId) : null,
    )
  }

  const createCustomExercise: AppContextValue['createCustomExercise'] = async ({
    name,
    primaryMuscleGroupId,
    target,
  }) => {
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

    if (target) {
      updateDraftByTarget(
        target,
        newDraft,
        setNewDraft,
        setEditDrafts,
        (draft) => {
          const duplicateCount = draft.exerciseBlocks.filter(
            (block) => block.exerciseId === created.id,
          ).length

          const nextBlocks: WorkoutDraft['exerciseBlocks'] = [
            ...draft.exerciseBlocks,
            {
              workoutExerciseId: `block-${makeId('exercise')}`,
              exerciseId: created.id,
              name: created.name,
              note: '',
              isDuplicateInstance: duplicateCount > 0,
              duplicateWarning: duplicateCount > 0,
              sets: [createBlankSet(1, profile.preferredUnit)],
            },
          ]

          return {
            ...draft,
            muscleGroupIds: deriveMuscleGroupsFromBlocks(
              nextBlocks,
              [primaryMuscleGroupId],
              { [created.id]: primaryMuscleGroupId },
            ),
            exerciseBlocks: nextBlocks,
          }
        },
        target.kind === 'edit' ? getWorkout(target.workoutId) : null,
      )
    }

    return created.id
  }

  const updateExerciseNote: AppContextValue['updateExerciseNote'] = (
    target,
    workoutExerciseId,
    note,
  ) => {
    updateDraftByTarget(
      target,
      newDraft,
      setNewDraft,
      setEditDrafts,
      (draft) => ({
        ...draft,
        exerciseBlocks: draft.exerciseBlocks.map((block) =>
          block.workoutExerciseId === workoutExerciseId ? { ...block, note } : block,
        ),
      }),
      target.kind === 'edit' ? getWorkout(target.workoutId) : null,
    )
  }

  const updateSetField: AppContextValue['updateSetField'] = (
    target,
    workoutExerciseId,
    setId,
    field,
    value,
  ) => {
    updateDraftByTarget(
      target,
      newDraft,
      setNewDraft,
      setEditDrafts,
      (draft) => ({
        ...draft,
        exerciseBlocks: draft.exerciseBlocks.map((block) => {
          if (block.workoutExerciseId !== workoutExerciseId) {
            return block
          }

          return {
            ...block,
            sets: block.sets.map((setRow) => {
              if (setRow.id !== setId) {
                return setRow
              }

              if (field === 'note') {
                return { ...setRow, note: value }
              }

              if (field === 'reps') {
                return { ...setRow, reps: value === '' ? null : Number(value) }
              }

              return {
                ...setRow,
                weightValue: value === '' ? null : Number(value),
                weightUnit: profile.preferredUnit,
                canonicalKg:
                  value === '' ? null : toCanonicalKg(Number(value), profile.preferredUnit),
              }
            }),
          }
        }),
      }),
      target.kind === 'edit' ? getWorkout(target.workoutId) : null,
    )
  }

  const addSet: AppContextValue['addSet'] = (target, workoutExerciseId) => {
    updateDraftByTarget(
      target,
      newDraft,
      setNewDraft,
      setEditDrafts,
      (draft) => ({
        ...draft,
        exerciseBlocks: draft.exerciseBlocks.map((block) =>
          block.workoutExerciseId === workoutExerciseId
            ? {
                ...block,
                sets: [
                  ...block.sets,
                  createBlankSet(block.sets.length + 1, profile.preferredUnit),
                ],
              }
            : block,
        ),
      }),
      target.kind === 'edit' ? getWorkout(target.workoutId) : null,
    )
  }

  const duplicateLastSet: AppContextValue['duplicateLastSet'] = (target, workoutExerciseId) => {
    updateDraftByTarget(
      target,
      newDraft,
      setNewDraft,
      setEditDrafts,
      (draft) => ({
        ...draft,
        exerciseBlocks: draft.exerciseBlocks.map((block) => {
          if (block.workoutExerciseId !== workoutExerciseId) {
            return block
          }

          const lastSet = block.sets[block.sets.length - 1]
          const duplicated = lastSet
            ? {
                ...lastSet,
                id: `set-${makeId('copy')}`,
                orderIndex: block.sets.length + 1,
                hasPR: false,
              }
            : createBlankSet(1, profile.preferredUnit)

          return {
            ...block,
            sets: [...block.sets, duplicated],
          }
        }),
      }),
      target.kind === 'edit' ? getWorkout(target.workoutId) : null,
    )
  }

  const deleteSet: AppContextValue['deleteSet'] = (target, workoutExerciseId, setId) => {
    updateDraftByTarget(
      target,
      newDraft,
      setNewDraft,
      setEditDrafts,
      (draft) => ({
        ...draft,
        exerciseBlocks: draft.exerciseBlocks.map((block) => {
          if (block.workoutExerciseId !== workoutExerciseId) {
            return block
          }

          const nextSets = block.sets.filter((setRow) => setRow.id !== setId)
          return {
            ...block,
            sets:
              nextSets.length > 0
                ? renumberSets(nextSets).map((setRow) => ({ ...setRow, hasPR: false }))
                : [createBlankSet(1, profile.preferredUnit)],
          }
        }),
      }),
      target.kind === 'edit' ? getWorkout(target.workoutId) : null,
    )
  }

  const deleteExerciseBlock: AppContextValue['deleteExerciseBlock'] = (
    target,
    workoutExerciseId,
  ) => {
    updateDraftByTarget(
      target,
      newDraft,
      setNewDraft,
      setEditDrafts,
      (draft) => {
        const nextBlocks = draft.exerciseBlocks.filter(
          (block) => block.workoutExerciseId !== workoutExerciseId,
        )

        return {
          ...draft,
          muscleGroupIds:
            nextBlocks.length > 0
              ? deriveMuscleGroupsFromBlocks(nextBlocks, draft.muscleGroupIds)
              : draft.muscleGroupIds,
          exerciseBlocks: nextBlocks,
        }
      },
      target.kind === 'edit' ? getWorkout(target.workoutId) : null,
    )
  }

  const saveWorkout: AppContextValue['saveWorkout'] = async (target, draft) => {
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
          normalizeMuscleKey(workout.muscleGroupIds) === draftKey,
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

    if (target.kind === 'new') {
      setNewDraft(null)
    } else {
      setEditDrafts((previous) => {
        const nextDrafts = { ...previous }
        delete nextDrafts[target.workoutId]
        return nextDrafts
      })
    }

    return workoutId
  }

  const deleteWorkout: AppContextValue['deleteWorkout'] = async (workoutId) => {
    if (session.status !== 'authenticated' || !session.uid) {
      return
    }

    await deleteWorkoutDoc(session.uid, workoutId)
    clearDraftFromSession(session.uid, { kind: 'edit', workoutId })
    setEditDrafts((previous) => {
      const nextDrafts = { ...previous }
      delete nextDrafts[workoutId]
      return nextDrafts
    })
  }

  const resumeDraft: AppContextValue['resumeDraft'] = (draftRef) => {
    const payload = readDraftPayload(draftRef.key)
    if (!payload) {
      setPendingDrafts((previous) => previous.filter((item) => item.key !== draftRef.key))
      return null
    }

    if (payload.target.kind === 'new') {
      setNewDraft(payload.draft)
    } else {
      const workoutId = payload.target.workoutId
      setEditDrafts((previous) => ({
        ...previous,
        [workoutId]: payload.draft,
      }))
    }

    setPendingDrafts((previous) => previous.filter((item) => item.key !== draftRef.key))
    return draftRef.route
  }

  const discardDraft: AppContextValue['discardDraft'] = (draftRef) => {
    discardStoredDraft(draftRef)

    if (draftRef.target.kind === 'new') {
      setNewDraft(null)
    } else {
      const workoutId = draftRef.target.workoutId
      setEditDrafts((previous) => {
        const nextDrafts = { ...previous }
        delete nextDrafts[workoutId]
        return nextDrafts
      })
    }

    setPendingDrafts((previous) => previous.filter((item) => item.key !== draftRef.key))
  }

  const signInWithGoogle: AppContextValue['signInWithGoogle'] = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setAuthError(firebaseSetupMessage)
      return
    }

    setAuthError(null)

    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      setAuthError(formatAuthError(error))
    }
  }

  const signOut: AppContextValue['signOut'] = async () => {
    if (!auth || session.status !== 'authenticated' || !session.uid) {
      return
    }

    clearAllDraftsForUser(session.uid)
    teardownSubscriptions()
    await firebaseSignOut(auth)
  }

  const updateProfile: AppContextValue['updateProfile'] = async (patch) => {
    if (session.status !== 'authenticated' || !session.uid) {
      return
    }

    setProfile((previous) => ({
      ...previous,
      ...patch,
    }))

    await saveProfilePatch(session.uid, patch)
  }

  const contextValue: AppContextValue = {
    session,
    authError,
    isFirebaseConfigured,
    firebaseSetupMessage,
    profile,
    muscleGroups,
    exercises,
    workouts,
    pendingDrafts,
    newDraft,
    signInWithGoogle,
    signOut,
    clearAuthError: () => setAuthError(null),
    updateProfile,
    ensureNewDraft,
    ensureEditDraft,
    getDraft,
    updateDraftMeta,
    addMuscleGroup,
    toggleMuscleGroup,
    addExerciseToDraft,
    createCustomExercise,
    updateExerciseNote,
    updateSetField,
    addSet,
    duplicateLastSet,
    deleteSet,
    deleteExerciseBlock,
    saveWorkout,
    deleteWorkout,
    getWorkout,
    getExercise,
    resumeDraft,
    discardDraft,
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider')
  }

  return context
}
