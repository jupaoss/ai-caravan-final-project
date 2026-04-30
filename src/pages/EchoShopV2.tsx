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

  // --- Animations: initial title ---
  useLayoutEffect(() => {
    if (showResults) return

    const ctx = gsap.context(() => {
      gsap.set('[data-animate="title"]', { autoAlpha: 0, y: 16 })
      gsap.to('[data-animate="title"]', {
        autoAlpha: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
      })
    })

    return () => ctx.revert()
  }, [])

  // --- Results animation ---
  useLayoutEffect(() => {
    if (!hasResults) return

    const hero = heroWrapRef.current
    const left = leftSectionRef.current
    const detail = detailPanelRef.current
    const thumbs = thumbnailsRef.current

    const ctx = gsap.context(() => {
      gsap.set([hero, left, detail, thumbs], { autoAlpha: 0, y: 16 })

      const tl = gsap.timeline()

      tl.to(hero, { autoAlpha: 1, y: 0, duration: 0.6 })
      tl.to(left, { autoAlpha: 1, y: 0, duration: 0.6 }, '<')
      tl.to(detail, { autoAlpha: 1, y: 0, duration: 0.6 }, '<')
      tl.to(thumbs, { autoAlpha: 1, y: 0, duration: 0.5 }, '<')
    })

    return () => ctx.revert()
  }, [hasResults])

  // --- Thumbnail change animation ---
  useEffect(() => {
    if (prevIndexRef.current === activePoolIndex) return
    prevIndexRef.current = activePoolIndex

    const hero = heroWrapRef.current
    if (!hero) return

    gsap.fromTo(
      hero,
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.5 }
    )
  }, [activePoolIndex])

  const handleThumbnailClick = (i: number) => {
    if (i === activePoolIndex) return

    const hero = heroWrapRef.current
    if (!hero) return

    exitTlRef.current?.kill()

    const tl = gsap.timeline({
      onComplete: () => setActivePoolIndex(i),
    })

    tl.to(hero, { autoAlpha: 0, y: -8, duration: 0.2 })

    exitTlRef.current = tl
  }

  const { line1, line2, italic } = PHASE_CONTENT[textPhase]

  return (
    <PageTransition className={styles.page}>
      <Header />

      <main className={styles.main}>
        <div className={styles.titleWrap}>
          <h1 className={styles.title} data-animate="title">
            WHAT PRODUCTS DO YOU
            <br />
            WANT TODAY?
          </h1>
        </div>

        {hasResults && (
          <div className={styles.results}>
            {/* Left */}
            <div className={styles.leftSection} ref={leftSectionRef}>
              <div className={styles.breadcrumb}>
                <span>5 results for:</span>
                <h2>DRESSES</h2>
              </div>
            </div>

            {/* Hero (FIX CLAVE AQUÍ) */}
            <div
              key={activeProduct.id} // 👈 SOLUCIÓN DEL BUG
              ref={heroWrapRef}
              className={styles.heroWrap}
              onClick={() =>
                navigate(`/product/${activeProduct.id}`, {
                  state: { from: 'echo-v2' },
                })
              }
            >
              <img
                src={activeProduct.image}
                alt={activeProduct.name}
                className={styles.heroImg}
              />
            </div>

            {/* Detail */}
            <div className={styles.detailPanel} ref={detailPanelRef}>
              <div className={styles.detailRow}>
                <span>{activeProduct.name}</span>
                <span>${activeProduct.price}</span>
              </div>

              <p className={`${styles.description} ${styles.detailDesc}`}>
                {activeProduct.shortDescription ?? activeProduct.description}
              </p>

              <div className={styles.detailSwatches}>
                {activeProduct.colors.map((c) => (
                  <span
                    key={c}
                    className={styles.swatch}
                    style={{
                      background: c,
                      border: '1px solid var(--color-border-subtle)', // 👈 siempre
                    }}
                  />
                ))}
              </div>

              <Bubble />
            </div>

            {/* Thumbnails */}
            <div className={styles.thumbnails} ref={thumbnailsRef}>
            {THUMBNAIL_POOL.map((p, i) => (
              <button
                key={p.id}
                className={`${styles.thumbnailItem} ${
                  i === activePoolIndex
                    ? styles.thumbnailActive
                    : styles.thumbnailInactive
                }`}
                onClick={() => handleThumbnailClick(i)}
              >
                <Card product={p} variant="thumbnail" />
              </button>
            ))}
          </div>
          </div>
        )}
      </main>

      {/* Bottom */}
      <div ref={transcriptionRef}>
        <p>{line1.join(' ')}</p>
        <p>{line2.join(' ')}</p>
      </div>
    </PageTransition>
  )
}