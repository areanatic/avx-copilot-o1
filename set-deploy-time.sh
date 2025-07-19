#!/bin/bash
# Railway Post-Deploy Hook
# Setzt die Deploy Zeit nach erfolgreichem Deployment

echo "🚀 Setting deploy time..."

# Erstelle data Verzeichnis falls nicht vorhanden
mkdir -p data

# Schreibe Deploy Info
cat > data/deploy.json << EOF
{
  "time": $(date +%s)000,
  "version": "$(git describe --tags --always 2>/dev/null || git rev-parse --short HEAD)",
  "commit": "$(git log -1 --format='%h - %s')",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "✅ Deploy time set!"
