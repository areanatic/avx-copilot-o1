#!/bin/bash

echo "🚀 AVX Copilot o1 - Quick Start mit Buttons"
echo "=========================================="

# Stop any running bots
echo "⏹️  Stoppe alle laufenden Bot-Instanzen..."
pkill -f "node.*bot" 2>/dev/null || true
sleep 1

# Check which version to run
echo ""
echo "Wähle eine Version:"
echo "1) Simple Test Bot (JavaScript)"
echo "2) Enhanced Bot mit Buttons (JavaScript)"
echo "3) TypeScript Version mit Buttons (Development)"
echo ""
read -p "Deine Wahl (1-3): " choice

case $choice in
  1)
    echo "▶️  Starte Simple Test Bot..."
    node test-bot.js
    ;;
  2)
    echo "▶️  Starte Enhanced Bot mit Buttons..."
    node enhanced-bot-buttons.js
    ;;
  3)
    echo "▶️  Kompiliere TypeScript..."
    npm run build
    echo "▶️  Starte TypeScript Version..."
    npm start
    ;;
  *)
    echo "❌ Ungültige Auswahl. Starte Standard Bot..."
    node enhanced-bot-buttons.js
    ;;
esac
