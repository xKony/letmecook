# LetMeCook Web - Simple Active Recall System

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-Latest-black?style=for-the-badge&logo=framer&logoColor=white)

**LetMeCook Web** is a high-performance, local-first Active Recall study tool. Originally inspired by a PyQt6 desktop tool, this modern web port brings the power of efficient learning to the browser with a sleek, responsive, and animated user interface.

Designed for students and lifelong learners, it prioritizes **speed**, **privacy**, and **user experience**, running entirely in your browser without requiring a backend server.

---

## ✨ Key Features

- **🧠 Active Recall System**: 
  - Self-paced mastery tracking to reinforce learning.
  - Progress levels from "New" to "Mastered" for every card.

- **🔒 Local-First Architecture**:
  - **100% Privacy**: All data (decks, cards, progress) is stored locally in your browser (LocalStorage).
  - **Offline Capable**: Study anywhere, anytime, without an internet connection.

- **👥 Multi-User Support**:
  - Create multiple user profiles on a single device.
  - Separate deck collections and progress tracking for each user.

- **📊 Comprehensive Dashboard**:
  - Visual overview of your learning decks.
  - Progress tracking for individual cards and sessions.

- **🎨 Modern User Interface**:
  - **Dark Mode** support via `next-themes`.
  - Smooth, buttery animations using **Framer Motion**.
  - Fully responsive design optimized for Mobile, Tablet, and Desktop.

- **⚡ High Performance**:
  - Built on **React 19** and **Next.js 16** for lightning-fast rendering.
  - Zero-latency interactions.

---

## 🛠️ Tech Stack

This project is built with the latest modern web technologies to ensure scalability, maintainability, and performance.

### Core
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Library**: [React 19](https://react.dev/)

### Styling & UI
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Components**: [Radix UI](https://www.radix-ui.com/) & [Lucide React](https://lucide.dev/) (Icons)
- **Utilities**: `clsx`, `tailwind-merge`

### State & Persistence
- **State Management**: React Context API + Custom Hooks
- **Persistence**: LocalStorage API (Custom storage adapter)

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- **Node.js**: Version 18.17 or higher
- **pnpm**: Version 10.33.0 or higher

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

3. **Run the development server**
   ```bash
   pnpm dev
   ```

4. **Access the app**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── page.tsx        # Entry point (Main Wrappers)
│   │   └── layout.tsx      # Root layout
│   ├── components/         # Reusable UI components
│   │   ├── app-main.tsx    # Main Application Logic Controller
│   │   ├── dashboard.tsx   # Dashboard View
│   │   ├── study-session.tsx # Active Recall Interface
│   │   └── ui/             # Generic Design System Components
│   ├── lib/                # Utilities and Logic
│   │   ├── app-context.tsx # Global State Management
│   │   ├── storage.ts      # LocalStorage Adapter
│   │   └── types.ts        # TypeScript Interfaces (Deck, Flashcard)
│   └── hooks/              # Custom React Hooks
└── public/                 # Static assets
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ and Antigravity.</sub>
</div>
