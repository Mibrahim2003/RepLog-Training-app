import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProvider, useAppContext } from '../src/context/AppContext'
import { WorkoutEditorPage } from '../src/pages/WorkoutEditorPage'

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
    cb([])
    return () => {}
  }),
  subscribeToCustomExercises: vi.fn(() => () => {}),
  upsertWorkout: vi.fn(),
  defaultProfileFromAuthUser: vi.fn(() => ({ preferredUnit: 'lb' })),
  noopUnsubscribe: vi.fn(),
}))

// Mock firebase auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb({ uid: 'test-user-id' })
    return () => {}
  }),
}))

// A helper component to seed the draft into the context before we render the editor
const SeedDraftHelper = () => {
  const { ensureNewDraft, addExerciseToDraft } = useAppContext()
  
  return (
    <button onClick={() => {
      ensureNewDraft()
      addExerciseToDraft({ kind: 'new' }, 'bench-press')
    }}>
      Seed Draft
    </button>
  )
}

describe('Undo Flows & Destructive Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows confirmation modal, deletes exercise on confirm, and restores on undo', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/workouts/new?step=log']}>
        <AppProvider>
          <Routes>
            <Route path="/workouts/new" element={
              <>
                <SeedDraftHelper />
                <WorkoutEditorPage mode="new" />
              </>
            } />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    )

    // Seed the draft
    await user.click(screen.getByText('Seed Draft'))

    // The exercise should be visible
    expect(await screen.findByText('Bench Press')).toBeInTheDocument()

    // 1. Click delete exercise block
    const deleteBlockBtn = screen.getByRole('button', { name: /Remove Bench Press/i })
    await user.click(deleteBlockBtn)

    // 2. Assert confirmation modal appears
    const confirmModal = screen.getByRole('dialog')
    expect(confirmModal).toBeInTheDocument()
    expect(screen.getByText(/This removes the exercise and all its sets/i)).toBeInTheDocument()

    // 3. Confirm deletion
    const confirmBtn = within(confirmModal).getByRole('button', { name: 'Delete' })
    await user.click(confirmBtn)

    // Wait for the exercise to disappear
    expect(screen.queryByText('Bench Press')).not.toBeInTheDocument()

    // 4. Assert undo snackbar appears
    const undoSnackbar = await screen.findByRole('status')
    expect(undoSnackbar).toBeInTheDocument()
    expect(screen.getByText(/Exercise block deleted/i)).toBeInTheDocument()

    // 5. Click undo
    const undoBtn = screen.getByRole('button', { name: /undo/i })
    await user.click(undoBtn)

    // The exercise block should be restored
    expect(await screen.findByText('Bench Press')).toBeInTheDocument()
  })
})
