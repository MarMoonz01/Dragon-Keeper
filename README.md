# NEXUS: Gamified AI Life OS

**Nexus** is a React-based "Life Operating System" that gamifies your daily productivity, health tracking, and IELTS learning with RPG mechanics and AI assistance.

## Key Features

### Gamification
- **Dragon Companion** — grows and evolves as you complete tasks (7 evolution stages)
- **RPG Combat** — turn-based battles against procrastination monsters
- **World Map** — quest-based progression with milestones and deadlines
- **22 Achievements** — streak, IELTS, health, combat, and hidden categories
- **XP Shop** — streak freezes, XP boosts, and more

### AI Integration (BYOK)
- **Daily Planner** — AI-generated personalized daily schedules
- **IELTS Essay Scorer** — Task 1 & 2 evaluation with official band descriptors (Bands 5–8)
- **Speaking Dojo** — AI conversation partner with pronunciation feedback
- **AI Chat** — context-aware floating assistant
- Supports **Claude**, **OpenAI GPT-4o**, and **Gemini 3 Flash**

### Productivity & Health
- **Task Management** — categorized tasks with XP rewards
- **Focus Timer** — 25-min Pomodoro with visual animations
- **Health Dashboard** — sleep, steps, water, heart rate, calories
- **Weekly Review** — AI-powered weekly insights and goal setting
- **PDF Library** — upload documents and chat with AI about them

### Architecture
- **Frontend**: React 19, Vite 7, React Router 7
- **Styling**: Vanilla CSS with custom properties (dark/light theme)
- **Backend**: Supabase (8 tables, Edge Functions)
- **Storage**: Local-first with async Supabase sync (1.5s debounced writes)
- **PWA**: Installable Progressive Web App

## Getting Started

### Prerequisites
- Node.js 18+
- An AI API key (Claude, OpenAI, or Gemini)
- Supabase account (optional — app works offline with localStorage)

### Installation

```bash
git clone https://github.com/MarMoonz01/Dragon-Keeper.git
cd Dragon-Keeper
npm install
```

### Configure Environment (optional)

Create a `.env` file for Supabase sync:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

API keys are entered in the app's Settings UI — no env vars needed for AI.

### Run

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

Output goes to `dist/`, ready to deploy to Vercel, Netlify, or any static host.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build | Vite 7 |
| Routing | React Router 7 |
| Styling | Vanilla CSS (variables, flexbox/grid) |
| AI | Claude Sonnet, GPT-4o, Gemini 3 Flash |
| Backend | Supabase (Postgres + Edge Functions) |
| Charts | Recharts |
| PDF | pdf.js |

## License

MIT
