import styles from './Bubble.module.css'

export const Bubble = () => (
  <div className={styles.bubble}>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="0"  y="6" width="2" height="4" rx="1" fill="currentColor" />
      <rect x="4"  y="3" width="2" height="10" rx="1" fill="currentColor" />
      <rect x="8"  y="1" width="2" height="14" rx="1" fill="currentColor" />
      <rect x="12" y="4" width="2" height="8" rx="1" fill="currentColor" />
    </svg>
    <span>Say 'tell me more'</span>
  </div>
)
