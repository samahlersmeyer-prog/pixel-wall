// Renders each mode to a PNG so the layouts can be checked without a browser.
// Usage: node tools/preview.mjs out-dir
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { render, W, H } from '../js/renderer.js';

const out = process.argv[2] || 'previews';
mkdirSync(out, { recursive: true });
const S = 6; // pixel size

function png(frame) {
  const w = W * S, h = H * S;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const px = Math.floor(x / S), py = Math.floor(y / S);
      const inDot = (x % S) > 0 && (y % S) > 0 && (x % S) < S - 1 && (y % S) < S - 1;
      const i = (py * W + px) * 3;
      const o = y * (w * 3 + 1) + 1 + x * 3;
      const v = inDot ? [frame.buf[i], frame.buf[i + 1], frame.buf[i + 2]].map(c => Math.max(18, c)) : [0, 0, 0];
      raw[o] = v[0]; raw[o + 1] = v[1]; raw[o + 2] = v[2];
    }
  }
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const now = new Date(2026, 10, 16, 21, 41);
const game = { kind: 'game', state: 'in', status: 'Q4 2:31',
  away: { abbr: 'BOS', score: 98, color: '#008348' }, home: { abbr: 'CLE', score: 104, color: '#860038' } };
const cfp = { poll: 'cfp', ranks: ['UGA','UTAH','ALA','UCLA','ND','TEX','MIA','TENN','IU','BYU','UK','TTU'].map((a, i) => ({ abbr: a, color: ['#ba0c2f','#cc0000','#9e1b32','#2d68c4','#0c2340','#bf5700','#f47321','#ff8200','#990000','#002e5d','#0033a0','#cc0000'][i] })) };
const { STATES } = await import('../js/usmap-data.js');
const mapWeather = STATES.map(s => Math.round(75 - (s.lat - 25) * 2.4));
const cases = {
  message: [{ mode: 'message', message: { text: 'HELLO MAX', color: '#3fa9f5', anim: 'static' } }, {}],
  message_long: [{ mode: 'message', message: { text: 'GO BUCKS! BEAT MICHIGAN', color: '#bb0000', anim: 'rainbow' } }, {}],
  scroll: [{ mode: 'message', message: { text: 'MERRY CHRISTMAS', color: '#34c759', anim: 'scroll' } }, {}, 2500],
  clock: [{ mode: 'clock' }, { weather: { temp: 34.2, label: 'CLOUDY' } }],
  scoreboard: [{ mode: 'scoreboard' }, { game }],
  scoreboard_final: [{ mode: 'scoreboard' }, { game: { ...game, state: 'post', status: 'Final' } }],
  next: [{ mode: 'scoreboard' }, { game: { kind: 'next', team: { abbr: 'OSU', color: '#bb0000' }, line: 'VS MICH SAT 11/28 12:00 PM' } }],
  christmas: [{ mode: 'christmas' }, {}, 4000],
  cfp_top12: [{ mode: 'cfp' }, { cfp }, 1000],
  cfp_round1: [{ mode: 'cfp' }, { cfp }, 8000],
  cfp_qf: [{ mode: 'cfp' }, { cfp }, 15000],
  calendar: [{ mode: 'calendar', events: [
    { title: 'XC practice', date: '2026-11-16', time: '15:30' }, { title: 'Holy Cross hoops', date: '2026-11-16', time: '18:00' },
    { title: 'Mad Apple workout', date: '2026-11-20', time: '18:00' }, { title: 'Ohio State @ Nebraska', date: '2026-11-21', time: '12:00' },
    { title: 'Thanksgiving', date: '2026-11-26' }] }, {}],
  countdown: [{ mode: 'countdown', countdown: { title: 'Christmas', date: '2026-12-25' } }, {}],
  map_weather: [{ mode: 'map', map: { view: 'weather' } }, { mapWeather }],
  map_quiz: [{ mode: 'map', map: { view: 'quiz' } }, {}, 2000],
  map_quiz_reveal: [{ mode: 'map', map: { view: 'quiz' } }, {}, 7500],
  map_visited: [{ mode: 'map', map: { view: 'visited' }, visited: ['IN', 'OH', 'MI', 'IL', 'KY', 'FL', 'TN', 'GA', 'NY', 'PA', 'WI', 'CO'] }, {}],
  fun_life: [{ mode: 'fun', fun: { view: 'life' } }, {}, 3000],
  fun_matrix: [{ mode: 'fun', fun: { view: 'matrix' } }, {}, 3000],
  fun_warp: [{ mode: 'fun', fun: { view: 'warp' } }, {}, 3000],
  fun_plasma: [{ mode: 'fun', fun: { view: 'plasma' } }, {}, 3000],
  fun_fireworks: [{ mode: 'fun', fun: { view: 'fireworks' } }, {}, 3000],
  fun_pong: [{ mode: 'fun', fun: { view: 'pong' } }, {}, 3000],
};
for (const th of ['newyear', 'valentines', 'stpatricks', 'easter', 'july4', 'halloween', 'thanksgiving', 'birthday', 'gameday', 'auto']) {
  cases['holiday_' + th] = [{ mode: 'holiday', holiday: { theme: th }, birthday: { name: 'Max', date: '2012-11-20' }, scoreboard: { team: 'osu-fb' } }, {}, 2600];
}
cases.holiday_easter_day = [{ mode: 'holiday', holiday: { theme: 'easter' } }, {}, 2600, new Date(2027, 2, 28, 9)];
for (const [name, [st, data, t = 1000, when = now]] of Object.entries(cases)) {
  writeFileSync(`${out}/${name}.png`, png(render(st, data, t, when)));
}
console.log('wrote', Object.keys(cases).length, 'previews to', out);
