import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProvider, useAppContext } from '../src/context/AppContext'
import { upsertWorkout } from '../src/firebase/firestore'
import * as formatUtils from '../src/utils/format'

// Mock Firebase config
vi.mock('../src/firebase/config', () => ({
  db: {}, 
  auth: {},
  googleProvider: {},
  isFirebaseConfigured: true,
  firebaseSetupMessage: null,
}))

// Mock firestore methods
vi.mock('../src/firebase/firestore', () => ({
  ensureUserProfile: vi.fn(),
  subscribeToProfile: vi.fn(() => () => {}),
  subscribeToWorkouts: vi.fn((uid, cb) => {
    // Provide initial mocked workouts to the context
    cb([
      {
        id: 'workout-123',
        title: 'Chest Day',
        workoutDate: '2026-04-25',
        muscleGroupIds: ['chest'],
        exerciseBlocks: [
          { exerciseId: 'bench-press', name: 'Bench Press', sets: [] }
        ],
        createdAt: '2026-04-25T10:00:00Z',
        updatedAt: '2026-04-25T10:00:00Z'
      }
    ])
    return () => {}
  }),
  subscribeToCustomExercises: vi.fn(() => () => {}),
  upsertWorkout: vi.fn().mockResolvedValue('merged-workout-id'),
  defaultProfileFromAuthUser: vi.fn(() => ({ preferredUnit: 'lb' })),
  noopUnsubscribe: vi.fn(),
}))

// Mock firebase auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb({ uid: 'test-user-id' }) // Simulate logged-in user
    return () => {}
  }),
}))

const TestComponent = () => {
  const { ensureNewDraft, toggleMuscleGroup, addExerciseToDraft, saveWorkout, getDraft } = useAppContext()

  const handleSave = async () => {
    ensureNewDraft()
    // It's a new draft. Let's set its date to match the existing one and select chest.
    const target = { kind: 'new' } as const
    // We can't synchronously update draft and get it here easily without effects, 
    // so let's just construct a draft and pass it to saveWorkout for the test.
    // The actual context methods use state, which makes synchronous sequential calls in a test tricky.
    
    const draft = {
      id: 'draft-1',
      workoutDate: '2026-04-25', // Same date
      muscleGroupIds: ['chest'], // Same muscle group key
      exerciseBlocks: [
        { exerciseId: 'cable-fly', name: 'Cable Fly', sets: [] }
      ]
    } as any

    await saveWorkout(target, draft)
  }

  return <button onClick={handleSave}>Trigger Save</button>
}

describe('Same-Day Workout Merge Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(formatUtils, 'todayLocalDateString').mockReturnValue('2026-04-25')
  })

  it('merges new draft into existing workout if date and normalized muscle keys match', async () => {
    const user = userEvent.setup()
    
    render(
      <MemoryRouter>
        <AppProvider>
          <TestComponent />
        </AppProvider>
      </MemoryRouter>
    )

    // Trigger save
    await user.click(screen.getByText('Trigger Save'))

    // Assert upsertWorkout was called with the MERGED payload
    expect(upsertWorkout).toHaveBeenCalledTimes(1)
    
    const [uid, draftToSave, title, existingWorkout] = vi.mocked(upsertWorkout).mock.calls[0]
    
    expect(uid).toBe('test-user-id')
    expect(existingWorkout).toBeTruthy()
    expect(existingWorkout?.id).toBe('workout-123') // Merged into the existing one
    
    // The new draftToSave should have both blocks combined
    expect(draftToSave.sourceWorkoutId).toBe('workout-123')
    expect(draftToSave.exerciseBlocks).toHaveLength(2)
    expect(draftToSave.exerciseBlocks[0].exerciseId).toBe('bench-press')
    expect(draftToSave.exerciseBlocks[1].exerciseId).toBe('cable-fly')
  })
})
