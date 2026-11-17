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
      const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      line = `${home ? 'VS' : '@'} ${opp?.team?.abbreviation || ''} ${day} ${time}`.toUpperCase();
    }
    return { kind: 'next', team: { abbr: team.abbr, color: me.color }, line };
  } catch (e) {
    console.warn('score fetch failed', e);
    return { kind: 'error' };
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

// Keeps data fresh for whatever mode is showing. Calls onData(data) on change.
export function startData(getState, onData) {
  const data = {};
  let lastTeamKey = '', gameTimer = null;

  async function pollGame() {
    const st = getState() || {};
    const team = TEAMS.find(t => t.key === st.scoreboard?.team) || TEAMS[0];
    if (team.key !== lastTeamKey) { data.game = null; lastTeamKey = team.key; onData(data); }
    if (st.mode === 'scoreboard') {
      data.game = await fetchGame(team);
      onData(data);
    }
    const live = data.game?.state === 'in';
    gameTimer = setTimeout(pollGame, st.mode === 'scoreboard' ? (live ? 20000 : 120000) : 5000);
  }
  async function pollWeather() {
    const w = await fetchWeather();
    if (w) { data.weather = w; onData(data); }
    setTimeout(pollWeather, 15 * 60 * 1000);
  }
  pollGame(); pollWeather();
  return { data, refresh() { clearTimeout(gameTimer); pollGame(); } };
}
