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
- Squad viewer per team with player roster (position, stats, height, age, photo)
- Starting XI selection with auto-select by formation
- Player ability ratings (OVR, pace, shooting, passing, dribbling, defending, physical)
- Player photo zoom on click
- Real player data for 44 countries via API-Football (fallback: generated players marked with `*`)
- Formation selector for group stage teams (8 formations with attack/defense modifiers)
- Team strength modifier (-2 to +2) and team swap between groups
- Win/lose/draw color indicators (green/red/orange)
- Winner history stored in localStorage
- Dark/light mode toggle
- Sound effects (whistle, goal, victory, crowd ambience)
- Responsive design with horizontal scroll for squad table on mobile
- FIFA ranking popup with confederation filter

## Match Simulation

Match results are determined by a Poisson distribution based on FIFA ranking:

1. Ranking to strength: `max(0.8, 3.0 - (rank - 1) * 0.016) + modifier * 0.4`
2. Formation modifier: `strength += atkMod - opponent.defMod`
3. Starting XI modifier: average OVR difference from squad average (±0.2)
4. Goals: random draw from Poisson distribution with strength as mean
5. Knockout ties: penalty shootout with slight advantage to higher-ranked team

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

Real player data is stored in `src/data/players/` as per-country JSON files (sourced from API-Football).
The fetch script dynamically queries the API country list and matches against the project's 211 FIFA nations (167 matchable, 44 small nations not in API).
Remaining countries use algorithmically generated players based on FIFA ranking and 30 cultural-region name pools.
Generated (fallback) players are marked with `*` in the squad modal.

To fetch all countries (`.env` file with `API_FOOTBALL_KEY` required):

```bash
bun run scripts/fetchWorldcup.ts
```

bun auto-loads `.env`, so no need to pass the key inline.

- Already downloaded countries (JSON file exists) are skipped automatically.
- `scripts/.cache_wc.json` stores "queried but no data" results (e.g. teamId null) to avoid wasting API calls on repeated runs.
- Deleting the cache does NOT re-download countries that already have JSON files — only re-queries countries with no data.
- When the daily API limit is reached, re-run the next day to continue.
- `src/data/players/index.ts` is auto-generated after each run.

## Project Structure

```text
src/
├── data/
│   ├── countries.ts         # 211 FIFA nations (name, code, flag, rank, confederation)
│   ├── presets.ts           # Tournament presets (2002-2026 World Cup)
│   ├── playerNames.ts       # Region-specific name pools (30 cultural groups)
│   └── players/             # Per-country player data (44 countries)
│       ├── index.ts         # Aggregated import/export
│       ├── ar.json          # Argentina
│       ├── fr.json          # France
│       └── ...
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
│   └── FifaRanking.tsx       # FIFA ranking popup
├── App.tsx                   # Main app (tournament state management)
├── App.css                   # App styles (dark mode, bracket, etc.)
└── index.css                 # Global styles
scripts/
├── fetchWorldcup.ts          # API-Football squad fetch script
└── generatePlayers.ts        # Hardcoded player data generator
```
