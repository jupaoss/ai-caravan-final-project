import './Waveform.css'

export type WaveformState = 'idle' | 'listening' | 'system-talking' | 'user-talking' | 'resting'

interface WaveformProps {
  state: WaveformState
  label?: string
}

const DOT_COUNT = 10

// Per-bar animation config — varied shapes, durations, and non-uniform delays
// to produce organic, speech-like motion
const BAR_CONFIGS = [
  { anim: 'bar-c', dur: '1.15s', delay: '0s'    },
  { anim: 'bar-d', dur: '0.95s', delay: '0.3s'  },
  { anim: 'bar-b', dur: '1.3s',  delay: '0.12s' },
  { anim: 'bar-a', dur: '1.05s', delay: '0.45s' },
  { anim: 'bar-a', dur: '1.2s',  delay: '0.07s' },
  { anim: 'bar-d', dur: '1.0s',  delay: '0.38s' },
  { anim: 'bar-b', dur: '1.25s', delay: '0.2s'  },
  { anim: 'bar-c', dur: '0.9s',  delay: '0.52s' },
  { anim: 'bar-a', dur: '1.1s',  delay: '0.15s' },
] as const

// Alternating 1× / 2× heights, same bar count as BAR_CONFIGS
const RESTING_HEIGHTS = [6, 12, 6, 12, 6, 12, 6, 12, 6]

export const Waveform = ({ state, label }: WaveformProps) => {
  const isBars = state === 'system-talking' || state === 'user-talking' || state === 'resting'

  return (
    <div className="waveform-wrap">
      <div className={`waveform waveform--${state}`}>
        {isBars
          ? state === 'resting'
            ? RESTING_HEIGHTS.map((h, i) => (
                <span
                  key={i}
                  className="waveform__bar"
                  style={{ height: `${h}px`, animation: 'none' }}
                />
              ))
            : BAR_CONFIGS.map((cfg, i) => (
                <span
                  key={i}
                  className="waveform__bar"
                  style={{
                    animationName: cfg.anim,
                    animationDuration: cfg.dur,
                    animationDelay: cfg.delay,
                  }}
                />
              ))
          : Array.from({ length: DOT_COUNT }).map((_, i) => (
              <span
                key={i}
                className="waveform__dot"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
      </div>
      {label && <p className="waveform__label">{label}</p>}
    </div>
  )
}
