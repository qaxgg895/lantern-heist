// Lantern Heist — the hand-in program (Node 22, standard library only).
// It copies the playable game and the maker's screenshots into the output
// directory and writes dossier.json with the kit's vendored library, so the
// judge can read the game from its screenshots and its source outline.
//
// Run locally as: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps, as the starter's main.ts records them: at most 4
// screenshots of at most 256 KiB each, at most 993 files and 48 MiB under
// game/, and no path under game/ longer than 1000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Say what was handed in, and refuse to look finished when a part of the
// hand-in is missing: the dossier is only valid when it was written from
// the game and the screenshots that were just copied.
import { readdirSync, statSync } from 'node:fs';
const shots = readdirSync(join(out, 'screenshots')).filter((f) => !f.startsWith('.'));
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
}
for (const shot of shots) {
  const size = statSync(join(out, 'screenshots', shot)).size;
  if (size > 262144) throw new Error(`screenshot ${shot} is ${size} bytes, over the 256 KiB cap`);
}
if (!existsSync(join(out, 'dossier.json')) || !existsSync(join(out, 'game', 'index.html'))) {
  throw new Error('dossier.json or game/index.html missing from the output');
}
console.log(`Lantern Heist handed in: ${shots.length} screenshots, dossier.json written to ${out}`);
