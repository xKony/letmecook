# LetMeCook Web 🍳

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/yourusername/letmecook-web)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.17-brightgreen.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.5-blue.svg)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.2.1-38B2AC.svg)](https://tailwindcss.com/)

**LetMeCook Web** is a high-performance, local-first Active Recall study tool built with **Next.js 16** and **React 19**. It empowers users to master any subject through an efficient flashcard system featuring dual-mode persistence, LaTeX support, and a sleek, animated interface.

---

## ✨ Features

- **🧠 Active Recall System**: Five-level mastery tracking (New, Don't know, Somewhat, I know, Mastered) to optimize memory retention.
- **🔒 Dual-Mode Persistence**:
  - **Guest Mode**: Privacy-focused storage in the browser's `LocalStorage`.
  - **Authenticated Mode**: Persistent synchronization with a PostgreSQL (Neon) database.
- **📁 Smart Importing**: Seamlessly import flashcards from `.txt` files (Format: `Question | Answer`).
- **🧬 LaTeX Support**: Full support for mathematical and technical formulas rendered via **KaTeX**.
- **🎨 Modern UI/UX**: Styled with **Tailwind CSS 4** and fluidly animated with **Framer Motion**.
- **🌍 Internationalization**: Native support for **English** and **Polski** locales.
- **🌗 Theme Support**: Full support for Light and Dark modes via `next-themes`.
- **🛠 Admin Dashboard**: Centralized management for public decks and user permissions.
- **🚀 Data Migration**: Built-in functionality to migrate Guest data to an Authenticated account.

[↑ Back to top](#letmecook-web-)

---

## 🛠 Tech Stack

### Framework & UI

- **Framework**: [Next.js 16.2.3](https://nextjs.org/) (App Router)
- **Library**: [React 19.2.5](https://react.dev/)
- **Styling**: [Tailwind CSS 4.2.1](https://tailwindcss.com/)
- **Animations**: [Framer Motion 12.36.0](https://www.framer.com/motion/)
- **Icons**: [Lucide React 0.563.0](https://lucide.dev/)
- **Components**: [Radix UI](https://www.radix-ui.com/)

### Backend & Auth

- **Database**: [PostgreSQL (Neon)](https://neon.tech/)
- **ORM**: [Drizzle ORM 0.45.1](https://orm.drizzle.team/)
- **Authentication**: [NextAuth.js 5.0.0-beta.30](https://authjs.dev/)
- **Security**: `bcryptjs` for password hashing

### Tooling

- **Language**: [TypeScript 5.9.3](https://www.typescriptlang.org/)
- **Package Manager**: [pnpm 10.33.0](https://pnpm.io/)
- **Math Rendering**: [KaTeX 0.16.38](https://katex.org/)
- **Schema Management**: `drizzle-kit`

[↑ Back to top](#letmecook-web-)

---

## 📁 Project Structure

```text
├── src/
│   ├── app/                # Next.js App Router: Routes and Server Actions
│   │   ├── actions/        # Server Actions for DB mutations (Auth, Decks, Cards)
│   │   ├── api/            # API Route handlers (Auth, NextAuth)
│   │   └── (routes)        # Pages (Dashboard, Settings, Admin, FAQ)
│   ├── components/         # React Components
│   │   ├── dashboard/      # Dashboard-specific views
│   │   ├── flashcard/      # Flashcard rendering and editing
│   │   ├── study/          # Study session interface
│   │   └── ui/             # Reusable Shadcn/Radix UI primitives
│   ├── db/                 # Database schema (Drizzle) and migrations
│   ├── hooks/              # Custom React hooks (Study session, Export, Import)
│   ├── lib/                # Core logic, types, storage adapters, and utilities
│   │   ├── app-context.tsx # Global State Management (AppProvider)
│   │   └── storage.ts      # LocalStorage persistence logic for Guest Mode
│   └── locales/            # i18n JSON files (en, pl)
├── public/                 # Static assets and preview images
├── drizzle.config.ts       # Drizzle ORM configuration
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS v4 configuration (CSS-in-JS style)
└── tsconfig.json           # TypeScript configuration
```

[↑ Back to top](#letmecook-web-)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `18.17.x` or higher
- **pnpm**: `10.33.0` or higher

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/letmecook-web.git
   cd letmecook-web
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:

   ```env
   DATABASE_URL=your_postgresql_url
   AUTH_SECRET=your_nextauth_secret
   ```

4. **Database Migration**

   ```bash
   pnpm drizzle-kit push
   ```

5. **Run Development Server**
   ```bash
   pnpm dev
   ```

[↑ Back to top](#letmecook-web-)

---

## 📖 Usage

### Key Commands

- `pnpm dev`: Start development server on `localhost:3000`.
- `pnpm build`: Create an optimized production build.
- `pnpm start`: Start the production server.
- `pnpm lint`: Run ESLint to check for code quality issues.

### Import Format

To import flashcards, use a `.txt` file with the following format (one card per line):

```text
Question here | Answer here
```

LaTeX formulas are supported using `$` delimiters, e.g., `$E = mc^2$`.

Images are supported using `[img:RAW_URL]`, e.g., `[img:https://example.com/image.png]`

[↑ Back to top](#letmecook-web-)

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

[↑ Back to top](#letmecook-web-)
