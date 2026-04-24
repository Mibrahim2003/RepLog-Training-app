import { useAppContext } from '../context/AppContext'

export function SignInPage() {
  const { authError, clearAuthError, firebaseSetupMessage, isFirebaseConfigured, signInWithGoogle } =
    useAppContext()

  const handleSignIn = async () => {
    clearAuthError()
    await signInWithGoogle()
  }

  return (
    <div className="sign-in-page">
      <section className="sign-in-card brutal-card">
        <p className="eyebrow">Workout Logbook</p>
        <h1 className="sign-in-title">RepLog</h1>
        <p className="sign-in-copy">
          Fast, raw, and built for post-gym logging without the clutter.
        </p>

        {authError ? <p className="auth-error">{authError}</p> : null}
        {!isFirebaseConfigured && firebaseSetupMessage ? (
          <p className="muted-copy">{firebaseSetupMessage}</p>
        ) : null}

        <button
          type="button"
          className="brutal-button brutal-button--primary brutal-button--full"
          onClick={handleSignIn}
          disabled={!isFirebaseConfigured}
        >
          Sign in with Google
        </button>
      </section>
    </div>
  )
}
