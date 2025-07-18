// FORCE REDEPLOY - Version 2.2 with Error Handling
console.log('🚀 STARTING ENHANCED BOT WITH BUTTONS - v2.2');
console.log('📅 Deployed:', new Date().toISOString());
console.log('📁 Working Directory:', process.cwd());
console.log('📄 Files:', require('fs').readdirSync('.').join(', '));

try {
  // Import the enhanced bot
  require('./enhanced-bot-buttons.js');
  console.log('✅ Bot loaded successfully!');
} catch (error) {
  console.error('❌ Failed to load bot:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}
