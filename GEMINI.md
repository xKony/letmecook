# LetMeCook Web - Developer Context

This document provides essential context for AI agents and developers working on the LetMeCook Web project.

## Project Overview

LetMeCook Web is a high-performance, local-first Active Recall study tool built with **Next.js 16** and **React 19**. It allows users to create, manage, and study flashcards using an active recall system with progress tracking.

### Core Architecture

- **Dual-Mode Persistence**:
    - **Guest Mode**: All data is stored in the browser's `LocalStorage` via a custom storage adapter (`src/lib/storage.ts`).
    - **Authenticated Mode**: Data is persisted to a PostgreSQL database (Neon) using **Drizzle ORM**.
- **State Management**: A centralized `AppProvider` (`src/lib/app-context.tsx`) manages authentication status, deck synchronization, and application-wide actions.
- **UI/UX**: Styled with **Tailwind CSS 4** and animated with **Framer Motion**.
- **Active Recall**: Cards progress through levels (e.g., "Nowe", "Opanowane") to optimize learning efficiency.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via @neondatabase/serverless)
- **ORM**: Drizzle ORM
- **Auth**: NextAuth.js (v5 Beta)
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Math Rendering**: KaTeX (for LaTeX support in cards)

## Getting Started

### Prerequisites

- **Node.js**: 18.17+
- **pnpm**: 10.33.0+

### Key Commands

| Command | Purpose |
| :--- | :--- |
| `pnpm dev` | Starts the development server |
| `pnpm build` | Builds the application for production |
| `pnpm start` | Runs the built production server |
| `pnpm lint` | Runs ESLint for code quality checks |
| `pnpm drizzle-kit generate` | Generates SQL migrations (Inferred) |
| `pnpm drizzle-kit push` | Pushes schema changes to the database (Inferred) |

## Development Conventions

### File Structure

- `src/app/`: Next.js pages and server actions.
- `src/components/`: React components.
    - `ui/`: Shared, reusable UI primitives.
- `src/lib/`: Core logic, utilities, types, and constants.
- `src/db/`: Database schema and configuration.
- `src/locales/`: Internationalization JSON files (English and Polish).

### Coding Standards

- **TypeScript**: Use strict typing. Prefer interfaces for object shapes and types for unions.
- **Server Actions**: Use server actions for all database mutations (`src/app/actions/`).
- **Components**: Prefer functional components and hooks. Use `"use client"` directive only where necessary.
- **i18n**: All user-facing text should be internationalized using the `t` function from `useApp()`.
- **Styling**: Use Tailwind utility classes. For complex conditional classes, use the `cn()` utility.

### Data Flow

1.  **Context**: Components interact with the `useApp()` hook to access state and perform actions.
2.  **Actions**: Actions in `app-context.tsx` detect the user's auth state and either call a Server Action (Auth) or the LocalStorage adapter (Guest).
3.  **UI Updates**: Local state is updated immediately for responsiveness (optimistic updates where appropriate).

## Known Limitations / TODOs

- TODO: Implement server-side sync for guest data when they sign up.
- TODO: Add more comprehensive test coverage for active recall logic.
