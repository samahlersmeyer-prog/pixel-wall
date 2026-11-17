# Pixel Wall on a Raspberry Pi

One box behind the monitor that shows the Pixel Wall, a home menu of the family's web apps, and retro games.

## Setup (about 20 minutes, once)

1. **Flash the card** (skip if your kit's card came pre-loaded): use Raspberry Pi Imager on the Mac → *Raspberry Pi 5* →
   *Raspberry Pi OS (64-bit)*. In the settings, set the hostname to `pixelpi`, your Wi-Fi, and a username/password.
2. **Boot the Pi** with a keyboard and mouse plugged in, finish the welcome screens, connect to Wi-Fi.
3. **Open Terminal** and paste (use your wall key — the part after `#w=` in your Pixel Wall TV link):

   ```
   curl -fsSL https://samahlersmeyer-prog.github.io/pixel-wall/pi/setup.sh | bash -s -- YOUR_WALL_KEY
   ```
4. `sudo reboot`. It comes up on the Pixel Wall. Unplug the keyboard and mouse.

## Using it

- **Drive the wall with the controller** while it's on screen: D-pad ◀ ▶ changes screens, ▲ ▼ changes the option (holiday, team, fun scene, map), **A** plays a holiday surprise, **LB/RB** dim/brighten, **Y** shows the button guide. Arrow keys / Enter / H do the same on a keyboard. The phone controller stays in sync.
- **Hold SELECT + START** on a controller (or press **Esc** or **Home** on a keyboard) to open the home menu from anywhere, even mid-game.
- D-pad to pick a tile, **A** to open it. After 5 minutes of no input, the menu goes back to the wall.
- **Retro Games** opens RetroArch with a list per system (SNES, NES, Game Boy, GBA, Genesis, N64).

## Adding games

From the Mac: Finder → Go → Connect to Server → `smb://pixelpi.local/roms` → drop games into the matching folder
(`snes`, `nes`, `gb`, `gbc`, `gba`, `genesis`, `n64`). They show up the next time you open Retro Games.
For box art: in RetroArch, Online Updater → Playlist Thumbnails Updater.

## Changing the menu

Edit `~/pixel-wall-pi/config.json` on the Pi (tiles, start screen, idle minutes). Run the setup command again (no key needed) to update the software.

## Preview

The menu can be previewed in any browser: https://samahlersmeyer-prog.github.io/pixel-wall/pi/menu/?demo
