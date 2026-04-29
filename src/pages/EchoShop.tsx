import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Header } from '../components/Header'
import { SearchBar } from '../components/SearchBar'
import { Card } from '../components/Card'
import { Waveform, type WaveformState } from '../components/Waveform'
import { Toggle } from '../components/Toggle'
import { PageTransition } from '../components/PageTransition'
import { useVoiceInput } from '../hooks/useVoiceInput'
import { useVoiceOutput } from '../hooks/useVoiceOutput'
import { useKaraoke } from '../hooks/useKaraoke'
import { products } from '../data/products'
import { getVoiceScript, type Layout } from '../utils/layoutEngine'
import styles from './EchoShop.module.css'

const ACTIVE_INDEX = 2

export const EchoShop = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const layout: Layout = (location.state as any)?.layout ?? 'value-first'

  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'system-talking'>('idle')
  const [query, setQuery] = useState('')
  const [hasResults, setHasResults] = useState(false)
  const [demoPhase, setDemoPhase] = useState<'idle' | 'system' | 'user' | 'done'>('idle')
  const [demoTranscript, setDemoTranscript] = useState('')

  const activeProduct = products[ACTIVE_INDEX]
  const voiceScript = getVoiceScript(layout, activeProduct)
  const { words, updateBoundary, reset } = useKaraoke(voiceScript)

  const { speak, stop } = useVoiceOutput()

  const handleVoiceResult = useCallback((transcript: string) => {
    setQuery(transcript)
    setVoiceState('processing')
    setTimeout(() => {
      setHasResults(true)
      setVoiceState('system-talking')
      reset()
      speak(voiceScript, updateBoundary, () => setVoiceState('idle'))
    }, 600)
  }, [voiceScript, speak, updateBoundary, reset])

  const { startListening, stopListening } = useVoiceInput(handleVoiceResult)

  const handleActivate = useCallback(() => {
    if (voiceState === 'idle') {
      setVoiceState('listening')
      startListening()
    } else if (voiceState === 'listening') {
      stopListening()
      setVoiceState('idle')
    }
  }, [voiceState, startListening, stopListening])

  useEffect(() => {
    return () => stop()
  }, [stop])

  useEffect(() => {
    const TARGET = 'Dresses'
    const TYPE_START = 4200
    const CHAR_DELAY = 65

    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(setTimeout(() => setDemoPhase('system'),                1000))
    timers.push(setTimeout(() => setDemoPhase('idle'),                  2400))
    timers.push(setTimeout(() => setDemoPhase('user'),                  3400))
    timers.push(setTimeout(() => setDemoTranscript('Show me dresses'),  3700))

    TARGET.split('').forEach((_, idx) => {
      timers.push(setTimeout(
        () => setQuery(TARGET.slice(0, idx + 1)),
        TYPE_START + idx * CHAR_DELAY,
      ))
    })

    timers.push(setTimeout(() => {
      setHasResults(true)
      setDemoPhase('done')
    }, TYPE_START + TARGET.length * CHAR_DELAY + 150))

    return () => timers.forEach(clearTimeout)
  }, [])

  const effectiveWaveformState: WaveformState =
    voiceState !== 'idle'
      ? voiceState === 'listening' ? 'listening'
        : voiceState === 'system-talking' ? 'system-talking'
        : 'idle'
      : demoPhase === 'system' ? 'system-talking'
      : demoPhase === 'user'   ? 'user-talking'
      : 'idle'

  const isUserTalking = effectiveWaveformState === 'user-talking'

  const searchBarState =
    voiceState === 'listening' ? 'listening' as const :
    query ? 'entered' as const :
    'default' as const

  const waveformLabel =
    voiceState === 'listening' ? 'Listening...' : 'Say something or type...'

  return (
    <PageTransition className={styles.page} data-experience="echo">
      <Header />

      <main className={styles.main}>
        <h1 className={styles.title}>WHAT ARE YOU<br />LOOKING FOR TODAY?</h1>

        <div className={styles.searchWrap}>
          <SearchBar
            state={searchBarState}
            value={query}
            onChange={setQuery}
            onActivate={handleActivate}
          />
        </div>

        {hasResults && (
          <>
            <p className={styles.count}>{products.length} results</p>
            <div className={styles.grid}>
              {products.map((product, i) => (
                <Card
                  key={product.id}
                  product={product}
                  variant={i === ACTIVE_INDEX ? 'echo-big' : 'echo-small'}
                  karaokeWords={i === ACTIVE_INDEX && voiceState === 'system-talking' ? words : undefined}
                  style={{ animationDelay: `${i * 0.07}s` }}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <div className={`${styles.waveformWrap} ${isUserTalking ? styles.waveformUser : ''}`}>
        <Waveform state={effectiveWaveformState} label={waveformLabel} />
        {demoTranscript && <p className={styles.transcript}>"{demoTranscript}"</p>}
      </div>

      <div className={styles.toggleWrap}>
        <Toggle active="echo" onChange={(m) => m === 'gaze' && navigate('/gaze')} />
      </div>
    </PageTransition>
  )
}
