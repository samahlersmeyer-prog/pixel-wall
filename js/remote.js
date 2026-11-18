// Run the wall from a game controller (or keyboard) plugged into the Pi / TV computer.
// Every change is written to the wall's state, so the phone controller stays in sync.
//
//   D-pad Left / Right (or arrow keys)  previous / next screen
//   D-pad Up / Down                     change the option on this screen (holiday, team, fun scene, map)
//   A (Enter)                           surprise scene (holidays) / next option
//   LB / RB  ( - / + )                  dimmer / brighter
//   Y (H)                               show / hide the button guide
//   Select + Start / Esc / Home         home menu
import { THEMES } from './modes-holiday.js?v=17';
import { TEAMS } from './data.js?v=17';
import { FUN } from './modes-fun.js?v=17';

const SCREENS = [
  ['clock', 'Clock'], ['weather', 'Weather'], ['scoreboard', 'Scores'], ['cfp', 'CFP'], ['calendar', 'Calendar'],
  ['countdown', 'Countdown'], ['map', 'Map'], ['holiday', 'Holidays'], ['fun', 'Fun'], ['message', 'Message'], ['rotate', 'Rotate'],
];
const MAPS = [['weather', 'Weather map'], ['quiz', 'State quiz'], ['visited', 'Been there']];
const HOLIDAYS = THEMES.filter(([k]) => k !== 'gameday');

export function startRemote({ getState, setState, toast }) {
  const st = () => getState() || {};
  const screenOf = m => m === 'christmas' || m === 'fireplace' ? 'holiday' : m;
  const step = (list, cur, d) => { const i = list.findIndex(x => x[0] === cur); return list[(i + d + list.length * 2) % list.length]; };

  function screen(d) {
    const [m, label] = step(SCREENS, screenOf(st().mode || 'clock'), d);
    setState({ mode: m }); toast(label);
  }
  function option(d) {
    const s = st(), m = screenOf(s.mode);
    if (m === 'holiday') { const [k, l] = step(HOLIDAYS, s.holiday?.theme || 'auto', d); setState({ mode: 'holiday', holiday: { ...(s.holiday || {}), theme: k } }); toast(l); }
    else if (m === 'scoreboard') { const list = TEAMS.map(t => [t.key, t.label]); const [k, l] = step(list, s.scoreboard?.team || list[0][0], d); setState({ scoreboard: { ...(s.scoreboard || {}), team: k } }); toast(l); }
    else if (m === 'fun') { const [k, l] = step(FUN, s.fun?.view || FUN[0][0], d); setState({ fun: { ...(s.fun || {}), view: k } }); toast(l); }
    else if (m === 'map') { const [k, l] = step(MAPS, s.map?.view || 'weather', d); setState({ map: { ...(s.map || {}), view: k } }); toast(l); }
    else toast('Nothing to change here');
  }
  function action() {
    const s = st();
    if (screenOf(s.mode) === 'holiday') { setState({ holiday: { ...(s.holiday || {}), theme: s.holiday?.theme || 'auto', kick: Date.now() } }); toast('Surprise!'); }
    else option(1);
  }
  function bright(d) {
    const b = Math.max(10, Math.min(100, (st().brightness ?? 80) + d));
    setState({ brightness: b }); toast(`Brightness ${b}%`);
  }
  const help = () => toast('◀ ▶ screen · ▲ ▼ option · A surprise · LB/RB brightness · Select+Start menu', 6000);

  const DO = { left: () => screen(-1), right: () => screen(1), up: () => option(-1), down: () => option(1), a: action, lb: () => bright(-10), rb: () => bright(10), y: help };

  // Esc / Home = home menu. On the Pi the launcher catches the key itself; on a regular computer
  // this opens the same menu as a web page.
  addEventListener('keydown', e => {
    if (e.key === 'Escape' || e.key === 'Home') { e.preventDefault(); location.href = '../pi/menu/?demo' + location.hash; }
  });
  addEventListener('keydown', e => {
    const k = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', Enter: 'a', ' ': 'a', '-': 'lb', '=': 'rb', '+': 'rb', h: 'y', H: 'y' }[e.key];
    if (k) { e.preventDefault(); DO[k](); }
  });

  // Standard gamepad layout: 0 A, 3 Y, 4 LB, 5 RB, 8 Select, 9 Start, 12-15 D-pad. Left stick works as a D-pad too.
  const MAP = { 0: 'a', 3: 'y', 4: 'lb', 5: 'rb', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
  const held = {};
  let next = {};
  function poll() {
    for (const p of navigator.getGamepads?.() || []) {
      if (!p) continue;
      const combo = p.buttons[8]?.pressed && p.buttons[9]?.pressed; // Select+Start = home menu
      if (combo) { location.href = '../pi/menu/?demo' + location.hash; return; }
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      const on = {};
      for (const [i, name] of Object.entries(MAP)) if (p.buttons[i]?.pressed) on[name] = true;
      if (ax < -0.6) on.left = true; if (ax > 0.6) on.right = true;
      if (ay < -0.6) on.up = true; if (ay > 0.6) on.down = true;
      const now = performance.now();
      for (const name of Object.keys(DO)) {
        const id = p.index + name;
        if (on[name] && !combo) {
          // fire on press, then repeat while held on the d-pad
          if (!held[id]) { held[id] = true; next[id] = now + 450; DO[name](); }
          else if (['up', 'down', 'left', 'right'].includes(name) && now > next[id]) { next[id] = now + 220; DO[name](); }
        } else held[id] = false;
      }
    }
    requestAnimationFrame(poll);
  }
  addEventListener('gamepadconnected', () => toast('Controller ready · press Y for buttons', 3500));
  poll();
}
