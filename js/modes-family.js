// The whole family in the backyard at sunset, everyone doing their thing at once.
// Sam coaches, Emily has her nurse kit, Josie has a unicorn balloon, Junie pets a chicken,
// Theo dribbles and shoots, Max pitches to Louie, Louie hits it over everybody.
import { W, H } from './renderer.js?v=42';

const SKIN = [240, 190, 150], BLACK = [20, 20, 20], WHITE = [255, 255, 255], MOUTH = [190, 90, 90];
const LEATHER = [140, 80, 30], BAT = [225, 185, 120], ORANGE = [255, 120, 0], PINK = [255, 110, 180], GOLD = [255, 200, 40];
const LOOP = 4000;
const lerp = (a, b, p) => a + (b - a) * p;
const clamp = v => Math.max(0, Math.min(1, v));
const arc = (a, b, p, h) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p) - h * 4 * p * (1 - p)];

// A person, 12 wide and o.h tall, feet on `base`. Returns key y positions for props.
function person(f, x, base, o) {
  x = Math.round(x);
  const h = o.h, t = Math.round((h - 9) * 0.55), l = h - 9 - t, T = Math.round(base - h + 1 + (o.dy || 0));
  const top = T + 7, legTop = top + t, armLen = t - 2;
  if (o.long) { f.rect(x + 2, T, 8, 2, o.hair); f.rect(x + 2, T + 2, 1, o.long, o.hair); f.rect(x + 9, T + 2, 1, o.long, o.hair); }
  else f.rect(x + 3, T, 6, 2, o.hair);
  if (o.cap) { f.rect(x + 3, T, 6, 2, o.cap); f.rect(x + 9, T + 1, 2, 1, o.cap); }
  f.rect(x + 3, T + 2, 6, 5, SKIN);
  f.set(x + 4, T + 3, BLACK); f.set(x + 7, T + 3, BLACK);
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
  // arms
  const armL = () => f.rect(x, top, 1, armLen, SKIN), armR = () => f.rect(x + 11, top, 1, armLen, SKIN);
  const p = o.pose || 'stand';
  if (p === 'up') { f.rect(x + 1, T - 6, 2, 13, SKIN); f.rect(x + 9, T - 6, 2, 13, SKIN); }
  else if (p === 'wave') { armL(); f.rect(x + 11, T - 4, 1, 11, SKIN); }
  else if (p === 'point') { armL(); f.rect(x + 11, top + 1, 5, 1, SKIN); }
  else if (p === 'pointL') { armR(); f.rect(x - 4, top + 1, 5, 1, SKIN); }
  else if (p === 'hold') { armL(); f.rect(x + 11, top, 1, 3, SKIN); f.rect(x + 11, top + 3, 3, 1, SKIN); }
  else if (p === 'cock') { f.rect(x - 6, top + 1, 7, 2, SKIN); f.rect(x + 11, top + 1, 2, 3, LEATHER); }
  else if (p === 'throw') { f.rect(x + 11, top - 1, 6, 2, SKIN); f.rect(x - 1, top + 2, 2, 3, LEATHER); }
  else if (p === 'batLoad') { armL(); armR(); f.line(x + 9, top + 1, x + 14, top - 10, BAT); }   // batting lefty-side, facing left
  else if (p === 'batSwing') { armR(); f.rect(x - 2, top + 3, 3, 2, SKIN); f.line(x - 1, top + 4, x - 13, top + 4, BAT); }
  else if (p === 'batFollow') { armL(); armR(); f.line(x + 3, top + 1, x - 4, top - 10, BAT); }
  else { armL(); armR(); }
  return { T, top, legTop };
}

const heart = (f, x, y, c = PINK) => f.sprite(['.#.#.', '#####', '.###.', '..#..'], x, y, { '#': c });
const CHICK_HEAD = ['.rr.', 'oooo', 'ykoo'];
const CHICK_BODY = ['.oooooooo', '.ooooooooo', '..ooooooo', '...y..y..'];

const FAM = {
  sam: { h: 34, hair: [205, 205, 210], beard: [175, 175, 180], shirt: [235, 235, 240], check: [120, 130, 165], pants: [70, 60, 55] },
  emily: { h: 31, hair: [80, 50, 35], long: 10, shirt: [90, 130, 185], pants: [200, 170, 130], shoes: [150, 110, 80] },
  josie: { h: 21, hair: [215, 170, 100], long: 6, shirt: [250, 245, 240], dots: [240, 110, 120], dress: true, shoes: [240, 170, 170] },
  junie: { h: 26, hair: [215, 115, 70], long: 7, shirt: [245, 235, 215], pants: [215, 175, 205], shoes: WHITE },
  theo: { h: 29, hair: [70, 50, 35], shirt: [180, 205, 235], pants: [50, 60, 90] },
  max: { h: 33, hair: [110, 75, 45], shirt: [35, 35, 40], pants: [60, 60, 70] },
  louie: { h: 24, hair: [120, 85, 55], shirt: [190, 225, 215], pants: [190, 170, 140], shorts: true },
};

function backyard(f, t) {
  for (let y = 0; y < 44; y++) f.rect(0, y, W, 1, [lerp(40, 255, y / 44), lerp(30, 140, y / 44), lerp(90, 90, y / 44)]);
  f.disc(118, 40, 6, [255, 200, 90]);
  for (let x = 0; x < W; x += 5) f.rect(x, 36, 4, 10, [150, 100, 60]);
  f.rect(0, 38, W, 1, [110, 70, 40]); f.rect(0, 43, W, 1, [110, 70, 40]);
  for (let y = 46; y < H; y++) f.rect(0, y, W, 1, [40, 150 - (y - 46) * 2, 55]);
}

export function drawFamily(f, t) {
  const k = t % LOOP;
  backyard(f, t);
  const base = 60;

  // Theo's hoop, high on the fence post
  f.rect(63, 9, 15, 7, WHITE); f.rect(64, 10, 13, 5, [60, 70, 100]); f.rect(65, 16, 11, 1, ORANGE);
  const swish = k > 2800 && k < 3500;
  for (let i = 0; i < 4; i++) for (let x = 66 + (i >> 1); x < 75 - (i >> 1); x += 2) f.set(x + (swish && i > 1 ? Math.round(Math.sin(t / 40)) : 0), 17 + i, WHITE);

  // Sam: coaching, pointing and blowing the whistle
  const blow = Math.floor(t / 700) % 2 === 0;
  const sam = person(f, 0, base, { ...FAM.sam, pose: blow ? 'point' : 'stand' });
  f.set(6, sam.T + 6, [200, 200, 210]);
  if (blow) for (let i = 0; i < 3; i++) f.set(13 + i, sam.T + 2 + i * 2 - (i === 1 ? 1 : 0), WHITE);

  // Emily: nurse kit, sending out hearts
  const em = person(f, 15, base, { ...FAM.emily, pose: 'hold' });
  f.rect(27, em.top + 2, 6, 5, WHITE); f.rect(29, em.top + 3, 2, 3, [220, 40, 50]); f.rect(28, em.top + 4, 4, 1, [220, 40, 50]);
  const hp = (t % 2000) / 2000;
  heart(f, 28 + Math.sin(t / 200) * 2, em.top - hp * 22, PINK);

  // Josie: bouncing with her unicorn balloon
  const jo = person(f, 30, base, { ...FAM.josie, pose: 'wave', dy: -Math.abs(Math.sin(t / 250)) * 2 });
  const bx = 43 + Math.sin(t / 500) * 2, by = 14 + Math.sin(t / 400) * 2;
  f.line(41, jo.T - 4, bx, by + 4, [230, 230, 230]);
  f.disc(bx, by, 4, PINK); f.set(bx - 1, by - 1, WHITE); f.line(bx + 1, by - 4, bx + 3, by - 8, GOLD);

  // Junie: petting one of the chickens
  const ju = person(f, 45, base, { ...FAM.junie, pose: 'point' });
  const peck = Math.floor(t / 450) % 3 === 0;
  f.sprite(CHICK_BODY, 55, 54, { o: [230, 140, 50], y: GOLD });
  f.sprite(CHICK_HEAD, 55 + (peck ? -1 : 0), 51 + (peck ? 3 : 0), { r: [220, 40, 50], o: [230, 140, 50], y: GOLD, k: BLACK });
  if (t % 3000 < 1200) heart(f, 52, ju.T - 4 - (t % 3000) / 120, PINK);

  // Theo: dribble, then a jumper into the hoop
  const jump = k > 2000 && k < 2700 ? -6 * Math.sin(Math.PI * (k - 2000) / 700) : 0;
  const th = person(f, 64, base, { ...FAM.theo, pose: k < 2000 ? 'stand' : k < 2900 ? 'up' : 'stand', dy: jump });
  if (k < 2000) f.disc(77, th.legTop + Math.abs(Math.sin(k / 120)) * 9 - 4, 2, ORANGE);
  else if (k < 2800) f.disc(...arc([70, th.T - 7], [70, 16], clamp((k - 2150) / 650), 6), 2, ORANGE);
  else if (k < 3300) f.disc(70, 18 + (k - 2800) / 40, 2, ORANGE);

  // Max pitches to Louie, Louie hits it over everybody
  const mx = person(f, 82, base, { ...FAM.max, pose: k < 500 ? 'stand' : k < 800 ? 'cock' : k < 1600 ? 'throw' : 'stand' });
  const lp = k < 1100 ? 'batLoad' : k < 1300 ? 'batSwing' : k < 2200 ? 'batFollow' : 'batLoad';
  const lo = person(f, 116, base, { ...FAM.louie, pose: lp });
  const contact = [106, lo.top + 4];
  if (k > 850 && k < 1150) f.disc(lerp(99, contact[0], (k - 850) / 300), lerp(mx.top - 1, contact[1], (k - 850) / 300), 1, WHITE);
  if (k >= 1150 && k < 2700) f.disc(...arc(contact, [-8, 30], (k - 1150) / 1550, 40), 1, WHITE);
  if (k >= 1150 && k < 1400) for (let i = 0; i < 8; i++) f.set(contact[0] + Math.cos(i) * 4, contact[1] + Math.sin(i) * 4, GOLD);

  const title = 'THE AHLERSMEYERS', tw = f.textWidth(title), tx = Math.round((W - tw) / 2);
  f.text(title, tx + 1, 2, BLACK);
  f.text(title, tx, 1, WHITE);
}
