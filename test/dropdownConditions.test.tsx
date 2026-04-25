import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ExerciseSearchPage } from '../src/pages/ExerciseSearchPage'
import * as AppContextModule from '../src/context/AppContext'

// Mock the context entirely for this isolated component test
vi.mock('../src/context/AppContext', () => ({
  useAppContext: vi.fn(),
}))

const mockMuscleGroups = [
  { id: 'chest', name: 'Chest', sizeCategory: 'major' },
  { id: 'back', name: 'Back', sizeCategory: 'major' },
  { id: 'legs', name: 'Legs', sizeCategory: 'major' },
]

describe('ExerciseSearchPage - Dropdown Conditions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hides the dropdown when exactly one muscle group is selected', () => {
    vi.mocked(AppContextModule.useAppContext).mockReturnValue({
      muscleGroups: mockMuscleGroups,
      createCustomExercise: vi.fn(),
      getDraft: () => ({
        muscleGroupIds: ['chest'], // Exactly one
        exerciseBlocks: [],
      }),
    } as any)

    render(
      <MemoryRouter>
        <ExerciseSearchPage />
      </MemoryRouter>
    )

    // The select should not be in the document
    expect(screen.queryByLabelText(/Primary Muscle Group/i)).not.toBeInTheDocument()
  })

  it('shows the dropdown with restricted options when multiple muscle groups are selected', () => {
    vi.mocked(AppContextModule.useAppContext).mockReturnValue({
      muscleGroups: mockMuscleGroups,
      createCustomExercise: vi.fn(),
      getDraft: () => ({
        muscleGroupIds: ['chest', 'back'], // Multiple
        exerciseBlocks: [],
      }),
    } as any)

    render(
      <MemoryRouter>
        <ExerciseSearchPage />
      </MemoryRouter>
    )

    // The select should be visible
    const dropdown = screen.getByLabelText(/Primary Muscle Group/i) as HTMLSelectElement
    expect(dropdown).toBeInTheDocument()

    // It should only have 'chest' and 'back' options, NOT 'legs'
    const options = Array.from(dropdown.options).map((opt) => opt.value)
    expect(options).toEqual(['chest', 'back'])
    expect(options).not.toContain('legs')
  })
})
