// U.S. map modes: weather heat map, state capitals quiz, places we've been.
import { MAP_W, MAP_H, MAP_GRID, STATES } from './usmap-data.js?v=20';
import { hsv } from './renderer.js?v=20';

const X0 = 0, Y0 = 0, COL = 92; // map at left, info column at right
const cell = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) ? -1 : (MAP_GRID.charCodeAt(y * MAP_W + x) === 46 ? -1 : MAP_GRID.charCodeAt(y * MAP_W + x) - 48);

// Paint every state with colorOf(index); state borders are drawn darker.
function paintMap(f, colorOf) {
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const s = cell(x, y);
    if (s < 0) continue;
    const c = colorOf(s);
    if (!c) continue;
    const edge = cell(x + 1, y) !== s || cell(x, y + 1) !== s;
    f.set(X0 + x, Y0 + y, edge ? c.map(v => v * 0.45) : c);
  }
}

function tempColor(t) {
  // 0°F blue -> 45°F green -> 90°F+ red
  const k = Math.max(0, Math.min(1, t / 95));
  return hsv((1 - k) * 0.66, 0.95, 0.95);
}

function drawWeather(f, data) {
  const temps = data.mapWeather;
  if (!temps) { paintMap(f, () => [60, 60, 70]); f.text('LOADING', COL - 2, 26, [150, 150, 150]); return; }
  paintMap(f, s => temps[s] == null ? [50, 50, 50] : tempColor(temps[s]));
  let hot = -1, cold = -1;
  temps.forEach((t, i) => {
    if (t == null || STATES[i].abbr === 'HI' || STATES[i].abbr === 'AK') return;
    if (hot < 0 || t > temps[hot]) hot = i;
    if (cold < 0 || t < temps[cold]) cold = i;
  });
  const IN = STATES.findIndex(s => s.abbr === 'IN');
  const w = [255, 255, 255];
  f.text('TEMPS', COL, 2, [255, 200, 80]);
  f.text('HOT', COL, 14, [255, 90, 60]);
  f.text(`${STATES[hot].abbr} ${Math.round(temps[hot])}°`, COL, 22, w);
  f.text('COLD', COL, 33, [90, 170, 255]);
  f.text(`${STATES[cold].abbr} ${Math.round(temps[cold])}°`, COL, 41, w);
  if (IN >= 0 && temps[IN] != null) f.text(`IN ${Math.round(temps[IN])}°`, COL, 55, [120, 255, 140]);
}

function rnd(n) { const x = Math.sin(n * 91.7) * 43758.5453; return x - Math.floor(x); }

function drawQuiz(f, t) {
  const round = Math.floor(t / 9000);
  const phase = t % 9000;
  const pool = STATES.filter(s => s.abbr !== 'DC');
  const st = pool[Math.floor(rnd(round + 7) * pool.length)];
  const idx = STATES.indexOf(st);
  const blink = Math.floor(t / 350) % 2 === 0;
  paintMap(f, s => s === idx ? (blink || phase > 5000 ? [255, 230, 60] : [255, 120, 0]) : [40, 70, 120]);
  if (phase < 5000) {
    f.text('WHAT', COL, 10, [255, 255, 255]);
    f.text('STATE', COL, 20, [255, 255, 255]);
    f.text('IS', COL, 30, [255, 255, 255]);
    f.text('THIS?', COL, 40, [255, 230, 60]);
    const left = Math.ceil((5000 - phase) / 1000);
    f.text(String(left), COL + 14, 52, [255, 120, 0], 1);
  } else {
    f.text(st.abbr, COL + 4, 8, [255, 230, 60], 2);
    f.center(phase < 7000 ? st.name : `CAP: ${st.capital}`, 57, [255, 255, 255]);
  }
}

function drawVisited(f, st, t) {
  const set = new Set((st.visited || []).map(s => s.toUpperCase()));
  paintMap(f, s => set.has(STATES[s].abbr) ? hsv((s * 0.13 + t / 20000) % 1, 0.8, 1) : [45, 45, 55]);
  const n = STATES.filter(s => s.abbr !== 'DC' && set.has(s.abbr)).length;
  f.text('BEEN', COL, 4, [255, 200, 80]);
  f.text('TO', COL, 12, [255, 200, 80]);
  f.text(String(n), COL + (n < 10 ? 10 : 4), 24, [255, 255, 255], 2);
  f.text('OF 50', COL, 42, [180, 180, 180]);
  f.text('STATES', COL - 1, 51, [180, 180, 180]);
}

export function drawMap(f, st, data, t) {
  const view = st.map?.view || 'weather';
  if (view === 'quiz') drawQuiz(f, t);
  else if (view === 'visited') drawVisited(f, st, t);
  else drawWeather(f, data);
}
