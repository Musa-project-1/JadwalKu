#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=5173

# Deteksi IP LAN (Wi-Fi lokal) dan Tailscale
LAN_IP=$(ip -4 route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' || ip -4 addr show | grep -oP '(?<=inet\s)192\.\d+\.\d+\.\d+' | head -1 || echo "")
TS_IP=$(tailscale ip -4 2>/dev/null || ip -4 addr show tailscale0 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' || echo "")

echo "=================================================="
echo " JadwalKu Dev Server"
echo "=================================================="
if [ -n "$LAN_IP" ]; then
  echo "📶 URL HP (Wi-Fi satu router):"
  echo "   http://${LAN_IP}:${PORT}/JadwalKu/#/jadwal"
fi
if [ -n "$TS_IP" ]; then
  echo "📱 URL HP (Tailscale aktif):"
  echo "   http://${TS_IP}:${PORT}/JadwalKu/#/jadwal"
fi
echo "💻 URL Lokal Laptop:"
echo "   http://localhost:${PORT}/JadwalKu/#/jadwal"
echo "=================================================="
echo ""

cd "$DIR/frontend"
exec npx vite --host 0.0.0.0 --port "$PORT"
