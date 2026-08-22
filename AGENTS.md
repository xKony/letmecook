<!-- BEGIN:nextjs-agent-rules -->
 
# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.
 
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:pnpm-agent-rules -->

# pnpm: minimumReleaseAge is TEMPORARILY lowered

This repo uses pnpm only (enforced via the `preinstall` script). Package manager settings live in `pnpm-workspace.yaml`.

`minimumReleaseAge: 480` (8h) in `pnpm-workspace.yaml` was set on 2026-08-21 only because Next.js 16.3.2 had been released hours earlier and pnpm's default policy (24h) rejected it.

**TODO for a future agent:** once some time has passed since the last Next.js release (i.e., no dependency you need to install is younger than ~1 day), change `minimumReleaseAge` back to the pnpm default of `1440` (24h) — or remove the line entirely to inherit the default. Do this during a quiet maintenance pass, not mid-feature.

<!-- END:pnpm-agent-rules -->

# LetMeCook Web - Technical Reference

## 1. Project Overview
**LetMeCook Web** is a high-performance Active Recall system built for local-first and cloud-sync learning.
- **Purpose**: Efficient flashcard studying with progress tracking.
- **Repository Type**: Single-package Next.js repository.

## 2. Exact Versions (Source: package.json)
- **Runtime**: Node.js `18.17+` (CI runs on Node 22)
- **Package Manager**: `pnpm@11.22.0`
- **Framework**: Next.js `16.3.2`
- **Library**: React `19.2.8`
- **Language**: TypeScript `5.9.3`

For the full dependency list, see `package.json`. Note: `@types/katex` and `@types/bcryptjs` were removed — katex ≥0.18 and bcryptjs ≥3 ship their own types.

## 3. Project Structure
- `src/app/`: Next.js App Router root.
    - `actions/`: Server actions for database operations.
    - `api/`: Auth route handlers.
    - `admin/`: Admin dashboard (`page.tsx` server shell + `admin-client.tsx`, guarded by `layout.tsx`).
    - `faq/`: Study guide and AI prompt generator.
    - `login/`: Credentials-based login.
    - `settings/`: User settings (`settings-client.tsx` + server shell).
- `src/components/`: Component architecture.
    - `dashboard/`: Deck management UI, including the deck set editor (`deck-set-editor-modal.tsx`, `deck-editor-*-row/panel`).
    - `flashcard/`: Card rendering and editing logic.
    - `study/`: Study session modes and modals.
    - `ui/`: Design system primitives (shadcn-like).
- `src/db/`: Persistence layer.
    - `index.ts`: Database connection initialization.
    - `schema.ts`: Drizzle PostgreSQL schema definitions (flashcards include `sortOrder` for stable ordering).
- `src/hooks/`: Reusable state logic.
- `src/lib/`: Core infrastructure.
    - `app-context.tsx`: Central state engine (AppProvider): auth status, decks, sync.
    - `i18n-context.tsx`: Dedicated i18n context (`I18nProvider`, `useI18n`); translations in `src/locales/`.
    - `auth.ts`: NextAuth.js configuration; `auth-guards.ts`: shared server-side auth guards.
    - `storage.ts`: LocalStorage adapter for Guest mode + import parsing pipeline.
    - `latex.ts` / `latex-render.tsx`: Centralized KaTeX rendering (`containsMath`, `renderLatexContent`, `ensureKatexStyles` loads styles on demand).
    - `deck-editor.ts` / `deck-editor-session-context.tsx`: Bulk deck editing model/state.
    - `deck-export.ts`: JSON export helpers.
    - `flashcard-order.ts`: Stable card ordering (`sortOrder`) utilities.
    - `text-formatting.tsx`: Inline markdown-ish text formatting renderer.
    - `rate-limit.ts`: In-memory rate limiting for server actions; `get-client-ip.ts`: client IP extraction.
    - `validations.ts`: Zod schemas (incl. batch `syncDeckCardsSchema`).

## 4. Architecture and Patterns
- **Rendering Strategy**: Next.js App Router with Server-Side Rendering (SSR) for initial data fetching and Client Components for interactivity.
- **Data Persistence**: 
    - **Guest Mode**: `LocalStorage` via `src/lib/storage.ts`.
    - **Auth Mode**: PostgreSQL via Drizzle ORM.
- **Auth**: NextAuth.js (v5 Beta) with Credentials provider (BCrypt hashing, cost 12).
- **State Management**: React Context API — `AppProvider` for global app state/decks, `I18nProvider` for translations, `DeckEditorSessionProvider` for bulk-edit sessions.
- **Data Fetching**: Server Actions (`src/app/actions/`) for mutations and initial server-side fetching in `src/app/page.tsx`.
- **UI Architecture**: Tailwind CSS 4 utility-first approach with `tw-animate-css`; CSS animations/transitions are preferred for predetermined effects, while framer-motion (wrapped in `MotionConfig` with `reducedMotion="user"`) is used for dynamic/interruptible UI.
- **Import & Parsing Pipeline (`src/lib/storage.ts`)**: Normalizes import data. Tries JSON parsing first, searching case-insensitively for question keys (`question`/`front`/`q`/`text`/`prompt`), answer keys (`answer`/`back`/`a`/`definition`/`response`), and image keys (`image`/`img`), with support for flattening nested deck collections. Falls back to plain-text line-by-line parsing using the pipe (`|`) separator. Imported order is preserved via `sortOrder`.
- **Interactive AI Prompt Generator (`src/app/faq/page.tsx`)**: Dynamic prompt builder supporting real-time parameter injection (subject name, additional instructions/comments, raw questions) in English and Polish to output pre-formatted JSON structures.
- **LaTeX & KaTeX Integration**: Inline (`$...$`) and block (`$$...$$`) math via `src/lib/latex.ts` + `src/lib/latex-render.tsx`; styles injected on demand (`ensureKatexStyles`), not globally imported.

## 5. Available Scripts
- `pnpm dev`: Runs `next dev`
- `pnpm build`: Runs `next build`
- `pnpm start`: Runs `next start`
- `pnpm lint`: Runs `eslint`
- `pnpm drizzle-kit generate`: Generate migrations.
- `pnpm drizzle-kit push`: Sync schema to database.

## 6. Environment Variables
Defined in `.env.local` (referenced in `drizzle.config.ts` and `src/db/index.ts`):
- `DATABASE_URL`: PostgreSQL connection string (Required for Auth Mode).
- `AUTH_SECRET`: NextAuth.js encryption secret (Required for Auth Mode).

## 7. Key Configuration
- **pnpm**: Pinned via `packageManager` in `package.json` (`pnpm@11.22.0`). Dependency overrides, build-script approvals (`allowBuilds`), and the `minimumReleaseAge` supply-chain policy live in `pnpm-workspace.yaml`. pnpm-only is enforced via the `preinstall` script.
- **Tailwind v4**: Configured via `@import "tailwindcss"` in `globals.css` with inline theme extensions.
- **TypeScript**: Strict mode enabled, `paths` alias `@/*` -> `./src/*`.
- **Drizzle**: PostgreSQL dialect with schema located at `src/db/schema.ts`.

## 8. Development Conventions
- **Naming**: 
    - Components: PascalCase (e.g., `FlashcardEditor.tsx`).
    - Actions/Hooks: camelCase (e.g., `card-actions.ts`, `use-study-session.ts`).
- **File Suffixes**: `.tsx` for components, `.ts` for logic/actions.
- **Imports**: Prefer absolute imports using `@/` alias.
- **i18n**: Use the `t` function from `useI18n()` (in `I18nProvider`) for all user-facing text.

## 9. Known Constraints and Gotchas
- **Max Decks**: Default limit is 5 decks per user (configurable in `src/lib/constants.ts` and DB `users` table).
- **Guest Sync**: Guest data does NOT auto-sync to Auth account on login; moving decks between guest and account is manual, via per-deck JSON export and the drop-zone import on the dashboard. There is no whole-account DB migration UI.
- **LocalStorage Debounce**: Guest state saves are debounced by 500ms (`LOCALSTORAGE_SAVE_DEBOUNCE_MS` in `src/lib/constants.ts`) to prevent performance hits during study sessions.
- **CI Builds**: `src/db/index.ts` throws without `DATABASE_URL`; CI sets dummy env vars so `next build` can run.

## 10. Development Rules & Best Practices
- **Public vs. Personal Decks**: Public library decks are strictly separated from personal study decks. Public library decks (created via Admin Dashboard) do not appear in the admin's personal deck list on the dashboard. This prevents accidental deletion of library decks when users/admins clean up their personal dashboard. Deleting a public deck must be performed explicitly from the Admin Dashboard, while deleting a personal deck only deletes that user's private deck copy.
- **Next.js & Vercel Best Practices**: Use Server Actions (`"use server"`) for database writes/mutations. Leverage React `cache()` for server actions that fetch read-only data, and use `revalidatePath` to clear Next.js data caches and trigger UI refreshes on demand.
- **React Best Practices**: Keep client-side state responsive. Use React Context (`AppProvider`) for global application state. Optimize render cycles by utilizing hooks like `useMemo` and `useCallback` where appropriate. Ensure components remain decoupled, clean, and focus on their respective responsibilities.
- **Package Manager**: Always use `pnpm` instead of `npm` for scripts execution (e.g., `pnpm build`, `pnpm dev`, `pnpm lint`, `pnpm typecheck`). `npm install` is blocked by the `preinstall` guard.
- **Next.js Best Practices**: Always review and strictly apply the principles in the `/next-best-practices` skill documentation (including RSC boundaries, async pattern migrations, dynamic functions, data patterns, and optimal image/font loading) whenever writing, reviewing, or modifying Next.js codebase files.
- **Commit frequently**: land every completed, verified unit of work (feature, fix, docs) as its own concise conventional commit; never batch unrelated changes; never leave the tree dirty with mixed concerns.

## Design Reference
- Read `DESIGN-GUIDELINES.md` before any UI work (new components, restyling, color/motion changes).
- Brand tokens live in `src/app/globals.css`; level colors in `src/lib/level-styles.ts` are RESERVED.
- Values marked "proposed" in the guidelines are NOT implemented tokens — don't use them as if they exist.
