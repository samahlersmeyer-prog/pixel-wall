// Live data: ESPN public scoreboards and Open-Meteo weather.
// Runs in the browser today; later the same code can run in a Cloud Function.

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports';
export const LEAGUES = {
  nba: { path: 'basketball/nba', q: '' },
  nfl: { path: 'football/nfl', q: '' },
  mlb: { path: 'baseball/mlb', q: '' },
  nhl: { path: 'hockey/nhl', q: '' },
  cfb: { path: 'football/college-football', q: '?groups=80' },
  cbb: { path: 'basketball/mens-college-basketball', q: '?groups=50' },
};

export const TEAMS = [
  { key: 'cavs', label: 'Cavaliers', league: 'nba', abbr: 'CLE', id: '5' },
  { key: 'osu-fb', label: 'Ohio State Football', league: 'cfb', abbr: 'OSU', id: '194' },
  { key: 'osu-bb', label: 'Ohio State Basketball', league: 'cbb', abbr: 'OSU', id: '194' },
  { key: 'browns', label: 'Browns', league: 'nfl', abbr: 'CLE', id: '5' },
  { key: 'guardians', label: 'Guardians', league: 'mlb', abbr: 'CLE', id: '5' },
];

function side(c) {
  const t = c.team || {};
  return {
    abbr: (t.abbreviation || t.shortDisplayName || '???').toUpperCase(),
    score: Number(c.score?.value ?? c.score ?? 0),
    color: '#' + (t.color || 'ffffff'),
    alt: '#' + (t.alternateColor || 'ffffff'),
    id: String(t.id || ''),
  };
}

// ESPN colors are often navy/black; pick the brighter of primary/alternate.
function lum(h) {
  const n = parseInt(h.slice(1), 16);
  return 0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255);
}
function pickColor(s) {
  if (lum(s.color) < 25 && lum(s.alt) > lum(s.color)) s.color = s.alt;
  return s;
}

export async function fetchGame(team) {
  const lg = LEAGUES[team.league];
  if (!lg) return { kind: 'error' };
  const match = c => String(c.team?.id) === team.id || c.team?.abbreviation?.toUpperCase() === team.abbr;
  try {
    const r = await fetch(`${ESPN}/${lg.path}/scoreboard${lg.q}`);
    const j = await r.json();
    const ev = (j.events || []).find(e => e.competitions?.[0]?.competitors?.some(match));
    if (ev) {
      const comp = ev.competitions[0];
      const away = pickColor(side(comp.competitors.find(c => c.homeAway === 'away')));
      const home = pickColor(side(comp.competitors.find(c => c.homeAway === 'home')));
      const st = comp.status || ev.status || {};
      return {
        kind: 'game', away, home,
        state: st.type?.state || 'pre',
        status: st.type?.shortDetail || st.type?.description || '',
      };
    }
    // No game today: show the next one.
    const tr = await fetch(`${ESPN}/${lg.path}/teams/${team.league === 'cfb' || team.league === 'cbb' ? team.id : team.abbr.toLowerCase()}`);
    const tj = await tr.json();
    const t = tj.team || {};
    const me = pickColor({ color: '#' + (t.color || 'ffffff'), alt: '#' + (t.alternateColor || 'ffffff') });
    const next = t.nextEvent?.[0];
    let line = 'NONE SCHEDULED';
    if (next) {
      const comp = next.competitions?.[0];
      const opp = comp?.competitors?.find(c => !match(c));
      const home = comp?.competitors?.find(c => match(c))?.homeAway === 'home';
      const d = new Date(next.date);
      const wd = d.toLocaleDateString('en-US', { weekday: 'short' });
      const md = `${d.getMonth() + 1}/${d.getDate()}`;
      let h = d.getHours(); const mm = d.getMinutes(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
      const time = `${h}${mm ? ':' + String(mm).padStart(2, '0') : ''}${ap}`;
      const who = `${home ? 'VS' : '@'} ${opp?.team?.abbreviation || ''}`;
      line = `${who} ${wd} ${md} ${time}`.toUpperCase();
      if (line.length > 21) line = `${who} ${md} ${time}`.toUpperCase();
    }
    return { kind: 'next', team: { abbr: team.abbr, color: me.color }, line };
  } catch (e) {
    console.warn('score fetch failed', e);
    return { kind: 'error' };
  }
}

// ---------- College Football Playoff ----------
const CORE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/rankings';
const refId = r => String(r?.team?.$ref || '').replace(/\?.*/, '').split('/').pop();

export async function fetchCfp() {
  try {
    // Official seedings (December) if they're current, otherwise the committee's weekly top 25.
    let poll = 'cfp', j = null;
    const seed = await fetch(`${CORE}/22`).then(r => r.json()).catch(() => null);
    if (seed?.date && Date.now() - Date.parse(seed.date) < 40 * 864e5) { j = seed; poll = 'seed'; }
    if (!j) j = await fetch(`${CORE}/21`).then(r => r.json()).catch(() => null);
    if (!j || Date.now() - Date.parse(j.date) > 200 * 864e5) {
      // No current committee rankings: fall back to the AP poll.
      const ap = await fetch(`${ESPN}/football/college-football/rankings`).then(r => r.json());
      const r = ap.rankings.find(x => x.type === 'ap');
      return { poll: 'ap', ranks: r.ranks.slice(0, 12).map(x => ({ abbr: x.team.abbreviation, color: '#' + (x.team.color || 'ffffff') })) };
    }
    const ids = j.ranks.slice(0, 12).map(refId);
    const ap = await fetch(`${ESPN}/football/college-football/rankings`).then(r => r.json()).catch(() => ({ rankings: [] }));
    const known = {};
    for (const rk of ap.rankings || []) for (const x of rk.ranks || []) known[x.team.id] = x.team;
    const teams = await Promise.all(ids.map(async id => known[id] || (await fetch(`${ESPN}/football/college-football/teams/${id}`).then(r => r.json()).catch(() => ({}))).team || {}));
    return { poll, headline: j.headline, ranks: teams.map(t => ({ abbr: (t.abbreviation || '?').toUpperCase(), color: '#' + (t.color || 'ffffff') })) };
  } catch (e) {
    console.warn('cfp fetch failed', e);
    return { error: true };
  }
}

// ---------- weather for every state (map mode) ----------
export async function fetchMapWeather(states) {
  try {
    const lat = states.map(s => s.lat).join(','), lon = states.map(s => s.lon).join(',');
    const j = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&temperature_unit=fahrenheit`).then(r => r.json());
    return (Array.isArray(j) ? j : [j]).map(x => x?.current?.temperature_2m ?? null);
  } catch (e) {
    console.warn('map weather failed', e);
    return null;
  }
}

const WX = [
  [[0], 'CLEAR'], [[1, 2], 'PARTLY CLOUDY'], [[3], 'CLOUDY'], [[45, 48], 'FOG'],
  [[51, 53, 55, 56, 57], 'DRIZZLE'], [[61, 63, 65, 66, 67, 80, 81, 82], 'RAIN'],
  [[71, 73, 75, 77, 85, 86], 'SNOW'], [[95, 96, 99], 'STORMS'],
];

export async function fetchWeather(lat = 41.08, lon = -85.14) {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=auto`);
    const j = await r.json();
    const code = j.current?.weather_code;
    const label = (WX.find(([codes]) => codes.includes(code)) || [0, ''])[1];
    return { temp: j.current?.temperature_2m, label };
  } catch (e) {
    console.warn('weather fetch failed', e);
    return null;
  }
}

export async function fetchForecast(lat = 41.08, lon = -85.14) {
  try {
    const j = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&forecast_days=4&timezone=auto`).then(r => r.json());
    const lab = c => (WX.find(([codes]) => codes.includes(c)) || [0, 'CLOUDY'])[1];
    const days = j.daily.time.slice(1, 4).map((d, i) => ({
      dow: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date(d + 'T12:00:00').getDay()],
      hi: j.daily.temperature_2m_max[i + 1], lo: j.daily.temperature_2m_min[i + 1], label: lab(j.daily.weather_code[i + 1]),
    }));
    return { now: { temp: j.current.temperature_2m, label: lab(j.current.weather_code) }, days };
  } catch (e) {
    console.warn('forecast failed', e);
    return null;
  }
}

// Is this mode on screen, or part of the rotation?
export function usesMode(st, m) {
  if (st.mode === m) return true;
  if (st.mode !== 'rotate') return false;
  const list = st.rotate?.modes?.length ? st.rotate.modes : ['clock', 'weather', 'scoreboard', 'holiday', 'calendar'];
  return list.includes(m);
}

// Keeps data fresh for whatever mode is showing. Calls onData(data) on change.
export function startData(getState, onData) {
  const data = {};
  let lastTeamKey = '', gameTimer = null;

  async function pollGame() {
    const st = getState() || {};
    const team = TEAMS.find(t => t.key === st.scoreboard?.team) || TEAMS[0];
    if (team.key !== lastTeamKey) { data.game = null; lastTeamKey = team.key; onData(data); }
    if (usesMode(st, 'scoreboard')) {
      data.game = await fetchGame(team);
      onData(data);
    }
    const live = data.game?.state === 'in';
    gameTimer = setTimeout(pollGame, usesMode(st, 'scoreboard') ? (live ? 20000 : 120000) : 5000);
  }
  async function pollWeather() {
    const w = await fetchWeather();
    if (w) { data.weather = w; onData(data); }
    setTimeout(pollWeather, 15 * 60 * 1000);
  }
  const stamps = {};
  async function pollExtras() {
    const st = getState() || {};
    const stale = (k, ms) => !stamps[k] || Date.now() - stamps[k] > ms;
    if (usesMode(st, 'weather') && stale('fc', 20 * 60 * 1000)) {
      stamps.fc = Date.now();
      const fc = await fetchForecast();
      if (fc) { data.forecast = fc; onData(data); } else stamps.fc = 0;
    }
    if (usesMode(st, 'cfp') && stale('cfp', 30 * 60 * 1000)) {
      stamps.cfp = Date.now();
      data.cfp = await fetchCfp(); onData(data);
    }
    if (usesMode(st, 'map') && (st.map?.view || 'weather') === 'weather' && stale('map', 20 * 60 * 1000)) {
      stamps.map = Date.now();
      const { STATES } = await import('./usmap-data.js?v=37');
      const temps = await fetchMapWeather(STATES);
      if (temps) { data.mapWeather = temps; onData(data); } else stamps.map = 0;
    }
    if (usesMode(st, 'holiday') && st.holiday?.theme === 'gameday' && !usesMode(st, 'scoreboard') && stale('gd', 120000)) {
      stamps.gd = Date.now();
      const team = TEAMS.find(t => t.key === st.scoreboard?.team) || TEAMS[1];
      data.game = await fetchGame(team); onData(data);
    }
    setTimeout(pollExtras, 3000);
  }
  pollGame(); pollWeather(); pollExtras();
  return { data, refresh() { clearTimeout(gameTimer); pollGame(); } };
}
