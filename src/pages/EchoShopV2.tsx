import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { Header } from '../components/Header'
import { Card } from '../components/Card'
import { Waveform, type WaveformState } from '../components/Waveform'
import { Bubble } from '../components/Bubble'
import { PageTransition } from '../components/PageTransition'
import { products } from '../data/products'
import styles from './EchoShopV2.module.css'

const THUMBNAIL_POOL = [products[0], products[1], products[2], products[3], products[4]]

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
    line1: 'We have 5 suggestions that can be perfect'.split(' '),
    line2: 'for your night out.'.split(' '),
    italic: false,
  },
}

export const EchoShopV2 = () => {
  const navigate = useNavigate()
  const location = useLocation()
const showResults = (location.state as any)?.showResults ?? false

  const [textPhase, setTextPhase] = useState<TextPhase>(showResults ? 'system-response' : 'prompt')
  const [waveformState, setWaveformState] = useState<WaveformState>(showResults ? 'resting' : 'system-talking')
  const [hasResults, setHasResults] = useState(showResults)
  const [activePoolIndex, setActivePoolIndex] = useState(0)
  const activeProduct = THUMBNAIL_POOL[activePoolIndex]
  const transcriptionRef = useRef<HTMLDivElement>(null)
  const heroWrapRef = useRef<HTMLDivElement>(null)
  const leftSectionRef = useRef<HTMLDivElement>(null)
  const detailPanelRef = useRef<HTMLDivElement>(null)
  const thumbnailsRef = useRef<HTMLDivElement>(null)
  const prevIndexRef = useRef(activePoolIndex)
  const exitTlRef = useRef<gsap.core.Timeline | null>(null)

  // 1. Title entry on initial load (no results)
  useLayoutEffect(() => {
    if (showResults) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.set('[data-animate="title"]', { autoAlpha: 0, y: 16 })
        gsap.to('[data-animate="title"]', { autoAlpha: 1, y: 0, duration: 0.62, ease: 'power2.out', delay: 0.15 })
      })
      return () => ctx.revert()
    })
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set('[data-animate="title"]', { autoAlpha: 1, y: 0 })
    })
    return () => mm.revert()
  }, [])

  // 2. Full results sequence: title arrives at top → hero → left+right → thumbnails
  useLayoutEffect(() => {
    if (!hasResults) return
    const hero = heroWrapRef.current
    const left = leftSectionRef.current
    const detail = detailPanelRef.current
    const thumbs = thumbnailsRef.current
    const titleEl = document.querySelector<HTMLElement>('[data-animate="title"]')
    if (!hero) return

    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        if (titleEl) gsap.set(titleEl, { autoAlpha: 0, y: 16 })
        gsap.set([hero, left, detail, thumbs], { autoAlpha: 0, y: 16 })

        const tl = gsap.timeline()

        if (titleEl) {
          tl.to(titleEl, { autoAlpha: 1, y: 0, duration: 0.52, ease: 'power2.out' })
        }
        tl.to(hero,   { autoAlpha: 1, y: 0, duration: 0.62, ease: 'power2.out' }, '<0.2')
        tl.to(left,   { autoAlpha: 1, y: 0, duration: 0.62, ease: 'power2.out' }, '<0.2')
        tl.to(detail, { autoAlpha: 1, y: 0, duration: 0.62, ease: 'power2.out' }, '<0.2')
        tl.to(thumbs, { autoAlpha: 1, y: 0, duration: 0.52, ease: 'power2.out' }, '<0.2')
      })
      return () => ctx.revert()
    })
    mm.add('(prefers-reduced-motion: reduce)', () => {
      if (titleEl) gsap.set(titleEl, { autoAlpha: 1, y: 0 })
      gsap.set([hero, left, detail, thumbs], { autoAlpha: 1, y: 0 })
    })
    return () => mm.revert()
  }, [hasResults])

  // 3. Thumbnail click — exit runs in the handler before state update; this effect handles enter-only
  useEffect(() => {
    if (prevIndexRef.current === activePoolIndex) return
    prevIndexRef.current = activePoolIndex
    if (!hasResults || !heroWrapRef.current) return

    const hero = heroWrapRef.current
    const detail = detailPanelRef.current

    const ctx = gsap.context(() => {
      const tl = gsap.timeline()
      tl.fromTo(hero,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.62, ease: 'power2.out' }
      )
      if (detail) {
        tl.fromTo(detail,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.62, ease: 'power2.out' },
          '+=0.03'
        )
      }
    })
    return () => ctx.revert()
  }, [activePoolIndex, hasResults])

  // Kill any pending exit animation on unmount
  useEffect(() => () => { exitTlRef.current?.kill() }, [])

  const handleThumbnailClick = (i: number) => {
    if (i === activePoolIndex) return
    const hero = heroWrapRef.current
    const detail = detailPanelRef.current
    if (!hero) return

    exitTlRef.current?.kill()
    const tl = gsap.timeline({ onComplete: () => setActivePoolIndex(i) })
    tl.to(hero, { autoAlpha: 0, y: -8, duration: 0.22, ease: 'power2.in', overwrite: 'auto' })
    if (detail) {
      tl.to(detail, { autoAlpha: 0, y: -8, duration: 0.18, ease: 'power2.in', overwrite: 'auto' }, '<+=0.04')
    }
    exitTlRef.current = tl
  }

  // Transcription / waveform sequencing
  useEffect(() => {
    const el = transcriptionRef.current!
    const l1Words = el.querySelectorAll<HTMLElement>('[data-word="l1"]')
    const l2Words = el.querySelectorAll<HTMLElement>('[data-word="l2"]')
    const l1Para = el.querySelector<HTMLElement>('[data-para="l1"]')!
    const l2Para = el.querySelector<HTMLElement>('[data-para="l2"]')!

    const ctx = gsap.context(() => {
      gsap.set([l1Words, l2Words], { autoAlpha: 0, y: 5 })
      gsap.set([l1Para, l2Para], { opacity: 1, color: '#000000' })

      const delay = textPhase === 'prompt' ? 0.5 : 0.2
      const tl = gsap.timeline({ delay })

      tl.to(l1Words, { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.08, ease: 'power3.out' })
      tl.to(l1Para, { color: '#716F6F', duration: 0.62, ease: 'power2.inOut' }, '+=0.25')
      tl.to(l2Words, { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.08, ease: 'power3.out' }, '<')

      if (textPhase === 'prompt') {
        tl.call(() => setWaveformState('resting'))
        tl.to(l2Para, { color: '#716F6F', duration: 0.62, ease: 'power2.inOut' }, '+=0.8')
        tl.call(() => setTextPhase('user-input'))
      } else if (textPhase === 'user-input') {
        // Fade text out; simultaneously fade title out so the class change happens invisibly
        tl.to([l1Para, l2Para], { autoAlpha: 0, duration: 0.52, ease: 'power2.inOut' }, '+=0.8')
        tl.to('[data-animate="title"]', { autoAlpha: 0, duration: 0.38, ease: 'power2.in' }, '<')
        // Only after everything is invisible: trigger results (CSS class snaps title to top position)
        tl.call(() => {
          setWaveformState('system-talking')
          setHasResults(true)
          setTextPhase('system-response')
        })
      } else {
        tl.call(() => setWaveformState('resting'))
        tl.to(l2Para, { color: '#716F6F', duration: 0.62, ease: 'power2.inOut' }, '+=1')
      }
    })

    return () => ctx.revert()
  }, [textPhase])

  const { line1, line2, italic } = PHASE_CONTENT[textPhase]

  return (
    <PageTransition className={styles.page} data-experience="echo">
      <Header />

      <main className={styles.main}>
        {/* Plain div — position is managed by class change + GSAP, not framer-motion FLIP */}
        <div className={`${styles.titleWrap} ${hasResults ? styles.titleWrapResults : ''}`}>
          <h1 className={styles.title} data-animate="title">
            WHAT PRODUCTS DO YOU<br />WANT TODAY?
          </h1>
        </div>

        {hasResults && (
          <div className={styles.results}>
            {/* Left column — breadcrumb anchored to hero's left edge */}
            <div className={styles.leftSection} ref={leftSectionRef}>
              <div className={styles.breadcrumb}>
                <span className={styles.breadcrumbSub}>5 results for:</span>
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
                <div className={styles.detailRow}>
                  <span className={styles.detailName}>
                    {activeProduct.name}
                  </span>
                  <span className={styles.detailPrice}>${activeProduct.price}</span>
                </div>
                <p className={`body-m ${styles.detailDesc}`}>
                  {activeProduct.shortDescription ?? activeProduct.description}
                </p>
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
                  onClick={() => handleThumbnailClick(i)}
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

    </PageTransition>
  )
}
