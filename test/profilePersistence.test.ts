import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ensureUserProfile } from '../src/firebase/firestore'
import { getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

// Mock Firebase config
vi.mock('../src/firebase/config', () => ({
  db: {}, // Mock DB object
  auth: {},
  googleProvider: {},
  isFirebaseConfigured: true,
}))

// Mock Firestore functions
vi.mock('firebase/firestore', () => {
  return {
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    serverTimestamp: vi.fn(() => 'mock-timestamp'),
    collection: vi.fn(),
    deleteDoc: vi.fn(),
    onSnapshot: vi.fn(),
    updateDoc: vi.fn(),
    Timestamp: {
      fromDate: vi.fn(),
    },
  }
})

describe('Profile Name Persistence (ensureUserProfile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('preserves existing custom display name if present in Firestore', async () => {
    const mockUid = 'user123'
    const mockAuthUser = {
      uid: mockUid,
      email: 'user@example.com',
      displayName: 'Google Default Name', // The name returned by Google
    } as any

    // Mock that the document already exists in Firestore with a custom name
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        email: 'user@example.com',
        displayName: 'Custom Athlete Name',
        preferredUnit: 'kg',
      }),
    } as any)

    await ensureUserProfile(mockUid, mockAuthUser)

    expect(setDoc).toHaveBeenCalledWith(
      undefined, // Because doc() returns undefined from our mock unless specifically mocked
      {
        email: 'user@example.com',
        displayName: 'Custom Athlete Name', // Preserved
        updatedAt: 'mock-timestamp',
      },
      { merge: true },
    )
  })

  it('uses Google display name if user document does not exist', async () => {
    const mockUid = 'user456'
    const mockAuthUser = {
      uid: mockUid,
      email: 'newuser@example.com',
      displayName: 'Google Profile Name',
    } as any

    // Mock that the document does not exist yet
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
    } as any)

    await ensureUserProfile(mockUid, mockAuthUser)

    expect(setDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        email: 'newuser@example.com',
        displayName: 'Google Profile Name',
        preferredUnit: 'lb',
        createdAt: 'mock-timestamp',
      })
    )
  })
})
