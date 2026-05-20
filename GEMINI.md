@AGENTS.md

# LetMeCook Web - Technical Reference (GEMINI.md)

## 1. Project Overview
**LetMeCook Web** is a high-performance Active Recall system built for local-first and cloud-sync learning.
- **Purpose**: Efficient flashcard studying with progress tracking.
- **Repository Type**: Single-package Next.js repository.

## 2. Exact Versions (Source: package.json)
- **Runtime**: Node.js `18.17+`
- **Package Manager**: `pnpm@10.33.0`
- **Framework**: Next.js `16.2.3`
- **Library**: React `19.2.5`
- **Language**: TypeScript `5.9.3`

### Production Dependencies
- `@auth/drizzle-adapter`: `^1.11.1`
- `@neondatabase/serverless`: `^1.0.2`
- `@radix-ui/react-dialog`: `^1.1.15`
- `@radix-ui/react-slot`: `^1.2.4`
- `@types/katex`: `^0.16.8`
- `bcryptjs`: `^3.0.3`
- `class-variance-authority`: `^0.7.1`
- `clsx`: `^2.1.1`
- `drizzle-orm`: `^0.45.1` (resolved: `0.45.2`)
- `framer-motion`: `^12.36.0`
- `katex`: `^0.16.38`
- `lucide-react`: `^0.563.0`
- `next`: `16.2.3`
- `next-auth`: `5.0.0-beta.30`
- `next-themes`: `^0.4.6`
- `react`: `19.2.5`
- `react-dom`: `19.2.5`
- `tailwind-merge`: `^3.5.0`
- `zod`: `^4.3.6`

### Dev Dependencies
- `@tailwindcss/postcss`: `^4.2.1`
- `@types/bcryptjs`: `^2.4.6`
- `@types/node`: `^20.19.37`
- `@types/react`: `19.2.14`
- `@types/react-dom`: `19.2.3`
- `dotenv`: `^17.3.1`
- `drizzle-kit`: `^0.31.9`
- `eslint`: `^9.39.4`
- `eslint-config-next`: `16.2.3`
- `tailwindcss`: `^4.2.1`
- `tw-animate-css`: `^1.4.0`
- `typescript`: `^5.9.3`

## 3. Project Structure
- `src/app/`: Next.js App Router root.
    - `actions/`: Server actions for database operations.
    - `api/`: Auth route handlers.
    - `admin/`: Admin dashboard.
    - `faq/`: Study guide and FAQ.
    - `login/`: Credentials-based login.
    - `settings/`: User settings.
- `src/components/`: Component architecture.
    - `dashboard/`: Deck management UI.
    - `flashcard/`: Card rendering and editing logic.
    - `study/`: Study session modes and modals.
    - `ui/`: Design system primitives (shadcn-like).
- `src/db/`: Persistence layer.
    - `index.ts`: Database connection initialization.
    - `schema.ts`: Drizzle PostgreSQL schema definitions.
- `src/hooks/`: Reusable state logic.
- `src/lib/`: Core infrastructure.
    - `app-context.tsx`: Central state engine (AppProvider).
    - `storage.ts`: LocalStorage adapter for Guest mode.
    - `auth.ts`: NextAuth.js configuration.
    - `i18n.ts`: Internationalization logic.
- `src/locales/`: Localization resources (en.json, pl.json).

## 4. Architecture and Patterns
- **Rendering Strategy**: Next.js App Router with Server-Side Rendering (SSR) for initial data fetching and Client Components for interactivity.
- **Data Persistence**: 
    - **Guest Mode**: `LocalStorage` via `src/lib/storage.ts`.
    - **Auth Mode**: PostgreSQL via Drizzle ORM.
- **Auth**: NextAuth.js (v5 Beta) with Credentials provider (BCrypt hashing).
- **State Management**: React Context API (`AppProvider`) for global app state, auth status, and deck synchronization.
- **Data Fetching**: Server Actions (`src/app/actions/`) for mutations and initial server-side fetching in `src/app/page.tsx`.
- **UI Architecture**: Tailwind CSS 4 utility-first approach with `tw-animate-css` and `framer-motion`.

## 5. Available Scripts
- `npm run dev`: Runs `next dev`
- `npm run build`: Runs `next build`
- `npm run start`: Runs `next start`
- `npm run lint`: Runs `eslint`
- `pnpm drizzle-kit generate`: Generate migrations.
- `pnpm drizzle-kit push`: Sync schema to database.

## 6. Environment Variables
Defined in `.env.local` (referenced in `drizzle.config.ts` and `src/db/index.ts`):
- `DATABASE_URL`: PostgreSQL connection string (Required for Auth Mode).
- `AUTH_SECRET`: NextAuth.js encryption secret (Required for Auth Mode).

## 7. Key Configuration
- **Tailwind v4**: Configured via `@import "tailwindcss"` in `globals.css` with inline theme extensions.
- **TypeScript**: Strict mode enabled, `paths` alias `@/*` -> `./src/*`.
- **Drizzle**: PostgreSQL dialect with schema located at `src/db/schema.ts`.

## 8. Development Conventions
- **Naming**: 
    - Components: PascalCase (e.g., `FlashcardEditor.tsx`).
    - Actions/Hooks: camelCase (e.g., `card-actions.ts`, `use-study-session.ts`).
- **File Suffixes**: `.tsx` for components, `.ts` for logic/actions.
- **Imports**: Prefer absolute imports using `@/` alias.
- **i18n**: Use `t` function from `useApp()` context for all user-facing text.

## 9. Known Constraints and Gotchas
- **Max Decks**: Default limit is 5 decks per user (configurable in `src/lib/constants.ts` and DB `users` table).
- **Guest Sync**: Guest data does NOT auto-sync to Auth account on login; users must manually export/import via `src/app/actions/migration-actions.ts`.
- **LocalStorage Debounce**: Guest state saves are debounced by 1000ms to prevent performance hits during study sessions.

## 10. Development Rules & Best Practices
- **Public vs. Personal Decks**: Public library decks are strictly separated from personal study decks. Public library decks (created via Admin Dashboard) do not appear in the admin's personal deck list on the dashboard. This prevents accidental deletion of library decks when users/admins clean up their personal dashboard. Deleting a public deck must be performed explicitly from the Admin Dashboard, while deleting a personal deck only deletes that user's private deck copy.
- **Next.js & Vercel Best Practices**: Use Server Actions (`"use server"`) for database writes/mutations. Leverage React `cache()` for server actions that fetch read-only data, and use `revalidatePath` to clear Next.js data caches and trigger UI refreshes on demand.
- **React Best Practices**: Keep client-side state responsive. Use React Context (`AppProvider`) for global application state. Optimize render cycles by utilizing hooks like `useMemo` and `useCallback` where appropriate. Ensure components remain decoupled, clean, and focus on their respective responsibilities.

