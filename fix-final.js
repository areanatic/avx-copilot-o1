const fs = require('fs');

// Lese die problematische Datei
let content = fs.readFileSync('enhanced-bot-buttons.js', 'utf8');

// Backup
fs.writeFileSync('enhanced-bot-buttons.js.backup_final', content);

// Finde den Punkt wo der duplizierte Code beginnt
// Es sollte nach einem "});" sein und vor "bot.action('analytics'"
const lines = content.split('\n');
let fixedLines = [];
let skipMode = false;
let foundAnalytics = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Wenn wir "// (Entfernt - Duplikat)" finden, beginne zu überspringen
  if (line.includes('// (Entfernt - Duplikat)')) {
    skipMode = true;
    continue;
  }
  
  // Wenn wir im Skip-Modus sind und "bot.action('analytics'" finden, stoppe das Überspringen
  if (skipMode && line.includes("bot.action('analytics'")) {
    skipMode = false;
    foundAnalytics = true;
  }
  
  // Füge die Zeile nur hinzu, wenn wir nicht im Skip-Modus sind
  if (!skipMode) {
    fixedLines.push(line);
  }
}

// Falls wir Analytics nicht gefunden haben, müssen wir es manuell hinzufügen
if (!foundAnalytics) {
  // Finde die Stelle wo Analytics sein sollte
  for (let i = fixedLines.length - 1; i >= 0; i--) {
    if (fixedLines[i].includes('});') && !fixedLines[i].includes('bot.action')) {
      // Füge Analytics nach diesem Punkt ein
      fixedLines.splice(i + 1, 0, '', '// Analytics', "bot.action('analytics', async (ctx) => {");
      break;
    }
  }
}

// Schreibe die korrigierte Datei
fs.writeFileSync('enhanced-bot-buttons.js', fixedLines.join('\n'));

console.log('✅ Finaler Fix angewendet! Duplikate entfernt und Struktur korrigiert.');
