// Dashboard Handler - MIT ECHTEN DATEN!
const { Markup } = require('telegraf');
const runtimeStats = require('./runtime-stats');

async function handleDashboard(ctx) {
  try {
    ctx.answerCbQuery('📊 Lade echte Daten...');
  } catch (e) {
    // Ignore if no callback query
  }
  
  // FORCE RELOAD der Stats beim Aufruf!
  await runtimeStats.loadData();
  
  // ECHTE Runtime Daten!
  const data = runtimeStats.getDashboardData();
  
  // Konvertiere zu deutscher Zeit (Europe/Berlin)
  const deployTimeDE = new Date(data.deployTime).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
  const realTimeDE = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
  
  const dashboardText = `📊 **DEIN DASHBOARD**

🏠 **Umzug Elmshorn**: Aktiv
🤖 **AVX Copilot**: v${data.version} LIVE
💻 **Letzter Deploy**: ${deployTimeDE}
📝 **Commit**: ${data.commit}
⏱️ **Uptime**: ${data.uptime}

📈 **Stats (Echtzeit)**:
- AI Kosten: ${data.stats.todayCost.toFixed(2)} (Total: ${data.stats.totalCost.toFixed(2)})
- Tokens: ${data.stats.todayTokens.toLocaleString('de-DE')} (Total: ${data.stats.totalTokens.toLocaleString('de-DE')})
- Messages: ${data.stats.todayMessages} (Total: ${data.stats.totalMessages})
- Knowledge: S1 + S2 integriert

🔧 **Quick Actions**:
- /ai [frage] - Direkt fragen
- "umzug" - Umzugsinfos  
- "status" - Detailstatus

_Stand: ${realTimeDE}_`;
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔄 Refresh', 'dashboard')],
    [Markup.button.callback('⬅️ Zurück', 'back_main')]
  ]);
  
  // Try to edit existing message first
  try {
    await ctx.editMessageText(dashboardText, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  } catch (e) {
    // If edit fails, send new message
    await ctx.reply(dashboardText, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  }
}

// Export the handler
module.exports = { handleDashboard };
