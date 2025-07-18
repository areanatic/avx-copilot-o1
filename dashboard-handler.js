// Dashboard Fix - Enhanced Version with Real-Time Updates
const { Telegraf, Markup } = require('telegraf');
const claudeService = require('./claude-service');
const packageInfo = require('./package.json');
const statsManager = require('./stats-manager');

// Store start time
if (!process.env.START_TIME) {
  process.env.START_TIME = Date.now();
}

// Dashboard Handler with REAL refresh
async function handleDashboard(ctx) {
  try {
    ctx.answerCbQuery('📊 Lade Dashboard...');
  } catch (e) {
    // Ignore if no callback query
  }
  
  // IMMER frische Stats holen
  const stats = claudeService.getStats();
  const now = new Date();
  const deployDate = now.toLocaleDateString('de-DE');
  const currentTime = now.toLocaleTimeString('de-DE');
  
  // Berechne Uptime
  const startTime = parseInt(process.env.START_TIME || Date.now());
  const uptimeMs = Date.now() - startTime;
  const uptimeMinutes = Math.floor(uptimeMs / 60000);
  const uptimeHours = Math.floor(uptimeMinutes / 60);
  const uptimeDays = Math.floor(uptimeHours / 24);
  
  let uptimeString = '';
  if (uptimeDays > 0) uptimeString = `${uptimeDays}d ${uptimeHours % 24}h`;
  else if (uptimeHours > 0) uptimeString = `${uptimeHours}h ${uptimeMinutes % 60}m`;
  else uptimeString = `${uptimeMinutes}m`;
  
  const dashboardText = `📊 **DEIN DASHBOARD**

🏠 **Umzug Elmshorn**: Aktiv
🤖 **AVX Copilot**: v${packageInfo.version} LIVE
🧠 **Claudia Agent**: S1 Knowledge aktiv
⏱️ **Uptime**: ${uptimeString}

📈 **Stats heute**:
- AI Kosten: $${stats.todayCost || '0.00'} (Total: ${stats.estimatedCost})
- Tokens: ${(stats.todayTokens || 0).toLocaleString()} (Total: ${stats.totalTokens.toLocaleString()})
- Messages: ${stats.todayMessages || 0}
- Knowledge: S1 + S2 integriert

🔧 **Quick Actions**:
- /ai [frage] - Direkt fragen
- "umzug" - Umzugsinfos
- "status" - Detailstatus

_Stand: ${deployDate} ${currentTime}_`;
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔄 Refresh', 'dashboard_refresh')],
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
