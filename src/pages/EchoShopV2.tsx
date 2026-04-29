import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { Header } from '../components/Header'
import { Card } from '../components/Card'
import { Waveform, type WaveformState } from '../components/Waveform'
import { Bubble } from '../components/Bubble'
import { Toggle } from '../components/Toggle'
import { PageTransition } from '../components/PageTransition'
import { products } from '../data/products'
import { type Layout } from '../utils/layoutEngine'
import styles from './EchoShopV2.module.css'

const THUMBNAIL_POOL = [products[0], products[2], products[3], products[4]]

type TextPhase = 'prompt' | 'user-input' | 'system-response'

const PHASE_CONTENT: Record<TextPhase, { line1: string[]; line2: string[]; italic: boolean }> = {
  prompt: {
    line1: 'What products do you want to explore today'.split(' '),
    line2: 'Any particular ideas ?'.split(' '),
    italic: false,
  },
  'user-input': {
    line1: 'I want recommendations for dresses'.split(' '),
    line2: 'for a casual but elegant night party.'.split(' '),
    italic: true,
  },
  'system-response': {
    line1: 'We have 4 suggestions that can be perfect'.split(' '),
    line2: 'for your night out.'.split(' '),
    italic: false,
  },
}

export const EchoShopV2 = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const layout: Layout = (location.state as any)?.layout ?? 'value-first'
  const showResults = (location.state as any)?.showResults ?? false

  const [textPhase, setTextPhase] = useState<TextPhase>(showResults ? 'system-response' : 'prompt')
  const [waveformState, setWaveformState] = useState<WaveformState>(showResults ? 'resting' : 'system-talking')
  const [hasResults, setHasResults] = useState(showResults)
  const [activePoolIndex, setActivePoolIndex] = useState(1)
  const activeProduct = THUMBNAIL_POOL[activePoolIndex]
  const transcriptionRef = useRef<HTMLDivElement>(null)
  const heroWrapRef = useRef<HTMLDivElement>(null)
  const leftSectionRef = useRef<HTMLDivElement>(null)
  const detailPanelRef = useRef<HTMLDivElement>(null)
  const thumbnailsRef = useRef<HTMLDivElement>(null)
  const prevIndexRef = useRef(activePoolIndex)

  // 1. Title entry — only when page loads without results
  useLayoutEffect(() => {
    if (showResults) return
    const ctx = gsap.context(() => {
      gsap.set('[data-animate="title"]', { opacity: 0, y: 16 })
      gsap.to('[data-animate="title"]', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.15 })
    })
    return () => ctx.revert()
  }, [])

  // 2. Results section entry — fires whenever hasResults flips to true
  useLayoutEffect(() => {
    if (!hasResults) return
    const hero = heroWrapRef.current
    const left = leftSectionRef.current
    const detail = detailPanelRef.current
    const thumbs = thumbnailsRef.current
    if (!hero) return

    gsap.set([hero, left, detail, thumbs], { opacity: 0, y: 16 })
    const tl = gsap.timeline()
    tl.to(hero, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
    tl.to([left, detail], { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.07 }, '+=0.08')
    tl.to(thumbs, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '+=0.08')

    return () => { tl.kill() }
  }, [hasResults])

  // 3. Thumbnail click re-animate — skip initial render
  useEffect(() => {
    if (prevIndexRef.current === activePoolIndex) return
    prevIndexRef.current = activePoolIndex
    if (!hasResults || !heroWrapRef.current) return

    gsap.fromTo(heroWrapRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: 'power2.out' }
    )
    if (detailPanelRef.current) {
      gsap.fromTo(detailPanelRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.35, ease: 'power2.out', delay: 0.08 }
      )
    }
  }, [activePoolIndex, hasResults])

  // Transcription / waveform sequencing (unchanged)
  useEffect(() => {
    const el = transcriptionRef.current!
    const l1Words = el.querySelectorAll<HTMLElement>('[data-word="l1"]')
    const l2Words = el.querySelectorAll<HTMLElement>('[data-word="l2"]')
    const l1Para = el.querySelector<HTMLElement>('[data-para="l1"]')!
    const l2Para = el.querySelector<HTMLElement>('[data-para="l2"]')!

    gsap.set([l1Words, l2Words], { opacity: 0, y: 5 })
    gsap.set([l1Para, l2Para], { opacity: 1, color: '#000000' })

    const delay = textPhase === 'prompt' ? 0.5 : 0.2
    const tl = gsap.timeline({ delay })

    tl.to(l1Words, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' })
    tl.to(l1Para, { color: '#716F6F', duration: 0.6, ease: 'power1.inOut' }, '+=0.25')
    tl.to(l2Words, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' }, '<')

    if (textPhase === 'prompt') {
      tl.call(() => setWaveformState('resting'))
      tl.to(l2Para, { color: '#716F6F', duration: 0.6, ease: 'power1.inOut' }, '+=0.8')
      tl.call(() => setTextPhase('user-input'))
    } else if (textPhase === 'user-input') {
      tl.to([l1Para, l2Para], { opacity: 0, duration: 0.5, ease: 'power1.inOut' }, '+=0.8')
      tl.call(() => {
        setWaveformState('system-talking')
        setHasResults(true)
        setTextPhase('system-response')
      })
    } else {
      tl.call(() => setWaveformState('resting'))
      tl.to(l2Para, { color: '#716F6F', duration: 0.6, ease: 'power1.inOut' }, '+=1')
    }

    return () => { tl.kill() }
  }, [textPhase])

  const { line1, line2, italic } = PHASE_CONTENT[textPhase]

  return (
    <PageTransition className={styles.page} data-experience="echo">
      <Header />

      <main className={styles.main}>
        <motion.div
          layout
          className={`${styles.titleWrap} ${hasResults ? styles.titleWrapResults : ''}`}
        >
          <motion.h1 layout="position" className={styles.title} data-animate="title">
            WHAT PRODUCTS DO YOU<br />WANT TODAY?
          </motion.h1>
        </motion.div>

        {hasResults && (
          <div className={styles.results}>
            {/* Left column — breadcrumb anchored to hero's left edge */}
            <div className={styles.leftSection} ref={leftSectionRef}>
              <div className={styles.breadcrumb}>
                <span className={styles.breadcrumbSub}>4 results for:</span>
                <h2 className={styles.breadcrumbMain}>DRESSES</h2>
              </div>
            </div>

            {/* Center: hero image — navigates to product detail */}
            <div
              ref={heroWrapRef}
              className={styles.heroWrap}
              onClick={() => navigate(`/product/${activeProduct.id}`, { state: { from: 'echo-v2' } })}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={activeProduct.image}
                alt={activeProduct.name}
                className={styles.heroImg}
              />
            </div>

            {/* Product info — col 9/10 */}
            <div className={styles.detailPanel} ref={detailPanelRef}>
              <div className={styles.detailMeta}>
                <span className={`body-l ${styles.detailName}`}>
                  {activeProduct.name}
                </span>
                <p className={`body-m ${styles.detailDesc}`}>
                  {activeProduct.shortDescription ?? activeProduct.description}
                </p>
                <span className={styles.detailPrice}>${activeProduct.price}</span>
                {activeProduct.colors.length > 0 && (
                  <div className={styles.detailSwatches}>
                    {activeProduct.colors.map((c) => (
                      <span
                        key={c}
                        className={styles.swatch}
                        style={{
                          background: c,
                          border: c === '#FFFFFF' ? '1px solid var(--color-border-subtle)' : 'none',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <Bubble />
            </div>

            {/* Thumbnails — fixed positions, state-only transitions */}
            <div className={styles.thumbnails} ref={thumbnailsRef}>
              {THUMBNAIL_POOL.map((product, i) => (
                <button
                  key={product.id}
                  className={`${styles.thumbnailItem} ${i === activePoolIndex ? styles.thumbnailActive : styles.thumbnailInactive}`}
                  onClick={() => setActivePoolIndex(i)}
                >
                  <Card product={product} variant="thumbnail" />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Fixed bottom: waveform + transcription */}
      <div className={styles.bottomBar}>
        <div className={`${styles.waveformArea} ${waveformState === 'resting' ? styles.waveformResting : ''}`}>
          <Waveform state={waveformState} />
        </div>
        <div ref={transcriptionRef} className={styles.transcription}>
          <p data-para="l1" className={`${styles.transLine} ${italic ? styles.transLineItalic : ''}`}>
            {line1.map((w, i) => <span key={i} data-word="l1">{w}{' '}</span>)}
          </p>
          <p data-para="l2" className={`${styles.transLine} ${italic ? styles.transLineItalic : ''}`}>
            {line2.map((w, i) => <span key={i} data-word="l2">{w}{' '}</span>)}
          </p>
        </div>
      </div>

      <div className={styles.toggleWrap}>
        <Toggle active="echo" onChange={(m) => m === 'gaze' && navigate('/gaze')} />
      </div>
    </PageTransition>
  )
}
