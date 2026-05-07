import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { Header } from '../components/Header'
import { PageTransition } from '../components/PageTransition'
import { Waveform, type WaveformState } from '../components/Waveform'
import { assignLayout, type DetailLevel, type NavStyle } from '../utils/layoutEngine'
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
  { value: 'guided', label: 'GUIDE ME THROUGH IT', hint: 'Echo leads the way — you listen and discover.' },
  { value: 'ask', label: "I'LL ASK THE QUESTIONS", hint: "You're in control — ask anything, anytime." },
]

type Step = 1 | 2
type TextPhase = 'intro' | 'question' | 'options'

const PHASE_CONTENT: Record<Step, Record<TextPhase, { line1: string[]; line2: string[] }>> = {
  1: {
    intro: {
      line1: "Welcome to Echo. I'll ask you two quick questions".split(' '),
      line2: 'to set up your experience.'.split(' '),
    },
    question: {
      line1: 'When I describe a product,'.split(' '),
      line2: 'what do you prefer?'.split(' '),
    },
    options: {
      line1: "Say 'essentials' for just the key details,".split(' '),
      line2: "or 'full story' for the complete picture.".split(' '),
    },
  },
  2: {
    intro: {
      line1: 'One more question,'.split(' '),
      line2: "then we're all set.".split(' '),
    },
    question: {
      line1: 'How would you like to explore?'.split(' '),
      line2: 'Guided by me, or ask as you go?'.split(' '),
    },
    options: {
      line1: "Say 'guide me' for a curated tour,".split(' '),
      line2: "or 'I'll ask' to lead the way.".split(' '),
    },
  },
}

export const EchoOnboarding = () => {
  const [detail, setDetail] = useState<DetailLevel>('essentials')
  const [nav, setNav] = useState<NavStyle>('guided')
  const [step, setStep] = useState<Step>(1)
  const [waveformState, setWaveformState] = useState<WaveformState>('system-talking')
  const [textPhase, setTextPhase] = useState<TextPhase>('intro')
  const navigate = useNavigate()
  const transcriptionRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isFirstStep = useRef(true)

  // Reset words to invisible before paint on phase change
  useLayoutEffect(() => {
    const el = transcriptionRef.current
    if (!el) return
    gsap.set(el.querySelectorAll<HTMLElement>('[data-word]'), { autoAlpha: 0, y: 5 })
  }, [textPhase])

  // Page entry: header → title → options stagger → bottom bar + CTA
  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.set('[data-animate="header"]',     { autoAlpha: 0, y: 16 })
        gsap.set('[data-animate="title-line"]', { autoAlpha: 0, y: 12 })
        gsap.set('[data-animate="option"]',     { autoAlpha: 0, y: 12 })
        gsap.set('[data-animate="bottom"]',     { autoAlpha: 0, y: 16 })
        gsap.set('[data-animate="cta"]',        { autoAlpha: 0 })

        const tl = gsap.timeline()
        tl.to('[data-animate="header"]',     { autoAlpha: 1, y: 0, duration: 0.62, ease: 'power2.out' })
        tl.to('[data-animate="title-line"]', { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.08 }, '-=0.35')
        tl.to('[data-animate="option"]',     { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.03 }, '-=0.2')
        tl.to('[data-animate="bottom"]',     { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '-=0.25')
        tl.to('[data-animate="cta"]',        { autoAlpha: 1, duration: 0.35, ease: 'power2.out' }, '-=0.2')
      })
      return () => ctx.revert()
    })
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set('[data-animate]', { autoAlpha: 1, y: 0 })
    })
    return () => mm.revert()
  }, [])

  // Step 2 in-animation: same stagger as page entry, scoped to contentRef
  useLayoutEffect(() => {
    if (isFirstStep.current) {
      isFirstStep.current = false
      return
    }
    const el = contentRef.current
    if (!el) return

    const titleLines = el.querySelectorAll('[data-animate="title-line"]')
    const options = el.querySelectorAll('[data-animate="option"]')

    gsap.set(el, { autoAlpha: 1, y: 0 })
    gsap.set([titleLines, options], { autoAlpha: 0, y: 12 })

    const tl = gsap.timeline()
    tl.to(titleLines, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.08 })
    tl.to(options,    { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.03 }, '-=0.2')
  }, [step])

  // Word animation + automatic phase transitions — identical to echo-v2
  useEffect(() => {
    const el = transcriptionRef.current!
    const l1Words = el.querySelectorAll<HTMLElement>('[data-word="l1"]')
    const l2Words = el.querySelectorAll<HTMLElement>('[data-word="l2"]')

    setWaveformState('system-talking')

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set([l1Words, l2Words], { autoAlpha: 1, y: 0, color: '#716F6F' })
      setWaveformState('resting')
      return
    }

    const delay = step === 1 && textPhase === 'intro' ? 1.5
                : step === 2 && textPhase === 'intro' ? 0.8
                : 0

    const ctx = gsap.context(() => {
      gsap.set([l1Words, l2Words], { autoAlpha: 0, y: 5 })

      const tl = gsap.timeline({ delay })
      tl.to(l1Words, { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.08, ease: 'power3.out' })
      tl.to(l2Words, { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.08, ease: 'power3.out' }, '-=0.2')
      tl.call(() => setWaveformState('resting'))

      if (textPhase === 'intro') {
        tl.call(() => setTextPhase('question'), undefined, '+=1.5')
      } else if (textPhase === 'question') {
        tl.call(() => setTextPhase('options'), undefined, '+=1.0')
      } else {
        tl.to([l1Words, l2Words], { color: '#716F6F', duration: 0.8, ease: 'power2.inOut' }, '+=0.3')
      }
    })

    return () => ctx.revert()
  }, [textPhase, step])

  const handleNext = () => {
    const el = contentRef.current
    if (!el) return
    gsap.to(el, {
      autoAlpha: 0, y: -16, duration: 0.35, ease: 'power2.in',
      onComplete: () => {
        setStep(2)
        setTextPhase('intro')
      },
    })
  }

  const handleContinue = () => {
    sessionStorage.setItem('echoOnboardingDone', 'true')
    const layout = assignLayout(detail, nav)
    navigate('/echo-v2', { state: { layout } })
  }

  const { line1, line2 } = PHASE_CONTENT[step][textPhase]

  return (
    <PageTransition className={styles.page}>
      <div data-animate="header"><Header /></div>

      <div className={styles.content}>
        <div ref={contentRef} className={styles.step}>
          {step === 1 ? (
            <>
              <h1 className={styles.question}>
                <span data-animate="title-line" className={styles.questionLine}>WHEN I DESCRIBE A PRODUCT,</span>
                <span data-animate="title-line" className={styles.questionLine}>WHAT DO YOU PREFER?</span>
              </h1>
              <div className={styles.options}>
                {detailOptions.map((opt) => (
                  <button
                    key={opt.value}
                    data-animate="option"
                    className={`${styles.option} ${detail === opt.value ? styles.selected : ''}`}
                    onClick={() => setDetail(opt.value)}
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
            </>
          ) : (
            <>
              <h1 className={styles.question}>
                <span data-animate="title-line" className={styles.questionLine}>HOW WOULD YOU LIKE</span>
                <span data-animate="title-line" className={styles.questionLine}>TO EXPLORE?</span>
              </h1>
              <div className={styles.options}>
                {navOptions.map((opt) => (
                  <button
                    key={opt.value}
                    data-animate="option"
                    className={`${styles.option} ${nav === opt.value ? styles.selected : ''}`}
                    onClick={() => setNav(opt.value)}
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
            </>
          )}
        </div>
      </div>

      <div className={styles.bottomBar} data-animate="bottom">
        <div className={`${styles.waveformArea} ${waveformState === 'resting' ? styles.waveformResting : ''}`}>
          <Waveform state={waveformState} />
        </div>
        <div ref={transcriptionRef} className={styles.transcription}>
          <p className={styles.transLine}>
            {line1.map((w, i) => <span key={i} data-word="l1">{w}{' '}</span>)}
          </p>
          <p className={styles.transLine}>
            {line2.map((w, i) => <span key={i} data-word="l2">{w}{' '}</span>)}
          </p>
        </div>
      </div>

      <button className={styles.cta} data-animate="cta" onClick={step === 1 ? handleNext : handleContinue}>
        {step === 1 ? 'Continue' : 'Start exploring'}
      </button>
    </PageTransition>
  )
}
