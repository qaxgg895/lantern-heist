// Lantern Heist — configuration: canvas, tiles, and the three night levels.
// Every level is an ASCII map, 20 columns by 11 rows. Legend:
//   #  wall (blocks movement and sight)      H  tall shelf (blocks movement and sight)
//   D  glass display case (blocks movement and sight)
//   b  fern bush (walkable, hides the thief while they stand in it)
//   L  brass lamp (walkable floor, casts a pool of light)
//   R  relic to steal                        E  exit door (opens once every relic is taken)
//   P  the thief's starting tile             G  a guard's starting tile
//   .  wooden floor
// Guard patrols are listed per level as tile waypoints the guard walks in order.

export const TILE = 64;
export const COLS = 20;
export const ROWS = 11;
export const PLAY_W = COLS * TILE; // 1280
export const PLAY_H = ROWS * TILE; // 704
export const HUD_H = 96;
export const CANVAS_W = PLAY_W; // 1280
export const CANVAS_H = PLAY_H + HUD_H; // 800

export const PLAYER_SPEED = 3.4; // tiles per second, walking
export const SNEAK_SPEED = 1.9; // tiles per second, sneaking
export const GUARD_PATROL_SPEED = 1.5;
export const GUARD_CHASE_SPEED = 2.9;
export const GUARD_SEARCH_SPEED = 2.0;
export const PEBBLE_RANGE_TILES = 7;
export const PEBBLE_NOISE_TILES = 6;
export const RUN_NOISE_TILES = 2.6;

export const LEVELS = [
  {
    name: 'The Reading Room',
    intro: 'Two guards. Two relics. Slip past the shelves, mind the lamps.',
    map: [
      '####################',
      '#P...b.....H....R..#',
      '#.........H........#',
      '#..H...G..H...b....#',
      '#..H......H........#',
      '#..H..R...H...H....#',
      '#..H......H...H....#',
      '#.....b......H.....#',
      '#....G....b...H..E.#',
      '#........L.........#',
      '####################',
    ],
    guards: [
      { waypoints: [[7, 3], [7, 8], [12, 8], [12, 3]], pause: 1.2 },
      { waypoints: [[5, 8], [15, 8], [15, 5], [5, 5]], pause: 0.8 },
    ],
    pebbles: 4,
  },
  {
    name: 'The Gallery of Echoes',
    intro: 'Three guards, three relics. The gallery lamps leave nowhere to run.',
    map: [
      '####################',
      '#P..H......b....R..#',
      '#...H..G...H.......#',
      '#...H......H...D...#',
      '#.b....R...H...D...#',
      '#.....H....H.......#',
      '#..G..H....b...G...#',
      '#.....H........H...#',
      '#.b...H...R....H.E.#',
      '#....L....L....L...#',
      '####################',
    ],
    guards: [
      { waypoints: [[7, 2], [13, 2], [13, 5], [7, 5]], pause: 1.0 },
      { waypoints: [[3, 6], [3, 9], [9, 9], [9, 6]], pause: 1.4 },
      { waypoints: [[16, 6], [16, 3], [12, 3], [12, 6]], pause: 0.9 },
    ],
    pebbles: 5,
  },
  {
    name: 'The Vault of Whispers',
    intro: 'Four guards, three relics, one way out. Stay in the dark.',
    map: [
      '####################',
      '#P..H....D....b..R.#',
      '#...H....D........G#',
      '#.b.H....D....H....#',
      '#...H....R....H....#',
      '#...H.........H..G.#',
      '#.G....b..H...H....#',
      '#........H....H..R.#',
      '#...H....H....b....#',
      '#..L...H.....L...E.#',
      '####################',
    ],
    guards: [
      { waypoints: [[18, 2], [18, 8], [14, 8], [14, 2]], pause: 0.7 },
      { waypoints: [[16, 5], [10, 5], [10, 8], [16, 8]], pause: 1.1 },
      { waypoints: [[2, 6], [7, 6], [6, 9], [2, 9]], pause: 1.0 },
      { waypoints: [[8, 1], [12, 1], [12, 4], [8, 4]], pause: 1.3 },
    ],
    pebbles: 5,
  },
];
