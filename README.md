# FIFA World Cup Simulator

FIFA 211 member nations, group stage and knockout tournament simulation web app.

## Features

- 211 FIFA member nations with real rankings (April 2026)
- 32-team (8 groups) and 48-team (12 groups) tournament formats
- Presets: 2002, 2006, 2010, 2014, 2018, 2022, 2026 World Cup
- Region-based random selection (Asia, Europe, Africa, Americas, Oceania, etc.)
- Group stage with standings table and wildcard 3rd-place advancement (48-team)
- Knockout bracket with visual connectors and final match circle layout
- Match simulation based on FIFA ranking (Poisson distribution)
- Squad viewer per team with 26-player roster (position, stats, height, age)
- Starting XI selection with auto-select by formation
- Player ability ratings (OVR, pace, shooting, passing, dribbling, defending, physical)
- Real player data via API-Football integration (fallback: generated players)
- Formation selector for group stage teams (8 formations with attack/defense modifiers)
- Team strength modifier (-2 to +2) and team swap between groups
- Win/lose/draw color indicators (green/red/orange)
- Winner history stored in localStorage
- Dark/light mode toggle
- Sound effects (whistle, goal, victory, crowd ambience)
- Responsive design (desktop and mobile)
- FIFA ranking popup with confederation filter

## Match Simulation

Match results are determined by a Poisson distribution based on FIFA ranking:

1. Ranking to strength: `max(0.8, 3.0 - (rank - 1) * 0.016) + modifier * 0.4`
2. Goals: random draw from Poisson distribution with strength as mean
3. Knockout ties: penalty shootout with slight advantage to higher-ranked team

## Tech Stack

- Vite + React + TypeScript
- Biome (linter/formatter)
- bun (package manager)

## Getting Started

```bash
bun install
bun run dev
bun run build
```

## Player Data

Real player data for 8 countries is included in `src/data/players.json` (sourced from API-Football).
All other countries use algorithmically generated players based on FIFA ranking.
Generated (fallback) players are marked with `*` in the squad modal.

## Project Structure

```text
src/
├── data/
│   ├── countries.ts         # 211 FIFA nations (name, code, flag, rank, confederation)
│   ├── presets.ts           # Tournament presets (2002-2026 World Cup)
│   ├── playerNames.ts       # Region-specific name pools (30 cultural groups)
│   └── players.json         # API-Football player data (populated by fetch script)
├── types.ts                 # Type definitions (Match, Group, Round, Player, etc.)
├── utils/
│   ├── tournament.ts        # Tournament logic (simulation, groups, brackets)
│   ├── playerRating.ts      # Player rating generation (seeded PRNG, position bias)
│   ├── playerLoader.ts      # Player data loading, caching, auto XI selection
│   └── sounds.ts            # Sound effects management
├── components/
│   ├── BracketView.tsx      # Knockout bracket with connectors
│   ├── GroupView.tsx         # Group stage standings and matches
│   ├── GroupMatchCard.tsx    # Group match card
│   ├── MatchCard.tsx         # Knockout match card
│   ├── SquadModal.tsx        # Squad viewer with starting XI selection
│   ├── Champion.tsx          # Winner celebration display
│   ├── TeamSelector.tsx      # Team selection with region filters
│   ├── WinnerHistory.tsx     # Winner history panel
│   ├── AnimatedScore.tsx     # Goal count-up animation
│   ├── FifaRanking.tsx       # FIFA ranking popup
│   └── RoundView.tsx         # Round view component
├── App.tsx                   # Main app (tournament state management)
├── App.css                   # App styles (dark mode, bracket, etc.)
└── index.css                 # Global styles
```
