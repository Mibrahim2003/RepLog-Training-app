import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell, ConfirmActionDialog, ExerciseBlockCard, UndoSnackbar } from '../components'
import { useAppContext } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { formatLongDate } from '../utils/format'
import { saveDeletionBackup } from '../utils/backups'
import type { Workout } from '../types'

export function WorkoutDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const { getWorkout, muscleGroups, profile, deleteWorkout, restoreWorkout } = useAppContext()
  const { showToast } = useToast()
  const workout = params.id ? getWorkout(params.id) : null
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [undoWorkout, setUndoWorkout] = useState<Workout | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current)
      }
    }
  }, [])

  const muscleNames = useMemo(
    () =>
      (workout ?? undoWorkout)?.muscleGroupIds
        .map((muscleId) => muscleGroups.find((group) => group.id === muscleId)?.name)
        .filter(Boolean) as string[],
    [muscleGroups, undoWorkout, workout],
  )

  const clearUndo = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }
    setUndoWorkout(null)
  }

  const queueUndo = (snapshot: Workout) => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
    }

    setUndoWorkout(snapshot)
    undoTimerRef.current = setTimeout(() => {
      setUndoWorkout(null)
      undoTimerRef.current = null
      navigate('/history')
    }, 7000)
  }

  const handleDeleteWorkout = () => {
    if (!workout) {
      return
    }

    const snapshot = JSON.parse(JSON.stringify(workout)) as Workout
    void (async () => {
      try {
        saveDeletionBackup('workout', { workout: snapshot })
        await deleteWorkout(workout.id)
        setConfirmDeleteOpen(false)
        showToast('Workout deleted')
        queueUndo(snapshot)
      } catch {
        setConfirmDeleteOpen(false)
        showToast("Couldn't delete — try again", 'error')
      }
    })()
  }

  if (!workout && !undoWorkout) {
    return (
      <AppShell activeTab="stats">
        <section className="page-stack">
          <div className="empty-state brutal-card">
            <h2>Workout not found.</h2>
          </div>
        </section>
      </AppShell>
    )
  }

  const activeWorkout = workout ?? undoWorkout
  if (!activeWorkout) {
    return null
  }

  return (
    <AppShell activeTab="stats">
      <section className="page-stack">
        <section className="detail-hero">
          <div>
            <p className="eyebrow">Workout Detail</p>
            <h1>{activeWorkout.title}</h1>
            <p>
              {formatLongDate(activeWorkout.workoutDate)}
            </p>
          </div>

          <div className="detail-actions">
            <button
              type="button"
              className="brutal-button brutal-button--primary"
              onClick={() => navigate(`/workouts/${activeWorkout.id}/edit`)}
              disabled={!workout}
            >
              Edit
            </button>
            <button
              type="button"
              className="brutal-button brutal-button--secondary"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={!workout}
            >
              Delete
            </button>
          </div>
        </section>

        <div className="tag-row">
          {muscleNames.map((name) => (
            <span key={name} className="tag">
              [{name}]
            </span>
          ))}
        </div>

        <div className="card-stack">
          {activeWorkout.exerciseBlocks.map((block) => (
            <ExerciseBlockCard
              key={block.workoutExerciseId}
              block={block}
              preferredUnit={profile.preferredUnit}
              historyHref={`/exercises/${block.exerciseId}`}
            />
          ))}
        </div>

        {confirmDeleteOpen ? (
          <ConfirmActionDialog
            title="Delete workout?"
            message="This workout will be removed. You can undo for a few seconds right after deleting."
            confirmLabel="Delete"
            onCancel={() => setConfirmDeleteOpen(false)}
            onConfirm={handleDeleteWorkout}
          />
        ) : null}

        {undoWorkout ? (
          <UndoSnackbar
            message="Workout deleted."
            onUndo={() => {
              void (async () => {
                try {
                  await restoreWorkout(undoWorkout)
                  showToast('Workout restored')
                  clearUndo()
                } catch {
                  showToast("Couldn't restore — try again", 'error')
                }
              })()
            }}
            onDismiss={() => {
              clearUndo()
              navigate('/history')
            }}
          />
        ) : null}
      </section>
    </AppShell>
  )
}
