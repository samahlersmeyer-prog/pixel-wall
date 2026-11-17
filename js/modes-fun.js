// Fun animations: Game of Life, fireworks, Pong, Matrix rain, warp speed, plasma.
import { hsv, W, H } from './renderer.js?v=4';
import { fireworks } from './modes-holiday.js?v=4';

function sim(f, key, init) {
  f.sim = f.sim || {};
  if (!f.sim[key]) f.sim[key] = init();
  return f.sim[key];
}

function life(f, t) {
  const s = sim(f, 'life', () => ({ g: null, age: null, last: 0, gen: 0, seen: [] }));
  const seed = () => {
    s.g = new Uint8Array(W * H).map(() => Math.random() < 0.28 ? 1 : 0);
    s.age = new Uint16Array(W * H); s.gen = 0; s.seen = [];
  };
  if (!s.g) seed();
  if (t - s.last > 110) {
    s.last = t;
    const n = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (dx || dy) c += s.g[((y + dy + H) % H) * W + ((x + dx + W) % W)];
      }
      const i = y * W + x, alive = s.g[i];
      n[i] = (alive && (c === 2 || c === 3)) || (!alive && c === 3) ? 1 : 0;
      s.age[i] = n[i] ? (alive ? s.age[i] + 1 : 0) : 0;
    }
    s.g = n; s.gen++;
    const pop = n.reduce((a, b) => a + b, 0);
    s.seen.push(pop); if (s.seen.length > 30) s.seen.shift();
    const stuck = s.seen.length === 30 && Math.max(...s.seen) - Math.min(...s.seen) < 4;
    if (pop < 40 || stuck || s.gen > 900) seed();
  }
  for (let i = 0; i < W * H; i++) if (s.g[i]) f.set(i % W, Math.floor(i / W), hsv((0.55 + s.age[i] * 0.02) % 1, 0.9, 1));
}

function pong(f, t) {
  const s = sim(f, 'pong', () => ({ bx: W / 2, by: H / 2, vx: 55, vy: 30, l: H / 2, r: H / 2, sl: 0, sr: 0, last: t }));
  const dt = Math.min(0.05, (t - s.last) / 1000); s.last = t;
  s.bx += s.vx * dt; s.by += s.vy * dt;
  if (s.by < 1 || s.by > H - 2) { s.vy *= -1; s.by = Math.max(1, Math.min(H - 2, s.by)); }
  // Paddles chase the ball with a little lag, so somebody eventually misses.
  const track = (p, aim) => p + Math.max(-38 * dt, Math.min(38 * dt, aim - p));
  s.l = track(s.l, s.vx < 0 ? s.by : H / 2);
  s.r = track(s.r, s.vx > 0 ? s.by : H / 2);
  const hit = p => Math.abs(s.by - p) <= 6;
  if (s.bx < 4 && s.vx < 0) { if (hit(s.l)) { s.vx = Math.abs(s.vx) * 1.04; s.vy += (s.by - s.l) * 4; } else if (s.bx < 0) { s.sr++; Object.assign(s, { bx: W / 2, by: H / 2, vx: 55, vy: (Math.random() - 0.5) * 60 }); } }
  if (s.bx > W - 5 && s.vx > 0) { if (hit(s.r)) { s.vx = -Math.abs(s.vx) * 1.04; s.vy += (s.by - s.r) * 4; } else if (s.bx > W) { s.sl++; Object.assign(s, { bx: W / 2, by: H / 2, vx: -55, vy: (Math.random() - 0.5) * 60 }); } }
  s.vx = Math.sign(s.vx) * Math.min(120, Math.abs(s.vx));
  s.vy = Math.max(-70, Math.min(70, s.vy));
  for (let y = 0; y < H; y += 4) f.rect(W / 2, y, 1, 2, [60, 60, 60]);
  f.text(String(s.sl % 100), W / 2 - 16, 2, [120, 120, 120], 2);
  f.text(String(s.sr % 100), W / 2 + 6, 2, [120, 120, 120], 2);
  f.rect(1, Math.round(s.l - 5), 2, 11, [80, 200, 255]);
  f.rect(W - 3, Math.round(s.r - 5), 2, 11, [255, 120, 80]);
  f.rect(Math.round(s.bx), Math.round(s.by), 2, 2, [255, 255, 255]);
}

function rnd(n) { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); }

function matrix(f, t) {
  for (let x = 0; x < W; x += 2) {
    const speed = 12 + rnd(x) * 22, len = 8 + Math.floor(rnd(x + 1) * 18);
    const head = ((t / 1000) * speed + rnd(x + 2) * 200) % (H + len * 2);
    for (let k = 0; k < len; k++) {
      const y = Math.floor(head - k);
      if (y < 0 || y >= H) continue;
      const flick = rnd(x * 7 + y + Math.floor(t / 120)) > 0.15;
      if (!flick) continue;
      f.set(x, y, k === 0 ? [200, 255, 200] : [0, 255 * (1 - k / len), 60 * (1 - k / len)]);
    }
  }
}

function warp(f, t) {
  for (let i = 0; i < 140; i++) {
    const a = rnd(i) * Math.PI * 2, sp = 0.35 + rnd(i + 0.5) * 0.65;
    const z = ((t / 1000) * sp + rnd(i + 0.9)) % 1;
    const d = z * z * 80;
    const x = W / 2 + Math.cos(a) * d * 1.6, y = H / 2 + Math.sin(a) * d;
    const b = Math.min(255, 60 + z * 255);
    f.set(x, y, [b, b, 255]);
    if (z > 0.6) f.set(x - Math.cos(a) * 1.6, y - Math.sin(a), [b * 0.5, b * 0.5, 160]);
  }
}

function plasma(f, t) {
  const k = t / 1000;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = Math.sin(x / 9 + k) + Math.sin(y / 7 - k * 1.3) + Math.sin((x + y) / 13 + k * 0.7) + Math.sin(Math.hypot(x - 64, y - 32) / 8 - k * 2);
    f.set(x, y, hsv((v / 8 + 0.5 + k * 0.05) % 1, 0.85, 0.75));
  }
}

export const FUN = [['life', 'Game of Life'], ['fireworks', 'Fireworks'], ['pong', 'Pong'], ['matrix', 'Matrix Rain'], ['warp', 'Warp Speed'], ['plasma', 'Lava Lamp']];

export function drawFun(f, st, t) {
  const v = st.fun?.view || 'life';
  if (v === 'pong') pong(f, t);
  else if (v === 'fireworks') fireworks(f, t, null, 420, H);
  else if (v === 'matrix') matrix(f, t);
  else if (v === 'warp') warp(f, t);
  else if (v === 'plasma') plasma(f, t);
  else life(f, t);
}
