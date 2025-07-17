// AVX Copilot o1 - Main Telegram Bot
import { Telegraf, Context } from 'telegraf';
import * as dotenv from 'dotenv';
import { handleMessage } from '../services/messageHandler';
import { setupCommands } from './commands';
import { setupEnhancedCommands } from './enhancedCommands';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Bot Commands Setup
// setupCommands(bot); // Basic commands
setupEnhancedCommands(bot); // Enhanced commands with buttons

// Message Handler
bot.on('text', async (ctx) => {
  await handleMessage(ctx);
});

// Error Handler
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}`, err);
  ctx.reply('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
});

// Start Bot
bot.launch().then(() => {
  console.log('🚀 AVX Copilot o1 is running!');
  console.log('📱 Bot username:', bot.botInfo?.username);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
