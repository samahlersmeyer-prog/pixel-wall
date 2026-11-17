// Shared renderer: turns the wall's state + live data into a 128x64 RGB frame.
// The TV simulator, the phone preview and (later) the LED board all use this,
// so what you see on the TV is exactly what the panels will show.
import { glyph, advance, GLYPH_W, GLYPH_H } from './font.js';

export const W = 128;
export const H = 64;

export function hex(c) {
  if (Array.isArray(c)) return c;
  const s = String(c || '#ffffff').replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map(x => x + x).join('') : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function hsv(h, s = 1, v = 1) {
  const i = Math.floor(h * 6), f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const [r, g, b] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][((i % 6) + 6) % 6];
  return [r * 255, g * 255, b * 255];
}

// Make dark team colors readable on a black LED screen.
export function brighten(c, min = 140) {
  const [r, g, b] = hex(c);
  const m = Math.max(r, g, b);
  if (m >= min) return [r, g, b];
  if (m === 0) return [min, min, min];
  const k = min / m;
  return [r * k, g * k, b * k].map(v => Math.min(255, v));
}

export class Frame {
  constructor() { this.buf = new Uint8ClampedArray(W * H * 3); }
  clear(c = [0, 0, 0]) { for (let i = 0; i < W * H; i++) this.buf.set(c, i * 3); }
  set(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.buf[i] = c[0]; this.buf[i + 1] = c[1]; this.buf[i + 2] = c[2];
  }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  textWidth(str, scale = 1) {
    let w = 0;
    for (const ch of String(str)) w += advance(ch) * scale;
    return Math.max(0, w - scale);
  }
  // color may be a function (index) => rgb for per-letter effects
  text(str, x, y, color, scale = 1) {
    let cx = x, idx = 0;
    for (const ch of String(str)) {
      const g = glyph(ch);
      const c = typeof color === 'function' ? color(idx) : hex(color);
      if (g) {
        for (let row = 0; row < GLYPH_H; row++) {
          for (let col = 0; col < GLYPH_W; col++) {
            if (g[row][col] === '#') this.rect(cx + col * scale, y + row * scale, scale, scale, c);
          }
        }
      }
      cx += advance(ch) * scale; idx++;
    }
    return cx;
  }
  center(str, y, color, scale = 1, x0 = 0, x1 = W) {
    const w = this.textWidth(str, scale);
    this.text(str, Math.round(x0 + (x1 - x0 - w) / 2), y, color, scale);
  }
}

// Word-wrap text into lines that fit `maxW` pixels at `scale`.
function wrap(f, text, scale, maxW) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? line + ' ' + word : word;
      if (f.textWidth(test, scale) <= maxW) line = test;
      else { if (line) lines.push(line); line = word; }
    }
    lines.push(line);
  }
  return lines;
}

// ---------- modes ----------

function drawMessage(f, st, t) {
  const m = st.message || {};
  const text = (m.text || 'HELLO MAX').toUpperCase();
  const base = hex(m.color || '#ffffff');
  const rainbow = m.anim === 'rainbow';
  const color = rainbow ? i => hsv(((t / 3000) + i * 0.06) % 1) : base;

  if (m.anim === 'scroll') {
    const scale = 3;
    const w = f.textWidth(text, scale);
    const speed = 40; // px per second
    const span = w + W;
    const x = W - ((t / 1000 * speed) % span);
    f.text(text, Math.round(x), Math.round((H - GLYPH_H * scale) / 2), color, scale);
    return;
  }
  // static (or rainbow): biggest size that fits
  for (const scale of [3, 2, 1]) {
    const lines = wrap(f, text, scale, W - 4);
    const lineH = GLYPH_H * scale + scale * 2;
    const total = lines.length * lineH - scale * 2;
    if (total <= H - 4 && lines.every(l => f.textWidth(l, scale) <= W - 4)) {
      let y = Math.round((H - total) / 2);
      let offset = 0;
      for (const l of lines) {
        const c = rainbow ? (i => hsv(((t / 3000) + (i + offset) * 0.06) % 1)) : base;
        f.center(l, y, c, scale);
        y += lineH; offset += l.length;
      }
      return;
    }
  }
  f.center('TOO LONG', 28, base, 1);
}

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function drawClock(f, st, data, now) {
  let h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const time = `${h}:${String(m).padStart(2, '0')}`;
  const white = [255, 255, 255];
  const accent = hex(st.clockColor || '#3fa9f5');
  const scale = 3;
  const tw = f.textWidth(time, scale);
  const aw = f.textWidth(ampm, 1);
  const x = Math.round((W - tw - aw - 4) / 2);
  f.text(time, x, 6, white, scale);
  f.text(ampm, x + tw + 4, 6 + 21 - 7, accent, 1);
  f.center(`${DAYS[now.getDay()]} ${MONTHS[now.getMonth()]} ${now.getDate()}`, 34, accent, 1);
  const w = data.weather;
  if (w) f.center(`${Math.round(w.temp)}° ${w.label}`, 48, [255, 200, 80], 1);
}

function drawScoreboard(f, st, data, t) {
  const g = data.game;
  const sb = st.scoreboard || {};
  if (!g) {
    f.center((sb.label || 'SCORES').toUpperCase(), 20, [255, 255, 255], 2);
    f.center('LOADING...', 44, [150, 150, 150], 1);
    return;
  }
  if (g.kind === 'error') {
    f.center((sb.label || 'SCORES').toUpperCase(), 20, [255, 255, 255], 2);
    f.center('NO SCORE DATA', 44, [255, 90, 90], 1);
    return;
  }
  if (g.kind === 'next') {
    const c = brighten(g.team.color);
    f.rect(0, 0, W, 3, c);
    f.center(g.team.abbr, 9, c, 3);
    f.center('NEXT GAME', 36, [180, 180, 180], 1);
    f.center(g.line.slice(0, 21), 48, [255, 255, 255], 1);
    return;
  }
  const rows = [g.away, g.home];
  const ys = [5, 26];
  const final = g.state === 'post';
  rows.forEach((tm, i) => {
    const y = ys[i];
    const c = brighten(tm.color);
    const lost = final && tm.score < rows[1 - i].score;
    const txt = lost ? [110, 110, 110] : [255, 255, 255];
    f.rect(0, y, 4, 14, c);
    f.text(tm.abbr.slice(0, 4), 9, y, lost ? txt : c, 2);
    if (g.state !== 'pre') {
      const s = String(tm.score);
      f.text(s, W - 3 - f.textWidth(s, 2), y, txt, 2);
    }
  });
  const live = g.state === 'in';
  const stc = live ? [255, 210, 60] : final ? [200, 200, 200] : [120, 200, 255];
  f.center(g.status.toUpperCase().slice(0, 21), 49, stc, 1);
  if (live && Math.floor(t / 600) % 2 === 0) f.rect(W - 4, H - 4, 2, 2, [255, 40, 40]);
}

// Simple seeded randomness so snow looks the same on every screen.
function rnd(n) { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }

function drawTree(f, x, y, t, seed) {
  const green = [20, 140, 50];
  for (let row = 0; row < 14; row++) {
    const half = Math.floor(row / 2) + 1;
    f.rect(x - half, y + row, half * 2 + 1, 1, green);
  }
  f.rect(x - 1, y + 14, 3, 3, [110, 60, 20]);
  f.set(x, y - 1, [255, 220, 0]);
  const colors = [[255, 40, 40], [255, 200, 0], [60, 160, 255], [255, 255, 255]];
  for (let k = 0; k < 7; k++) {
    const row = 2 + Math.floor(rnd(seed + k) * 11);
    const half = Math.floor(row / 2);
    const dx = Math.round((rnd(seed + k * 3.3) * 2 - 1) * half);
    if (Math.floor(t / 400 + k) % 3 !== 0) f.set(x + dx, y + row, colors[k % 4]);
  }
}

function drawChristmas(f, st, data, t, now) {
  for (let i = 0; i < 70; i++) {
    const speed = 6 + rnd(i) * 10;
    const x = (rnd(i + 0.5) * W + Math.sin(t / 1500 + i) * 2 + W) % W;
    const y = (rnd(i + 0.7) * H + (t / 1000) * speed) % H;
    const b = 90 + rnd(i + 0.9) * 120;
    f.set(x, y, [b, b, b]);
  }
  f.center('MERRY', 3, [235, 40, 40], 2);
  f.center('CHRISTMAS', 21, [40, 200, 80], 2);
  drawTree(f, 8, 45, t, 1);
  drawTree(f, W - 9, 45, t, 2);
  const y = now.getFullYear();
  let xmas = new Date(y, 11, 25);
  const today = new Date(y, now.getMonth(), now.getDate());
  if (today > xmas) xmas = new Date(y + 1, 11, 25);
  const days = Math.round((xmas - today) / 864e5);
  const line = days === 0 ? 'JOY TO THE WORLD' : days === 1 ? '1 DAY TO GO' : `${days} DAYS TO GO`;
  f.center(line, 50, [255, 215, 80], 1);
}

export function render(state = {}, data = {}, t = 0, now = new Date(), frame = new Frame()) {
  frame.clear();
  const mode = state.mode || 'message';
  if (mode === 'clock') drawClock(frame, state, data, now);
  else if (mode === 'scoreboard') drawScoreboard(frame, state, data, t);
  else if (mode === 'christmas') drawChristmas(frame, state, data, t, now);
  else drawMessage(frame, state, t);
  return frame;
}
