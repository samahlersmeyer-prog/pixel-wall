// Renders every holiday scene at a few moments: node tools/preview-scenes.mjs out-dir
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { render, W, H } from '../js/renderer.js?v=12';
import { SCENE_COUNT } from '../js/holiday-events.js?v=12';
const out = process.argv[2] || 'scene-previews'; mkdirSync(out, { recursive: true });
const S = 3;
function png(frame) {
  const w = W * S, h = H * S, raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (Math.floor(y / S) * W + Math.floor(x / S)) * 3, o = y * (w * 3 + 1) + 1 + x * 3;
    raw[o] = frame.buf[i]; raw[o + 1] = frame.buf[i + 1]; raw[o + 2] = frame.buf[i + 2];
  }
  const T = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = 0xffffffff; for (const x of b) c = T[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const only = process.argv[3] ? process.argv[3].split(',') : null;
const now = new Date(2026, 10, 17, 8, 0);
for (const [theme, n] of Object.entries(SCENE_COUNT)) for (let k = 0; k < n; k++) {
  if (only && !only.includes(`${theme}_${k}`)) continue;
  for (const ms of [1800, 4200, 6500]) {
    const st = { mode: 'holiday', holiday: { theme }, birthday: { name: 'Max', date: '2012-11-20' }, scoreboard: { team: 'osu-fb' } };
    writeFileSync(`${out}/${theme}_${k}_${ms}.png`, png(render(st, { kick: { t: 100000, n: k } }, 100000 + ms, now)));
  }
}
console.log('done');
