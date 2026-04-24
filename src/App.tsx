import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AppProvider, useAppContext } from './context/AppContext'
import { DraftResumeDialog, LoadingScreen } from './components'
import {
  HomePage,
  WorkoutEditorPage,
  ExerciseSearchPage,
  HistoryPage,
  SettingsPage,
  SignInPage,
  TemplatesPage,
  WorkoutDetailPage,
  ExerciseHistoryPage,
} from './pages'

function ProtectedRoutes() {
  const { session } = useAppContext()

  if (session.status === 'loading') {
    return <LoadingScreen />
  }

  if (session.status !== 'authenticated') {
    return <Navigate to="/sign-in" replace />
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/workouts/new" element={<WorkoutEditorPage mode="new" />} />
      <Route path="/workouts/:id/edit" element={<WorkoutEditorPage mode="edit" />} />
      <Route path="/exercise-search" element={<ExerciseSearchPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/workouts/:id" element={<WorkoutDetailPage />} />
      <Route path="/exercises/:id" element={<ExerciseHistoryPage />} />
      <Route path="/templates" element={<TemplatesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppRoutes() {
  const navigate = useNavigate()
  const { discardDraft, pendingDrafts, resumeDraft, session } = useAppContext()

  if (session.status === 'loading') {
    return <LoadingScreen />
  }

  return (
    <>
      <Routes>
        <Route
          path="/sign-in"
          element={session.status === 'authenticated' ? <Navigate to="/" replace /> : <SignInPage />}
        />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>

      {session.status === 'authenticated' && pendingDrafts.length > 0 ? (
        <DraftResumeDialog
          drafts={pendingDrafts}
          onResume={(draftRef) => {
            const route = resumeDraft(draftRef)
            if (route) {
              navigate(route)
            }
          }}
          onDiscard={discardDraft}
        />
      ) : null}
    </>
  )
}

function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}

export default App
