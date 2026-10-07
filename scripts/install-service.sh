#!/bin/bash
# Installs the AutoCare API + tunnel as a launchd agent that starts at login and restarts on failure.
#
# macOS privacy protection stops background agents from reading ~/Documents, so the backend is
# copied to ~/Library/Application Support/AutoCare and run from there. Re-run this after
# changing backend code to refresh the copy.
#
#   scripts/install-service.sh            install or refresh, then (re)start
#   scripts/install-service.sh remove     stop and uninstall
set -eu
LABEL=com.autocare.tunnel
DEST="$HOME/Library/Application Support/AutoCare"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
DOMAIN="gui/$(id -u)"
cd "$(dirname "$0")/.."

launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
pkill -f "$DEST/scripts/tunnel.sh" 2>/dev/null || true
if [ "${1:-}" = remove ]; then
  rm -f "$PLIST"; rm -rf "$DEST"
  echo "removed $LABEL"; exit 0
fi

# Keep the JWT secret stable across reinstalls so issued logins stay valid.
grep -qs '^JWT_SECRET=' .env || echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
mkdir -p "$DEST" "$HOME/Library/Logs/autocare"
rsync -a --delete --exclude __pycache__ app scripts requirements.txt .env .venv "$DEST/"
chmod 600 "$DEST/.env"

cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/caffeinate</string><string>-s</string>
    <string>/bin/bash</string><string>$DEST/scripts/tunnel.sh</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>30</integer>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/autocare/run.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/autocare/run.log</string>
</dict>
</plist>
PL
plutil -lint "$PLIST" >/dev/null
launchctl bootstrap "$DOMAIN" "$PLIST"
echo "installed $LABEL; logs in ~/Library/Logs/autocare/run.log"
