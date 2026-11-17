// Surprise scenes that play every so often on each holiday theme
// (Santa flies by, a snowman gets built, a ghost says BOO...).
// Every scene is drawn from the time alone, so it looks the same on every screen.
import { W, H, hsv } from './renderer.js';
import { fireworks } from './modes-holiday.js';

const rnd = n => { const x = Math.sin(n * 78.233) * 43758.5453; return x - Math.floor(x); };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = p => p * p * (3 - 2 * p);
const seg = (p, a, b) => clamp((p - a) / (b - a)); // 0..1 progress inside [a, b]

const WHITE = [255, 255, 255], SNOW = [235, 240, 255], BLACK_ISH = [25, 25, 30], SKIN = [255, 200, 160];
const RED = [230, 30, 30], GOLD = [255, 200, 40], BROWN = [140, 80, 35], ORANGE = [255, 130, 0], GREEN = [40, 200, 70];

function kid(f, x, y, coat, hat, arm = 0, wave = false) {
  f.rect(x - 1, y - 6, 3, 5, coat);                 // body
  f.set(x - 1, y - 1, [60, 60, 90]); f.set(x + 1, y - 1, [60, 60, 90]); f.set(x - 1, y, [60, 60, 90]); f.set(x + 1, y, [60, 60, 90]);
  f.disc(x, y - 9, 1.6, SKIN);                      // head
  f.rect(x - 2, y - 12, 5, 2, hat);                 // hat
  // arm: 0 = down, 1 = up/throwing
  if (arm > 0.5 || wave) { f.set(x + 2, y - 7, coat); f.set(x + 3, y - 8, coat); f.set(x + 3, y - 9, coat); }
  else { f.set(x + 2, y - 5, coat); f.set(x + 2, y - 4, coat); }
  f.set(x - 2, y - 5, coat); f.set(x - 2, y - 4, coat);
}

function splat(f, x, y, p, c = SNOW) {
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, d = 1 + p * 5;
    f.set(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, c.map(v => v * (1 - p * 0.7)));
  }
}

// ---------------- Christmas ----------------
const SLEIGH = ['...W....', '..RRR...', '..SSW...', '.WWWW...', 'GRRRRRGG', 'GRRRRRRG', '.GGGGGG.', 'GGGGGGGGG'];
const DEER = [['......B.B', '.......BB', '.BBBBBBBr', 'BBBBBBB..', 'B.B...B.B'], ['......B.B', '.......BB', '.BBBBBBBr', 'BBBBBBB..', '.B.B.B.B.']];

function santa(f, lt, p, ctx) {
  const x = -46 + p * (W + 60), y = 10 + Math.sin(lt / 300) * 3;
  // sparkle trail
  for (let i = 0; i < 18; i++) {
    const tx = x - 4 - i * 3, ty = y + 6 + Math.sin((lt / 200) + i) * 2;
    if (rnd(i + Math.floor(lt / 90)) > 0.4) f.set(tx, ty, [255, 230, 120].map(v => v * (1 - i / 18)));
  }
  f.sprite(SLEIGH, Math.round(x), Math.round(y), { W: WHITE, R: RED, S: SKIN, G: GOLD });
  const leg = Math.floor(lt / 150) % 2;
  f.line(x + 8, y + 5, x + 14, y + 4, [180, 140, 90]);
  f.sprite(DEER[leg], Math.round(x + 14), Math.round(y + 1), { B: BROWN, r: RED });
  f.sprite(DEER[1 - leg], Math.round(x + 25), Math.round(y - 1), { B: BROWN, r: Math.floor(lt / 250) % 2 ? RED : [255, 120, 120] });
  // presents drop from the sleigh
  for (let k = 0; k < 3; k++) {
    const t0 = 0.25 + k * 0.2;
    if (p < t0) continue;
    const dropX = -46 + t0 * (W + 60) + 4;
    const fall = clamp((p - t0) * 9);
    const py = 18 + ease(fall) * 38;
    const c = [[220, 40, 40], [40, 160, 255], [60, 200, 90]][k];
    f.rect(Math.round(dropX), Math.round(py), 5, 4, c);
    f.rect(Math.round(dropX) + 2, Math.round(py), 1, 4, GOLD);
  }
  if (p > 0.35 && p < 0.8) f.center('HO HO HO!', 36, Math.floor(lt / 300) % 2 ? RED : WHITE, 2);
}

function snowman(f, lt, p) {
  const cx = 64;
  const ground = 60;
  f.rect(0, ground + 1, W, 3, SNOW.map(v => v * 0.7));
  const b = ease(seg(p, 0.02, 0.18)), m = ease(seg(p, 0.18, 0.32)), h = ease(seg(p, 0.32, 0.44));
  // a kid rolls each ball in from the left
  const rolling = p < 0.44;
  if (rolling) kid(f, 20 + Math.sin(lt / 120) * 2, ground, [60, 120, 255], RED, 0);
  if (b > 0) f.disc(cx, ground - 9 * b, 9 * b, SNOW);
  if (m > 0) f.disc(cx, ground - 18 - 6 * m, 6 * m, SNOW);
  if (h > 0) f.disc(cx, ground - 30 - 4 * h, 4 * h, SNOW);
  const hatDrop = seg(p, 0.44, 0.54);
  if (hatDrop > 0) {
    const hy = -10 + ease(hatDrop) * (ground - 38 + 10);
    f.rect(cx - 3, hy, 7, 1, BLACK_ISH); f.rect(cx - 2, hy - 4, 5, 4, BLACK_ISH); f.rect(cx - 2, hy - 1, 5, 1, RED);
  }
  if (p > 0.56) { f.set(cx - 1, ground - 35, BLACK_ISH); f.set(cx + 1, ground - 35, BLACK_ISH); f.set(cx + 2, ground - 33, ORANGE); f.set(cx + 3, ground - 33, ORANGE); }
  if (p > 0.6) for (let i = 0; i < 3; i++) f.set(cx, ground - 27 + i * 3, BLACK_ISH);
  if (p > 0.64) {
    const wave = p > 0.72 ? Math.sin(lt / 160) * 3 : 0;
    f.line(cx - 6, ground - 24, cx - 13, ground - 29, BROWN);
    f.line(cx + 6, ground - 24, cx + 13, ground - 29 + wave, BROWN);
  }
  if (p > 0.72) {
    f.text('SNOW DAY!', 4, 6, [120, 200, 255], 2);
    kid(f, 100, ground, [60, 120, 255], RED, 1, Math.floor(lt / 200) % 2 === 0);
  }
}

function snowballFight(f, lt, p) {
  const ground = 58;
  f.rect(0, ground + 1, W, 5, SNOW.map(v => v * 0.6));
  // snow forts
  f.disc(22, ground + 2, 7, SNOW.map(v => v * 0.85)); f.disc(106, ground + 2, 7, SNOW.map(v => v * 0.85));
  const throwEvery = 1100, k = Math.floor(lt / throwEvery), q = (lt % throwEvery) / throwEvery;
  const fromLeft = k % 2 === 0;
  const hitKid = k % 3 === 2;
  kid(f, 12, ground, [220, 50, 50], [40, 160, 60], fromLeft && q < 0.3 ? 1 : 0);
  kid(f, 116, ground, [50, 110, 255], GOLD, !fromLeft && q < 0.3 ? 1 : 0);
  const x0 = fromLeft ? 16 : 112, x1 = fromLeft ? (hitKid ? 116 : 104) : (hitKid ? 12 : 24), y0 = ground - 9, y1 = hitKid ? ground - 8 : ground - 4;
  if (q < 0.8) {
    const s = q / 0.8;
    const x = x0 + (x1 - x0) * s, y = y0 + (y1 - y0) * s - Math.sin(s * Math.PI) * 26;
    f.rect(Math.round(x), Math.round(y), 2, 2, WHITE);
  } else {
    splat(f, x1, y1, (q - 0.8) / 0.2);
    if (hitKid) f.center('SPLAT!', 30, [255, 230, 80], 2);
  }
  f.center('SNOWBALL FIGHT!', 4, [120, 200, 255]);
}

// ---------------- New Year's ----------------
function ballDrop(f, lt, p, ctx) {
  const year = ctx.year;
  f.rect(63, 6, 2, 46, [120, 120, 130]);
  const fall = clamp(lt / 10000);
  const by = 8 + fall * 40;
  const glow = 0.6 + 0.4 * Math.sin(lt / 120);
  f.disc(64, by, 4, [255 * glow, 255 * glow, 255]);
  for (let i = 0; i < 6; i++) f.set(64 + Math.cos(lt / 300 + i) * 4, by + Math.sin(lt / 300 + i) * 4, hsv((i / 6 + lt / 2000) % 1));
  if (lt < 10000) {
    const n = 10 - Math.floor(lt / 1000);
    f.center(String(n), 18, [255, 215, 80], 3, 76, 128);
    f.center(String(n), 18, [255, 215, 80], 3, 0, 52);
  } else {
    fireworks(f, lt - 10000, null, 160, H);
    f.center(`${year}!`, 22, WHITE, 3);
  }
}

function confettiCannon(f, lt, p) {
  for (let i = 0; i < 120; i++) {
    const left = i % 2 === 0, s = clamp(lt / 1000 - rnd(i) * 0.6, 0, 9);
    const vx = (left ? 1 : -1) * (25 + rnd(i + 1) * 40), vy = -(40 + rnd(i + 2) * 30);
    const x = (left ? 2 : W - 3) + vx * s * 0.6, y = H - 2 + vy * s + 22 * s * s;
    f.set(x, y, hsv(rnd(i + 3)));
  }
  if (p > 0.25) f.center('CHEERS!', 24, [255, 215, 80], 2);
}

// ---------------- Valentine's ----------------
const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
const CUPID = ['..ww..', '.wSSw.', 'wwSSww', '..PP..', '..P.P.'];

function cupid(f, lt, p) {
  const cx = Math.min(30, -10 + p * 120), cy = 22 + Math.sin(lt / 200) * 3;
  f.sprite(CUPID, Math.round(cx), Math.round(cy), { w: WHITE, S: SKIN, P: [255, 150, 200] }, 2);
  f.line(cx + 12, cy + 1, cx + 12, cy + 9, BROWN); // bow
  const shot = seg(p, 0.35, 0.55);
  const big = { x: 92, y: 18 };
  if (shot > 0 && shot < 1) { const ax = cx + 14 + shot * (big.x - cx - 14); f.line(ax, cy + 5, ax + 6, cy + 5, GOLD); }
  const beat = 1 + (p > 0.55 ? 0.15 * Math.abs(Math.sin(lt / 180)) : 0);
  if (p < 0.8) f.sprite(HEART, big.x - Math.round(3 * beat * 2), big.y, { '#': [255, 40, 90] }, Math.round(2 * beat * 1.0 + (p > 0.55 ? 1 : 0)));
  else {
    const q = seg(p, 0.8, 1);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      f.sprite(HEART, Math.round(big.x + Math.cos(a) * q * 40), Math.round(big.y + 6 + Math.sin(a) * q * 26), { '#': i % 2 ? [255, 40, 90] : [255, 140, 190] });
    }
  }
  if (p > 0.55) f.center('BE MINE!', 52, [255, 140, 190], 1);
}

function heartbeat(f, lt) {
  const beat = Math.abs(Math.sin(lt / 260));
  const s = beat > 0.7 ? 4 : 3;
  f.sprite(HEART, Math.round(64 - 3.5 * s), Math.round(28 - 3 * s), { '#': [255, 30, 80] }, s);
  f.center('XOXO', 52, WHITE, 1);
}

// ---------------- St. Patrick's ----------------
function rainbow(f, lt, p) {
  const sweep = ease(seg(p, 0, 0.6)) * Math.PI;
  const colors = [[255, 40, 40], [255, 140, 0], [255, 230, 0], [40, 200, 70], [40, 120, 255], [150, 70, 220]];
  colors.forEach((c, i) => {
    const r = 54 - i * 3;
    for (let a = 0; a <= sweep; a += 0.012) f.set(64 - Math.cos(a) * r, 62 - Math.sin(a) * r * 0.95, c);
  });
  if (p > 0.6) {
    // pot of gold where the rainbow lands
    f.rect(106, 56, 14, 7, BLACK_ISH.map(v => v * 3)); f.rect(105, 55, 16, 2, [70, 70, 70]);
    for (let i = 0; i < 12; i++) f.set(108 + rnd(i) * 10, 53 + rnd(i + 1) * 3, rnd(i + Math.floor(lt / 100)) > 0.5 ? GOLD : [255, 255, 180]);
    f.center('LUCKY!', 30, GREEN, 2);
  }
}

const LEP = ['.GGG.', '.GGG.', 'GGGGG', '.SSS.', '.RRR.', 'GGGGG', '.G.G.'];
function leprechaun(f, lt, p) {
  const x = -8 + p * (W + 16), hop = Math.abs(Math.sin(lt / 220)) * 8;
  f.sprite(LEP, Math.round(x), Math.round(46 - hop), { G: GREEN, S: SKIN, R: ORANGE }, 2);
  for (let k = 0; k < 12; k++) {
    const t0 = k * 0.08;
    if (p < t0) continue;
    const cx = -8 + t0 * (W + 16) + 2;
    f.rect(Math.round(cx), 60, 2, 2, Math.floor(lt / 200 + k) % 3 ? GOLD : [255, 255, 180]);
  }
  f.center('CATCH HIM!', 6, GREEN, 2);
}

// ---------------- Easter ----------------
const BUNNY = [['.W.W..', '.W.W..', '.WWW..', 'WWKWW.', 'WWWWWW', '.WWWWW', '.W..W.'], ['.W.W..', '.W.W..', '.WWW..', 'WWKWW.', 'WWWWWW', 'WWWWW.', 'W....W']];
function bunny(f, lt, p) {
  const x = -8 + p * (W + 16), hop = Math.abs(Math.sin(lt / 200)) * 10;
  f.sprite(BUNNY[hop > 5 ? 1 : 0], Math.round(x), Math.round(42 - hop), { W: WHITE, K: [255, 120, 160] }, 2);
  const pastel = [[255, 170, 200], [170, 220, 255], [200, 255, 170], [255, 240, 150], [220, 180, 255]];
  for (let k = 0; k < 8; k++) {
    const t0 = 0.08 + k * 0.1;
    if (p < t0) continue;
    const ex = -8 + t0 * (W + 16) + 2;
    f.disc(ex, 59, 1.6, pastel[k % 5]); f.set(ex, 58, WHITE);
  }
  f.center('EGG HUNT!', 6, [255, 170, 200], 2);
}

function sunrise(f, lt, p) {
  const rise = ease(seg(p, 0, 0.5));
  const cy = 70 - rise * 30;
  for (let i = 0; i < 16; i++) {
    const a = Math.PI + (i / 15) * Math.PI, len = 30 + 20 * rise + Math.sin(lt / 300 + i) * 4;
    f.line(64 + Math.cos(a) * 14, cy + Math.sin(a) * 14, 64 + Math.cos(a) * len, cy + Math.sin(a) * len, [255, 190, 60].map(v => v * 0.6));
  }
  f.disc(64, cy, 12, [255, 210, 80]);
  // the cross in front of the sunrise
  f.rect(63, cy - 24, 3, 24, WHITE); f.rect(58, cy - 18, 13, 3, WHITE);
  f.rect(0, 60, W, 4, [40, 120, 50]);
}

// ---------------- 4th of July ----------------
function finale(f, lt, p) {
  fireworks(f, lt, [[255, 50, 50], [255, 255, 255], [70, 120, 255], [255, 215, 80]], 140, H);
  if (Math.floor(lt / 700) % 3 === 0) f.center('BOOM!', 24, WHITE, 3);
}

function flag(f, lt) {
  for (let y = 0; y < 52; y++) for (let x = 0; x < W; x++) {
    const yy = y + Math.round(Math.sin(x / 10 - lt / 250) * 2);
    if (yy < 0 || yy >= 52) continue;
    const stripe = Math.floor(yy / 4) % 2 === 0;
    let c = stripe ? [200, 20, 40] : [235, 235, 235];
    if (x < 52 && yy < 28) c = (x % 5 === 2 && yy % 5 === 2) ? WHITE : [30, 50, 140];
    const shade = 0.8 + 0.2 * Math.sin(x / 10 - lt / 250);
    f.set(x, y + 6, c.map(v => v * shade));
  }
}

// ---------------- Halloween ----------------
const GHOST = ['..WWW..', '.WWWWW.', 'WKWWWKW', 'WWWWWWW', 'WWWKWWW', 'WWWWWWW', 'W.W.W.W'];
function ghost(f, lt, p) {
  if (p < 0.6) {
    const x = -8 + (p / 0.6) * 72, y = 24 + Math.sin(lt / 250) * 8;
    f.sprite(GHOST, Math.round(x), Math.round(y), { W: [230, 230, 255], K: BLACK_ISH });
  } else {
    const grow = Math.min(5, 1 + Math.floor(seg(p, 0.6, 0.7) * 4));
    f.sprite(GHOST, Math.round(64 - 3.5 * grow), Math.round(30 - 3.5 * grow), { W: [230, 230, 255], K: BLACK_ISH }, grow);
    if (p > 0.7) f.center('BOO!', 48, Math.floor(lt / 150) % 2 ? ORANGE : WHITE, 2);
  }
}

const WITCH = ['....KK....', '...KKK....', '..KKKKK...', '...GGK....', '..KKKKK...', 'BBBKKKBBBB', '....K.K...'];
function witch(f, lt, p) {
  f.disc(70, 26, 18, [255, 230, 140]);
  const x = -12 + p * (W + 24), y = 26 + Math.sin(lt / 300) * 6;
  f.sprite(WITCH, Math.round(x), Math.round(y - 6), { K: [70, 40, 90], G: [100, 200, 80], B: BROWN }, 2);
  if (p > 0.55) f.center('HEE HEE HEE!', 55, [180, 100, 255]);
}

// ---------------- Thanksgiving ----------------
const TURKEY = ['..ROYYYOR..', '.ROYYYYYOR.', 'ROY.BBB.YOR', 'RO.BBBBBW.R', '...BBBBBBr.', '...BBBBB.r.', '....BBBB...'];
function turkeyRun(f, lt, p) {
  const x = W + 4 - p * (W + 40), step = Math.floor(lt / 120) % 2;
  f.sprite(TURKEY, Math.round(x), 30, { R: [220, 40, 30], O: ORANGE, Y: GOLD, B: BROWN, W: WHITE, r: RED }, 2);
  const legY = 44;
  f.rect(Math.round(x) + 9 + step * 2, legY, 1, 5, GOLD); f.rect(Math.round(x) + 13 - step * 2, legY, 1, 5, GOLD);
  f.center('GOBBLE GOBBLE!', 6, ORANGE, 1);
  if (p > 0.3) f.center('RUN TURKEY RUN!', 56, WHITE, 1);
}

function pie(f, lt) {
  f.disc(64, 40, 16, [190, 120, 60]); f.disc(64, 40, 13, [230, 120, 30]);
  for (let a = 0; a < Math.PI * 2; a += 0.4) f.set(64 + Math.cos(a) * 15, 40 + Math.sin(a) * 15, [240, 190, 120]);
  for (let s = 0; s < 3; s++) for (let i = 0; i < 12; i++) {
    const y = 22 - i - ((lt / 80) % 6), x = 52 + s * 12 + Math.sin(i / 2 + lt / 300 + s) * 2;
    f.set(x, y, [200, 200, 200].map(v => v * (1 - i / 12)));
  }
  f.center('PIE TIME!', 2, [255, 200, 80], 1);
}

// ---------------- Birthday ----------------
function blowCandles(f, lt, p, ctx) {
  const lit = p < 0.62;
  const x0 = 50, y0 = 34;
  f.rect(x0, y0 + 8, 28, 14, [160, 100, 60]); f.rect(x0, y0 + 6, 28, 3, [255, 130, 190]);
  for (let i = 0; i < 5; i++) {
    const cx = x0 + 3 + i * 5;
    f.rect(cx, y0, 1, 6, [120, 200, 255]);
    if (lit) f.set(cx, y0 - 1 - (Math.floor(lt / 120 + i) % 2), Math.floor(lt / 100 + i) % 2 ? GOLD : ORANGE);
    else for (let k = 0; k < 6; k++) f.set(cx + Math.sin(k + lt / 200) * 1.2, y0 - 2 - k - ((lt / 90) % 3), [140, 140, 140].map(v => v * (1 - k / 6)));
  }
  if (p < 0.5) f.center('MAKE A WISH!', 6, [255, 100, 220], 1);
  else if (p < 0.62) f.center('BLOW!', 4, WHITE, 2);
  else {
    f.center('YAY!', 4, [255, 220, 0], 2);
    for (let i = 0; i < 70; i++) {
      const s = (lt - 0.62 * ctx.dur) / 1000;
      const a = rnd(i) * Math.PI * 2, sp = 20 + rnd(i + 1) * 30;
      f.set(64 + Math.cos(a) * sp * s, 34 + Math.sin(a) * sp * s + 12 * s * s, hsv(rnd(i + 2)));
    }
  }
}

function balloons(f, lt, p) {
  for (let i = 0; i < 9; i++) {
    const x = 8 + i * 14 + Math.sin(lt / 500 + i) * 3, y = H + 10 - ((lt / 1000) * (12 + rnd(i) * 10)) - rnd(i + 1) * 20;
    const c = hsv(rnd(i + 2));
    f.disc(x, y, 3.5, c); f.disc(x, y + 1, 3, c);
    f.line(x, y + 5, x + Math.sin(lt / 300 + i), y + 12, [200, 200, 200]);
  }
  f.center('PARTY TIME!', 28, WHITE, 1);
}

// ---------------- Game day ----------------
function bigPlay(f, lt, p, ctx) {
  const sport = ctx.sport;
  const q = clamp(p / 0.6);
  if (sport === 'basketball') {
    f.rect(108, 14, 1, 40, [150, 150, 150]); f.rect(102, 14, 7, 8, WHITE); f.rect(96, 21, 8, 1, ORANGE);
    const x = 14 + q * 86, y = 46 - Math.sin(q * Math.PI) * 38 + q * -16;
    if (q < 1) f.disc(x, y, 2.5, ORANGE);
    else f.disc(100, 24 + seg(p, 0.6, 0.7) * 20, 2.5, ORANGE);
    if (p > 0.62) f.center('SWISH!', 34, WHITE, 2, 0, 90);
  } else if (sport === 'baseball') {
    const x = 20 + q * 120, y = 50 - Math.sin(q * Math.PI * 0.8) * 46;
    f.rect(0, 58, W, 6, [40, 120, 50]);
    f.disc(x, y, 1.5, WHITE);
    for (let i = 1; i < 8; i++) f.set(x - i * 3, y + i * 1.5, [255, 255, 255].map(v => v * (1 - i / 8)));
    if (p > 0.5) { fireworks(f, lt, null, 300, 40); f.center('HOME RUN!', 30, GOLD, 2); }
  } else {
    // field goal
    f.rect(98, 10, 2, 22, GOLD); f.rect(118, 10, 2, 22, GOLD); f.rect(98, 30, 22, 2, GOLD); f.rect(108, 30, 2, 26, GOLD);
    f.rect(0, 56, W, 8, [40, 120, 50]);
    const x = 14 + q * 96, y = 52 - Math.sin(q * Math.PI) * 44;
    f.disc(x, y, 1.8, BROWN); f.set(x, y, WHITE);
    if (p > 0.62) f.center('GOOD!', 30, WHITE, 2, 0, 96);
  }
}

// ---------------- schedule ----------------
const EVENTS = {
  christmas: [[santa, 10000], [snowman, 13000], [snowballFight, 10000]],
  newyear: [[ballDrop, 14000], [confettiCannon, 7000]],
  valentines: [[cupid, 9000], [heartbeat, 6000]],
  stpatricks: [[rainbow, 9000], [leprechaun, 8000]],
  easter: [[bunny, 9000], [sunrise, 9000]],
  july4: [[finale, 8000], [flag, 8000]],
  halloween: [[ghost, 8000], [witch, 8000]],
  thanksgiving: [[turkeyRun, 6000], [pie, 6000]],
  birthday: [[blowCandles, 9000], [balloons, 8000]],
  gameday: [[bigPlay, 6000]],
};
export const EVERY = 30000;  // a surprise roughly every 30 seconds
const START = 12000;         // first one 12 seconds after the screen opens

function hash(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 9973; return h; }

// Returns true if a surprise scene was drawn (the normal screen is dimmed behind it).
export function holidaySurprise(f, theme, t, data, ctx) {
  const list = EVENTS[theme];
  if (!list) return false;
  let pick = null, lt = 0;
  const kick = data.kick;
  if (kick && t - kick.t >= 0) {
    const ev = list[kick.n % list.length];
    if (t - kick.t < ev[1]) { pick = ev; lt = t - kick.t; }
  }
  if (!pick) {
    const c = Math.floor((t - START) / EVERY);
    if (c >= 0) {
      const ev = list[Math.floor(rnd(c + hash(theme)) * list.length)];
      const off = t - START - c * EVERY;
      if (off < ev[1]) { pick = ev; lt = off; }
    }
  }
  if (!pick) return false;
  f.dim(0.22);
  pick[0](f, lt, lt / pick[1], { ...ctx, dur: pick[1] });
  return true;
}
