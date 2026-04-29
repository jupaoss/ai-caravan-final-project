# Echo Voice Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete Echo voice interaction experience from onboarding through product detail page using a strict state machine with an interrupt layer.

**Architecture:** A `useVoiceStateMachine` hook orchestrates the full state loop (idle → listening → processing → system-talking) plus timeout and interrupt handling. A `useEchoSession` hook manages session state (product index, detail expanded, cart count). A pure `commandRecognizer` utility handles intent matching. `EchoOnboarding` gains a voice layer on top of its existing tap UI. `EchoShop` is fully rewritten with a carousel layout, guided/ask mode logic, and the AudioVisualizer component.

**Tech Stack:** React 18, TypeScript, webkitSpeechRecognition, Web Speech Synthesis API, Framer Motion (carousel layout animations), Web Audio API (sound cues).

---

## File Map

**New files:**
- `src/utils/commandRecognizer.ts` — pure function: transcript → Command | null
- `src/utils/soundFeedback.ts` — Web Audio API soft cues
- `src/hooks/useVoiceStateMachine.ts` — state machine + interrupt layer + timeouts
- `src/hooks/useEchoSession.ts` — product navigation + detail state
- `src/components/AudioVisualizer.tsx` — fixed bottom bar: Waveform + karaoke transcript
- `src/components/AudioVisualizer.module.css`
- `src/__tests__/commandRecognizer.test.ts`
- `src/__tests__/layoutEngine.test.ts`

**Modified files:**
- `src/data/products.ts` — add `shortDescription` field
- `src/utils/layoutEngine.ts` — fix colors/sizes, add `getDetailScript`, add `getHint`
- `src/pages/EchoOnboarding.tsx` — add voice layer, pass `navStyle` to location state
- `src/pages/EchoShop.tsx` — full rewrite: carousel, state machine, guided/ask modes
- `src/components/Card.tsx` — add `shortDescription` prop, `showBubble` prop
- `src/components/Card.module.css` — carousel sizing vars

---

### Task 1: Setup testing infrastructure

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Install vitest and jsdom**

```bash
npm install -D vitest jsdom
```

Expected: packages added to devDependencies, no errors.

- [ ] **Step 2: Add test config to vite.config.ts**

Read current `vite.config.ts`, then replace with:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 3: Add test scripts to package.json**

In the `"scripts"` section add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify setup with a smoke test**

Create `src/__tests__/smoke.test.ts`:

```typescript
describe('setup', () => {
  it('works', () => expect(1 + 1).toBe(2))
})
```

Run:
```bash
npm test
```

Expected output includes: `✓ src/__tests__/smoke.test.ts (1 test)`

- [ ] **Step 5: Delete smoke test**

```bash
rm src/__tests__/smoke.test.ts
```

---

### Task 2: Add shortDescription to products

**Files:**
- Modify: `src/data/products.ts`

- [ ] **Step 1: Add field to Product interface and all entries**

In `src/data/products.ts`, update the interface to add `shortDescription: string` after `price`, then add values for each product:

```typescript
export interface Product {
  id: string
  name: string
  price: number
  shortDescription: string   // ← add this
  description: string
  sizes: string[]
  rating: number
  reviews: number
  colors: string[]
  image: string
  isNew?: boolean
}
```

Add `shortDescription` to each product object:

```typescript
// id: '1'
shortDescription: 'Knit racerback balloon silhouette',

// id: '2'
shortDescription: 'Satin pleated raglan sleeves, straight cut',

// id: '3'
shortDescription: 'Superlight pleated tricoline, long straight fit',

// id: '4'
shortDescription: 'Satin-cotton blend sheath silhouette',

// id: '5'
shortDescription: 'Long crepe dress with flared sleeves',
```

> **Note:** These are placeholder values. Replace with copy from the Figma design node-id=68-51004 before final review.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | head -20
```

Expected: no errors related to `shortDescription` (there may be unrelated existing errors — ignore those for now).

---

### Task 3: Fix and extend layoutEngine.ts

**Files:**
- Modify: `src/utils/layoutEngine.ts`
- Create: `src/__tests__/layoutEngine.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/layoutEngine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { assignLayout, getVoiceScript, getDetailScript, getHint } from '../utils/layoutEngine'
import type { Product } from '../data/products'

const p: Product = {
  id: '1',
  name: 'Test Dress',
  price: 200,
  shortDescription: 'Elegant silhouette',
  description: 'A beautiful dress.',
  sizes: ['S', 'M', 'L'],
  rating: 4.5,
  reviews: 100,
  colors: ['#000000', '#FFFFFF'],
  image: 'test.png',
}

describe('assignLayout', () => {
  it('full-story + guided → story-first', () => {
    expect(assignLayout('full-story', 'guided')).toBe('story-first')
  })
  it('full-story + ask → social-first', () => {
    expect(assignLayout('full-story', 'ask')).toBe('social-first')
  })
  it('essentials + guided → value-first', () => {
    expect(assignLayout('essentials', 'guided')).toBe('value-first')
  })
  it('essentials + ask → value-first', () => {
    expect(assignLayout('essentials', 'ask')).toBe('value-first')
  })
})

describe('getVoiceScript', () => {
  it('story-first uses description and price question', () => {
    const s = getVoiceScript('story-first', p)
    expect(s).toBe('Test Dress. A beautiful dress. Ready to hear the price?')
  })
  it('value-first uses price and colors, not sizes', () => {
    const s = getVoiceScript('value-first', p)
    expect(s).toContain('$200')
    expect(s).toContain('black')
    expect(s).not.toContain('S, M')
  })
  it('social-first uses rating and reviews', () => {
    const s = getVoiceScript('social-first', p)
    expect(s).toContain('4.5')
    expect(s).toContain('100 people')
  })
})

describe('getDetailScript', () => {
  it('includes shortDescription, description, colors, price', () => {
    const s = getDetailScript(p)
    expect(s).toContain('Test Dress')
    expect(s).toContain('Elegant silhouette')
    expect(s).toContain('A beautiful dress.')
    expect(s).toContain('black')
    expect(s).toContain('$200')
  })
})

describe('getHint', () => {
  it('returns different hints for 0, 1, 2', () => {
    const h = [getHint(0), getHint(1), getHint(2)]
    expect(new Set(h).size).toBe(3)
  })
  it('wraps around at 3', () => {
    expect(getHint(3)).toBe(getHint(0))
  })
})
```

- [ ] **Step 2: Run to confirm failures**

```bash
npm test
```

Expected: FAIL — `getDetailScript`, `getHint` not exported.

- [ ] **Step 3: Replace layoutEngine.ts**

```typescript
export type Layout = 'story-first' | 'value-first' | 'social-first'
export type DetailLevel = 'essentials' | 'full-story'
export type NavStyle = 'guided' | 'ask'

export const assignLayout = (detail: DetailLevel, nav: NavStyle): Layout => {
  if (detail === 'full-story' && nav === 'guided') return 'story-first'
  if (detail === 'full-story' && nav === 'ask') return 'social-first'
  return 'value-first'
}

type ProductForScript = {
  name: string
  price: number
  shortDescription: string
  description: string
  rating: number
  reviews: number
  colors: string[]
}

const COLOR_NAMES: Record<string, string> = {
  '#000000': 'black',
  '#FFFFFF': 'white',
  '#BDBDBD': 'gray',
  '#C7E11E': 'lime',
  '#9E0003': 'red',
  '#1A542F': 'forest green',
}

const formatColors = (colors: string[]): string =>
  colors.map(c => COLOR_NAMES[c.toUpperCase()] ?? c).join(' and ')

export const getVoiceScript = (layout: Layout, product: ProductForScript): string => {
  switch (layout) {
    case 'story-first':
      return `${product.name}. ${product.description} Ready to hear the price?`
    case 'value-first':
      return `${product.name}. $${product.price}. Available in ${formatColors(product.colors)}. Want to add it or hear more?`
    case 'social-first':
      return `${product.name}. Rated ${product.rating} by ${product.reviews} people. $${product.price}. Want to hear more?`
  }
}

export const getDetailScript = (product: ProductForScript): string =>
  `${product.name}. ${product.shortDescription}. ${product.description} Available in ${formatColors(product.colors)}. $${product.price}.`

const HINTS = [
  "Try 'next' or 'tell me more'.",
  "Say 'add to bag' or 'how much'.",
  "Try 'start over' or 'what colors'.",
]

export const getHint = (count: number): string => HINTS[count % HINTS.length]
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: all layoutEngine tests pass.

---

### Task 4: Create commandRecognizer.ts

**Files:**
- Create: `src/utils/commandRecognizer.ts`
- Create: `src/__tests__/commandRecognizer.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/commandRecognizer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { recognizeCommand } from '../utils/commandRecognizer'

describe('recognizeCommand', () => {
  it('"next"', () => expect(recognizeCommand('next')).toBe('next'))
  it('"go back"', () => expect(recognizeCommand('go back')).toBe('previous'))
  it('"previous"', () => expect(recognizeCommand('previous')).toBe('previous'))
  it('"tell me more"', () => expect(recognizeCommand('tell me more')).toBe('tell-me-more'))
  it('"add to cart"', () => expect(recognizeCommand('add to cart')).toBe('add-to-cart'))
  it('"add to bag"', () => expect(recognizeCommand('add to bag')).toBe('add-to-cart'))
  it('"how much"', () => expect(recognizeCommand('how much')).toBe('how-much'))
  it('"what colors"', () => expect(recognizeCommand('what colors')).toBe('what-colors'))
  it('"what colours"', () => expect(recognizeCommand('what colours')).toBe('what-colors'))
  it('"start over"', () => expect(recognizeCommand('start over')).toBe('start-over'))
  it('"stop"', () => expect(recognizeCommand('stop')).toBe('stop'))
  it('"pause"', () => expect(recognizeCommand('pause')).toBe('stop'))
  it('"yes"', () => expect(recognizeCommand('yes')).toBe('yes'))
  it('"continue"', () => expect(recognizeCommand('continue')).toBe('yes'))
  it('"just the essentials"', () => expect(recognizeCommand('just the essentials')).toBe('answer:essentials'))
  it('"full story"', () => expect(recognizeCommand('full story')).toBe('answer:full-story'))
  it('"guide me"', () => expect(recognizeCommand('guide me')).toBe('answer:guided'))
  it('"I\'ll ask"', () => expect(recognizeCommand("I'll ask")).toBe('answer:ask'))
  it('unknown → null', () => expect(recognizeCommand('blah blah')).toBeNull())
  it('case-insensitive', () => expect(recognizeCommand('NEXT')).toBe('next'))
})
```

- [ ] **Step 2: Run to confirm failures**

```bash
npm test
```

Expected: FAIL — `recognizeCommand` not found.

- [ ] **Step 3: Create commandRecognizer.ts**

```typescript
export type Command =
  | 'next'
  | 'previous'
  | 'tell-me-more'
  | 'add-to-cart'
  | 'how-much'
  | 'what-colors'
  | 'start-over'
  | 'stop'
  | 'yes'
  | 'answer:essentials'
  | 'answer:full-story'
  | 'answer:guided'
  | 'answer:ask'

const PATTERNS: [Command, RegExp][] = [
  ['next',              /\bnext\b/i],
  ['previous',          /\b(previous|go back|back)\b/i],
  ['tell-me-more',      /\btell me more\b/i],
  ['add-to-cart',       /\badd (to (cart|bag)|it)\b/i],
  ['how-much',          /\bhow much\b/i],
  ['what-colors',       /\bwhat colou?rs?\b/i],
  ['start-over',        /\bstart over\b/i],
  ['stop',              /\b(stop|pause)\b/i],
  ['yes',               /\b(yes|yeah|sure|continue|go ahead)\b/i],
  ['answer:essentials', /\b(essentials?|just the|key details?)\b/i],
  ['answer:full-story', /\b(full story|everything|all of it)\b/i],
  ['answer:guided',     /\b(guide me|guided|take me through)\b/i],
  ['answer:ask',        /\b(i'?ll ask|on my own)\b/i],
]

export const recognizeCommand = (transcript: string): Command | null => {
  for (const [command, pattern] of PATTERNS) {
    if (pattern.test(transcript)) return command
  }
  return null
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: all command tests pass.

---

### Task 5: Create soundFeedback.ts

**Files:**
- Create: `src/utils/soundFeedback.ts`

No tests — Web Audio API is not unit-testable in jsdom.

- [ ] **Step 1: Create soundFeedback.ts**

```typescript
const tone = (frequency: number, duration: number, volume = 0.07): void => {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {
    // AudioContext unavailable in some environments — fail silently
  }
}

export const sounds = {
  micOpen:  () => tone(880, 0.15),
  micClose: () => tone(660, 0.10),
  interrupt:() => tone(440, 0.08),
  cartAdd:  () => tone(880, 0.25),
}
```

---

### Task 6: Create useEchoSession

**Files:**
- Create: `src/hooks/useEchoSession.ts`

- [ ] **Step 1: Create useEchoSession.ts**

```typescript
import { useState, useCallback } from 'react'
import { products, type Product } from '../data/products'
import type { Layout } from '../utils/layoutEngine'

interface SessionState {
  productIndex: number
  isDetailExpanded: boolean
  cartCount: number
}

export interface UseEchoSessionReturn {
  activeProduct: Product
  productIndex: number
  isDetailExpanded: boolean
  cartCount: number
  isAtEnd: boolean
  layout: Layout
  advance: () => boolean
  goBack: () => void
  expandDetail: () => void
  collapseDetail: () => void
  addToCart: () => void
  reset: () => void
}

export const useEchoSession = (layout: Layout): UseEchoSessionReturn => {
  const [state, setState] = useState<SessionState>({
    productIndex: 0,
    isDetailExpanded: false,
    cartCount: 0,
  })

  // Returns true if there was a next product, false if already at end
  const advance = useCallback((): boolean => {
    if (state.productIndex >= products.length - 1) return false
    setState(prev => ({ ...prev, productIndex: prev.productIndex + 1, isDetailExpanded: false }))
    return true
  }, [state.productIndex])

  const goBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      productIndex: Math.max(0, prev.productIndex - 1),
      isDetailExpanded: false,
    }))
  }, [])

  const expandDetail = useCallback(() => {
    setState(prev => ({ ...prev, isDetailExpanded: true }))
  }, [])

  const collapseDetail = useCallback(() => {
    setState(prev => ({ ...prev, isDetailExpanded: false }))
  }, [])

  const addToCart = useCallback(() => {
    setState(prev => ({ ...prev, cartCount: prev.cartCount + 1 }))
  }, [])

  const reset = useCallback(() => {
    setState({ productIndex: 0, isDetailExpanded: false, cartCount: 0 })
  }, [])

  return {
    activeProduct: products[state.productIndex],
    productIndex: state.productIndex,
    isDetailExpanded: state.isDetailExpanded,
    cartCount: state.cartCount,
    isAtEnd: state.productIndex >= products.length - 1,
    layout,
    advance,
    goBack,
    expandDetail,
    collapseDetail,
    addToCart,
    reset,
  }
}
```

---

### Task 7: Create useVoiceStateMachine

**Files:**
- Create: `src/hooks/useVoiceStateMachine.ts`

- [ ] **Step 1: Create useVoiceStateMachine.ts**

```typescript
import { useState, useCallback, useRef, useEffect } from 'react'
import { recognizeCommand, type Command } from '../utils/commandRecognizer'
import { sounds } from '../utils/soundFeedback'
import { getHint } from '../utils/layoutEngine'

export type VoiceState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'system-talking'
  | 'mic-unavailable'

const POWER_COMMANDS: Command[] = ['next', 'stop', 'tell-me-more', 'add-to-cart']
const SILENCE_MS = 5000
const GRACE_MS = 3000

export interface UseVoiceStateMachineReturn {
  voiceState: VoiceState
  isSupported: boolean
  speak: (text: string, onBoundary?: (charIndex: number) => void, onEnd?: () => void) => void
  startListening: () => void
  stopAll: () => void
  unrecognizedCount: number
}

export const useVoiceStateMachine = (
  onCommand: (command: Command) => void
): UseVoiceStateMachineReturn => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [unrecognizedCount, setUnrecognizedCount] = useState(0)

  const isSupported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)

  const mainRecRef     = useRef<any>(null)
  const interruptRecRef = useRef<any>(null)
  const silenceTimer   = useRef<ReturnType<typeof setTimeout>>()
  const graceTimer     = useRef<ReturnType<typeof setTimeout>>()
  const isSpeakingRef  = useRef(false)
  const unrecCountRef  = useRef(0)
  const onCommandRef   = useRef(onCommand)
  // Forward refs so speak/startListening can call each other without stale closures
  const speakRef       = useRef<UseVoiceStateMachineReturn['speak']>(() => {})
  const startListRef   = useRef<() => void>(() => {})

  useEffect(() => { onCommandRef.current = onCommand }, [onCommand])

  const clearTimers = () => {
    clearTimeout(silenceTimer.current)
    clearTimeout(graceTimer.current)
  }

  const stopAll = useCallback(() => {
    window.speechSynthesis?.cancel()
    isSpeakingRef.current = false
    mainRecRef.current?.stop()
    mainRecRef.current = null
    interruptRecRef.current?.stop()
    interruptRecRef.current = null
    clearTimers()
    setVoiceState('idle')
  }, [])

  const startInterruptListener = useCallback(() => {
    if (!isSupported || interruptRecRef.current) return
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = false

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      const command = recognizeCommand(transcript)
      if (command && POWER_COMMANDS.includes(command)) {
        window.speechSynthesis.cancel()
        isSpeakingRef.current = false
        interruptRecRef.current = null
        sounds.interrupt()
        setVoiceState('processing')
        onCommandRef.current(command)
      }
    }

    rec.onend = () => {
      interruptRecRef.current = null
      // Restart interrupt listener if still speaking
      if (isSpeakingRef.current) startInterruptListener()
    }

    rec.onerror = () => { interruptRecRef.current = null }

    interruptRecRef.current = rec
    try { rec.start() } catch { interruptRecRef.current = null }
  }, [isSupported])

  const speak = useCallback((
    text: string,
    onBoundary?: (charIndex: number) => void,
    onEnd?: () => void,
  ) => {
    window.speechSynthesis?.cancel()
    isSpeakingRef.current = true
    setVoiceState('system-talking')

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.85
    utterance.pitch = 1

    if (onBoundary) utterance.onboundary = (e) => onBoundary(e.charIndex)

    utterance.onend = () => {
      isSpeakingRef.current = false
      interruptRecRef.current?.stop()
      interruptRecRef.current = null
      setVoiceState('idle')
      onEnd?.()
    }

    window.speechSynthesis.speak(utterance)
    startInterruptListener()
  }, [startInterruptListener])

  speakRef.current = speak

  const startListening = useCallback(() => {
    if (!isSupported) {
      setVoiceState('mic-unavailable')
      return
    }

    mainRecRef.current?.stop()
    mainRecRef.current = null
    clearTimers()
    sounds.micOpen()
    setVoiceState('listening')

    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = false

    silenceTimer.current = setTimeout(() => {
      setVoiceState('idle')
      speakRef.current("Still there?", undefined, () => {
        graceTimer.current = setTimeout(() => {
          sounds.micClose()
          setVoiceState('idle')
        }, GRACE_MS)
      })
    }, SILENCE_MS)

    rec.onresult = (e: any) => {
      clearTimers()
      sounds.micClose()
      mainRecRef.current = null
      const transcript = e.results[0][0].transcript
      setVoiceState('processing')

      const command = recognizeCommand(transcript)
      if (command) {
        onCommandRef.current(command)
      } else {
        const hint = getHint(unrecCountRef.current)
        unrecCountRef.current += 1
        setUnrecognizedCount(unrecCountRef.current)
        speakRef.current(hint, undefined, () => {
          setTimeout(() => startListRef.current(), 300)
        })
      }
    }

    rec.onerror = (e: any) => {
      clearTimers()
      mainRecRef.current = null
      setVoiceState(e.error === 'not-allowed' ? 'mic-unavailable' : 'idle')
    }

    rec.onend = () => { mainRecRef.current = null }

    mainRecRef.current = rec
    try { rec.start() } catch { setVoiceState('idle') }
  }, [isSupported])

  startListRef.current = startListening

  useEffect(() => () => {
    window.speechSynthesis?.cancel()
    mainRecRef.current?.stop()
    interruptRecRef.current?.stop()
    clearTimers()
  }, [])

  return { voiceState, isSupported, speak, startListening, stopAll, unrecognizedCount }
}
```

---

### Task 8: Create AudioVisualizer component

**Files:**
- Create: `src/components/AudioVisualizer.tsx`
- Create: `src/components/AudioVisualizer.module.css`

- [ ] **Step 1: Create AudioVisualizer.tsx**

```typescript
import type { KaraokeWord } from '../hooks/useKaraoke'
import { Waveform, type WaveformState } from './Waveform'
import styles from './AudioVisualizer.module.css'

interface AudioVisualizerProps {
  waveformState: WaveformState
  words: KaraokeWord[]
  visible: boolean
}

export const AudioVisualizer = ({ waveformState, words, visible }: AudioVisualizerProps) => {
  if (!visible) return null

  return (
    <div className={styles.bar} role="region" aria-label="Audio feedback">
      <Waveform state={waveformState} />
      <p className={styles.transcript} aria-live="polite" aria-atomic="false">
        {words.map((w, i) => (
          <span key={i} className={`${styles.word} ${styles[`word--${w.state}`]}`}>
            {w.word}{' '}
          </span>
        ))}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create AudioVisualizer.module.css**

```css
.bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 32px;
  background: var(--color-bg-surface);
  border-top: 1px solid var(--color-border-subtle);
  z-index: 10;
}

.transcript {
  flex: 1;
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
  font-size: 14px;
  line-height: 1.6;
}

.word { display: inline; transition: color 0.1s ease; }
.word--unread { color: var(--color-gray-400); }
.word--active  { color: var(--color-red); font-weight: 500; }
.word--read    { color: var(--color-black); }
```

---

### Task 9: Update Card for carousel and shortDescription

**Files:**
- Modify: `src/components/Card.tsx`
- Modify: `src/components/Card.module.css`

- [ ] **Step 1: Update Card.tsx to accept showBubble and use shortDescription**

Replace the `echo-big` section in `Card.tsx`. The full updated file:

```typescript
import type { Product } from '../data/products'
import type { KaraokeWord } from '../hooks/useKaraoke'
import { Bubble } from './Bubble'
import styles from './Card.module.css'

export type CardVariant = 'gaze' | 'echo-small' | 'echo-big'

interface CardProps {
  product: Product
  variant: CardVariant
  karaokeWords?: KaraokeWord[]
  showBubble?: boolean
}

const ColorSwatch = ({ color }: { color: string }) => (
  <span
    className={styles.swatch}
    style={{ background: color, border: color === '#FFFFFF' ? '1px solid var(--color-border-subtle)' : 'none' }}
  />
)

const KaraokeText = ({ words }: { words: KaraokeWord[] }) => (
  <p className={styles.karaoke}>
    {words.map((w, i) => (
      <span key={i} className={`${styles.word} ${styles[`word--${w.state}`]}`}>
        {w.word}{' '}
      </span>
    ))}
  </p>
)

export const Card = ({ product, variant, karaokeWords, showBubble = true }: CardProps) => (
  <article className={`${styles.card} ${styles[variant]}`}>
    <div className={styles.imageWrap}>
      <img
        src={product.image}
        alt={product.name}
        className={styles.image}
        loading="lazy"
      />
    </div>

    <div className={styles.body}>
      <div className={styles.row}>
        <span className={styles.name}>{product.name}</span>
        <span className={styles.price}>${product.price}</span>
      </div>

      {variant === 'gaze' && product.colors.length > 0 && (
        <div className={styles.swatches}>
          {product.colors.map((c) => <ColorSwatch key={c} color={c} />)}
        </div>
      )}

      {variant === 'echo-big' && (
        <>
          <p className={styles.shortDescription}>{product.shortDescription}</p>
          {karaokeWords
            ? <KaraokeText words={karaokeWords} />
            : <p className={styles.description}>{product.description}</p>
          }
          {showBubble && <Bubble />}
        </>
      )}
    </div>
  </article>
)
```

- [ ] **Step 2: Add shortDescription style to Card.module.css**

Add after any existing `.description` rule:

```css
.shortDescription {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 4px 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

### Task 10: Add voice layer to EchoOnboarding

**Files:**
- Modify: `src/pages/EchoOnboarding.tsx`

- [ ] **Step 1: Replace EchoOnboarding.tsx**

The existing tap UI stays intact. Voice is layered on top: Echo speaks each question, listens for an answer, handles errors, and falls back to tap buttons after 2 failed attempts.

```typescript
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '../components/Header'
import { PageTransition } from '../components/PageTransition'
import { assignLayout, type DetailLevel, type NavStyle } from '../utils/layoutEngine'
import { useVoiceStateMachine } from '../hooks/useVoiceStateMachine'
import { type Command } from '../utils/commandRecognizer'
import styles from './EchoOnboarding.module.css'

interface Option<T extends string> {
  value: T
  label: string
  hint: string
}

const detailOptions: Option<DetailLevel>[] = [
  { value: 'essentials', label: 'JUST THE ESSENTIALS', hint: 'Name, price and availability — quick and direct.' },
  { value: 'full-story', label: 'TELL ME THE FULL STORY', hint: 'Materials, origin, process — the full picture.' },
]

const navOptions: Option<NavStyle>[] = [
  { value: 'guided', label: 'GUIDE ME', hint: 'Present products one by one.' },
  { value: 'ask', label: "I'LL ASK", hint: "I'll tell you when I need help." },
]

const slideVariants = {
  enter: (dir: number) => ({ x: dir * 60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
}

const Q1_SCRIPT = "When I describe a product, what do you prefer? Say 'essentials' for just the key details, or 'full story' for the complete picture."
const Q2_SCRIPT = "Got it. How do you want to explore? Say 'guide me' and I'll take you through the collection, or say 'I'll ask' to explore at your own pace."

export const EchoOnboarding = () => {
  const [step, setStep] = useState(0)
  const [detail, setDetail] = useState<DetailLevel>('essentials')
  const [nav, setNav] = useState<NavStyle>('guided')
  const [voiceErrors, setVoiceErrors] = useState(0)
  const [showTapFallback, setShowTapFallback] = useState(false)
  const navigate = useNavigate()

  const pendingAnswerRef = useRef<{ detail: DetailLevel; nav?: NavStyle } | null>(null)

  const handleCommand = useCallback((command: Command) => {
    if (step === 0) {
      if (command === 'answer:essentials' || command === 'answer:full-story') {
        const chosen = command === 'answer:essentials' ? 'essentials' : 'full-story'
        setDetail(chosen)
        setVoiceErrors(0)
        setStep(1)
        return
      }
    } else {
      if (command === 'answer:guided' || command === 'answer:ask') {
        const chosen = command === 'answer:guided' ? 'guided' : 'ask'
        setNav(chosen)
        setVoiceErrors(0)
        const layout = assignLayout(detail, chosen)
        speakRef.current("Perfect. Let's start.", undefined, () => {
          navigate('/echo', { state: { layout, navStyle: chosen } })
        })
        return
      }
    }

    // Unrecognized
    const errors = voiceErrors + 1
    setVoiceErrors(errors)
    if (errors >= 2) {
      setShowTapFallback(true)
      speakRef.current("Tap your choice if you prefer.")
    } else {
      const hint = step === 0
        ? "Say 'essentials' or 'full story'."
        : "Say 'guide me' or 'I'll ask'."
      speakRef.current(hint, undefined, () => {
        setTimeout(() => startListeningRef.current(), 300)
      })
    }
  }, [step, voiceErrors, detail, navigate])

  const { speak, startListening } = useVoiceStateMachine(handleCommand)

  // Store refs to avoid stale closures in speak onEnd callbacks
  const speakRef = useRef(speak)
  const startListeningRef = useRef(startListening)
  useEffect(() => { speakRef.current = speak }, [speak])
  useEffect(() => { startListeningRef.current = startListening }, [startListening])

  // Speak welcome + Q1 on mount
  useEffect(() => {
    speakRef.current(
      "Welcome to Echo. I'll ask you two quick questions to set up your experience.",
      undefined,
      () => {
        speakRef.current(Q1_SCRIPT, undefined, () => {
          startListeningRef.current()
        })
      }
    )
  }, [])

  // Speak Q2 when step advances to 1
  const hasSpokenQ2 = useRef(false)
  useEffect(() => {
    if (step === 1 && !hasSpokenQ2.current) {
      hasSpokenQ2.current = true
      speakRef.current(Q2_SCRIPT, undefined, () => {
        startListeningRef.current()
      })
    }
  }, [step])

  // Tap handlers — same outcome as voice
  const handleTapDetail = (value: DetailLevel) => {
    setDetail(value)
    setVoiceErrors(0)
    setStep(1)
  }

  const handleTapNav = (value: NavStyle) => {
    setNav(value)
    const layout = assignLayout(detail, value)
    speakRef.current("Perfect. Let's start.", undefined, () => {
      navigate('/echo', { state: { layout, navStyle: value } })
    })
  }

  const handleTapContinue = () => {
    if (step === 0) {
      setStep(1)
    } else {
      const layout = assignLayout(detail, nav)
      navigate('/echo', { state: { layout, navStyle: nav } })
    }
  }

  return (
    <PageTransition className={styles.page}>
      <Header />
      <div className={styles.content}>
        <AnimatePresence mode="wait" custom={1}>
          {step === 0 ? (
            <motion.div
              key="step-0"
              className={styles.step}
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <p className={styles.counter}>1 / 2</p>
              <h1 className={styles.question}>
                WHEN I DESCRIBE A PRODUCT,<br />WHAT DO YOU PREFER?
              </h1>
              <div className={styles.options}>
                {detailOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`${styles.option} ${detail === opt.value ? styles.selected : ''}`}
                    onClick={() => handleTapDetail(opt.value)}
                    aria-pressed={detail === opt.value}
                  >
                    <span className={styles.radio}>
                      {detail === opt.value && <span className={styles.radioDot} />}
                    </span>
                    <span className={styles.optionText}>
                      <span className={styles.optionLabel}>{opt.label}</span>
                      <span className={styles.optionHint}>{opt.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button className={styles.cta} onClick={handleTapContinue}>CONTINUE</button>
            </motion.div>
          ) : (
            <motion.div
              key="step-1"
              className={styles.step}
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <p className={styles.counter}>2 / 2</p>
              <h1 className={styles.question}>
                HOW DO YOU WANT TO<br />EXPLORE?
              </h1>
              <div className={styles.options}>
                {navOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`${styles.option} ${nav === opt.value ? styles.selected : ''}`}
                    onClick={() => handleTapNav(opt.value)}
                    aria-pressed={nav === opt.value}
                  >
                    <span className={styles.radio}>
                      {nav === opt.value && <span className={styles.radioDot} />}
                    </span>
                    <span className={styles.optionText}>
                      <span className={styles.optionLabel}>{opt.label}</span>
                      <span className={styles.optionHint}>{opt.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button className={styles.cta} onClick={handleTapContinue}>START EXPLORING</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
```

---

### Task 11: Rewrite EchoShop

**Files:**
- Modify: `src/pages/EchoShop.tsx`
- Modify: `src/pages/EchoShop.module.css`

- [ ] **Step 1: Replace EchoShop.tsx**

```typescript
import { useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header } from '../components/Header'
import { SearchBar } from '../components/SearchBar'
import { Card } from '../components/Card'
import { AudioVisualizer } from '../components/AudioVisualizer'
import { Toggle } from '../components/Toggle'
import { PageTransition } from '../components/PageTransition'
import { useVoiceStateMachine } from '../hooks/useVoiceStateMachine'
import { useEchoSession } from '../hooks/useEchoSession'
import { useKaraoke } from '../hooks/useKaraoke'
import { products } from '../data/products'
import { getVoiceScript, getDetailScript, type Layout, type NavStyle } from '../utils/layoutEngine'
import { type Command } from '../utils/commandRecognizer'
import { sounds } from '../utils/soundFeedback'
import styles from './EchoShop.module.css'

export const EchoShop = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const layout: Layout = (location.state as any)?.layout ?? 'value-first'
  const navStyle: NavStyle = (location.state as any)?.navStyle ?? 'ask'

  const session = useEchoSession(layout)

  const scriptText = session.isDetailExpanded
    ? getDetailScript(session.activeProduct)
    : getVoiceScript(layout, session.activeProduct)

  const { words, updateBoundary, reset: resetKaraoke } = useKaraoke(scriptText)

  // Reset karaoke whenever the script text changes
  useEffect(() => { resetKaraoke() }, [scriptText, resetKaraoke])

  // Forward refs to break circular dependency between handleCommand ↔ speak/startListening
  const speakRef = useRef<ReturnType<typeof useVoiceStateMachine>['speak']>(() => {})
  const startListeningRef = useRef<() => void>(() => {})

  const speakProduct = useCallback((product = session.activeProduct) => {
    const text = getVoiceScript(layout, product)
    speakRef.current(text, updateBoundary, () => {
      if (navStyle === 'guided') {
        // Auto-advance after 1.5s pause
        setTimeout(() => {
          const hasNext = session.advance()
          if (hasNext) {
            speakProduct(products[session.productIndex + 1])
          } else {
            speakRef.current(
              `That's the full collection. Say a product name or 'start over' to go again.`,
              undefined,
              () => startListeningRef.current()
            )
          }
        }, 1500)
      } else {
        startListeningRef.current()
      }
    })
  }, [layout, navStyle, session, updateBoundary])

  const speakDetail = useCallback(() => {
    session.expandDetail()
    const text = getDetailScript(session.activeProduct)
    speakRef.current(text, updateBoundary, () => {
      const prompt = navStyle === 'guided'
        ? "Want to add it to your bag, or shall I continue?"
        : "Say 'add to bag', 'next', or ask me anything."
      speakRef.current(prompt, undefined, () => startListeningRef.current())
    })
  }, [session, navStyle, updateBoundary])

  const handleCommand = useCallback((command: Command) => {
    switch (command) {
      case 'next': {
        session.collapseDetail()
        const hasNext = session.advance()
        if (!hasNext) {
          speakRef.current(
            navStyle === 'guided'
              ? `That's the full collection. Say a product name or 'start over' to go again.`
              : `That's the last piece. Say 'start over' to go again.`,
            undefined,
            () => startListeningRef.current()
          )
        } else {
          setTimeout(() => speakProduct(), 300)
        }
        break
      }
      case 'previous':
        session.collapseDetail()
        session.goBack()
        setTimeout(() => speakProduct(), 300)
        break
      case 'tell-me-more':
        speakDetail()
        break
      case 'add-to-cart':
        session.addToCart()
        sounds.cartAdd()
        speakRef.current(
          `Added. The ${session.activeProduct.name} is in your bag.`,
          undefined,
          () => {
            if (navStyle === 'guided') {
              setTimeout(() => {
                session.collapseDetail()
                const hasNext = session.advance()
                if (hasNext) speakProduct()
              }, 500)
            } else {
              startListeningRef.current()
            }
          }
        )
        break
      case 'how-much':
        speakRef.current(`$${session.activeProduct.price}.`, undefined, () =>
          startListeningRef.current()
        )
        break
      case 'what-colors': {
        const colorMap: Record<string, string> = {
          '#000000': 'black', '#FFFFFF': 'white', '#BDBDBD': 'gray',
          '#C7E11E': 'lime', '#9E0003': 'red', '#1A542F': 'forest green',
        }
        const colorNames = session.activeProduct.colors
          .map(c => colorMap[c.toUpperCase()] ?? c)
          .join(' and ')
        speakRef.current(`Available in ${colorNames}.`, undefined, () =>
          startListeningRef.current()
        )
        break
      }
      case 'start-over':
        session.reset()
        setTimeout(() => speakProduct(), 300)
        break
      case 'stop':
        // stopAll is called by the state machine on interrupt — just go idle
        break
      case 'yes':
        if (session.isDetailExpanded && navStyle === 'guided') {
          session.collapseDetail()
          const hasNext = session.advance()
          if (hasNext) speakProduct()
        } else {
          startListeningRef.current()
        }
        break
    }
  }, [session, navStyle, speakProduct, speakDetail])

  const { voiceState, isSupported, speak, startListening, stopAll } =
    useVoiceStateMachine(handleCommand)

  // Keep refs current
  useEffect(() => { speakRef.current = speak }, [speak])
  useEffect(() => { startListeningRef.current = startListening }, [startListening])

  // Entry: speak intro then first product
  useEffect(() => {
    speakRef.current(
      `Here's the collection. ${products.length} pieces.`,
      undefined,
      () => setTimeout(() => speakProduct(), 500)
    )
    return () => stopAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const waveformState =
    voiceState === 'listening' ? 'listening' as const :
    voiceState === 'system-talking' ? 'system-talking' as const :
    'idle' as const

  const searchBarState =
    voiceState === 'listening' ? 'listening' as const :
    voiceState === 'system-talking' ? 'entered' as const :
    'default' as const

  const searchBarValue = voiceState === 'system-talking' ? scriptText.slice(0, 40) + '…' : ''

  return (
    <PageTransition className={styles.page} data-experience="echo">
      <Header />

      <main className={styles.main}>
        <h1 className={styles.title}>WHAT ARE YOU<br />LOOKING FOR TODAY?</h1>

        <div className={styles.searchWrap}>
          <SearchBar
            state={searchBarState}
            value={searchBarValue}
            onActivate={() => {
              if (voiceState === 'idle') startListening()
              else if (voiceState === 'listening') stopAll()
            }}
          />
        </div>

        {!isSupported && (
          <p className={styles.micWarning} role="alert">
            Microphone access is needed for Echo. You can still type to search.
          </p>
        )}

        <div className={styles.carousel}>
          {products.map((product, i) => {
            const isActive = i === session.productIndex
            return (
              <motion.div
                key={product.id}
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`${styles.carouselItem} ${isActive ? styles.carouselItemActive : ''}`}
                style={{ opacity: isActive ? 1 : 0.4 }}
              >
                <Card
                  product={product}
                  variant={isActive ? 'echo-big' : 'echo-small'}
                  karaokeWords={
                    isActive && voiceState === 'system-talking' ? words : undefined
                  }
                  showBubble={isActive && !session.isDetailExpanded}
                />
              </motion.div>
            )
          })}
        </div>
      </main>

      <AudioVisualizer
        waveformState={waveformState}
        words={voiceState === 'system-talking' ? words : []}
        visible={voiceState === 'system-talking' || voiceState === 'listening'}
      />

      <div className={styles.toggleWrap}>
        <Toggle active="echo" onChange={(m) => m === 'gaze' && navigate('/gaze')} />
      </div>
    </PageTransition>
  )
}
```

- [ ] **Step 2: Replace EchoShop.module.css**

```css
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0 120px; /* 120px bottom padding for AudioVisualizer */
}

.title {
  font-size: clamp(24px, 4vw, 48px);
  text-align: center;
  letter-spacing: 0.05em;
  margin-bottom: 32px;
}

.searchWrap {
  width: 100%;
  max-width: 545px;
  margin-bottom: 48px;
}

.micWarning {
  color: var(--color-text-secondary);
  font-size: 14px;
  text-align: center;
  margin-bottom: 24px;
}

.carousel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  overflow: visible;
}

.carouselItem {
  flex-shrink: 0;
  width: 242px;
  height: 405px;
  transition: opacity 0.3s ease;
}

.carouselItemActive {
  width: 406px;
  height: 664px;
}

.toggleWrap {
  position: fixed;
  bottom: 80px; /* above AudioVisualizer */
  right: 24px;
  z-index: 20;
}
```

- [ ] **Step 3: Run the dev server and verify the full flow**

```bash
npm run dev
```

Open `http://localhost:5173/echo-onboarding` in Chrome (required for webkitSpeechRecognition).

Verify:
1. Echo speaks the welcome + Q1 on page load
2. Voice answer advances to Q2, tap buttons also work
3. Navigating to `/echo` shows the carousel with product 1 as active
4. Echo speaks the intro and first product
5. In guided mode: products advance automatically
6. In ask mode: mic opens after each product
7. "Tell me more" expands the active card with full detail script and karaoke
8. "Next" skips to next product; "add to bag" speaks confirmation
9. AudioVisualizer bar appears at bottom during system-talking
10. Interrupting Echo mid-sentence works (soft click, then command handled)

- [ ] **Step 4: Run all tests to confirm nothing regressed**

```bash
npm test
```

Expected: all tests pass.

---

## Known limitations

- `webkitSpeechRecognition` is Chrome-only; the mic-unavailable state handles other browsers gracefully.
- Two simultaneous SpeechRecognition instances (main + interrupt listener) may not work in all Chrome versions — test on Chrome 120+.
- `speakProduct` in guided mode uses `session.productIndex + 1` to look ahead; this assumes `session.advance()` is synchronous — it is (React state update is batched but the return value is computed before setState).
- The `speak` onEnd callback for the "Still there?" timeout starts a grace timer; if the user speaks during grace, the main rec will not be running and the input is lost. This is acceptable behavior for the demo.
