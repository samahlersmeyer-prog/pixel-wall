// Backyard Coop: the family's 17 hens (4 white, 3 black, 5 black-and-white, 4 orange, 1 light yellow)
// in the yard by the tan shed coop, with the wire run on the left and the gray barn and flag on the right.
// By default it's always a sunny afternoon with the hens out. With the "real sunrise/sunset" setting it runs on real Fort Wayne time: the hens come out a few minutes after sunrise, wander and peck all day,
// and file back in before sunset; at night the doors are shut under the moon and stars.
// Seasons change the trees and ground (fall leaves, winter snow).
// About every 45 seconds something happens: an egg gets laid, the yellow hen chases a bug, two hens fight
// over a worm, the dogs trot through and scatter everybody, Junie brings out feed, or a hen takes a dust bath.
import { W, H } from './renderer.js?v=35';
import { DOG, DOG_P, BLACK, BLACK_P, PEOPLE, FAMILY, person } from './modes-fireplace.js?v=35';

const rnd = n => { const x = Math.sin(n * 57.913) * 43758.5453; return x - Math.floor(x); };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const ease = p => p * p * (3 - 2 * p);
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const LAT = 41.08, LON = -85.14;   // Fort Wayne

// Sunrise / sunset in local minutes after midnight (NOAA approximation).
function sunTimes(now) {
  const start = new Date(now.getFullYear(), 0, 0), N = Math.floor((now - start) / 864e5);
  const g = 2 * Math.PI / 365 * (N - 1);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const lat = LAT * Math.PI / 180;
  const ha = Math.acos(Math.cos(90.833 * Math.PI / 180) / (Math.cos(lat) * Math.cos(dec)) - Math.tan(lat) * Math.tan(dec)) * 180 / Math.PI;
  const tz = -now.getTimezoneOffset();
  return { rise: 720 - 4 * (LON + ha) - eq + tz, set: 720 - 4 * (LON - ha) - eq + tz };
}

// ---------- the flock ----------
const WHITE = [240, 240, 232], BLACKC = [28, 28, 34], ORANGE = [215, 125, 45], YELLOW = [245, 222, 140];
const FLOCK = [
  ...Array(4).fill('white'), ...Array(3).fill('black'), ...Array(5).fill('barred'), ...Array(4).fill('orange'), 'yellow',
];
const HEN = {
  stand: ['....r.', '...HHb', 'T..HH.', 'TBBBB.', '.l.l..'],
  walk:  ['....r.', '...HHb', 'T..HH.', 'TBBBB.', 'l...l.'],
  peck:  ['......', 'T.....', 'TBBBr.', 'TBBBHb', '.l.l..'],
  flap:  ['.W..r.', 'WW.HHb', 'TWWHH.', 'TBBBB.', '.l.l..'],
};
function henPal(kind, light) {
  const L = c => c.map(v => v * light);
  const body = { white: WHITE, black: BLACKC, barred: [70, 70, 75], orange: ORANGE, yellow: YELLOW }[kind];
  const head = kind === 'barred' ? [200, 200, 200] : body;
  return { B: L(body), H: L(head), T: L(kind === 'orange' ? [120, 80, 50] : kind === 'barred' ? [40, 40, 45] : body),
    W: L(kind === 'black' ? [70, 70, 80] : [255, 255, 255]), r: L([220, 30, 30]), b: L([240, 170, 40]), l: L([230, 160, 40]) };
}
function hen(f, x, y, kind, frame, left, light) {
  const rows = HEN[frame].map(r => left ? [...r].reverse().join('') : r);
  const pal = henPal(kind, light);
  f.sprite(rows, Math.round(x) - 3, Math.round(y) - 4, pal);
  if (kind === 'barred') {   // black-and-white bars across the body
    const ry = frame === 'peck' ? [2, 3] : [3];
    for (const r of ry) for (let c = 0; c < 6; c++) if (rows[r][c] === 'B' && (c + r) % 2) f.set(Math.round(x) - 3 + c, Math.round(y) - 4 + r, WHITE.map(v => v * light * 0.9));
  }
}

// Home spot for each hen: five scratch around inside the run, the rest roam the yard.
const RUN_X0 = 18, RUN_X1 = 57;
function home(i) {
  if (i % 4 === 1 && i < 18) return { x: 24 + rnd(i * 7) * 28, y: 38 + Math.floor(rnd(i * 3) * 3), run: true };
  return { x: 6 + rnd(i * 5 + 1) * 116, y: 47 + Math.floor(rnd(i * 11 + 2) * 15), run: false };
}
const DOOR = { x: 70, y: 43 };

// ---------- scenery ----------
function season(now) { const m = now.getMonth(); return m === 11 || m <= 1 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'fall'; }

function sky(f, m, sun, t) {
  const day = clamp((m - sun.rise + 25) / 50) * clamp((sun.set + 25 - m) / 50);
  const twi = Math.max(1 - Math.abs(m - sun.rise) / 40, 1 - Math.abs(m - sun.set) / 40, 0);
  for (let y = 0; y < 34; y++) {
    const k = y / 34;
    let c = mix(mix([10, 14, 45], [22, 30, 75], k), mix([70, 140, 240], [150, 200, 255], k), day);
    c = mix(c, [255, 140, 70], twi * k * 0.7);
    f.rect(0, y, W, 1, c);
  }
  if (day < 0.5) for (let i = 0; i < 40; i++) {
    const tw = 0.5 + 0.5 * Math.sin(t / 700 + i * 2.1);
    f.set(Math.floor(rnd(i) * W), Math.floor(rnd(i + 50) * 22), [220, 220, 255].map(v => v * tw * (1 - day * 2)));
  }
  // sun or moon arcs across the sky
  if (day > 0) {
    const q = clamp((m - sun.rise) / (sun.set - sun.rise));
    const sx = 6 + q * 116, sy = 26 - Math.sin(q * Math.PI) * 22;
    f.disc(sx, sy, 3, [255, 235, 140]);
  } else {
    const night = (m < sun.rise ? m + 1440 : m) - sun.set, len = 1440 - (sun.set - sun.rise);
    const q = clamp(night / len), mx = 6 + q * 116, my = 26 - Math.sin(q * Math.PI) * 20;
    f.disc(mx, my, 3, [235, 235, 210]); f.disc(mx + 1.5, my - 1, 2.4, mix([10, 14, 45], [22, 30, 75], my / 34));
  }
  // a few slow clouds in the daytime
  if (day > 0.3) for (let i = 0; i < 3; i++) {
    const cx = ((t / (900 + i * 300) + rnd(i) * W) % (W + 40)) - 20, cy = 4 + i * 5;
    const c = [245, 248, 255].map(v => v * (0.6 + 0.4 * day));
    f.disc(cx, cy, 3, c); f.disc(cx + 4, cy - 1, 3.5, c); f.disc(cx + 8, cy, 2.5, c); f.rect(Math.round(cx), Math.round(cy), 9, 2, c);
  }
  return day;
}

function treeLine(f, sea, light, t) {
  const pal = sea === 'fall' ? [[185, 95, 30], [215, 150, 45], [150, 55, 30], [95, 110, 45], [170, 120, 40]]
    : sea === 'spring' ? [[90, 170, 70], [120, 190, 80], [70, 140, 60]] : [[40, 110, 45], [55, 130, 50], [30, 90, 40], [50, 100, 40]];
  const trunk = [75, 60, 50].map(v => v * light);
  // a dark understory of brush, then round tree crowns on top
  for (let x = 0; x < W; x++) for (let y = 26 + Math.round(2 * Math.sin(x / 4)); y < 34; y++)
    f.set(x, y, (sea === 'winter' ? [60, 55, 50] : pal[Math.floor(rnd(x * 7 + y) * pal.length)]).map(v => v * light * 0.55));
  for (let i = 0; i < 16; i++) {
    const cx = i * 8.5 + rnd(i) * 6 - 2, cy = 13 + rnd(i + 20) * 7, r = 6 + rnd(i + 40) * 4;
    f.rect(Math.round(cx), Math.round(cy), 1, Math.round(34 - cy), trunk);
    if (sea === 'winter') {                          // bare winter branches
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + (rnd(i * 5 + k) - 0.5) * 2.2, len = r * (0.6 + rnd(i + k) * 0.5);
        const by = cy + 4 + k * 2;
        f.line(Math.round(cx), Math.round(by), Math.round(cx + Math.cos(a) * len), Math.round(by + Math.sin(a) * len), trunk);
      }
      continue;
    }
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const d = Math.hypot(dx, dy * 1.15);
      if (d > r - rnd((dx + 20) * 3 + dy) * 1.5) continue;
      const n = rnd(i * 97 + dx * 13 + dy * 7);
      const c = sea === 'fall' ? pal[Math.floor(rnd(i * 3) * 3 + n * 2) % pal.length] : pal[Math.floor(n * pal.length)];
      f.set(Math.round(cx + dx), Math.round(cy + dy), c.map(v => Math.min(255, v * 1.2) * light * (0.8 + 0.2 * (1 - (dy + r) / (2 * r)))));
    }
  }
}

function lawn(f, sea, light) {
  for (let y = 34; y < H; y++) for (let x = 0; x < W; x++) {
    const stripe = Math.floor(x / 16) % 2 ? 1 : 0.9;
    let c = sea === 'winter' ? [235, 240, 250] : sea === 'fall' ? [95, 175, 55] : [70, 200, 60];
    if (sea !== 'winter' && rnd(x * 13 + y * 3) > 0.92) c = c.map(v => v * 0.8);
    f.set(x, y, c.map(v => v * stripe * light));
  }
}

function run(f, light, front) {
  const wood = [150, 105, 60].map(v => v * light);
  if (!front) return;
  for (let y = 26; y < 41; y++) for (let x = RUN_X0 + 1; x < RUN_X1; x++) if (x % 3 === 0 || y % 3 === 0) f.set(x, y, [60, 60, 62].map(v => v * light));
  f.rect(RUN_X0, 25, RUN_X1 - RUN_X0 + 1, 1, wood); f.rect(RUN_X0, 41, RUN_X1 - RUN_X0 + 1, 1, wood); f.rect(RUN_X0, 33, RUN_X1 - RUN_X0 + 1, 1, wood);
  for (const x of [18, 28, 38, 47, 57]) f.rect(x, 25, 1, 17, wood);
  f.rect(37, 27, 1, 14, wood.map(v => v * 0.8));     // run door
}

function coop(f, light, open, sea) {
  const L = c => c.map(v => v * light);
  const tan = L([208, 188, 160]), trim = L([125, 118, 110]);
  // gable roof
  for (let y = 13; y <= 22; y++) {
    const hw = Math.round((y - 13) * 1.45);
    f.rect(71 - hw, y, hw * 2, 1, tan);
    f.set(71 - hw - 1, y, trim); f.set(71 + hw, y, trim);
  }
  if (sea === 'winter') for (let y = 13; y <= 22; y++) { const hw = Math.round((y - 13) * 1.45); f.set(71 - hw - 1, y - 1, L([245, 245, 255])); f.set(71 + hw, y - 1, L([245, 245, 255])); }
  f.rect(68, 16, 6, 3, L([240, 240, 235])); for (let x = 69; x < 73; x += 2) f.rect(x, 16, 1, 3, L([170, 170, 170]));  // vent
  f.rect(57, 22, 28, 1, trim);
  f.rect(58, 23, 26, 19, tan);
  f.rect(58, 42, 26, 1, L([90, 80, 65]));
  if (open) {
    f.rect(62, 25, 18, 17, L([38, 30, 22]));                                   // inside
    f.rect(66, 26, 8, 16, L([150, 110, 60])); f.rect(67, 27, 6, 14, L([60, 50, 40]));   // screen door
    f.line(67, 27, 72, 40, L([150, 110, 60])); f.line(72, 27, 67, 40, L([150, 110, 60]));
    f.rect(76, 30, 3, 6, L([235, 235, 230]));                                  // white cabinet
    for (const dx of [54, 80]) {                                               // the two big doors, swung open
      f.rect(dx, 24, 8, 18, L([196, 150, 95]));
      f.rect(dx + 1, 25, 6, 6, L([245, 245, 245])); f.rect(dx + 2, 26, 4, 4, L([150, 170, 195])); f.rect(dx + 2, 28, 4, 1, L([245, 245, 245]));
      f.rect(dx, 32, 8, 1, L([160, 115, 70]));
    }
  } else {
    for (const dx of [62, 71]) {                                               // doors shut for the night
      f.rect(dx, 24, 9, 18, L([196, 150, 95]));
      f.rect(dx + 2, 25, 5, 5, L([245, 245, 245])); f.rect(dx + 3, 26, 3, 3, L([60, 75, 110]));
    }
    f.rect(70, 24, 1, 18, L([120, 85, 50]));
  }
}

function path(f, light) {
  for (let i = 0; i < 26; i++) {
    const x = 46 + Math.floor(rnd(i * 3.3) * 46), y = 42 + Math.floor(rnd(i * 5.1) * 4);
    f.rect(x, y, 2 + Math.floor(rnd(i) * 2), 1 + (i % 2), [205, 195, 175].map(v => v * light * (0.85 + rnd(i + 9) * 0.15)));
  }
}

function barn(f, light, sea, t, day) {
  const L = c => c.map(v => v * light);
  // gambrel roof
  const roof = L([88, 90, 96]);
  f.rect(108, 18, 20, 2, roof); f.rect(105, 20, 23, 2, roof); f.rect(103, 22, 25, 2, roof);
  if (sea === 'winter') f.rect(108, 17, 20, 1, L([245, 245, 255]));
  f.rect(104, 24, 24, 18, L([112, 106, 100]));
  for (let x = 106; x < 128; x += 3) f.rect(x, 24, 1, 18, L([95, 90, 85]));
  f.rect(110, 29, 4, 3, L([235, 235, 235]));                     // little AC window
  f.rect(119, 29, 5, 13, L([30, 30, 40])); f.rect(120, 30, 3, 4, day > 0.3 ? L([150, 170, 195]) : [230, 190, 90]);   // door (light on at night)
  f.rect(104, 37, 13, 1, L([150, 120, 85])); for (let x = 105; x < 117; x += 2) f.rect(x, 38, 1, 4, L([150, 120, 85]));  // porch rail
  // flag pole + waving flag
  f.rect(101, 5, 1, 37, L([170, 170, 175]));
  for (let x = 0; x < 9; x++) for (let y = 0; y < 6; y++) {
    const wy = Math.round(Math.sin(t / 250 - x / 2) * (x / 9) * 1.2);
    const c = x < 4 && y < 3 ? (x + y) % 2 ? [40, 60, 160] : [230, 230, 240] : y % 2 ? [240, 240, 240] : [200, 30, 40];
    f.set(102 + x, 6 + y + wy, L(c));
  }
}

// ---------- happenings ----------
function eggLay(f, lt, p, ctx) {
  const h = ctx.yard[ctx.k % ctx.yard.length];
  if (!h) return;
  h.frame = 'stand'; h.x = h.hx; h.y = h.hy; h.freeze = true;
  if (p > 0.35 && p < 0.55) f.text('BAWK!', Math.round(h.x) - 12, Math.round(h.y) - 13, [255, 255, 255]);
  if (p > 0.45) { const ex = Math.round(h.x) + (h.left ? 3 : -5), ey = Math.round(h.y) - 1; f.rect(ex, ey, 2, 2, [235, 215, 180]); f.set(ex, ey - 1, [245, 230, 200]); }
  if (p > 0.55) f.center(`EGGS TODAY: ${ctx.eggs}`, 1, [255, 240, 200]);
}
function bugChase(f, lt, p, ctx) {
  const yh = ctx.hens[16];
  if (!yh || yh.inside) return;
  const bx = -4 + p * 150, by = 54 + Math.sin(lt / 160) * 3 - Math.abs(Math.sin(lt / 90)) * 2;
  const caught = p > 0.8;
  if (!caught) f.set(Math.round(bx), Math.round(by), [20, 20, 20]);
  yh.x = caught ? -4 + 0.8 * 150 - 8 : bx - 9; yh.y = 56; yh.left = false;
  yh.frame = caught ? (Math.floor(lt / 150) % 2 ? 'peck' : 'stand') : Math.floor(lt / 90) % 2 ? 'walk' : 'stand';
  if (caught) f.text('YUM!', Math.round(yh.x) - 6, Math.round(yh.y) - 14, [255, 230, 120]);
}
function wormTug(f, lt, p, ctx) {
  const a = ctx.yard[ctx.k % ctx.yard.length], b = ctx.yard[(ctx.k + 3) % ctx.yard.length];
  if (!a || !b || a === b) return;
  const snap = p > 0.75, pull = Math.sin(lt / 120) * 2;
  const gap = snap ? 14 + seg(p, 0.75, 0.85) * 8 : 12 + pull;
  a.x = 64 - gap / 2 - 3; b.x = 64 + gap / 2 + 3; a.y = b.y = 55; a.left = false; b.left = true;
  a.frame = b.frame = 'peck';
  const pink = [235, 120, 140];
  if (!snap) f.line(Math.round(a.x) + 3, 54, Math.round(b.x) - 3, 54 + Math.round(Math.sin(lt / 80)), pink);
  else { f.rect(Math.round(a.x) + 3, 54, 2, 1, pink); f.rect(Math.round(b.x) - 4, 54, 2, 1, pink); }
  if (p > 0.1 && p < 0.75) f.center('TUG OF WORM!', 1, [255, 255, 255]);
}
function dogsVisit(f, lt, p, ctx) {
  const dx = -40 + p * (W + 60), step = Math.floor(lt / 140) % 2;
  for (const h of ctx.hens) {                        // everybody nearby scatters, flapping
    if (h.inside || h.run) continue;
    const d = h.x - (dx + 8);
    if (Math.abs(d) < 22) { h.x += Math.sign(d || 1) * (22 - Math.abs(d)) * 0.7; h.y -= (22 - Math.abs(d)) * 0.15; h.frame = 'flap'; h.left = d < 0; }
  }
  ctx.after.push(() => {
    f.sprite(BLACK[1 - step], Math.round(dx - 18), 50, BLACK_P);
    f.sprite(DOG[step], Math.round(dx), 51, DOG_P);
    if (p > 0.2 && p < 0.8) f.center('BAWK BAWK!', 1, [255, 255, 255]);
  });
}
function feedTime(f, lt, p, ctx) {
  const junie = PEOPLE[4], shirt = FAMILY[4].color;
  let jx;
  if (p < 0.2) jx = 104 - ease(p / 0.2) * 24; else if (p < 0.75) jx = 80; else jx = 80 + ease((p - 0.75) / 0.25) * 52;
  const toss = p > 0.22 && p < 0.4;
  const feed = seg(p, 0.25, 0.4);
  for (let i = 0; i < 26 * feed; i++) {
    const fx = 56 + rnd(i * 3) * 34, fy = 47 + rnd(i * 7) * 12;
    if (p < 0.85) f.set(Math.round(fx), Math.round(fy), [230, 200, 90]);
  }
  const rush = ease(seg(p, 0.3, 0.45)) * (1 - ease(seg(p, 0.82, 1)));
  for (const h of ctx.hens) {
    if (h.inside || h.run) continue;
    const tx = 56 + rnd(h.i * 9) * 34, ty = 48 + rnd(h.i * 4) * 12;
    h.left = tx < h.x;
    h.x += (tx - h.x) * rush; h.y += (ty - h.y) * rush;
    if (rush > 0.9) h.frame = Math.floor(lt / 200 + h.i) % 2 ? 'peck' : 'stand';
    else if (rush > 0.05) h.frame = 'walk';
  }
  ctx.after.push(() => {
    person(f, Math.round(jx), 58, junie, shirt, (p < 0.2 || p > 0.75) ? Math.floor(lt / 170) % 2 : 0, toss);
    if (p > 0.22 && p < 0.5) f.center('HERE CHICK CHICK!', 1, [255, 230, 150]);
  });
}
function dustBath(f, lt, p, ctx) {
  const h = ctx.yard[(ctx.k * 5) % ctx.yard.length];
  if (!h) return;
  h.x = h.hx; h.y = h.hy; h.frame = Math.floor(lt / 160) % 2 ? 'flap' : 'peck';
  ctx.after.push(() => {
    for (let i = 0; i < 12; i++) {
      const q = ((lt / 700) + rnd(i)) % 1;
      f.set(Math.round(h.x - 4 + rnd(i + 2) * 8 + Math.sin(q * 5 + i) * 2), Math.round(h.y - q * 8), [170, 140, 100].map(v => v * (1 - q)));
    }
  });
}
function shootingStar(f, lt, p) {
  const x = 120 - p * 90, y = 3 + p * 14;
  for (let i = 0; i < 8; i++) f.set(Math.round(x + i * 2), Math.round(y - i * 0.6), [255, 255, 220].map(v => v * (1 - i / 8) * (1 - p)));
}
function owl(f, lt, p) {
  const blink = Math.floor(lt / 900) % 5 === 0;
  f.rect(12, 24, 5, 6, [110, 85, 60]); f.set(12, 23, [110, 85, 60]); f.set(16, 23, [110, 85, 60]);
  if (!blink) { f.set(13, 25, [255, 200, 40]); f.set(15, 25, [255, 200, 40]); }
  f.rect(8, 30, 14, 1, [70, 50, 35]);
  if (p > 0.3 && p < 0.7) f.text('HOOT', 20, 18, [200, 200, 230]);
}

const DAY_EVENTS = [[eggLay, 10000], [bugChase, 9000], [wormTug, 10000], [dogsVisit, 9000], [feedTime, 16000], [dustBath, 8000]];
const NIGHT_EVENTS = [[shootingStar, 2500], [owl, 9000]];
const EVERY = 45000, START = 15000;
const INTRO = 40, MORNING_OUT = 9;                        // morning opening: 40 s, first hen out at 9 s
const ORDER = [16, 2, 9, 5, 12, 0, 14, 7, 3, 10, 1, 15, 6, 11, 4, 13, 8];   // who comes out first (the yellow hen leads)

export function drawCoop(f, st, data, t, now) {
  const realM = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const sun = sunTimes(now), sea = season(now);
  // By default the hens are always out playing on a sunny afternoon; the "real sunrise/sunset"
  // setting makes the scene follow the actual time of day instead.
  // Every time the coop comes on screen (or Surprise picks "good morning") it opens with the morning:
  // the sun comes up, the doors open, and the hens hop out one at a time.
  f.sim = f.sim || {};
  const S = f.sim;
  if (S.coopLast === undefined || t - S.coopLast > 3000 || t < S.coopLast) S.coopStart = t;
  S.coopLast = t;
  const kick = data.kick;
  // "Let the chickens out!" from the phone: play the morning now and keep them out for an hour.
  const outNow = st.coop?.outNow, nowMs = now.getTime();
  if (outNow && nowMs - outNow < 3600e3 && S.coopOut !== outNow) { S.coopOut = outNow; S.coopStart = t - Math.max(0, nowMs - outNow); S.forceUntil = S.coopStart + 3600e3; }
  // Surprise: if they're shut in (real sunrise/sunset mode), it lets them out the same way;
  // otherwise one of its picks replays the morning.
  const shutIn = st.coop?.real && !(t < (S.forceUntil || 0)) && (realM < sun.rise + 4 || realM > sun.set - 20);
  if (kick && t >= kick.t && S.coopKick !== kick.n && (shutIn || kick.n % (DAY_EVENTS.length + 1) === DAY_EVENTS.length)) {
    S.coopKick = kick.n; S.coopStart = kick.t;
    if (shutIn) S.forceUntil = kick.t + 3600e3;
  }
  const real = st.coop?.real && !(t < (S.forceUntil || 0));
  const ms = (t - S.coopStart) / 1000;                     // seconds into the morning
  const intro = !real && ms < INTRO;
  const after = sun.rise + (sun.set - sun.rise) * 0.62;
  const m = real ? realM
    : ms < 10 ? sun.rise - 20 + ms * 4                        // dawn to sunrise
    : ms < INTRO ? sun.rise + 20 + (after - sun.rise - 20) * ease((ms - 10) / (INTRO - 10)) : after;
  const day = sky(f, m, sun, t);
  const light = 0.55 + 0.45 * day;                       // never goes too dark on the panels
  treeLine(f, sea, light, t);
  lawn(f, sea, light);
  // where every hen is: inside, walking out / in through the door, or at her spot (meandering)
  const hens = FLOCK.map((kind, i) => {
    const hm = home(i);
    let w = 1;                                           // 0 = at the door, 1 = at her spot
    if (intro) {                                         // morning: out the door one at a time
      const go = MORNING_OUT + ORDER.indexOf(i) * 1.5;
      if (ms < go) return { i, kind, inside: true };
      w = clamp((ms - go) / 2.5);
    } else if (real) {                          // real time: out just after sunrise, in before sunset
      const out0 = sun.rise + 4 + i * 0.1, in0 = sun.set - 20 + i * 0.1;
      if (m < out0 || m > in0 + 0.05) return { i, kind, inside: true };
      if (m < out0 + 0.05) w = (m - out0) / 0.05;
      else if (m > in0) w = 1 - (m - in0) / 0.05;
    }
    const goingIn = real && m > sun.rise + 60 && w < 1;
    const wan = Math.sin(t / (6500 + i * 700) + i * 1.7), dwan = Math.cos(t / (6500 + i * 700) + i * 1.7);
    const span = hm.run ? 4 : 8;
    let hx = hm.x + wan * span;
    if (hm.run) hx = clamp(hx, RUN_X0 + 3, RUN_X1 - 3);
    const x = DOOR.x + (hx - DOOR.x) * w, y = DOOR.y + (hm.y - DOOR.y) * w;
    const moving = w < 1 || Math.abs(dwan) > 0.35;
    const frame = moving ? (Math.floor(t / 180 + i) % 2 ? 'walk' : 'stand') : (Math.floor(t / 260 + i * 3) % 3 ? 'peck' : 'stand');
    const left = w < 1 ? (goingIn ? hx > DOOR.x : hx < DOOR.x) : dwan < 0;
    return { i, kind, x, y, hx, hy: hm.y, run: hm.run && w === 1, frame, left };
  });
  const out = hens.filter(h => !h.inside);
  const doorsOpen = out.length > 0 || (intro && ms > 7);
  // happenings
  const list = doorsOpen ? DAY_EVENTS : NIGHT_EVENTS;
  let ev = null, lt = 0, k = 0;
  const kn = doorsOpen && kick ? kick.n % (DAY_EVENTS.length + 1) : kick?.n;
  if (!intro && kick && S.coopKick !== kick.n && t - kick.t >= 0 && kn < list.length) { const e = list[kn % list.length]; if (t - kick.t < e[1]) { ev = e; lt = t - kick.t; k = kick.n; } }
  if (!ev && !intro) {
    const c = Math.floor((t - START) / EVERY);
    if (c >= 0) {
      const n = list.length, round = Math.floor(c / n);
      const order = list.map((_, i) => i).sort((a, b) => rnd(round * 7 + a * 3.3) - rnd(round * 7 + b * 3.3));
      const e = list[order[c % n]], off = t - START - c * EVERY;
      if (off < e[1]) { ev = e; lt = off; k = c; }
    }
  }
  const eggs = Math.round(13 * clamp((realM - sun.rise) / 360));
  const ctx = { hens, yard: out.filter(h => !h.run && h.i !== 16), k, eggs, after: [] };
  // background layers, then the run with its hens behind the wire, then the yard hens in depth order
  run(f, light, false);
  for (const h of out) if (h.run) hen(f, h.x, h.y, h.kind, h.frame, h.left, light);
  run(f, light, true);
  coop(f, light, doorsOpen, sea);
  path(f, light);
  barn(f, light, sea, t, day);
  if (ev) ev[0](f, lt, lt / ev[1], ctx);
  out.filter(h => !h.run).sort((a, b) => a.y - b.y).forEach(h => hen(f, h.x, h.y, h.kind, h.frame, h.left, light));
  ctx.after.forEach(fn => fn());
  // falling leaves in the fall, snow in the winter
  if (sea === 'fall') for (let i = 0; i < 6; i++) {
    const q = ((t / 7000) + rnd(i)) % 1;
    f.set(Math.round(rnd(i + 3) * W + Math.sin(q * 8 + i) * 4), Math.round(10 + q * 52), [[200, 110, 30], [180, 60, 30], [220, 170, 50]][i % 3].map(v => v * light));
  }
  if (sea === 'winter') for (let i = 0; i < 25; i++) {
    const q = ((t / 6000) + rnd(i)) % 1;
    f.set(Math.round(rnd(i + 3) * W + Math.sin(q * 6 + i) * 3), Math.round(q * H), [240, 240, 255].map(v => v * (0.5 + 0.5 * light)));
  }
  if (intro && ms > 6 && ms < 22) f.center('GOOD MORNING!', 1, [255, 230, 150]);
  if (!doorsOpen && day < 0.3 && !ev) {                 // sleepy z's from the coop
    for (let i = 0; i < 3; i++) {
      const q = ((t / 1800) + i / 3) % 1;
      f.text('z', 76 + q * 6 + i, Math.round(20 - q * 12), [190, 210, 255].map(v => v * (1 - q * 0.8)));
    }
  }
  if (st.coop?.clock) {
    const hh = now.getHours() % 12 || 12;
    f.center(`${hh}:${String(now.getMinutes()).padStart(2, '0')}`, 56, [255, 255, 255]);
  }
}
