import styles from './SearchBar.module.css'

export type SearchBarState = 'default' | 'listening' | 'entered'

interface SearchBarProps {
  state: SearchBarState
  value: string
  onChange?: (value: string) => void
  onActivate?: () => void
}

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const placeholderMap: Record<SearchBarState, string> = {
  default: 'Say something or type...',
  listening: 'Listening...',
  entered: '',
}

export const SearchBar = ({ state, value, onChange, onActivate }: SearchBarProps) => (
  <div className={`${styles.wrap} ${styles[state]}`}>
    <button className={styles.iconBtn} onClick={onActivate} aria-label="Search">
      <SearchIcon />
    </button>
    <input
      className={styles.input}
      type="text"
      value={value}
      placeholder={placeholderMap[state]}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={state === 'listening'}
    />
  </div>
)
