// fix-bot-errors.js
// Comprehensive fix for all bot errors

const fs = require('fs').promises;
const path = require('path');

async function fixBotErrors() {
  const filePath = path.join(__dirname, 'enhanced-bot-buttons.js');
  let content = await fs.readFile(filePath, 'utf8');
  
  // Backup original
  await fs.writeFile(filePath + '.backup_' + Date.now(), content);
  
  // Fix 1: Replace bot.emit in set_mode handlers
  // Find and replace the pattern around line 585 and 598
  content = content.replace(
    /\/\/ Return to mode menu\s*\n\s*bot\.emit\('action', Object\.assign\(ctx, \{ match: \['mode_switch'\] \}\)\);/g,
    `// Return to mode menu\n  ctx.answerCbQuery('Mode gewechselt!');`
  );
  
  // Fix 2: Replace bot.emit in model handlers (line 647)
  content = content.replace(
    /\/\/ Return to model menu\s*\n\s*bot\.emit\('action', Object\.assign\(ctx, \{ match: \['model_switch'\] \}\)\);/g,
    `// Return to model menu\n  ctx.answerCbQuery('Model gewechselt!');`
  );
  
  // Fix 3: Replace bot.emit in instruction handlers (lines 756, 816, 836)
  content = content.replace(
    /\/\/ Return to instruction editor\s*\n\s*bot\.emit\('action', Object\.assign\(ctx, \{ match: \['instruction_editor'\] \}\)\);/g,
    `// Return to instruction editor\n  ctx.answerCbQuery('Instruction aktualisiert!');`
  );
  
  // Write fixed content
  await fs.writeFile(filePath, content);
  
  console.log('✅ Fixed all bot.emit errors');
  
  // Verify fix
  const remaining = (content.match(/bot\.emit/g) || []).length;
  console.log(`Remaining bot.emit calls: ${remaining}`);
}

fixBotErrors().catch(console.error);
