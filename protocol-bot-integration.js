// protocol-bot-integration.js - How to integrate Protocol Manager in Bot

const protocolManager = require('./protocol-manager');
const featureTracker = require('./feature-tracker');

// 1. AUTO-TRACK User Messages
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const message = ctx.message.text;
  
  // Protocol Manager analyzes EVERY message
  await protocolManager.handleUserMessage(ctx);
  
  // Rest of normal message handling...
});

// 2. ERROR Tracking with Context
bot.catch(async (err, ctx) => {
  console.error('Bot Error:', err);
  
  // Log to Error Protocol
  const errorLog = await protocolManager.logError(err, {
    userId: ctx.from?.id,
    action: ctx.updateType,
    feature: detectFeatureFromError(err),
    userMessage: ctx.message?.text
  });
  
  // Inform user with protocol reference
  ctx.reply(
    `❌ **Fehler aufgetreten**\n\n` +
    `Error ID: #${errorLog.id}\n` +
    `Feature: ${errorLog.context.feature || 'Unbekannt'}\n\n` +
    `_Fehler wurde protokolliert und wird behoben._`,
    { parse_mode: 'Markdown' }
  );
});

// 3. FEEDBACK Command - Show User's Impact
bot.command('feedback', async (ctx) => {
  const userId = ctx.from.id;
  const userProtocol = await protocolManager.getUserProtocol(userId);
  
  if (!userProtocol || userProtocol.feedback.length === 0) {
    return ctx.reply('Du hast noch kein Feedback gegeben.');
  }
  
  let message = '📊 **Dein Feedback & Impact**\n\n';
  
  // Group by feature
  const byFeature = {};
  userProtocol.feedback.forEach(f => {
    const feature = f.detectedFeature || 'general';
    if (!byFeature[feature]) byFeature[feature] = [];
    byFeature[feature].push(f);
  });
  
  for (const [feature, feedbacks] of Object.entries(byFeature)) {
    const featureData = featureTracker.getFeature(feature);
    message += `**${featureData?.name || feature}**\n`;
    
    feedbacks.slice(-3).forEach(f => {
      const icon = f.resolved ? '✅' : '⏳';
      const date = new Date(f.timestamp).toLocaleDateString('de-DE');
      message += `${icon} ${date}: "${f.message.substring(0, 40)}..."\n`;
    });
    
    // Show impact
    const resolved = feedbacks.filter(f => f.resolved).length;
    message += `Impact: ${resolved}/${feedbacks.length} behoben\n\n`;
  }
  
  await ctx.reply(message, { parse_mode: 'Markdown' });
});

// 4. DECISION Logging
bot.action('make_decision', async (ctx) => {
  // Example: Choosing storage method
  const decision = await protocolManager.logDecision({
    title: 'Storage Method for Quick Notes',
    context: 'User feedback: Notes not persisting',
    options: [
      { name: 'In-Memory', pros: ['Fast'], cons: ['Lost on restart'] },
      { name: 'File-based', pros: ['Persistent', 'Simple'], cons: ['Not scalable'] },
      { name: 'Supabase', pros: ['Scalable', 'Cloud'], cons: ['Needs API key'] }
    ],
    chosen: 'File-based',
    reasoning: 'Immediate solution needed, migration path exists',
    expectedOutcome: 'Users can save and retrieve notes',
    reviewDate: '2025-08-01',
    relatedFeatures: ['quick_notes']
  });
  
  await ctx.editMessageText(
    `✅ **Entscheidung dokumentiert**\n\n` +
    `ID: #${decision.id}\n` +
    `Titel: ${decision.title}\n` +
    `Gewählt: ${decision.chosen}\n\n` +
    `Review geplant: ${decision.reviewDate}`,
    { parse_mode: 'Markdown' }
  );
});

// 5. FEATURE Timeline View
bot.action(/feature_timeline:(.+)/, async (ctx) => {
  const featureId = ctx.match[1];
  const report = await protocolManager.generateFeatureReport(featureId);
  
  if (!report) {
    return ctx.answerCbQuery('Keine Timeline gefunden');
  }
  
  let message = `📅 **Feature Timeline: ${featureId}**\n\n`;
  
  // Show last 10 events
  report.timeline.slice(-10).forEach(event => {
    const icon = {
      progress: '📈',
      feedback: '💬',
      error: '❌',
      decision: '🎯'
    }[event.type] || '•';
    
    message += `${icon} ${event.time}\n${event.summary}\n\n`;
  });
  
  // Feedback Summary
  if (report.feedbackAnalysis.sentiments) {
    message += '**Feedback Stimmung:**\n';
    Object.entries(report.feedbackAnalysis.sentiments).forEach(([mood, count]) => {
      const emoji = { positive: '😊', negative: '😟', neutral: '😐' }[mood];
      message += `${emoji} ${mood}: ${count}\n`;
    });
  }
  
  // Recommendations
  if (report.recommendations.length > 0) {
    message += '\n**🎯 Empfehlungen:**\n';
    report.recommendations.forEach(rec => {
      message += `• [${rec.priority}] ${rec.action}\n  _${rec.reason}_\n`;
    });
  }
  
  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('📊 Feature Status', `feature_info:${featureId}`)],
      [Markup.button.callback('🔙 Zurück', 'show_features')]
    ])
  });
});

// 6. SMART Resolution Tracking
bot.action(/resolve_feedback:(.+)/, async (ctx) => {
  const feedbackId = ctx.match[1];
  
  // Mark as resolved
  await protocolManager.resolveFeedback(feedbackId, {
    resolvedBy: ctx.from.id,
    resolution: 'Fixed in latest update',
    relatedCommit: 'abc123'
  });
  
  await ctx.answerCbQuery('✅ Feedback als behoben markiert!');
});

// 7. USER Journey Command
bot.command('journey', async (ctx) => {
  const userId = ctx.from.id;
  const userProtocol = await protocolManager.getUserProtocol(userId);
  
  if (!userProtocol) {
    return ctx.reply('Noch keine Journey aufgezeichnet.');
  }
  
  let message = '🗺️ **Deine AVX Copilot Journey**\n\n';
  
  // Stats
  message += `📊 **Stats:**\n`;
  message += `• Interaktionen: ${userProtocol.metrics.totalInteractions}\n`;
  message += `• Feedback gegeben: ${userProtocol.feedback.length}\n`;
  message += `• Muster erkannt: ${userProtocol.patterns.length}\n\n`;
  
  // Detected Patterns
  if (userProtocol.patterns.length > 0) {
    message += `🧩 **Deine Muster:**\n`;
    const uniquePatterns = [...new Set(userProtocol.patterns.map(p => p.pattern))];
    uniquePatterns.forEach(pattern => {
      const readable = {
        'asks_for_status': '📊 Fragt oft nach Status',
        'needs_help': '❓ Braucht öfter Hilfe',
        'gives_feedback': '💡 Gibt konstruktives Feedback',
        'technical_user': '🔧 Technisch versiert'
      }[pattern] || pattern;
      
      message += `• ${readable}\n`;
    });
    message += '\n';
  }
  
  // Preferences (if detected)
  if (Object.keys(userProtocol.preferences).length > 0) {
    message += `⚙️ **Deine Präferenzen:**\n`;
    Object.entries(userProtocol.preferences).forEach(([key, value]) => {
      message += `• ${key}: ${value}\n`;
    });
  }
  
  await ctx.reply(message, { parse_mode: 'Markdown' });
});

// 8. PROTOCOL Search
bot.command('search', async (ctx) => {
  const query = ctx.message.text.split(' ').slice(1).join(' ');
  
  if (!query) {
    return ctx.reply('Verwendung: /search <suchbegriff>');
  }
  
  // Search across all protocols
  const results = await protocolManager.searchProtocols(query);
  
  let message = `🔍 **Suchergebnisse für "${query}"**\n\n`;
  
  if (results.length === 0) {
    message += '_Keine Ergebnisse gefunden_';
  } else {
    results.slice(0, 10).forEach(result => {
      const icon = {
        feature: '🔧',
        user: '👤',
        error: '❌',
        decision: '🎯'
      }[result.type] || '📄';
      
      message += `${icon} **${result.title}**\n`;
      message += `${result.excerpt}\n`;
      message += `_${result.date}_\n\n`;
    });
  }
  
  await ctx.reply(message, { parse_mode: 'Markdown' });
});

// 9. INSIGHTS Dashboard
bot.action('show_insights', async (ctx) => {
  const insights = await protocolManager.generateInsights();
  
  let message = '🧠 **System Insights**\n\n';
  
  // Most problematic features
  message += '**🔥 Features mit meisten Problemen:**\n';
  insights.problematicFeatures.forEach(f => {
    message += `• ${f.name}: ${f.errorCount} Fehler, ${f.negativeFeedback} neg. Feedback\n`;
  });
  message += '\n';
  
  // User satisfaction trend
  message += '**😊 User Zufriedenheit:**\n';
  message += `Positiv: ${insights.satisfaction.positive}%\n`;
  message += `Neutral: ${insights.satisfaction.neutral}%\n`;
  message += `Negativ: ${insights.satisfaction.negative}%\n\n`;
  
  // Common issues
  message += '**🔍 Häufige Probleme:**\n';
  insights.commonIssues.forEach(issue => {
    message += `• "${issue.keyword}" (${issue.count}x erwähnt)\n`;
  });
  
  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('📊 Vollständiger Report', 'full_report')],
      [Markup.button.callback('🔙 Zurück', 'back_main')]
    ])
  });
});

// Example: How feedback automatically links to features
/*
User: "Die Quick Notes funktionieren nicht, ich kann meine Notizen nicht abrufen"

System automatically:
1. Detects negative sentiment ✓
2. Links to 'quick_notes' feature ✓
3. Logs in user protocol ✓
4. Logs in feature protocol ✓
5. Increases priority if multiple similar feedback ✓
6. Notifies developers ✓
*/
