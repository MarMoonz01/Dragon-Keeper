# NEXUS: Gamified AI Life OS 🐲

**Nexus** is a React-based "Life Operating System" that gamifies your daily productivity, health tracking, and learning (IELTS) with RPG mechanics and AI assistance.

![Nexus Dashboard](https://via.placeholder.com/800x400?text=Nexus+Dashboard+Preview)

## 🌟 Key Features

### 🎮 Gamification
- **Dragon Mascot**: Your personal companion that grows as you complete tasks.
- **RPG Stats**: Level up your Focus, Intelligence, Health, and Discipline.
- **Battle Mode**: Turn-based combat against "monster" tasks.
- **World Map**: Visual progression system with unlockable zones.

### 🤖 AI Integration
- **Daily Briefing**: AI-generated morning reports based on your calendar and goals.
- **Essay Evaluator**: IELTS Task 1 & 2 scoring with Gemini 1.5 Pro (Band 9.0 logic).
- **Speaking Dojo**: AI conversation partner for language practice.
- **Magic Chat**: Context-aware assistant for quick help.

### 📅 Productivity & Health
- **Task Management**: Drag-and-drop tasks with priority levels.
- **Focus Timer**: Pomodoro-style timer with visual "coffee" animations.
- **Health Tracker**: Log water, sleep, steps, and calories with simple UI.
- **Google Calendar**: Two-way sync for schedule management.

### 🔧 Architecture
- **Tech**: React, Vite, Tailwind-like CSS (Vanilla), Supabase (Edge Functions).
- **PWA**: Fully offline-capable Progressive Web App.
- **Storage**: Local-first data with Supabase sync options.
- **Security**: Secure API key management via Edge Functions.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase Account (optional for sync/AI proxy)
- Google Gemini or Anthropic Claude API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/nexus-app.git
    cd nexus-app
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file (optional for local dev):
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_key
    ```
    *Note: API Keys can be entered in the App Settings UI.*

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

### Building for Production

To create a production-ready build:

```bash
npm run build
```

The output will be in the `dist/` directory, ready to deploy to Vercel, Netlify, or Github Pages.

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite
- **Language**: JavaScript / TypeScript (Hybrid)
- **Styling**: Vanilla CSS (Variables, Flexbox/Grid)
- **AI**: Google Gemini 1.5 Pro, Anthropic Claude 3.5 Sonnet
- **Backend**: Supabase (Database, Edge Functions, Auth)
- **Routing**: React Router v6

## 📜 License
MIT License. Built with ❤️ by [Your Name].
