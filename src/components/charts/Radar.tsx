import { motion } from 'framer-motion'
import type { Dimension } from '../../types'

export function Radar({ dimensions }: { dimensions: Dimension[] }) {
  const size = 260
  const center = size / 2
  const radius = 98
  const points = dimensions.map((dimension, index) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2
    const distance = (dimension.value / 100) * radius
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
      labelX: center + Math.cos(angle) * (radius + 24),
      labelY: center + Math.sin(angle) * (radius + 24),
      short: dimension.label
        .split(' ')
        .map((word) => word[0])
        .join(''),
    }
  })

  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} role="img">
      <title>Six dimension MSME score radar</title>
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          className="radar-grid"
          points={dimensions
            .map((_, index) => {
              const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2
              return `${center + Math.cos(angle) * radius * scale},${
                center + Math.sin(angle) * radius * scale
              }`
            })
            .join(' ')}
        />
      ))}
      {points.map((point, index) => (
        <line
          key={`axis-${index}`}
          className="radar-axis"
          x1={center}
          y1={center}
          x2={point.labelX}
          y2={point.labelY}
        />
      ))}
      <motion.polygon
        className="radar-score"
        animate={{ points: points.map((point) => `${point.x},${point.y}`).join(' ') }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        initial={false}
      />
      {points.map((point, index) => (
        <text key={`label-${index}`} x={point.labelX} y={point.labelY} textAnchor="middle">
          {point.short}
        </text>
      ))}
    </svg>
  )
}
