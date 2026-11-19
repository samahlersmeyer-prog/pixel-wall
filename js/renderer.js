// Shared renderer: turns the wall's state + live data into a 128x64 RGB frame.
// The TV simulator, the phone preview and (later) the LED board all use this,
// so what you see on the TV is exactly what the panels will show.
import { glyph, advance, GLYPH_W, GLYPH_H } from './font.js?v=32';
import { drawMap } from './modes-map.js?v=32';
import { drawCfp, drawCalendar, drawCountdown, drawForecast } from './modes-info.js?v=32';
import { drawHoliday } from './modes-holiday.js?v=32';
import { drawFun } from './modes-fun.js?v=32';

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
  // rows: array of strings; palette maps characters to colors; '.' is transparent
  sprite(rows, x, y, palette, scale = 1) {
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = palette[r[i]]; if (c) this.rect(x + i * scale, y + j * scale, scale, scale, c); } });
  }
  disc(cx, cy, r, c) {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.5) this.set(x, y, c);
    }
  }
  line(x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
  }
  // Light that adds to what's underneath (glows, rays, sparkles).
  add(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.buf[i] += c[0]; this.buf[i + 1] += c[1]; this.buf[i + 2] += c[2];
  }
  lineAdd(x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.add(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
  }
  discAdd(cx, cy, r, c) {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.5) this.add(x, y, c);
    }
  }
  dim(k) { for (let i = 0; i < this.buf.length; i++) this.buf[i] *= k; }
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

export const ROTATE_DEFAULT = ['clock', 'weather', 'scoreboard', 'holiday', 'calendar'];

// Which mode is on screen right now (rotate cycles through a list).
export function activeMode(state = {}, t = 0) {
  if (state.mode !== 'rotate') return state.mode || 'message';
  const list = (state.rotate?.modes || []).filter(m => m !== 'rotate');
  const modes = list.length ? list : ROTATE_DEFAULT;
  const secs = state.rotate?.seconds || 20;
  return modes[Math.floor(t / (secs * 1000)) % modes.length];
}

export function render(state = {}, data = {}, t = 0, now = new Date(), frame = new Frame()) {
  frame.clear();
  const mode = activeMode(state, t);
  if (mode === 'clock') drawClock(frame, state, data, now);
  else if (mode === 'scoreboard') drawScoreboard(frame, state, data, t);
  else if (mode === 'christmas') drawHoliday(frame, { ...state, holiday: { theme: 'christmas' } }, data, t, now);
  else if (mode === 'holiday') drawHoliday(frame, state, data, t, now);
  else if (mode === 'map') drawMap(frame, state, data, t);
  else if (mode === 'cfp') drawCfp(frame, state, data, t);
  else if (mode === 'calendar') drawCalendar(frame, state, now);
  else if (mode === 'countdown') drawCountdown(frame, state, now, t);
  else if (mode === 'fun') drawFun(frame, state, t);
  else if (mode === 'weather') drawForecast(frame, state, data);
  else if (mode === 'fireplace') drawHoliday(frame, { ...state, holiday: { ...(state.holiday || {}), theme: 'fireplace' } }, data, t, now);
  else if (mode === 'coop') drawHoliday(frame, { ...state, holiday: { ...(state.holiday || {}), theme: 'coop' } }, data, t, now);
  else drawMessage(frame, state, t);
  return frame;
}
