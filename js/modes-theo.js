// Theo #22 — Holy Cross green. A looping highlight reel:
// jump shot → dribble-drive layup → three over a defender → celebration.
import { W } from './renderer.js?v=40';

const GREEN = [0, 150, 75], DG = [0, 90, 45], LIME = [60, 220, 120], WHITE = [255, 255, 255];
const ORANGE = [255, 120, 0], SKIN = [240, 190, 150], HAIR = [150, 100, 55], BLACK = [20, 20, 20];
const RED = [210, 30, 40];
const RIM = [13, 22], PLAY = 4000;
const THEO = { jersey: GREEN, edge: DG, hair: HAIR, shorts: BLACK, shoe: GREEN, num: true };
const DEF = { jersey: WHITE, edge: RED, hair: [60, 40, 25], shorts: RED, shoe: RED, num: false };

function gym(f) {
  for (let y = 0; y < 53; y++) f.rect(0, y, W, 1, [6, 10 + (y >> 3), 24 + (y >> 2)]);
  for (let y = 53; y < 64; y++) for (let x = 0; x < W; x++) {
    f.set(x, y, y % 3 === 0 || (x + ((y / 3) | 0) * 17) % 29 === 0 ? [170, 116, 56] : [205, 150, 82]);
  }
  f.rect(0, 53, W, 1, [200, 30, 40]);
}

function hoop(f, swish) {
  f.rect(4, 6, 19, 13, WHITE); f.rect(5, 7, 17, 11, [30, 40, 70]);
  f.rect(10, 11, 7, 6, WHITE); f.rect(11, 12, 5, 4, [30, 40, 70]);
  f.rect(13, 18, 1, 4, [150, 150, 150]);
  f.rect(8, 22, 11, 1, ORANGE);
  const sway = swish ? Math.round(Math.sin(swish / 40)) : 0;
  for (let i = 0; i < 6; i++) for (let x = 9 + (i >> 1); x < 18 - (i >> 1); x += 2) f.set(x + (i > 1 ? sway : 0), 23 + i, WHITE);
}

// pose: 'stand' | 'up' (arms up) | 'dribble' (left arm out); dy lifts the player off the floor
function player(f, x, pose, dy = 0, k = THEO) {
  x = Math.round(x); const y = Math.round(dy);
  f.rect(x + 3, 25 + y, 6, 2, k.hair); f.rect(x + 3, 27 + y, 6, 5, SKIN);
  f.set(x + 4, 29 + y, BLACK); f.set(x + 7, 29 + y, BLACK);
  if (pose === 'up') { f.rect(x + 2, 18 + y, 2, 9, SKIN); f.rect(x + 8, 19 + y, 2, 8, SKIN); f.set(x, 32 + y, SKIN); f.set(x + 11, 32 + y, SKIN); }
  else if (pose === 'dribble') { f.rect(x - 1, 32 + y, 2, 1, SKIN); f.rect(x - 1, 33 + y, 1, 6, SKIN); f.rect(x + 11, 32 + y, 1, 8, SKIN); }
  else { f.rect(x, 32 + y, 1, 8, SKIN); f.rect(x + 11, 32 + y, 1, 8, SKIN); }
  f.rect(x + 1, 32 + y, 10, 11, k.jersey); f.rect(x + 1, 32 + y, 1, 11, k.edge); f.rect(x + 10, 32 + y, 1, 11, k.edge);
  if (k.num) {
    const two = ['###', '..#', '###', '#..', '###'];
    f.sprite(two, x + 2, 35 + y, { '#': WHITE }); f.sprite(two, x + 6, 35 + y, { '#': WHITE });
  } else f.rect(x + 1, 32 + y, 10, 1, k.edge);
  f.rect(x + 1, 43 + y, 10, 5, k.shorts);
  f.rect(x + 2, 48 + y, 3, 2, SKIN); f.rect(x + 7, 48 + y, 3, 2, SKIN);
  f.rect(x + 2, 50 + y, 3, 2, WHITE); f.rect(x + 7, 50 + y, 3, 2, WHITE);
  f.rect(x + 1, 52 + y, 4, 1, k.shoe); f.rect(x + 7, 52 + y, 4, 1, k.shoe);
}

function ball(f, cx, cy) {
  f.disc(cx, cy, 3, ORANGE);
  f.line(cx - 3, cy, cx + 3, cy, BLACK); f.line(cx, cy - 3, cx, cy + 3, BLACK);
}

// position along an arc from a to b; p in 0..1
const arc = (a, b, p, h) => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p - h * 4 * p * (1 - p)];
const clamp = v => Math.max(0, Math.min(1, v));
const jump = (k, start, len, h) => k > start && k < start + len ? -h * Math.sin(Math.PI * (k - start) / len) : 0;

function confetti(f, t, n) {
  const cols = [GREEN, LIME, WHITE];
  for (let i = 0; i < n; i++) {
    const x = (i * 37 + Math.sin(t / 300 + i) * 4 + 128) % 128;
    const y = ((t * (0.02 + (i % 5) * 0.006) + i * 13) % 70) - 6;
    f.rect(x, y, 1 + (i % 2), 1, cols[i % 3]);
  }
}

// Each play draws its players/ball and returns { made: ms since the bucket (negative = not yet), call }
const PLAYS = [
  // 1. pull-up jumper
  (f, k) => {
    const dy = jump(k, 150, 600, 4);
    player(f, 40, k > 150 && k < 2600 ? 'up' : 'stand', dy);
    const p = clamp((k - 400) / 1400);
    if (k < 400) ball(f, 44, 17 + dy);
    else if (p < 1) ball(f, ...arc([44, 14], RIM, p, 16));
    return { made: k - 1800, call: 'SWISH!' };
  },
  // 2. dribble drive and layup off the glass
  (f, k) => {
    const x = 56 - 30 * clamp(k / 1500);
    if (k < 1500) {
      player(f, x, 'dribble');
      ball(f, x - 3, 41 + Math.abs(Math.sin(k / 110)) * 9);
      return { made: -1 };
    }
    player(f, k < 3400 ? 26 : 26 + (k - 3400) / 600 * 14, k < 2600 ? 'up' : 'stand', jump(k, 1500, 900, 7));
    const p1 = clamp((k - 1650) / 400), p2 = clamp((k - 2050) / 300);
    if (p1 < 1) ball(f, ...arc([30, 14], [21, 12], p1, 3));
    else if (p2 < 1) ball(f, ...arc([21, 12], RIM, p2, 2));
    return { made: k - 2350, call: 'LAYUP!' };
  },
  // 3. three over a defender
  (f, k, t) => {
    player(f, 30, k > 350 && k < 1100 ? 'up' : 'stand', jump(k, 350, 650, 5), DEF);
    const dy = jump(k, 100, 700, 5);
    player(f, 54, k > 100 && k < 2600 ? 'up' : 'stand', dy);
    const p = clamp((k - 350) / 1600);
    if (k < 350) ball(f, 58, 17 + dy);
    else if (p < 1) ball(f, ...arc([58, 12], RIM, p, 18));
    if (k > 1950) confetti(f, t, Math.min(60, (k - 1950) / 20));
    return { made: k - 1950, call: 'THREE!' };
  },
  // 4. celebration
  (f, k, t) => {
    confetti(f, t, 70);
    player(f, 50, Math.floor(k / 350) % 2 ? 'up' : 'stand', -Math.abs(Math.sin(k / 220)) * 5);
    return { made: 0, call: 'GO THEO!', still: true };
  },
];

export function drawTheo(f, t) {
  const k = t % PLAY;
  gym(f);
  hoop(f, 0);
  const r = PLAYS[Math.floor(t / PLAY) % PLAYS.length](f, k, t);
  const hot = r.made >= 0;
  if (!r.still && hot && r.made < 900) {
    hoop(f, r.made + 1);
    if (r.made < 450) ball(f, RIM[0], RIM[1] + r.made / 45);   // drops through the net
  }
  if (hot) f.center(r.call, 1, Math.floor(t / 150) % 2 ? LIME : WHITE, 1, 22, 70);

  const shadow = (s, x, y, c, sc) => { f.text(s, x + 1, y + 1, BLACK, sc); f.text(s, x, y, c, sc); };
  const tx = (w, sc) => 66 + Math.round((60 - f.textWidth(w, sc)) / 2);
  shadow('THEO', tx('THEO', 2), 5, WHITE, 2);
  shadow('#22', tx('#22', 2), 24, hot && Math.floor(t / 120) % 2 ? WHITE : LIME, 2);
  f.text('HOLY CROSS', tx('HOLY CROSS', 1), 43, hot ? LIME : WHITE);
}
