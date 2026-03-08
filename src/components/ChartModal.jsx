import React, { useState, useRef, useEffect } from 'react'
import { useGym } from '../context/GymContext.jsx'
import { get1RMHistory, getAllExerciseNames, getVolumeHistory, formatDateShort } from '../utils/calculations.js'

const CHART_MODES = { RM: '1RM', VOLUME: 'Volume' }

export default function ChartModal({ initialExercise, onClose }) {
  const { state } = useGym()
  const [mode, setMode] = useState(initialExercise ? CHART_MODES.RM : CHART_MODES.RM)
  const [selectedExercise, setSelectedExercise] = useState(initialExercise || '')
  const allNames = getAllExerciseNames(state.weeks)

  const rmData = selectedExercise
    ? get1RMHistory(state.weeks, selectedExercise)
    : []

  const volumeData = getVolumeHistory(state.weeks)

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>PROGRESS</div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Mode tabs */}
        <div style={styles.tabs}>
          {Object.values(CHART_MODES).map(m => (
            <button
              key={m}
              style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}
              onClick={() => setMode(m)}
            >
              {m}
            </button>
          ))}
        </div>

        {/* 1RM mode */}
        {mode === CHART_MODES.RM && (
          <>
            <div style={styles.exSelector}>
              <select
                style={styles.select}
                value={selectedExercise}
                onChange={e => setSelectedExercise(e.target.value)}
              >
                <option value="">— select exercise —</option>
                {allNames.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {!selectedExercise && (
              <div style={styles.placeholder}>Select an exercise to see its 1RM history</div>
            )}

            {selectedExercise && rmData.length === 0 && (
              <div style={styles.placeholder}>No data yet for {selectedExercise}</div>
            )}

            {selectedExercise && rmData.length > 0 && (
              <LineChart
                data={rmData.map(p => ({ x: p.date, y: p.rm, label: `${p.rm}kg` }))}
                unit="kg"
                color="var(--accent)"
              />
            )}
          </>
        )}

        {/* Volume mode */}
        {mode === CHART_MODES.VOLUME && (
          <>
            {volumeData.length === 0 && (
              <div style={styles.placeholder}>No volume data yet</div>
            )}
            {volumeData.length > 0 && (
              <BarChart
                data={volumeData.map(w => ({ x: w.name, y: w.volume, label: `${(w.volume / 1000).toFixed(1)}t` }))}
                unit="kg"
                color="#4a9eff"
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Line chart (for 1RM history) ──────────────────────────────────────────
function LineChart({ data, unit, color }) {
  const W = 340
  const H = 200
  const PAD = { top: 24, right: 20, bottom: 40, left: 48 }
  const [tooltip, setTooltip] = useState(null)

  if (data.length < 1) return null

  const xs = data.map((_, i) => i)
  const ys = data.map(d => d.y)
  const minY = Math.floor(Math.min(...ys) * 0.95)
  const maxY = Math.ceil(Math.max(...ys) * 1.05)
  const rangeX = data.length - 1 || 1
  const rangeY = maxY - minY || 1

  function toSvgX(i) {
    return PAD.left + (i / rangeX) * (W - PAD.left - PAD.right)
  }
  function toSvgY(val) {
    return PAD.top + (1 - (val - minY) / rangeY) * (H - PAD.top - PAD.bottom)
  }

  const points = data.map((d, i) => `${toSvgX(i)},${toSvgY(d.y)}`).join(' ')
  const areaPoints = [
    `${toSvgX(0)},${H - PAD.bottom}`,
    ...data.map((d, i) => `${toSvgX(i)},${toSvgY(d.y)}`),
    `${toSvgX(data.length - 1)},${H - PAD.bottom}`,
  ].join(' ')

  // Y-axis ticks
  const yTicks = 4
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round(minY + (i / yTicks) * rangeY)
  )

  // X-axis labels: show first, last, and middle if > 4 points
  const xLabelIndices = data.length <= 4
    ? data.map((_, i) => i)
    : [0, Math.floor(data.length / 2), data.length - 1]

  return (
    <div style={styles.chartWrap}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ overflow: 'visible' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid lines */}
        {tickVals.map(v => (
          <line
            key={v}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={toSvgY(v)}
            y2={toSvgY(v)}
            stroke="var(--border)"
            strokeWidth="1"
          />
        ))}

        {/* Y-axis labels */}
        {tickVals.map(v => (
          <text
            key={v}
            x={PAD.left - 6}
            y={toSvgY(v) + 4}
            textAnchor="end"
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--font-mono)"
          >{v}</text>
        ))}

        {/* X-axis labels */}
        {xLabelIndices.map(i => (
          <text
            key={i}
            x={toSvgX(i)}
            y={H - PAD.bottom + 16}
            textAnchor="middle"
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--font-mono)"
          >{formatDateShort(data[i].x)}</text>
        ))}

        {/* Area fill */}
        <polygon points={areaPoints} fill={color} fillOpacity="0.08" />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points + hover targets */}
        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={toSvgX(i)}
              cy={toSvgY(d.y)}
              r="4"
              fill={color}
              stroke="var(--bg)"
              strokeWidth="2"
            />
            {/* Invisible larger hit area */}
            <circle
              cx={toSvgX(i)}
              cy={toSvgY(d.y)}
              r="12"
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip({ i, x: toSvgX(i), y: toSvgY(d.y), d })}
              onTouchStart={() => setTooltip({ i, x: toSvgX(i), y: toSvgY(d.y), d })}
            />
          </g>
        ))}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect
              x={Math.min(tooltip.x - 30, W - PAD.right - 60)}
              y={tooltip.y - 36}
              width="60"
              height="24"
              rx="4"
              fill="var(--card)"
              stroke="var(--border-light)"
            />
            <text
              x={Math.min(tooltip.x - 30, W - PAD.right - 60) + 30}
              y={tooltip.y - 20}
              textAnchor="middle"
              fontSize="11"
              fill="var(--text)"
              fontFamily="var(--font-mono)"
              fontWeight="600"
            >{tooltip.d.label}</text>
          </g>
        )}
      </svg>

      {/* Stats below chart */}
      <div style={styles.chartStats}>
        <ChartStat label="FIRST" value={`${data[0].y}kg`} />
        <ChartStat label="BEST" value={`${Math.max(...data.map(d => d.y))}kg`} highlight />
        <ChartStat label="LAST" value={`${data[data.length - 1].y}kg`} />
        <ChartStat
          label="GAIN"
          value={`+${data[data.length - 1].y - data[0].y}kg`}
          highlight={data[data.length - 1].y > data[0].y}
        />
      </div>
    </div>
  )
}

// ── Bar chart (for weekly volume) ─────────────────────────────────────────
function BarChart({ data, color }) {
  const W = 340
  const H = 200
  const PAD = { top: 20, right: 16, bottom: 44, left: 52 }
  const [tooltip, setTooltip] = useState(null)

  if (!data.length) return null

  const ys = data.map(d => d.y)
  const maxY = Math.ceil(Math.max(...ys) * 1.1)
  const barW = Math.min(32, (W - PAD.left - PAD.right) / data.length - 4)

  function toSvgY(val) {
    return PAD.top + (1 - val / maxY) * (H - PAD.top - PAD.bottom)
  }
  function toSvgX(i) {
    const spacing = (W - PAD.left - PAD.right) / data.length
    return PAD.left + spacing * i + spacing / 2
  }

  const yTicks = 4
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((i / yTicks) * maxY)
  )

  return (
    <div style={styles.chartWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}
        onMouseLeave={() => setTooltip(null)}>

        {/* Grid */}
        {tickVals.map(v => (
          <line key={v} x1={PAD.left} x2={W - PAD.right}
            y1={toSvgY(v)} y2={toSvgY(v)}
            stroke="var(--border)" strokeWidth="1" />
        ))}

        {/* Y labels */}
        {tickVals.map(v => (
          <text key={v} x={PAD.left - 6} y={toSvgY(v) + 4}
            textAnchor="end" fontSize="10"
            fill="var(--text-dim)" fontFamily="var(--font-mono)">
            {v >= 1000 ? `${(v / 1000).toFixed(1)}t` : v}
          </text>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const x = toSvgX(i)
          const y = toSvgY(d.y)
          const bh = H - PAD.bottom - y
          return (
            <g key={i}>
              <rect
                x={x - barW / 2} y={y}
                width={barW} height={bh}
                rx="2"
                fill={color} fillOpacity={tooltip?.i === i ? 1 : 0.7}
                style={{ transition: 'fill-opacity 100ms' }}
              />
              <text x={x} y={H - PAD.bottom + 14}
                textAnchor="middle" fontSize="9"
                fill="var(--text-dim)" fontFamily="var(--font-mono)">
                {d.x.replace('Week ', 'W')}
              </text>
              {/* Hit area */}
              <rect
                x={x - barW / 2 - 4} y={PAD.top}
                width={barW + 8} height={H - PAD.top - PAD.bottom}
                fill="transparent" style={{ cursor: 'pointer' }}
                onMouseEnter={() => setTooltip({ i, d })}
                onTouchStart={() => setTooltip({ i, d })}
              />
            </g>
          )
        })}

        {/* Tooltip */}
        {tooltip && (() => {
          const x = toSvgX(tooltip.i)
          const y = toSvgY(tooltip.d.y) - 10
          return (
            <g>
              <rect x={x - 30} y={y - 22} width="60" height="20" rx="4"
                fill="var(--card)" stroke="var(--border-light)" />
              <text x={x} y={y - 8} textAnchor="middle" fontSize="11"
                fill="var(--text)" fontFamily="var(--font-mono)" fontWeight="600">
                {tooltip.d.label}
              </text>
            </g>
          )
        })()}
      </svg>

      <div style={styles.chartStats}>
        <ChartStat label="WEEKS" value={data.length} />
        <ChartStat label="BEST" value={`${(Math.max(...ys) / 1000).toFixed(1)}t`} highlight />
        <ChartStat label="TOTAL" value={`${(ys.reduce((a, b) => a + b, 0) / 1000).toFixed(1)}t`} />
        <ChartStat label="AVG/WK" value={`${(ys.reduce((a, b) => a + b, 0) / ys.length / 1000).toFixed(1)}t`} />
      </div>
    </div>
  )
}

function ChartStat({ label, value, highlight }) {
  return (
    <div style={styles.chartStat}>
      <div style={{ ...styles.chartStatVal, color: highlight ? 'var(--accent)' : 'var(--text)' }}>
        {value}
      </div>
      <div style={styles.chartStatLabel}>{label}</div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  modal: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderTopLeftRadius: '14px',
    borderTopRightRadius: '14px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '85vh',
    overflowY: 'auto',
    paddingBottom: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 18px 12px',
    borderBottom: '1px solid var(--border)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '22px',
    letterSpacing: '3px',
  },
  closeBtn: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  tabs: {
    display: 'flex',
    padding: '10px 16px 0',
    gap: '6px',
    borderBottom: '1px solid var(--border)',
  },
  tab: {
    padding: '8px 18px',
    borderRadius: 'var(--radius) var(--radius) 0 0',
    fontSize: '13px',
    letterSpacing: '1px',
    color: 'var(--text-muted)',
    background: 'transparent',
    borderBottom: '2px solid transparent',
    marginBottom: '-1px',
  },
  tabActive: {
    color: 'var(--accent)',
    borderBottom: '2px solid var(--accent)',
    fontWeight: 600,
  },
  exSelector: {
    padding: '14px 18px 8px',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    fontSize: '15px',
    fontFamily: 'var(--font-body)',
  },
  placeholder: {
    padding: '40px 20px',
    textAlign: 'center',
    color: 'var(--text-dim)',
    fontSize: '14px',
  },
  chartWrap: {
    padding: '16px 16px 8px',
  },
  chartStats: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '12px 8px 0',
    borderTop: '1px solid var(--border)',
    marginTop: '12px',
  },
  chartStat: {
    textAlign: 'center',
  },
  chartStatVal: {
    fontFamily: 'var(--font-mono)',
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: 1,
  },
  chartStatLabel: {
    fontSize: '9px',
    letterSpacing: '2px',
    color: 'var(--text-dim)',
    marginTop: '4px',
  },
}
