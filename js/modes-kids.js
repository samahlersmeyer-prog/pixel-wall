// One highlight reel per kid, laid out like Theo's: action on the left,
// a name card on the right that flashes on every big moment.
// Max: pitching. Louie: hitting. Junie: animals. Josie: coloring + unicorns.
import { W, H, hsv } from './renderer.js?v=41';
import { fireworks } from './modes-holiday.js?v=41';
import { drawTheo } from './modes-theo.js?v=41';

const SCENE = 6000;
const WHITE = [255, 255, 255], BLACK = [20, 20, 20], SKIN = [240, 190, 150];
const GRAY = [150, 150, 160], LEATHER = [140, 80, 30], RED = [220, 40, 50], GOLD = [255, 200, 40];
const PINK = [255, 110, 180], PURPLE = [170, 90, 255], LIME = [60, 220, 120], DIRT = [170, 110, 60];
const HAIR = { max: [150, 100, 55], louie: [150, 100, 55], junie: [235, 120, 70], josie: [250, 215, 110] };
const OPP = { hair: [60, 40, 25], cap: [40, 60, 200], shirt: [40, 60, 200], pants: [200, 200, 210] };

const clamp = v => Math.max(0, Math.min(1, v));
const lerp = (a, b, p) => a + (b - a) * p;
const arc = (a, b, p, h) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p) - h * 4 * p * (1 - p)];
const blink = (t, ms = 150) => Math.floor(t / ms) % 2 === 0;
const rainbow = t => i => hsv(((t / 1500) + i * 0.12) % 1, 0.8, 1);
const label = (f, s, x, y, c, sc = 2) => { f.text(s, x + 1, y + 1, BLACK, sc); f.text(s, x, y, c, sc); };

const DIGITS = { 1: ['.#.', '##.', '.#.', '.#.', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'] };

// A kid, 12 wide x 27 tall, feet on `base`.
// o: { hair, long, shirt, pants, cap, num, dress, pose: stand|up|wave|cock|throw|load|swing|follow, dy }
function kid(f, x, base, o) {
  x = Math.round(x); const T = Math.round(base - 26 + (o.dy || 0));
  const hairSides = () => { f.rect(x + 2, T + 2, 1, 7, o.hair); f.rect(x + 9, T + 2, 1, 7, o.hair); };
  if (o.long) f.rect(x + 2, T, 8, 2, o.hair); else f.rect(x + 3, T, 6, 2, o.hair);
  if (o.cap) { f.rect(x + 3, T, 6, 2, o.cap); f.rect(x + 9, T + 1, 2, 1, o.cap); }
  f.rect(x + 3, T + 2, 6, 5, SKIN); f.set(x + 4, T + 4, BLACK); f.set(x + 7, T + 4, BLACK);
  if (o.long) hairSides();
  const p = o.pose || 'stand';
  const armL = () => f.rect(x, T + 7, 1, 8, SKIN), armR = () => f.rect(x + 11, T + 7, 1, 8, SKIN);
  if (p === 'up') { f.rect(x + 1, T - 6, 2, 13, SKIN); f.rect(x + 9, T - 6, 2, 13, SKIN); }
  else if (p === 'wave') { armL(); f.rect(x + 11, T - 4, 1, 11, SKIN); f.rect(x + 12, T - 5, 1, 2, SKIN); }
  else if (p === 'cock') { f.rect(x - 6, T + 8, 7, 2, SKIN); f.rect(x + 11, T + 8, 2, 3, LEATHER); }
  else if (p === 'throw') { f.rect(x + 11, T + 6, 6, 2, SKIN); f.rect(x - 1, T + 9, 2, 3, LEATHER); }
  else if (p === 'load') { armL(); armR(); f.line(x + 2, T + 8, x - 3, T - 3, LEATHER); }
  else if (p === 'swing') { armL(); f.rect(x + 11, T + 10, 3, 2, SKIN); f.line(x + 13, T + 11, x + 25, T + 11, LEATHER); }
  else if (p === 'follow') { armL(); armR(); f.line(x + 8, T + 8, x + 15, T - 3, LEATHER); }
  else { armL(); armR(); }
  f.rect(x + 1, T + 7, 10, 11, o.shirt);
  if (o.num) [...o.num].forEach((d, i) => f.sprite(DIGITS[d], x + 2 + i * 4, T + 9, { '#': o.numColor || RED }));
  if (o.dress) { f.rect(x, T + 15, 12, 5, o.shirt); f.rect(x + 2, T + 20, 3, 4, SKIN); f.rect(x + 7, T + 20, 3, 4, SKIN); }
  else { f.rect(x + 1, T + 18, 10, 5, o.pants || [40, 40, 60]); f.rect(x + 2, T + 23, 3, 2, o.socks || WHITE); f.rect(x + 7, T + 23, 3, 2, o.socks || WHITE); }
  f.rect(x + 1, T + 25, 4, 2, o.shoes || BLACK); f.rect(x + 7, T + 25, 4, 2, o.shoes || BLACK);
}
const MAXK = { hair: HAIR.max, cap: RED, shirt: WHITE, pants: [200, 200, 210], socks: RED, num: '17' };
const LOUK = { hair: HAIR.louie, cap: [0, 120, 60], shirt: WHITE, pants: [200, 200, 210], socks: [0, 120, 60] };

function baseball(f, x, y, r = 1) { f.disc(x, y, r, WHITE); if (r > 1) f.set(x, y - 1, RED); }
function grass(f, y0) { for (let y = y0; y < H; y++) for (let x = 0; x < W; x++) f.set(x, y, ((x >> 3) + (y >> 3)) % 2 ? [20, 130, 50] : [30, 150, 60]); }
function nightField(f, t) {
  for (let y = 0; y < 30; y++) f.rect(0, y, W, 1, [4, 8 + y, 30 + y * 2]);
  for (let i = 0; i < 4; i++) { const lx = 6 + i * 34; f.rect(lx, 2, 6, 3, [255, 250, 210]); f.rect(lx + 2, 5, 2, 7, GRAY); }
  for (let x = 0; x < W; x++) f.set(x, 13 + Math.round(Math.sin(x / 3 + t / 300)), [60 + (x * 37) % 80, 40, 60]);
  f.rect(0, 14, W, 8, [0, 70, 40]); f.rect(0, 22, W, 1, GOLD);
  grass(f, 23);
}
function burst(f, x, y, t, c = GOLD) { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = 3 + (t / 60) % 3; f.set(x + Math.cos(a) * r, y + Math.sin(a) * r, c); } }

// ---------- MAX: pitching ----------
function pitcherScene(f, t) {
  nightField(f, t);
  for (let x = 0; x < 30; x++) { const h = Math.round(4 - Math.abs(x - 10) / 5); f.rect(x, 54 - h, 1, h + 3, DIRT); }
  f.rect(5, 50, 8, 1, WHITE);
  f.rect(40, 54, 26, 4, DIRT); f.rect(50, 55, 6, 1, WHITE);
}
function catcher(f, x, pop) {
  f.rect(x, 40, 9, 5, [60, 60, 70]); f.rect(x + 1, 36, 6, 4, [90, 90, 100]); f.rect(x + 1, 45, 8, 6, [60, 60, 70]);
  f.rect(x - 4, 38 + (pop ? 1 : 0), 5, 5, LEATHER); f.rect(x - 3, 39 + (pop ? 1 : 0), 3, 3, [100, 55, 20]);
}
// One pitch over `len` ms: windup, release at 40%, ball pops the mitt at 60%. Returns true once it's in.
function pitch(f, k, len, fire = false) {
  const q = k / len;
  kid(f, 2, 50, { ...MAXK, pose: q < 0.25 ? 'stand' : q < 0.38 ? 'cock' : 'throw' });
  const b = clamp((q - 0.4) / 0.2);
  if (q >= 0.4 && b < 1) {
    const x = lerp(19, 47, b), y = lerp(31, 40, b * b);
    if (fire) for (let i = 1; i < 9; i++) f.add(x - i * 2, y + Math.sin(i + k / 40), [255 - i * 22, 90 - i * 9, 0]);
    baseball(f, x, y, 1);
  }
  return q >= 0.6;
}

const MAX = [
  (f, k, t) => {   // three-pitch strikeout
    pitcherScene(f, t);
    const n = Math.floor(k / 2000), pk = k % 2000;
    kid(f, 55, 54, { ...OPP, pose: pk > 1080 && pk < 1500 ? 'follow' : 'load' });
    const hit = pitch(f, pk, 2000);
    catcher(f, 52, hit && pk < 1400);
    for (let i = 0; i < n + (hit ? 1 : 0); i++) f.text('K', 2 + i * 7, 15, RED);
    return { hot: hit, call: n === 2 ? 'STRIKEOUT!' : `STRIKE ${n + 1}` };
  },
  (f, k, t) => {   // radar gun on a heater
    pitcherScene(f, t);
    const n = Math.floor(k / 3000), pk = k % 3000;
    const hit = pitch(f, pk, 3000, true);
    catcher(f, 52, hit);
    const mph = [71, 74][n], shown = hit ? Math.min(mph, Math.round(mph * clamp((pk - 1800) / 500))) : 0;
    f.rect(4, 0, 56, 16, BLACK); f.rect(4, 15, 56, 1, RED);
    label(f, String(shown).padStart(2, '0'), 9, 1, [255, 80, 40]);
    f.text('MPH', 36, 5, WHITE);
    return { hot: shown === mph, call: 'HEAT!', y: 25 };
  },
  (f, k, t) => {   // catcher's view: painting the corners
    for (let y = 0; y < H; y++) f.rect(0, y, W, 1, [8, 12, 24 + y / 2]);
    const zx = 12, zy = 11, cw = 11, ch = 13, corners = [[0, 0], [2, 2], [2, 0], [0, 2]];
    const n = Math.min(3, Math.floor(k / 1300)), pk = k - n * 1300, landed = pk >= 700;
    for (let i = 0; i <= n; i++) {
      if (i === n && !landed) continue;
      const [cx, cy] = corners[i];
      f.rect(zx + cx * cw + 1, zy + cy * ch + 1, cw - 1, ch - 1, i === n && blink(t, 120) ? [80, 255, 140] : [20, 120, 60]);
    }
    for (let i = 0; i <= 3; i++) { f.rect(zx + i * cw, zy, 1, 3 * ch + 1, WHITE); f.rect(zx, zy + i * ch, 3 * cw + 1, 1, WHITE); }
    if (k < 5200 && !landed) { const [cx, cy] = corners[n], p = pk / 700; baseball(f, lerp(29, zx + cx * cw + 5, p), lerp(30, zy + cy * ch + 6, p), 1 + p * 3); }
    f.text('K', 49, 24, RED); f.text(String(n + (landed ? 1 : 0)), 56, 24, WHITE);
    return { hot: landed && pk < 1300, call: k > 5200 ? 'PAINTED!' : 'CORNER!', y: 54 };
  },
];

// ---------- LOUIE: hitting ----------
const LOUIE = [
  (f, k, t) => {   // the swing
    nightField(f, t);
    f.rect(0, 54, 30, 4, DIRT); f.rect(12, 55, 6, 1, WHITE); f.rect(44, 50, 20, 6, DIRT);
    kid(f, 48, 52, { ...OPP, pose: k > 500 && k < 900 ? 'throw' : 'stand' });
    kid(f, 2, 54, { ...LOUK, pose: k < 1300 ? 'load' : k < 1500 ? 'swing' : 'follow' });
    if (k > 800 && k < 1400) baseball(f, lerp(46, 22, (k - 800) / 600), 39, 1);
    if (k >= 1400 && k < 2600) baseball(f, ...arc([22, 39], [150, -10], (k - 1400) / 1200, 20), 1);
    if (k >= 1400 && k < 1700) burst(f, 22, 39, t);
    if (k > 2400) fireworks(f, t, null, 400, 24);
    return { hot: k > 1400, call: k > 2400 ? 'HOME RUN!' : 'CRACK!' };
  },
  (f, k, t) => {   // outfield view: over the 400 sign
    for (let y = 0; y < 16; y++) f.rect(0, y, W, 1, [4, 8 + y, 30 + y * 3]);
    for (let x = 0; x < W; x++) for (let y = 16; y < 24; y++) if ((x * 7 + y * 13) % 5 < 3) f.set(x, y, hsv(((x * 13 + y * 7) % 100) / 100, 0.5, 0.7));
    const gone = k > 3000;
    if (gone) for (let x = 0; x < W; x += 3) f.set(x, 15 - (Math.floor(t / 120 + x) % 2), WHITE);
    f.rect(0, 24, W, 12, [0, 70, 40]); f.rect(0, 36, W, 1, GOLD);
    f.rect(20, 26, 19, 9, [0, 50, 30]); f.text('400', 21, 27, WHITE);
    grass(f, 37);
    const leap = k > 2200 && k < 3000 ? -10 * Math.sin(Math.PI * (k - 2200) / 800) : 0;
    kid(f, 34, 60, { ...OPP, pose: k > 2200 ? 'up' : 'stand', dy: leap });
    const p = clamp(k / 3000);
    if (p < 1) baseball(f, ...arc([0, 63], [62, 4], p, 16), 1 + Math.round(2 * (1 - p)));
    label(f, `${Math.round(412 * clamp(k / 3200))} FT`, 2, 56, gone ? GOLD : WHITE, 1);
    return { hot: gone, call: 'GONE!' };
  },
  (f, k, t) => {   // trot around the bases
    grass(f, 0);
    const C = [32, 34], R = 21, bases = [[C[0], C[1] + R], [C[0] + R, C[1]], [C[0], C[1] - R], [C[0] - R, C[1]]];
    for (let i = 0; i < 4; i++) { const a = bases[i], b = bases[(i + 1) % 4]; for (let s = 0; s <= 1; s += 0.03) f.rect(lerp(a[0], b[0], s) - 1, lerp(a[1], b[1], s) - 1, 3, 3, DIRT); }
    f.disc(C[0], C[1], 3, DIRT);
    bases.forEach(([x, y]) => f.rect(x - 1, y - 1, 3, 3, WHITE));
    const p = clamp(k / 4500) * 4, leg = Math.min(3, Math.floor(p)), s = p >= 4 ? 1 : p - leg;
    const a = bases[leg], b = bases[(leg + 1) % 4], rx = lerp(a[0], b[0], s), ry = lerp(a[1], b[1], s);
    f.disc(rx, ry - 2, 2, SKIN); f.rect(rx - 2, ry - 4, 5, 2, [0, 120, 60]); f.rect(rx - 1, ry, 3, 3, WHITE);
    const touched = Math.floor(p) > 0 && p - Math.floor(p) < 0.15;
    if (touched) burst(f, rx, ry, t, WHITE);
    if (k > 4500) fireworks(f, t, null, 350, 30);
    return { hot: k > 4500 || touched, call: k > 4500 ? 'SCORE!' : ['', '1ST!', '2ND!', '3RD!'][leg] };
  },
];

// ---------- JUNIE: animals ----------
const PUP = ['........dd..', 'b......dbbkb', '.b.....bbbbbk', '.bbbbbbbbbb..', '..bbbbbbbb...'];
const PUP_LEGS = [['..b.b..b.b..'], ['...b.b..b.b.']];
const PUP_PAL = { b: [190, 130, 70], d: [110, 70, 35], k: BLACK };
const ELEPHANT = ['.....ggggggggg....', '...ggggggggggggg..', '..ggkggggggggggggg', '.ggggggggggggggggg', '.ggggggggggggggggg',
  '.g.ggggggggggggggg', '.g.gggggggggggggg.g', '.g.ggggggggggggg..'];
const ELE_LEGS = [['.g..gg.gg..gg.gg..', 'gg..gg.gg..gg.gg..', '....gg.gg..gg.gg..'], ['.g...gg.gg..gg.gg.', 'gg...gg.gg..gg.gg.', '.....gg.gg..gg.gg.']];
const GIRAFFE = ['.oo.........', '.yy.........', 'yyyy........', 'kyyyy.......', 'yyyyy.......', '..yy........', '..yo........', '..yy........',
  '..oy........', '..yy........', '..yyyyyyyyy.', '..yoyyoyyoyy', '..yyyoyyyyo.', '..yyyyyoyyy.'];
const GIR_LEGS = [['..yy.....yy.', '..yy.....yy.', '..yy.....yy.', '..kk.....kk.'], ['...yy...yy..', '...yy...yy..', '...yy...yy..', '...kk...kk..']];
const LION = ['.ooooo.........', 'ooyyyoo........', 'oykyyyo.yyyyy..', 'ooyyyooyyyyyyyo', '.ooooo.yyyyyyy.'];
const LION_LEGS = [['...yy..yyyyyyy.', '...yy..yy...yy.'], ['...yy..yyyyyyy.', '....yy..yy..yy.']];
const ANIMAL_PAL = { g: [140, 140, 155], y: [240, 200, 80], o: [200, 110, 30], k: BLACK };
const FISH = ['o.ooo.', 'ooooko', 'o.ooo.'];
const DOLPHIN = ['.......b....', '....bbbb....', '.bbbbbbbbb..', 'bbbwwwwbbbbb', 'b....wwww...'];
const JUNK = { hair: HAIR.junie, long: true, shirt: PINK, dress: true, shoes: WHITE };
const heart = (f, x, y, c) => f.sprite(['.#.#.', '#####', '.###.', '..#..'], x, y, { '#': c });

const JUNIE = [
  (f, k, t) => {   // backyard fetch
    for (let y = 0; y < 40; y++) f.rect(0, y, W, 1, [110 + y, 180 + y, 255]);
    f.disc(58, 8, 5, GOLD);
    for (let y = 40; y < H; y++) f.rect(0, y, W, 1, [40, 160 - (y - 40), 60]);
    f.rect(6, 18, 4, 24, [110, 70, 35]); f.disc(8, 14, 9, [30, 120, 50]); f.disc(2, 19, 6, [30, 130, 55]); f.disc(15, 19, 6, [30, 130, 55]);
    const pk = k % 3000;
    kid(f, 14, 56, { ...JUNK, pose: pk < 400 ? 'throw' : pk > 2600 ? 'up' : 'stand' });
    const back = pk >= 1500, px = back ? lerp(52, 26, clamp((pk - 1500) / 1100)) : lerp(26, 52, clamp(pk / 1100));
    const rows = [...PUP, ...PUP_LEGS[Math.floor(t / 120) % 2]].map(r => back ? [...r].reverse().join('') : r);
    f.sprite(rows, px, 50, PUP_PAL);
    if (pk > 300 && pk < 1200) f.disc(...arc([28, 34], [60, 52], (pk - 300) / 900, 18), 1.5, [200, 255, 60]);
    if (pk >= 1200) f.disc(px + (back ? 1 : 11), 52, 1.5, [200, 255, 60]);
    if (pk > 2600) { heart(f, 17 + Math.sin(t / 100) * 2, 20 - (pk - 2600) / 50, PINK); heart(f, 30, 40 - (pk - 2600) / 60, PINK); }
    return { hot: pk > 2600, call: 'GOOD PUP!' };
  },
  (f, k, t) => {   // zoo parade
    for (let y = 0; y < 44; y++) f.rect(0, y, W, 1, [120 + y, 190, 255]);
    for (let y = 44; y < H; y++) f.rect(0, y, W, 1, [200, 170, 100]);
    for (let x = 0; x < W; x += 6) { f.rect(x, 36, 1, 8, [110, 70, 35]); } f.rect(0, 37, W, 1, [110, 70, 35]); f.rect(0, 41, W, 1, [110, 70, 35]);
    const step = Math.floor(t / 180) % 2, off = (k / 18) % 210;
    const xs = [130 - off, 162 - off, 196 - off].map(x => x < -30 ? x + 210 : x);
    f.sprite([...ELEPHANT, ...ELE_LEGS[step]], xs[0], 48, ANIMAL_PAL);
    f.sprite([...GIRAFFE, ...GIR_LEGS[step]], xs[1], 41, ANIMAL_PAL);
    f.sprite([...LION, ...LION_LEGS[step]], xs[2], 52, ANIMAL_PAL);
    const near = xs.some(x => x > 10 && x < 30);
    kid(f, 2, 62, { ...JUNK, pose: near ? 'wave' : 'stand' });
    if (near) heart(f, 6, 28 - (t / 60) % 8, PINK);
    return { hot: near, call: 'HELLO!' };
  },
  (f, k, t) => {   // under the sea
    for (let y = 0; y < H; y++) f.rect(0, y, W, 1, [0, 60 + y * 1.5, 140 + y]);
    for (let y = 56; y < H; y++) f.rect(0, y, W, 1, [220, 190, 120]);
    for (let x = 0; x < W; x++) if ((x * 7) % 11 === 0) f.set(x, 4 + Math.round(Math.sin(x / 5 + t / 400)), [150, 220, 255]);
    for (let s = 0; s < 4; s++) for (let y = 40; y < 56; y++) f.set(6 + s * 32 + Math.round(Math.sin(y / 3 + t / 300 + s) * 2), y, [40, 180, 80]);
    const fcols = [[255, 140, 0], [255, 220, 0], [255, 90, 140], [120, 255, 200]];
    for (let i = 0; i < 6; i++) f.sprite(FISH, ((t / (18 + i * 4)) + i * 40) % 150 - 10, 14 + i * 7 + Math.sin(t / 400 + i) * 2, { o: fcols[i % 4], k: BLACK });
    const pk = k % 3000, p = clamp(pk / 1800);
    if (p < 1) f.sprite(DOLPHIN, ...arc([-12, 30], [52, 30], p, 26), { b: [120, 140, 170], w: [220, 230, 240] });
    else for (let i = 0; i < 8; i++) f.set(56 + Math.cos(i) * (pk - 1800) / 60, 32 - Math.abs(Math.sin(i)) * (pk - 1800) / 50, [200, 240, 255]);
    for (let i = 0; i < 8; i++) f.set(20 + (i * 7) % 30, H - ((t / 20 + i * 9) % 50), [200, 240, 255]);
    return { hot: p >= 1, call: 'SPLASH!' };
  },
];

// ---------- JOSIE: coloring + unicorns ----------
const UNI = ['.................y', '................y.', '..............mww.', '.............mwwkw', '............mmwwwwww', '...........mmwwwwwwwp',
  '..........mmwww..ww', '..mm.....mmwww', '.mmmwwwwwwwwww', 'mmmwwwwwwwwwww', 'mm.wwwwwwwwwww', 'm..wwwwwwwwwww'];
const UNI_LEGS = [['...ww.ww...ww.ww', '...ww.ww...ww.ww', '...hh.hh...hh.hh'], ['..ww...ww.ww...ww', '..w.....w.w.....w', '..h.....h.h.....h']];
const uniPal = t => ({ w: WHITE, y: GOLD, k: BLACK, p: PINK, h: [180, 180, 200], m: hsv((t / 900) % 1, 0.6, 1) });
const JOSK = { hair: HAIR.josie, long: true, shirt: PURPLE, dress: true, shoes: PINK };

function crayon(f, x, y, c) { for (let i = 0; i < 9; i++) f.rect(x + 1 + i, y - 2 - i, 2, 2, i < 2 ? c.map(v => v * 0.7) : c); f.set(x, y, c); }

const SHAPES = [
  { c: [255, 60, 90], inside: (u, v) => { const x = u * 1.3, y = -v * 1.3 + 0.3; return (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0; } },
  { c: [180, 100, 255], inside: (u, v) => { const r = Math.hypot(u, v), a = Math.atan2(v, u); return r < 0.35 || r < 0.95 * Math.abs(Math.cos(3 * a)); } },
  { c: [255, 210, 40], inside: (u, v) => { const a = Math.atan2(v, u), r = Math.hypot(u, v); return r < 0.45 + 0.5 * (0.5 + 0.5 * Math.cos(5 * (a + Math.PI / 2))) ** 3; } },
];

const JOSIE = [
  (f, k, t) => {   // coloring book
    f.clear([60, 30, 90]);
    f.rect(1, 2, 62, 61, [250, 245, 235]);
    for (let y = 8; y < 63; y += 6) f.rect(1, y, 62, 1, [225, 225, 240]);
    const s = SHAPES[Math.floor(k / 2000)], p = clamp((k % 2000) / 1500), cx = 32, cy = 36, R = 20;
    let tip = [cx - R, cy];
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const u = x / R, v = y / R;
      if (!s.inside(u, v)) continue;
      const edge = !s.inside((x + 1) / R, v) || !s.inside((x - 1) / R, v) || !s.inside(u, (y + 1) / R) || !s.inside(u, (y - 1) / R);
      if (edge) f.set(cx + x, cy + y, BLACK);
      else if ((x + R) / (2 * R) < p) { f.set(cx + x, cy + y, s.c); tip = [cx + x, cy + y]; }
    }
    if (p < 1) crayon(f, tip[0], cy + Math.sin(k / 50) * 14, s.c);
    else for (let i = 0; i < 4; i++) f.add(cx + Math.sin(t / 90 + i * 2) * 18, cy + Math.cos(t / 110 + i * 2) * 16, [120, 120, 80]);
    return { hot: p >= 1, call: 'PERFECT!', y: 4 };
  },
  (f, k, t) => {   // unicorn gallop
    for (let y = 0; y < H; y++) f.rect(0, y, W, 1, [20 + y, 10, 60 + y]);
    for (let i = 0; i < 30; i++) if ((i + Math.floor(t / 300)) % 5) f.set((i * 53 + 7) % W, (i * 29) % 44, [255, 255, 200]);
    for (let i = 0; i < 4; i++) { const x = W - ((t / 25 + i * 40) % 170); f.disc(x, 56, 5, [230, 220, 255]); f.disc(x + 6, 55, 6, [240, 235, 255]); f.disc(x + 13, 57, 4, [230, 220, 255]); }
    const leap = k % 3000 > 2000, bob = leap ? -Math.round(10 * Math.sin(Math.PI * (k % 3000 - 2000) / 1000)) : Math.round(Math.sin(t / 120) * 2);
    const ux = 26 + Math.sin(k / 900) * 6;
    for (let b = 0; b < 6; b++) for (let x = 0; x < ux + 2; x++) f.set(x, 34 + b + bob + Math.round(Math.sin((x + t / 20) / 6)), hsv(b / 6, 0.8, 1));
    f.sprite([...UNI, ...UNI_LEGS[leap ? 1 : Math.floor(t / 130) % 2]], ux, 26 + bob, uniPal(t));
    for (let i = 0; i < 5; i++) f.add(ux + 18 + Math.sin(t / 90 + i) * 6, 22 + bob + Math.cos(t / 110 + i) * 5, [120, 120, 60]);
    return { hot: leap, call: 'WHEEE!' };
  },
  (f, k, t) => {   // Josie colors a rainbow, the unicorn leaps it
    for (let y = 0; y < H; y++) f.rect(0, y, W, 1, [140 + y, 200, 255]);
    for (let y = 54; y < H; y++) f.rect(0, y, W, 1, [70, 190, 80]);
    const p = clamp(k / 2500) * 6;
    let tip = null;
    for (let b = 0; b < 6; b++) {
      const r = 24 - b * 2, shown = clamp(p - b), c = hsv(b / 6, 0.85, 1);
      for (let a = 0; a <= shown * Math.PI; a += 0.012) {
        const x = 38 - Math.cos(a) * r, y = 54 - Math.sin(a) * r;
        f.rect(x, y, 2, 2, c);
        if (b === Math.min(5, Math.floor(p))) tip = [x, y, c];
      }
    }
    f.disc(16, 52, 4, WHITE); f.disc(21, 51, 5, WHITE); f.disc(56, 52, 4, WHITE); f.disc(61, 51, 5, WHITE);
    kid(f, 0, 60, { ...JOSK, pose: k < 2500 ? 'throw' : 'wave' });
    if (tip && k < 2500) crayon(f, tip[0], tip[1], tip[2]);
    const q = clamp((k - 2700) / 2200);
    if (k > 2700 && q < 1) {
      const [x, y] = arc([4, 44], [76, 44], q, 30);
      f.sprite([...UNI, ...UNI_LEGS[1]], x - 10, y - 10, uniPal(t));
      for (let i = 1; i < 6; i++) f.add(x - 10 - i * 4, y + Math.sin(i) * 2, hsv((t / 400 + i / 6) % 1, 0.7, 0.6));
    }
    return { hot: k > 2700, call: 'MAGIC!', y: 1 };
  },
];

// ---------- the name card (right side, like Theo's) ----------
const ICONS = {
  ball: { rows: ['..www..', '.rwwwr.', 'wrwwwrw', 'wrwwwrw', 'wrwwwrw', '.rwwwr.', '..www..'], pal: { w: WHITE, r: RED } },
  paw: { rows: ['#.#.#', '#.#.#', '.....', '.###.', '#####', '#####', '.###.'], pal: { '#': PINK } },
  uni: { rows: ['....y..', '...yw..', '..mwww.', '.mwwkw.', 'mmwwwwp', 'm.ww...', '..ww...'], pal: null },
};
const CARDS = {
  max: { name: 'MAX', num: '#17', color: RED, sub: 'MAD APPLE', reel: MAX },
  louie: { name: 'LOUIE', icon: 'ball', color: LIME, sub: 'SLUGGER', reel: LOUIE },
  junie: { name: 'JUNIE', icon: 'paw', color: PINK, sub: 'ANIMALS', reel: JUNIE },
  josie: { name: 'JOSIE', icon: 'uni', color: PURPLE, sub: 'UNICORNS', reel: JOSIE, rainbowName: true },
};

function card(f, c, hot, t) {
  const tx = (w, sc) => 66 + Math.round((60 - f.textWidth(w, sc)) / 2);
  label(f, c.name, tx(c.name, 2), 5, c.rainbowName ? rainbow(t) : WHITE);
  const flash = hot && blink(t, 120);
  if (c.num) label(f, c.num, tx(c.num, 2), 24, flash ? WHITE : c.color);
  else {
    const ic = ICONS[c.icon], pal = ic.pal || uniPal(t);
    const y = 24 - (hot ? Math.round(Math.abs(Math.sin(t / 120)) * 3) : 0);
    const ix = 96 - ic.rows[0].length;
    f.sprite(ic.rows, ix + 1, y + 1, Object.fromEntries(Object.keys(pal).map(k => [k, BLACK])), 2);
    f.sprite(ic.rows, ix, y, pal, 2);
  }
  f.text(c.sub, tx(c.sub, 1), 43, hot ? c.color : WHITE);
}

export function drawKid(f, who, t) {
  const c = CARDS[who];
  const r = c.reel[Math.floor(t / SCENE) % c.reel.length](f, t % SCENE, t) || {};
  if (r.hot && r.call) { const w = f.textWidth(r.call); label(f, r.call, Math.round((64 - w) / 2), r.y ?? 1, blink(t) ? GOLD : WHITE, 1); }
  card(f, c, r.hot, t);
}

// All the kids, one after another: each plays its whole reel.
const ALL = [['theo', 16000], ['max', 18000], ['louie', 18000], ['junie', 18000], ['josie', 18000]];
const ALL_LEN = ALL.reduce((a, [, d]) => a + d, 0);
export function drawAllKids(f, t) {
  let k = t % ALL_LEN;
  for (const [who, d] of ALL) {
    if (k < d) return who === 'theo' ? drawTheo(f, k) : drawKid(f, who, k);
    k -= d;
  }
}
