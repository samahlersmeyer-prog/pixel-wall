# Pixel Wall

Max's 128×64 LED wall display — built and tested on a TV first, then moved to two Waveshare 64×64 LED panels.

- `display/` — TV simulator. Looks like the real LED panels (round dots, center seam).
- `control/` — phone controller. Pick a mode, send messages, choose teams, set brightness. Has a live preview.
- `js/renderer.js` — draws every mode into a 128×64 frame. The TV, the phone preview and (later) the LED board all use it.
- `js/data.js` — live data (ESPN scoreboards, Open-Meteo weather).
- `js/wall.js` — Firebase Realtime Database connection (project `pixel-wall-7acaf`).
- `tools/preview.mjs` — renders each mode to PNG: `node tools/preview.mjs previews`.

## Modes

Message (still / scroll / rainbow) · Clock + weather · Scoreboard (Cavs, Ohio State football & basketball, Browns, Guardians) · Christmas (snow, trees, countdown).

## Privacy

Each wall has a long random key in its link (`#w=...`). The key is never stored in this repo. Database rules only allow access to a wall by its key.

## Adding a mode

1. Add a `drawX(f, state, data, t, now)` function in `js/renderer.js` and call it from `render()`.
2. Add a button in `control/index.html` that calls `setState(id, { mode: 'x' })`.
3. Run `node tools/preview.mjs previews` to check the layout.
