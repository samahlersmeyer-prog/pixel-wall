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
const themes = {christmas:3,newyear:2,valentines:2,stpatricks:2,easter:2,july4:2,halloween:2,thanksgiving:2,birthday:2,gameday:1};
for (const [th, n] of Object.entries(themes)) for (let k = 0; k < n; k++) for (const frac of [0.3, 0.6, 0.85]) {
  const durs = {christmas:[10000,13000,10000],newyear:[14000,7000],valentines:[9000,6000],stpatricks:[9000,8000],easter:[9000,9000],july4:[8000,8000],halloween:[8000,8000],thanksgiving:[6000,6000],birthday:[9000,8000],gameday:[6000]};
  const t = 100000 + durs[th][k] * frac;
  const st = { mode: 'holiday', holiday: { theme: th }, birthday: { name: 'Max', date: '2012-11-20' }, scoreboard: { team: 'osu-fb' } };
  writeFileSync(`${out}/${th}_${k}_${Math.round(frac*100)}.png`, png(render(st, { kick: { t: 100000, n: k } }, t, now)));
}
console.log('done');
