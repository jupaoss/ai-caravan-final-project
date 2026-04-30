import { useState, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { PageTransition } from '../components/PageTransition'
import { Toggle } from '../components/Toggle'
import responsiveLogoUrl from '../assets/images/00-logo-responsive.svg'
import home1Url from '../assets/images/01-home-1.png'
import home2Url from '../assets/images/01-home-2.png'
import keyboardUrl from '../assets/images/14-keyboard.svg'
import mouseUrl from '../assets/images/08-mouse.svg'
import audioLinesUrl from '../assets/images/09-audio-lines.svg'
import micUrl from '../assets/images/10-mic.svg'
import styles from './EntryPoint.module.css'

type Mode = 'gaze' | 'echo'

const modeConfig = {
  gaze: {
    label: 'GAZE',
    description: 'Use your mouse or keyboard to browse and explore at your own pace.',
    path: '/gaze',
  },
  echo: {
    label: 'ECHO',
    description: 'Use your voice to navigate. The platform will guide you throughout the experience.',
    path: '/echo-onboarding',
  },
}

export const EntryPoint = () => {
  const [mode, setMode] = useState<Mode>('gaze')
  const navigate = useNavigate()
  const config = modeConfig[mode]

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.set('[data-animate]', { autoAlpha: 0, y: 16 })
        const tl = gsap.timeline()
        tl.to('[data-animate="heading"]', { autoAlpha: 1, y: 0, duration: 0.62, ease: 'power2.out' })
        tl.to(['[data-animate="logo"]', '[data-animate="panel"]'], {
          autoAlpha: 1, y: 0, duration: 0.62, ease: 'power2.out', stagger: 0.07,
        }, '+=0.1')
      })
      return () => ctx.revert()
    })
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set('[data-animate]', { autoAlpha: 1, y: 0 })
    })
    return () => mm.revert()
  }, [])

  return (
    <PageTransition className={styles.page}>
      <div className={styles.heading} data-animate="heading">
        <h1 className={styles.title}>HOW DO YOU WANT TO<br />EXPLORE TODAY?</h1>
        <p className={styles.subtitle}>Choose the experience that works best for you.</p>
      </div>

      <div className={styles.heroArea}>
        <div className={styles.circleOuter} />
        <div className={styles.circle} />

        <AnimatePresence>
          <motion.img
            key={mode + '-bg'}
            src={mode === 'gaze' ? home1Url : home2Url}
            className={styles.heroImg}
            alt=""
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.52, ease: 'easeIn' } }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        </AnimatePresence>

        <div className={styles.logoMark} data-animate="logo">
          <img src={responsiveLogoUrl} alt="AI CRVN" width="50" height="80" />
        </div>

        <div className={styles.panelAnchor} data-animate="panel">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            className={styles.panel}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
          >
            <div className={styles.panelIcon} aria-hidden>
              {mode === 'gaze' ? (
                <>
                  <img src={keyboardUrl} alt="" width="24" height="24" />
                  <img src={mouseUrl} alt="" width="24" height="24" />
                </>
              ) : (
                <>
                  <img src={audioLinesUrl} alt="" width="24" height="24" />
                  <img src={micUrl} alt="" width="24" height="24" />
                </>
              )}
            </div>
            <h2 className={styles.panelLabel}>{config.label}</h2>
            <p className={styles.panelDesc}>{config.description}</p>
            <button className={styles.enterBtn} onClick={() => navigate(config.path)}>
              ENTER
            </button>
          </motion.div>
        </AnimatePresence>
        </div>

        <div className={styles.toggleWrap}>
          <Toggle active={mode} onChange={setMode} />
        </div>
      </div>
    </PageTransition>
  )
}
