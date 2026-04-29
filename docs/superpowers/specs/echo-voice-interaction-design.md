# Echo — Voice Interaction Design

**Date:** 2026-04-28
**Scope:** Voice experience from onboarding through product detail page. Cart awareness included; checkout out of scope.

---

## Approach

Strict state machine + interrupt layer (Approach 3).

The core loop follows a defined state machine. On top of it, a thin interrupt layer handles a small set of power commands at any time — even while Echo is talking. This gives predictability where it matters and responsiveness where it counts.

---

## State Machine

### Core states

```
idle → listening → processing → system-talking → idle
```

| State | Description |
|---|---|
| `idle` | Mic closed. Waveform shows 10 slow-pulsing dots. In Guided mode this state is brief — Echo auto-advances. In Ask mode the system waits here indefinitely. |
| `listening` | Mic open. Waveform shows reactive red bars. Triggered by tap on SearchBar or by Echo finishing a system-talking sequence and opening the mic. |
| `processing` | Mic closed. Echo is interpreting the transcript. Usually imperceptible (<300ms). Prevents double-triggers. |
| `system-talking` | Echo speaks. Waveform shows animated black bars. AudioVisualizer shows karaoke transcript. Active card is highlighted; others dim. |

### Error states

| State | Trigger | Behavior |
|---|---|---|
| `unrecognized` | Transcript didn't match any command | Echo offers a hint, returns to `listening` |
| `timeout` | 5s silence in `listening` | Echo says "Still there?", waits 3s, returns to `idle` |
| `mic-unavailable` | Browser denied mic access | Fallback to type-only interface; voice scripts replaced by visible text |

### Interrupt layer

Active only during `system-talking`. A parallel listener detects power commands. On detection: Echo stops immediately + soft auditory cue, then transitions to `processing`.

| Interrupt command | Action |
|---|---|
| "next" | Skip to next product |
| "stop" / "pause" | Return to `idle` |
| "tell me more" | Expand product detail |
| "add to cart" / "add to bag" | Cart confirmation flow |

---

## Onboarding Flow (`/echo-onboarding`)

Two questions determine the user's layout. Voice-first, tap as fallback.

```
Page load
  → Echo speaks welcome
  → Q1: preference (essentials / full story)
  → Q2: navigation style (guided / ask)
  → Echo confirms
  → Navigate to /echo
```

### Q1 — Content preference

Echo: *"When I describe a product, what do you prefer? Say 'essentials' for just the key details, or 'full story' for the complete picture."*

Tap fallback: pill buttons — "Essentials" · "Full story"

| Recognized input | Maps to |
|---|---|
| "essentials", "just the essentials", "key details" | `essentials` |
| "full story", "everything", "all of it" | `full-story` |

### Q2 — Navigation style

Echo: *"Got it. How do you want to explore? Say 'guide me' and I'll take you through the collection, or say 'I'll ask' to explore at your own pace."*

Tap fallback: pill buttons — "Guide me" · "I'll ask"

| Recognized input | Maps to |
|---|---|
| "guide me", "guided", "take me through" | `guided` |
| "I'll ask", "ask", "on my own" | `ask` |

### Error handling in onboarding

- 1st unrecognized → Echo repeats with shorter hint
- 2nd unrecognized → tap buttons appear prominently + *"Tap your choice if you prefer."*
- Silence timeout → same as 2nd unrecognized

### Layout assignment

```
full-story + guided  →  Layout A (story-first)
full-story + ask     →  Layout C (social-first)
essentials + any     →  Layout B (value-first)
```

---

## Product Browsing Flow (`/echo`)

### Entry (both modes)

Echo: *"Here's the collection. 5 pieces."*

Half-second pause, then first product begins.

### Guided mode — playlist

Echo plays products in sequence like a curated audio tour.

```
→ system-talking: product 1 (layout script)
→ 1.5s pause
→ system-talking: product 2
→ ... continues through all 5
→ "That's the full collection. Say a product name or 'start over' to go again."
→ idle
```

User can interrupt at any point with a power command. After "tell me more" detail is read:

Echo: *"Want to continue the collection?"*
- "Yes" / "continue" → resumes playlist from next product
- "Add to cart" → confirms, then resumes
- No response (5s) → resumes automatically

### Ask mode — on-demand

Echo reads product 1, then opens the mic and waits. No auto-advance.

```
→ system-talking: product 1
→ listening (mic opens)
→ waits for command
```

After each command response, Echo returns to `listening` automatically — the mic stays in a ready rhythm.

### Available commands (Ask mode)

| Command | Action |
|---|---|
| "next" | Move to next product |
| "previous" / "go back" | Move to previous product |
| "tell me more" | Expand active product detail |
| "add to cart" / "add to bag" | Add active product |
| "how much" | Read price only |
| "what colors" | Read available colors |
| "show me [category]" | Filter products, read matches |
| "start over" | Return to product 1 |

---

## Product Detail Expansion

Triggered by "tell me more" — as voice command or interrupt.

```
User says "tell me more"
  → active card moves to center of horizontal carousel, grows to full size (~406×664px)
  → inactive cards shrink (~242×405px), centered vertically
  → Echo reads full detail script
  → Bubble ("Say 'tell me more'") disappears
  → mic opens after Echo finishes
```

### Detail script (all layouts)

> *"{name}. {shortDescription}. {description}. Available in {colors}. ${price}."*

`shortDescription` is a brief product tagline — a new field to be added to the `Product` interface. Values to be sourced from Figma design (node-id=68-51004).

Karaoke effect runs across the full script as Echo speaks.

### After detail is read

| Mode | Echo prompt |
|---|---|
| Guided | *"Want to add it to your bag, or shall I continue?"* |
| Ask | *"Say 'add to bag', 'next', or ask me anything."* |

### Available commands at detail

| Command | Action |
|---|---|
| "add to cart" / "add to bag" | Cart confirmation |
| "next" | Collapse card, move to next product |
| "go back" | Collapse card, return to same product summary |
| "how much" | Read price only |
| "what colors" | Read available colors |
| "start over" | Collapse card, return to product 1 |

### Cart confirmation

Echo: *"Added. The {name} is in your bag."*

Then: next product in Guided, mic opens in Ask.

---

## Feedback Model

### Per-state component behavior

| State | SearchBar | Waveform | AudioVisualizer | Cards |
|---|---|---|---|---|
| `idle` | "Say something or type…" · gray border | 10 dots, slow pulse, gray-400 | hidden | equal opacity |
| `listening` | "Listening…" · black border | reactive red bars | hidden | equal opacity |
| `processing` | query text · black border | slow dots | hidden | equal opacity |
| `system-talking` | query text · black border | animated black bars | visible · karaoke | active: full size + full opacity · inactive: small + dimmed |
| `unrecognized` | "Try 'next' or 'tell me more'" · gray border | slow dots | hidden | equal opacity |
| `timeout` | "Still there?" · gray border | slow dots | hidden | equal opacity |
| `mic-unavailable` | "Type to search" · gray border | hidden | hidden | equal opacity |

### Auditory feedback (non-speech)

| Trigger | Sound |
|---|---|
| Mic opens (`idle → listening`) | soft chime in |
| Interrupt detected | soft click · Echo stops |
| Mic closes (`listening → processing`) | soft chime out |
| Cart add confirmed | soft chime in |

### Karaoke behavior

Triggered by `SpeechSynthesisUtterance.onboundary` → `charIndex` → matching word span.

| Word state | Color | Weight |
|---|---|---|
| Unread | `var(--color-gray-400)` | regular |
| Active | `var(--color-red)` | medium |
| Read | `var(--color-black)` | regular |

Runs in AudioVisualizer and on the expanded echo-big card simultaneously.

---

## Voice Scripts

### Onboarding

| Trigger | Script |
|---|---|
| Page load | *"Welcome to Echo. I'll ask you two quick questions to set up your experience."* |
| Q1 | *"When I describe a product, what do you prefer? Say 'essentials' for just the key details, or 'full story' for the complete picture."* |
| Q1 unrecognized (1st) | *"Say 'essentials' or 'full story'."* |
| Q1 unrecognized (2nd) | *"Tap your choice if you prefer."* |
| Q2 | *"Got it. How do you want to explore? Say 'guide me' and I'll take you through the collection, or say 'I'll ask' to explore at your own pace."* |
| Q2 unrecognized (1st) | *"Say 'guide me' or 'I'll ask'."* |
| Q2 unrecognized (2nd) | *"Tap your choice if you prefer."* |
| Confirmed | *"Perfect. Let's start."* |

### Shopping entry

| Trigger | Script |
|---|---|
| Page load | *"Here's the collection. 5 pieces."* |

### Product scripts (per layout)

| Layout | Script |
|---|---|
| A — full-story + guided | *"{name}. {description}. Ready to hear the price?"* |
| A — after "yes" / "how much" | *"${price}."* |
| B — essentials | *"{name}. ${price}. Available in {colors}. Want to add it or hear more?"* |
| C — full-story + ask | *"{name}. Rated {rating} by {reviews} people. ${price}. Want to hear more?"* |

### Detail expansion

| Trigger | Script |
|---|---|
| Any layout | *"{name}. {shortDescription}. {description}. Available in {colors}. ${price}."* |
| After detail — Guided | *"Want to add it to your bag, or shall I continue?"* |
| After detail — Ask | *"Say 'add to bag', 'next', or ask me anything."* |

### Command responses

| Command | Script |
|---|---|
| "how much" | *"${price}."* |
| "what colors" | *"Available in {colors}."* |
| "add to cart / bag" | *"Added. The {name} is in your bag."* |
| "next" (interrupt) | soft click · moves to next product |
| "stop / pause" | soft click · returns to idle |

### Error & edge cases

| Trigger | Script |
|---|---|
| Unrecognized command | Rotates: *"Try 'next' or 'tell me more'."* / *"Say 'add to bag' or 'how much'."* / *"Try 'start over' or 'what colors'."* |
| Silence timeout (5s) | *"Still there?"* |
| No response after timeout prompt | returns to idle silently |
| End of collection (Guided) | *"That's the full collection. Say a product name or 'start over' to go again."* |
| End of collection (Ask) | *"That's the last piece. Say 'start over' to go again."* |
| Mic unavailable | *"Microphone access is needed for Echo. You can still type to search."* |

---

## Data Model Change

Add `shortDescription: string` to the `Product` interface in `src/data/products.ts`. Values for all 5 products to be sourced from Figma design (node-id=68-51004) during implementation.

---

## Implementation Notes

- Voice input: `webkitSpeechRecognition` (Chrome only, requires HTTPS)
- Voice output: `window.speechSynthesis` + `SpeechSynthesisUtterance` at rate 0.85
- Interrupt layer: second `webkitSpeechRecognition` instance running in parallel during `system-talking`
- Hooks: `useVoiceInput`, `useVoiceOutput`, `useKaraoke`
- All Echo interactive elements: min target size `var(--target-size)` = 72px
- AudioVisualizer captions: `aria-live="polite"`
