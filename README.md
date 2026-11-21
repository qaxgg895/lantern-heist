# lantern-heist

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/qaxgg895/lantern-heist/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/qaxgg895/lantern-heist/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

**Lantern Heist** — a top-down stealth game set in the Hollow Archive, a night
museum of whispering shelves and lamplight. You are Moth, a thief with a
lantern and a pocketful of pebbles. Steal every relic in each of the three
rooms, then slip out the exit — unseen.

- **Guards with vision cones** — each watchman patrols a route and scans a
  cone of lamplight. The cone hugs the walls, turns amber as he grows
  suspicious, and burns red when he gives chase.
- **Cover to hide behind** — tall shelves and glass cases block sight, and
  fern bushes hide you outright unless a guard is standing on top of you.
- **Light matters** — lamps widen a guard's gaze; darkness shrinks it.
  Sneak (Shift) to move slowly, quietly, and harder to spot.
- **Noise is a tool** — click to throw a pebble; guards leave their patrol
  to investigate the clink. Run, and your own footsteps give you away.
- **Three rooms, one heist** — the Reading Room, the Gallery of Echoes, and
  the Vault of Whispers, each with more guards and tighter light.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — or open `game/index.html` from any static
server. No build step, no network requests, no libraries: hand-drawn Canvas
2D and synthesized WebAudio sound, all in `game/`.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| Shift | Sneak |
| Mouse click | Throw a pebble (distraction) |
| E | Take a relic when close |
| R | Restart the level |
| P | Pause |
| H | Help |
| M | Sound on / off |

---

<sub>Entered on [make.fun](https://make.fun/?ref=qaxgg895&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
