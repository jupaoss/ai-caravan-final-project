import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './Waveform.css'

export type WaveformState = 'idle' | 'listening' | 'system-talking' | 'user-talking' | 'resting'

interface WaveformProps {
  state: WaveformState
  label?: string
}

const DOT_COUNT = 10

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

const RESTING_HEIGHTS = [4, 4, 4, 4, 4, 4, 4, 4, 4]
const COLOR_REST   = '#716F6F'
const COLOR_ACTIVE = '#595959'

export const Waveform = ({ state, label }: WaveformProps) => {
  const barRefs = useRef<(HTMLSpanElement | null)[]>([])
  const isBars = state === 'system-talking' || state === 'user-talking' || state === 'resting'

  useEffect(() => {
    const bars = barRefs.current.filter((b): b is HTMLSpanElement => b !== null)
    if (!bars.length) return

    if (state === 'system-talking' || state === 'user-talking') {
      gsap.set(bars, { clearProps: 'height,backgroundColor' })
      bars.forEach((bar, i) => {
        bar.style.animationName      = BAR_CONFIGS[i].anim
        bar.style.animationDuration  = BAR_CONFIGS[i].dur
        bar.style.animationDelay     = BAR_CONFIGS[i].delay
        bar.style.animationPlayState = ''
      })
      return
    }

    if (state === 'resting') {
      // Freeze CSS animation at its current frame, capture heights, then GSAP-tween to resting
      bars.forEach(bar => { bar.style.animationPlayState = 'paused' })
      const frozenHeights = bars.map(bar => bar.getBoundingClientRect().height)
      gsap.set(bars, { height: (i: number) => frozenHeights[i] })
      bars.forEach(bar => {
        bar.style.animationName      = 'none'
        bar.style.animationPlayState = ''
      })

      const ctx = gsap.context(() => {
        const tl = gsap.timeline()

        // Settle each bar to its resting height with a deceleration ease
        tl.to(bars, {
          height:          (i: number) => `${RESTING_HEIGHTS[i]}px`,
          backgroundColor: COLOR_REST,
          duration:        0.55,
          ease:            'power3.out',
          stagger:         0.04,
        })

        // Color loop: each bar pulses dark then returns, 70ms stagger across all bars
        const colorTl = gsap.timeline({ repeat: -1 })
        bars.forEach((bar, i) => {
          colorTl.to(bar, { backgroundColor: COLOR_ACTIVE, duration: 0.15, ease: 'power2.inOut' }, i * 0.07)
          colorTl.to(bar, { backgroundColor: COLOR_REST,   duration: 0.15, ease: 'power2.inOut' }, i * 0.07 + 0.15)
        })
        tl.add(colorTl)
      })

      return () => ctx.revert()
    }
  }, [state])

  return (
    <div className="waveform-wrap">
      <div className={`waveform waveform--${state}`}>
        {isBars
          ? BAR_CONFIGS.map((cfg, i) => (
              <span
                key={i}
                ref={(el) => { barRefs.current[i] = el }}
                className="waveform__bar"
                style={{
                  animationName:     cfg.anim,
                  animationDuration: cfg.dur,
                  animationDelay:    cfg.delay,
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
