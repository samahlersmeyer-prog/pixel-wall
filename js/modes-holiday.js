// Holiday themes. "auto" picks whatever holiday is in season for today's date.
import { hsv, W, H } from './renderer.js?v=24';
import { holidaySurprise } from './holiday-events.js?v=24';
import { drawFireplace } from './modes-fireplace.js?v=24';
import { T2, THEMES2, DATES, advent1 } from './modes-holiday2.js?v=24';

function rnd(n) { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }

// ---------- dates ----------
function easter(y) { // Anonymous Gregorian algorithm
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}
function thanksgiving(y) { const d = new Date(y, 10, 1); const first = (4 - d.getDay() + 7) % 7 + 1; return new Date(y, 10, first + 21); }
const DAY = 864e5;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// Auto picks the FIRST entry whose window contains today, so order = priority.
// [key, date(year), days of lead-up before, days it stays up after (number or year => number)]
const HOLIDAYS = [
  ['newyear', y => new Date(y, 0, 1), 1, 0],
  ['christmas', y => new Date(y, 11, 25), 1, 11],          // Christmas Eve through the 12 days of Christmas
  ['epiphany', DATES.epiphany, 0, 6],
  ['mlk', DATES.mlk, 2, 0],
  ['lent', DATES.ashwednesday, 0, 0],                       // Ash Wednesday itself wins over Valentine's
  ['valentines', y => new Date(y, 1, 14), 6, 0],
  ['presidents', DATES.presidents, 2, 0],
  ['stpatricks', y => new Date(y, 2, 17), 2, 0],
  ['goodfriday', DATES.goodfriday, 1, 1],                   // Maundy Thursday - Holy Saturday
  ['easter', easter, 0, 7],
  ['palmsunday', DATES.palmsunday, 0, 3],                   // Palm Sunday - Wednesday of Holy Week
  ['lent', DATES.ashwednesday, 0, 38],                      // the rest of Lent
  ['ascension', DATES.ascension, 1, 0],
  ['pentecost', DATES.pentecost, 2, 0],
  ['memorial', DATES.memorial, 2, 0],
  ['july4', y => new Date(y, 6, 4), 4, 0],
  ['labor', DATES.labor, 2, 0],
  ['columbus', DATES.columbus, 1, 0],
  ['reformation', DATES.reformation, 0, 0],                 // Oct 31 alternates with Halloween
  ['halloween', y => new Date(y, 9, 31), 30, 0],
  ['allsaints', DATES.allsaints, 0, 0],
  ['veterans', DATES.veterans, 3, 0],
  ['thanksgiving', thanksgiving, 14, 0],
  ['advent', advent1, 0, y => Math.round((new Date(y, 11, 23) - advent1(y)) / DAY)],
];
const afterDays = (h, y) => typeof h[3] === 'function' ? h[3](y) : h[3];
function nextFor(h, today) {
  for (const y of [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]) {
    const d = h[1](y);
    if (addDays(d, afterDays(h, y)) >= today) return d;
  }
  return null;
}

const L2 = Object.fromEntries(THEMES2);
// In calendar order for the phone.
export const THEMES = [
  ['auto', 'Auto (by date)'], ['loop', 'Holiday loop (your picks)'], ['fireplace', 'Fireplace (cozy, all season)'],
  ['newyear', "New Year's"], ['epiphany', L2.epiphany], ['mlk', L2.mlk], ['valentines', "Valentine's Day"], ['presidents', L2.presidents],
  ['lent', L2.lent], ['stpatricks', "St. Patrick's Day"], ['palmsunday', L2.palmsunday], ['goodfriday', L2.goodfriday], ['easter', 'Easter'],
  ['ascension', L2.ascension], ['pentecost', L2.pentecost], ['memorial', L2.memorial], ['july4', '4th of July'], ['labor', L2.labor],
  ['columbus', L2.columbus], ['reformation', L2.reformation], ['halloween', 'Halloween'], ['allsaints', L2.allsaints],
  ['veterans', L2.veterans], ['thanksgiving', 'Thanksgiving'], ['advent', L2.advent], ['christmas', 'Christmas'],
  ['birthday', 'Birthday'], ['gameday', 'Game Day'],
];
export const LOOP_DEFAULT = ['christmas', 'thanksgiving', 'newyear'];

function nextDate(key, today, st) {
  if (key === 'birthday') {
    const b = st.birthday?.date; // YYYY-MM-DD (year ignored)
    if (!b) return null;
    const [, m, d] = b.split('-').map(Number);
    let dt = new Date(today.getFullYear(), m - 1, d);
    if (dt < today) dt = new Date(today.getFullYear() + 1, m - 1, d);
    return dt;
  }
  const h = HOLIDAYS.find(x => x[0] === key);
  return h ? nextFor(h, today) : null;
}

export function autoTheme(today, st) {
  const bd = nextDate('birthday', today, st);
  if (bd && (bd - today) / DAY <= 3) return 'birthday';
  for (const h of HOLIDAYS) {
    const d = nextFor(h, today);
    if (!d) continue;
    const diff = Math.round((d - today) / DAY);
    if (diff <= h[2] && diff >= -afterDays(h, d.getFullYear())) return h[0];
  }
  // Otherwise count down to the next big holiday.
  const BIG = new Set(['christmas', 'easter', 'july4', 'thanksgiving', 'halloween', 'valentines', 'stpatricks', 'newyear']);
  let best = 'christmas', bestDiff = 1e9;
  for (const h of HOLIDAYS) {
    const key = h[0];
    if (!BIG.has(key)) continue;
    const d = nextFor(h, today);
    const diff = d ? (d - today) / DAY : 1e9;
    if (diff >= 0 && diff < bestDiff) { best = key; bestDiff = diff; }
  }
  return best;
}

function countdownLine(key, today, st, onDay, label) {
  const d = nextDate(key, today, st);
  if (!d) return '';
  const days = Math.round((d - today) / DAY);
  if (days <= 0) return onDay;
  return days === 1 ? `1 DAY TO ${label}` : `${days} DAYS TO ${label}`;
}

// ---------- sprites ----------
const PUMPKIN = ['.....g.....', '....gg.....', '.OOOOOOOOO.', 'OOOoOOOoOOO', 'OOYYOOOYYOO', 'OOOOOOOOOOO', 'OOYOYOYOYOO', 'OOOYOYOYOOO', '.OOOOOOOOO.', '..OOOOOOO..'];
const PUMPKIN_P = { g: [40, 160, 40], O: [255, 110, 0], o: [200, 80, 0], Y: [255, 230, 60] };
const BAT = [['#.....#', '##.#.##', '.#####.'], ['..#.#..', '.#####.', '##...##']];
const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
const CLOVER = ['...###...', '..#####..', '..#####..', '###.#.###', '#########', '###.#.###', '....#....', '....#....', '...#.....'];
const EGG = ['.###.', '#####', 'SSSSS', '#####', 'ZZZZZ', '#####', '.###.'];
const CROSS = ['..###..', '..###..', '#######', '#######', '..###..', '..###..', '..###..', '..###..', '..###..', '..###..'];
const TURKEY = ['..ROYYYOR..', '.ROYYYYYOR.', 'ROY.BBB.YOR', 'RO.BBBBBW.R', '...BBBBBBr.', '...BBBBB.r.', '....BBBB...', '....y..y...'];
const TURKEY_P = { R: [220, 40, 30], O: [255, 130, 0], Y: [255, 210, 40], B: [130, 70, 30], W: [255, 255, 255], r: [255, 40, 40], y: [255, 200, 0] };
const CAKE = ['..f..f..f..f..', '..c..c..c..c..', '..c..c..c..c..', 'PPPPPPPPPPPPPP', 'PWPPWPPWPPWPPW', 'BBBBBBBBBBBBBB', 'BBBBBBBBBBBBBB', 'PPPPPPPPPPPPPP', 'BBBBBBBBBBBBBB', 'BBBBBBBBBBBBBB'];

// ---------- shared effects (stateless, so every screen shows the same thing) ----------
export function fireworks(f, t, colors, every = 650, area = H - 8) {
  const life = 1700;
  const first = Math.floor((t - life) / every);
  for (let k = Math.max(0, first); k * every <= t; k++) {
    const dt = (t - k * every) / 1000;
    if (dt < 0 || dt * 1000 > life) continue;
    const cx = 12 + rnd(k) * (W - 24), cy = 8 + rnd(k + 0.3) * (area * 0.55);
    const col = colors ? colors[Math.floor(rnd(k + 0.6) * colors.length)] : hsv(rnd(k + 0.6));
    const fade = 1 - dt / (life / 1000);
    const n = 22;
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2 + rnd(k + j) * 0.2;
      const sp = 14 + rnd(k * 3 + j) * 6;
      const x = cx + Math.cos(a) * sp * dt, y = cy + Math.sin(a) * sp * dt + 9 * dt * dt;
      f.set(x, y, col.map(v => v * fade));
    }
  }
}

function falling(f, t, n, colors, speed = 10, seed = 0, up = false) {
  for (let i = 0; i < n; i++) {
    const s = speed * (0.6 + rnd(i + seed) * 0.8);
    const x = (rnd(i + seed + 0.5) * W + Math.sin(t / 1300 + i) * 3 + W) % W;
    let y = (rnd(i + seed + 0.7) * H + (t / 1000) * s) % H;
    if (up) y = H - 1 - y;
    f.set(x, y, colors[i % colors.length]);
  }
}

function drawTree(f, x, y, t, seed) {
  for (let row = 0; row < 14; row++) { const half = Math.floor(row / 2) + 1; f.rect(x - half, y + row, half * 2 + 1, 1, [20, 140, 50]); }
  f.rect(x - 1, y + 14, 3, 3, [110, 60, 20]);
  f.set(x, y - 1, [255, 220, 0]);
  const colors = [[255, 40, 40], [255, 200, 0], [60, 160, 255], [255, 255, 255]];
  for (let k = 0; k < 7; k++) {
    const row = 2 + Math.floor(rnd(seed + k) * 11), half = Math.floor(row / 2);
    const dx = Math.round((rnd(seed + k * 3.3) * 2 - 1) * half);
    if (Math.floor(t / 400 + k) % 3 !== 0) f.set(x + dx, y + row, colors[k % 4]);
  }
}

export function teamLook(team = 'osu-fb') {
  return {
    'osu-fb': ['GO BUCKS!', [187, 0, 0], [200, 200, 200]], 'osu-bb': ['GO BUCKS!', [187, 0, 0], [200, 200, 200]],
    cavs: ["LET'S GO", [134, 0, 56], [253, 187, 48], 'CAVS!'], browns: ['GO BROWNS!', [255, 60, 0], [130, 80, 50]],
    guardians: ['GO GUARDS!', [220, 30, 50], [30, 60, 140]],
  }[team] || ['GAME DAY', [255, 255, 255], [120, 120, 120]];
}

// ---------- themes ----------
const T = {
  christmas(f, t, today, st) {
    falling(f, t, 70, [[200, 200, 200], [140, 140, 140], [255, 255, 255]], 10);
    f.center('MERRY', 3, [235, 40, 40], 2);
    f.center('CHRISTMAS', 21, [40, 200, 80], 2);
    drawTree(f, 8, 45, t, 1); drawTree(f, W - 9, 45, t, 2);
    f.center(countdownLine('christmas', today, st, 'JOY TO THE WORLD', 'GO').replace('TO GO', 'TO GO'), 50, [255, 215, 80]);
  },
  newyear(f, t, today, st) {
    fireworks(f, t);
    const d = nextDate('newyear', today, st);
    const year = d ? d.getFullYear() : today.getFullYear();
    f.center('HAPPY', 4, [255, 215, 80], 2);
    f.center('NEW YEAR', 22, [255, 255, 255], 2);
    f.center(countdownLine('newyear', today, st, `WELCOME ${year}!`, String(year)), 52, [120, 200, 255]);
  },
  valentines(f, t, today, st) {
    for (let i = 0; i < 9; i++) {
      const x = Math.round(rnd(i) * (W - 8));
      const y = Math.round(H - ((t / 1000) * (6 + rnd(i + 1) * 6) + rnd(i + 2) * H) % (H + 8));
      f.sprite(HEART, x, y, { '#': i % 2 ? [255, 60, 120] : [200, 20, 50] });
    }
    f.center('HAPPY', 4, [255, 120, 180], 2);
    f.center("VALENTINE'S DAY", 24, [255, 255, 255]);
    f.center(countdownLine('valentines', today, st, 'BE MINE!', "VDAY"), 50, [255, 120, 180]);
  },
  stpatricks(f, t, today, st) {
    const g = { '#': [40, 200, 70] };
    f.sprite(CLOVER, 2, 44, g); f.sprite(CLOVER, W - 11, 44, g);
    falling(f, t, 25, [[255, 215, 0], [255, 240, 120]], 8, 5);
    f.center('HAPPY', 4, [40, 220, 80], 2);
    f.center("ST PATRICK'S DAY", 24, [255, 255, 255]);
    f.center(countdownLine('stpatricks', today, st, 'LUCK OF THE IRISH', 'GO'), 50, [255, 215, 0]);
  },
  easter(f, t, today, st) {
    const d = nextDate('easter', today, st);
    const days = d ? Math.round((d - today) / DAY) : 99;
    const pastel = [[255, 170, 200], [170, 220, 255], [200, 255, 170], [255, 240, 150], [220, 180, 255]];
    for (let i = 0; i < 6; i++) f.sprite(EGG, 8 + i * 21, 56, { '#': pastel[i % 5], S: [255, 255, 255], Z: pastel[(i + 2) % 5] });
    if (days <= 0) {
      const glow = 0.75 + 0.25 * Math.sin(t / 500);
      f.sprite(CROSS, 4, 6, { '#': [255 * glow, 215 * glow, 90 * glow] });
      f.sprite(CROSS, W - 11, 6, { '#': [255 * glow, 215 * glow, 90 * glow] });
      f.center('HE IS', 4, [255, 255, 255], 2);
      f.center('RISEN!', 22, [255, 215, 80], 2);
      f.center('ALLELUIA!', 43, [200, 255, 200]);
    } else {
      f.center('EASTER', 8, [255, 215, 80], 2);
      f.center(days === 1 ? '1 DAY TO GO' : `${days} DAYS TO GO`, 32, [255, 255, 255]);
    }
  },
  july4(f, t, today, st) {
    fireworks(f, t, [[255, 50, 50], [255, 255, 255], [70, 120, 255]], 550);
    f.center('HAPPY 4TH', 4, [255, 255, 255], 2);
    f.center('OF JULY', 22, [255, 60, 60], 2);
    f.center(countdownLine('july4', today, st, 'LAND OF THE FREE', 'GO'), 52, [100, 150, 255]);
  },
  halloween(f, t, today, st) {
    for (let i = 0; i < 4; i++) {
      const x = ((t / 1000) * (18 + i * 5) + i * 40) % (W + 20) - 10;
      const y = 6 + i * 9 + Math.sin(t / 300 + i) * 3;
      f.sprite(BAT[Math.floor(t / 180 + i) % 2], Math.round(x), Math.round(y), { '#': [150, 80, 230] });
    }
    f.sprite(PUMPKIN, 2, 53, PUMPKIN_P); f.sprite(PUMPKIN, W - 13, 53, PUMPKIN_P);
    f.center('HAPPY', 4, [255, 120, 0], 2);
    f.center('HALLOWEEN', 22, [180, 100, 255], 2);
    f.center(countdownLine('halloween', today, st, 'TRICK OR TREAT!', 'GO'), 46, [255, 200, 80]);
  },
  thanksgiving(f, t, today, st) {
    falling(f, t, 30, [[255, 120, 0], [220, 50, 20], [255, 200, 0], [170, 90, 30]], 9, 11);
    f.sprite(TURKEY, 4, 54, TURKEY_P);
    f.sprite(TURKEY, W - 15, 54, TURKEY_P);
    f.center('HAPPY', 4, [255, 140, 0], 2);
    f.center('THANKSGIVING', 23, [255, 215, 80]);
    f.center(countdownLine('thanksgiving', today, st, 'GIVE THANKS', 'GO'), 37, [255, 255, 255]);
  },
  birthday(f, t, today, st) {
    falling(f, t, 60, [[255, 60, 60], [60, 200, 255], [255, 220, 0], [120, 255, 120], [255, 100, 220]], 12, 21);
    const flame = Math.floor(t / 150) % 2 ? [255, 200, 0] : [255, 120, 0];
    f.sprite(CAKE, Math.round(W / 2 - 7), 52, { f: flame, c: [120, 200, 255], P: [255, 130, 190], W: [255, 255, 255], B: [160, 100, 60] }, 1);
    f.center('HAPPY', 2, [255, 100, 220], 2);
    f.center('BIRTHDAY', 19, [255, 220, 0], 2);
    const name = String(st.birthday?.name || '').toUpperCase();
    const line = countdownLine('birthday', today, st, name ? `${name}!` : 'TO YOU!', 'GO');
    f.center(line || (name ? `${name}!` : 'TO YOU!'), 39, [255, 255, 255]);
  },
  gameday(f, t, today, st, data) {
    const look = teamLook(st.scoreboard?.team);
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(t / 400));
    for (let x = 0; x < W; x++) {
      const on = Math.floor((x + t / 40) / 8) % 2 === 0;
      f.rect(x, 0, 1, 3, on ? look[1] : look[2]);
      f.rect(x, H - 3, 1, 3, on ? look[2] : look[1]);
    }
    f.center('GAME DAY', 8, look[1].map(v => Math.min(255, v * pulse + 40)), 2);
    f.center(look[0], 30, [255, 255, 255], 2);
    if (look[3]) f.center(look[3], 46, look[2], 1);
    else if (data.game?.kind === 'game' && data.game.state !== 'post') f.center(data.game.status.toUpperCase().slice(0, 21), 49, look[2]);
  },
};

export function drawHoliday(f, st, data, t, now) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let theme = st.holiday?.theme || 'auto';
  if (theme === 'loop') {
    const list = (st.holiday?.loop?.length ? st.holiday.loop : LOOP_DEFAULT).filter(k => k !== 'loop' && k !== 'auto');
    theme = list[Math.floor(t / ((st.holiday?.loopSeconds || 60) * 1000)) % list.length] || 'christmas';
  }
  if (theme === 'auto') {
    theme = autoTheme(today, st);
    // Oct 31: Reformation Day and Halloween take turns every 2 minutes.
    if (theme === 'reformation' && Math.floor(t / 120000) % 2) theme = 'halloween';
  }
  if (theme === 'fireplace') { drawFireplace(f, st, data, t, now); return; }
  if (T2[theme]) T2[theme](f, t, today, st, { line: (k, on, label) => countdownLine(k, today, st, on, label) });
  else { if (!T[theme]) theme = 'christmas'; T[theme](f, t, today, st, data); }
  if (st.holiday?.surprises === false) return;
  const ny = nextDate('newyear', today, st);
  const team = st.scoreboard?.team || 'osu-fb';
  const sport = team === 'cavs' || team === 'osu-bb' ? 'basketball' : team === 'guardians' ? 'baseball' : 'football';
  const look = teamLook(team);
  const cheer = look[3] ? `${look[0]} ${look[3]}` : look[0];
  holidaySurprise(f, theme, t, data, { year: ny ? ny.getFullYear() : today.getFullYear() + 1, sport, colors: [look[1], look[2]], cheer, day: today.getDate() });
}
