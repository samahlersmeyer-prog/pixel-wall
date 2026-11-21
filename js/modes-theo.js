// Theo #22 — Holy Cross green. Theo shoots, the ball arcs in, the net swishes, repeat.
import { W } from './renderer.js?v=38';

const GREEN = [0, 150, 75], DG = [0, 90, 45], LIME = [60, 220, 120], WHITE = [255, 255, 255];
const ORANGE = [255, 120, 0], SKIN = [240, 190, 150], HAIR = [150, 100, 55], BLACK = [20, 20, 20];
const CYCLE = 3600, FLIGHT = 1500;

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

function theo(f, x, armsUp) {
  f.rect(x + 3, 25, 6, 2, HAIR); f.rect(x + 3, 27, 6, 5, SKIN);
  f.set(x + 4, 29, BLACK); f.set(x + 7, 29, BLACK);
  if (armsUp) { f.rect(x + 2, 18, 2, 9, SKIN); f.rect(x + 8, 19, 2, 8, SKIN); }
  else { f.rect(x, 32, 1, 8, SKIN); f.rect(x + 11, 32, 1, 8, SKIN); }
  f.rect(x + 1, 32, 10, 11, GREEN); f.rect(x + 1, 32, 1, 11, DG); f.rect(x + 10, 32, 1, 11, DG);
  if (armsUp) { f.set(x, 32, SKIN); f.set(x + 11, 32, SKIN); }
  const two = ['###', '..#', '###', '#..', '###'];
  f.sprite(two, x + 2, 35, { '#': WHITE }); f.sprite(two, x + 6, 35, { '#': WHITE });
  f.rect(x + 1, 43, 10, 5, BLACK);
  f.rect(x + 2, 48, 3, 2, SKIN); f.rect(x + 7, 48, 3, 2, SKIN);
  f.rect(x + 2, 50, 3, 2, WHITE); f.rect(x + 7, 50, 3, 2, WHITE);
  f.rect(x + 1, 52, 4, 1, GREEN); f.rect(x + 7, 52, 4, 1, GREEN);
}

function ball(f, cx, cy) {
  f.disc(cx, cy, 3, ORANGE);
  f.line(cx - 3, cy, cx + 3, cy, BLACK); f.line(cx, cy - 3, cx, cy + 3, BLACK);
}

export function drawTheo(f, t) {
  const k = t % CYCLE;
  gym(f);
  // flight: from Theo's hands (44,17) up and over into the rim (13,22)
  const p = Math.min(1, k / FLIGHT);
  const bx = 44 + (13 - 44) * p, by = 17 + (22 - 17) * p - 16 * 4 * p * (1 - p);
  const made = k > FLIGHT;
  hoop(f, made && k < FLIGHT + 900 ? k - FLIGHT : 0);
  theo(f, 40, k < FLIGHT + 1200);
  if (!made) ball(f, bx, by);
  else if (k < FLIGHT + 500) ball(f, 13, 22 + (k - FLIGHT) / 50);  // drops through the net
  const shadow = (s, x, y, c, sc) => { f.text(s, x + 1, y + 1, BLACK, sc); f.text(s, x, y, c, sc); };
  const tx = (w, sc) => 66 + Math.round((60 - f.textWidth(w, sc)) / 2);
  shadow('THEO', tx('THEO', 2), 5, WHITE, 2);
  shadow('#22', tx('#22', 2), 24, made && k < FLIGHT + 900 && Math.floor(k / 120) % 2 ? WHITE : LIME, 2);
  f.text('HOLY CROSS', tx('HOLY CROSS', 1), 43, made && k < FLIGHT + 900 ? LIME : WHITE);
}
