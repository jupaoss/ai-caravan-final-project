import { useState, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { Header } from '../components/Header'
import { Card } from '../components/Card'
import { Toggle } from '../components/Toggle'
import { PageTransition } from '../components/PageTransition'
import { products } from '../data/products'
import styles from './GazeShop.module.css'

const categories = ['SEE ALL', 'DRESSES', 'FRAGRANCE', 'JEWELRY', 'BLOUSE', 'BAG']

export const GazeShop = () => {
  const [activeCategory, setActiveCategory] = useState('DRESSES')
  const navigate = useNavigate()

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set('[data-animate]', { opacity: 0, y: 16 })
      const tl = gsap.timeline()
      tl.to(['[data-animate="meta"]'], { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.09 })
      tl.to('[data-animate="filters"]', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
      tl.to('[data-animate="card"]', { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.035 }, '-=0.25')
    })
    return () => ctx.revert()
  }, [])

  return (
    <PageTransition className={styles.page} data-experience="gaze">
      <Header />

      <main className={styles.main}>
        <nav className={styles.breadcrumb} data-animate="meta">
          <span>Home</span>
          <span className={styles.sep}>›</span>
          <span>New in women</span>
        </nav>

        <h1 className={styles.title} data-animate="meta">FALL WINTER 26/27 — WE ARE NATURE</h1>

        <div className={styles.filterRow} data-animate="filters">
          <div className={styles.tabs}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <button className={styles.filterBtn}>FILTER</button>
        </div>

        <div className={styles.grid}>
          {[...products, ...products, ...products].map((product, i) => (
            <div
              key={`${product.id}-${i}`}
              data-animate="card"
              onClick={() => navigate(`/product/${product.id}`, { state: { from: 'gaze' } })}
              style={{ cursor: 'pointer' }}
            >
              <Card product={product} variant="gaze" />
            </div>
          ))}
        </div>
      </main>

      <div className={styles.toggleWrap}>
        <Toggle active="gaze" onChange={(m) => m === 'echo' && navigate('/echo-onboarding')} />
      </div>
    </PageTransition>
  )
}
