// Railway Start File - Bulletproof Version
const path = require('path');
const fs = require('fs');

console.log('🚀 AVX Copilot Starting...');
console.log('📁 Current directory:', process.cwd());
console.log('📄 __dirname:', __dirname);
console.log('📋 Directory contents:');
console.log(fs.readdirSync('.').join('\n'));

// Set deploy time on start
try {
  const deployData = {
    time: Date.now(),
    version: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown',
    commit: process.env.RAILWAY_GIT_COMMIT_MESSAGE || 'Railway Deploy',
    deployedAt: new Date().toISOString()
  };
  
  fs.mkdirSync('./data', { recursive: true });
  fs.writeFileSync('./data/deploy.json', JSON.stringify(deployData, null, 2));
  console.log('✅ Deploy time set:', new Date(deployData.time).toLocaleString());
} catch (e) {
  console.log('⚠️ Could not set deploy time:', e.message);
}

// Try multiple paths to find the bot file
const possiblePaths = [
  './enhanced-bot-buttons.js',
  'enhanced-bot-buttons.js',
  path.join(__dirname, 'enhanced-bot-buttons.js'),
  path.join(process.cwd(), 'enhanced-bot-buttons.js'),
  '/app/enhanced-bot-buttons.js'
];

let botPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    botPath = p;
    console.log(`✅ Found bot at: ${p}`);
    break;
  }
}

if (!botPath) {
  console.error('❌ Could not find enhanced-bot-buttons.js in any of these locations:');
  possiblePaths.forEach(p => console.error(`  - ${p}`));
  process.exit(1);
}

// Load the bot
console.log('🤖 Loading bot from:', botPath);
require(botPath);
