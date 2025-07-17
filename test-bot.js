// AVX Copilot o1 - Simple Test Bot
const { Telegraf } = require('telegraf');
require('dotenv').config();

console.log('🔍 Testing AVX Copilot o1 Connection...');
console.log('📍 Token exists:', !!process.env.TELEGRAM_BOT_TOKEN);
console.log('📍 Token length:', process.env.TELEGRAM_BOT_TOKEN?.length);

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Simple test commands
bot.command('start', (ctx) => {
  console.log('✅ /start command received from:', ctx.from.username);
  ctx.reply('🚀 AVX Copilot o1 is ALIVE!\n\nTest successful! The bot is working.');
});

bot.command('test', (ctx) => {
  console.log('✅ /test command received');
  ctx.reply('✅ Test successful! Connection is working.');
});

bot.on('text', (ctx) => {
  console.log('📝 Message received:', ctx.message.text);
  ctx.reply(`Echo: ${ctx.message.text}`);
});

// Error handling
bot.catch((err, ctx) => {
  console.error('❌ Bot error:', err);
});

// Launch bot
bot.launch()
  .then(() => {
    console.log('✅ Bot started successfully!');
    console.log('📱 Send /start or /test to your bot');
  })
  .catch((err) => {
    console.error('❌ Failed to start bot:', err.message);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
