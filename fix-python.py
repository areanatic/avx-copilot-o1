#!/usr/bin/env python3
import re

# Lese die Datei
with open('enhanced-bot-buttons.js', 'r') as f:
    content = f.read()

# Backup erstellen
with open('enhanced-bot-buttons.js.backup_python_fix', 'w') as f:
    f.write(content)

# Entferne den duplizierten Code-Block, der außerhalb einer Funktion steht
# Der problematische Code beginnt nach "});" und vor "// Analytics"
pattern = r'\}\);\s*\n\s*// \(Entfernt - Duplikat\)[^}]*?bot\.action\(\'analytics\', async \(ctx\) => \{'
replacement = '});\n\n// Analytics\nbot.action(\'analytics\', async (ctx) => {'

fixed_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Wenn das nicht funktioniert, versuche einen anderen Ansatz
if fixed_content == content:
    # Finde den Anfang des problematischen Blocks
    start_marker = "});\n\n// (Entfernt - Duplikat)"
    end_marker = "// Analytics\nbot.action('analytics', async (ctx) => {"
    
    start_idx = content.find(start_marker)
    if start_idx != -1:
        end_idx = content.find(end_marker, start_idx)
        if end_idx != -1:
            # Ersetze den ganzen Block
            fixed_content = content[:start_idx + 4] + "\n\n" + content[end_idx:]

# Speichere die reparierte Version
with open('enhanced-bot-buttons.js', 'w') as f:
    f.write(fixed_content)

print("✅ Fix angewendet!")
