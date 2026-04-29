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
  { value: 'guided', label: 'GUIDE ME', hint: 'Present products one by one.' },
  { value: 'ask', label: "I'LL ASK", hint: "I'll tell you when I need help." },
]

const STEPS = [
  {
    line1: "Welcome to Echo. I'll ask you two quick questions".split(' '),
    line2: 'to set up your experience.'.split(' '),
  },
  {
    line1: 'Got it. How do you want to explore?'.split(' '),
    line2: "Say 'guide me' and I'll take you through the collection...".split(' '),
  },
]

export const EchoOnboarding = () => {
  const [step, setStep] = useState(0)
  const [detail, setDetail] = useState<DetailLevel>('essentials')
  const [nav, setNav] = useState<NavStyle>('guided')
  const [waveformState, setWaveformState] = useState<WaveformState>('system-talking')
  const navigate = useNavigate()
  const transcriptionRef = useRef<HTMLDivElement>(null)

  // Page entry: header → [counter + question stagger] → options → bottom
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set('[data-animate]', { opacity: 0, y: 16 })
      gsap.set('[data-step-line]', { opacity: 0, y: 16 })
      const tl = gsap.timeline()
      tl.to('[data-animate="header"]', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
      tl.to('[data-step-line="1"]', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08 }, '-=0.35')
      tl.to('[data-step-line="2"]', { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '-=0.3')
      tl.to('[data-animate="bottom"]', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.35')
    })
    return () => ctx.revert()
  }, [])

  // Step change — set incoming elements invisible before paint
  useLayoutEffect(() => {
    if (step === 0) return
    gsap.set('[data-step-line]', { opacity: 0, y: 16 })
  }, [step])

  // Step change — same stagger reveal as initial entry, center content only
  useEffect(() => {
    if (step === 0) return
    const tl = gsap.timeline()
    tl.to('[data-step-line="1"]', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08 })
    tl.to('[data-step-line="2"]', { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '-=0.3')
    return () => { tl.kill() }
  }, [step])

  // Transcription / waveform sequencing (unchanged)
  useEffect(() => {
    const el = transcriptionRef.current!
    const l1Words = el.querySelectorAll<HTMLElement>('[data-word="l1"]')
    const l2Words = el.querySelectorAll<HTMLElement>('[data-word="l2"]')
    const l1Para  = el.querySelector<HTMLElement>('[data-para="l1"]')!
    const l2Para  = el.querySelector<HTMLElement>('[data-para="l2"]')!

    setWaveformState('system-talking')
    gsap.set([l1Words, l2Words], { opacity: 0, y: 5 })
    gsap.set([l1Para, l2Para], { color: '#000000' })

    const tl = gsap.timeline({ delay: 0.5 })
    tl.to(l1Words, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' })
    tl.to(l1Para, { color: '#716F6F', duration: 0.6, ease: 'power1.inOut' }, '+=0.25')
    tl.to(l2Words, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' }, '<')
    tl.call(() => setWaveformState('resting'))
    tl.to(l2Para, { color: '#716F6F', duration: 0.6, ease: 'power1.inOut' }, '+=1')

    return () => { tl.kill() }
  }, [step])

  const handleContinue = () => {
    if (step === 0) {
      // Fade out current step content, then swap
      gsap.to('[data-step-line]', {
        opacity: 0, y: -8, duration: 0.2, ease: 'power2.in',
        onComplete: () => setStep(1),
      })
    } else {
      const layout = assignLayout(detail, nav)
      navigate('/echo-v2', { state: { layout } })
    }
  }

  const { line1, line2 } = STEPS[step]

  return (
    <PageTransition className={styles.page}>
      <div data-animate="header"><Header /></div>

      <div className={styles.content}>
        {step === 0 ? (
          <div className={styles.step}>
            <p className={styles.counter} data-step-line="1">1 / 2</p>
            <h1 className={styles.question} data-step-line="1">
              WHEN I DESCRIBE A PRODUCT,<br />WHAT DO YOU PREFER?
            </h1>
            <div className={styles.options} data-step-line="2">
              {detailOptions.map((opt) => (
                <button
                  key={opt.value}
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
          </div>
        ) : (
          <div className={styles.step}>
            <p className={styles.counter} data-step-line="1">2 / 2</p>
            <h1 className={styles.question} data-step-line="1">
              HOW DO YOU WANT TO<br />EXPLORE?
            </h1>
            <div className={styles.options} data-step-line="2">
              {navOptions.map((opt) => (
                <button
                  key={opt.value}
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
          </div>
        )}
      </div>

      {/* Fixed bottom: waveform then transcription text directly below */}
      <div className={styles.bottomBar} data-animate="bottom">
        <div className={`${styles.waveformWrap} ${waveformState === 'resting' ? styles.waveformResting : ''}`}>
          <Waveform state={waveformState} />
        </div>
        <div ref={transcriptionRef} className={styles.transcription}>
          <p data-para="l1" className={styles.transLine}>
            {line1.map((w, i) => <span key={i} data-word="l1">{w}{' '}</span>)}
          </p>
          <p data-para="l2" className={styles.transLine}>
            {line2.map((w, i) => <span key={i} data-word="l2">{w}{' '}</span>)}
          </p>
        </div>
      </div>

      {/* Fixed CTA: bottom-left, plain text matching header nav links */}
      <button className={styles.cta} data-animate="bottom" onClick={handleContinue}>
        {step === 0 ? 'Continue' : 'Start exploring'}
      </button>
    </PageTransition>
  )
}
