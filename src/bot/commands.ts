// AVX Copilot o1 - Bot Commands
import { Telegraf } from 'telegraf';

export function setupCommands(bot: Telegraf) {
  bot.command('start', (ctx) => {
    ctx.reply(
      `🚀 Willkommen bei AVX Copilot o1!\n\n` +
      `Ich bin dein AI-Assistant für:\n` +
      `• 💡 Intelligente Aufgabenverarbeitung\n` +
      `• 📊 Datenanalyse & Insights\n` +
      `• 🔧 Workflow-Automatisierung\n` +
      `• 🤖 AI-powered Assistance\n\n` +
      `Schreibe mir einfach deine Anfrage!`
    );
  });

  bot.command('help', (ctx) => {
    ctx.reply(
      `📋 AVX Copilot o1 - Befehle:\n\n` +
      `/start - Bot starten\n` +
      `/help - Diese Hilfe anzeigen\n` +
      `/status - System Status\n` +
      `/task - Neue Aufgabe erstellen\n` +
      `/history - Letzte Interaktionen\n\n` +
      `Oder schreibe mir einfach deine Anfrage!`
    );
  });

  bot.command('status', async (ctx) => {
    ctx.reply(
      `✅ AVX Copilot o1 Status:\n` +
      `• System: Online\n` +
      `• Version: o1 (v1.0.0)\n` +
      `• Response Time: <100ms\n` +
      `• AI Model: Active`
    );
  });
}
