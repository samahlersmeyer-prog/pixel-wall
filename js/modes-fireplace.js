// Cozy fireplace: brick surround, crackling fire, stockings, twinkling garland.
// About once a minute something gentle happens (the dog naps by the fire,
// a marshmallow gets toasted, a mug of cocoa steams, a candy cane peeks out
// of a stocking, or a log pops and sends up sparks).
import { W, H } from './renderer.js?v=6';

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

const STOCKING = ['WWWWWW.', 'WWWWWW.', '.CCCCC.', '.CCCCC.', '.CCCCC.', '.CCCCC.', '.CCCCCC', '.CCCCCCC', '..CCCCCC', '...CCCC.'];
const DOG = [
  ['..........BB..', '.........BBBB.', '........BBBKBn', 'BBBBBBBBBBBB..', 'BBBBBBBBBBB...', 'tBBBBBBBBBB...', '.B..B....B..B.', '.B..B....B..B.'],
  ['..........BB..', '.........BBBB.', '........BBBKBn', 'BBBBBBBBBBBB..', 'BBBBBBBBBBB...', 'tBBBBBBBBBB...', '..B..B..B..B..', '..B..B..B..B..'],
];
const DOG_NAP = ['...........BB..', '..........BBBB.', 'BBBBBBBBBBBBBBn', 'BBBBBBBBBBBBBB.', 'tBBBBBBBBBBBB..'];
const DOG_P = { B: [150, 100, 60], K: [20, 20, 20], n: [20, 20, 20], t: [150, 100, 60] };

// ---------- gentle scenes ----------
function dogNap(f, lt, p) {
  const walkIn = seg(p, 0, 0.2), walkOut = seg(p, 0.82, 1);
  const y = 55;
  if (p < 0.2) f.sprite(DOG[Math.floor(lt / 160) % 2], Math.round(-14 + walkIn * 60), y, DOG_P);
  else if (p < 0.82) {
    f.sprite(DOG_NAP, 46, 58, DOG_P);
    for (let i = 0; i < 3; i++) {
      const q = ((lt / 1600) + i / 3) % 1;
      f.text('z', 62 + q * 8 + i, Math.round(52 - q * 14), [190, 210, 255].map(v => v * (1 - q * 0.8)));
    }
  } else f.sprite(DOG[Math.floor(lt / 160) % 2], Math.round(46 + walkOut * 90), y, DOG_P);
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
  const x = 106, y = 55;
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
  const sx = [36, 61, 86][k % 3] + 3, top = 13 - Math.round(rise * 7);
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

const SCENES = [[dogNap, 22000], [marshmallow, 14000], [cocoa, 16000], [candyCane, 9000], [sparks, 4000]];
const EVERY = 60000, START = 20000;

function activeScene(t, data) {
  const kick = data.kick;
  if (kick && t - kick.t >= 0) {
    const sc = SCENES[kick.n % SCENES.length];
    if (t - kick.t < sc[1]) return { sc, lt: t - kick.t, k: kick.n };
  }
  const c = Math.floor((t - START) / EVERY);
  if (c < 0) return null;
  const n = SCENES.length, round = Math.floor(c / n);
  const order = SCENES.map((_, i) => i).sort((a, b) => rnd(round * 7 + a * 3.3) - rnd(round * 7 + b * 3.3));
  const sc = SCENES[order[c % n]];
  const off = t - START - c * EVERY;
  return off < sc[1] ? { sc, lt: off, k: c } : null;
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
  // Stockings.
  const sc = [[200, 30, 40], [30, 140, 60], [40, 90, 200]];
  [36, 61, 86].forEach((x, i) => {
    const jig = scene && scene.sc[0] === candyCane && scene.k % 3 === i && scene.lt < 2500 ? Math.round(Math.sin(scene.lt / 60)) : 0;
    f.sprite(STOCKING, x + jig, 13, { W: [240, 240, 240], C: sc[i] });
  });
  // Rising embers.
  for (let i = 0; i < 6; i++) {
    const q = ((t / 2600) + rnd(i)) % 1;
    f.set(OX + 20 + rnd(i + 2) * 36 + Math.sin(q * 6 + i) * 2, OY + FH - 8 - q * 26, [255, 150, 40].map(v => v * (1 - q)));
  }
  if (scene) scene.sc[0](f, scene.lt, scene.lt / scene.sc[1], scene.k);
  if (st.fireplace?.clock) {
    let hh = now.getHours() % 12 || 12;
    f.center(`${hh}:${String(now.getMinutes()).padStart(2, '0')}`, 0, [255, 220, 170]);
  }
}
