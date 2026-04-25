import { useState } from 'react'
import type { ExerciseHistoryPoint } from '../types'
import { formatDateLabel } from '../utils/format'

interface RawLineChartProps {
  points: ExerciseHistoryPoint[]
}

export function RawLineChart({ points }: RawLineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (points.length === 0) {
    return <div className="chart-empty">Log this exercise to start the timeline.</div>
  }

  const ordered = [...points].sort(
    (left, right) => new Date(left.workoutDate).getTime() - new Date(right.workoutDate).getTime(),
  )
  const weights = ordered.map((point) => point.heaviestWeightCanonicalKg)
  const max = Math.max(...weights)
  const min = Math.min(...weights)
  const range = Math.max(max - min, 1)

  const padTop = 18
  const padBottom = 28
  const padLeft = 6
  const padRight = 6
  const chartHeight = 100
  const chartWidth = 100

  const getX = (index: number) =>
    ordered.length === 1
      ? 50
      : padLeft + (index / (ordered.length - 1)) * (chartWidth - padLeft - padRight)

  const getY = (value: number) => {
    const normalized = (value - min) / range
    return chartHeight - padBottom - normalized * (chartHeight - padTop - padBottom)
  }

  const maxIndex = weights.indexOf(max)
  const minIndex = weights.lastIndexOf(min)

  const polylinePoints = ordered
    .map((_, index) => `${getX(index)},${getY(weights[index])}`)
    .join(' ')

  // Axis label values
  const firstDate = formatDateLabel(ordered[0].workoutDate)
  const lastDate = formatDateLabel(ordered[ordered.length - 1].workoutDate)

  return (
    <div className="raw-chart">
      {/* Y-axis labels */}
      <div className="chart-y-axis">
        <span>{ordered[maxIndex].displayWeight}</span>
        <span>{ordered[minIndex === maxIndex ? 0 : minIndex].displayWeight}</span>
      </div>

      {/* SVG Chart */}
      <div className="chart-svg-wrap">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" aria-label="Heaviest set over time">
          {/* Grid lines */}
          <line x1={padLeft} y1={getY(max)} x2={chartWidth - padRight} y2={getY(max)} stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
          <line x1={padLeft} y1={getY(min)} x2={chartWidth - padRight} y2={getY(min)} stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />

          {/* Line */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#000000"
            strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data points */}
          {ordered.map((point, index) => {
            const x = getX(index)
            const y = getY(weights[index])
            const isLast = index === ordered.length - 1
            const isMax = index === maxIndex
            const isMin = index === minIndex && minIndex !== maxIndex

            return (
              <g key={`${point.workoutDate}-${index}`}>
                {/* Invisible larger hit area for hover */}
                <circle
                  cx={x}
                  cy={y}
                  r={5}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onTouchStart={() => setHoveredIndex(index)}
                  onTouchEnd={() => setHoveredIndex(null)}
                  style={{ cursor: 'pointer' }}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={isMax || isMin ? 3 : isLast ? 2.8 : 2.1}
                  fill={isMax ? '#22c55e' : isMin ? '#f97316' : isLast ? '#ff5f5f' : '#000000'}
                  stroke="#000000"
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="none"
                />
                {/* Max/Min labels */}
                {isMax ? (
                  <text x={x} y={y - 5} textAnchor="middle" fontSize="3.2" fontWeight="700" fill="#22c55e" fontFamily="Space Grotesk, monospace">MAX</text>
                ) : null}
                {isMin ? (
                  <text x={x} y={y + 8} textAnchor="middle" fontSize="3.2" fontWeight="700" fill="#f97316" fontFamily="Space Grotesk, monospace">MIN</text>
                ) : null}
              </g>
            )
          })}
        </svg>

        {/* Tooltip */}
        {hoveredIndex !== null ? (
          <div
            className="chart-tooltip brutal-card"
            style={{
              left: `${(getX(hoveredIndex) / chartWidth) * 100}%`,
              bottom: `${((chartHeight - getY(weights[hoveredIndex])) / chartHeight) * 100 + 8}%`,
            }}
          >
            <strong>{ordered[hoveredIndex].displayWeight}</strong>
            <span>{formatDateLabel(ordered[hoveredIndex].workoutDate)}</span>
          </div>
        ) : null}

        {/* X-axis labels */}
        <div className="chart-x-axis">
          <span>{firstDate}</span>
          {ordered.length > 1 ? <span>{lastDate}</span> : null}
        </div>
      </div>
    </div>
  )
}
