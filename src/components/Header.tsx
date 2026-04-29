import { Link } from 'react-router-dom'
import wideLogoUrl from '../assets/images/00-logo-widesvg.svg'
import avatarUrl from '../assets/images/02-avatar.png'
import styles from './Header.module.css'

export const Header = () => (
  <header className={styles.header}>
    <nav className={styles.nav}>
      <a className={styles.link} href="#">Shop</a>
      <a className={styles.link} href="#">World</a>
      <a className={styles.link} href="#">Info</a>
    </nav>
    <Link to="/" className={styles.logo}>
      <img src={wideLogoUrl} alt="AI CRVN" width="124" height="24" />
    </Link>
    <div className={styles.actions}>
      <span className={styles.cart}>Cart [0]</span>
      <div className={styles.avatar}>
          <img src={avatarUrl} alt="" className={styles.avatarImg} />
        </div>
    </div>
  </header>
)
