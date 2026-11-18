// Info modes: CFP rankings + projected bracket, calendar, countdown.
import { brighten, W } from './renderer.js?v=14';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const YELLOW = [255, 210, 60], WHITE = [255, 255, 255], DIM = [150, 150, 150];

export function drawCfp(f, st, data, t) {
  const c = data.cfp;
  if (!c || !c.ranks?.length) {
    f.center('CFP', 14, YELLOW, 3);
    f.center(c?.error ? 'NO RANKINGS YET' : 'LOADING...', 46, DIM);
    return;
  }
  const r = c.ranks.slice(0, 12);
  const team = i => r[i - 1] || { abbr: '?', color: '#888888' };
  const page = Math.floor(t / 7000) % 3;
  if (page === 0) {
    f.center(c.poll === 'cfp' ? 'CFP TOP 12' : 'AP TOP 12', 1, YELLOW);
    r.forEach((tm, i) => {
      const col = i < 6 ? 0 : 1, row = i % 6;
      const x = col ? 68 : 6, y = 10 + row * 9;
      const n = String(i + 1);
      f.text(n, x + (n.length === 1 ? 6 : 0), y, DIM);
      f.text(tm.abbr.slice(0, 4), x + 16, y, brighten(tm.color, 160));
    });
    return;
  }
  const games = page === 1
    ? [[5, 12], [6, 11], [7, 10], [8, 9]]
    : [[1, '8/9'], [2, '7/10'], [3, '6/11'], [4, '5/12']];
  f.center(page === 1 ? 'FIRST ROUND' : 'QUARTERFINALS', 1, YELLOW);
  games.forEach(([a, b], i) => {
    const y = 11 + i * 11;
    const A = team(a);
    f.text(`${a}`, 2, y, DIM);
    f.text(A.abbr.slice(0, 4), 16, y, brighten(A.color, 160));
    f.center('V', y, DIM);
    if (typeof b === 'number') {
      const B = team(b);
      const s = B.abbr.slice(0, 4);
      f.text(s, W - 18 - f.textWidth(s), y, brighten(B.color, 160));
      f.text(String(b), W - 2 - f.textWidth(String(b)), y, DIM);
    } else {
      f.text(`W ${b}`, W - 2 - f.textWidth(`W ${b}`), y, WHITE);
    }
  });
  f.center('PROJECTED BY RANK', 57, [110, 110, 110]);
}

function fmtTime(hm) {
  if (!hm) return '';
  let [h, m] = hm.split(':').map(Number);
  const pm = h >= 12; h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')}${pm ? 'P' : 'A'}`;
}

function dayKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

export function drawCalendar(f, st, now) {
  const today = dayKey(now);
  const events = (st.events || [])
    .filter(e => e && e.date >= today)
    .sort((a, b) => (a.date + (a.time || '99')).localeCompare(b.date + (b.time || '99')));
  f.center(`${DAYS[now.getDay()]} ${MONTHS[now.getMonth()]} ${now.getDate()}`, 1, YELLOW);
  if (!events.length) {
    f.center('NOTHING ON THE', 24, DIM);
    f.center('CALENDAR', 34, DIM);
    return;
  }
  let y = 12;
  for (const e of events.slice(0, 6)) {
    const isToday = e.date === today;
    const d = new Date(e.date + 'T12:00:00');
    const prefix = isToday ? '' : DAYS[d.getDay()] + ' ';
    const time = fmtTime(e.time);
    const head = `${prefix}${time}`;
    const hw = head ? f.textWidth(head) + 6 : 0;
    if (head) f.text(head, 2, y, isToday ? [120, 200, 255] : DIM);
    const room = Math.floor((W - 4 - hw) / 6);
    f.text(String(e.title || '').toUpperCase().slice(0, room), 2 + hw, y, isToday ? WHITE : [200, 200, 200]);
    y += 9;
  }
}

export function drawCountdown(f, st, now, t) {
  const c = st.countdown || {};
  if (!c.date) { f.center('SET A COUNTDOWN', 24, DIM); f.center('ON YOUR PHONE', 34, DIM); return; }
  const target = new Date(c.date + 'T00:00:00');
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((target - today) / 864e5);
  const title = String(c.title || 'THE BIG DAY').toUpperCase();
  const color = [255, 120, 40];
  if (days <= 0) {
    const flash = Math.floor(t / 400) % 2 === 0;
    f.center(days === 0 ? 'TODAY!' : 'DONE!', 10, flash ? YELLOW : color, 3);
    f.center(title.slice(0, 21), 44, WHITE);
    return;
  }
  const n = String(days);
  f.center(n, 4, WHITE, n.length > 3 ? 3 : 4);
  f.center(days === 1 ? 'DAY UNTIL' : 'DAYS UNTIL', 40, DIM);
  const scale = f.textWidth(title, 2) <= W - 4 ? 2 : 1;
  f.center(title.slice(0, 21), scale === 2 ? 49 : 52, color, scale);
}

// ---------- 3-day weather ----------
const ICONS = {
  SUN: ['....y....', '.y.....y.', '...YYY...', 'y.YYYYY.y', '..YYYYY..', '...YYY...', '.y.....y.', '....y....'],
  PARTLY: ['.y...y...', '..YYY....', '.YYYWWW..', '..YWWWWW.', '.WWWWWWWW', 'WWWWWWWWW', '.WWWWWWW.', '.........'],
  CLOUD: ['.........', '...WWW...', '..WWWWW..', '.WWWWWWWW', 'WWWWWWWWW', '.WWWWWWW.', '.........', '.........'],
  RAIN: ['...WWW...', '..WWWWW..', '.WWWWWWWW', 'WWWWWWWWW', '.WWWWWWW.', '.b.b.b.b.', 'b.b.b.b..', '.........'],
  SNOW: ['...WWW...', '..WWWWW..', '.WWWWWWWW', 'WWWWWWWWW', '.WWWWWWW.', '.s.s.s.s.', 's.s.s.s..', '.........'],
  STORM: ['...WWW...', '..WWWWW..', '.WWWWWWWW', 'WWWWWWWWW', '.WWWYWWW.', '...YY....', '..YY.....', '.YY......'],
  FOG: ['.........', 'GGGGGGGG.', '.........', '.GGGGGGGG', '.........', 'GGGGGGGG.', '.........', '.GGGGGGG.'],
};
const ICON_P = { y: [255, 200, 40], Y: [255, 220, 60], W: [210, 215, 225], b: [80, 150, 255], s: [235, 245, 255], G: [150, 150, 160] };
const iconFor = label => ({ CLEAR: 'SUN', 'PARTLY CLOUDY': 'PARTLY', CLOUDY: 'CLOUD', FOG: 'FOG', DRIZZLE: 'RAIN', RAIN: 'RAIN', SNOW: 'SNOW', STORMS: 'STORM' }[label] || 'CLOUD');

export function drawForecast(f, st, data) {
  const fc = data.forecast;
  if (!fc) { f.center('WEATHER', 20, YELLOW, 2); f.center('LOADING...', 44, DIM); return; }
  f.sprite(ICONS[iconFor(fc.now.label)], 4, 3, ICON_P, 2);
  f.text(`${Math.round(fc.now.temp)}°`, 28, 4, WHITE, 2);
  f.text(fc.now.label.slice(0, 13), 28, 21, DIM);
  f.text('FORT', W - 26, 4, YELLOW); f.text('WAYNE', W - 31, 13, YELLOW);
  f.rect(2, 31, W - 4, 1, [50, 50, 60]);
  fc.days.slice(0, 3).forEach((d, i) => {
    const x0 = i * 43, cx = x0 + 21;
    f.center(d.dow, 34, i === 0 ? [120, 200, 255] : WHITE, 1, x0, x0 + 43);
    f.sprite(ICONS[iconFor(d.label)], cx - 4, 43, ICON_P);
    f.center(`${Math.round(d.hi)}/${Math.round(d.lo)}`, 55, [255, 200, 120], 1, x0, x0 + 43);
  });
}
