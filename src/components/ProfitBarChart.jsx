function formatDayLabel(dateKey) {
  const [, month, day] = dateKey.split('-')
  return `${day}/${month}`
}

function ProfitBarChart({ days, selectedDate, onSelectDate }) {
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : 1))
  const maxAbs = Math.max(1, ...sorted.map((d) => Math.abs(d.profit)))

  const barWidth = 20
  // O rótulo de data ("DD/MM") embaixo de cada barra precisa de mais espaço horizontal
  // do que a barra em si — um gap pequeno faz os rótulos de barras vizinhas colidirem.
  const gap = 20
  const chartHeight = 140
  const baselineY = chartHeight / 2
  const armHeight = chartHeight / 2 - 12
  const showAllLabels = sorted.length <= 10

  // O rótulo (e o anel de seleção) são mais largos que a barra e ficam centralizados nela,
  // então a primeira e a última barra "vazam" pra fora do SVG sem essa margem interna.
  const sidePadding = 16
  const width = sorted.length * (barWidth + gap) + sidePadding * 2

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${chartHeight + 20}`} width={width} height={chartHeight + 20} className="block">
        <line x1={0} y1={baselineY} x2={width} y2={baselineY} className="stroke-border" strokeWidth={1} />

        {sorted.map((day, index) => {
          const barHeight = Math.max((Math.abs(day.profit) / maxAbs) * armHeight, 1)
          const x = sidePadding + index * (barWidth + gap)
          const isPositive = day.profit >= 0
          const y = isPositive ? baselineY - barHeight : baselineY
          const isSelected = day.date === selectedDate
          const showLabel = showAllLabels || index === 0 || index === sorted.length - 1 || index % 5 === 0

          return (
            <g key={day.date} className="cursor-pointer" onClick={() => onSelectDate(day.date)}>
              <title>{`${formatDayLabel(day.date)}: ${day.profit.toLocaleString('pt-BR')}`}</title>

              {isSelected && (
                <rect
                  x={x - 2}
                  y={y - 2}
                  width={barWidth + 4}
                  height={barHeight + 4}
                  rx={6}
                  className="fill-none stroke-accent"
                  strokeWidth={2}
                />
              )}

              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                className={isPositive ? 'fill-gold' : 'fill-danger'}
                opacity={isSelected ? 1 : 0.75}
              />

              {showLabel && (
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 14}
                  textAnchor="middle"
                  fontSize={10}
                  className="fill-text-subtle"
                >
                  {formatDayLabel(day.date)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default ProfitBarChart
