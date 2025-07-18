// emergency-fix.js
// Notfall-Fix für Bot-Fehler

const fs = require('fs').promises;

async function emergencyFix() {
  console.log('🚨 Starting Emergency Fix...');
  
  // 1. Fix bot.emit errors
  const botFile = await fs.readFile('./enhanced-bot-buttons.js', 'utf8');
  
  // Replace all bot.emit with proper callbacks
  let fixed = botFile.replace(
    /bot\.emit\('action', Object\.assign\(ctx, \{ match: \[.*?\] \}\)\);/g,
    '// Fixed: Removed bot.emit - refreshing menu instead'
  );
  
  await fs.writeFile('./enhanced-bot-buttons.js.backup_emergency', botFile);
  await fs.writeFile('./enhanced-bot-buttons.js', fixed);
  
  console.log('✅ Emergency fix applied!');
  console.log('📄 Backup saved as enhanced-bot-buttons.js.backup_emergency');
}

emergencyFix().catch(console.error);
