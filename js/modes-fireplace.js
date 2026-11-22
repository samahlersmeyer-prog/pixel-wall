// Cozy fireplace: brick surround, crackling fire, stockings, twinkling garland,
// and a Christmas tree off to the right side.
// About once a minute something gentle happens (the two dogs nap by the fire,
// a marshmallow gets toasted, a mug of cocoa steams, a candy cane peeks out
// of a stocking, a log pops and sends up sparks, or a stocking catches a spark
// and an elf runs in to put it out).
// Every other minute Santa visits: candy cane in one stocking, then a present
// wrapped in that stocking's color goes under the tree. When all seven have
// one, the whole family comes in, opens them and walks off.
import { W, H } from './renderer.js?v=44';

const OX = 26, OY = 22, FW = 76, FH = 36;   // firebox opening
const rnd = n => { const x = Math.sin(n * 91.345) * 43758.5453; return x - Math.floor(x); };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const ease = p => p * p * (3 - 2 * p);

// heat 0..36 -> color (black, deep red, orange, yellow, near white)
const PAL = Array.from({ length: 37 }, (_, i) => {
  const k = i / 36;
  if (k < 0.3) return [k / 0.3 * 140, 10 * k, 0];
  if (k < 0.6) return [140 + (k - 0.3) / 0.3 * 115, 40 + (k - 0.3) / 0.3 * 90, 0];
  if (k < 0.85) return [255, 130 + (k - 0.6) / 0.25 * 100, (k - 0.6) / 0.25 * 30];
  return [255, 230 + (k - 0.85) / 0.15 * 25, 30 + (k - 0.85) / 0.15 * 170];
});

function inOpening(x, y) {
  if (x < OX || x >= OX + FW || y < OY || y >= OY + FH) return false;
  // rounded top corners
  const r = 8, dx = x < OX + r ? OX + r - x : x >= OX + FW - r ? x - (OX + FW - r - 1) : 0, dy = y < OY + r ? OY + r - y : 0;
  return dx * dx + dy * dy <= r * r;
}

function sim(f, t, flare) {
  f.sim = f.sim || {};
  let s = f.sim.fire;
  if (!s) s = f.sim.fire = { heat: new Uint8Array(FW * FH), last: 0 };
  if (t - s.last < 45) return s;
  s.last = t;
  const h = s.heat;
  const base = 30 + Math.round(4 * Math.sin(t / 900) + 2 * Math.sin(t / 370));
  for (let x = 0; x < FW; x++) {
    // The fire sits on the logs, strongest in the middle.
    const mid = 1 - Math.abs(x - FW / 2) / (FW / 2);
    h[(FH - 1) * FW + x] = x < 8 || x > FW - 9 ? 0 : Math.min(36, Math.round(base * (0.55 + 0.45 * mid) + flare * 6 + Math.random() * 4));
  }
  for (let y = 0; y < FH - 1; y++) for (let x = 0; x < FW; x++) {
    const src = (y + 1) * FW + x;
    const decay = Math.random() < 0.5 ? 1 : (Math.random() < 0.55 - flare * 0.3 ? 2 : 0);
    const nx = Math.min(FW - 1, Math.max(0, x + Math.round(Math.random() * 2 - 1)));
    h[y * FW + nx] = Math.max(0, h[src] - decay);
  }
  return s;
}

// One stocking per family member: mom and dad first (a little longer), then the kids oldest to youngest.
export const FAMILY = [
  { name: 'Sam', letter: 'S', color: [255, 90, 10], big: true },       // Browns orange
  { name: 'Emily', letter: 'E', color: [20, 105, 45], big: true },     // dark green
  { name: 'Max', letter: 'M', color: [40, 100, 230] },                 // blue
  { name: 'Theo', letter: 'T', color: [210, 30, 40] },                 // red
  { name: 'Junie', letter: 'J', color: [250, 200, 40] },               // butterfly bush yellow
  { name: 'Louie', letter: 'L', color: [0, 170, 160] },                // teal
  { name: 'Josie', letter: 'J', color: [250, 110, 180] },              // pink
];
const STOCK_X = [15, 30, 45, 60, 75, 90, 105];
const TINY = {
  S: ['###', '#..', '###', '..#', '###'], E: ['###', '#..', '##.', '#..', '###'], M: ['#.#', '###', '###', '#.#', '#.#'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'], J: ['..#', '..#', '..#', '#.#', '###'], L: ['#..', '#..', '#..', '#..', '###'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['###', '#..', '#..', '#..', '###'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], G: ['###', '#..', '#.#', '#.#', '###'], H: ['#.#', '#.#', '###', '#.#', '#.#'],
  K: ['#.#', '##.', '#..', '##.', '#.#'], N: ['###', '#.#', '#.#', '#.#', '#.#'], O: ['###', '#.#', '#.#', '#.#', '###'],
  P: ['###', '#.#', '###', '#..', '#..'], R: ['##.', '#.#', '##.', '#.#', '#.#'], W: ['#.#', '#.#', '###', '###', '#.#'],
};
function stocking(f, x, y, m) {
  f.rect(x, y, 8, 7, [240, 240, 240]);                          // cuff
  const g = TINY[(m.letter || m.name?.[0] || '').toUpperCase()];
  // light colors (like Junie's yellow) get a darker letter so it shows on the white cuff
  const lum = m.color[0] * 0.3 + m.color[1] * 0.59 + m.color[2] * 0.11;
  if (g) f.sprite(g, x + 3, y + 1, { '#': lum > 150 ? m.color.map(v => v * 0.65) : m.color });
  const len = m.big ? 9 : 7;
  f.rect(x + 1, y + 7, 6, len, m.color);                         // leg
  f.rect(x + 2, y + 7 + len, 6, 2, m.color);                     // foot
  f.rect(x + 7, y + 6 + len, 1, 2, m.color);
  f.rect(x + 3, y + 9 + len, 4, 1, m.color.map(v => v * 0.7));  // toe shading
}
export const DOG = [
  ['..........BB..', '.........BBBB.', '........BBBKBn', 'BBBBBBBBBBBB..', 'BBBBBBBBBBB...', 'tBBBBBBBBBB...', '.B..B....B..B.', '.B..B....B..B.'],
  ['..........BB..', '.........BBBB.', '........BBBKBn', 'BBBBBBBBBBBB..', 'BBBBBBBBBBB...', 'tBBBBBBBBBB...', '..B..B..B..B..', '..B..B..B..B..'],
];
const DOG_NAP = ['...........BB..', '..........BBBB.', 'BBBBBBBBBBBBBBn', 'BBBBBBBBBBBBBB.', 'tBBBBBBBBBBBB..'];
export const DOG_P = { B: [150, 100, 60], K: [20, 20, 20], n: [20, 20, 20], t: [150, 100, 60] };
// The black dog: same shape plus a red collar, with a light eye glint so it shows up.
const collar = (rows, r, c) => rows.map((row, j) => j === r ? row.slice(0, c) + 'c' + row.slice(c + 1) : row);
export const BLACK = DOG.map(d => collar(d, 3, 10)), BLACK_NAP = collar(DOG_NAP, 2, 11);
export const BLACK_P = { B: [34, 32, 38], K: [190, 190, 200], n: [5, 5, 5], t: [34, 32, 38], c: [220, 30, 40] };

// ---------- gentle scenes ----------
// The brown dog and the black dog always come out as a pair: brown leads, black trots right behind.
function dogNap(f, lt, p) {
  const walkIn = seg(p, 0, 0.2), walkOut = seg(p, 0.82, 1);
  const y = 55, step = Math.floor(lt / 160) % 2;
  if (p < 0.2) {
    f.sprite(BLACK[1 - step], Math.round(-32 + walkIn * 62), y, BLACK_P);
    f.sprite(DOG[step], Math.round(-14 + walkIn * 60), y, DOG_P);
  } else if (p < 0.82) {
    f.sprite(BLACK_NAP, 30, 58, BLACK_P);
    f.sprite(DOG_NAP, 46, 58, DOG_P);
    for (const [zx, ph] of [[62, 0], [46, 0.5]]) for (let i = 0; i < 3; i++) {
      const q = ((lt / 1600) + ph + i / 3) % 1;
      f.text('z', zx + q * 8 + i, Math.round(52 - q * 14), [190, 210, 255].map(v => v * (1 - q * 0.8)));
    }
  } else {
    f.sprite(BLACK[1 - step], Math.round(30 + walkOut * 110), y, BLACK_P);
    f.sprite(DOG[step], Math.round(46 + walkOut * 110), y, DOG_P);
  }
}

function marshmallow(f, lt, p) {
  const inX = 70 - ease(seg(p, 0, 0.15)) * 4 + ease(seg(p, 0.85, 1)) * 70;
  const tipX = Math.round(inX), tipY = 38 + Math.round(Math.sin(lt / 500));
  f.line(tipX + 3, tipY + 1, W + 4, 26, [150, 110, 70]);
  const toast = seg(p, 0.15, 0.8);
  const c = toast < 0.5 ? [255, 255 - toast * 120, 240 - toast * 300] : [230 - (toast - 0.5) * 120, 180 - (toast - 0.5) * 140, 90 - (toast - 0.5) * 120];
  f.rect(tipX, tipY - 1, 3, 3, c.map(v => Math.max(0, v)));
}

function cocoa(f, lt, p) {
  const fade = Math.min(seg(p, 0, 0.1), 1 - seg(p, 0.9, 1));
  if (fade <= 0) return;
  const x = 12, y = 52;
  const mug = [200, 40, 40].map(v => v * fade);
  f.rect(x, y, 6, 6, mug); f.rect(x + 6, y + 1, 1, 1, mug); f.rect(x + 7, y + 2, 1, 2, mug); f.rect(x + 6, y + 4, 1, 1, mug);
  f.rect(x + 1, y, 4, 1, [120, 70, 40].map(v => v * fade));
  f.set(x + 2, y - 1, [255, 255, 255].map(v => v * fade)); f.set(x + 3, y - 1, [255, 255, 255].map(v => v * fade));
  for (let s = 0; s < 2; s++) for (let i = 0; i < 10; i++) {
    const yy = y - 2 - i - ((lt / 140) % 3), xx = x + 2 + s * 2 + Math.sin(i / 2 + lt / 400 + s * 2) * 1.5;
    f.set(xx, yy, [200, 200, 200].map(v => v * (1 - i / 10) * fade * 0.8));
  }
}

function candyCane(f, lt, p, k) {
  const rise = ease(seg(p, 0.1, 0.35)) - ease(seg(p, 0.75, 0.95));
  if (rise <= 0) return;
  const sx = STOCK_X[k % STOCK_X.length] + 4, top = 13 - Math.round(rise * 7);
  for (let i = 0; i < 9; i++) f.set(sx, top + i, i % 2 ? [255, 255, 255] : [230, 30, 30]);
  f.set(sx + 1, top - 1, [255, 255, 255]); f.set(sx + 2, top, [230, 30, 30]); f.set(sx + 2, top + 1, [255, 255, 255]);
}

function sparks(f, lt, p) {
  for (let i = 0; i < 26; i++) {
    const s = (lt / 1000) - rnd(i) * 1.5;
    if (s < 0 || s > 2.2) continue;
    const x = OX + FW / 2 + (rnd(i + 1) - 0.5) * 40 + Math.sin(s * 3 + i) * 3, y = OY + FH - 10 - s * (18 + rnd(i + 2) * 14);
    f.set(x, y, [255, 200 - s * 60, 60].map(v => v * (1 - s / 2.2)));
  }
}

// ---------- Christmas tree + presents (right side, beside the firebox) ----------
const TREE_X = 117, TREE_TOP = 31;                  // star tip / center column
const TREE_ROWS = [0, 1, 1, 2, 3, 3, 4, 5, 3, 4, 5, 6, 7, 5, 6, 7, 8, 9, 7, 8, 9, 10, 10];  // half-width per row
const ORN = [[255, 50, 50], [255, 210, 60], [80, 160, 255], [240, 240, 240], [250, 110, 180]];
function tree(f, t) {
  const y0 = TREE_TOP + 2;
  TREE_ROWS.forEach((hw, r) => {
    for (let dx = -hw; dx <= hw; dx++) {
      const shade = 0.7 + 0.3 * rnd((dx + 20) * 13 + r * 5);
      f.set(TREE_X + dx, y0 + r, [20 * shade, 115 * shade, 45 * shade]);
    }
  });
  f.rect(TREE_X - 1, y0 + TREE_ROWS.length, 3, 3, [95, 55, 25]);   // trunk
  // twinkling ornaments
  for (let i = 0; i < 16; i++) {
    const r = 3 + Math.floor(rnd(i * 3.1) * (TREE_ROWS.length - 4)), hw = TREE_ROWS[r];
    const dx = Math.round((rnd(i * 5.7) * 2 - 1) * (hw - 1));
    const on = Math.floor(t / 600 + rnd(i) * 7) % 4 !== 0;
    f.set(TREE_X + dx, y0 + r, ORN[i % ORN.length].map(v => v * (on ? 1 : 0.35)));
  }
  // star
  const tw = 0.8 + 0.2 * Math.sin(t / 300);
  const star = [255, 220, 70].map(v => v * tw);
  f.set(TREE_X, TREE_TOP, star); f.set(TREE_X - 1, TREE_TOP + 1, star); f.set(TREE_X, TREE_TOP + 1, [255, 250, 200]);
  f.set(TREE_X + 1, TREE_TOP + 1, star); f.set(TREE_X, TREE_TOP + 2, star);
}

// Present slots under the tree: 4 on the hearth line, 3 stacked behind, 1 on top (for extra Surprise visits).
const SLOTS = [[103, 54], [109, 54], [115, 54], [121, 54], [106, 50], [112, 50], [118, 50], [112, 46]];
function present(f, x, y, m, a = 1) {
  const lum = m.color[0] * 0.3 + m.color[1] * 0.59 + m.color[2] * 0.11;
  const c = m.color.map(v => v * a), rib = (lum > 150 ? [210, 30, 40] : [255, 215, 60]).map(v => v * a);
  f.rect(x, y, 5, 4, c);
  f.rect(x + 2, y, 1, 4, rib); f.rect(x, y + 1, 5, 1, rib);
  f.set(x + 1, y - 1, rib); f.set(x + 3, y - 1, rib);           // bow
}

const SANTA = [
  ['....WW......', '...RRRW.....', '..RRRRR.....', '.WWWWWWW....', '.SSSSSSS....', '.SKSSSKS....', '.WWWSWWW....', '.WWWWWWW....', '..WWWWW.....',
   'RRRRRRRRR...', 'RRRRRRRRRR..', 'RRRRWWRRRR..', 'KKKKGKKKKK..', 'RRRRRRRRRR..', 'RRRRRRRRRR..', '.RRR..RRR...', '.RRR..RRR...', '.KKK..KKK...', 'KKKK..KKKK..'],
  ['....WW......', '...RRRW.....', '..RRRRR.....', '.WWWWWWW....', '.SSSSSSS....', '.SKSSSKS....', '.WWWSWWW....', '.WWWWWWW....', '..WWWWW.....',
   'RRRRRRRRR...', 'RRRRRRRRRR..', 'RRRRWWRRRR..', 'KKKKGKKKKK..', 'RRRRRRRRRR..', 'RRRRRRRRRR..', '..RRRRRR....', '..RR..RR....', '.KKK.KKK....', 'KKK..KKK....'],
];
const SANTA_P = { W: [245, 245, 245], R: [210, 30, 35], S: [255, 205, 170], K: [25, 20, 20], G: [255, 210, 60] };

// Santa strolls in carrying a present, tucks a candy cane into one stocking (picked like names from a hat),
// then sets the present (wrapped in that stocking's color) under the tree and heads out.
function santaVisit(f, lt, p, k, fam, pileList) {
  const pileLen = pileList.length;
  const i = santaPick(k), m = fam[i] || FAMILY[i];
  const atStock = STOCK_X[i] - 9;
  const [px, py] = SLOTS[Math.min(pileLen, SLOTS.length - 1)];
  const atTree = px - 12;
  let x;
  if (p < 0.22) x = -14 + ease(p / 0.22) * (atStock + 14);
  else if (p < 0.48) x = atStock;
  else if (p < 0.62) x = atStock + ease((p - 0.48) / 0.14) * (atTree - atStock);
  else if (p < 0.74) x = atTree;
  else x = atTree + ease((p - 0.74) / 0.26) * (W + 20 - atTree);
  x = Math.round(x);
  const walking = p < 0.22 || (p > 0.48 && p < 0.62) || p > 0.74;
  f.sprite(SANTA[walking ? Math.floor(lt / 180) % 2 : 0], x, 44, SANTA_P);
  // candy cane
  const reach = seg(p, 0.25, 0.33) - seg(p, 0.38, 0.45);
  if (reach > 0) f.line(x + 9, 54, x + 9 + 3 * reach, Math.round(54 - reach * 22), [210, 30, 35]);
  if (p > 0.33) {
    const sx = STOCK_X[i] + 4;
    for (let j = 0; j < 8; j++) f.set(sx, 7 + j, j % 2 ? [255, 255, 255] : [230, 30, 30]);
    f.set(sx + 1, 6, [255, 255, 255]); f.set(sx + 2, 7, [230, 30, 30]); f.set(sx + 2, 8, [255, 255, 255]);
  }
  if (p > 0.33 && p < 0.5) f.text('HO HO HO', Math.max(0, Math.min(W - 47, x - 14)), 36, [255, 255, 255]);
  // the present: carried at his side, then set down under the tree
  const put = ease(seg(p, 0.64, 0.72));
  if (p < 0.64) present(f, x + 10, 54, m);
  else present(f, Math.round(x + 10 + (px - x - 10) * put), Math.round(54 + (py - 54) * put), m);
}

// ---------- stocking fire + elf ----------
const ELF = [
  ['.....W.', '....GG.', '...GGG.', '..GGGG.', '.RRRRR.', 'SSSSSSS', '.SKSKS.', '.SSSSS.', '.GGRGG.', 'GGGGGGG', '.GGYGG.', '.RW.RW.', 'KK...KK'],
  ['.....W.', '....GG.', '...GGG.', '..GGGG.', '.RRRRR.', 'SSSSSSS', '.SKSKS.', '.SSSSS.', '.GGRGG.', 'GGGGGGG', '.GGYGG.', '..RWR..', '.KK.KK.'],
];
const ELF_P = { W: [245, 245, 245], G: [30, 160, 60], R: [210, 30, 40], S: [255, 205, 170], K: [60, 35, 20], Y: [255, 210, 60] };
const BUCKET = [[150, 150, 165], [110, 110, 125]];

function stockingFire(f, lt, p, k, fam) {
  const i = Math.floor(rnd(k * 3.7 + 1) * 7);
  const sx = STOCK_X[i], len = (fam[i] || FAMILY[i]).big ? 9 : 7, bottom = 13 + 7 + len + 2;
  // a stray spark drifts up out of the fire to the stocking's toe
  if (p < 0.12) {
    const q = p / 0.12;
    const x0 = OX + FW / 2, y0 = OY + FH - 8;
    f.set(Math.round(x0 + (sx + 5 - x0) * q + Math.sin(q * 9) * 2), Math.round(y0 + (bottom - y0) * q), [255, 190, 60]);
  }
  // flames grow on the stocking, then the water knocks them down
  const flame = seg(p, 0.1, 0.3) * (1 - seg(p, 0.46, 0.6));
  if (flame > 0) {
    const fh = 2 + flame * 9;
    for (let dx = 0; dx < 8; dx++) {
      const hgt = fh * (0.55 + 0.45 * Math.abs(Math.sin(lt / 90 + dx * 1.7)));
      for (let j = 0; j < hgt; j++) {
        const k2 = j / hgt;
        f.set(sx + dx, bottom - j, k2 < 0.4 ? [255, 230, 120] : k2 < 0.75 ? [255, 140, 20] : [220, 40, 10]);
      }
    }
  }
  // smoke after it's out
  const smoke = seg(p, 0.55, 0.62) * (1 - seg(p, 0.8, 0.92));
  if (smoke > 0) for (let n = 0; n < 10; n++) {
    const q = ((lt / 1400) + rnd(n)) % 1;
    f.set(Math.round(sx + 2 + rnd(n + 3) * 4 + Math.sin(q * 6 + n) * 2), Math.round(bottom - 4 - q * 18), [150, 150, 155].map(v => v * (1 - q) * smoke));
  }
  // sooty toe for a bit afterwards
  if (p > 0.58 && p < 0.9) f.rect(sx + 2, bottom - 2, 6, 3, [45, 40, 38]);
  // the elf: runs in with a bucket, splashes it up, gives a thumbs up, runs back out
  const stand = sx - 6, from = -10;
  let ex;
  if (p < 0.15) return;
  if (p < 0.38) ex = from + ease((p - 0.15) / 0.23) * (stand - from);
  else if (p < 0.82) ex = stand;
  else ex = stand + ease((p - 0.82) / 0.18) * (from - stand);
  ex = Math.round(ex);
  const running = p < 0.38 || p > 0.82;
  const hop = p > 0.62 && p < 0.82 && Math.floor(lt / 220) % 2 ? 2 : 0;   // happy hops once it's out
  const ey = 45 - hop;
  f.sprite(ELF[running ? Math.floor(lt / 110) % 2 : 0], ex, ey, ELF_P);
  if (p < 0.38 || (p >= 0.38 && p < 0.42)) {
    f.rect(ex + 7, ey + 8, 3, 3, BUCKET[0]); f.rect(ex + 7, ey + 8, 3, 1, [80, 150, 255]);  // full bucket
  } else if (p < 0.6) {
    f.rect(ex + 7, ey + 6, 3, 3, BUCKET[1]);                                             // tipped up
    for (let n = 0; n < 18; n++) {                                                        // the splash
      const q = ((lt / 500) + n / 18) % 1;
      const wx = ex + 8 + (sx + 4 - ex - 8) * q + (rnd(n) - 0.5) * 3, wy = ey + 6 + (bottom - ey - 6) * q - Math.sin(q * Math.PI) * 6;
      f.set(Math.round(wx), Math.round(wy), [90, 170, 255]);
    }
  } else {
    f.rect(ex + 7, ey + 8, 3, 3, BUCKET[1]);
  }
}


// ---------- Christmas morning: the family opens the presents ----------
// Once all seven presents are under the tree, the whole family walks in and lines up,
// each one gets their present (youngest first), tears it open, celebrates, and everyone walks off.
export const PEOPLE = [   // height, hair color, long hair — same order as FAMILY (Sam, Emily, Max, Theo, Junie, Louie, Josie)
  { h: 19, hair: [150, 150, 155] },               // Sam: gray
  { h: 17, hair: [105, 65, 30], long: true },     // Emily: brown
  { h: 16, hair: [160, 115, 65] },                // Max: lighter brown
  { h: 14, hair: [160, 115, 65] },                // Theo: lighter brown
  { h: 12, hair: [235, 140, 80], long: true },    // Junie: strawberry blonde
  { h: 11, hair: [160, 115, 65] },                // Louie: lighter brown
  { h: 10, hair: [250, 215, 110], long: true },   // Josie: blonde
];
const SKIN = [255, 205, 170], PANTS = [50, 60, 110], SHOE = [35, 25, 20];
const TOYS = [[255, 60, 60], [80, 200, 255], [255, 220, 60], [140, 255, 120], [230, 120, 255], [255, 255, 255], [255, 150, 40]];
const LINE_X = j => 10 + j * 13;
const FAM_DUR = 40000;

// A little person, feet on y = 62. step: 0/1 walking frame; up: arms raised.
export function person(f, x, y, who, shirt, step, up) {
  const head = who.h > 12 ? 4 : 3, body = Math.round((who.h - head - 2) * 0.5), legs = who.h - head - 2 - body;
  let yy = y - who.h + 1;
  f.rect(x + 1, yy, 4, 1, who.hair); yy++;                                   // hair
  f.rect(x + 1, yy, 4, head, SKIN);
  f.set(x + 2, yy + 1, [30, 20, 20]); f.set(x + 4, yy + 1, [30, 20, 20]);     // eyes
  if (who.long) { f.rect(x, yy, 1, head + 1, who.hair); f.rect(x + 5, yy, 1, head + 1, who.hair); }
  const sy = yy + head;
  f.rect(x + 1, sy, 4, body, shirt);                                         // shirt
  if (up) { f.rect(x, sy - 3, 1, 3, shirt); f.rect(x + 5, sy - 3, 1, 3, shirt); f.set(x, sy - 4, SKIN); f.set(x + 5, sy - 4, SKIN); }
  else { f.rect(x, sy, 1, body, shirt); f.rect(x + 5, sy, 1, body, shirt); f.set(x, sy + body, SKIN); f.set(x + 5, sy + body, SKIN); }
  const ly = sy + body, a = step ? 1 : 0;
  f.rect(x + 1 - a, ly, 2, legs, PANTS); f.rect(x + 3 + a, ly, 2, legs, PANTS);  // legs
  f.rect(x + 1 - a, ly + legs, 2, 1, SHOE); f.rect(x + 3 + a, ly + legs, 2, 1, SHOE);
}

function familyOpen(f, lt, p, k, fam, pileList) {
  const walkIn = ease(seg(p, 0, 0.15)), walkOut = ease(seg(p, 0.82, 1));
  const order = [6, 5, 4, 3, 2, 1, 0];                                       // youngest first
  const T0 = 0.16, TW = 0.64 / 7;
  // presents still waiting under the tree
  pileList.forEach((s, slot) => {
    const turn = order.indexOf(s);
    if ((p - T0 - turn * TW) / TW < 0) present(f, SLOTS[slot][0], SLOTS[slot][1], fam[s] || FAMILY[s]);
  });
  for (let j = 0; j < 7; j++) {
    const who = PEOPLE[j], m = fam[j] || FAMILY[j], turn = order.indexOf(j);
    const u = (p - T0 - turn * TW) / TW;                                     // this person's turn, 0..1
    const walking = p < 0.15 || p > 0.82;
    let x = LINE_X(j) - 112 * (1 - walkIn) + 140 * walkOut;
    const hop = u > 0.55 && u < 1.6 && Math.floor(lt / 200 + j) % 2 ? 2 : 0;
    const y = 62 - hop;
    const cheer = u > 0.55 && p < 0.82;
    person(f, Math.round(x), y, who, m.color, walking ? Math.floor(lt / 170 + j) % 2 : 0, cheer);
    const cx = Math.round(x), chest = y - who.h + (who.h > 12 ? 9 : 7);
    const slot = pileList.indexOf(j);
    if (slot >= 0 && u >= 0 && u < 0.55) {
      // the present hops over from the tree into their hands, then shakes before it gets torn open
      const q = ease(seg(u, 0, 0.35)), [sx, sy] = SLOTS[slot];
      const gx = sx + (cx + 1 - sx) * q, gy = sy + (chest - sy) * q - Math.sin(q * Math.PI) * 10;
      const shake = u > 0.35 ? Math.round(Math.sin(lt / 40)) : 0;
      present(f, Math.round(gx) + shake, Math.round(gy), m);
    }
    if (slot >= 0 && u >= 0.55 && u < 1.5) {
      // wrapping paper flies everywhere
      const b = (u - 0.55) / 0.95, lum = m.color[0] * 0.3 + m.color[1] * 0.59 + m.color[2] * 0.11;
      const rib = lum > 150 ? [210, 30, 40] : [255, 215, 60];
      for (let n = 0; n < 12; n++) {
        const ang = rnd(n + j * 17) * Math.PI * 2, sp = 6 + rnd(n * 3 + j) * 10;
        const px = cx + 3 + Math.cos(ang) * sp * b, py = chest + Math.sin(ang) * sp * b * 0.7 + b * b * 10;
        f.set(Math.round(px), Math.round(py), (n % 3 ? m.color : rib).map(v => v * (1 - b * 0.7)));
      }
    }
    if (slot >= 0 && u >= 0.55) {
      // what they got, held up high (and carried off when they leave)
      const toy = TOYS[(j + Math.floor(k / 2)) % TOYS.length], top = y - who.h - 3;
      f.rect(cx + 2, top, 2, 2, toy);
    }
  }
  if (p > 0.2 && p < 0.8) f.center('MERRY CHRISTMAS', 34, [255, 255, 255].map(v => v * (0.75 + 0.25 * Math.sin(lt / 250))));
}

const SCENES = [[dogNap, 22000], [santaVisit, 24000], [marshmallow, 14000], [cocoa, 16000], [candyCane, 9000], [sparks, 4000], [stockingFire, 18000]];
const EVERY = 60000, START = 20000;

// Which stocking gets the candy cane: like drawing names from a hat. Every 7 visits, each of the 7 stockings
// gets exactly one cane in a shuffled order, and a new round never starts with the stocking that just got one.
function santaPick(k) {
  const v = Math.floor(k / 2);                     // Santa comes on every other scene
  const order = r => { const o = [0, 1, 2, 3, 4, 5, 6].sort((a, b) => rnd(r * 11 + a * 2.7) - rnd(r * 11 + b * 2.7)); return o; };
  const round = Math.floor(v / 7), o = order(round);
  if (round > 0 && o[0] === order(round - 1)[6]) o.push(o.shift());
  return o[v % 7];
}

function activeScene(t, data) {
  const kick = data.kick;
  if (kick && t - kick.t >= 0) {
    const sc = SCENES[kick.n % SCENES.length];
    if (t - kick.t < sc[1]) return { sc, lt: t - kick.t, k: kick.n, kicked: true };
  }
  const c = Math.floor((t - START) / EVERY);
  if (c < 0) return null;
  // Santa comes every other scene (about every 2 minutes, starting 20 seconds in);
  // the other chill scenes take turns in between, shuffled so each plays before any repeats.
  let sc;
  if (c % 2 === 1 && ((c + 1) / 2) % 7 === 0) sc = [familyOpen, FAM_DUR];   // all 7 presents are out: Christmas morning
  else if (c % 2 === 0) sc = SCENES[1];
  else {
    const others = SCENES.filter((_, i) => i !== 1), m = others.length, j = (c - 1) / 2, round = Math.floor(j / m);
    const order = others.map((_, i) => i).sort((a, b) => rnd(round * 7 + a * 3.3) - rnd(round * 7 + b * 3.3));
    sc = others[order[j % m]];
  }
  const off = t - START - c * EVERY;
  return off < sc[1] ? { sc, lt: off, k: c } : null;
}

// The presents already under the tree from Santa's timed visits this round (not counting a visit in progress).
// When all seven have one, the family comes in the next minute and opens them, and the next round starts fresh.
function pile(t, scene) {
  const c = Math.floor((t - START) / EVERY);
  if (c < 0) return { list: [], fade: 1 };
  const inVisit = c % 2 === 0;                       // Santa's minute (his visit sits in the first 24s)
  const done = inVisit ? c / 2 : (c + 1) / 2;        // visits finished (the current one counts once it's over)
  const visitOver = inVisit && !(scene && scene.sc[0] === santaVisit && !scene.kicked);
  const n = done + (visitOver ? 1 : 0);
  const start = 7 * Math.floor((inVisit && !visitOver ? done : n - 1) / 7);
  const list = [];
  for (let v = start; v < n; v++) list.push(santaPick(v * 2));
  const off = t - START - c * EVERY;
  if (list.length === 7 && !inVisit && off >= FAM_DUR) return { list: [], fade: 1 };   // opened and carried off
  return { list, fade: 1 };
}

export function drawFireplace(f, st, data, t, now) {
  const scene = activeScene(t, data);
  const flare = scene && scene.sc[0] === sparks ? 1 - scene.lt / 4000 : 0;
  const fire = sim(f, t, flare);
  const glow = 0.75 + 0.12 * Math.sin(t / 230) + 0.08 * Math.sin(t / 97);
  // Brick surround, lit by the fire.
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (inOpening(x, y)) continue;
    const row = Math.floor(y / 4), off = row % 2 ? 4 : 0;
    const mortar = y % 4 === 3 || (x + off) % 9 === 8;
    const d = Math.hypot((x - 64) / 64, (y - 44) / 36);
    const lit = (0.45 + 0.55 * clamp(1 - d)) * glow;
    const v = rnd(Math.floor((x + off) / 9) * 31 + row * 7) * 0.25 + 0.75;
    f.set(x, y, mortar ? [40 * lit, 30 * lit, 26 * lit] : [120 * v * lit, 42 * v * lit, 30 * v * lit]);
  }
  // Fire + logs.
  const h = fire.heat;
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    if (!inOpening(OX + x, OY + y)) continue;
    const v = h[y * FW + x];
    f.set(OX + x, OY + y, v ? PAL[v] : [8, 4, 2]);
  }
  const logC = [90, 50, 25];
  f.rect(OX + 14, OY + FH - 6, 48, 3, logC); f.rect(OX + 20, OY + FH - 4, 38, 3, [110, 60, 30]);
  for (let i = 0; i < 14; i++) if (rnd(i + Math.floor(t / 300)) > 0.6) f.set(OX + 16 + rnd(i) * 44, OY + FH - 5 + (i % 3), [255, 120, 20]);
  // Hearth.
  for (let x = 0; x < W; x++) for (let y = 58; y < H; y++) f.set(x, y, (x % 16 === 0 || y === 58) ? [55, 55, 60] : [85, 85, 92].map(v => v * glow * 1.05));
  // Mantel + garland with twinkling lights.
  f.rect(8, 8, 112, 5, [105, 65, 35]); f.rect(8, 12, 112, 1, [70, 40, 20]);
  for (let x = 10; x < 118; x++) f.set(x, 7 + Math.round(Math.sin(x / 5) * 0.8), [30, 110, 45]);
  const bulbs = [[255, 60, 60], [255, 210, 60], [80, 160, 255], [80, 230, 120]];
  for (let i = 0; i < 18; i++) if (Math.floor(t / 700 + rnd(i) * 5) % 3) f.set(12 + i * 6, 7 + Math.round(Math.sin((12 + i * 6) / 5) * 0.8), bulbs[i % 4]);
  // Candles at each end.
  for (const cx of [11, 115]) {
    f.rect(cx, 3, 2, 5, [240, 235, 220]);
    f.set(cx, 2 - (Math.floor(t / 180 + cx) % 2), [255, 200, 60]);
  }
  // Christmas tree with the presents Santa has left so far.
  const fam = st.fireplace?.stockings || FAMILY;
  tree(f, t);
  const presents = pile(t, scene);
  if (!(scene && scene.sc[0] === familyOpen)) presents.list.forEach((s, j) => present(f, SLOTS[j][0], SLOTS[j][1], fam[s] || FAMILY[s], presents.fade));
  // Stockings: mom, dad and the five kids.
  fam.slice(0, 7).forEach((m, i) => {
    const jig = scene && scene.sc[0] === candyCane && scene.k % STOCK_X.length === i && scene.lt < 2500 ? Math.round(Math.sin(scene.lt / 60)) : 0;
    stocking(f, STOCK_X[i] + jig, 13, m);
  });
  // Rising embers.
  for (let i = 0; i < 6; i++) {
    const q = ((t / 2600) + rnd(i)) % 1;
    f.set(OX + 20 + rnd(i + 2) * 36 + Math.sin(q * 6 + i) * 2, OY + FH - 8 - q * 26, [255, 150, 40].map(v => v * (1 - q)));
  }
  if (scene) scene.sc[0](f, scene.lt, scene.lt / scene.sc[1], scene.k, fam, presents.list);
  if (st.fireplace?.clock) {
    let hh = now.getHours() % 12 || 12;
    f.center(`${hh}:${String(now.getMinutes()).padStart(2, '0')}`, 0, [255, 220, 170]);
  }
}
