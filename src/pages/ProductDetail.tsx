import { useState, useLayoutEffect, useRef } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { Header } from '../components/Header'
import { Toggle } from '../components/Toggle'
import { PageTransition } from '../components/PageTransition'
import { products } from '../data/products'
import styles from './ProductDetail.module.css'

import detail1 from '../assets/images/product-detail/image 1.png'
import detail2 from '../assets/images/product-detail/image 2.png'
import detail3 from '../assets/images/product-detail/image 3.png'
import detail4 from '../assets/images/product-detail/image 4.png'
import detail5 from '../assets/images/product-detail/image 5.png'

const detailImages = [detail1, detail2, detail3, detail4, detail5]

const COLOR_LABELS: Record<string, string> = {
  '#000000': 'Black',
  '#FFFFFF': 'White',
  '#BDBDBD': 'Gray',
  '#C7E11E': 'Lime',
  '#9E0003': 'Red',
  '#1A542F': 'Forest',
}

const ACCORDION_CONTENT: Record<string, string> = {
  DETAILS:
    'Dress with thin straps and a straight neckline. Long length, straight cut with pleated fabric throughout. Designed for the Fall Winter 26/27 collection.',
  MATERIALS:
    'Superlight tricoline fabric. Dry clean recommended. Do not tumble dry or bleach. Iron on low heat with a pressing cloth.',
  SHIPPING:
    'Complimentary shipping on orders over $200. Standard delivery 3–5 business days. Express options available at checkout.',
}

export const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const from: string = (location.state as any)?.from ?? 'gaze'
  const product = products.find(p => p.id === id) ?? products[2]

  const [selectedColor, setSelectedColor] = useState(product.colors[0])
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [openSection, setOpenSection] = useState<string | null>(null)

  const firstImageRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const firstImg = firstImageRef.current
    const panelItems = panelRef.current?.querySelectorAll<HTMLElement>('[data-panel-item]')
    if (!firstImg || !panelItems?.length) return

    gsap.set(firstImg, { opacity: 0, y: 16 })
    gsap.set(panelItems, { opacity: 0, y: 16 })

    const tl = gsap.timeline()
    tl.to(firstImg, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
    tl.to(panelItems, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.09 }, '+=0.1')

    return () => { tl.kill() }
  }, [])

  const toggleSection = (s: string) =>
    setOpenSection(prev => (prev === s ? null : s))

  return (
    <PageTransition className={styles.page}>
      <div className={styles.stickyHeader}>
        <Header />
      </div>

      <div className={styles.layout}>
        <aside className={styles.panel} ref={panelRef}>
          <nav className={styles.breadcrumb}>
            <Link to="/gaze" className={styles.breadcrumbLink}>Home</Link>
            <span className={styles.sep}>›</span>
            <Link
              to={from === 'echo-v2' ? '/echo-v2' : '/gaze'}
              state={from === 'echo-v2' ? { showResults: true } : undefined}
              className={styles.breadcrumbLink}
            >Dresses</Link>
            <span className={styles.sep}>›</span>
            <span className={styles.breadcrumbCurrent}>{product.name}</span>
          </nav>

          <div className={styles.titleRow} data-panel-item>
            <h1 className={styles.name}>{product.name.toUpperCase()}</h1>
            <span className={styles.price}>${product.price}</span>
          </div>

          {product.description.split('\n\n').map((para, i) => (
            <p key={i} className={styles.description} data-panel-item>{para}</p>
          ))}

          <div className={styles.field} data-panel-item>
            <span className={styles.fieldLabel}>COLOR:</span>
            <div className={styles.swatches}>
              {product.colors.map(c => (
                <button
                  key={c}
                  className={`${styles.swatch} ${selectedColor === c ? styles.swatchActive : ''}`}
                  style={{ background: c }}
                  onClick={() => setSelectedColor(c)}
                  title={COLOR_LABELS[c.toUpperCase()] ?? c}
                  aria-pressed={selectedColor === c}
                />
              ))}
            </div>
          </div>

          <div className={styles.field} data-panel-item>
            <span className={styles.fieldLabel}>SIZE:</span>
            <div className={styles.sizeOptions}>
              {product.sizes.map(s => (
                <button
                  key={s}
                  className={`${styles.sizeBtn} ${selectedSize === s ? styles.sizeBtnActive : ''}`}
                  onClick={() => setSelectedSize(s)}
                  aria-pressed={selectedSize === s}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.accordions} data-panel-item>
            {['DETAILS', 'MATERIALS', 'SHIPPING'].map(section => (
              <div key={section} className={styles.accordion}>
                <button
                  className={styles.accordionTrigger}
                  onClick={() => toggleSection(section)}
                  aria-expanded={openSection === section}
                >
                  <span>{section}</span>
                  <span className={styles.accordionMark}>
                    {openSection === section ? '−' : '+'}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {openSection === section && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p className={styles.accordionBody}>
                        {ACCORDION_CONTENT[section]}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <button className={styles.addToBag} data-panel-item>ADD TO BAG</button>
        </aside>

        <div className={styles.images}>
          {detailImages.map((src, i) => (
            <div key={i} className={styles.imageFrame} ref={i === 0 ? firstImageRef : undefined}>
              <img
                src={src}
                alt={`${product.name} — view ${i + 1}`}
                className={styles.image}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.toggleWrap}>
        <Toggle active="gaze" onChange={m => m === 'echo' && navigate('/echo-onboarding')} />
      </div>
    </PageTransition>
  )
}
