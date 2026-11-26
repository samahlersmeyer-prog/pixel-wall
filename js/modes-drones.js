// Christmas drone show: 300 lit drones lift off a launch pad and fly through 14 Christmas formations, then land.
// Stateless: every drone's spot is worked out from t, so the TV, the phone preview and the panels stay in sync.
import { W, H, Frame } from './renderer.js?v=47';
import { glyph, advance } from './font.js?v=47';

const N = 400;
const FLY = 2600, HOLD = 5200, STEP = FLY + HOLD;
const GOLD = [255, 190, 40], GREEN = [30, 200, 70], DKGREEN = [20, 130, 45], RED = [255, 40, 40], WHITE = [255, 255, 255];
const ICE = [120, 200, 255], BROWN = [150, 85, 30], SKIN = [255, 200, 160], BLUE = [70, 120, 255];

function rnd(n) { const x = Math.sin(n * 91.345 + 3.7) * 43758.5453; return x - Math.floor(x); }

// Filled 5-point star (inner radius ~40% of outer).
function star(f, cx, cy, R, c) {
  for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
    const a = Math.atan2(y - cy, x - cx) + Math.PI / 2, s = ((a / (Math.PI * 2 / 5)) % 1 + 1) % 1;
    if (Math.hypot(x - cx, y - cy) <= R * (0.4 + 0.6 * Math.abs(s - 0.5) * 2)) f.set(x, y, c);
  }
}

// ---------- formations (drawn with the normal Frame tools, then turned into drone spots) ----------
const FORMS = {
  tree(f) {
    for (let y = 12; y <= 50; y++) {
      const hw = y < 25 ? (y - 12) * 0.9 : y < 38 ? (y - 21) * 1.05 : (y - 32) * 1.2;
      f.rect(Math.round(64 - hw), y, Math.round(hw * 2) + 1, 1, GREEN);
    }
    f.rect(60, 51, 9, 6, BROWN);
    const orn = [RED, GOLD, BLUE, WHITE];
    for (let k = 0; k < 16; k++) {
      const y = 16 + rnd(k) * 32, hw = (y < 25 ? (y - 12) * 0.9 : y < 38 ? (y - 21) * 1.05 : (y - 32) * 1.2) * 0.75;
      f.disc(64 + (rnd(k + 40) * 2 - 1) * hw, y, 1, orn[k % 4]);
    }
    star(f, 64, 7, 6, GOLD);
  },
  bethlehem(f) {
    for (let y = 2; y <= 42; y++) for (let x = 44; x <= 84; x++) {   // 4-point star
      const dx = Math.abs(x - 64), dy = Math.abs(y - 22);
      if (Math.sqrt(dx / 20) + Math.sqrt(dy / 20) <= 1) f.set(x, y, GOLD);
    }
    for (let k = 0; k < 4; k++) f.line(64, 22, 64 + [1, -1, 1, -1][k] * 13, 22 + [1, 1, -1, -1][k] * 13, GOLD);
    f.line(64, 42, 64, 62, GOLD); f.line(63, 42, 60, 62, [200, 150, 30]); f.line(65, 42, 68, 62, [200, 150, 30]);   // the tail pointing down to Bethlehem
    f.disc(64, 22, 3, WHITE);
  },
  snowflake(f) {
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3, ex = 64 + Math.cos(a) * 27, ey = 32 + Math.sin(a) * 27;
      f.line(64, 32, ex, ey, ICE);
      for (const at of [0.45, 0.72]) {
        const bx = 64 + Math.cos(a) * 27 * at, by = 32 + Math.sin(a) * 27 * at, L = at < 0.5 ? 8 : 6;
        for (const s of [-1, 1]) f.line(bx, by, bx + Math.cos(a + s * 0.8) * L, by + Math.sin(a + s * 0.8) * L, ICE);
      }
    }
    f.disc(64, 32, 3, WHITE);
  },
  snowman(f) {
    for (const [y, r] of [[50, 12], [32, 9], [17, 7]]) f.disc(64, y, r, WHITE);
    const HAT = [120, 120, 160];
    f.rect(54, 10, 21, 2, HAT); f.rect(57, 1, 15, 9, HAT); f.rect(57, 7, 15, 2, RED);
    f.rect(52, 23, 25, 3, RED); f.rect(68, 23, 4, 10, RED);   // scarf
    f.line(64, 18, 72, 19, [255, 140, 30]); f.set(65, 19, [255, 140, 30]);   // carrot
    for (const [x, y] of [[61, 15], [67, 15], [59, 20], [61, 21], [64, 22], [67, 21], [69, 20], [64, 29], [64, 34], [64, 45], [64, 51]]) f.set(x, y, [0, 0, 0]);   // coal (gaps)
    for (const s of [-1, 1]) { f.line(64 + s * 9, 31, 64 + s * 25, 22, BROWN); f.line(64 + s * 21, 24, 64 + s * 24, 18, BROWN); }
  },
  sleigh(f) {
    const TAN = [210, 160, 90];
    // drawn facing left, then mirrored so the reindeer lead the sleigh to the right
    for (const x of [22, 48]) {   // two reindeer
      for (let y = 28; y <= 40; y++) for (let dx = -9; dx <= 9; dx++) if ((dx / 9) ** 2 + ((y - 34) / 4.5) ** 2 <= 1) f.set(x + dx, y, BROWN);
      f.line(x - 7, 31, x - 11, 24, BROWN); f.line(x - 8, 32, x - 12, 25, BROWN);
      f.disc(x - 12, 23, 2.5, BROWN);
      f.line(x - 11, 21, x - 8, 13, TAN); f.line(x - 9, 17, x - 5, 15, TAN); f.line(x - 13, 21, x - 15, 13, TAN); f.line(x - 14, 17, x - 18, 15, TAN);   // antlers
      for (const [lx, d] of [[6, 3], [3, -2], [-4, 2], [-7, -3]]) f.line(x + lx, 38, x + lx + d, 46, BROWN);   // galloping legs
    }
    f.line(31, 33, 40, 33, GOLD); f.line(57, 33, 74, 36, GOLD);   // harness
    for (let y = 30; y <= 44; y++) { const x0 = 72 + Math.max(0, 36 - y) * 0.5; f.rect(Math.round(x0), y, Math.round(112 - x0), 1, RED); }
    f.line(70, 48, 114, 48, GOLD); f.line(70, 48, 66, 44, GOLD); f.line(80, 44, 80, 48, GOLD); f.line(104, 44, 104, 48, GOLD);   // runners
    f.disc(105, 22, 7, [170, 110, 50]);   // the toy sack
    f.rect(86, 20, 12, 10, RED); f.disc(92, 15, 3, SKIN); f.rect(89, 17, 7, 4, WHITE);   // Santa riding
    for (let y = 7; y <= 12; y++) f.rect(92 - (y - 7) * 0.6, y, (y - 7) * 1.2 + 1, 1, RED);
    f.rect(88, 12, 9, 1, WHITE); f.disc(90, 6, 1.2, WHITE);
    for (let y = 0; y < H; y++) for (let x = 0; x < W / 2; x++) {
      const a = (y * W + x) * 3, b = (y * W + W - 1 - x) * 3;
      for (let j = 0; j < 3; j++) [f.buf[a + j], f.buf[b + j]] = [f.buf[b + j], f.buf[a + j]];
    }
  },
  santa(f) {
    for (let y = 40; y <= 61; y++) { const hw = 14 + (y - 40) * 0.3; f.rect(Math.round(64 - hw), y, Math.round(hw * 2) + 1, 1, RED); }   // suit
    for (const s of [-1, 1]) { f.rect(64 + s * 22 - 3, 44, 7, 12, RED); f.rect(64 + s * 22 - 3, 56, 7, 2, WHITE); f.disc(64 + s * 22, 60, 2.5, [30, 160, 60]); }   // arms, cuffs, mittens
    f.rect(46, 52, 37, 3, [0, 0, 0]); f.rect(60, 51, 9, 5, GOLD); f.rect(62, 52, 5, 3, [0, 0, 0]);   // belt + buckle
    for (let y = 26; y <= 46; y++) for (let x = 46; x <= 82; x++) if (((x - 64) / 16) ** 2 + ((y - 30) / 16) ** 2 <= 1 && y >= 26) f.set(x, y, WHITE);   // beard
    for (let y = 18; y <= 29; y++) for (let x = 52; x <= 76; x++) if (((x - 64) / 11) ** 2 + ((y - 23) / 6) ** 2 <= 1) f.set(x, y, SKIN);   // face
    f.set(60, 21, [0, 0, 0]); f.set(68, 21, [0, 0, 0]); f.disc(56, 25, 1.2, [255, 120, 120]); f.disc(72, 25, 1.2, [255, 120, 120]);
    f.disc(64, 25, 1.5, [255, 150, 130]); f.rect(56, 27, 17, 2, WHITE);   // nose + mustache
    for (let y = 4; y <= 15; y++) { const hw = (y - 4) * 1.25, cx = 64 + (15 - y) * 0.8; f.rect(Math.round(cx - hw), y, Math.round(hw * 2) + 1, 1, RED); }   // hat
    f.rect(48, 15, 33, 4, WHITE); f.disc(75, 4, 2.5, WHITE);
  },
  cane(f) {
    const pts = [];
    for (let a = Math.PI; a >= 0; a -= 0.05) pts.push([68 + Math.cos(a) * 10, 17 - Math.sin(a) * 10]);
    for (let y = 17; y <= 24; y++) pts.push([78, y]);
    pts.reverse();
    for (let y = 17; y <= 58; y++) pts.push([58, y]);
    let len = 0;
    pts.forEach(([x, y], i) => {
      if (i) len += Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]);
      f.disc(x, y, 2.2, Math.floor(len / 5) % 2 ? WHITE : RED);
    });
  },
  wreath(f) {
    for (let y = 4; y <= 60; y++) for (let x = 34; x <= 94; x++) {
      const d = Math.hypot(x - 64, y - 32);
      if (d >= 17 && d <= 27) f.set(x, y, rnd(x * 7 + y) < 0.5 ? GREEN : DKGREEN);
    }
    for (let k = 0; k < 10; k++) { const a = k * 0.63 + 0.3; f.disc(64 + Math.cos(a) * 22, 32 + Math.sin(a) * 22, 1.2, RED); }
    for (let y = 48; y <= 62; y++) for (let x = 48; x <= 80; x++) {   // the bow
      const dx = Math.abs(x - 64), dy = y - 54;
      if ((dx <= 13 && Math.abs(dy) <= dx * 0.55 + 1 && dy < 5) || (dx <= 2 && Math.abs(dy) <= 2)) f.set(x, y, RED);
    }
    f.line(62, 56, 56, 63, RED); f.line(66, 56, 72, 63, RED);
  },
  bells(f) {
    for (const cx of [46, 82]) {
      for (let dy = 0; dy <= 22; dy++) {
        const hw = 4 + 9 * (dy / 22) ** 2 + (dy >= 20 ? 2 : 0);
        f.rect(Math.round(cx - hw), 22 + dy, Math.round(hw * 2) + 1, 1, GOLD);
      }
      f.disc(cx, 21, 4, GOLD);
      f.disc(cx, 47, 2.5, [255, 230, 120]);
      f.line(cx, 17, 64, 10, RED);
    }
    for (let k = 0; k < 3; k++) f.disc(60 + k * 4, 8, 2, k === 1 ? RED : DKGREEN);   // holly on top
  },
  gift(f) {
    for (const [x, y, w, h] of [[40, 28, 49, 32], [36, 21, 57, 8]]) {   // box and lid as outlines
      f.rect(x, y, w, 1, RED); f.rect(x, y + h - 1, w, 1, RED); f.rect(x, y, 1, h, RED); f.rect(x + w - 1, y, 1, h, RED);
    }
    for (let y = 32; y < 58; y += 4) for (let x = 44; x < 86; x += 4) if (Math.abs(x - 64) > 4 && Math.abs(y - 40) > 3) f.set(x + (y % 8 ? 2 : 0), y, [255, 120, 140]);   // dots on the paper
    f.rect(62, 21, 5, 39, GOLD); f.rect(36, 39, 57, 4, GOLD);
    for (const s of [-1, 1]) for (let y = 8; y <= 21; y++) for (let x = 0; x <= 16; x++) {   // bow loops
      const d = Math.hypot((x - 8) / 8, (y - 14) / 6);
      if (d <= 1 && d >= 0.45) f.set(64 + s * (x + 2), y, GOLD);
    }
    f.disc(64, 18, 2.5, GOLD);
  },
  angel(f) {
    for (let y = 10; y <= 48; y++) for (let x = 18; x <= 110; x++) {   // wings
      const dx = Math.abs(x - 64);
      const e = ((dx - 24) / 22) ** 2 + ((y - 28) / 14) ** 2;
      if (dx > 5 && e <= 1 && y < 28 + (dx - 6) * 0.9 && (e > 0.7 || (y + dx) % 5 === 0)) f.set(x, y, [170, 200, 255]);   // wing edge + feathers
    }
    for (let y = 21; y <= 58; y++) { const hw = 3 + (y - 21) * 0.42; if (y < 23) continue; f.rect(Math.round(64 - hw), y, Math.round(hw * 2) + 1, 1, WHITE); }
    f.disc(64, 15, 4.5, SKIN);
    for (let a = 0; a < Math.PI * 2; a += 0.15) f.set(64 + Math.cos(a) * 7, 7 + Math.sin(a) * 2, GOLD);   // halo
  },
  manger(f) {
    star(f, 64, 7, 5, GOLD);
    for (const dx of [-6, 0, 6]) f.line(64, 13, 64 + dx * 1.8, 35, [140, 110, 40]);   // the light coming down
    f.line(46, 62, 58, 48, BROWN); f.line(58, 62, 46, 48, BROWN);
    f.line(70, 62, 82, 48, BROWN); f.line(82, 62, 70, 48, BROWN);
    for (let y = 44; y <= 52; y++) { const hw = 22 - (y - 44) * 0.9; f.rect(Math.round(64 - hw), y, Math.round(hw * 2) + 1, 1, BROWN); }
    for (let x = 42; x <= 86; x += 2) f.line(x, 44, x + (rnd(x) * 4 - 2), 41, [230, 190, 60]);   // hay
    for (let y = 35; y <= 43; y++) for (let x = 52; x <= 76; x++) if (((x - 64) / 12) ** 2 + ((y - 39) / 4) ** 2 <= 1) f.set(x, y, WHITE);   // swaddled baby
    f.disc(53, 37, 3, SKIN);
    for (let a = 0; a < Math.PI * 2; a += 0.25) f.set(53 + Math.cos(a) * 5, 37 + Math.sin(a) * 5, GOLD);   // halo
  },
};

// Text is made from the 5x7 font with drones 2 pixels apart, like a real show's lettering.
function textPts(lines) {
  const pts = [];
  for (const [str, y, colors] of lines) {
    let w = -1; for (const ch of str) w += advance(ch);
    let x = Math.round((W - w * 2) / 2), idx = 0;
    for (const ch of str) {
      const g = glyph(ch);
      if (g) g.forEach((row, r) => { for (let c = 0; c < row.length; c++) if (row[c] === '#') pts.push({ x: x + c * 2, y: y + r * 2, c: colors[idx % colors.length] }); });
      x += advance(ch) * 2; if (ch !== ' ') idx++;
    }
  }
  return pts;
}

// Order = the show. Ground is the launch pad (drones resting, dim); sky is the finale before they land.
const SHOW = ['ground', 'tree', 'bethlehem', 'snowflake', 'snowman', 'cane', 'sleigh', 'santa', 'wreath', 'bells', 'gift', 'angel', 'manger', 'text', 'sky'];

// Space the spots on a grid so no two drones touch (row by row gives the even lattice real shows use),
// thin out evenly if there are more than N, then sort left-to-right so each drone mostly flies up/down.
function toDrones(pts, seed) {
  const taken = new Set();
  let out = [];
  for (const p of pts) {
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (taken.has((p.y + dy) * 1000 + p.x + dx)) { near = true; break; }
    if (!near) { out.push(p); taken.add(p.y * 1000 + p.x); }
  }
  if (out.length > N) out = out.map((p, i) => [rnd(seed * 1000 + i * 1.37), p]).sort((a, b) => a[0] - b[0]).slice(0, N).map(a => a[1]);
  for (let i = 0; out.length < N; i++) out.push(out[i]);   // spare drones double up (hidden) on a spot
  return out.sort((a, b) => a.x - b.x || a.y - b.y);
}

const cache = {};
function formation(name) {
  if (cache[name]) return cache[name];
  let pts;
  if (name === 'ground') pts = Array.from({ length: N }, (_, i) => ({ x: 1 + (i % 64) * 2, y: 50 + Math.floor(i / 64) * 2, c: [45, 45, 55] }));
  else if (name === 'sky') pts = Array.from({ length: N }, (_, i) => ({ x: Math.floor(rnd(i + 0.5) * W), y: 1 + Math.floor(rnd(i + 0.25) * 48), c: [WHITE, GOLD, ICE][i % 3] }));
  else if (name === 'text') pts = textPts([['MERRY', 13, [RED, GREEN]], ['CHRISTMAS', 35, [GREEN, RED]]]);
  else {
    const f = new Frame();
    FORMS[name](f);
    pts = [];
    for (let i = 0; i < W * H; i++) {
      const c = [f.buf[i * 3], f.buf[i * 3 + 1], f.buf[i * 3 + 2]];
      if (c[0] || c[1] || c[2]) pts.push({ x: i % W, y: Math.floor(i / W), c });
    }
  }
  pts.sort((a, b) => a.y - b.y || a.x - b.x);
  return (cache[name] = toDrones(pts, SHOW.indexOf(name) + 1));
}

// Where drone i sits in a formation, k seconds into the hold (the snowflake spins, the bells swing).
function spot(name, i, k) {
  const p = formation(name)[i];
  let { x, y } = p;
  if (name === 'snowflake') {
    const a = k * 0.35, dx = x - 64, dy = y - 32;
    x = 64 + dx * Math.cos(a) - dy * Math.sin(a); y = 32 + dx * Math.sin(a) + dy * Math.cos(a);
  } else if (name === 'bells' && y > 16) {
    const px = x < 64 ? 46 : 82, a = Math.sin(k * 2.6 + (x < 64 ? 0 : Math.PI)) * 0.3, dx = x - px, dy = y - 17;
    x = px + dx * Math.cos(a) - dy * Math.sin(a); y = 17 + dx * Math.sin(a) + dy * Math.cos(a);
  } else if (name === 'sleigh') y += Math.sin(k * 2.4 - x * 0.06) * 1.8;   // riding a wave across the sky
  return [x, y, p.c];
}

const ease = p => p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;

export function drawDrones(f, t) {
  t += FLY;   // open on the launch pad with the title up
  const seg = Math.floor(t / STEP), into = t - seg * STEP;
  const from = SHOW[(seg + SHOW.length - 1) % SHOW.length], to = SHOW[seg % SHOW.length];
  // faint background stars
  for (let k = 0; k < 40; k++) {
    const b = 25 + 20 * Math.sin(t / 700 + k * 2.1);
    f.set(rnd(k + 900) * W, rnd(k + 950) * 50, [b, b, b + 15]);
  }
  for (let i = 0; i < N; i++) {
    let x, y, c, b = 1;
    if (into < FLY) {
      const [x0, y0, c0] = spot(from, i, HOLD / 1000), [x1, y1, c1] = spot(to, i, 0);
      const delay = rnd(i + 7) * 0.25, p = ease(Math.min(1, Math.max(0, (into / FLY - delay) / 0.75)));
      x = x0 + (x1 - x0) * p;
      y = y0 + (y1 - y0) * p - Math.sin(Math.PI * p) * (2 + rnd(i + 3) * 6);   // a little swoop, like real drones
      c = c0.map((v, j) => v + (c1[j] - v) * p);
    } else {
      [x, y, c] = spot(to, i, (into - FLY) / 1000);
      b = to === 'sky' ? 0.45 + 0.55 * Math.abs(Math.sin(t / 400 + i * 1.7)) : 0.82 + 0.18 * Math.sin(t / 300 + i * 2.3);
    }
    f.set(x, y, c.map(v => v * b));
  }
  if (to === 'ground' && into > FLY) {   // between shows: title over the launch pad
    const k = Math.min(1, (into - FLY) / 800);
    f.center('CHRISTMAS', 14, GOLD.map(v => v * k));
    f.center('DRONE SHOW', 26, [255, 255, 255].map(v => v * k));
  }
}
