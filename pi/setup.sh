#!/bin/bash
# Pixel Wall Pi setup — turns a fresh Raspberry Pi OS (64-bit, with desktop) into:
#   the Pixel Wall display + a home menu (Big Dawg Daily, Jungle Jam, Glam Studio...) + retro games.
#
# Run on the Pi (in Terminal), with your wall key from the Pixel Wall phone controller links:
#   curl -fsSL https://samahlersmeyer-prog.github.io/pixel-wall/pi/setup.sh | bash -s -- YOUR_WALL_KEY
#
# Safe to run again later to update everything (your config and games are kept).
set -euo pipefail

WALL_KEY="${1:-}"
REPO="https://github.com/samahlersmeyer-prog/pixel-wall"
SRC="$HOME/.pixel-wall-src"
APP="$HOME/pixel-wall-pi"
say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

if [ -z "$WALL_KEY" ] && [ ! -f "$APP/config.json" ]; then
  echo "Usage: curl -fsSL https://samahlersmeyer-prog.github.io/pixel-wall/pi/setup.sh | bash -s -- YOUR_WALL_KEY"
  echo "Your wall key is the part after #w= in your Pixel Wall TV link."
  exit 1
fi

say "Installing software (this takes a few minutes)"
sudo apt-get update -y
sudo apt-get install -y git python3-evdev retroarch samba fonts-noto-color-emoji
CHROME=chromium
command -v chromium-browser >/dev/null && CHROME=chromium-browser
command -v $CHROME >/dev/null || sudo apt-get install -y chromium || sudo apt-get install -y chromium-browser
# Emulator cores (some may not exist in every release; that's OK)
for core in libretro-snes9x libretro-nestopia libretro-gambatte libretro-mgba libretro-genesisplusgx libretro-desmume; do
  sudo apt-get install -y "$core" >/dev/null 2>&1 && echo "  installed $core" || echo "  (skipped $core)"
done

FLATPAK=false
if ! ls /usr/lib/*/libretro/snes9x*_libretro.so >/dev/null 2>&1; then
  say "No SNES core from apt; installing RetroArch from Flathub instead (larger download)"
  sudo apt-get install -y flatpak
  sudo flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
  sudo flatpak install -y flathub org.libretro.RetroArch
  sudo flatpak override org.libretro.RetroArch --filesystem="$HOME/roms"
  FLATPAK=true
fi

say "Getting the Pixel Wall files"
if [ -d "$SRC/.git" ]; then git -C "$SRC" pull --ff-only -q; else git clone --depth 1 -q "$REPO" "$SRC"; fi
mkdir -p "$APP"
cp -r "$SRC/pi/launcher.py" "$SRC/pi/menu" "$APP/"
chmod +x "$APP/launcher.py"

if [ -n "$WALL_KEY" ] || [ ! -f "$APP/config.json" ]; then
  say "Writing settings"
  if $FLATPAK; then RA_CMD="flatpak run org.libretro.RetroArch --fullscreen"; else RA_CMD="retroarch --fullscreen"; fi
  sed -e "s#__WALL_KEY__#${WALL_KEY}#" -e "s#__RA_CMD__#${RA_CMD}#" -e "s#__FLATPAK__#${FLATPAK}#" \
    "$SRC/pi/config.template.json" > "$APP/config.json"
fi

say "Making game folders in ~/roms"
for d in snes nes gb gbc gba genesis n64; do mkdir -p "$HOME/roms/$d"; done

say "Setting up RetroArch"
if $FLATPAK; then RA="$HOME/.var/app/org.libretro.RetroArch/config/retroarch"; else RA="$HOME/.config/retroarch"; fi
mkdir -p "$RA"
CFG="$RA/retroarch.cfg"; touch "$CFG"
setcfg() { grep -q "^$1 " "$CFG" && sed -i "s#^$1 .*#$1 = \"$2\"#" "$CFG" || echo "$1 = \"$2\"" >> "$CFG"; }
setcfg video_fullscreen true
setcfg menu_driver ozone
setcfg rgui_browser_directory "$HOME/roms"
setcfg input_autodetect_enable true
setcfg pause_nonactive false
setcfg menu_show_load_core false
setcfg menu_show_online_updater true
setcfg savestate_auto_save true
setcfg savestate_auto_load true
setcfg config_save_on_exit true

say "Starting everything automatically at boot"
sudo raspi-config nonint do_boot_behaviour B4 || true   # boot to desktop, logged in
sudo raspi-config nonint do_blanking 1 || true          # never blank the screen
mkdir -p "$HOME/.config/autostart" "$HOME/.config/labwc"
cat > "$HOME/.config/autostart/pixel-wall.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Pixel Wall
Exec=python3 $APP/launcher.py
X-GNOME-Autostart-enabled=true
EOF
touch "$HOME/.config/labwc/autostart"
grep -q "pixel-wall-pi/launcher.py" "$HOME/.config/labwc/autostart" || \
  echo "python3 $APP/launcher.py >> $APP/launcher.log 2>&1 &" >> "$HOME/.config/labwc/autostart"

say "Sharing the games folder on your home network"
if ! grep -q "^\[roms\]" /etc/samba/smb.conf; then
  sudo tee -a /etc/samba/smb.conf >/dev/null <<EOF

[roms]
   path = $HOME/roms
   browseable = yes
   writable = yes
   guest ok = yes
   force user = $USER
EOF
  sudo systemctl restart smbd || true
fi

say "All set!"
echo "  • Reboot now:  sudo reboot"
echo "  • It starts on the Pixel Wall. Hold SELECT + START on a controller for the home menu."
echo "  • Add games from your Mac: Finder > Go > Connect to Server > smb://$(hostname).local/roms"
echo "    (put SNES games in the snes folder, NES in nes, and so on)."
