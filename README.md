# LetMeCook

Local-first active recall flashcards. Study as a guest in the browser, or sync decks to Postgres when you sign in.

**[Live demo](https://letmecook-eight.vercel.app)** · **[MIT License](LICENSE)** · **[FAQ / study guide](https://letmecook-eight.vercel.app/faq)**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.6-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.33-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

---

## Features

- **Active recall** — rate each card after you reveal the answer; progress drives what you review next
- **Guest or account** — LocalStorage by default; Neon/Postgres when authenticated
- **Guest → account migration** — import local decks into a signed-in profile
- **Import / export** — pipe-separated `.txt` or flexible JSON decks
- **LaTeX** — KaTeX inline (`$...$`) and display (`$$...$$`) math
- **Images** — embed with `[img:https://...]` (HTTPS only; localhost HTTP allowed in dev)
- **Public library** — browse and copy admin-published decks
- **i18n** — English and Polish
- **Themes** — light / dark / system
- **Admin tools** — publish public decks and raise per-user deck limits

---

## How it works

| Mode | Storage | Notes |
| --- | --- | --- |
| **Guest** | Browser `localStorage` | No account. Data stays on that device/browser. |
| **Authenticated** | Neon Postgres via server actions | Decks sync across sessions. Default cap: **5 decks** (admins can raise this). |

Study flow: open a deck → flip cards → rate with keyboard shortcuts `1`–`4` (or on-screen buttons) → levels update immediately (optimistic UI; authenticated mode also writes to the DB).

### Mastery levels

Levels are stored with Polish labels (UI strings are localized):

| Level | Meaning | Shortcut |
| --- | --- | --- |
| `Nowe` | New / unseen | — |
| `Nie umiem` | Don't know | `1` |
| `W miarę` | Somewhat | `2` |
| `Umiem` | I know | `3` |
| `Opanowane 100%` | Mastered | `4` |

---

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, Radix, Framer Motion, Lucide |
| Data | Drizzle ORM + Neon Postgres (HTTP driver) |
| Auth | Auth.js / NextAuth v5 — credentials provider, JWT sessions |
| Validation | Zod (auth, decks, cards, imports) |
| Math | KaTeX |

Mutations for signed-in users live in `src/app/actions/` (auth, decks, cards, admin, migration). Guest writes go through `src/lib/storage.ts` and `AppProvider`.

---

## Routes

| Path | Description |
| --- | --- |
| `/` | Dashboard and in-page study session |
| `/login` | Sign in / register |
| `/settings` | Display name, password, sign out |
| `/admin` | Public decks + user deck limits (admins only) |
| `/faq` | Study guide and LLM flashcard prompt |
| `/api/auth/*` | Auth.js handlers |

---

## Quick start

**Requirements:** Node.js 18.17+, pnpm 10.33+

```bash
git clone https://github.com/xKony/letmecook.git
cd letmecook
pnpm install
cp .env.example .env.local
```

### Environment

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon / Postgres connection string |
| `AUTH_SECRET` | Yes | Auth.js secret (`openssl rand -base64 32`) |
| `AUTH_URL` | No | Public site URL (set in production if Auth.js needs it) |

Example `.env.local`:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
AUTH_SECRET=
# AUTH_URL=https://your-domain.example
```

The app **fails fast** if `DATABASE_URL` is missing — do not rely on a dummy URL.

### Database & run

```bash
pnpm drizzle-kit push
# or apply SQL migrations:
pnpm drizzle-kit migrate

pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command | Description |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm lint` | ESLint |

---

## Deploy

Designed for **Vercel** + **Neon**:

1. Create a Neon database and copy `DATABASE_URL`.
2. Import the GitHub repo into Vercel.
3. Set `DATABASE_URL` and `AUTH_SECRET` (and optionally `AUTH_URL`) in the project env.
4. Run migrations against Neon (`drizzle-kit push` or `migrate` from a machine with the URL).
5. Deploy.

---

## Import format

### Pipe-separated text

One card per line (`question | answer`). Extra `|` characters stay in the answer.

```text
What is the capital of France? | Paris
Area of a circle? | $A = \pi r^2$
Diagram | See figure [img:https://example.com/circle.png]
```

### JSON

Arrays of cards, or objects with a `cards` / `decks` field. Common key aliases are accepted (`question`/`q`/`front`, `answer`/`a`/`back`, etc.):

```json
[
  { "question": "2 + 2?", "answer": "4" },
  { "question": "Circle area", "answer": "$A = \\pi r^2$", "image": "https://example.com/circle.png" }
]
```

### Content limits (server-enforced)

| Field | Limit |
| --- | --- |
| Deck name | 100 characters |
| Cards per deck | 500 |
| Question | 5,000 characters |
| Answer | 10,000 characters |
| Password | 8–128 characters |
| Decks per user | 5 by default (`users.max_decks`) |

Image URLs must be `https://` (or `http://localhost` in development).

---

## Admin

1. Register a normal account.
2. In Postgres, set admin:

```sql
UPDATE users SET is_admin = true WHERE email = 'you@example.com';
```

3. Sign out and back in (or wait ~1 minute for the JWT admin flag to refresh).
4. Open `/admin` to publish public decks and adjust users’ `max_decks`.

---

## Project layout

```text
src/
  app/
    actions/       # Server actions (auth, decks, cards, admin, migration)
    admin/         # Admin UI
    api/auth/      # Auth.js route handlers
    faq/           # Study guide
    login/         # Credentials UI
    settings/      # Profile / password
  components/      # Dashboard, study, flashcards, UI primitives
  db/              # Drizzle schema + migrations
  hooks/           # Study session, import/export, TTS
  lib/             # Auth, AppProvider, storage, Zod, rate limits, i18n
  locales/         # en.json, pl.json
```

Guest state key: `letmecook_guest_state` in `localStorage`.

---

## Security notes

- Passwords are hashed with **bcryptjs**.
- Auth and password-change endpoints are **rate-limited** (in-memory; best-effort on multi-instance serverless).
- Public library responses omit owner emails.
- Prefer HTTPS image embeds; untrusted schemes are rejected in the renderer.

---

## License

[MIT](LICENSE) © 2026 xKony
