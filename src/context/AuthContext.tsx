/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
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
  defaultProfileFromAuthUser,
  ensureUserProfile,
  noopUnsubscribe,
  saveProfilePatch,
  subscribeToProfile,
} from '../firebase/firestore'
import { defaultProfile } from '../data/mockData'
import type { AuthSession, UserProfile } from '../types'
import { clearAllDraftsForUser } from '../utils/drafts'

interface AuthContextValue {
  session: AuthSession
  authError: string | null
  isFirebaseConfigured: boolean
  firebaseSetupMessage: string | null
  profile: UserProfile
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearAuthError: () => void
  updateProfile: (patch: Partial<Pick<UserProfile, 'displayName' | 'preferredUnit'>>) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

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

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession>({
    status: isFirebaseConfigured ? 'loading' : 'signed_out',
  })
  const [authError, setAuthError] = useState<string | null>(firebaseSetupMessage)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const profileSubRef = useRef<Unsubscribe>(noopUnsubscribe)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return noopUnsubscribe
    }

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      profileSubRef.current()

      if (!user) {
        setSession({ status: 'signed_out' })
        setProfile(defaultProfile)
        return
      }

      setSession({ status: 'authenticated', uid: user.uid })
      setProfile(defaultProfileFromAuthUser(user))

      try {
        await ensureUserProfile(user.uid, user)
      } catch (error) {
        setAuthError(formatAuthError(error))
      }

      profileSubRef.current = subscribeToProfile(user.uid, setProfile)
    })

    return () => {
      authUnsubscribe()
      profileSubRef.current()
    }
  }, [])

  const signInWithGoogle = async () => {
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

  const signOut = async () => {
    if (!auth || session.status !== 'authenticated' || !session.uid) {
      return
    }

    clearAllDraftsForUser(session.uid)
    profileSubRef.current()
    await firebaseSignOut(auth)
  }

  const updateProfile = async (patch: Partial<Pick<UserProfile, 'displayName' | 'preferredUnit'>>) => {
    if (session.status !== 'authenticated' || !session.uid) {
      return
    }

    setProfile((previous) => ({ ...previous, ...patch }))
    await saveProfilePatch(session.uid, patch)
  }

  const value: AuthContextValue = {
    session,
    authError,
    isFirebaseConfigured,
    firebaseSetupMessage,
    profile,
    signInWithGoogle,
    signOut,
    clearAuthError: () => setAuthError(null),
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
