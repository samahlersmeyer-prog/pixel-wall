// The whole family, a reel of scenes (SCENE ms each):
// backyard, game night, devotions, kickball, pickleball.
import { W, H } from './renderer.js?v=47';

const SKIN = [240, 190, 150], BLACK = [20, 20, 20], WHITE = [255, 255, 255], MOUTH = [190, 90, 90];
const LEATHER = [140, 80, 30], BAT = [225, 185, 120], ORANGE = [255, 120, 0], PINK = [255, 110, 180], GOLD = [255, 200, 40];
const GRAY_POST = [120, 120, 130];
const SCENE = 8000, LOOP = 4000;
const lerp = (a, b, p) => a + (b - a) * p;
const clamp = v => Math.max(0, Math.min(1, v));
const arc = (a, b, p, h) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p) - h * 4 * p * (1 - p)];
const blink = (t, ms = 150) => Math.floor(t / ms) % 2 === 0;

// A person, 12 wide and o.h tall, feet on `base`. Returns key positions for props.
function person(f, x, base, o) {
  x = Math.round(x);
  const h = o.h, t = Math.round((h - 9) * 0.55), l = h - 9 - t, T = Math.round(base - h + 1 + (o.dy || 0));
  const top = T + 7, legTop = top + t, armLen = t - 2;
  if (o.long) { f.rect(x + 2, T, 8, 2, o.hair); f.rect(x + 2, T + 2, 1, o.long, o.hair); f.rect(x + 9, T + 2, 1, o.long, o.hair); }
  else f.rect(x + 3, T, 6, 2, o.hair);
  f.rect(x + 3, T + 2, 6, 5, SKIN);
  if (o.closed) { f.set(x + 4, T + 4, [150, 90, 70]); f.set(x + 7, T + 4, [150, 90, 70]); }
  else { f.set(x + 4, T + 3, BLACK); f.set(x + 7, T + 3, BLACK); }
  if (o.beard) f.rect(x + 3, T + 5, 6, 2, o.beard);
  f.rect(x + 5, T + 5, 2, 1, MOUTH);
  if (o.long) { f.rect(x + 2, T + 2, 1, o.long, o.hair); f.rect(x + 9, T + 2, 1, o.long, o.hair); }
  // clothes
  f.rect(x + 1, top, 10, t, o.shirt);
  if (o.check) for (let j = 0; j < t; j++) for (let i = 0; i < 10; i++) if (i % 2 === 0 || j % 2 === 0) f.set(x + 1 + i, top + j, o.check);
  if (o.dots) for (let j = 0; j < t; j++) for (let i = 0; i < 10; i++) if ((i * 3 + j * 5) % 7 === 0) f.set(x + 1 + i, top + j, o.dots);
  if (o.dress) {
    const d = Math.ceil(l / 2);
    f.rect(x, legTop, 12, d, o.shirt);
    if (o.dots) for (let i = 0; i < 12; i += 3) f.set(x + i + 1, legTop + 1, o.dots);
    f.rect(x + 2, legTop + d, 3, l - d, SKIN); f.rect(x + 7, legTop + d, 3, l - d, SKIN);
  } else {
    const p = o.shorts ? Math.ceil(l / 2) : l;
    f.rect(x + 1, legTop, 10, Math.min(2, p), o.pants);
    f.rect(x + 1, legTop + 2, 4, p - 2, o.pants); f.rect(x + 7, legTop + 2, 4, p - 2, o.pants);
    if (o.shorts) { f.rect(x + 2, legTop + p, 3, l - p, SKIN); f.rect(x + 7, legTop + p, 3, l - p, SKIN); }
  }
  f.rect(x + 1, legTop + l, 4, 2, o.shoes || BLACK); f.rect(x + 7, legTop + l, 4, 2, o.shoes || BLACK);
  if (o.kick) { f.rect(x + 11, legTop + l - 4, 6, 2, o.shorts || o.dress ? SKIN : o.pants); f.rect(x + 16, legTop + l - 5, 3, 2, o.shoes || BLACK); }
  // arms
  const armL = () => f.rect(x, top, 1, armLen, SKIN), armR = () => f.rect(x + 11, top, 1, armLen, SKIN);
  const p = o.pose || 'stand';
  if (p === 'up') { f.rect(x + 1, T - 6, 2, 13, SKIN); f.rect(x + 9, T - 6, 2, 13, SKIN); }
  else if (p === 'wave') { armL(); f.rect(x + 11, T - 4, 1, 11, SKIN); }
  else if (p === 'point') { armL(); f.rect(x + 11, top + 1, 5, 1, SKIN); }
  else if (p === 'hold') { armL(); f.rect(x + 11, top, 1, 3, SKIN); f.rect(x + 11, top + 3, 3, 1, SKIN); }
  else if (p === 'holdL') { armR(); f.rect(x, top, 1, 3, SKIN); f.rect(x - 2, top + 3, 3, 1, SKIN); }
  else if (p === 'pray') { f.rect(x, top, 1, 3, SKIN); f.rect(x + 11, top, 1, 3, SKIN); f.rect(x + 1, top + 3, 4, 1, SKIN); f.rect(x + 7, top + 3, 4, 1, SKIN); f.rect(x + 5, top + 1, 2, 3, SKIN); }
  else if (p === 'book') { f.rect(x, top, 1, 4, SKIN); f.rect(x + 11, top, 1, 4, SKIN); }
  else if (p === 'cock') { f.rect(x - 6, top + 1, 7, 2, SKIN); f.rect(x + 11, top + 1, 2, 3, LEATHER); }
  else if (p === 'throw') { f.rect(x + 11, top - 1, 6, 2, SKIN); f.rect(x - 1, top + 2, 2, 3, LEATHER); }
  else if (p === 'batLoad') { armL(); armR(); f.line(x + 9, top + 1, x + 14, top - 10, BAT); }   // facing left
  else if (p === 'batSwing') { armR(); f.rect(x - 2, top + 3, 3, 2, SKIN); f.line(x - 1, top + 4, x - 13, top + 4, BAT); }
  else if (p === 'batFollow') { armL(); armR(); f.line(x + 3, top + 1, x - 4, top - 10, BAT); }
  else { armL(); armR(); }
  return { T, top, legTop, x };
}

const heart = (f, x, y, c = PINK) => f.sprite(['.#.#.', '#####', '.###.', '..#..'], x, y, { '#': c });
const CHICK_HEAD = ['.rr.', 'oooo', 'ykoo'];
const CHICK_BODY = ['.oooooooo', '.ooooooooo', '..ooooooo', '...y..y..'];

const FAM = {
  sam: { h: 34, hair: [205, 205, 210], beard: [175, 175, 180], shirt: [235, 235, 240], check: [120, 130, 165], pants: [70, 60, 55] },
  emily: { h: 31, hair: [80, 50, 35], long: 10, shirt: [90, 130, 185], pants: [200, 170, 130], shoes: [150, 110, 80] },
  max: { h: 33, hair: [110, 75, 45], shirt: [35, 35, 40], pants: [60, 60, 70] },
  theo: { h: 29, hair: [70, 50, 35], shirt: [180, 205, 235], pants: [50, 60, 90] },
  junie: { h: 26, hair: [215, 115, 70], long: 7, shirt: [245, 235, 215], pants: [215, 175, 205], shoes: WHITE },
  louie: { h: 24, hair: [120, 85, 55], shirt: [190, 225, 215], pants: [190, 170, 140], shorts: true },
  josie: { h: 21, hair: [215, 170, 100], long: 6, shirt: [250, 245, 240], dots: [240, 110, 120], dress: true, shoes: [240, 170, 170] },
};
// seated: place a person so the top of their head is at y = T (furniture drawn over their legs)
const seat = (f, x, T, who, o = {}) => person(f, x, T + FAM[who].h - 1, { ...FAM[who], ...o });

function title(f, s, c = WHITE, y = 1) {
  const tx = Math.round((W - f.textWidth(s)) / 2);
  f.text(s, tx + 1, y + 1, BLACK); f.text(s, tx, y, c);
}

// ---------- backyard: everyone doing their thing ----------
function backyard(f, t) {
  const k = t % LOOP, base = 60;
  for (let y = 0; y < 44; y++) f.rect(0, y, W, 1, [lerp(40, 255, y / 44), lerp(30, 140, y / 44), 90]);
  f.disc(118, 40, 6, [255, 200, 90]);
  for (let x = 0; x < W; x += 5) f.rect(x, 36, 4, 10, [150, 100, 60]);
  f.rect(0, 38, W, 1, [110, 70, 40]); f.rect(0, 43, W, 1, [110, 70, 40]);
  for (let y = 46; y < H; y++) f.rect(0, y, W, 1, [40, 150 - (y - 46) * 2, 55]);

  f.rect(63, 9, 15, 7, WHITE); f.rect(64, 10, 13, 5, [60, 70, 100]); f.rect(65, 16, 11, 1, ORANGE);
  const swish = k > 2800 && k < 3500;
  for (let i = 0; i < 4; i++) for (let x = 66 + (i >> 1); x < 75 - (i >> 1); x += 2) f.set(x + (swish && i > 1 ? Math.round(Math.sin(t / 40)) : 0), 17 + i, WHITE);

  const blow = Math.floor(t / 700) % 2 === 0;
  const sam = person(f, 0, base, { ...FAM.sam, pose: blow ? 'point' : 'stand' });
  f.set(6, sam.T + 6, [200, 200, 210]);
  if (blow) for (let i = 0; i < 3; i++) f.set(13 + i, sam.T + 2 + i * 2 - (i === 1 ? 1 : 0), WHITE);

  const em = person(f, 15, base, { ...FAM.emily, pose: 'hold' });
  f.rect(27, em.top + 2, 6, 5, WHITE); f.rect(29, em.top + 3, 2, 3, [220, 40, 50]); f.rect(28, em.top + 4, 4, 1, [220, 40, 50]);
  heart(f, 28 + Math.sin(t / 200) * 2, em.top - ((t % 2000) / 2000) * 22, PINK);

  const jo = person(f, 30, base, { ...FAM.josie, pose: 'wave', dy: -Math.abs(Math.sin(t / 250)) * 2 });
  const bx = 43 + Math.sin(t / 500) * 2, by = 14 + Math.sin(t / 400) * 2;
  f.line(41, jo.T - 4, bx, by + 4, [230, 230, 230]);
  f.disc(bx, by, 4, PINK); f.set(bx - 1, by - 1, WHITE); f.line(bx + 1, by - 4, bx + 3, by - 8, GOLD);

  const ju = person(f, 45, base, { ...FAM.junie, pose: 'point' });
  const peck = Math.floor(t / 450) % 3 === 0;
  f.sprite(CHICK_BODY, 55, 54, { o: [230, 140, 50], y: GOLD });
  f.sprite(CHICK_HEAD, 55 + (peck ? -1 : 0), 51 + (peck ? 3 : 0), { r: [220, 40, 50], o: [230, 140, 50], y: GOLD, k: BLACK });
  if (t % 3000 < 1200) heart(f, 52, ju.T - 4 - (t % 3000) / 120, PINK);

  const jump = k > 2000 && k < 2700 ? -6 * Math.sin(Math.PI * (k - 2000) / 700) : 0;
  const th = person(f, 64, base, { ...FAM.theo, pose: k < 2000 ? 'stand' : k < 2900 ? 'up' : 'stand', dy: jump });
  if (k < 2000) f.disc(77, th.legTop + Math.abs(Math.sin(k / 120)) * 9 - 4, 2, ORANGE);
  else if (k < 2800) f.disc(...arc([70, th.T - 7], [70, 16], clamp((k - 2150) / 650), 6), 2, ORANGE);
  else if (k < 3300) f.disc(70, 18 + (k - 2800) / 40, 2, ORANGE);

  const mx = person(f, 82, base, { ...FAM.max, pose: k < 500 ? 'stand' : k < 800 ? 'cock' : k < 1600 ? 'throw' : 'stand' });
  const lp = k < 1100 ? 'batLoad' : k < 1300 ? 'batSwing' : k < 2200 ? 'batFollow' : 'batLoad';
  const lo = person(f, 116, base, { ...FAM.louie, pose: lp });
  const contact = [106, lo.top + 4];
  if (k > 850 && k < 1150) f.disc(lerp(99, contact[0], (k - 850) / 300), lerp(mx.top - 1, contact[1], (k - 850) / 300), 1, WHITE);
  if (k >= 1150 && k < 2700) f.disc(...arc(contact, [-8, 30], (k - 1150) / 1550, 40), 1, WHITE);
  if (k >= 1150 && k < 1400) for (let i = 0; i < 8; i++) f.set(contact[0] + Math.cos(i) * 4, contact[1] + Math.sin(i) * 4, GOLD);

  title(f, 'THE AHLERSMEYERS');
}

// ---------- game night: everyone takes a turn rolling, somebody wins ----------
const ORDER = [['sam', 'DAD'], ['emily', 'MOM'], ['max', 'MAX'], ['theo', 'THEO'], ['junie', 'JUNIE'], ['louie', 'LOUIE'], ['josie', 'JOSIE']];
const PIPS = { 1: [[2, 2]], 2: [[0, 0], [4, 4]], 3: [[0, 0], [2, 2], [4, 4]], 4: [[0, 0], [4, 0], [0, 4], [4, 4]], 5: [[0, 0], [4, 0], [2, 2], [0, 4], [4, 4]], 6: [[0, 0], [4, 0], [0, 2], [4, 2], [0, 4], [4, 4]] };
function die(f, x, y, n) { x = Math.round(x); y = Math.round(y); f.rect(x - 1, y - 1, 7, 7, WHITE); PIPS[n].forEach(([a, b]) => f.set(x + a, y + b, BLACK)); }

function gameNight(f, k, t) {
  for (let y = 0; y < 42; y++) f.rect(0, y, W, 1, [70 + y, 45 + y / 2, 60]);
  f.disc(64, -6, 14, [140, 110, 80]); f.disc(64, -6, 10, [255, 230, 170]);                     // hanging lamp glow
  const winner = Math.floor(t / (SCENE * 5)) % 7, end = k >= 7000;
  const Ts = { sam: 20, emily: 22, max: 21, theo: 23, junie: 25, louie: 26, josie: 27 };
  const turn = Math.min(6, Math.floor(k / 1000));
  ORDER.forEach(([who], i) => {
    const x = 2 + i * 17, mine = !end && i === turn && k % 1000 < 450, won = end && i === winner;
    seat(f, x, Ts[who] + (won ? -Math.abs(Math.sin(t / 120)) * 4 : 0), who, { pose: won ? 'up' : mine ? 'point' : 'stand' });
  });
  f.rect(0, 42, W, 7, [160, 110, 65]); f.rect(0, 49, W, 15, [105, 65, 38]); f.rect(0, 49, W, 1, [80, 50, 30]);
  for (let i = 0; i < 16; i++) f.rect(30 + i * 4, 44, 3, 3, [[220, 60, 60], [60, 160, 230], [250, 200, 50], [80, 190, 90]][i % 4]);
  f.disc(12, 45, 3, [230, 230, 240]); for (let i = 0; i < 6; i++) f.set(9 + i, 42 + (i % 2), [255, 245, 200]);  // popcorn
  title(f, 'GAME NIGHT');
  if (!end) {
    const x = 2 + turn * 17 + 6, roll = k % 1000;
    const n = roll < 650 ? 1 + Math.floor(t / 70) % 6 : 1 + (turn * 5 + Math.floor(t / SCENE)) % 6;
    if (roll > 250) die(f, x + (roll < 650 ? Math.sin(roll / 40) * 2 : 0), 43 - (roll < 650 ? Math.abs(Math.sin(roll / 60)) * 4 : 0), n);
  } else title(f, `${ORDER[winner][1]} WINS!`, blink(t) ? GOLD : WHITE, 11);
}

// ---------- devotions: Dad reads, everyone prays, AMEN ----------
function devotions(f, k, t) {
  for (let y = 0; y < 44; y++) f.rect(0, y, W, 1, [25 + y / 3, 25 + y / 3, 55 + y / 2]);
  f.rect(102, 10, 22, 15, [110, 80, 50]); f.rect(103, 11, 20, 13, [15, 20, 50]); f.disc(117, 15, 3, [250, 245, 210]); f.disc(118, 14, 2, [15, 20, 50]);
  for (let i = 0; i < 5; i++) if ((i + Math.floor(t / 400)) % 3) f.set(105 + i * 4, 13 + (i * 7) % 9, WHITE);
  const praying = k >= 4500 && k < 7200, amen = k >= 7200;
  const glow = praying ? 0.5 + 0.5 * Math.sin(t / 250) : 0;
  if (glow) f.disc(64, 14, 7, [60 + glow * 80, 50 + glow * 60, 40]);
  f.rect(63, 10, 2, 10, praying ? GOLD : [170, 130, 80]); f.rect(60, 13, 8, 2, praying ? GOLD : [170, 130, 80]);
  f.rect(0, 34, W, 16, [120, 45, 50]); for (let x = 0; x < W; x += 21) f.rect(x, 35, 1, 14, [95, 35, 40]);
  const seats = [['sam', 1, 20], ['emily', 17, 22], ['josie', 33, 27], ['junie', 48, 25], ['louie', 63, 26], ['theo', 79, 23], ['max', 95, 21]];
  const people = {};
  seats.forEach(([who, x, T]) => {
    const pose = praying ? 'pray' : amen ? 'up' : who === 'sam' ? 'book' : 'stand';
    people[who] = seat(f, x, T + (who === 'josie' && !praying ? Math.round(Math.sin(t / 300)) : 0), who, { pose, closed: praying });
  });
  if (!praying && !amen) {   // Dad's Bible
    const s = people.sam, bx = s.x + 1, by = s.top + 1;
    f.rect(bx, by, 10, 6, [90, 30, 30]); f.rect(bx + 1, by, 4, 5, [245, 240, 225]); f.rect(bx + 5, by, 4, 5, [245, 240, 225]);
    const flip = (k % 1500) / 1500;
    if (flip > 0.8) f.rect(bx + 8 - Math.round((flip - 0.8) / 0.2 * 6), by - 1, 1, 5, WHITE);
  }
  f.rect(0, 50, W, 8, [140, 55, 60]); f.rect(0, 50, W, 1, [100, 40, 45]); f.rect(0, 58, W, 6, [90, 60, 40]);
  f.rect(112, 46, 12, 12, [110, 75, 45]); f.rect(116, 40, 3, 6, [245, 240, 225]);                       // side table + candle
  f.set(117, 39 - (blink(t, 90) ? 1 : 0), [255, 180, 40]); f.set(117, 38 - (blink(t, 130) ? 1 : 0), [255, 240, 120]);
  if (amen) { title(f, 'AMEN!', blink(t) ? GOLD : WHITE); seats.forEach(([, x], i) => heart(f, x + 4, 10 - ((t / 40 + i * 5) % 8), PINK)); }
  else title(f, praying ? 'LETS PRAY' : 'DEVOTIONS');
}

// ---------- kickball: Mom rolls, Junie then Louie boots it ----------
function kickball(f, k, t) {
  for (let y = 0; y < 40; y++) f.rect(0, y, W, 1, [110 + y, 180 + y, 255]);
  for (let y = 40; y < H; y++) f.rect(0, y, W, 1, [40, 160 - (y - 40), 60]);
  f.rect(0, 59, W, 3, [190, 140, 80]); f.rect(26, 59, 6, 2, WHITE);
  const turn = Math.floor(k / 4000), pk = k % 4000;
  const [kicker, onDeck] = turn === 0 ? ['junie', 'louie'] : ['louie', 'junie'];
  const kicked = pk >= 1400, cheer = pk > 2400;
  const hop = s => (cheer ? -Math.abs(Math.sin(t / 150 + s)) * 4 : 0);
  person(f, 0, 60, { ...FAM.sam, pose: cheer ? 'up' : 'stand', dy: hop(0) });
  person(f, 32, 60, { ...FAM[onDeck], pose: cheer ? 'up' : 'stand', dy: hop(1) });
  person(f, 14, 60, { ...FAM[kicker], kick: pk > 1300 && pk < 1700, pose: cheer ? 'up' : 'stand', dy: hop(2) });
  person(f, 52, 60, { ...FAM.emily, pose: pk > 300 && pk < 700 ? 'holdL' : cheer ? 'up' : 'stand' });
  person(f, 72, 60, { ...FAM.josie, pose: cheer ? 'up' : 'wave', dy: -Math.abs(Math.sin(t / 200)) * 3 });
  person(f, 90, 60, { ...FAM.max, pose: pk > 1700 ? 'up' : 'stand', dy: pk > 1900 && pk < 2600 ? -8 * Math.sin(Math.PI * (pk - 1900) / 700) : 0 });
  person(f, 112, 60, { ...FAM.theo, pose: pk > 1800 ? 'up' : 'stand', dy: pk > 2000 && pk < 2700 ? -7 * Math.sin(Math.PI * (pk - 2000) / 700) : 0 });
  const RED = [220, 50, 50];
  if (pk > 500 && pk < 1400) { const bx = lerp(50, 30, (pk - 500) / 900); f.disc(bx, 56, 3, RED); f.set(bx + Math.round(Math.cos(pk / 60) * 2), 56 + Math.round(Math.sin(pk / 60) * 2), [255, 150, 150]); }
  if (kicked && pk < 2700) f.disc(...arc([30, 55], [150, -12], (pk - 1400) / 1300, 26), 3, RED);
  if (kicked && pk < 1650) for (let i = 0; i < 8; i++) f.set(30 + Math.cos(i) * 5, 55 + Math.sin(i) * 5, GOLD);
  title(f, cheer ? 'HOME RUN!' : 'KICKBALL', cheer && blink(t) ? GOLD : WHITE);
}

// ---------- pickleball: Dad and Max vs Mom and Theo, the little ones cheer ----------
function pickleball(f, k, t) {
  for (let y = 0; y < 44; y++) f.rect(0, y, W, 1, [120 + y, 190, 255]);
  f.rect(0, 30, W, 14, [30, 100, 60]);                                                       // windscreen
  for (let y = 44; y < H; y++) f.rect(0, y, W, 1, [45, 95, 175]);
  f.rect(0, 46, W, 1, WHITE); f.rect(0, 61, W, 1, WHITE); f.rect(30, 46, 1, 15, WHITE); f.rect(97, 46, 1, 15, WHITE);
  for (let y = 46; y < 58; y++) for (let x = 62; x < 66; x++) if ((x + y) % 2) f.set(x, y, [200, 200, 210]);
  f.rect(61, 45, 6, 1, WHITE); f.rect(61, 45, 1, 14, GRAY_POST); f.rect(66, 45, 1, 14, GRAY_POST);
  // bleachers: Junie, Louie and Josie cheering
  f.rect(0, 12, 38, 2, [150, 150, 160]);
  [['junie', 3], ['louie', 15], ['josie', 27]].forEach(([who, x], i) => {
    const c = FAM[who], up = blink(t + i * 200, 300), y = 2 + (up ? -1 : 0);
    if (c.long) { f.rect(x, y, 8, 2, c.hair); f.rect(x, y + 2, 1, 4, c.hair); f.rect(x + 7, y + 2, 1, 4, c.hair); } else f.rect(x + 1, y, 6, 2, c.hair);
    f.rect(x + 1, y + 2, 6, 5, SKIN); f.set(x + 2, y + 3, BLACK); f.set(x + 5, y + 3, BLACK); f.rect(x + 3, y + 5, 2, 1, MOUTH);
    f.rect(x, y + 7, 8, 3, c.shirt);
    if (up) { f.rect(x - 1, y - 2, 1, 7, SKIN); f.rect(x + 8, y - 2, 1, 7, SKIN); }
  });
  const L = [person(f, 6, 60, { ...FAM.sam, pose: 'hold' }), person(f, 36, 60, { ...FAM.max, pose: 'hold' })];
  const R = [person(f, 80, 60, { ...FAM.theo, pose: 'holdL' }), person(f, 110, 60, { ...FAM.emily, pose: 'holdL' })];
  const padL = p => [p.x + 14, p.top + 3], padR = p => [p.x - 3, p.top + 3];
  L.forEach(p => { const [x, y] = padL(p); f.rect(x, y - 3, 3, 4, [255, 80, 80]); });
  R.forEach(p => { const [x, y] = padR(p); f.rect(x - 2, y - 3, 3, 4, [80, 200, 255]); });
  // rally: 8 crossings, then a winner
  const HIT = 850, n = Math.floor(k / HIT), q = (k % HIT) / HIT, BALL = [220, 255, 60];
  const hitter = i => (i % 2 === 0 ? padL(L[(i >> 1) % 2]) : padR(R[(i >> 1) % 2]));
  if (n < 8) {
    const A = hitter(n), B = hitter(n + 1), bounce = [B[0] + (n % 2 === 0 ? -14 : 14), 59];
    f.disc(...(q < 0.7 ? arc(A, bounce, q / 0.7, 14) : arc(bounce, B, (q - 0.7) / 0.3, 4)), 1, BALL);
    f.text('PICKLEBALL', 52, 3, WHITE);
  } else {
    const p = clamp((k - 8 * HIT) / 600);
    if (p < 1) f.disc(...arc(hitter(8), [128, 52], p, 6), 1, BALL);
    const score = 3 + Math.floor(t / (SCENE * 5)) % 8;
    f.text(`POINT! ${score}-${score - 1}`, 46, 3, blink(t) ? GOLD : WHITE);
  }
}

const SCENES = [(f, k, t) => backyard(f, t), gameNight, devotions, kickball, pickleball];

export function drawFamily(f, t) {
  SCENES[Math.floor(t / SCENE) % SCENES.length](f, t % SCENE, t);
}
