// Surprise scenes that play every so often on each holiday theme
// (Santa flies by, a snowman gets built, a ghost says BOO...).
// Every scene is drawn from the time alone, so it looks the same on every screen.
import { W, H, hsv, Frame } from './renderer.js?v=46';
import { fireworks } from './modes-holiday.js?v=46';
import { EVENTS2, GENTLE } from './modes-holiday2.js?v=46';

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
// A hunter in blaze orange runs after the turkey — and the turkey gets away.
function hunter(f, x, y, step) {
  const OR = [255, 100, 0], PANT = [95, 85, 45], BOOT = [35, 25, 20];
  f.rect(x + 1, y - 18, 5, 2, OR); f.rect(x - 1, y - 17, 2, 1, OR);            // blaze orange cap + brim
  f.rect(x + 1, y - 16, 4, 3, SKIN); f.set(x + 1, y - 15, BLACK_ISH);           // face
  f.rect(x + 1, y - 13, 1, 1, [110, 70, 40]);                                    // beard
  f.rect(x, y - 13, 6, 6, OR); f.rect(x + 2, y - 13, 1, 6, [200, 70, 0]);        // vest
  f.line(x - 7, y - 11, x + 3, y - 11, [130, 130, 140]);                         // barrel
  f.rect(x + 2, y - 11, 4, 2, [120, 70, 30]);                                    // stock
  f.set(x - 1, y - 10, SKIN); f.set(x + 4, y - 9, SKIN);                         // hands
  f.rect(x + 1, y - 7, 4, 2, PANT);
  if (step) { f.rect(x, y - 5, 2, 4, PANT); f.rect(x + 4, y - 5, 2, 3, PANT); f.rect(x - 1, y - 1, 3, 1, BOOT); f.rect(x + 5, y - 2, 2, 1, BOOT); }
  else { f.rect(x + 1, y - 5, 2, 4, PANT); f.rect(x + 3, y - 5, 2, 4, PANT); f.rect(x, y - 1, 3, 1, BOOT); f.rect(x + 3, y - 1, 3, 1, BOOT); }
}

const TURKEY_L = TURKEY.map(r => [...r].reverse().join(''));   // facing left, the way he's running
function turkeyRun(f, lt, p) {
  const x = W + 4 - p * (W + 90), step = Math.floor(lt / 120) % 2;
  f.sprite(TURKEY_L, Math.round(x), 30, { R: [220, 40, 30], O: ORANGE, Y: GOLD, B: BROWN, W: WHITE, r: RED }, 2);
  const legY = 44;
  f.rect(Math.round(x) + 9 + step * 2, legY, 1, 5, GOLD); f.rect(Math.round(x) + 13 - step * 2, legY, 1, 5, GOLD);
  // the hunter is a step slower, so he falls further behind
  const hx = Math.round(W + 26 - p * (W + 60)), hs = Math.floor(lt / 150) % 2;
  hunter(f, hx, 49, hs);
  for (let i = 0; i < 4; i++) {                                                  // dust kicked up
    const q = ((lt / 500) + i / 4) % 1;
    f.set(hx + 7 + q * 6, 48 - q * 3, [170, 150, 120].map(v => v * (1 - q)));
    f.set(Math.round(x) + 18 + q * 6, 48 - q * 3, [170, 150, 120].map(v => v * (1 - q)));
  }
  f.center('GOBBLE GOBBLE!', 6, ORANGE, 1);
  if (p > 0.25 && p < 0.8) f.center('RUN TURKEY RUN!', 56, WHITE, 1);
  else if (p >= 0.8) f.center('HE GOT AWAY!', 56, GOLD, 1);
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


// The big Thanksgiving parade: a drum major and marching band, a giant turkey balloon,
// a cornucopia float, a giant football balloon, and Santa's sleigh float bringing up the rear
// (the parade always ends with Santa — Christmas season starts now!).
function bandie(f, x, y, kind, step, bob) {
  y -= bob;
  const leg = [245, 245, 245], jacket = kind === 'major' ? [255, 255, 255] : [200, 25, 35];
  f.rect(x - 1, y - 2 + (step ? 1 : 0), 1, step ? 2 : 3, leg); f.rect(x + 1, y - 2 + (step ? 0 : 1), 1, step ? 3 : 2, leg);
  f.rect(x - 1, y - 6, 3, 4, jacket); f.set(x, y - 3, GOLD);                    // jacket + belt buckle
  f.rect(x - 1, y - 8, 3, 2, SKIN);
  const hat = kind === 'major' ? 5 : 3;
  f.rect(x - 1, y - 8 - hat, 3, hat, kind === 'major' ? [25, 25, 90] : BLACK_ISH);    // tall shako
  f.set(x, y - 9 - hat, kind === 'major' ? GOLD : WHITE);                       // plume
  if (kind === 'drum') { f.rect(x + 1, y - 6, 3, 3, WHITE); f.rect(x + 1, y - 6, 3, 1, RED); f.rect(x + 1, y - 4, 3, 1, RED); }
  else if (kind === 'tuba') { for (let a = 0; a < 6.3; a += 0.5) f.set(x + 2 + Math.cos(a) * 2, y - 10 + Math.sin(a) * 2, GOLD); f.line(x + 1, y - 6, x + 1, y - 8, GOLD); }
  else if (kind === 'horn') { f.line(x + 1, y - 7, x + 4, y - 8, GOLD); f.rect(x + 4, y - 9, 1, 3, GOLD); }
}

function giantBalloon(f, x, y, draw, ropes, lt, coat) {
  draw(x, y);
  ropes.forEach(([rx, ry, hx], i) => {
    f.line(x + rx, y + ry, x + hx, 49, [180, 180, 180]);
    kid(f, x + hx, 57, coat, coat.map(v => v * 0.7), 1);
  });
}

function parade(f, lt, p) {
  // its own crisp November sky, then the street, curb and cheering crowd
  for (let y = 0; y < 47; y++) f.rect(0, y, W, 1, [20 + y * 1.2, 40 + y * 1.5, 90 + y * 1.2]);
  f.rect(0, 47, W, 12, [60, 60, 66]);
  for (let x = 0; x < W; x += 8) f.rect(x, 52, 4, 1, [200, 180, 60].map(v => v * 0.6));
  f.rect(0, 46, W, 1, [140, 140, 150]);
  const L = 300, lead = -6 + p * (W + L + 10);
  const step = Math.floor(lt / 260) % 2, beat = Math.floor(lt / 520) % 2;

  // drum major + band (offset 0..48)
  const band = ['major', 'drum', 'horn', 'tuba', 'drum', 'horn', 'tuba', 'drum'];
  band.forEach((k, i) => {
    const x = Math.round(lead - i * 7);
    if (x > -6 && x < W + 6) bandie(f, x, 57, k, (step + i) % 2, (beat + i) % 2 && k !== 'major' ? 1 : 0);
  });
  const mx = Math.round(lead);
  if (mx > -6 && mx < W + 6) {                                                   // twirling baton
    const a = lt / 120;
    f.line(mx + 2 + Math.cos(a) * 3, 46 + Math.sin(a) * 3, mx + 2 - Math.cos(a) * 3, 46 - Math.sin(a) * 3, WHITE);
  }
  for (let n = 0; n < 4; n++) {                                                  // music notes
    const q = ((lt / 1500) + n / 4) % 1, nx = Math.round(lead - 10 - n * 12 + Math.sin(q * 6) * 3), ny = Math.round(38 - q * 18);
    const c = GOLD.map(v => v * (1 - q * 0.8));
    f.rect(nx, ny, 2, 2, c); f.rect(nx + 1, ny - 4, 1, 4, c); f.set(nx + 2, ny - 4, c);
  }

  // giant turkey balloon (offset ~85)
  const tx = Math.round(lead - 110), ty = Math.round(10 + Math.sin(lt / 700) * 2);
  if (tx > -40 && tx < W + 4) giantBalloon(f, tx, ty, (x, y) => f.sprite(TURKEY, x, y, { R: [220, 40, 30], O: ORANGE, Y: GOLD, B: BROWN, W: WHITE, r: RED }, 3),
    [[6, 20, 2], [16, 21, 15], [27, 20, 29]], lt, [255, 140, 0]);

  // cornucopia float (offset ~160)
  const cx = Math.round(lead - 175);
  if (cx > -40 && cx < W + 4) {
    f.rect(cx, 49, 36, 6, [150, 90, 30]); f.rect(cx, 54, 36, 2, GOLD);
    for (let i = 0; i < 36; i += 4) f.rect(cx + i, 55, 2, 2, [200, 60, 20]);          // skirt fringe
    for (let i = 0; i < 16; i++) {                                                // the horn of plenty
      const r = 1 + i * 0.45;
      f.disc(cx + 28 - i, 42 - Math.sin(i / 5) * 4 + (i > 12 ? (i - 12) * 2 : 0), r * 0.55, i % 3 ? [190, 130, 60] : [150, 95, 40]);
    }
    const fruit = [[230, 30, 30], [255, 140, 0], [120, 40, 160], [255, 220, 0], [80, 200, 60]];
    fruit.forEach((c, i) => f.disc(cx + 5 + i * 4, 46 - (i % 2) * 2, 1.6, c));
    f.disc(cx + 29, 45, 3, ORANGE); f.rect(cx + 29, 41, 1, 2, GREEN);              // pumpkin
  }

  // giant football balloon (offset ~215)
  const bx = Math.round(lead - 230), by = Math.round(16 + Math.sin(lt / 600 + 1) * 2);
  if (bx > -30 && bx < W + 4) giantBalloon(f, bx, by, (x, y) => {
    for (let dy = -7; dy <= 7; dy++) { const hw = Math.round(13 * Math.sqrt(1 - (dy / 7.6) ** 2)); f.rect(x + 13 - hw, y + 7 + dy, hw * 2 + 1, 1, [140, 75, 35]); }
    f.rect(x + 7, y + 7, 13, 1, WHITE); for (let i = 0; i < 5; i++) f.rect(x + 8 + i * 3, y + 6, 1, 3, WHITE);
    f.rect(x + 2, y + 4, 1, 7, WHITE); f.rect(x + 24, y + 4, 1, 7, WHITE);
  }, [[5, 13, 2], [21, 13, 24]], lt, [255, 90, 10]);

  // Santa's sleigh float, last as always (offset ~265)
  const sx = Math.round(lead - 285);
  if (sx > -40 && sx < W + 4) {
    f.rect(sx, 50, 38, 5, RED); f.rect(sx, 49, 38, 1, WHITE); f.rect(sx, 55, 38, 2, WHITE);
    f.sprite(SLEIGH, sx + 4, 34, { W: WHITE, R: RED, S: SKIN, G: GOLD }, 2);
    f.sprite(DEER[step], sx + 24, 41, { B: BROWN, r: RED }, 1);
    if (sx > 20 && sx < 90) f.center('HO HO HO!', 16, WHITE);
    for (let i = 0; i < 14; i++) {                                                 // snow from the float
      const q = ((lt / 1800) + rnd(i)) % 1;
      f.set(sx + rnd(i + 4) * 38, 30 + q * 18, SNOW.map(v => v * (1 - q)));
    }
  }

  // crowd along the curb, cheering and waving flags
  for (let i = 0; i < 22; i++) {
    const x = 2 + i * 6 + Math.round(rnd(i) * 2), jump = Math.floor(lt / 300 + rnd(i) * 4) % 3 === 0 ? 1 : 0;
    const c = [[230, 60, 60], [60, 120, 230], [250, 200, 40], [60, 180, 90], [240, 120, 190]][i % 5];
    f.rect(x, 61 - jump, 3, 3, c); f.disc(x + 1, 59 - jump, 1.2, SKIN);
    if (i % 4 === 1) { f.line(x + 3, 60 - jump, x + 3, 55 - jump, [200, 200, 200]); f.rect(x + 4, 55 - jump, 3, 2, [[230, 30, 30], WHITE, [40, 70, 200]][i % 3]); }
  }
  f.center('THANKSGIVING PARADE', 1, GOLD);
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


// ---------------- more scenes ----------------
function champagne(f, lt, p, ctx) {
  const shake = p < 0.3 ? Math.sin(lt / 30) * 1.5 : 0;
  const bx = 60 + shake;
  f.rect(bx, 42, 9, 22, [20, 110, 50]); f.rect(bx + 2, 32, 5, 10, [20, 110, 50]); f.rect(bx + 1, 46, 7, 8, [230, 220, 180]);
  if (p < 0.3) f.rect(bx + 2, 29, 5, 4, GOLD);
  else {
    const q = (lt - 0.3 * ctx.dur) / 1000;
    f.rect(bx + 2, Math.round(29 - q * 90), 4, 3, [200, 160, 100]);
    for (let i = 0; i < 70; i++) {
      const s = ((q * 1.4 + rnd(i) * 1.2) % 1.2);
      const a = -Math.PI / 2 + (rnd(i + 1) - 0.5) * 1.1, v = 35 + rnd(i + 2) * 25;
      f.set(bx + 4 + Math.cos(a) * v * s, 30 + Math.sin(a) * v * s + 30 * s * s, i % 3 ? [255, 245, 200] : GOLD);
    }
  }
  if (p > 0.3 && p < 0.55) f.center('POP!', 2, WHITE, 3);
  if (p >= 0.55) f.center(`HELLO ${ctx.year}!`, 4, GOLD, 2);
}

function loveLetter(f, lt, p) {
  const slide = ease(seg(p, 0, 0.25));
  const x = 46, y = Math.round(70 - slide * 38), w = 36, h = 22;
  f.rect(x, y, w, h, [255, 190, 210]);
  f.line(x, y + h - 1, x + w / 2, y + h / 2, [230, 120, 160]); f.line(x + w - 1, y + h - 1, x + w / 2, y + h / 2, [230, 120, 160]);
  const open = seg(p, 0.28, 0.42);
  const tipY = y + (h / 2) - open * (h);
  f.line(x, y, x + w / 2, tipY, [230, 120, 160]); f.line(x + w - 1, y, x + w / 2, tipY, [230, 120, 160]);
  const rise = ease(seg(p, 0.42, 0.7));
  if (rise > 0) f.sprite(HEART, 57, Math.round(y + 4 - rise * 22), { '#': [255, 40, 90] }, 2);
  if (p > 0.6) {
    f.center('LOVE YOU!', 3, WHITE, 2);
    for (let i = 0; i < 14; i++) if (rnd(i + Math.floor(lt / 150)) > 0.5) f.set(10 + rnd(i) * 108, 20 + rnd(i + 1) * 40, [255, 160, 200]);
  }
}

const CLOVER = ['...###...', '..#####..', '..#####..', '###.#.###', '#########', '###.#.###', '....#....', '....#....', '...#.....'];
function shamrockShine(f, lt, p) {
  for (let i = 0; i < 40; i++) {
    const x = rnd(i) * W, y = ((lt / 1000) * (20 + rnd(i + 1) * 20) + rnd(i + 2) * H) % H;
    f.rect(Math.round(x), Math.round(y), 2, 2, i % 2 ? GOLD : [255, 240, 140]);
  }
  const pulse = 0.7 + 0.3 * Math.sin(lt / 200);
  f.sprite(CLOVER, 51, 14, { '#': GREEN.map(v => v * pulse) }, 3);
  f.center("TOP O' THE MORNIN'!", 3, WHITE, 1);
}

function chickHatch(f, lt, p) {
  const cx = 64 + (p < 0.5 ? Math.sin(lt / 70) * (p * 4) : 0), cy = 44;
  const egg = (x, y, top) => {
    for (let yy = -14; yy <= 12; yy++) for (let xx = -10; xx <= 10; xx++) {
      const k = (xx * xx) / 100 + (yy * yy) / (yy < 0 ? 196 : 144);
      if (k <= 1 && (top === undefined || (top ? yy < -2 : yy >= -2))) f.set(x + xx, y + yy, [250, 245, 230]);
    }
  };
  if (p < 0.55) {
    egg(cx, cy);
    if (p > 0.3) { for (let i = 0; i < 6; i++) f.set(cx - 9 + i * 3, cy - 2 + (i % 2 ? -2 : 1), [120, 100, 80]); }
  } else {
    egg(64, cy, false);
    const lift = ease(seg(p, 0.55, 0.7));
    egg(64, cy - 2 - lift * 18, true);
    const up = ease(seg(p, 0.6, 0.75));
    f.disc(64, cy - 6 - up * 4, 7, [255, 225, 40]);
    f.set(61, cy - 8 - up * 4, BLACK_ISH); f.set(67, cy - 8 - up * 4, BLACK_ISH);
    f.rect(63, cy - 6 - up * 4, 3, 2, ORANGE);
    if (p > 0.72) f.center('PEEP PEEP!', 4, [255, 230, 80], 2);
  }
}

function sparklerUSA(f, lt, p) {
  const tmp = new Frame();
  const colors = [[255, 50, 50], [255, 255, 255], [70, 120, 255]];
  tmp.center('USA', 18, i => colors[i % 3], 5);
  const reveal = 24 + seg(p, 0.05, 0.75) * 84;
  for (let y = 0; y < H; y++) for (let x = 0; x < Math.min(W, reveal); x++) {
    const i = (y * W + x) * 3;
    if (tmp.buf[i] || tmp.buf[i + 1] || tmp.buf[i + 2]) f.set(x, y, [tmp.buf[i], tmp.buf[i + 1], tmp.buf[i + 2]]);
  }
  if (p < 0.78) {
    const sy = 34 + Math.sin(lt / 90) * 12;
    for (let i = 0; i < 18; i++) {
      const a = rnd(i + Math.floor(lt / 60)) * Math.PI * 2, d = rnd(i + 3 + Math.floor(lt / 60)) * 7;
      f.set(reveal + Math.cos(a) * d, sy + Math.sin(a) * d, i % 2 ? [255, 240, 160] : WHITE);
    }
    f.line(reveal, sy, reveal + 6, sy + 16, [150, 150, 150]);
  } else f.center('HAPPY BIRTHDAY AMERICA', 56, [255, 215, 80]);
}

function jackOLantern(f, lt, p) {
  const flick = 0.75 + 0.25 * Math.sin(lt / 70) * Math.sin(lt / 23);
  const glow = [255 * flick, 200 * flick, 40 * flick];
  for (let y = -18; y <= 18; y++) for (let x = -26; x <= 26; x++) {
    if ((x * x) / 676 + (y * y) / 324 <= 1) f.set(64 + x, 40 + y, Math.abs(x) % 9 === 0 ? [200, 80, 0] : [255, 120, 0]);
  }
  f.rect(62, 19, 4, 4, [60, 140, 40]);
  const tri = (cx, cy, s, down) => { for (let r = 0; r < s; r++) f.rect(cx - (down ? s - r : r), cy + r, (down ? s - r : r) * 2 + 1, 1, glow); };
  tri(52, 30, 6, false); tri(76, 30, 6, false); tri(64, 38, 3, false);
  for (let x = 46; x <= 82; x++) {
    const tooth = Math.floor((x - 46) / 4) % 2 === 0;
    f.rect(x, 46 + (tooth ? 0 : 2), 1, tooth ? 5 : 3, glow);
  }
  if (p > 0.3) f.center('TRICK OR TREAT!', 2, [180, 100, 255]);
}

function footballPass(f, lt, p) {
  const ground = 58;
  f.rect(0, ground + 1, W, 5, [40, 120, 50]);
  for (let x = 8; x < W; x += 20) f.rect(x, ground + 1, 1, 5, WHITE);
  const run = seg(p, 0, 0.7);
  const rx = 40 + run * 70;
  kid(f, 18, ground, [200, 40, 40], [200, 40, 40], p < 0.25 ? 1 : 0);
  kid(f, rx, ground, [200, 40, 40], [200, 40, 40], p > 0.6 ? 1 : 0);
  const q = seg(p, 0.2, 0.62);
  if (q > 0 && q < 1) { const x = 21 + q * (rx - 21), y = ground - 10 - Math.sin(q * Math.PI) * 30; f.rect(Math.round(x), Math.round(y), 3, 2, BROWN); }
  if (p > 0.65) { f.center('TOUCHDOWN!', 8, WHITE, 2); fireworks(f, lt, [[255, 140, 0], [255, 215, 80]], 400, 30); }
}

function presentSurprise(f, lt, p) {
  const shake = p < 0.4 ? Math.round(Math.sin(lt / 40) * 2) : 0;
  const x = 52 + shake, y = 42;
  f.rect(x, y, 24, 20, [60, 140, 255]); f.rect(x + 10, y, 4, 20, GOLD);
  const lid = ease(seg(p, 0.4, 0.55));
  const ly = y - 5 - lid * 40, lx = x - 2 + lid * 30;
  f.rect(Math.round(lx), Math.round(ly), 28, 5, [80, 160, 255]); f.rect(Math.round(lx) + 12, Math.round(ly), 4, 5, GOLD);
  if (p > 0.45) {
    for (let i = 0; i < 80; i++) {
      const s = (lt - 0.45 * 9000) / 1000, a = -Math.PI / 2 + (rnd(i) - 0.5) * 2.2, v = 25 + rnd(i + 1) * 35;
      f.set(64 + Math.cos(a) * v * s, 42 + Math.sin(a) * v * s + 18 * s * s, hsv(rnd(i + 2)));
    }
    f.center('SURPRISE!', 6, [255, 220, 0], 2);
  }
}

function crowdWave(f, lt, p, ctx) {
  const [c1, c2] = ctx.colors;
  const wave = ((lt / 1000) * 70) % (W + 40) - 20;
  for (let row = 0; row < 3; row++) for (let x = 2 + (row % 2) * 2; x < W; x += 5) {
    const up = Math.abs(x - wave) < 8 ? 5 : 0;
    const y = 46 + row * 6 - up;
    f.rect(x, y, 2, 2, SKIN);
    f.rect(x - 1, y + 2, 4, 3, (x + row) % 2 ? c1 : c2);
    if (up) { f.set(x - 2, y - 1, SKIN); f.set(x + 3, y - 1, SKIN); }
  }
  f.center('THE WAVE!', 6, WHITE, 2);
  f.center(ctx.cheer, 26, c1.map(v => Math.min(255, v + 60)), 1);
}

function clapChant(f, lt, p, ctx) {
  const [c1, c2] = ctx.colors;
  const beat = Math.floor(lt / 450) % 4;
  f.rect(0, 0, W, H, (beat % 2 ? c1 : c2).map(v => v * 0.35));
  if (beat < 2) f.center(ctx.cheer, 22, WHITE, 2);
  else {
    f.center('CLAP! CLAP!', 22, [255, 230, 80], 2);
    for (let i = 0; i < 20; i++) f.set(rnd(i + beat) * W, rnd(i + 9 + beat) * H, WHITE);
  }
}

// ---------------- schedule ----------------
const EVENTS = {
  christmas: [[santa, 10000], [snowman, 13000], [snowballFight, 10000]],
  newyear: [[ballDrop, 14000], [confettiCannon, 7000], [champagne, 8000]],
  valentines: [[cupid, 9000], [heartbeat, 6000], [loveLetter, 8000]],
  stpatricks: [[rainbow, 9000], [leprechaun, 8000], [shamrockShine, 7000]],
  easter: [[bunny, 9000], [sunrise, 9000], [chickHatch, 9000]],
  july4: [[finale, 8000], [flag, 8000], [sparklerUSA, 9000]],
  halloween: [[ghost, 8000], [witch, 8000], [jackOLantern, 7000]],
  thanksgiving: [[turkeyRun, 8000], [pie, 6000], [footballPass, 7000], [parade, 26000]],
  birthday: [[blowCandles, 9000], [balloons, 8000], [presentSurprise, 9000]],
  gameday: [[bigPlay, 6000], [crowdWave, 8000], [clapChant, 6000]],
  ...EVENTS2,
};
export const SCENE_COUNT = Object.fromEntries(Object.entries(EVENTS).map(([k, v]) => [k, v.length]));
export const EVERY = 30000;  // a surprise every 30 seconds, forever
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
      // Shuffle the scenes each round so every one plays before any repeats.
      const n = list.length, round = Math.floor(c / n), seed = hash(theme) + round * 13;
      const order = list.map((_, i) => i).sort((a, b) => rnd(seed + a * 3.1) - rnd(seed + b * 3.1));
      const ev = list[order[c % n]];
      const off = t - START - c * EVERY;
      if (off < ev[1]) { pick = ev; lt = off; }
    }
  }
  if (!pick) return false;
  f.dim(GENTLE.has(theme) ? 0.55 : 0.22);   // solemn days stay softly visible behind
  pick[0](f, lt, lt / pick[1], { ...ctx, dur: pick[1] });
  return true;
}
