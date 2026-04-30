---
name: gsap-animation-quality
description: >
  High-quality GSAP animation principles for React + TypeScript projects.
  Use when writing, reviewing, or refining GSAP animations. Triggers on:
  animation feels choppy, hard ending, stiff, mechanical, abrupt, or when
  asked to make animations smoother, more polished, premium, or cinematic.
---

# GSAP Animation Quality — High-Level Standards

Apply these principles every time you write or review a GSAP animation.
The goal is motion that feels organic, intentional, and invisible — the user
notices the content, not the animation.

---

## Easing — The Most Important Decision

Never use `linear` or `power1` for UI animations. They feel mechanical.

| Context | Easing | Why |
|---|---|---|
| Element entering | `power3.out` / `expo.out` | Fast start, graceful settle |
| Element exiting | `power2.in` | Accelerates away, feels intentional |
| Interactive (hover/press) | `power2.inOut` | Symmetric, smooth both ways |
| Spring-like | `elastic.out(1, 0.5)` | Only for playful, bouncy moments |
| Stagger sequences | `power2.out` | Consistent across siblings |
| Scroll-triggered | `power2.out` | Clean reveal, no overshoot |

### Rules
- Avoid perfectly round durations (`0.3s` → `0.35s`, `0.5s` → `0.55s`). Round numbers feel robotic.
- Exit animations should be ~20% shorter than enter. Exits are secondary.
- Never end a sequence abruptly. The last tween defines the final impression.

---

## The "No Hard Ending" Rule

A hard ending happens when:
- Duration is too short (< 0.25s for visible elements)
- Easing has no deceleration (`linear`, `power1.in`)
- An element snaps to its final value without settling

**Fix pattern:**
```ts
// ❌ Feels mechanical
gsap.to(el, { opacity: 1, y: 0, duration: 0.2, ease: "linear" });

// ✅ Settles naturally
gsap.to(el, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" });
```

For opacity alone, always pair with a subtle `y` or `scale`. Pure opacity fades feel flat.

```ts
// ❌ Flat
gsap.to(el, { opacity: 1, duration: 0.4 });

// ✅ Has presence
gsap.to(el, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" });
// fromTo version:
gsap.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" });
```

---

## `autoAlpha` over `opacity`

Always use `autoAlpha` instead of `opacity` when an element starts hidden.
`autoAlpha` manages both `opacity` and `visibility`, preventing invisible elements
from blocking pointer events.

```ts
// ❌ Element is invisible but still blocks clicks
gsap.set(el, { opacity: 0 });

// ✅ Properly hidden
gsap.set(el, { autoAlpha: 0 });
gsap.to(el, { autoAlpha: 1, duration: 0.55, ease: "power2.out" });
```

---

## Stagger — Hierarchy, Not Randomness

Stagger should reflect visual/reading order. Never stagger randomly.

```ts
// ✅ Correct — reads like the page reads
gsap.from(elements, {
  opacity: 0,
  y: 16,
  duration: 0.55,
  ease: "power2.out",
  stagger: 0.07, // 70ms between siblings
});
```

| Group type | Stagger value |
|---|---|
| Dense UI (nav items, tags) | 40–60ms |
| Standard content blocks | 60–80ms |
| Hero / large elements | 80–120ms |
| Full page sequence | 100–160ms |

### Parallel groups
Group related elements to animate together:

```ts
const tl = gsap.timeline();

// Background elements together
tl.from([bgPattern, bgCircles], { autoAlpha: 0, duration: 0.7, ease: "power2.out" })
// Main image after
  .from(mainImage, { autoAlpha: 0, y: 20, duration: 0.65, ease: "power3.out" }, "-=0.3")
// Logo and text in parallel
  .from([logo, rightText], { autoAlpha: 0, y: 10, duration: 0.5, ease: "power2.out", stagger: 0 }, "-=0.2");
```

---

## Timeline Best Practices

```ts
// ✅ Production-quality timeline pattern
const tl = gsap.timeline({
  defaults: { ease: "power2.out", duration: 0.55 },
  onComplete: () => { /* cleanup or callback */ }
});

// Use relative offsets, never hardcoded absolute times
tl.from(header, { autoAlpha: 0, y: -10 })
  .from(content, { autoAlpha: 0, y: 16 }, "-=0.25")   // overlaps 250ms
  .from(footer, { autoAlpha: 0, y: 8 }, "-=0.2");
```

- Set `defaults` on the timeline to avoid repeating ease/duration
- Use `"-=0.2"` relative offsets — never `"+=0"` unless intentional
- Overlap sequences by 20–30% of duration for natural flow

---

## `overwrite` — Prevent Animation Conflicts

Always set `overwrite: "auto"` on interactive animations (hover, click, scroll).
Without it, multiple tweens on the same element stack and produce jank.

```ts
// Hover enter
gsap.to(card, {
  scale: 1.02,
  duration: 0.4,
  ease: "power2.out",
  overwrite: "auto", // ← kills conflicting tweens
});

// Hover leave
gsap.to(card, {
  scale: 1,
  duration: 0.35,
  ease: "power2.inOut",
  overwrite: "auto",
});
```

---

## ScrollTrigger — Smooth Reveals

```ts
gsap.from(element, {
  opacity: 0,
  y: 50,
  duration: 0.65,
  ease: "power2.out",
  scrollTrigger: {
    trigger: element,
    start: "top 88%",     // enters when 88% down viewport
    end: "top 60%",
    toggleActions: "play none none none", // plays once
    // scrub: false — avoid scrub unless intentionally tied to scroll
  },
});
```

**Rules for ScrollTrigger:**
- `start: "top 85–90%"` — reveal before the user reaches it
- `toggleActions: "play none none none"` — don't reverse on scroll up (feels weird)
- Never use `scrub: true` for content reveals — only for parallax effects
- Register once: `gsap.registerPlugin(ScrollTrigger)` at app root

---

## React / Cleanup Pattern

Every GSAP animation in a `useEffect` must be wrapped in `gsap.context()` and cleaned up.

```ts
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.fromTo(
      containerRef.current,
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }
    );
  }, containerRef);

  return () => ctx.revert(); // ← always
}, []);
```

- Scope animations to a ref with `gsap.context(() => {}, ref)`
- Never animate without cleanup — causes memory leaks and double-animation in React Strict Mode
- Encapsulate reusable animation logic in `src/hooks/useEnterAnimation.ts`

---

## `will-change` — GPU Compositing

Only add `will-change` when you observe first-frame stutter. Do not add it preemptively.

```ts
// ✅ Only for opacity + transform animations on visible elements
gsap.set(el, { willChange: "transform, opacity" });
// After animation completes, remove it
tl.eventCallback("onComplete", () => gsap.set(el, { willChange: "auto" }));
```

Never: `will-change: all`.

---

## `prefers-reduced-motion` — Accessibility

Always respect the user's motion preference:

```ts
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
  // Full animation
  gsap.from(el, { autoAlpha: 0, y: 20, duration: 0.6, ease: "power3.out" });
});

gsap.matchMedia().add("(prefers-reduced-motion: reduce)", () => {
  // Instant show, no motion
  gsap.set(el, { autoAlpha: 1 });
});
```

---

## Common Mistakes → Fixes

| Mistake | Fix |
|---|---|
| `ease: "linear"` on UI elements | Use `power2.out` or `power3.out` |
| Pure `opacity` fade | Add `y: 12 → 0` or `scale: 0.97 → 1` |
| `opacity: 0` on hidden elements | Use `autoAlpha: 0` |
| Animations stacking on hover | Add `overwrite: "auto"` |
| Hard stop at end of tween | Increase duration, use deceleration ease |
| Stagger feels random | Follow visual/reading order, reduce to 60–80ms |
| ScrollTrigger reverses on scroll up | Set `toggleActions: "play none none none"` |
| GSAP in useEffect without cleanup | Wrap in `gsap.context()`, return `ctx.revert()` |
| Scrub on content reveals | Remove scrub — only use for parallax |
| `will-change` added preemptively | Only add when stutter is observed |
| Two tweens on same element conflict | Add `overwrite: "auto"` |

---

## Quick Reference — Easing Cheatsheet

```
Entering content:       power3.out, expo.out
Exiting content:        power2.in, power3.in
Interactive feedback:   power2.inOut
Page transitions:       power2.out (enter), power2.in (exit)
Scroll reveals:         power2.out
Playful / bouncy:       elastic.out(1, 0.5)  ← use sparingly
```

## Quick Reference — Duration Cheatsheet

```
Micro (icon, badge):        0.2–0.3s
Small UI (button, tag):     0.3–0.4s
Standard (card, section):   0.5–0.65s
Hero / full page:           0.65–0.9s
Page transition:            0.4–0.6s
Scroll reveal:              0.65s
```
