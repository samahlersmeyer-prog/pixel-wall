// One highlight reel per kid. Each kid has 3 scenes that cycle every SCENE ms.
// Max: pitching. Louie: hitting. Junie: animals. Josie: coloring + unicorns.
import { W, H, hsv } from './renderer.js?v=40';
import { fireworks } from './modes-holiday.js?v=40';

const SCENE = 6000;
const WHITE = [255, 255, 255], BLACK = [20, 20, 20], SKIN = [240, 190, 150], BROWN = [150, 100, 55];
const GRAY = [150, 150, 160], LEATHER = [140, 80, 30], RED = [210, 35, 45], GOLD = [255, 200, 40];
const PINK = [255, 110, 180], PURPLE = [170, 90, 255], SKY = [90, 170, 255];
const HAIR = { max: [150, 100, 55], louie: [150, 100, 55], junie: [235, 120, 70], josie: [250, 215, 110] };

const clamp = v => Math.max(0, Math.min(1, v));
const lerp = (a, b, p) => a + (b - a) * p;
const arc = (a, b, p, h) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p) - h * 4 * p * (1 - p)];
const blink = (t, ms = 150) => Math.floor(t / ms) % 2 === 0;
const rainbow = t => i => hsv(((t / 1500) + i * 0.12) % 1, 0.8, 1);

function label(f, s, x, y, c, sc = 2) { f.text(s, x + 1, y + 1, BLACK, sc); f.text(s, x, y, c, sc); }

// A kid, 12 wide x 27 tall, feet on `base`.
// o: { hair, long, shirt, pants, cap, pose: stand|up|wave|cock|throw|load|swing|follow, dy }
function kid(f, x, base, o) {
  x = Math.round(x); const T = Math.round(base - 26 + (o.dy || 0));
  const shirt = o.shirt, pants = o.pants || [40, 40, 60];
  if (o.long) { f.rect(x + 2, T, 8, 2, o.hair); f.rect(x + 2, T + 2, 1, 7, o.hair); f.rect(x + 9, T + 2, 1, 7, o.hair); }
  else f.rect(x + 3, T, 6, 2, o.hair);
  if (o.cap) { f.rect(x + 3, T, 6, 2, o.cap); f.rect(x + 9, T + 1, 2, 1, o.cap); }
  f.rect(x + 3, T + 2, 6, 5, SKIN); f.set(x + 4, T + 4, BLACK); f.set(x + 7, T + 4, BLACK);
  if (o.long) f.rect(x + 2, T + 2, 1, 7, o.hair), f.rect(x + 9, T + 2, 1, 7, o.hair);
  const p = o.pose || 'stand';
  const armL = () => f.rect(x, T + 7, 1, 8, SKIN), armR = () => f.rect(x + 11, T + 7, 1, 8, SKIN);
  if (p === 'up') { f.rect(x + 1, T - 6, 2, 13, SKIN); f.rect(x + 9, T - 6, 2, 13, SKIN); }
  else if (p === 'wave') { armL(); f.rect(x + 11, T - 4, 1, 11, SKIN); f.rect(x + 12, T - 5, 1, 2, SKIN); }
  else if (p === 'cock') { f.rect(x - 6, T + 8, 7, 2, SKIN); f.rect(x + 11, T + 8, 2, 3, LEATHER); }      // throwing arm back, glove out front
  else if (p === 'throw') { f.rect(x + 11, T + 6, 6, 2, SKIN); f.rect(x - 1, T + 9, 2, 3, LEATHER); }      // arm whipped forward
  else if (p === 'load') { armL(); armR(); f.line(x + 2, T + 8, x - 3, T - 3, LEATHER); }                // bat cocked
  else if (p === 'swing') { armL(); f.rect(x + 11, T + 10, 3, 2, SKIN); f.line(x + 13, T + 11, x + 25, T + 11, LEATHER); }
  else if (p === 'follow') { armL(); armR(); f.line(x + 8, T + 8, x + 15, T - 3, LEATHER); }
  else { armL(); armR(); }
  f.rect(x + 1, T + 7, 10, 11, shirt);
  if (o.dress) { f.rect(x, T + 15, 12, 5, shirt); f.rect(x + 2, T + 20, 3, 4, SKIN); f.rect(x + 7, T + 20, 3, 4, SKIN); }
  else { f.rect(x + 1, T + 18, 10, 5, pants); f.rect(x + 2, T + 23, 3, 2, o.socks || WHITE); f.rect(x + 7, T + 23, 3, 2, o.socks || WHITE); }
  f.rect(x + 1, T + 25, 4, 2, o.shoes || BLACK); f.rect(x + 7, T + 25, 4, 2, o.shoes || BLACK);
}

function baseball(f, x, y, r = 1) { f.disc(x, y, r, WHITE); if (r > 1) f.set(x, y - 1, RED); }

// ---------- baseball backdrops ----------
function nightField(f, t) {
  for (let y = 0; y < 30; y++) f.rect(0, y, W, 1, [4, 8 + y, 30 + y * 2]);
  for (let i = 0; i < 4; i++) { const lx = 10 + i * 36; f.rect(lx, 2, 6, 3, [255, 250, 210]); f.rect(lx + 2, 5, 2, 7, GRAY); }   // light towers
  for (let x = 0; x < W; x++) f.set(x, 13 + Math.round(Math.sin(x / 3 + t / 300)), [60 + (x * 37) % 80, 40, 60]);                 // crowd
  f.rect(0, 14, W, 8, [0, 70, 40]); f.rect(0, 22, W, 1, GOLD);                                                                      // outfield wall
  for (let y = 23; y < H; y++) for (let x = 0; x < W; x++) f.set(x, y, ((x >> 3) + (y >> 3)) % 2 ? [20, 130, 50] : [30, 150, 60]);
}
function sideDiamond(f) {
  for (let x = 4; x < 40; x++) { const h = Math.round(4 - Math.abs(x - 22) / 5); f.rect(x, 54 - h, 1, h + 3, [170, 110, 60]); }    // mound
  f.rect(18, 50, 8, 1, WHITE);                                                                                                       // rubber
  f.rect(90, 54, 38, 4, [170, 110, 60]); f.rect(106, 55, 6, 1, WHITE);                                                              // home dirt + plate
}
function catcher(f, x, pop) {
  f.rect(x, 40, 9, 5, [60, 60, 70]); f.rect(x + 1, 36, 6, 4, [90, 90, 100]); f.rect(x + 1, 45, 8, 6, [60, 60, 70]);
  f.rect(x - 4, 38 + (pop ? 1 : 0), 5, 5, LEATHER); f.rect(x - 3, 39 + (pop ? 1 : 0), 3, 3, [100, 55, 20]);
}

// One pitch over `len` ms: windup, release at 40%, ball reaches the mitt at 60%.
function pitch(f, k, len, maxX = 16, fire = false) {
  const q = k / len;
  const pose = q < 0.25 ? 'stand' : q < 0.38 ? 'cock' : 'throw';
  kid(f, maxX, 50, { hair: HAIR.max, cap: RED, shirt: WHITE, pants: [200, 200, 210], socks: RED, pose });
  const b = clamp((q - 0.4) / 0.2);
  if (q >= 0.4 && b < 1) {
    const x = lerp(32, 103, b), y = lerp(31, 40, b * b);
    if (fire) for (let i = 1; i < 10; i++) f.add(x - i * 2, y + Math.sin(i + k / 40), [255 - i * 20, 90 - i * 8, 0]);
    baseball(f, x, y, 1);
  }
  return q >= 0.6;
}

// ---------- MAX: pitching ----------
const MAX = [
  // strikeout: three pitches, batter whiffs, K's pile up
  (f, k, t) => {
    nightField(f, t); sideDiamond(f);
    const n = Math.floor(k / 2000), pk = k % 2000;
    const swing = pk > 1080 && pk < 1500;
    kid(f, 112, 54, { hair: [60, 40, 25], cap: [40, 60, 200], shirt: [40, 60, 200], pants: [200, 200, 210], pose: swing ? 'follow' : 'load' });
    const hit = pitch(f, pk, 2000);
    catcher(f, 98, hit && pk < 1400);
    label(f, 'MAX', 50, 25, WHITE);
    for (let i = 0; i < n + (hit ? 1 : 0); i++) f.text('K', 4 + i * 8, 15, RED);
    if (hit) f.center(n === 2 ? 'STRIKEOUT!' : `STRIKE ${n + 1}`, 43, n === 2 && blink(t) ? GOLD : WHITE, 1, 36, 96);
  },
  // radar gun: heater with a fire trail, speed counts up
  (f, k, t) => {
    nightField(f, t); sideDiamond(f);
    const n = Math.floor(k / 3000), pk = k % 3000;
    const hit = pitch(f, pk, 3000, 16, true);
    catcher(f, 98, hit);
    const mph = [71, 74][n];
    f.rect(52, 26, 44, 16, BLACK); f.rect(52, 26, 44, 1, RED);
    const shown = hit ? Math.min(mph, Math.round(mph * clamp((pk - 1800) / 500))) : 0;
    label(f, String(shown).padStart(2, '0'), 56, 28, [255, 80, 40]);
    f.text('MPH', 80, 33, WHITE);
    label(f, 'MAX', 54, 46, WHITE);
    if (shown === mph) f.center('HEAT!', 15, blink(t) ? [255, 120, 0] : GOLD, 1, 0, W);
  },
  // catcher's view: painting all four corners of the strike zone
  (f, k, t) => {
    for (let y = 0; y < H; y++) f.rect(0, y, W, 1, [8, 12, 24 + y / 2]);
    const zx = 44, zy = 10, zw = 39, zh = 45, cw = 13, ch = 15;
    const corners = [[0, 0], [2, 2], [2, 0], [0, 2]];
    const n = Math.min(3, Math.floor(k / 1300)), pk = k - n * 1300;
    for (let i = 0; i <= n; i++) {
      if (i === n && pk < 700) continue;
      const [cx, cy] = corners[i];
      f.rect(zx + cx * cw + 1, zy + cy * ch + 1, cw - 1, ch - 1, i === n && blink(t, 120) ? [80, 255, 140] : [20, 120, 60]);
    }
    for (let i = 0; i <= 3; i++) { f.rect(zx + i * cw, zy, 1, zh + 1, WHITE); f.rect(zx, zy + i * ch, zw + 1, 1, WHITE); }
    if (k < 5200 && pk < 700) {
      const [cx, cy] = corners[n], p = pk / 700;
      baseball(f, lerp(64, zx + cx * cw + 6, p), lerp(26, zy + cy * ch + 7, p), 1 + p * 3);
    }
    label(f, 'MAX', 4, 4, WHITE);
    f.text('K', 4, 24, RED); f.text(String(n + (pk >= 700 ? 1 : 0)), 12, 24, WHITE);
    if (k > 5200) f.center('PAINTED!', 57, blink(t) ? GOLD : WHITE, 1, 0, W); else f.text('CORNERS', 88, 28, GRAY);
  },
];

// ---------- LOUIE: hitting ----------
const LOUIE = [
  // the swing: pitch comes in, crack, ball leaves the yard, fireworks
  (f, k, t) => {
    nightField(f, t);
    f.rect(0, 54, 40, 4, [170, 110, 60]); f.rect(18, 55, 6, 1, WHITE); f.rect(96, 50, 20, 6, [170, 110, 60]);
    const pose = k < 1300 ? 'load' : k < 1500 ? 'swing' : 'follow';
    kid(f, 100, 52, { hair: [60, 40, 25], cap: [40, 60, 200], shirt: [40, 60, 200], pants: [200, 200, 210], pose: k > 500 && k < 900 ? 'throw' : 'stand' });
    kid(f, 14, 54, { hair: HAIR.louie, cap: [0, 120, 60], shirt: WHITE, pants: [200, 200, 210], socks: [0, 120, 60], pose });
    if (k > 800 && k < 1400) baseball(f, lerp(98, 30, (k - 800) / 600), 36, 1);
    if (k >= 1400 && k < 2600) baseball(f, ...arc([30, 36], [140, 0], (k - 1400) / 1200, 30), 1);
    if (k >= 1400 && k < 1600) for (let i = 0; i < 6; i++) f.set(30 + Math.cos(i) * 4, 36 + Math.sin(i) * 4, GOLD);   // crack!
    label(f, 'LOUIE', 38, 25, WHITE);
    if (k > 2400) { fireworks(f, t, null, 400, 24); f.center('HOME RUN!', 44, rainbow(t), 1, 36, 96); }
  },
  // outfield view: ball sails over the 400 sign, fielder leaps and misses, distance counts up
  (f, k, t) => {
    for (let y = 0; y < 30; y++) f.rect(0, y, W, 1, [4, 8 + y, 30 + y * 2]);
    for (let x = 0; x < W; x++) for (let y = 18; y < 26; y++) if ((x * 7 + y * 13) % 5 < 3) f.set(x, y, hsv(((x * 13 + y * 7) % 100) / 100, 0.5, 0.7));  // crowd
    if (k > 3000) for (let x = 0; x < W; x += 3) f.set(x, 17 - (Math.floor(t / 120 + x) % 2), WHITE);                               // arms up
    f.rect(0, 26, W, 12, [0, 70, 40]); f.rect(0, 38, W, 1, GOLD);
    f.rect(56, 28, 17, 9, [0, 50, 30]); f.text('400', 57, 29, WHITE);
    for (let y = 39; y < H; y++) for (let x = 0; x < W; x++) f.set(x, y, ((x >> 3) + (y >> 3)) % 2 ? [20, 130, 50] : [30, 150, 60]);
    const p = clamp(k / 3000);
    const leap = k > 2200 && k < 3000 ? -10 * Math.sin(Math.PI * (k - 2200) / 800) : 0;
    kid(f, 70, 62, { hair: [60, 40, 25], cap: [40, 60, 200], shirt: [40, 60, 200], pants: [200, 200, 210], pose: k > 2200 ? 'up' : 'stand', dy: leap });
    if (p < 1) baseball(f, ...arc([4, 63], [118, 6], p, 22), 1 + Math.round(2 * (1 - p)));
    label(f, 'LOUIE', 4, 2, WHITE);
    const ft = Math.round(412 * clamp(k / 3200));
    f.text(`${ft} FT`, W - f.textWidth(`${ft} FT`) - 3, 4, k > 3200 ? GOLD : WHITE);
    if (k > 3200) f.center('GONE!', 46, blink(t) ? GOLD : WHITE, 2);
  },
  // trot around the bases
  (f, k, t) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) f.set(x, y, ((x >> 3) + (y >> 3)) % 2 ? [20, 130, 50] : [30, 150, 60]);
    const C = [64, 33], R = 24, bases = [[C[0], C[1] + R], [C[0] + R, C[1]], [C[0], C[1] - R], [C[0] - R, C[1]]];
    for (let i = 0; i < 4; i++) { const a = bases[i], b = bases[(i + 1) % 4]; for (let s = 0; s <= 1; s += 0.02) f.rect(lerp(a[0], b[0], s) - 1, lerp(a[1], b[1], s) - 1, 3, 3, [170, 110, 60]); }
    f.disc(C[0], C[1], 3, [170, 110, 60]);
    bases.forEach(([x, y], i) => f.rect(x - 1, y - 1, 3, 3, i === 0 ? WHITE : [235, 235, 235]));
    const p = clamp(k / 5000) * 4, leg = Math.min(3, Math.floor(p)), s = p - leg;
    const a = bases[leg], b = bases[(leg + 1) % 4];
    const rx = lerp(a[0], b[0], p >= 4 ? 1 : s), ry = lerp(a[1], b[1], p >= 4 ? 1 : s);
    f.disc(rx, ry - 2, 2, SKIN); f.rect(rx - 2, ry - 4, 5, 2, [0, 120, 60]); f.rect(rx - 1, ry, 3, 3, WHITE);
    label(f, 'LOUIE', 2, 2, WHITE, 1);
    if (k < 5000) f.text('TOUCH EM ALL', 128 - f.textWidth('TOUCH EM ALL') - 2, 56, WHITE);
    else { f.center('SCORE!', 52, rainbow(t), 2); fireworks(f, t, null, 350, 30); }
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

function heart(f, x, y, c) { f.sprite(['.#.#.', '#####', '.###.', '..#..'], x, y, { '#': c }); }

const JUNIE = [
  // backyard fetch with the puppy
  (f, k, t) => {
    for (let y = 0; y < 40; y++) f.rect(0, y, W, 1, [110 + y, 180 + y, 255]);
    f.disc(112, 9, 6, GOLD);
    for (let y = 40; y < H; y++) f.rect(0, y, W, 1, [40, 160 - (y - 40), 60]);
    f.rect(20, 18, 4, 24, [110, 70, 35]); f.disc(22, 14, 10, [30, 120, 50]); f.disc(14, 18, 7, [30, 130, 55]); f.disc(30, 18, 7, [30, 130, 55]);
    kid(f, 34, 56, { hair: HAIR.junie, long: true, shirt: PINK, dress: true, shoes: [255, 255, 255], pose: k % 3000 < 400 ? 'throw' : 'stand' });
    const pk = k % 3000;
    const out = clamp(pk / 1200), back = clamp((pk - 1500) / 1200);
    const px = pk < 1500 ? lerp(48, 108, out) : lerp(108, 48, back);
    const flip = pk >= 1500;
    const legs = PUP_LEGS[Math.floor(t / 120) % 2];
    const rows = [...PUP, ...legs].map(r => flip ? [...r].reverse().join('') : r);
    f.sprite(rows, px, 50, PUP_PAL);
    if (pk > 300 && pk < 1300) f.disc(...arc([46, 34], [114, 52], (pk - 300) / 1000, 18), 1.5, [200, 255, 60]);
    if (pk >= 1300) f.disc(px + (flip ? 1 : 11), 52, 1.5, [200, 255, 60]);
    if (pk > 2600) heart(f, 46 + Math.sin(t / 100) * 2, 36 - (pk - 2600) / 40, PINK);
    label(f, 'JUNIE', 60, 22, WHITE);
  },
  // zoo parade
  (f, k, t) => {
    for (let y = 0; y < 44; y++) f.rect(0, y, W, 1, [120 + y, 190, 255]);
    for (let y = 44; y < H; y++) f.rect(0, y, W, 1, [200, 170, 100]);
    f.rect(4, 4, 62, 13, [110, 70, 35]); f.rect(5, 5, 60, 11, [60, 140, 60]); f.text('JUNIE ZOO', 8, 7, WHITE);
    const step = Math.floor(t / 180) % 2, off = (k / 20) % 200;
    const xs = [130 - off, 160 - off, 192 - off].map(x => x < -30 ? x + 200 : x);
    f.sprite([...ELEPHANT, ...ELE_LEGS[step]], xs[0], 48, ANIMAL_PAL);
    f.sprite([...GIRAFFE, ...GIR_LEGS[step]], xs[1], 41, ANIMAL_PAL);
    f.sprite([...LION, ...LION_LEGS[step]], xs[2], 52, ANIMAL_PAL);
    kid(f, 108, 62, { hair: HAIR.junie, long: true, shirt: PINK, dress: true, shoes: WHITE, pose: blink(t, 300) ? 'wave' : 'stand' });
    if (blink(t, 400)) heart(f, 120, 26, PINK);
  },
  // under the sea
  (f, k, t) => {
    for (let y = 0; y < H; y++) f.rect(0, y, W, 1, [0, 60 + y * 1.5, 140 + y]);
    for (let y = 56; y < H; y++) f.rect(0, y, W, 1, [220, 190, 120]);
    for (let x = 0; x < W; x++) if ((x * 7) % 11 === 0) f.set(x, 4 + Math.round(Math.sin(x / 5 + t / 400)), [150, 220, 255]);
    for (let s = 0; s < 3; s++) for (let y = 40; y < 56; y++) f.set(14 + s * 44 + Math.round(Math.sin(y / 3 + t / 300 + s) * 2), y, [40, 180, 80]);
    const fcols = [[255, 140, 0], [255, 220, 0], [255, 90, 140], [120, 255, 200]];
    for (let i = 0; i < 6; i++) {
      const x = ((t / (18 + i * 4)) + i * 40) % 150 - 10, y = 12 + i * 7 + Math.sin(t / 400 + i) * 2;
      f.sprite(FISH, x, y, { o: fcols[i % 4], k: BLACK });
    }
    const p = clamp((k % 3000) / 1800);
    if (p < 1) f.sprite(DOLPHIN, ...arc([-12, 30], [124, 30], p, 26), { b: [120, 140, 170], w: [220, 230, 240] });
    for (let i = 0; i < 8; i++) f.set(70 + i * 7 % 30, H - ((t / 20 + i * 9) % 50), [200, 240, 255]);
    label(f, 'JUNIE', 4, 44, WHITE);
  },
];

// ---------- JOSIE: coloring + unicorns ----------
const UNI = ['.................y', '................y.', '..............mww.', '.............mwwkw', '............mmwwwwww', '...........mmwwwwwwwp',
  '..........mmwww..ww', '..mm.....mmwww', '.mmmwwwwwwwwww', 'mmmwwwwwwwwwww', 'mm.wwwwwwwwwww', 'm..wwwwwwwwwww'];
const UNI_LEGS = [['...ww.ww...ww.ww', '...ww.ww...ww.ww', '...hh.hh...hh.hh'], ['..ww...ww.ww...ww', '..w.....w.w.....w', '..h.....h.h.....h']];
const uniPal = t => ({ w: WHITE, y: GOLD, k: BLACK, p: PINK, h: [180, 180, 200], m: hsv((t / 900) % 1, 0.6, 1) });

function crayon(f, x, y, c) {   // tip at (x, y), pointing down-left
  for (let i = 0; i < 9; i++) f.rect(x + 1 + i, y - 2 - i, 2, 2, i < 2 ? c.map(v => v * 0.7) : c);
  f.set(x, y, c);
}

const SHAPES = [
  { c: [255, 60, 90], inside: (u, v) => { const x = u * 1.3, y = -v * 1.3 + 0.3; return (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0; } },
  { c: [255, 210, 40], inside: (u, v) => { const a = Math.atan2(v, u), r = Math.hypot(u, v); return r < 0.45 + 0.5 * (0.5 + 0.5 * Math.cos(5 * (a + Math.PI / 2))) ** 3; } },
  { c: [180, 100, 255], inside: (u, v) => { const r = Math.hypot(u, v), a = Math.atan2(v, u); return r < 0.35 || r < 0.95 * Math.abs(Math.cos(3 * a)); } },
];

const JOSIE = [
  // coloring book: crayon fills in a heart, a star and a flower
  (f, k, t) => {
    f.clear([250, 245, 235]);
    for (let y = 6; y < H; y += 6) f.rect(0, y, W, 1, [225, 225, 240]);
    const n = Math.floor(k / 2000), s = SHAPES[n], p = clamp((k % 2000) / 1500);
    const cx = 92, cy = 32, R = 22;
    let tipX = cx - R, tipY = cy;
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const u = x / R, v = y / R;
      if (!s.inside(u, v)) continue;
      const edge = !s.inside((x + 1) / R, v) || !s.inside((x - 1) / R, v) || !s.inside(u, (y + 1) / R) || !s.inside(u, (y - 1) / R);
      const filled = (x + R) / (2 * R) < p;
      if (edge) f.set(cx + x, cy + y, BLACK);
      else if (filled) { f.set(cx + x, cy + y, s.c); if ((x + R) / (2 * R) > p - 0.03) { tipX = cx + x; tipY = cy + y; } }
    }
    if (p < 1) crayon(f, tipX, cy + Math.sin(k / 50) * 14, s.c);
    label(f, 'JOSIE', 4, 6, [255, 255, 255]);
    f.text('JOSIE', 4, 6, rainbow(t), 2);
    f.text('COLORS', 4, 26, [120, 120, 140]);
    if (p >= 1) f.text('PERFECT!', 4, 44, blink(t) ? s.c : BLACK);
  },
  // unicorn galloping under the stars with a rainbow trail
  (f, k, t) => {
    for (let y = 0; y < H; y++) f.rect(0, y, W, 1, [20 + y, 10, 60 + y]);
    for (let i = 0; i < 30; i++) if ((i + Math.floor(t / 300)) % 5) f.set((i * 53 + 7) % W, (i * 29) % 44, [255, 255, 200]);
    for (let i = 0; i < 4; i++) { const x = W - ((t / 25 + i * 40) % 170); f.disc(x, 56, 5, [230, 220, 255]); f.disc(x + 6, 55, 6, [240, 235, 255]); f.disc(x + 13, 57, 4, [230, 220, 255]); }
    const bob = Math.round(Math.sin(t / 120) * 2), ux = 40 + Math.sin(k / 900) * 14;
    for (let b = 0; b < 6; b++) for (let x = 0; x < ux + 2; x++) f.set(x, 34 + b + bob + Math.round(Math.sin((x + t / 20) / 6)), hsv(b / 6, 0.8, 1));
    f.sprite([...UNI, ...UNI_LEGS[Math.floor(t / 130) % 2]], ux, 26 + bob, uniPal(t));
    for (let i = 0; i < 5; i++) f.add(ux + 18 + Math.sin(t / 90 + i) * 6, 22 + bob + Math.cos(t / 110 + i) * 5, [120, 120, 60]);
    f.text('JOSIE', 128 - f.textWidth('JOSIE', 2) - 3, 4, rainbow(t), 2);
  },
  // Josie colors a rainbow, then the unicorn leaps over it
  (f, k, t) => {
    for (let y = 0; y < H; y++) f.rect(0, y, W, 1, [140 + y, 200, 255]);
    for (let y = 54; y < H; y++) f.rect(0, y, W, 1, [70, 190, 80]);
    const bands = 6, p = clamp(k / 2500) * bands;
    let tip = null;
    for (let b = 0; b < bands; b++) {
      const r = 30 - b * 2, shown = clamp(p - b);
      for (let a = 0; a <= shown * Math.PI; a += 0.01) {
        const x = 70 - Math.cos(a) * r, y = 54 - Math.sin(a) * r;
        f.rect(x, y, 2, 2, hsv(b / 6, 0.85, 1));
        if (b === Math.floor(p) || (b === bands - 1 && shown < 1)) tip = [x, y, hsv(b / 6, 0.85, 1)];
      }
    }
    f.disc(40, 52, 5, WHITE); f.disc(47, 51, 6, WHITE); f.disc(94, 52, 5, WHITE); f.disc(101, 51, 6, WHITE);
    kid(f, 6, 58, { hair: HAIR.josie, long: true, shirt: PURPLE, dress: true, shoes: PINK, pose: k < 2500 ? 'throw' : 'wave' });
    if (tip && k < 2500) crayon(f, tip[0], tip[1], tip[2]);
    if (k > 2700) {
      const q = clamp((k - 2700) / 2200), [x, y] = arc([20, 42], [130, 42], q, 30);
      f.sprite([...UNI, ...UNI_LEGS[1]], x - 10, y - 10, uniPal(t));
      for (let i = 1; i < 6; i++) f.add(x - 10 - i * 4, y + Math.sin(i) * 2, hsv((t / 400 + i / 6) % 1, 0.7, 0.6));
    }
    f.text('JOSIE', 4, 3, rainbow(t), 2);
  },
];

const REELS = { max: MAX, louie: LOUIE, junie: JUNIE, josie: JOSIE };

export function drawKid(f, who, t) {
  const reel = REELS[who];
  reel[Math.floor(t / SCENE) % reel.length](f, t % SCENE, t);
}
