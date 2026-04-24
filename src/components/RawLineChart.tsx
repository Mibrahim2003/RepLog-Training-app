import type { ExerciseHistoryPoint } from '../types'

interface RawLineChartProps {
  points: ExerciseHistoryPoint[]
}

export function RawLineChart({ points }: RawLineChartProps) {
  if (points.length === 0) {
    return <div className="chart-empty">Log this exercise to start the timeline.</div>
  }

  const ordered = [...points].sort(
    (left, right) => new Date(left.workoutDate).getTime() - new Date(right.workoutDate).getTime(),
  )
  const max = Math.max(...ordered.map((point) => point.heaviestWeightCanonicalKg))
  const min = Math.min(...ordered.map((point) => point.heaviestWeightCanonicalKg))
  const range = Math.max(max - min, 1)

  const polylinePoints = ordered
    .map((point, index) => {
      const x = ordered.length === 1 ? 50 : (index / (ordered.length - 1)) * 100
      const normalized = (point.heaviestWeightCanonicalKg - min) / range
      const y = 86 - normalized * 58
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="raw-chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Heaviest set over time">
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#000000"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
        />
        {ordered.map((point, index) => {
          const x = ordered.length === 1 ? 50 : (index / (ordered.length - 1)) * 100
          const normalized = (point.heaviestWeightCanonicalKg - min) / range
          const y = 86 - normalized * 58
          const isLast = index === ordered.length - 1

          return (
            <circle
              key={`${point.workoutDate}-${index}`}
              cx={x}
              cy={y}
              r={isLast ? 2.8 : 2.1}
              fill={isLast ? '#ff5f5f' : '#000000'}
              stroke="#000000"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>
    </div>
  )
}
