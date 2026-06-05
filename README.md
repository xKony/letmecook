# LetMeCook Web 🍳

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](https://github.com/xkony/letmecook)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.17-brightgreen.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.5-blue.svg)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.2.1-38B2AC.svg)](https://tailwindcss.com/)

> **LetMeCook Web** is a high-performance, local-first Active Recall study tool built with **Next.js 16** and **React 19**. It empowers students to master any subject through an efficient flashcard system featuring dual-mode persistence, an interactive AI prompt builder, advanced LaTeX rendering, and a sleek, animated user interface.

---

## 🚀 Key Features

* **🧠 Active Recall Mastery**: Grade card recall difficulty (New, Don't know, Somewhat, I know, Mastered) to track your progress and focus study sessions on weaker areas.
* **🔒 Dual-Mode Persistence**:
  * **Guest Mode**: Privacy-focused, local-first storage using the browser's `LocalStorage`.
  * **Authenticated Mode**: Secured PostgreSQL database storage (via Neon) that syncs progress across devices.
* **🤖 Interactive AI Prompt Generator**: A stateful, real-time prompt builder on the FAQ page. Customize the subject name, specific instructions, and list of questions to generate a tailored prompt for ChatGPT, Claude, or other LLMs to instantly output clean, importable flashcard decks.
* **📁 Smart JSON & Plain-Text Importing**:
  * **JSON Array**: Directly import cards, nested decks, or complete backups.
  * **Flexible Case-Insensitive Mapping**: Resolves front keys (`question`, `front`, `q`, `text`), back keys (`answer`, `back`, `a`, `definition`), and image keys (`image`, `img`) dynamically.
  * **Fallback**: Supports legacy pipe-separated (`Question | Answer`) text files.
* **🧬 LaTeX & Image Integration**: Supports inline (`$...$`) and block (`$$...$$`) mathematical equations rendered via **KaTeX**, along with raw image URL resolution.
* **🌗 Modern UI/UX**: Designed with curated dark/light color palettes, smooth animations powered by **Framer Motion**, and a responsive layout built on **Tailwind CSS 4**.
* **🌍 Internationalization**: Seamless translation toggles between **English** and **Polski**.

---

## 🛠 Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 16.2.3](https://nextjs.org/) | React Framework with App Router & Server Actions |
| | [React 19.2.5](https://react.dev/) | Core UI rendering library |
| | [Tailwind CSS 4.2.1](https://tailwindcss.com/) | Modern utility-first CSS |
| | [Framer Motion 12.36.0](https://framer.com/) | Smooth animations & transitions |
| | [KaTeX 0.16.38](https://katex.org/) | Ultra-fast LaTeX formula rendering |
| **Backend & ORM** | [PostgreSQL (Neon)](https://neon.tech/) | Serverless database engine |
| | [Drizzle ORM 0.45.2](https://orm.drizzle.team/) | Type-safe SQL database queries |
| | [NextAuth.js 5.0.0-beta.30](https://authjs.dev/) | Seamless credentials and provider authentication |
| **Tooling** | [TypeScript 5.9.3](https://www.typescriptlang.org/) | Strict static typing |
| | [pnpm 10.33.0](https://pnpm.io/) | Fast, disk space-efficient package manager |
| | [drizzle-kit](https://orm.drizzle.team/kit-docs/overview) | Database migration generator and explorer |

---

## 📁 Repository Structure

```text
├── src/
│   ├── app/                # Next.js App Router (pages & Server Actions)
│   │   ├── actions/        # Server Actions (DB mutations: auth, decks, cards)
│   │   ├── api/            # API Route handlers (Auth handlers)
│   │   ├── admin/          # Admin Dashboard (public deck management)
│   │   └── faq/            # FAQ page and Interactive AI Prompt Generator
│   ├── components/         # React Components
│   │   ├── dashboard/      # Decks panel and drag-and-drop file inputs
│   │   ├── flashcard/      # Flashcard editing & rendering (KaTeX + images)
│   │   ├── study/          # Active recall study sessions
│   │   └── ui/             # Reusable UI primitives (buttons, dialogs, etc.)
│   ├── db/                 # Drizzle schemas, index, and migrations
│   ├── hooks/              # Custom hooks for study state
│   ├── lib/                # Core logic, context engines, storage utilities
│   │   ├── app-context.tsx # Global state engine (AppProvider)
│   │   └── storage.ts      # LocalStorage adapters & JSON parser logic
│   └── locales/            # Translation keys (en.json, pl.json)
├── drizzle.config.ts       # Drizzle CLI & connection settings
└── tsconfig.json           # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `18.17.x` or higher
* **pnpm**: `10.33.0` or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/xkony/letmecook.git
   cd letmecook
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up Environment Variables**:
   Create a `.env.local` file in the project root:
   ```env
   DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
   AUTH_SECRET="your_nextauth_secret_key"
   ```

4. **Sync the Database Schema**:
   Push the Drizzle schemas directly to your Neon PostgreSQL instance:
   ```bash
   pnpm drizzle-kit push
   ```

5. **Start Development Server**:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📖 Decks Import Formats

### 1. JSON Format (Recommended)
JSON format allows importing cards with text, answers, and optional images. The parser supports multiple case-insensitive key mappings:

```json
[
  {
    "question": "What is the formula for Einstein's mass-energy equivalence?",
    "answer": "The formula is $E=mc^2$."
  },
  {
    "front": "What is the capital of Poland?",
    "back": "Warsaw",
    "img": "https://example.com/poland-flag.png"
  }
]
```

> [!IMPORTANT]
> Because backslashes (`\`) serve as string escapes in JSON, you **must** double-escape backslashes in LaTeX formulas (e.g., use `\\pi` instead of `\pi` and `\\frac` instead of `\frac`).

### 2. Plain-Text (Fallback)
You can also upload simple `.txt` files containing one card per line using the pipe (`|`) separator:

```text
How does photosynthesis work? | It converts carbon dioxide and water into oxygen and glucose.
Wzór na pole koła? | Pole koła to $P = \pi r^2$. [img: https://example.com/circle.png]
```

---

## 🛠 Available Scripts

* `pnpm dev` – Starts the Next.js development server in Turbopack mode.
* `pnpm build` – Builds the application for production deployment.
* `pnpm start` – Runs the built production bundle locally.
* `pnpm lint` – Checks the codebase for ESLint and styling errors.

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
