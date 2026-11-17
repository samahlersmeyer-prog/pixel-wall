#!/usr/bin/env python3
"""Pixel Wall launcher for the Raspberry Pi.

Shows one thing at a time on the screen: the home menu, the Pixel Wall, one of
the family web apps, or RetroArch for retro games.

- The home menu is served at http://localhost:8765/ and opened in Chromium kiosk mode.
- Hold SELECT + START on any controller (or press F12 on a keyboard) to come back
  to the menu from anywhere, including the middle of a game.
- On boot it opens the "start" tile from config.json (the Pixel Wall).
"""
import glob
import http.server
import json
import os
import shutil
import signal
import socketserver
import subprocess
import sys
import threading
import time
import urllib.parse

BASE = os.path.dirname(os.path.abspath(__file__))
CONF = os.path.join(BASE, 'config.json')
MENU_DIR = os.path.join(BASE, 'menu')
PORT = 8765
HOME = os.path.expanduser('~')
ROMS = os.path.join(HOME, 'roms')

state = {'proc': None, 'kind': None, 'last_hotkey': 0}
lock = threading.Lock()


def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)


def load_config():
    with open(CONF) as f:
        return json.load(f)


def chromium():
    for name in ('chromium-browser', 'chromium'):
        path = shutil.which(name)
        if path:
            return path
    raise SystemExit('Chromium is not installed')


def stop_current():
    p = state['proc']
    if p and p.poll() is None:
        try:
            os.killpg(p.pid, signal.SIGTERM)
            p.wait(timeout=6)
        except Exception:
            try:
                os.killpg(p.pid, signal.SIGKILL)
            except Exception:
                pass
    state['proc'] = None
    state['kind'] = None


def open_url(url):
    with lock:
        stop_current()
        args = [
            chromium(), '--kiosk', '--noerrdialogs', '--disable-infobars', '--no-first-run',
            '--disable-session-crashed-bubble', '--disable-features=Translate',
            '--check-for-update-interval=31536000', '--password-store=basic',
            '--autoplay-policy=no-user-gesture-required',
            '--user-data-dir=' + os.path.join(BASE, 'chrome-profile'), url,
        ]
        state['proc'] = subprocess.Popen(args, start_new_session=True,
                                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        state['kind'] = 'web'
        log('opened', url.split('#')[0])


# ---------------- retro games ----------------
SYSTEMS = {
    # folder: (playlist / thumbnail database name, preferred cores)
    'snes': ('Nintendo - Super Nintendo Entertainment System', ['snes9x', 'snes9x2010', 'bsnes']),
    'nes': ('Nintendo - Nintendo Entertainment System', ['nestopia', 'fceumm', 'quicknes']),
    'gb': ('Nintendo - Game Boy', ['gambatte', 'mgba']),
    'gbc': ('Nintendo - Game Boy Color', ['gambatte', 'mgba']),
    'gba': ('Nintendo - Game Boy Advance', ['mgba']),
    'genesis': ('Sega - Mega Drive - Genesis', ['genesis_plus_gx', 'picodrive']),
    'n64': ('Nintendo - Nintendo 64', ['mupen64plus_next', 'parallel_n64']),
}
ROM_EXT = {'.sfc', '.smc', '.nes', '.gb', '.gbc', '.gba', '.md', '.gen', '.bin', '.smd', '.n64', '.z64', '.v64', '.zip', '.7z'}


def retroarch_dirs(cfg):
    if cfg.get('retroarch', {}).get('flatpak'):
        root = os.path.join(HOME, '.var/app/org.libretro.RetroArch/config/retroarch')
        cores = [os.path.join(root, 'cores')]
    else:
        root = os.path.join(HOME, '.config/retroarch')
        cores = glob.glob('/usr/lib/*/libretro') + [os.path.join(root, 'cores')]
    return root, cores


def find_core(core_dirs, names):
    for n in names:
        for d in core_dirs:
            p = os.path.join(d, f'{n}_libretro.so')
            if os.path.exists(p):
                return p
    return 'DETECT'


def build_playlists(cfg):
    """One RetroArch playlist per folder in ~/roms, so games show up with box art."""
    root, core_dirs = retroarch_dirs(cfg)
    pl_dir = os.path.join(root, 'playlists')
    os.makedirs(pl_dir, exist_ok=True)
    for folder, (db, cores) in SYSTEMS.items():
        d = os.path.join(ROMS, folder)
        files = sorted(f for f in glob.glob(os.path.join(d, '*')) if os.path.splitext(f)[1].lower() in ROM_EXT)
        path = os.path.join(pl_dir, db + '.lpl')
        if not files:
            continue
        core = find_core(core_dirs, cores)
        items = [{
            'path': f, 'label': os.path.splitext(os.path.basename(f))[0],
            'core_path': 'DETECT', 'core_name': 'DETECT', 'crc32': 'DETECT', 'db_name': db + '.lpl',
        } for f in files]
        playlist = {
            'version': '1.5', 'default_core_path': '' if core == 'DETECT' else core,
            'default_core_name': '', 'label_display_mode': 0, 'right_thumbnail_mode': 0,
            'left_thumbnail_mode': 0, 'sort_mode': 0, 'items': items,
        }
        with open(path, 'w') as fh:
            json.dump(playlist, fh, indent=2)


def open_games():
    cfg = load_config()
    try:
        build_playlists(cfg)
    except Exception as e:
        log('playlist error', e)
    cmd = cfg.get('retroarch', {}).get('command', 'retroarch --fullscreen').split()
    with lock:
        stop_current()
        p = subprocess.Popen(cmd, start_new_session=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        state['proc'], state['kind'] = p, 'games'
        log('opened retroarch')
    threading.Thread(target=_back_to_menu_when_closed, args=(p,), daemon=True).start()


def _back_to_menu_when_closed(p):
    p.wait()
    time.sleep(0.5)
    if state['proc'] is p:  # quit from inside RetroArch -> back to the menu
        go_menu()


def go_menu():
    open_url(f'http://localhost:{PORT}/')


def open_tile(tile_id):
    cfg = load_config()
    tile = next((t for t in cfg['tiles'] if t['id'] == tile_id), None)
    if not tile:
        return False
    if tile.get('type') == 'games':
        open_games()
    elif tile_id == 'menu':
        go_menu()
    else:
        open_url(tile['url'])
    return True


# ---------------- controller hotkey ----------------
# SELECT+START differs by controller brand, so a few common button pairs count.
HOTKEY_PAIRS = [{314, 315}, {296, 297}, {298, 299}]  # BTN_SELECT/START, generic pads
HOTKEY_SINGLE = {316, 88}                            # Xbox/guide button, keyboard F12


def hotkey_watcher():
    try:
        import evdev
    except ImportError:
        log('python3-evdev missing: controller hotkey disabled')
        return
    watching = set()

    def watch(path):
        try:
            dev = evdev.InputDevice(path)
            pressed = set()
            for ev in dev.read_loop():
                if ev.type != evdev.ecodes.EV_KEY:
                    continue
                if ev.value == 1:
                    pressed.add(ev.code)
                elif ev.value == 0:
                    pressed.discard(ev.code)
                hit = any(pair <= pressed for pair in HOTKEY_PAIRS) or (ev.value == 1 and ev.code in HOTKEY_SINGLE)
                if hit and time.time() - state['last_hotkey'] > 2:
                    state['last_hotkey'] = time.time()
                    log('hotkey -> menu')
                    threading.Thread(target=go_menu, daemon=True).start()
        except Exception:
            pass
        finally:
            watching.discard(path)

    while True:  # pick up controllers plugged in later
        for path in evdev.list_devices():
            if path not in watching:
                try:
                    caps = evdev.InputDevice(path).capabilities().get(evdev.ecodes.EV_KEY, [])
                except Exception:
                    continue
                if any(c in caps for c in (314, 315, 296, 297, 316, 288, 304, 88)):
                    watching.add(path)
                    threading.Thread(target=watch, args=(path,), daemon=True).start()
        time.sleep(3)


# ---------------- web server for the menu ----------------
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=MENU_DIR, **kw)

    def log_message(self, *a):
        pass

    def _json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        q = urllib.parse.parse_qs(u.query)
        if u.path == '/config':
            cfg = load_config()
            tiles = [{k: v for k, v in t.items() if k != 'url'} for t in cfg['tiles']]
            games = sum(1 for f in glob.glob(os.path.join(ROMS, '*', '*')) if os.path.splitext(f)[1].lower() in ROM_EXT)
            return self._json({'tiles': tiles, 'idleMinutes': cfg.get('idle_minutes', 5), 'idleTile': cfg.get('start', 'wall'), 'games': games})
        if u.path == '/open':
            tid = (q.get('id') or [''])[0]
            # Answer first, then switch screens (switching closes this browser).
            threading.Timer(0.3, open_tile, args=(tid,)).start()
            return self._json({'ok': True})
        if u.path in ('/', '/index.html'):
            self.path = '/index.html'
        return super().do_GET()


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def main():
    try:
        server = Server(('127.0.0.1', PORT), Handler)
    except OSError:
        log('launcher already running')
        return
    threading.Thread(target=server.serve_forever, daemon=True).start()
    threading.Thread(target=hotkey_watcher, daemon=True).start()
    time.sleep(2)  # let the desktop finish starting
    cfg = load_config()
    if not open_tile(cfg.get('start', 'wall')):
        go_menu()
    # If the browser ever crashes or gets closed, bring the menu back.
    while True:
        time.sleep(5)
        p = state['proc']
        if p is not None and p.poll() is not None and state['kind'] == 'web' and not lock.locked():
            log('browser closed; reopening menu')
            go_menu()


if __name__ == '__main__':
    signal.signal(signal.SIGTERM, lambda *a: (stop_current(), sys.exit(0)))
    main()
