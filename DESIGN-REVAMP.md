# LetMeCook — Design Audit & Visual Revamp Plan

> Working document. Part 1 = audit of the current UI (what to fix, what to keep).
> Part 2 = brand direction + inspiration from 21st.dev. Part 3 = implementation checklist.

---

## Part 1 — Audit of the current UI

### What's already good (keep)

- Deck cards stagger in on load (`globals.css` `deck-card-animate`, 60ms steps) — correct pattern.
- Entries use `scale(0.95)` + opacity instead of `scale(0)` — natural, not "from nothing".
- Easing choices are mostly right: `cubic-bezier(0.22, 1, 0.36, 1)`, `ease-out` on entries.
- Reveal button already has `active:scale-[0.98]` press feedback.
- Big touch targets on rating buttons (`h-16`) and Reveal (`h-14`).
- Hover-revealed action icons on deck cards (desktop-only via `md:`) — good density control.

### Interaction & motion fixes

| Before | After | Why |
| --- | --- | --- |
| `button.tsx` base: `transition-all`, no press state | `transition-[color,background-color,border-color,box-shadow,transform]` + `active:scale-[0.97]` | Buttons must feel responsive to press; one fix compounds across every button |
| `transition-all` in 15 files (deck-card, flashcard-rating, faq inputs, progress bars…) | Specify exact properties (`transition-colors`, `transition-transform`) | `all` retargets jankily and animates unintended properties mid-interaction |
| Theme toggle: `transition-all duration-300` (`theme-toggle.tsx:36`) | `transition-colors duration-150`; knob `transition-transform duration-200 ease-out` | Toggled often; 300ms feels laggy. Color and transform want different speeds anyway |
| Mobile menu (`dashboard-header.tsx`): pops in with zero animation | `origin-top-right`, enter `scale-95 → scale-100` + fade (~150ms ease-out) | Nothing appears from nothing; small origin-aware scale reads as intentional |
| Rating buttons: `transition-all border-2`, no press state (`flashcard-rating.tsx:66`) | `transition-colors duration-150 active:scale-[0.98]` | Most-pressed buttons in the app |
| Reveal button `hover:scale-[1.02]` ungated | Gate under `@media (hover: hover)` | Touch devices fire hover on tap → stuck scaled state |

### Structural / systemic issues

1. **No `prefers-reduced-motion` anywhere** (zero hits in repo). Add a globals.css media query
   disabling movement keyframes (`deck-slide-in`, fades keep opacity), and wrap the app in
   Framer Motion `<MotionConfig reducedMotion="user">`.
2. **Brand color is undefined.** Primary token is pure neutral (near-black/white), but brand moments
   are hardcoded `blue-600` (Reveal), `blue-400→purple-500` gradients (progress bars), `zinc-*`
   (theme toggle). Light mode looks like a different app than the study screen.
3. **Duplicated progress-bar markup** in `deck-card.tsx:239` and `study-session-progress.tsx`.
   Extract one `<ProgressBar />` so gradient/color lives in exactly one place.
4. **Theme toggle keyboard trap**: `div role="button"` + `tabIndex={0}` but no `onKeyDown` —
   Enter/Space do nothing. Use a real `<button>` or add handlers.
5. **Modals exit instantly.** Enter is animated (`animate-modal-up`) but close is abrupt unmount;
   add ~120ms exit fade minimum.

---

## Part 2 — Brand direction

### Research: what we took from 21st.dev

Browsed the registry (12k+ components; libraries: Aceternity UI, Magic UI, Motion Primitives,
Kokonutd, Origin UI, trophyso…). Relevant finds:

- **Aceternity Card Spotlight** — cursor-following radial gradient that lights up a card on hover.
  Perfect fit for deck cards: makes the dashboard feel alive without moving anything.
- **Deep void + ambient glow orbs + glass surfaces** — the dominant dark-mode language on the
  platform: near-black *tinted* backgrounds, large soft-focus blurred color orbs behind content,
  translucent cards with 1px light borders and inner top highlights. LetMeCook's flashcard already
  has the inner-highlight instinct (`dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]`) — build on it.
- **Kokonutd Apple Activity Ring / Magic UI Animated Circular Progress** — progress as a ring,
  not only a bar. Candidate for the stats modal (later pass, not this one).
- **trophyso Streak/Achievement cards** — gamified stat surfaces; reference for session-complete
  moments (later pass).
- 21st.dev quality bar itself: shadcn-token-driven theming, both themes required, restrained motion.

### The direction: "Midnight Kitchen"

LetMeCook = Gen-Z slang ("let him cook") + a daily-use study tool students open late at night.
Dark-first is correct (already the default). The revamp gives it ONE identity instead of template
grays + random blue/purple moments.

**Palette (4 core values):**

| Token | Value | Role |
| --- | --- | --- |
| `--background` (dark) | `oklch(0.16 0.014 285)` | Deep ink with a violet breath — not pure black |
| `--card` (dark) | `oklch(0.205 0.018 285)` | Glass panel above the void |
| `--primary` → **electric violet** | `oklch(0.55 0.25 286)` (light mode slightly deeper: `oklch(0.51 0.24 286)`) | THE brand hue: Reveal button, primary buttons, focus rings, links, progress |
| Light `--background` | `oklch(0.982 0.005 285)` | Cool paper, same family |

Rationale: violet sits between the old hardcoded `blue-600` and `purple-500`, so it evolves the
existing DNA instead of replacing it — and crucially it does **not** collide with the semantic
level colors (rose / amber / emerald / cyan must stay reserved for card mastery levels).
Neutrals get the same 285-hue tint so every gray quietly belongs to the brand.

Light mode: same hues, lifted — soft paper background, cards go white with tinted borders and
low, colored shadows. No glassmorphism in light mode (contrast first).

**Type:** keep Geist Sans/Mono (daily-use tool; a font swap is risk without payoff). Personality
comes from scale discipline instead: tight tracking on display sizes (`tracking-tight`),
tabular numerals for all stats/counters, muted small-caps-style eyebrows where hierarchy needs help.

**Signature element — spend boldness here:** the **study stage**: the flashcard floats over two
large, slow-drifting, blurred violet/cyan glow orbs ("desk lamp" ambience), while everything around
it stays quiet. Secondary signature: **cursor-spotlight deck cards** on the dashboard (radial
gradient following the pointer, ~350px radius, brand hue at low alpha). Nothing else gets effects.

**Surfaces:** dark cards = translucent `bg-card` + `backdrop-blur` where layered, `border-white/8`,
inner top highlight. Overlays/modals keep heavy blur scrims. Buttons: primary = violet fill with
soft violet glow shadow; ghost stays quiet.

**Motion rules (from Emil audit):** enter ease-out ≤300ms, exits faster than entries, press
feedback everywhere (`active:scale`), stagger 30–80ms, reduced-motion honored globally
(opacity-only fallbacks), hover effects gated behind `(hover: hover)`.

### Anti-goals (what this revamp deliberately does NOT do)

- No font replacement, no illustrated mascots, no confetti.
- No aurora/noise texture spam — glow lives ONLY on the study stage and card spotlights.
- No layout restructuring — visual identity + interaction polish within current IA.
- No new dependencies (framer-motion + tailwind v4 cover everything).

## Part 3 — Implementation checklist

### Workstream A — Foundation (tokens & primitives) — *first, everything depends on it*

- [x] `globals.css`: brand tokens (electric violet primary, tinted neutrals light+dark),
      reduced-motion media query for movement keyframes
- [x] `button.tsx` base: scoped transition properties + `active:scale-[0.97]`
- [x] Replace all `transition-all` with scoped transitions across the repo
- [x] Extract shared `<ProgressBar />` (`deck-card.tsx` + `study-session-progress.tsx`),
      brand-gradient via tokens
- [x] `<MotionConfig reducedMotion="user">` around the client tree

### Workstream B — Chrome & dashboard

- [x] Theme toggle: real `<button>`, keyboard support, faster transitions, token colors
- [x] Mobile menu: origin-aware scale/fade enter animation
- [x] Deck cards: cursor-spotlight hover (brand hue), hover lift, token-based focus rings
- [x] Dialogs/confirmation modal: exit animations (~120ms fade)
- [x] Login page restyled against new tokens

### Workstream C — Study experience

- [x] Study stage ambient glow orbs behind the flashcard (CSS-only, reduced-motion safe)
- [x] Flashcard glass surface: translucency, inner top highlight, refined border
- [x] Reveal button: violet gradient fill + soft glow shadow, press feedback, hover gated
- [x] Rating buttons: scoped transitions + press feedback
- [x] Study header/progress restyled against tokens; stats use tabular numerals
