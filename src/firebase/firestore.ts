import type { User as FirebaseUser } from 'firebase/auth'
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import type {
  CustomExerciseDoc,
  ExerciseBlockDoc,
  ExerciseBlockVM,
  ExerciseDefinition,
  SetEntryDoc,
  TemplateCardVM,
  TemplateDoc,
  UserProfile,
  UserProfileDoc,
  Workout,
  WorkoutDoc,
  WorkoutDraft,
} from '../types'
import { sortWorkoutsByDate, todayLocalDateString } from '../utils/format'
import { annotateWorkoutsWithPrs } from '../utils/records'

function ensureDb() {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.')
  }

  return db
}

function toIsoString(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }

  if (typeof value === 'string') {
    return value
  }

  return new Date().toISOString()
}

function mapSetEntryDoc(setEntry: SetEntryDoc): SetEntryDoc {
  return {
    id: setEntry.id,
    orderIndex: setEntry.orderIndex,
    weightValue: setEntry.weightValue ?? null,
    weightUnit: setEntry.weightUnit,
    canonicalKg: setEntry.canonicalKg ?? null,
    reps: setEntry.reps ?? null,
    note: setEntry.note ?? '',
  }
}

function mapExerciseBlockDoc(block: ExerciseBlockDoc): ExerciseBlockVM {
  return {
    workoutExerciseId: block.workoutExerciseId,
    exerciseId: block.exerciseId,
    name: block.name,
    note: block.note ?? '',
    isDuplicateInstance: block.isDuplicateInstance,
    duplicateWarning: false,
    sets: block.sets.map((setEntry) => ({
      ...mapSetEntryDoc(setEntry),
      hasPR: false,
    })),
  }
}

function serializeSetEntry(setEntry: ExerciseBlockVM['sets'][number]): SetEntryDoc {
  return {
    id: setEntry.id,
    orderIndex: setEntry.orderIndex,
    weightValue: setEntry.weightValue ?? null,
    weightUnit: setEntry.weightUnit,
    canonicalKg: setEntry.canonicalKg ?? null,
    reps: setEntry.reps ?? null,
    note: setEntry.note?.trim() ?? '',
  }
}

function serializeExerciseBlock(block: ExerciseBlockVM): ExerciseBlockDoc {
  return {
    workoutExerciseId: block.workoutExerciseId,
    exerciseId: block.exerciseId,
    name: block.name,
    note: block.note?.trim() ?? '',
    isDuplicateInstance: block.isDuplicateInstance,
    sets: block.sets.map(serializeSetEntry),
  }
}

export function defaultProfileFromAuthUser(user: FirebaseUser): UserProfile {
  return {
    id: user.uid,
    email: user.email ?? '',
    displayName: user.displayName?.trim() || 'Athlete',
    preferredUnit: 'lb',
  }
}

export async function ensureUserProfile(uid: string, user: FirebaseUser) {
  const firestore = ensureDb()
  const profileRef = doc(firestore, 'users', uid)
  const existing = await getDoc(profileRef)

  if (existing.exists()) {
    const existingData = existing.data() as UserProfileDoc
    const preservedDisplayName =
      existingData.displayName?.trim() || user.displayName?.trim() || 'Athlete'

    await setDoc(
      profileRef,
      {
        email: user.email ?? '',
        displayName: preservedDisplayName,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    return
  }

  const defaultProfile: UserProfileDoc = {
    email: user.email ?? '',
    displayName: user.displayName?.trim() || 'Athlete',
    preferredUnit: 'lb',
  }

  await setDoc(profileRef, {
    ...defaultProfile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function subscribeToProfile(uid: string, onValue: (profile: UserProfile) => void) {
  const firestore = ensureDb()
  return onSnapshot(doc(firestore, 'users', uid), (snapshot) => {
    const data = snapshot.data() as UserProfileDoc | undefined
    onValue({
      id: uid,
      email: data?.email ?? '',
      displayName: data?.displayName?.trim() || 'Athlete',
      preferredUnit: data?.preferredUnit ?? 'lb',
    })
  })
}

export function subscribeToWorkouts(uid: string, onValue: (workouts: Workout[]) => void) {
  const firestore = ensureDb()
  return onSnapshot(collection(firestore, 'users', uid, 'workouts'), (snapshot) => {
    const mapped = snapshot.docs.map((documentSnapshot) => {
      const data = documentSnapshot.data() as Omit<WorkoutDoc, 'createdAt' | 'updatedAt'> & {
        createdAt?: unknown
        updatedAt?: unknown
      }

      return {
        id: documentSnapshot.id,
        title: data.title,
        workoutDate: data.workoutDate,
        durationMinutes: data.durationMinutes,
        muscleGroupIds: data.muscleGroupIds ?? [],
        exerciseBlocks: (data.exerciseBlocks ?? []).map(mapExerciseBlockDoc),
        createdAt: toIsoString(data.createdAt),
        updatedAt: toIsoString(data.updatedAt),
      } satisfies Workout
    })

    onValue(annotateWorkoutsWithPrs(sortWorkoutsByDate(mapped)))
  })
}

export function subscribeToTemplates(
  uid: string,
  onValue: (templates: TemplateCardVM[]) => void,
) {
  const firestore = ensureDb()
  return onSnapshot(collection(firestore, 'users', uid, 'templates'), (snapshot) => {
    const mapped = snapshot.docs.map((documentSnapshot) => {
      const data = documentSnapshot.data() as TemplateDoc
      return {
        id: documentSnapshot.id,
        name: data.name,
        muscleGroupIds: data.muscleGroupIds ?? [],
        exerciseCount: data.exercises?.length ?? 0,
        lastUsedAt: data.lastUsedAt,
        createdAt: data.createdAt ? toIsoString(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? toIsoString(data.updatedAt) : undefined,
        exercises: data.exercises ?? [],
      } satisfies TemplateCardVM
    })

    onValue(
      mapped.sort((left, right) => {
        const rightStamp = right.lastUsedAt ?? ''
        const leftStamp = left.lastUsedAt ?? ''
        if (rightStamp !== leftStamp) {
          return rightStamp.localeCompare(leftStamp)
        }
        return left.name.localeCompare(right.name)
      }),
    )
  })
}

export function subscribeToCustomExercises(
  uid: string,
  onValue: (exercises: ExerciseDefinition[]) => void,
) {
  const firestore = ensureDb()
  return onSnapshot(collection(firestore, 'users', uid, 'customExercises'), (snapshot) => {
    const mapped = snapshot.docs.map((documentSnapshot) => {
      const data = documentSnapshot.data() as CustomExerciseDoc
      return {
        id: documentSnapshot.id,
        ownerUserId: uid,
        name: data.name,
        source: 'custom',
        primaryMuscleGroupId: data.primaryMuscleGroupId,
        secondaryMuscleGroupIds: data.secondaryMuscleGroupIds ?? [],
      } satisfies ExerciseDefinition
    })

    onValue(mapped.sort((left, right) => left.name.localeCompare(right.name)))
  })
}

export async function saveProfilePatch(
  uid: string,
  patch: Partial<Pick<UserProfile, 'displayName' | 'preferredUnit'>>,
) {
  const firestore = ensureDb()
  await setDoc(
    doc(firestore, 'users', uid),
    {
      ...patch,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function upsertWorkout(
  uid: string,
  draft: WorkoutDraft,
  title: string,
  existingWorkout: Workout | null,
) {
  const firestore = ensureDb()
  const collectionRef = collection(firestore, 'users', uid, 'workouts')
  const workoutRef = draft.sourceWorkoutId
    ? doc(firestore, 'users', uid, 'workouts', draft.sourceWorkoutId)
    : doc(collectionRef)

  const workoutDoc: WorkoutDoc = {
    title,
    workoutDate: draft.workoutDate,
    muscleGroupIds: draft.muscleGroupIds,
    exerciseBlocks: draft.exerciseBlocks.map(serializeExerciseBlock),
  }

  await setDoc(workoutRef, {
    ...workoutDoc,
    createdAt: existingWorkout
      ? Timestamp.fromDate(new Date(existingWorkout.createdAt))
      : serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return workoutRef.id
}

export async function deleteWorkoutDoc(uid: string, workoutId: string) {
  const firestore = ensureDb()
  await deleteDoc(doc(firestore, 'users', uid, 'workouts', workoutId))
}

export async function restoreWorkoutDoc(uid: string, workout: Workout) {
  const firestore = ensureDb()
  const workoutRef = doc(firestore, 'users', uid, 'workouts', workout.id)

  const workoutDoc: WorkoutDoc = {
    title: workout.title,
    workoutDate: workout.workoutDate,
    durationMinutes: workout.durationMinutes,
    muscleGroupIds: workout.muscleGroupIds,
    exerciseBlocks: workout.exerciseBlocks.map(serializeExerciseBlock),
  }

  await setDoc(workoutRef, {
    ...workoutDoc,
    createdAt: Timestamp.fromDate(new Date(workout.createdAt)),
    updatedAt: serverTimestamp(),
  })
}

export async function saveTemplateDoc(uid: string, template: TemplateCardVM) {
  const firestore = ensureDb()
  const templateRef = doc(firestore, 'users', uid, 'templates', template.id)
  await setDoc(
    templateRef,
    {
      name: template.name,
      muscleGroupIds: template.muscleGroupIds,
      exercises: template.exercises,
      lastUsedAt: template.lastUsedAt,
      updatedAt: serverTimestamp(),
      createdAt: template.createdAt
        ? Timestamp.fromDate(new Date(template.createdAt))
        : serverTimestamp(),
    },
    { merge: true },
  )
}

export async function touchTemplateLastUsed(uid: string, templateId: string) {
  const firestore = ensureDb()
  await updateDoc(doc(firestore, 'users', uid, 'templates', templateId), {
    lastUsedAt: todayLocalDateString(),
    updatedAt: serverTimestamp(),
  })
}

export async function createCustomExerciseDoc(
  uid: string,
  input: Pick<ExerciseDefinition, 'name' | 'primaryMuscleGroupId' | 'secondaryMuscleGroupIds'>,
) {
  const firestore = ensureDb()
  const exerciseRef = doc(collection(firestore, 'users', uid, 'customExercises'))
  await setDoc(exerciseRef, {
    name: input.name.trim(),
    primaryMuscleGroupId: input.primaryMuscleGroupId,
    secondaryMuscleGroupIds: input.secondaryMuscleGroupIds,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return {
    id: exerciseRef.id,
    ownerUserId: uid,
    name: input.name.trim(),
    source: 'custom' as const,
    primaryMuscleGroupId: input.primaryMuscleGroupId,
    secondaryMuscleGroupIds: input.secondaryMuscleGroupIds,
  }
}

export function noopUnsubscribe(): Unsubscribe {
  return () => undefined
}
