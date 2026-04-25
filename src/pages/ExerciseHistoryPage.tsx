import { Link, useParams } from 'react-router-dom'
import { AppShell, EmptyState, RawLineChart } from '../components'
import { useAppContext } from '../context/AppContext'
import { formatDateLabel, formatWeight, fromCanonicalKg, sortWorkoutsByDate } from '../utils/format'

export function ExerciseHistoryPage() {
  const params = useParams()
  const { getExercise, workouts, profile, muscleGroups } = useAppContext()
  const exercise = params.id ? getExercise(params.id) : null

  if (!exercise) {
    return (
      <AppShell activeTab="stats">
        <section className="page-stack">
          <div className="empty-state brutal-card">
            <h2>Exercise not found.</h2>
          </div>
        </section>
      </AppShell>
    )
  }

  const sessions = sortWorkoutsByDate(workouts).filter((workout) =>
    workout.exerciseBlocks.some((block) => block.exerciseId === exercise.id),
  )
  const primaryMuscle = muscleGroups.find((group) => group.id === exercise.primaryMuscleGroupId)?.name

  if (sessions.length === 0) {
    return (
      <AppShell activeTab="stats">
        <section className="page-stack">
          <EmptyState
            title="No exercise history yet."
            message="Log this movement once and its strength curve will show up here."
            actionLabel="Log This Exercise"
            actionTo="/workouts/new?step=log"
          />
        </section>
      </AppShell>
    )
  }

  const perSession = sessions.map((workout) => {
    const blocks = workout.exerciseBlocks.filter((block) => block.exerciseId === exercise.id)
    const flatSets = blocks.flatMap((block) => block.sets)
    const heaviestCanonicalKg = Math.max(...flatSets.map((setRow) => setRow.canonicalKg ?? 0))
    const highestReps = Math.max(...flatSets.map((setRow) => setRow.reps ?? 0))
    const totalVolumeKg = flatSets.reduce(
      (sum, setRow) => sum + (setRow.canonicalKg ?? 0) * (setRow.reps ?? 0),
      0,
    )

    return {
      workout,
      blocks,
      flatSets,
      heaviestCanonicalKg,
      highestReps,
      totalVolumeKg,
    }
  })

  const topHeaviest = Math.max(...perSession.map((session) => session.heaviestCanonicalKg))
  const topReps = Math.max(...perSession.map((session) => session.highestReps))
  const topVolume = Math.max(...perSession.map((session) => session.totalVolumeKg))
  const lastSession = perSession[0]

  const chartPoints = perSession
    .slice()
    .reverse()
    .map((session) => ({
      workoutDate: session.workout.workoutDate,
      heaviestWeightCanonicalKg: session.heaviestCanonicalKg,
      displayWeight: formatWeight(
        fromCanonicalKg(session.heaviestCanonicalKg, profile.preferredUnit),
        profile.preferredUnit,
      ),
    }))

  const totalVolume = perSession.reduce((sum, session) => sum + session.totalVolumeKg, 0)
  const last30Cutoff = new Date()
  last30Cutoff.setDate(last30Cutoff.getDate() - 30)
  const frequency30d = perSession.filter(
    (session) => new Date(session.workout.workoutDate).getTime() >= last30Cutoff.getTime(),
  ).length

  // Delta vs last session
  const deltaLabel = (() => {
    if (perSession.length < 2) return null
    const current = perSession[0].heaviestCanonicalKg
    const previous = perSession[1].heaviestCanonicalKg
    const diffKg = current - previous
    if (diffKg === 0) return null
    const diffDisplay = fromCanonicalKg(Math.abs(diffKg), profile.preferredUnit)
    const sign = diffKg > 0 ? '+' : '-'
    return `${sign}${formatWeight(diffDisplay, profile.preferredUnit)} vs last`
  })()

  // Streak: consecutive weeks with at least one session
  const computeStreak = () => {
    if (sessions.length === 0) return 0
    const now = new Date()
    const getWeekStart = (date: Date) => {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - d.getDay())
      return d.getTime()
    }
    const currentWeek = getWeekStart(now)
    const sessionWeeks = new Set(
      sessions.map((session) => getWeekStart(new Date(session.workoutDate)))
    )
    let streak = 0
    let week = currentWeek
    const oneWeek = 7 * 24 * 60 * 60 * 1000
    while (sessionWeeks.has(week)) {
      streak++
      week -= oneWeek
    }
    return streak
  }
  const streak = computeStreak()

  // Consistency: sessions in last 30 days as a percentage of expected (4 sessions)
  const consistencyScore = Math.min(Math.round((frequency30d / 4) * 100), 100)

  return (
    <AppShell activeTab="stats">
      <section className="page-stack">
        <div className="tag-row">
          <span className="tag">[{primaryMuscle}]</span>
        </div>

        <section className="detail-hero">
          <div>
            <p className="eyebrow">Exercise History</p>
            <h1>{exercise.name}</h1>
            {deltaLabel ? (
              <p className={`delta-badge ${deltaLabel.startsWith('+') ? 'delta-badge--up' : 'delta-badge--down'}`}>
                {deltaLabel}
              </p>
            ) : null}
          </div>
          <Link to="/workouts/new?step=log" className="fab-mini brutal-button brutal-button--primary">
            +
          </Link>
        </section>

        <section className="stats-grid">
          <article className="stat-card brutal-card">
            <span>All-Time 1RM</span>
            <strong>{formatWeight(fromCanonicalKg(topHeaviest, profile.preferredUnit), profile.preferredUnit)}</strong>
          </article>
          <article className="stat-card brutal-card">
            <span>Last Session</span>
            <strong>
              {formatWeight(
                fromCanonicalKg(lastSession.heaviestCanonicalKg, profile.preferredUnit),
                profile.preferredUnit,
              )}
            </strong>
          </article>
          <article className="stat-card brutal-card">
            <span>Streak</span>
            <strong>{streak} {streak === 1 ? 'week' : 'weeks'} 🔥</strong>
          </article>
          <article className="stat-card brutal-card">
            <span>Consistency</span>
            <strong>{consistencyScore}%</strong>
          </article>
          <article className="stat-card brutal-card">
            <span>Total Volume</span>
            <strong>
              {formatWeight(fromCanonicalKg(totalVolume, profile.preferredUnit), profile.preferredUnit)}
            </strong>
          </article>
          <article className="stat-card brutal-card">
            <span>Freq (30D)</span>
            <strong>{frequency30d} sessions</strong>
          </article>
        </section>

        <section className="chart-card brutal-card">
          <div className="chart-card__header">
            <h2>Progress Over Time</h2>
          </div>
          <RawLineChart points={chartPoints} />
        </section>

        <section className="section-stack">
          <div className="section-heading">
            <h2>Past Sessions</h2>
          </div>
          <div className="card-stack">
            {perSession.map((session) => {
              const heaviest = session.heaviestCanonicalKg === topHeaviest
              const repsPR = session.highestReps === topReps
              const volumePR = session.totalVolumeKg === topVolume
              const setValues = session.flatSets
                .map((setRow) =>
                  fromCanonicalKg(setRow.canonicalKg, profile.preferredUnit)?.toString() ?? '--',
                )
                .join(', ')

              return (
                <article key={session.workout.id} className="session-card brutal-card">
                  <div className="session-card__date">{formatDateLabel(session.workout.workoutDate)}</div>
                  <div className="session-card__body">
                    <div>
                      <strong>
                        {formatWeight(
                          fromCanonicalKg(session.heaviestCanonicalKg, profile.preferredUnit),
                          profile.preferredUnit,
                        )}
                        {' x '}
                        {session.highestReps}
                      </strong>
                      <p>
                        {session.flatSets.length} sets • {setValues}
                      </p>
                    </div>

                    <div className="tag-row">
                      {heaviest ? <span className="mini-pr">Heaviest</span> : null}
                      {repsPR ? <span className="mini-pr">Most Reps</span> : null}
                      {volumePR ? <span className="mini-pr">Top Volume</span> : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </section>
    </AppShell>
  )
}
