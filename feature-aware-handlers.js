// feature-aware-handlers.js - Integration in enhanced-bot-buttons.js
const featureTracker = require('./feature-tracker');

// BEISPIEL 1: Quick Note mit Feature Check
bot.action('quick_note', async (ctx) => {
  const userId = ctx.from.id;
  
  // Check Feature Status FIRST
  if (!featureTracker.checkFeatureBeforeUse('quick_notes', ctx)) {
    return; // Feature not ready, message already sent
  }
  
  // Only if feature is 100% ready:
  const userNotesManager = require('./user-notes-manager');
  const recentNotes = await userNotesManager.getRecentNotes(userId, 3);
  // ... rest of implementation
});

// BEISPIEL 2: Feature Status Command
bot.command('features', async (ctx) => {
  const report = featureTracker.generateReport();
  await ctx.reply(report, { parse_mode: 'Markdown' });
});

// BEISPIEL 3: Main Menu mit Feature Status
const getMainMenuWithStatus = () => {
  const devMode = modeManager.getCurrentMode();
  const devIndicator = devMode === 'dev' ? '🟢' : '🔴';
  
  // Get feature buttons with status
  const quickNoteBtn = featureTracker.getFeatureButton('quick_notes');
  const kbSearchBtn = featureTracker.getFeatureButton('kb_search');
  const umzugBtn = featureTracker.getFeatureButton('umzug_elmshorn');
  
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(`📊 Dashboard ${devIndicator}`, 'dashboard'),
      Markup.button.callback(umzugBtn.text, umzugBtn.callback_data)
    ],
    [
      Markup.button.callback('🧠 Knowledge Base', 'knowledge'),
      Markup.button.callback(quickNoteBtn.text, quickNoteBtn.callback_data)
    ],
    [
      Markup.button.callback('🔧 Dev Tools', 'dev_tools'),
      Markup.button.callback('📈 Analytics', 'analytics')
    ],
    [
      Markup.button.callback('📊 Feature Status', 'show_features')
    ]
  ]);
};

// BEISPIEL 4: Feature Info Handler
bot.action(/feature_info:(.+)/, async (ctx) => {
  const featureId = ctx.match[1];
  const status = featureTracker.formatFeatureStatus(featureId);
  
  await ctx.editMessageText(
    `📊 **Feature Details**\n\n${status}`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📈 Alle Features', 'show_features')],
        [Markup.button.callback('📱 Zurück', 'back_main')]
      ])
    }
  );
});

// BEISPIEL 5: Git Commit mit Feature Status
bot.action('git_commit_with_status', async (ctx) => {
  const changes = await featureTracker.getRecentChanges(5);
  
  let commitMessage = 'Update: ';
  if (changes.length > 0) {
    const latestChange = changes[0];
    commitMessage += `[${latestChange.featureName}] ${latestChange.oldStatus}% → ${latestChange.newStatus}% | ${latestChange.whatChanged}`;
  } else {
    commitMessage += 'General improvements';
  }
  
  // Show commit message for confirmation
  await ctx.editMessageText(
    `📝 **Commit Message:**\n\`\`\`\n${commitMessage}\n\`\`\`\n\nBestätigen?`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ Commit & Push', 'confirm_git_push')],
        [Markup.button.callback('✏️ Bearbeiten', 'edit_commit_msg')],
        [Markup.button.callback('❌ Abbrechen', 'dev_tools')]
      ])
    }
  );
});

// BEISPIEL 6: Error Handler mit Feature Context
bot.catch((err, ctx) => {
  console.error('Bot Error:', err);
  
  // Try to identify which feature caused the error
  const errorContext = err.stack || err.message || '';
  let featureContext = 'Unbekannt';
  
  // Simple feature detection from error
  if (errorContext.includes('note')) featureContext = 'quick_notes';
  if (errorContext.includes('agent')) featureContext = 'project_agents';
  if (errorContext.includes('git')) featureContext = 'git_integration';
  
  const feature = featureTracker.getFeature(featureContext);
  
  if (feature && feature.status < 100) {
    ctx.reply(
      `❌ **Fehler in unfertigem Feature**\n\n` +
      `Feature: ${feature.name} (${feature.status}% fertig)\n` +
      `Fehlt: ${feature.missing.join(', ')}\n\n` +
      `_Feature wird priorisiert bearbeitet._`,
      { parse_mode: 'Markdown', ...mainMenu }
    );
  } else {
    ctx.reply('❌ Ein Fehler ist aufgetreten.', mainMenu);
  }
});

// BEISPIEL 7: Development Progress Tracking
bot.action('update_feature_progress', async (ctx) => {
  const features = featureTracker.getFeaturesByStatus(1, 99);
  
  const buttons = features.map(f => [
    Markup.button.callback(
      `${f.name} (${f.status}%)`,
      `edit_feature:${f.id}`
    )
  ]);
  
  await ctx.editMessageText(
    '📊 **Feature Progress Update**\n\nWelches Feature wurde bearbeitet?',
    Markup.inlineKeyboard([
      ...buttons,
      [Markup.button.callback('🔙 Zurück', 'dev_tools')]
    ])
  );
});

// BEISPIEL 8: Weekly Progress Report
bot.command('progress', async (ctx) => {
  const changes = await featureTracker.getRecentChanges(50);
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const weekChanges = changes.filter(c => 
    new Date(c.timestamp) > lastWeek
  );
  
  let report = '📈 **Wochenfortschritt**\n\n';
  
  if (weekChanges.length === 0) {
    report += '_Keine Änderungen in den letzten 7 Tagen_';
  } else {
    const progressMap = new Map();
    
    weekChanges.forEach(change => {
      if (!progressMap.has(change.featureName)) {
        progressMap.set(change.featureName, {
          start: change.oldStatus,
          end: change.newStatus,
          changes: []
        });
      }
      
      const feature = progressMap.get(change.featureName);
      feature.end = change.newStatus;
      feature.changes.push(change.whatChanged);
    });
    
    progressMap.forEach((data, featureName) => {
      const progress = data.end - data.start;
      const emoji = progress > 0 ? '📈' : '📉';
      
      report += `${emoji} **${featureName}**: ${data.start}% → ${data.end}% (${progress > 0 ? '+' : ''}${progress}%)\n`;
      report += `Änderungen: ${data.changes.join(', ')}\n\n`;
    });
  }
  
  await ctx.reply(report, { parse_mode: 'Markdown' });
});

module.exports = {
  featureTracker,
  getMainMenuWithStatus
};
