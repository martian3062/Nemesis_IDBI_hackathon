export function Sparkline({ points }: { points: number[] }) {
  const width = 260
  const height = 86
  const min = Math.min(...points) - 8
  const max = Math.max(...points) + 8
  const coords = points.map((point, index) => {
    const x = (index / (points.length - 1)) * width
    const y = height - ((point - min) / (max - min)) * height
    return `${x},${y}`
  })
  const areaCoords = `0,${height} ${coords.join(' ')} ${width},${height}`

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img">
      <title>Cashflow trend</title>
      <defs>
        <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaCoords} fill="url(#sparkline-fill)" stroke="none" />
      <polyline points={coords.join(' ')} />
      {points.map((point, index) => {
        const x = (index / (points.length - 1)) * width
        const y = height - ((point - min) / (max - min)) * height
        return <circle key={`${point}-${index}`} cx={x} cy={y} r="3" />
      })}
    </svg>
  )
}
