# AI CRVN — Project Context

## What this is
A fashion ecommerce website with two experiences:
- **Gaze** — visual experience, standard product browsing
- **Echo** — voice-first experience designed for visually impaired users

The core concept: same product, same design system, different experience model.
Gaze communicates visually. Echo communicates through voice — the system guides the user,
it doesn't wait to be navigated.

## Figma file
https://www.figma.com/design/Ej2N6f7biW76Tktc98ON2P/AI-Caravan-VZ-2
- Components: node-id=71-54506
- Designs section: node-id=58-33664
- Wireframes section: node-id=58-44919

---

## Stack
- React 18 + TypeScript
- Vite
- Tailwind CSS v4
- Framer Motion (page transitions, component enter/exit)
- GSAP (scroll animations, waveform)
- React Router DOM

## Project structure
```
src/
  components/       # Reusable UI components (one file per component)
  pages/            # EntryPoint, GazeShop, EchoOnboarding, EchoShop
  hooks/            # useVoiceInput, useVoiceOutput, useKaraoke, useAudioVisualizer
  data/             # products.ts
  styles/           # tokens.css
  utils/            # layoutEngine.ts
```

## Naming conventions
- Components: PascalCase — `ProductCard.tsx`, `SearchBar.tsx`
- Pages: PascalCase — `GazeShop.tsx`, `EchoShop.tsx`
- Hooks: camelCase with `use` prefix — `useVoiceInput.ts`
- Utils: camelCase — `layoutEngine.ts`
- CSS: kebab-case — `tokens.css`
- Constants: UPPER_SNAKE_CASE

---

## Design tokens (src/styles/tokens.css)

```css
:root {
  /* Primitives */
  --color-black: #000000;
  --color-white: #FFFFFF;
  --color-gray-700: #4B4B4B;
  --color-gray-600: #595959;
  --color-gray-500: #716F6F;
  --color-gray-400: #939393;
  --color-gray-200: #BDBDBD;
  --color-red: #9E0003;

  /* Semantic */
  --color-bg-base: var(--color-gray-200);
  --color-bg-surface: var(--color-white);
  --color-bg-elevated: var(--color-gray-600);
  --color-text-primary: var(--color-black);
  --color-text-secondary: var(--color-gray-500);
  --color-text-on-dark: var(--color-white);
  --color-border-default: var(--color-gray-500);
  --color-border-subtle: var(--color-gray-400);

  /* Experience defaults (Gaze) */
  --waveform-color: var(--color-black);
  --target-size: 48px;
}

[data-experience="echo"] {
  --waveform-color: var(--color-red);
  --target-size: 72px;
}
```

Never use hardcoded hex values in components. Always use CSS custom properties.

---

## Animation rules
- **Framer Motion** → page transitions, component enter/exit, card state changes
- **GSAP** → waveform animation, scroll-triggered effects
- **CSS** → simple hover states, micro-transitions
- Always clean up GSAP with `return () => ctx.revert()` inside useEffect
- Use `gsap.context()` for proper React scoping
- Never mix GSAP and Framer Motion on the same element

---

## Routing
```
/                   → EntryPoint
/gaze               → GazeShop
/echo-onboarding    → EchoOnboarding
/echo               → EchoShop
```

---

## Components

### Toggle
Pill 112×64px with two 48px circular buttons.
- Left: mouse/pointer icon → Gaze
- Right: ear icon → Echo
- Active button: black circle bg
- Used in bottom-right corner of Echo pages

### SearchBar
Pill-shaped, 545×72px, border-radius 999px.
States:
| State | Content | Border |
|---|---|---|
| `default` | "Say something or type..." | gray |
| `listening` | "Listening..." | black |
| `entered` | query text e.g. "Dresses" | black |

### Card
Three variants:
- `gaze` — image + name + price + color swatches. No description.
- `echo-small` — image + name + price. Dimmed when not active.
- `echo-big` — image + name + price + description + Bubble. Active state.

Active card in Echo: highlighted border, full opacity.
Inactive cards in Echo: 40% opacity.

### Bubble
Dark pill (bg: `--color-bg-elevated`).
Content: waveform icon + `Say "tell me more"`.
Lives at bottom of echo-big card.

### Waveform
Animated bars component. States:
| State | Visual | Color |
|---|---|---|
| `idle` | 10 dots, slow pulse | gray-400 |
| `system-talking` | animated bars | black |
| `user-talking` | animated bars, reactive | red (#9E0003) |
| `listening` | slower pulsing dots | gray-500 |

### Header
Full-width nav: Shop / World / Info left · AI CRVN. center · Cart [0] + avatar right.

### AudioVisualizer
Fixed bar at bottom of screen, Echo only.
Contains: Waveform component + transcript text.
Transcript: max-width 640px, centered, shows current phrase being spoken.

---

## Data (src/data/products.ts)

```typescript
export interface Product {
  id: string
  name: string
  price: number
  description: string
  sizes: string[]
  rating: number
  reviews: number
  colors: string[]
  image: string
  isNew?: boolean
}
```

Products:
1. Balloon Wrinkle Dress — $140
2. Oversized Pleated Sleeve Dress — $400
3. Superlight Dress winkle tricoline — $320 (isNew)
4. Vestido smoking nadador lastex plisse — $80
5. Pleated Collar Dress — $340

---

## Echo — Voice experience

### State machine
```
idle → listening → processing → system-talking → idle
```

What each state affects:
- **SearchBar**: "Say something or type..." | "Listening..." | query text
- **Waveform**: dots | red bars (user) | black bars (system) + transcript
- **Cards**: all equal opacity (idle) | active highlighted + others dimmed (system-talking)

### Onboarding → Layout assignment
Two questions asked one at a time during EchoOnboarding:

Q1: "When I describe a product, what do you prefer?"
- Just the essentials → `essentials`
- Tell me the full story → `full-story`

Q2: "How do you want to explore?"
- Guide me → `guided`
- I'll ask → `ask`

Layout assignment:
```typescript
full-story + guided  →  Layout A (story-first)
full-story + ask     →  Layout C (social-first)
essentials + any     →  Layout B (value-first)
```

### Voice scripts per layout
```
Layout A: "{name}. {description}. Ready to hear the price?"
Layout B: "{name}. ${price}. Available in {sizes}. Want to add it or hear more?"
Layout C: "{name}. Rated {rating} by {reviews} people. ${price}. Want to hear more?"
```

### Key voice commands
| User says | Action |
|---|---|
| "show me [category]" | filter products |
| "tell me more" | expand active card, read description |
| "next" | move to next product |
| "add to cart" / "add to bag" | add active product |
| "how much" | read price |
| "what sizes" | read available sizes |

### Karaoke text effect
Active card in `system-talking` state shows highlighted text:
- **unread** words: `color: var(--color-gray-400)` regular weight
- **active** word: `color: var(--color-red)` medium weight
- **read** words: `color: var(--color-black)` regular weight

Triggered by: `SpeechSynthesisUtterance.onboundary` → `charIndex` → find matching word span → update state.

### Voice implementation
```
Input:  webkitSpeechRecognition (Chrome only, requires HTTPS)
Output: window.speechSynthesis + SpeechSynthesisUtterance
Rate:   0.85
```

Hooks:
- `useVoiceInput` — captures speech → transcript string
- `useVoiceOutput` — speaks text, fires onboundary for karaoke
- `useKaraoke` — manages word state array (unread/active/read)

---

## Accessibility notes
- Echo is the accessible experience — don't add screen reader workarounds to Gaze
- All Echo interactive elements: min target size `var(--target-size)` = 72px
- DOM order in Echo: title → price → CTA → narrative → details
  (even if visual order differs — screen reader follows DOM)
- All interactive elements need descriptive aria-labels in Echo
- AudioVisualizer captions are live regions: `aria-live="polite"`

---

## Current status
- [ ] Project scaffolded
- [ ] Design tokens in place
- [ ] Routing set up
- [ ] GazeShop layout complete
- [ ] EchoShop layout structure done
- [ ] Echo voice state machine — IN PROGRESS
- [ ] Waveform component with animated states
- [ ] SearchBar reactive states
- [ ] Card active/dimmed states
- [ ] Karaoke text effect
- [ ] EchoOnboarding flow
- [ ] EntryPoint with experience selection
- [ ] Deploy to Vercel

## Deploy
```bash
# vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}

npx vercel --prod
```
