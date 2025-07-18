#!/bin/bash

# Backup erstellen
cp enhanced-bot-buttons.js enhanced-bot-buttons.js.backup_bash_fix

# Entferne die problematische Zeile mit await außerhalb einer async function
# Diese Zeile verursacht den Fehler: const s2Files = await fileEditor.listEditableFiles...
sed -i '' '/const s2Files = await fileEditor\.listEditableFiles/d' enhanced-bot-buttons.js

# Entferne auch die darauf folgenden Zeilen bis zum nächsten bot.action
# um den ganzen duplizierten Block zu entfernen
sed -i '' '/\/\/ (Entfernt - Duplikat)/,/bot\.action.*analytics.*async/{ /bot\.action.*analytics.*async/!d; }' enhanced-bot-buttons.js

echo "✅ Fix angewendet! Problematische await-Zeile entfernt."
