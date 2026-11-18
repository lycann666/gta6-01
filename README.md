# Neon Harbor — Open-World Crime Game

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/lycann666/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/lycann666/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

An original open-world crime game set in the invented port city of **Teluk Neon**.
You play Rian "Rex" Marlowe, a courier who takes jobs from fixer Mira Solano to
pay off a debt — while the city police try to stop you. Every name, place,
character, piece of art and sound in this game is original; nothing is taken
from any existing game, film or map.

## What is in the game

- A living open city (3,200 × 2,400) to explore **on foot and by car**: a road
  grid, building blocks, parks, a harbor strip, districts and landmarks.
- Traffic cars driving the roads, pedestrians on the sidewalks, parked cars
  you can steal (E) and drive.
- A **wanted level** (0–5 stars): crimes raise it, police cars chase you, get
  too close on foot and you are busted; rammed in a car, your health drops.
- **5 story missions** with a marker, an off-screen direction arrow and a
  minimap: meet Mira at the pier, steal the blue sedan, collect 3 packages,
  escape a 3-star raid to the eastern hideout, and the final getaway to the ship.
- Combat: punch (F) or shoot (F, when a target is ahead and you have ammo).
  Ammo and health pickups are scattered around the city.
- HUD with cash, wanted stars, health bar, speed, ammo, mission objective and
  a live minimap; title / pause / game-over / win screens; progress and best
  cash saved in `localStorage`.
- Synthesized WebAudio sound only (engine hum, sirens, punches, gunshots,
  mission jingle) — no audio files, no network requests at all.

## Controls

| Key | Action |
| --- | --- |
| W A S D / arrows | Walk / drive (Up = accelerate) |
| Shift | Run on foot |
| E | Enter / exit the nearest car |
| F | Punch, or shoot when a target is ahead |
| P / Esc | Pause (progress is saved) |
| M | Mission reminder |
| Space / Enter / click | Start, resume, restart |

## How to run

```sh
node serve.ts
```

Then open <http://localhost:8080> in a desktop browser.

## Files

- `game/index.html` — the page; `game/src/` — the game, split by job:
  `config.js` (tuning, story, palette), `random.js` (seeded RNG),
  `city.js` (city generation + collision), `input.js`, `audio.js` (synth),
  `world.js` (simulation: player, cars, traffic, police, wanted, combat),
  `missions.js` (the 5-job state machine), `render.js` (canvas + HUD +
  minimap), `shots.js` (deterministic screenshot scenes), `main.js` (loop).
- `main.ts` — copies `game/` + `screenshots/` to `/output` and writes the
  dossier via the vendored make.fun library.
- `screenshots/` — 4 real renders of the game (see `shots.json` for the
  `?shot=…&seed=1` query behind each one).

## Deterministic screenshots

`?shot=start|play|chase|mission&seed=1` stages a real simulated scene
(title over the living city / driving with traffic / 3-star police chase /
mission 2 with the blue sedan) and sets `window.__shotReady` when painted.

<sub>Entered on [make.fun](https://make.fun/?ref=5f3j6jyb&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
