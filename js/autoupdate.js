// Keeps saved Home Screen apps (and the TV) on the newest version.
// Each page carries <meta name="app-version">; version.json on the site holds the latest number.
// When they differ, the page reloads itself with a fresh URL so iOS/GitHub caches can't serve the old one.
const mine = document.querySelector('meta[name="app-version"]')?.content;
const base = new URL('../version.json', import.meta.url);

async function check() {
  try {
    const r = await fetch(base + '?t=' + Date.now(), { cache: 'no-store' });
    const { v } = await r.json();
    if (!v || String(v) === String(mine)) return;
    // don't loop if the fresh copy somehow still comes back old; try again on the next check
    const tried = sessionStorage.getItem('pwTried');
    if (tried === `${v}@${Math.floor(Date.now() / 120000)}`) return;
    sessionStorage.setItem('pwTried', `${v}@${Math.floor(Date.now() / 120000)}`);
    const u = new URL(location.href);
    u.searchParams.set('u', v);
    location.replace(u.toString());
  } catch (e) { /* offline: try later */ }
}

check();
document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
window.addEventListener('pageshow', e => { if (e.persisted) check(); });
setInterval(check, 120000);
