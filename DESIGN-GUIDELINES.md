# LetMeCook — Design Guidelines ("Midnight Kitchen")

> Durable brand reference for writing/reviewing UI in this repo.
> Values marked **implemented** are copied verbatim from `src/app/globals.css` / `src/lib/level-styles.ts`.
> Values marked **proposed** are recommendations that are NOT yet tokens — do not treat them as existing.

---

## 1. Brand

LetMeCook is a dark-first active-recall study tool used daily by students, often late at night — hence **"Midnight Kitchen"** (from the slang "let him cook"). The identity is one electric violet (`oklch(… 286)` family) on deep violet-tinted near-black surfaces; every neutral carries the same hue-285 tint so grays quietly belong to the brand. The vibe is a quiet desk lamp over glass panels: restrained chrome, boldness spent only on the study stage and card spotlights.

## 2. Core tokens (implemented — verbatim from `globals.css`)

| Token | Light | ~Hex | Dark | ~Hex |
| --- | --- | --- | --- | --- |
| `--background` | `oklch(0.982 0.005 285)` | `#f9f9fc` | `oklch(0.16 0.014 285)` | `#0d0c13` |
| `--foreground` | `oklch(0.145 0 0)` | `#0a0a0a` | `oklch(0.985 0 0)` | `#fafafa` |
| `--card`, `--popover` | `oklch(0.997 0.002 285)` | `#fefeff` | `oklch(0.205 0.018 285)` | `#16161f` |
| `--primary` | `oklch(0.51 0.24 286)` | `#6538e5` | `oklch(0.62 0.22 286)` | `#8166ff` |
| `--primary-foreground` | `oklch(0.985 0 0)` | `#fafafa` | `oklch(0.985 0 0)` | `#fafafa` |
| `--secondary`, `--muted`, `--accent` | `oklch(0.97 0.006 285)` | `#f4f5f9` | `oklch(0.269 0.014 285)` | `#25252d` |
| `--muted-foreground` | `oklch(0.556 0 0)` | `#737373` | `oklch(0.708 0 0)` | `#a1a1a1` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `#e7000b` | `oklch(0.704 0.191 22.216)` | `#ff6467` |
| `--border`, `--input` | `oklch(0.922 0.008 285)` | `#e4e5ea` | `oklch(1 0.008 285 / 10%)` border · `/ 15%` input | white @10–15% |
| `--ring` | `oklch(0.58 0.16 286)` | `#7567d3` | `oklch(0.68 0.16 286)` | `#9286f5` |
| `--radius` | `0.625rem` (scale `-4px` → `+16px`) | — | same | — |

Neutrals are all hue-285/286 tinted, never pure gray. Dark borders/inputs use alpha white on the tint base.

## 3. Semantic level colors (RESERVED — never reuse decoratively)

From `src/lib/level-styles.ts`. These encode card mastery states only:

| Level | Color | Tailwind classes |
| --- | --- | --- |
| Nowe | Slate (neutral) | `bg-slate-500/20` bg, `bg-slate-400` bar, `text-muted-foreground` text |
| Nie umiem | Rose | `rose-500` (~`#ff2056`) |
| W miarę | Amber | `amber-500` (~`#f6ad00`) |
| Umiem | Emerald | `emerald-500` (~`#00bc7d`) |
| Opanowane 100% | Cyan | `cyan-500` (~`#00b8db`) |

Rules:
- These hues + slate must stay unambiguous signals of mastery level everywhere they appear (badges, bars, rating buttons).
- Violet was chosen as brand precisely because it does not collide with any of them (hue 286 vs ~16/86/162/215).
- Do NOT use rose/amber/emerald/cyan for decoration, marketing moments, gradients, or generic "success/warning/info" chrome outside study semantics without an explicit reason documented in review.
- Rating buttons additionally define hover fills (`RATING_STYLES`: hover:bg-{color} hover:text-white) — keep that pattern if extending.

## 4. Primary shade ladder (hue 286)

Implemented stops are the two `--primary` values plus `--ring`s; everything else is **proposed** (not tokens yet).

| Stop | Value | ~Hex | Status | Use for |
| --- | --- | --- | --- | --- |
| 250 | `oklch(0.93 0.06 286)` | `#e4e3ff` | proposed | subtle tinted backgrounds, selected rows (light mode) |
| 300 | `oklch(0.78 0.14 286)` | `#b0a9ff` | proposed | soft glow shadows, decorative accents (9.2:1 on dark bg — large/decorative only) |
| 400 | `oklch(0.70 0.19 286)` | `#9787ff` | proposed | hover fills on dark primary buttons |
| 500 | `oklch(0.62 0.22 286)` | `#8166ff` | **implemented** = dark `--primary` | brand fill in dark mode, links-as-text on dark (4.5:1 on card) |
| 600 | `oklch(0.55 0.24 286)` | `#6f48f3` | proposed | gradient midpoint between the two implemented stops |
| 700 | `oklch(0.51 0.24 286)` | `#6538e5` | **implemented** = light `--primary` | brand fill in light mode, text-on-light (6.1:1 on bg), focus rings |
| 800 | `oklch(0.44 0.20 286)` | `#5130b8` | proposed | pressed state, borders needing contrast on white |

Rule of thumb from research: keep hue fixed, move lightness/chroma for states — never shift hue for hover/press.

## 5. Companion hues (beyond the semantic set)

| Hue | Value | ~Hex | Status | Usage rule |
| --- | --- | --- | --- | --- |
| Fuchsia/magenta | `oklch(0.667 0.295 322)` (≈ Tailwind fuchsia-500) | `#e12bfb` | de facto implemented inside `ProgressBar` gradient | Only ever paired with violet inside gradients (violet→fuchsia). Never standalone, never semantic. |
| Sky blue (info) | light `oklch(0.55 0.17 255)` / dark-text variant `oklch(0.70 0.14 255)` | `#1570d1` / `#5fa1f3` | **proposed** | Reserved slot for future "info" states. Distinct from reserved cyan (215°) and brand violet (286°). Needs contrast validation per surface before adoption. |

Deliberately excluded: teal/lime/pink/orange — each collides perceptually with a reserved level color. If you need success/warning/error outside study context, prefer reusing the exact reserved Tailwind values so the system stays small, and note it in review.

## 6. Accessibility rules

Minimums (WCAG AA): **4.5:1** normal text, **3:1** large text (≥24px / ≥18.7px bold) and non-text UI (borders, icons, focus indicators). Sources: [W3C Understanding SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum); thresholds are not rounded (4.49 fails).

Measured pairs with current tokens (computed, WCAG math):

| Pair | Ratio | Verdict |
| --- | --- | --- |
| White on light `--primary` (#6538e5) | 6.2 | ✅ body text |
| Light `--primary` as text on light bg | 6.1 | ✅ body-size links/text |
| White on dark `--primary` (#8166ff) | 3.8 | ⚠️ passes large text/UI-boundary only — dark primary buttons carry short, semibold labels; do not put long/small copy on it |
| Dark `--primary` as text on dark card | 4.5 | ✅ borderline pass — prefer ≥600 stop or bolder weight for small text |
| `--muted-foreground` on light bg | 4.49 | ⚠️ at threshold — fine for secondary text, avoid shrinking further |
| `--muted-foreground` on dark bg | 7.5 | ✅ |
| `--ring` vs adjacent background (both modes) | 4.3 / 6.4 | ✅ focus indicator ≥3:1 |

Interaction/motion policy (enforced):
- Hover effects gated behind `(hover: hover)` — e.g. Reveal uses `[@media(hover:hover)]:hover:brightness-110 [@media(hover:hover)]:hover:scale-[1.02]` (`flashcard-rating.tsx:48`); deck-card spotlight requires `hasFinePointer && !prefersReducedMotion` (`deck-card.tsx:48`).
- Reduced motion honored twice: CSS `@media (prefers-reduced-motion: reduce)` blocks zero out animation durations (`globals.css:265`, `globals.css:374`) AND `<MotionConfig reducedMotion="user">` wraps the client tree (`deck-editor-session-context.tsx:103`). New keyframes must be added to the CSS guard lists.
- Focus: `focus-visible:` ring styles (`ring-ring/50`, 3px) come free from `Button`; custom interactive elements need equivalent rings (see deck-card).

## 7. Typography & spacing quick rules

- Fonts: Geist Sans / Geist Mono via `--font-geist-sans` / `--font-mono` (mapped in `globals.css @theme inline`). No font swaps.
- Display headings: `font-bold tracking-tight` (dashboard-header.tsx:46, flashcard.tsx:145, faq/page.tsx:618).
- All counters/stats/timers: `tabular-nums` (study-session.tsx:45, study-session-header.tsx:85, flashcard.tsx:120).
- Radius scale derives from `--radius: 0.625rem`: `sm −4px` · `md −2px` · `lg ±0` · `xl +4px` · `2xl +8px` · `3xl +12px` · `4xl +16px`. Cards use `rounded-xl`/`rounded-3xl`; buttons/pills `rounded-md`/`rounded-full`.
- Spacing rhythm: cards `p-4`→`p-12` responsive padding steps; consistent `gap-2/3` stacks. No arbitrary spacing values unless layout-driven.

## 8. Component recipes (pointers to real source)

| Recipe | Where | Key facts |
| --- | --- | --- |
| Buttons | `src/components/ui/button.tsx` | Base: scoped transition `[color,background-color,border-color,box-shadow,transform]` 150ms ease-out + global `active:scale-[0.97]`; variants default/destructive/outline/secondary/ghost/link. Never add `transition-all`. |
| Glass card surface | `src/components/flashcard.tsx:97` | `bg-card/80 backdrop-blur-xl rounded-3xl border-border dark:border-white/10` + dark inner highlight `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]`. |
| Deck-card cursor spotlight | `src/components/dashboard/deck-card.tsx:42-47,160-166` | Framer `useMotionTemplate` radial-gradient 350px of `color-mix(in oklab, var(--primary) 12%, transparent)`, spring (150/20), opacity fade on group-hover, pointer-events-none, gated by fine-pointer+no-reduced-motion. |
| Study-stage glow orbs | `globals.css:277-352` (`.study-stage`, `.stage-orb-a/b`) | Two blurred (96px) radial orbs behind the card, `var(--primary)` at 4% (light) / 8% (dark), slow drift 22s/26s alternate. Glow lives ONLY here (+ answer pulse). |
| Progress | `src/components/ui/progress-bar.tsx` | Single shared `<ProgressBar />`: `h-1.5 rounded-full bg-muted` track, violet-500→fuchsia-500 indicator, `transition-[width] duration-300 ease-out`, full aria attrs. Never hand-roll progress markup. |
| Answer-reveal pulse | `globals.css:354-372` | One-shot 600ms box-shadow bloom at `primary` 25%. |
| Entry animations | `globals.css:147-247` | `deck-slide-in` stagger 60ms steps (nth-child 1–5), modal `modal-slide-up` scale(0.9)+20px 200ms, fades 150–300ms. All listed in reduced-motion guards. |
| Overlays/modals | `confirmation-modal.tsx`, dialogs | Scrim = `bg-background/80 backdrop-blur-sm`. |

## 9. Do / Don't

1. **Don't** hardcode Tailwind palette colors for brand moments — use `--primary`/token utilities (violet-*/fuchsia-* appear only inside ProgressBar's gradient by design).
2. **Don't** reuse rose/amber/emerald/cyan/slate decoratively — they are RESERVED for mastery levels (§3).
3. Don't animate keyboard-initiated actions; press feedback belongs to pointer interactions, keyboard gets focus-visible rings.
4. Exits faster than entries; entries ≤300ms ease-out; stagger 30–80ms.
5. Scope transitions to named properties — never `transition-all`.
6. Gate hover-only effects behind `(hover: hover)` / fine-pointer checks; don't let touch devices get stuck hover states.
7. New keyframes MUST be registered in both `prefers-reduced-motion` guard blocks in globals.css.
8. Effects (glow, spotlight, blur) live only in their signature homes: stage orbs, answer pulse, deck spotlight. Nothing else glows.
9. Keep neutrals tinted (hue 285) — don't introduce pure gray/black/white hexes.
10. Test both themes separately before shipping a new color pair; dark mode is not an inversion.

## 10. File map

| What | Where |
| --- | --- |
| Tokens, keyframes, orbs, reduced-motion guards | `src/app/globals.css` |
| Level/reserved colors | `src/lib/level-styles.ts` |
| Shared primitives | `src/components/ui/` (`button.tsx`, `progress-bar.tsx`, `dialog.tsx`, `confirmation-modal.tsx`, `theme-toggle.tsx`) |
| Signature components | `src/components/dashboard/deck-card.tsx` (spotlight), `src/components/flashcard.tsx` (glass surface) |
| MotionConfig provider | `src/lib/deck-editor-session-context.tsx` |
| Revamp history | git commit `8b24ce0` ("feat(design): Midnight Kitchen visual revamp"); superseded planning doc: DESIGN-REVAMP.md (deleted) |
