// More holidays: the church year (Advent, Epiphany, Lent, Palm Sunday, Holy Week,
// Ascension, Pentecost, Reformation, All Saints) and national holidays
// (MLK Day, Presidents' Day, Memorial Day, Labor Day, Columbus Day, Veterans Day).
// Each has a base screen plus 3 surprise scenes. Solemn days use gentle scenes.
import { W, H, hsv } from './renderer.js?v=35';
import { fireworks } from './modes-holiday.js?v=35';

const rnd = n => { const x = Math.sin(n * 63.731) * 43758.5453; return x - Math.floor(x); };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const ease = p => p * p * (3 - 2 * p);
const mix = (c, k) => c.map(v => v * k);

const WHITE = [255, 255, 255], GOLD = [255, 205, 60], PURPLE = [130, 60, 190], PINK = [240, 120, 180], RED = [220, 30, 40];
const BLUE = [50, 90, 210], GREEN = [40, 160, 70], BROWN = [120, 75, 40], DIM = [150, 150, 160], SKIN = [230, 180, 140];

// ---------- dates ----------
export function easterDate(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}
const plus = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const nth = (y, m, dow, n) => { const d = new Date(y, m, 1); return new Date(y, m, 1 + ((dow - d.getDay() + 7) % 7) + (n - 1) * 7); };
const last = (y, m, dow) => { const d = new Date(y, m + 1, 0); return new Date(y, m, d.getDate() - ((d.getDay() - dow + 7) % 7)); };
export const advent1 = y => { const d = new Date(y, 11, 3); return plus(d, -d.getDay()); };
export const DATES = {
  advent: advent1,
  epiphany: y => new Date(y, 0, 6),
  ashwednesday: y => plus(easterDate(y), -46),
  lent: y => plus(easterDate(y), -46),
  palmsunday: y => plus(easterDate(y), -7),
  goodfriday: y => plus(easterDate(y), -2),
  ascension: y => plus(easterDate(y), 39),
  pentecost: y => plus(easterDate(y), 49),
  reformation: y => new Date(y, 9, 31),
  allsaints: y => new Date(y, 10, 1),
  mlk: y => nth(y, 0, 1, 3),
  presidents: y => nth(y, 1, 1, 3),
  memorial: y => last(y, 4, 1),
  labor: y => nth(y, 8, 1, 1),
  columbus: y => nth(y, 9, 1, 2),
  veterans: y => new Date(y, 10, 11),
};

export const THEMES2 = [
  ['advent', 'Advent'], ['epiphany', 'Epiphany'], ['mlk', 'MLK Day'], ['presidents', "Presidents' Day"], ['lent', 'Lent / Ash Wednesday'],
  ['palmsunday', 'Palm Sunday / Holy Week'], ['goodfriday', 'Maundy Thursday & Good Friday'], ['ascension', 'Ascension'],
  ['pentecost', 'Pentecost'], ['memorial', 'Memorial Day'], ['labor', 'Labor Day'], ['columbus', 'Columbus Day'],
  ['reformation', 'Reformation Day'], ['allsaints', "All Saints' Day"], ['veterans', 'Veterans Day'],
];
export const GENTLE = new Set(['advent', 'epiphany', 'lent', 'palmsunday', 'goodfriday', 'ascension', 'pentecost', 'allsaints', 'memorial', 'veterans', 'mlk']);

// ---------- little drawing helpers ----------
function sky(f, top, bottom, h = H) {
  for (let y = 0; y < h; y++) { const k = y / h; f.rect(0, y, W, 1, top.map((v, i) => v + (bottom[i] - v) * k)); }
}
function stars(f, t, n = 30, maxY = 40) {
  for (let i = 0; i < n; i++) { const tw = 0.4 + 0.6 * Math.abs(Math.sin(t / 900 + i)); f.set(rnd(i) * W, rnd(i + 0.5) * maxY, mix([255, 255, 230], tw)); }
}
function bigStar(f, x, y, r, t, c = [255, 240, 180]) {
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + t / 4000, len = (i % 2 ? r * 0.5 : r) * (0.85 + 0.15 * Math.sin(t / 300 + i));
    f.lineAdd(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len, mix(c, i % 2 ? 0.6 : 0.9));
  }
  f.disc(x, y, 1.6, WHITE);
}
function candle(f, x, y, h, c, lit, t, seed = 0) {
  f.rect(x, y, 3, h, c);
  if (lit) {
    const fl = Math.floor(t / 120 + seed) % 3;
    f.set(x + 1, y - 1, [255, 230, 120]); f.set(x + 1, y - 2 - (fl === 0 ? 1 : 0), [255, 170, 40]);
    if (fl) f.set(x + (fl === 1 ? 0 : 2), y - 2, [255, 140, 30]);
  } else f.set(x + 1, y - 1, [60, 60, 60]);
}
function cross(f, x, y, h, c, w = 3) { f.rect(x, y, w, h, c); f.rect(x - Math.round(h * 0.3), y + Math.round(h * 0.25), w + Math.round(h * 0.6), w, c); }
function dove(f, x, y, t, c = WHITE) {
  const up = Math.floor(t / 180) % 2;
  f.rect(x, y, 5, 2, c); f.set(x + 5, y, c); f.set(x + 6, y, GOLD); f.set(x - 1, y + 1, c); f.set(x - 2, y + 2, c);
  if (up) { f.line(x + 1, y - 1, x + 3, y - 4, c); f.line(x + 2, y - 1, x + 4, y - 3, c); }
  else { f.line(x + 1, y + 2, x + 3, y + 5, c); f.line(x + 2, y + 2, x + 4, y + 4, c); }
}
function person(f, x, y, c, armUp = 0) {
  f.disc(x, y - 9, 1.6, SKIN); f.rect(x - 1, y - 7, 3, 5, c);
  f.set(x - 1, y - 1, c); f.set(x + 1, y - 1, c); f.set(x - 1, y, c); f.set(x + 1, y, c);
  if (armUp) { f.set(x - 2, y - 8, c); f.set(x + 2, y - 8, c); f.set(x - 3, y - 9, c); f.set(x + 3, y - 9, c); }
  else { f.set(x - 2, y - 6, c); f.set(x + 2, y - 6, c); f.set(x - 2, y - 5, c); f.set(x + 2, y - 5, c); }
}
function flag(f, x, y, w, h, t, wave = true) {
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const dy = wave ? Math.round(Math.sin(xx / 6 - t / 300) * 1.2 * (xx / w)) : 0;
    const sy = yy;
    let c = Math.floor(sy * 13 / h) % 2 === 0 ? [200, 25, 40] : [235, 235, 235];
    if (xx < w * 0.42 && sy < h * 7 / 13) c = (xx % 3 === 1 && sy % 3 === 1) ? WHITE : [30, 50, 140];
    f.set(x + xx, y + yy + dy, mix(c, 0.85 + 0.15 * Math.sin(xx / 6 - t / 300)));
  }
}
function ground(f, y, c) { f.rect(0, y, W, H - y, c); }
const line2 = (f, a, b, ca = GOLD, cb = WHITE, s1 = 2) => { f.center(a, 4, ca, s1); f.center(b, s1 === 2 ? 24 : 16, cb, 1); };

// ---------- base screens ----------
export const T2 = {
  advent(f, t, today, st, c) {
    sky(f, [10, 5, 25], [30, 15, 50]);
    stars(f, t, 25, 30);
    const a1 = DATES.advent(today.getFullYear());
    const sundays = today < a1 ? 0 : Math.min(4, Math.floor((today - a1) / 864e5 / 7) + 1);
    // wreath
    for (let a = 0; a < Math.PI * 2; a += 0.05) for (let r = 0; r < 4; r++) f.set(64 + Math.cos(a) * (30 + r), 52 + Math.sin(a) * (7 + r * 0.6), mix(GREEN, 0.6 + 0.1 * r));
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; f.set(64 + Math.cos(a) * 32, 52 + Math.sin(a) * 8, RED); }
    const cols = [PURPLE, PURPLE, PINK, PURPLE];
    [[38, 44], [53, 40], [72, 40], [87, 44]].forEach(([x, y], i) => candle(f, x, y, 9, cols[i], i < sundays, t, i));
    candle(f, 63, 38, 12, WHITE, today.getMonth() === 11 && today.getDate() >= 24, t, 9);
    f.center('ADVENT', 3, [200, 160, 255], 2);
    f.center(c.line('christmas', 'CHRIST IS BORN', 'CHRISTMAS'), 20, GOLD);
  },
  epiphany(f, t) {
    sky(f, [5, 5, 25], [20, 20, 50]);
    stars(f, t, 30, 40);
    bigStar(f, 110, 34, 9, t);
    ground(f, 56, [80, 65, 40]);
    for (let i = 0; i < 3; i++) camel(f, 18 + i * 22, 44, Math.floor(t / 300 + i) % 2, [[160, 110, 60], [140, 95, 55], [175, 125, 70]][i], [[150, 40, 160], [40, 120, 200], [200, 150, 40]][i]);
    f.center('EPIPHANY', 4, GOLD, 2);
    f.center('THE WISE MEN CAME', 22, WHITE);
  },
  lent(f, t, today, st, c) {
    sky(f, [25, 10, 40], [45, 20, 60]);
    const ash = Math.round((today - DATES.ashwednesday(today.getFullYear())) / 864e5) === 0;
    cross(f, 20, 14, 40, [110, 70, 40]);
    f.line(14, 26, 26, 40, [150, 80, 200]); f.line(34, 26, 26, 40, [150, 80, 200]);
    ground(f, 58, [40, 30, 50]);
    if (ash) {
      f.center('ASH', 6, DIM, 2, 40, W); f.center('WEDNESDAY', 24, DIM, 1, 40, W);
      f.center('REMEMBER YOU', 38, [200, 180, 220], 1, 40, W); f.center('ARE DUST', 47, [200, 180, 220], 1, 40, W);
    } else {
      f.center('LENT', 6, [190, 140, 240], 2, 40, W);
      f.center(c.line('easter', 'HE IS RISEN!', 'EASTER').replace(' TO EASTER', ''), 30, WHITE, 1, 40, W);
      f.center('TO EASTER', 40, DIM, 1, 40, W);
    }
  },
  palmsunday(f, t, today) {
    sky(f, [120, 170, 230], [230, 220, 180]);
    ground(f, 54, [190, 160, 110]);
    palm(f, 8, 54, t, 1); palm(f, 120, 54, t, -1);
    const isSun = today.getDay() === 0;
    f.center(isSun ? 'HOSANNA!' : 'HOLY WEEK', 6, [255, 255, 255], 2);
    f.center(isSun ? 'PALM SUNDAY' : 'HE IS COMING', 26, [80, 60, 30]);
  },
  goodfriday(f, t, today) {
    const dow = today.getDay();
    if (dow === 4) {
      sky(f, [20, 15, 10], [40, 30, 20]);
      f.rect(20, 46, 88, 3, BROWN); f.rect(24, 49, 2, 12, BROWN); f.rect(102, 49, 2, 12, BROWN);
      f.disc(52, 42, 5, [200, 160, 100]); f.rect(48, 41, 9, 2, [170, 130, 80]);
      f.rect(73, 36, 6, 9, [140, 30, 50]); f.rect(75, 45, 2, 2, GOLD); f.rect(72, 34, 8, 2, GOLD);
      f.center('MAUNDY THURSDAY', 6, GOLD); f.center('DO THIS IN', 18, DIM); f.center('REMEMBRANCE OF ME', 27, DIM);
    } else if (dow === 6) {
      sky(f, [10, 10, 20], [25, 25, 40]); stars(f, t, 20, 30);
      ground(f, 50, [50, 45, 40]); f.disc(64, 54, 18, [80, 75, 70]); f.disc(64, 54, 10, [20, 18, 18]); f.disc(76, 54, 9, [110, 105, 100]);
      f.center('HOLY SATURDAY', 4, DIM); f.center('WE WAIT', 16, [180, 180, 200]);
    } else {
      sky(f, [15, 10, 15], [50, 25, 30]);
      for (let x = 0; x < W; x++) f.rect(x, 50 + Math.round(Math.sin(x / 20) * 3 + (Math.abs(x - 64) / 10)), 1, 20, [25, 20, 20]);
      cross(f, 63, 18, 32, [10, 8, 8]); cross(f, 38, 28, 22, [10, 8, 8], 2); cross(f, 88, 28, 22, [10, 8, 8], 2);
      f.center('GOOD FRIDAY', 2, [200, 180, 180]); f.center('IT IS FINISHED', 11, DIM);
    }
  },
  ascension(f, t) {
    sky(f, [70, 140, 230], [190, 220, 255]);
    cloud(f, 30 + Math.sin(t / 3000) * 3, 18, 1.2); cloud(f, 96 + Math.sin(t / 3500) * 3, 14, 1);
    for (let i = 0; i < 6; i++) f.lineAdd(64, 0, 64 + (i - 2.5) * 16, 52, mix([255, 250, 220], 0.18));
    ground(f, 54, [80, 150, 70]);
    f.center('ASCENSION', 26, WHITE, 2);
    f.center('HE ASCENDED', 44, [30, 50, 100]);
  },
  pentecost(f, t) {
    sky(f, [120, 10, 10], [200, 50, 20]);
    for (let i = 0; i < 9; i++) flameTongue(f, 10 + i * 13, 50, t, i);
    dove(f, 60 + Math.sin(t / 900) * 4, 34 + Math.sin(t / 700) * 2, t);
    f.center('PENTECOST', 4, [255, 230, 120], 2);
    f.center('COME, HOLY SPIRIT', 22, WHITE);
  },
  reformation(f, t) {
    f.rect(0, 0, W, H, [35, 30, 35]);
    for (let y = 0; y < H; y += 4) f.rect(0, y, W, 1, [45, 40, 45]);
    door(f, 8, 12);
    paper(f, 18, 26);
    luthersRose(f, 84, 50);
    f.center('1517', 2, GOLD, 2, 40, W);
    f.center('REFORMATION', 20, WHITE, 1, 40, W); f.center('DAY', 29, WHITE, 1, 40, W);
  },
  allsaints(f, t) {
    sky(f, [10, 10, 30], [30, 25, 60]);
    stars(f, t, 40, 40);
    for (let i = 0; i < 12; i++) candle(f, 6 + i * 10, 52, 8, [240, 235, 220], true, t, i);
    ground(f, 60, [40, 35, 50]);
    f.center("ALL SAINTS' DAY", 4, GOLD);
    f.center('FOR ALL THE SAINTS', 16, WHITE);
  },
  mlk(f, t) {
    sky(f, [255, 160, 80], [255, 220, 150]);
    f.disc(64, 64, 22, [255, 240, 180]);
    for (let i = 0; i < 9; i++) person(f, 12 + i * 13, 62, [[120, 70, 40], [200, 60, 60], [60, 90, 200], [80, 160, 80]][i % 4], 0);
    f.center('MLK DAY', 4, [80, 30, 10], 2);
    f.center('A DAY OF SERVICE', 22, [90, 40, 20]);
  },
  presidents(f, t) {
    f.rect(0, 0, W, H, [15, 25, 70]);
    for (let i = 0; i < 26; i++) f.set(rnd(i) * W, rnd(i + 1) * 20, WHITE);
    flag(f, 0, 44, W, 20, t);
    f.center('PRESIDENTS', 4, WHITE, 2);
    f.center('DAY', 22, [255, 80, 80], 2);
  },
  memorial(f, t) {
    sky(f, [60, 80, 120], [150, 160, 180]);
    ground(f, 52, [50, 100, 50]);
    f.rect(26, 6, 2, 46, [200, 200, 200]); f.disc(27, 6, 1.5, GOLD);
    flag(f, 28, 24, 24, 13, t);
    for (let i = 0; i < 8; i++) { const x = 60 + i * 8; f.rect(x, 46, 4, 8, [235, 235, 235]); f.rect(x + 1, 44, 2, 2, [235, 235, 235]); }
    f.center('MEMORIAL DAY', 4, WHITE, 1, 56, W);
    f.center('WE REMEMBER', 14, [230, 230, 240], 1, 56, W);
  },
  labor(f, t) {
    sky(f, [90, 160, 230], [200, 230, 255]);
    ground(f, 54, [80, 150, 60]);
    f.rect(16, 40, 18, 3, [180, 180, 190]); f.rect(23, 43, 4, 12, BROWN);          // hammer
    f.rect(94, 42, 18, 3, [180, 180, 190]); f.disc(112, 43, 3, [180, 180, 190]); f.disc(112, 43, 1, [200, 230, 255]);
    f.center('LABOR DAY', 4, [30, 50, 120], 2);
    f.center('THANK YOU, WORKERS!', 24, [20, 40, 100]);
  },
  columbus(f, t) {
    sky(f, [120, 180, 240], [220, 235, 255], 44);
    sea(f, t, 44);
    ship(f, 60 + Math.sin(t / 2000) * 3, 30, t);
    f.center('COLUMBUS DAY', 2, [20, 40, 100]);
    f.center('1492', 11, [120, 60, 20]);
  },
  veterans(f, t) {
    f.rect(0, 0, W, H, [12, 18, 45]);
    flag(f, 4, 6, 44, 24, t);
    f.rect(2, 4, 1, 56, [180, 180, 180]);
    f.center('VETERANS', 8, WHITE, 1, 50, W);
    f.center('DAY', 18, [255, 80, 80], 2, 50, W);
    f.center('THANK YOU FOR', 44, GOLD); f.center('YOUR SERVICE', 53, GOLD);
  },
};

// ---------- scene pieces ----------
function camel(f, x, y, step, c, robe) {
  f.rect(x, y, 14, 5, c); f.disc(x + 4, y, 2.5, c); f.disc(x + 9, y, 2.5, c);
  f.rect(x + 13, y - 5, 2, 7, c); f.rect(x + 13, y - 6, 4, 2, c);
  for (let i = 0; i < 4; i++) f.rect(x + 1 + i * 4 + (step && i % 2 ? 1 : 0), y + 5, 1, 6, c);
  f.rect(x + 6, y - 6, 3, 4, robe); f.disc(x + 7, y - 7, 1.4, SKIN); f.rect(x + 6, y - 9, 3, 1, GOLD);
}
function palm(f, x, y, t, dir) {
  f.line(x, y, x + dir * 4, y - 30, [120, 80, 40]);
  const tx = x + dir * 4, ty = y - 30;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.5 + Math.sin(t / 600 + i) * 0.08;
    for (let r = 0; r < 16; r++) f.set(tx + Math.cos(a) * r, ty + Math.sin(a) * r + r * r * 0.04, [40, 140, 50]);
  }
}
function cloud(f, x, y, s = 1) { f.disc(x, y, 6 * s, WHITE); f.disc(x + 7 * s, y + 1, 5 * s, WHITE); f.disc(x - 7 * s, y + 2, 4 * s, WHITE); f.rect(x - 10 * s, y + 2, 20 * s, 4 * s, WHITE); }
function flameTongue(f, x, y, t, i) {
  const h = 6 + Math.sin(t / 150 + i) * 2;
  for (let k = 0; k < h; k++) f.rect(x - Math.max(0, 2 - k / 3), y - k, Math.max(1, 5 - k * 0.6), 1, k < h / 2 ? [255, 180, 40] : [255, 240, 150]);
}
function door(f, x, y) {
  f.rect(x, y, 30, 52, [110, 70, 35]);
  for (let i = 1; i < 4; i++) f.rect(x + i * 7, y, 1, 52, [80, 50, 25]);
  f.disc(x + 15, y, 15, [110, 70, 35]); f.rect(x + 24, y + 28, 2, 2, GOLD);
}
function paper(f, x, y) { f.rect(x, y, 10, 13, [240, 235, 210]); for (let i = 0; i < 5; i++) f.rect(x + 1, y + 2 + i * 2, 8, 1, [140, 130, 110]); f.set(x + 5, y, [150, 150, 150]); }
function luthersRose(f, x, y) {
  f.disc(x, y, 11, [70, 130, 210]); f.disc(x, y, 9, GOLD); f.disc(x, y, 8, WHITE);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; f.disc(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 2.5, [245, 245, 245]); }
  f.disc(x - 1.5, y - 1, 2.2, RED); f.disc(x + 1.5, y - 1, 2.2, RED); f.disc(x, y + 1.5, 2.2, RED);
  f.rect(x, y - 3, 1, 5, [20, 20, 20]); f.rect(x - 2, y - 1, 5, 1, [20, 20, 20]);
}
function sea(f, t, y0) {
  for (let y = y0; y < H; y++) for (let x = 0; x < W; x++) {
    const w = Math.sin(x / 7 + t / 500 + y) + Math.sin(x / 11 - t / 700);
    f.set(x, y, w > 1.3 ? [200, 230, 255] : [20 + (y - y0) * 2, 80 + (y - y0) * 2, 170]);
  }
}
function ship(f, x, y, t) {
  x = Math.round(x);
  f.rect(x, y + 10, 26, 4, BROWN); f.rect(x + 2, y + 14, 22, 2, BROWN);
  f.rect(x + 12, y - 8, 1, 18, [80, 50, 25]);
  f.rect(x + 5, y - 6, 15, 7, [240, 235, 215]); f.rect(x + 7, y + 2, 11, 6, [240, 235, 215]);
  f.rect(x + 9, y - 2, 7, 3, RED);
  f.rect(x + 13, y - 10, 4, 2, RED);
}

// ---------- scenes (each [draw, ms]) ----------
const S = {
  // Advent
  adventStar: (f, lt, p) => { const x = -10 + p * 150, y = 10 + Math.sin(p * 3) * 4; bigStar(f, x, y, 6, lt); for (let i = 1; i < 14; i++) f.set(x - i * 2, y + i * 0.3, mix([255, 240, 180], 1 - i / 14)); },
  adventAngel: (f, lt, p) => {
    const x = -14 + ease(seg(p, 0, 0.5)) * 72 + seg(p, 0.75, 1) * 80, y = 14 + Math.sin(lt / 500) * 3;
    f.disc(x, y - 6, 2, SKIN); f.disc(x, y - 9, 3, mix(GOLD, 0.5)); f.rect(x - 2, y - 4, 5, 10, WHITE);
    f.line(x - 3, y - 3, x - 9, y - 7 - Math.sin(lt / 150) * 2, WHITE); f.line(x + 3, y - 3, x + 9, y - 7 - Math.sin(lt / 150) * 2, WHITE);
    if (p > 0.35 && p < 0.85) f.center('PREPARE THE WAY', 30, GOLD);
  },
  adventCalendar: (f, lt, p, c) => {
    f.rect(44, 18, 40, 30, [150, 30, 40]); f.rect(46, 20, 36, 26, [180, 40, 50]);
    const open = ease(seg(p, 0.2, 0.45));
    f.rect(54, 24, 20, 18, [255, 240, 200]);
    f.center(String(c.day), 28, RED, 2, 54, 74);
    if (open < 1) f.rect(54, 24, Math.round(20 * (1 - open)), 18, [200, 60, 70]);
    if (p > 0.5) f.center(`DECEMBER ${c.day}`, 52, WHITE);
  },
  // Epiphany
  caravan: (f, lt, p) => { for (let i = 0; i < 3; i++) camel(f, Math.round(-50 + p * 190 - i * 22), 44, Math.floor(lt / 250 + i) % 2, [160, 110, 60], [[150, 40, 160], [40, 120, 200], [200, 150, 40]][i]); },
  starShine: (f, lt, p) => { const r = 9 + Math.sin(p * Math.PI) * 14; bigStar(f, 110, 34, r, lt); for (let i = 0; i < 6; i++) f.lineAdd(110, 34, 20 + i * 12, 60, mix([255, 240, 180], 0.3 * Math.sin(p * Math.PI))); },
  gifts: (f, lt, p) => {
    const items = [['GOLD', GOLD], ['INCENSE', [200, 200, 220]], ['MYRRH', [170, 110, 160]]];
    items.forEach(([name, col], i) => {
      const k = ease(seg(p, i * 0.2, i * 0.2 + 0.2)); if (!k) return;
      const x = 18 + i * 40, y = 32;
      f.rect(x + 4, y, 12, 10, mix(col, k)); f.rect(x + 2, y - 2, 16, 3, mix([180, 140, 60], k));
      if (i === 1) for (let s = 0; s < 6; s++) f.set(x + 10 + Math.sin(lt / 300 + s) * 2, y - 4 - s * 2, mix([200, 200, 200], 1 - s / 6));
      f.center(name, y + 14, mix(WHITE, k), 1, x - 6, x + 26);
    });
  },
  // Lent
  lentCandle: (f, lt, p) => { const k = Math.sin(p * Math.PI); candle(f, 50, 46, 12, [240, 235, 220], true, lt); for (let r = 4; r < 14; r += 3) f.discAdd(51, 44, r, mix([255, 180, 90], 0.06 * k)); },
  lentLight: (f, lt, p) => { const k = Math.sin(p * Math.PI); for (let i = 0; i < 9; i++) f.lineAdd(21, 0, 1 + i * 5, 58, mix([255, 240, 200], 0.3 * k)); },
  lentDove: (f, lt, p) => dove(f, Math.round(-8 + p * 140), Math.round(20 + Math.sin(lt / 600) * 4), lt),
  // Palm Sunday
  donkey: (f, lt, p) => {
    const x = Math.round(-20 + p * 170), step = Math.floor(lt / 200) % 2, c = [130, 120, 110];
    f.rect(x, 44, 14, 5, c); f.rect(x + 13, 40, 3, 6, c); f.rect(x + 14, 39, 4, 3, c); f.rect(x + 13, 37, 1, 3, c);
    for (let i = 0; i < 4; i++) f.rect(x + 1 + i * 4 + (step && i % 2 ? 1 : 0), 49, 1, 5, c);
    for (let i = 0; i < 5; i++) { const cx = x - 12 - i * 9; if (cx > -4 && cx < W) f.rect(cx, 53, 7, 1, [[200, 50, 50], [60, 100, 200], [200, 160, 40]][i % 3]); }
  },
  palmWave: (f, lt, p) => { for (let i = 0; i < 7; i++) { const x = 14 + i * 16; person(f, x, 62, [[150, 60, 60], [60, 90, 160], [160, 130, 60]][i % 3], 1); const a = Math.sin(lt / 200 + i) * 0.6; f.line(x + 3, 52, x + 3 + Math.sin(a) * 8, 44, GREEN); f.line(x + 3 + Math.sin(a) * 8, 44, x + 6 + Math.sin(a) * 8, 46, GREEN); } },
  hosanna: (f, lt, p) => { for (let i = 0; i < 12; i++) if (p > i / 14) { const x = 6 + i * 10; f.line(x, 57, x + 8, 55, GREEN); for (let k = 0; k < 4; k++) { f.set(x + 2 + k * 2, 54 - (k % 2), GREEN); f.set(x + 2 + k * 2, 58, GREEN); } } if (p > 0.4) f.center('HOSANNA IN THE HIGHEST', 40, [120, 70, 20]); },
  // Holy Week (gentle)
  tenebrae: (f, lt, p) => { for (let i = 0; i < 7; i++) candle(f, 22 + i * 12, 44, 10, [240, 235, 220], p < (i + 1) / 8, lt, i); },
  holyLight: (f, lt, p) => { const k = Math.sin(p * Math.PI); for (let i = 0; i < 13; i++) f.lineAdd(64, 0, 34 + i * 5, 50, mix([255, 245, 220], 0.25 * k)); },
  quietStars: (f, lt, p) => stars(f, lt, Math.round(10 + p * 40), 46),
  // Ascension
  clouds: (f, lt, p) => { cloud(f, -20 + p * 170, 30, 1.3); cloud(f, 150 - p * 170, 8, 0.9); },
  rays: (f, lt, p) => { const k = Math.sin(p * Math.PI); for (let i = 0; i < 17; i++) f.lineAdd(64, -4, 64 + (i - 8) * 9, 64, mix([255, 250, 200], 0.3 * k)); },
  birds: (f, lt, p) => { for (let i = 0; i < 5; i++) { const x = 20 + i * 20 + Math.sin(lt / 400 + i) * 3, y = 60 - p * 70 + i * 4; const up = Math.floor(lt / 200 + i) % 2; f.line(x - 2, y - up, x, y, [40, 40, 60]); f.line(x, y, x + 2, y - up, [40, 40, 60]); } },
  // Pentecost
  wind: (f, lt, p) => { for (let i = 0; i < 6; i++) { const y = 10 + i * 8, x = (p * 200 + i * 30) % 180 - 30; for (let k = 0; k < 24; k++) f.add(x + k, y + Math.sin(k / 3 + i) * 2, mix(WHITE, 0.6 * (1 - k / 24))); } },
  tongues: (f, lt, p) => { for (let i = 0; i < 6; i++) { const x = 14 + i * 20; person(f, x, 62, [[180, 140, 100], [120, 90, 160], [90, 140, 120]][i % 3]); if (p > i * 0.1) flameTongue(f, x, 48, lt, i); } },
  doveDescend: (f, lt, p) => { const y = Math.round(-6 + ease(seg(p, 0, 0.6)) * 32); dove(f, 60, y, lt); if (p > 0.5) for (let i = 0; i < 7; i++) f.lineAdd(63, y + 3, 33 + i * 10, 60, mix([255, 240, 160], 0.3)); },
  // Reformation
  hammer: (f, lt, p) => {
    person(f, 52, 62, [40, 40, 40]);
    const up = Math.floor(lt / 300) % 2;
    f.line(54, 50, 58, up ? 40 : 46, BROWN); f.rect(56, up ? 38 : 44, 5, 2, [150, 150, 150]);
    if (!up && p > 0.15) f.text('TAP!', 64, 52, WHITE);
    if (p > 0.6) f.center('95 THESES', 52, GOLD, 1, 40, W);
  },
  roseGlow: (f, lt, p) => { const k = Math.sin(p * Math.PI); f.discAdd(84, 50, 20, mix(GOLD, 0.22 * k)); f.discAdd(84, 50, 15, mix(GOLD, 0.25 * k)); luthersRose(f, 84, 50); },
  solas: (f, lt, p) => {
    const list = ['GRACE ALONE', 'FAITH ALONE', 'SCRIPTURE ALONE', 'CHRIST ALONE', 'TO GOD BE THE GLORY'];
    const i = Math.min(4, Math.floor(p * 5));
    f.rect(40, 38, W - 40, 11, [35, 30, 35]);
    f.center(list[i], 40, [255, 230, 150], 1, 40, W);
  },
  // All Saints (gentle)
  moreCandles: (f, lt, p) => { for (let i = 0; i < 12; i++) if (p > i / 12) { f.discAdd(7 + i * 10, 48, 5, mix([255, 180, 80], 0.18)); f.discAdd(7 + i * 10, 48, 2.5, mix([255, 200, 120], 0.3)); } },
  shootingStar: (f, lt, p) => { const x = 140 - p * 170, y = 4 + p * 26; for (let i = 0; i < 12; i++) f.set(x + i * 2, y - i * 0.5, mix(WHITE, 1 - i / 12)); },
  halo: (f, lt, p) => { const k = Math.sin(p * Math.PI); for (let a = 0; a < Math.PI * 2; a += 0.03) f.add(64 + Math.cos(a) * (18 + k * 6), 34 + Math.sin(a) * (5 + k * 2), mix(GOLD, k)); },
  // MLK (gentle)
  handsJoin: (f, lt, p) => { const k = seg(p, 0.1, 0.6); for (let i = 0; i < 8; i++) if (k > i / 8) f.rect(12 + i * 13 + 2, 56, 9, 1, [255, 255, 255]); if (p > 0.6) f.center('TOGETHER', 34, [90, 40, 20], 2); },
  sunRise: (f, lt, p) => { const k = Math.sin(p * Math.PI); for (let i = 0; i < 12; i++) { const a = Math.PI + i / 11 * Math.PI; f.lineAdd(64, 64, 64 + Math.cos(a) * 70, 64 + Math.sin(a) * 70, mix([255, 255, 220], 0.3 * k)); } },
  peaceDove: (f, lt, p) => dove(f, Math.round(-8 + p * 140), Math.round(36 + Math.sin(lt / 600) * 4), lt),
  // Presidents' Day
  hats: (f, lt, p) => {
    const k = ease(seg(p, 0, 0.3));
    f.rect(25, 32 - k * 4, 14, 2, WHITE); f.rect(28, 18 - k * 4, 8, 14, [230, 230, 230]);          // stovepipe hat
    f.rect(85, 30 - k * 4, 22, 3, WHITE); f.disc(96, 27 - k * 4, 5, [230, 230, 230]);              // tricorn-ish
    if (p > 0.3) { f.center('LINCOLN', 40, GOLD, 1, 0, 64); f.center('WASHINGTON', 40, GOLD, 1, 64, W); }
  },
  coinFlip: (f, lt, p) => {
    const flip = Math.abs(Math.cos(lt / 120 * (1 - seg(p, 0.5, 0.7))));
    const y = 30 - Math.sin(seg(p, 0, 0.6) * Math.PI) * 18;
    f.disc(44, y, Math.max(1, 7 * flip), [190, 110, 60]); f.disc(84, y, Math.max(1, 8 * flip), [200, 200, 210]);
    if (p > 0.7) f.center('HEADS!', 50, GOLD, 2);
  },
  bigFlag: (f, lt) => flag(f, 0, 0, W, H, lt),
  // Memorial Day (gentle)
  poppies: (f, lt, p) => { for (let i = 0; i < 22; i++) if (p > i / 26) { const x = 3 + i * 6, y = 58 + (i % 2) * 2; f.line(x, y, x, y + 4, [40, 120, 40]); f.disc(x, y, 1.6, [220, 30, 30]); f.set(x, y, [20, 20, 20]); } },
  gentleWind: (f, lt, p) => { for (let i = 0; i < 4; i++) { const x = (p * 180 + i * 40) % 170 - 30, y = 8 + i * 6; for (let k = 0; k < 16; k++) f.add(x + k, y + Math.sin(k / 3) * 1.5, mix(WHITE, 0.4 * (1 - k / 16))); } },
  smallFlags: (f, lt, p) => { for (let i = 0; i < 8; i++) if (p > i / 10) { const x = 62 + i * 8; f.rect(x + 5, 40, 1, 10, [200, 200, 200]); f.rect(x + 6, 40, 4, 1, [200, 30, 40]); f.rect(x + 6, 41, 4, 1, WHITE); f.rect(x + 6, 42, 4, 1, [200, 30, 40]); f.rect(x + 6, 40, 2, 2, [30, 50, 140]); } },
  // Labor Day
  worker: (f, lt, p) => { person(f, 60, 54, [240, 140, 30]); f.rect(57, 42, 7, 2, [255, 220, 0]); const up = Math.floor(lt / 250) % 2; f.line(62, 48, 68, up ? 40 : 48, BROWN); f.rect(66, up ? 38 : 47, 4, 2, [160, 160, 170]); if (!up) f.text('TAP', 72, 46, WHITE); },
  grill: (f, lt, p) => {
    f.rect(48, 44, 32, 4, [40, 40, 40]); f.rect(52, 48, 2, 10, [40, 40, 40]); f.rect(74, 48, 2, 10, [40, 40, 40]);
    const flip = Math.floor(lt / 1500) % 2; [54, 62, 70].forEach((x, i) => f.rect(x, 40 - (flip && i === 1 ? 4 : 0), 5, 2, [120, 60, 30]));
    for (let s = 0; s < 3; s++) for (let i = 0; i < 8; i++) f.set(56 + s * 8 + Math.sin(i + lt / 300) * 1.5, 38 - i * 2 - ((lt / 100) % 2), mix([200, 200, 200], 1 - i / 8));
    if (p > 0.4) f.center('COOKOUT!', 2, [180, 40, 20], 2);
  },
  beachBall: (f, lt, p) => { const x = 10 + p * 108, y = 54 - Math.abs(Math.sin(p * Math.PI * 4)) * 30; f.disc(x, y, 5, WHITE); for (let a = 0; a < 6; a++) f.line(x, y, x + Math.cos(a + lt / 200) * 5, y + Math.sin(a + lt / 200) * 5, [[220, 40, 40], [40, 120, 220], [250, 210, 40]][a % 3]); f.center('LAST DAYS OF SUMMER', 36, [30, 50, 120]); },
  // Columbus Day
  fleet: (f, lt, p) => { for (let i = 0; i < 3; i++) ship(f, Math.round(-40 + p * 200 - i * 36), 28 + i, lt); },
  landHo: (f, lt, p) => { const k = ease(seg(p, 0, 0.4)); f.disc(110, 46 + (1 - k) * 10, 12, [200, 180, 110]); f.line(110, 38, 112, 26, BROWN); for (let i = 0; i < 4; i++) f.line(112, 26, 112 + Math.cos(i * 1.4) * 7, 26 + Math.sin(i * 1.4) * 3 + 2, GREEN); if (p > 0.4) f.center('LAND HO!', 20, [120, 40, 20], 2, 0, 96); },
  compass: (f, lt, p) => { f.disc(64, 34, 12, [220, 200, 150]); f.disc(64, 34, 10, [250, 240, 210]); const a = lt / 300 * (1 - p) + p * -Math.PI / 2; f.line(64, 34, 64 + Math.cos(a) * 9, 34 + Math.sin(a) * 9, RED); f.line(64, 34, 64 - Math.cos(a) * 7, 34 - Math.sin(a) * 7, [60, 60, 60]); f.text('N', 62, 20, [60, 60, 60]); },
  // Veterans Day (gentle)
  salute: (f, lt, p) => { const x = 86; f.rect(x - 2, 40, 5, 12, [60, 80, 50]); f.disc(x, 37, 2, SKIN); f.rect(x - 3, 34, 7, 2, [60, 80, 50]); if (p > 0.2) { f.line(x + 2, 41, x + 5, 38, [60, 80, 50]); f.set(x + 2, 36, SKIN); } f.rect(x - 2, 52, 2, 6, [60, 80, 50]); f.rect(x + 1, 52, 2, 6, [60, 80, 50]); },
  flyover: (f, lt, p) => { [[220, 40, 40], WHITE, [60, 100, 220]].forEach((c, i) => { const x = -20 + p * 170 - i * 4, y = 36 + i * 4; f.rect(x, y, 6, 1, [200, 200, 210]); f.set(x + 6, y, WHITE); f.set(x + 2, y - 1, [200, 200, 210]); for (let k = 1; k < 30; k++) f.set(x - k, y, mix(c, 0.8 * (1 - k / 30))); }); },
  branches: (f, lt, p) => { const list = ['ARMY', 'NAVY', 'AIR FORCE', 'MARINES', 'COAST GUARD', 'SPACE FORCE']; const i = Math.min(5, Math.floor(p * 6)); f.rect(0, 40, W, 24, [12, 18, 45]); f.center(list[i], 46, GOLD, list[i].length > 9 ? 1 : 2); },
};

export const EVENTS2 = {
  advent: [[S.adventStar, 9000], [S.adventAngel, 10000], [S.adventCalendar, 9000]],
  epiphany: [[S.caravan, 12000], [S.starShine, 8000], [S.gifts, 10000]],
  lent: [[S.lentCandle, 10000], [S.lentLight, 9000], [S.lentDove, 10000]],
  palmsunday: [[S.donkey, 11000], [S.palmWave, 8000], [S.hosanna, 6000]],
  goodfriday: [[S.tenebrae, 14000], [S.holyLight, 10000], [S.quietStars, 10000]],
  ascension: [[S.clouds, 10000], [S.rays, 9000], [S.birds, 9000]],
  pentecost: [[S.wind, 8000], [S.tongues, 10000], [S.doveDescend, 10000]],
  reformation: [[S.hammer, 9000], [S.roseGlow, 7000], [S.solas, 10000]],
  allsaints: [[S.moreCandles, 10000], [S.shootingStar, 5000], [S.halo, 8000]],
  mlk: [[S.handsJoin, 9000], [S.sunRise, 9000], [S.peaceDove, 10000]],
  presidents: [[S.hats, 8000], [S.coinFlip, 7000], [S.bigFlag, 7000]],
  memorial: [[S.poppies, 10000], [S.gentleWind, 9000], [S.smallFlags, 10000]],
  labor: [[S.worker, 7000], [S.grill, 9000], [S.beachBall, 8000]],
  columbus: [[S.fleet, 12000], [S.landHo, 8000], [S.compass, 7000]],
  veterans: [[S.salute, 9000], [S.flyover, 7000], [S.branches, 10000]],
};
