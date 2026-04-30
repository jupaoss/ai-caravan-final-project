import type { CSSProperties } from 'react'
import type { Product } from '../data/products'
import type { KaraokeWord } from '../hooks/useKaraoke'
import { Bubble } from './Bubble'
import styles from './Card.module.css'

export type CardVariant = 'gaze' | 'echo-small' | 'echo-big' | 'thumbnail'

interface CardProps {
  product: Product
  variant: CardVariant
  karaokeWords?: KaraokeWord[]
  style?: CSSProperties
}

const ColorSwatch = ({ color }: { color: string }) => (
  <span
    className={styles.swatch}
    style={{ background: color }}
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

export const Card = ({ product, variant, karaokeWords, style }: CardProps) => (
  <article className={`${styles.card} ${styles[variant]}`} style={style}>
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
          {karaokeWords
            ? <KaraokeText words={karaokeWords} />
            : <p className={styles.description}>{product.description}</p>
          }
          <Bubble />
        </>
      )}
    </div>
  </article>
)
