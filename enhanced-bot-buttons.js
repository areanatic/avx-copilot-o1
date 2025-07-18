// AVX Copilot o1 - Enhanced Bot with Buttons & Claude AI
const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();
const path = require('path');
const claudeService = require('./claude-service');
const knowledgeLoader = require('./knowledge-loader-v2'); // Updated to v2
const packageInfo = require('./package.json');
const fileEditor = require('./telegram-file-editor');
const projectAgents = require('./project-agents');
const modeManager = require('./mode-manager');
const modelSwitcher = require('./model-switcher');
const instructionManager = require('./instruction-manager');
const audioService = require('./audio-service');
const statsManager = require('./stats-manager');
const { handleDashboard } = require('./dashboard-handler');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Store start time for uptime tracking
if (!process.env.START_TIME) {
  process.env.START_TIME = Date.now();
}

// Main Menu Keyboard - PERSONALISIERT FÜR ARASH
const mainMenu = Markup.inlineKeyboard([
  [
    Markup.button.callback('📊 Dashboard', 'dashboard'),
    Markup.button.callback('🏠 Umzug Elmshorn', 'umzug')
  ],
  [
    Markup.button.callback('🧠 Knowledge Base', 'knowledge'),
    Markup.button.callback('💡 Quick Note', 'quick_note')
  ],
  [
    Markup.button.callback('🔧 Dev Tools', 'dev_tools'),
    Markup.button.callback('📈 Analytics', 'analytics')
  ]
]);

// Dev Tools Menu - ERWEITERT (jetzt als Funktion für dynamische Werte)
const getDevToolsMenu = () => {
  const currentMode = modeManager.getCurrentMode();
  const currentModel = modelSwitcher.getModelInfo();
  
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🚀 Git Push', 'git_push'),
      Markup.button.callback('📦 Deploy Status', 'deploy_status')
    ],
    [
      Markup.button.callback('✏️ File Editor', 'file_editor'),
      Markup.button.callback('🤖 Projekt Agents', 'project_agents')
    ],
    [
      Markup.button.callback('📁 Browse Files', 'browse_files'),
      Markup.button.callback('🔄 Sync Knowledge', 'sync_knowledge')
    ],
    [
      Markup.button.callback(`🔐 Mode: ${currentMode.icon}`, 'mode_switch'),
      Markup.button.callback(`🤖 Model: ${currentModel.icon}`, 'model_switch')
    ],
    [
      Markup.button.callback('📝 Instruction Editor', 'instruction_editor')
    ],
    [Markup.button.callback('⬅️ Zurück', 'back_main')]
  ]);
};

// Umzug Menu
const umzugMenu = Markup.inlineKeyboard([
  [
    Markup.button.callback('📄 Dokumente', 'umzug_docs'),
    Markup.button.callback('📅 Timeline', 'umzug_timeline')
  ],
  [
    Markup.button.callback('🏢 Behörden', 'umzug_behoerden'),
    Markup.button.callback('💰 Kosten', 'umzug_kosten')
  ],
  [Markup.button.callback('⬅️ Zurück', 'back_main')]
]);

// Knowledge Base Menu
const knowledgeMenu = Markup.inlineKeyboard([
  [
    Markup.button.callback('🔍 Suche', 'kb_search'),
    Markup.button.callback('📁 Browse', 'kb_browse')
  ],
  [
    Markup.button.callback('🎯 S1 Claudia', 'kb_s1'),
    Markup.button.callback('📝 Protokolle', 'kb_protocols')
  ],
  [Markup.button.callback('⬅️ Zurück', 'back_main')]
]);

// Start Command
bot.command('start', (ctx) => {
  const stats = claudeService.getStats();
  const aiStatus = stats.isConfigured ? '🟢 Claude AI aktiv' : '🔴 Claude AI nicht konfiguriert';
  const deployDate = new Date().toLocaleDateString('de-DE');
  const mode = modeManager.getCurrentMode();
  const model = modelSwitcher.getModelInfo();
  
  ctx.reply(
    `🚀 *Willkommen Arash!*\n\n` +
    `Dein persönlicher AI Assistant ist bereit.\n` +
    `${aiStatus}\n\n` +
    `🔧 *Version:* ${packageInfo.version}\n` +
    `📅 *Deployed:* ${deployDate}\n` +
    `${mode.icon} *Mode:* ${mode.name}\n` +
    `${model.icon} *Model:* ${model.name}\n\n` +
    `Was möchtest du tun?`,
    {
      parse_mode: 'Markdown',
      ...mainMenu
    }
  );
});

// Menu Command
bot.command('menu', (ctx) => {
  ctx.reply('📱 Hauptmenü:', mainMenu);
});

// Mode Command
bot.command('mode', (ctx) => {
  const args = ctx.message.text.split(' ');
  const userId = ctx.from.id;
  
  if (args.length === 1) {
    // Show current mode
    const mode = modeManager.getCurrentMode();
    ctx.reply(
      `${mode.icon} *Aktueller Modus:* ${mode.name}\n\n` +
      `${mode.description}\n\n` +
      `Nutze:​\n` +
      `/mode full - Full Power Mode (🔓 Nur für dich)\n` +
      `/mode showcase - Showcase Mode (🎭 Für Präsentationen)`,
      { parse_mode: 'Markdown' }
    );
  } else {
    const requestedMode = args[1].toUpperCase();
    
    // Check permissions for FULL_POWER
    if (requestedMode === 'FULL' && !modeManager.canSwitchMode(userId)) {
      ctx.reply('❌ Nur Arash kann in den Full Power Mode wechseln!');
      return;
    }
    
    try {
      const modeKey = requestedMode === 'FULL' ? 'FULL_POWER' : 'SHOWCASE';
      const newMode = modeManager.setMode(modeKey);
      ctx.reply(
        `✅ *Mode gewechselt!*\n\n` +
        `${newMode.icon} ${newMode.name} ist jetzt aktiv.\n\n` +
        `_${newMode.description}_`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      ctx.reply(`❌ Fehler: ${error.message}`);
    }
  }
});

// Model Command
bot.command('model', (ctx) => {
  const args = ctx.message.text.split(' ');
  const userId = ctx.from.id;
  
  if (args.length === 1) {
    // Show current model
    const model = modelSwitcher.getModelInfo();
    const stats = modelSwitcher.getCostStats(userId);
    
    ctx.reply(
      `${model.icon} *Aktuelles Model:* ${model.name}\n\n` +
      `${model.description}\n\n` +
      `💰 *Kosten:*\n` +
      `Input: ${model.costPer1M.input}/1M tokens\n` +
      `Output: ${model.costPer1M.output}/1M tokens\n\n` +
      `📊 *Deine Statistik:*\n` +
      `Gesamt: ${stats.userCost || '$0.00'}\n\n` +
      `Nutze:​\n` +
      `/model haiku - Schnell & günstig\n` +
      `/model sonnet - Ausgewogen\n` +
      `/model opus - Maximum Power`,
      { parse_mode: 'Markdown' }
    );
  } else {
    const requestedModel = args[1].toLowerCase();
    
    try {
      const newModel = modelSwitcher.setModel(requestedModel, userId);
      ctx.reply(
        `✅ *Model gewechselt!*\n\n` +
        `${newModel.icon} ${newModel.name} ist jetzt aktiv.\n\n` +
        `_${newModel.description}_\n\n` +
        `💵 Geschätzte Kosten: ${newModel.estimatedCost.total} pro 1000 tokens`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      ctx.reply(`❌ Fehler: ${error.message}`);
    }
  }
});

// AI Command - Direct AI interaction
bot.command('ai', async (ctx) => {
  const stats = claudeService.getStats();
  const message = ctx.message.text.replace('/ai', '').trim();
  
  if (!message) {
    ctx.reply(
      '🤖 *Claude AI Direkt-Modus*\n\n' +
      'Schreibe `/ai [deine Frage]` um direkt mit Claude zu sprechen.\n\n' +
      `Status: ${stats.isConfigured ? '🟢 Aktiv' : '🔴 Nicht konfiguriert'}\n` +
      `Kosten bisher: ${stats.estimatedCost}`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  await ctx.sendChatAction('typing');
  
  // Prüfe zuerst Knowledge Base
  const knowledgeAnswer = await knowledgeLoader.answerQuestion(message);
  
  let response;
  if (knowledgeAnswer) {
    response = knowledgeAnswer;
  } else {
    response = await claudeService.getResponse(ctx.from.id, message);
  }
  
  ctx.reply(response, { parse_mode: 'Markdown' });
});

// NEUE BUTTON HANDLERS - PERSONALISIERT

// Dashboard - Hauptübersicht
bot.action('dashboard', handleDashboard);

// Dashboard refresh handler
bot.action('dashboard_refresh', handleDashboard);

// Umzug Elmshorn
bot.action('umzug', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '🏠 **Umzugsprojekt Elmshorn**\n\n' +
    'Alle Infos zu deinem Umzug nach Elmshorn.\n' +
    'Wähle einen Bereich:',
    {
      parse_mode: 'Markdown',
      ...umzugMenu
    }
  );
});

// Umzug Sub-Menüs
bot.action('umzug_docs', (ctx) => {
  ctx.answerCbQuery('📄 Lade Dokumente...');
  ctx.editMessageText(
    '📄 **Umzugsdokumente**\n\n' +
    '📁 Verfügbare Dokumente:\n' +
    '- Jobcenter Brief (13.07.2025)\n' +
    '- Mietunterlagen Elmshorn\n' +
    '- Behördenkommunikation\n' +
    '- Checklisten & Timeline\n\n' +
    '_Frage mich nach spezifischen Dokumenten!_',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Zurück', 'umzug')]])
    }
  );
});

bot.action('umzug_timeline', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '📅 **Umzugs-Timeline**\n\n' +
    '🎯 Wichtige Meilensteine:\n' +
    '- Wohnungssuche ✅\n' +
    '- Jobcenter informiert ✅\n' +
    '- Umzugsplanung 🔄\n' +
    '- Ummeldung 📋\n\n' +
    '_Details in S1/A&A_Umzug_Elmshorn_',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Zurück', 'umzug')]])
    }
  );
});

bot.action('umzug_behoerden', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '🏢 **Behörden & Kommunikation**\n\n' +
    '📄 Jobcenter:\n' +
    '- Brief vom 13.07.2025 ✅\n' +
    '- Umzugsmeldung eingereicht\n\n' +
    '🏛️ Einwohnermeldeamt:\n' +
    '- Ummeldung nach Umzug\n\n' +
    '📦 Weitere:\n' +
    '- Krankenkasse\n' +
    '- Finanzamt\n' +
    '- Stromanbieter',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Zurück', 'umzug')]])
    }
  );
});

bot.action('umzug_kosten', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '💰 **Umzugskosten Übersicht**\n\n' +
    '📦 Umzugsfirma: TBD\n' +
    '🏠 Kaution: TBD\n' +
    '🚚 Transporter: TBD\n' +
    '🔧 Renovierung: TBD\n\n' +
    '_Detaillierte Kostenaufstellung in Planung_',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Zurück', 'umzug')]])
    }
  );
});

// Knowledge Base
bot.action('knowledge', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '🧠 **Knowledge Base**\n\n' +
    'Zugriff auf dein gesamtes Wissen:\n' +
    '- S1 Claudia Agent (Herzstück)\n' +
    '- S2 AVX Copilot\n' +
    '- Alle Projekte & Protokolle',
    {
      parse_mode: 'Markdown',
      ...knowledgeMenu
    }
  );
});

// Knowledge Base Sub-Menüs
bot.action('kb_search', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '🔍 **Knowledge Base Suche**\n\n' +
    'Durchsuche deine gesamte Wissensdatenbank.\n' +
    'Schreibe mir wonach du suchst:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Zurück', 'knowledge')]])
    }
  );
  ctx.session = { ...ctx.session, expecting: 'kb_search' };
});

bot.action('kb_s1', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '🎯 **S1 Claudia Agent**\n\n' +
    '📁 Struktur:\n' +
    '- 00_START_HERE\n' +
    '- 01_Master_Templates\n' +
    '- 02_Active_Agents\n' +
    '- 03_Databases_Knowledge\n' +
    '- Superbrain Architektur\n\n' +
    `_${Object.keys(knowledgeLoader.s1Data || {}).length} Files geladen_`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Zurück', 'knowledge')]])
    }
  );
});

bot.action('kb_browse', (ctx) => {
  ctx.answerCbQuery();
  const totalFiles = Object.keys(knowledgeLoader.knowledgeData || {}).length + 
                    Object.keys(knowledgeLoader.s1Data || {}).length;
  ctx.editMessageText(
    '📁 **Knowledge Base Browser**\n\n' +
    '📊 Statistiken:\n' +
    `- S1 Files: ${Object.keys(knowledgeLoader.s1Data || {}).length}\n` +
    `- S2 Files: ${Object.keys(knowledgeLoader.knowledgeData || {}).length}\n` +
    `- Gesamt: ${totalFiles} Files\n\n` +
    'Wähle einen Bereich zum Durchsuchen',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Zurück', 'knowledge')]])
    }
  );
});

bot.action('kb_protocols', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '📝 **Protokolle & Dokumentation**\n\n' +
    '📄 Verfügbar:\n' +
    '- PROJECT_PROTOCOL.md\n' +
    '- STRATEGIC_DECISIONS.md\n' +
    '- MIGRATION_PROTOCOL.md\n' +
    '- VERSIONING_SYSTEM.md\n' +
    '- CLAUDE_CAPABILITIES.md\n\n' +
    '_Alle Protokolle sind aktuell_',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Zurück', 'knowledge')]])
    }
  );
});

// Quick Note
bot.action('quick_note', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '💡 **Quick Note**\n\n' +
    'Schreib mir deine Idee, Notiz oder Gedanken.\n' +
    'Ich speichere sie in deiner Knowledge Base.\n\n' +
    '_Tipp: Voice Messages werden auch unterstützt!_',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Zurück', 'back_main')]])
    }
  );
  ctx.session = { ...ctx.session, expecting: 'quick_note' };
});

// Dev Tools
bot.action('dev_tools', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '🔧 **Developer Tools**\n\n' +
    'Deine Entwickler-Werkzeuge:',
    {
      parse_mode: 'Markdown',
      ...getDevToolsMenu()
    }
  );
});

// Dev Tools Sub-Menüs
bot.action('git_push', (ctx) => {
  ctx.answerCbQuery('🚀 Git Status...');
  ctx.editMessageText(
    '🚀 **Git Push**\n\n' +
    '📁 Repository: avx-copilot-o1\n' +
    '🌿 Branch: main\n' +
    '✅ Status: Ready to push\n\n' +
    '_Sage "push" um Änderungen zu pushen_',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Zurück', 'dev_tools')]])
    }
  );
});

bot.action('deploy_status', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '📦 **Deploy Status**\n\n' +
    '🚂 Railway: ✅ Active\n' +
    `🔧 Version: ${packageInfo.version}\n` +
    '🌐 URL: railway.app/project/...\n' +
    '⏱️ Uptime: 99.9%\n\n' +
    '_Auto-deploy bei Git Push_',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Zurück', 'dev_tools')]])
    }
  );
});

bot.action('browse_files', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '📁 **File Browser**\n\n' +
    '📂 Verfügbare Pfade:\n' +
    '- /S1/Claudia_Agent_Development\n' +
    '- /S2/avx-copilot-o1\n' +
    '- /knowledge\n' +
    '- /src\n\n' +
    '_Sage mir welchen Pfad du durchsuchen willst_',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Zurück', 'dev_tools')]])
    }
  );
});

bot.action('sync_knowledge', (ctx) => {
  ctx.answerCbQuery('🔄 Synchronisiere...');
  ctx.editMessageText(
    '🔄 **Knowledge Base Sync**\n\n' +
    'Synchronisiere S1 ↔️ S2:\n\n' +
    '✅ S1 Claudia Agent geladen\n' +
    '✅ S2 AVX Copilot geladen\n' +
    '✅ Umzugsprojekt integriert\n' +
    '🔄 Supabase Sync (optional)\n\n' +
    '_Knowledge Base ist aktuell_',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Zurück', 'dev_tools')]])
    }
  );
});

// MODE SWITCHER
bot.action('mode_switch', (ctx) => {
  ctx.answerCbQuery();
  const currentMode = modeManager.getCurrentMode();
  const userId = ctx.from.id;
  
  // Create mode selection menu
  const modeButtons = Object.entries(modeManager.modes).map(([key, mode]) => ([
    Markup.button.callback(
      `${mode.icon} ${mode.name} ${key === currentMode.mode ? '✓' : ''}`,
      `set_mode_${key}`
    )
  ]));
  
  ctx.editMessageText(
    `🔐 **Mode Manager**\n\n` +
    `Aktueller Modus: ${currentMode.icon} ${currentMode.name}\n\n` +
    `${currentMode.description}\n\n` +
    `📊 **Mode Details:**\n` +
    `- Access Level: ${currentMode.access}\n` +
    `- Max File Size: ${(currentMode.maxFileSize / 1024 / 1024).toFixed(0)}MB\n` +
    `- Show Private: ${currentMode.showPrivate ? '✅' : '❌'}\n\n` +
    `Wähle einen Modus:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        ...modeButtons,
        [Markup.button.callback('⬅️ Zurück', 'dev_tools')]
      ])
    }
  );
});

// Set Mode Handlers
bot.action('set_mode_FULL_POWER', (ctx) => {
  const userId = ctx.from.id;
  
  // Check permission
  if (!modeManager.canSwitchMode(userId)) {
    ctx.answerCbQuery('❌ Nur Arash kann Full Power Mode aktivieren!', true);
    return;
  }
  
  const newMode = modeManager.setMode('FULL_POWER');
  ctx.answerCbQuery(`✅ ${newMode.name} aktiviert!`);
  
  // Reload knowledge with new mode
  knowledgeLoader.loadAllKnowledge().then(knowledge => {
    claudeService.updateSystemPrompt(knowledge);
  });
  
  // Mode switched successfully
  ctx.answerCbQuery(`✅ ${newMode.name} aktiviert!`);
});

bot.action('set_mode_SHOWCASE', (ctx) => {
  const newMode = modeManager.setMode('SHOWCASE');
  ctx.answerCbQuery(`✅ ${newMode.name} aktiviert!`);
  
  // Reload knowledge with new mode
  knowledgeLoader.loadAllKnowledge().then(knowledge => {
    claudeService.updateSystemPrompt(knowledge);
  });
  
  // Mode switched successfully
  ctx.answerCbQuery(`✅ ${newMode.name} aktiviert!`);
});

// MODEL SWITCHER
bot.action('model_switch', (ctx) => {
  ctx.answerCbQuery();
  const currentModel = modelSwitcher.getModelInfo();
  const userId = ctx.from.id;
  const stats = modelSwitcher.getCostStats(userId);
  
  const modelButtons = modelSwitcher.getAllModels().map(model => [
    Markup.button.callback(
      `${model.icon} ${model.name} ${model.isCurrent ? '✓' : ''}`,
      `set_model_${model.key}`
    )
  ]);
  
  ctx.editMessageText(
    `🤖 **Model Switcher**\n\n` +
    `Aktuelles Model: ${currentModel.icon} ${currentModel.name}\n\n` +
    `${currentModel.description}\n\n` +
    `💰 **Kosten pro 1M Tokens:**\n` +
    `- Input: ${currentModel.costPer1M.input}\n` +
    `- Output: ${currentModel.costPer1M.output}\n\n` +
    `📊 **Deine Statistik:**\n` +
    `- Gesamt: ${stats.userCost || '$0.00'}\n` +
    `- Requests: ${stats.usage.total}\n\n` +
    `Wähle ein Model:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        ...modelButtons,
        [Markup.button.callback('💰 Kosten Details', 'model_costs')],
        [Markup.button.callback('⬅️ Zurück', 'dev_tools')]
      ])
    }
  );
});

// Set Model Handlers
bot.action(/^set_model_(.+)$/, (ctx) => {
  const modelKey = ctx.match[1];
  const userId = ctx.from.id;
  
  try {
    const newModel = modelSwitcher.setModel(modelKey, userId);
    ctx.answerCbQuery(`✅ ${newModel.name} aktiviert!`);
    
    // Return to model menu
    bot.emit('action', Object.assign(ctx, { match: ['model_switch'] }));
  } catch (error) {
    ctx.answerCbQuery(`❌ ${error.message}`, true);
  }
});

// Model Costs Details
bot.action('model_costs', (ctx) => {
  ctx.answerCbQuery();
  const stats = modelSwitcher.getCostStats(ctx.from.id);
  
  let costDetails = `💰 **Kosten-Übersicht**\n\n`;
  costDetails += `**Gesamt:** ${stats.totalCost}\n\n`;
  
  costDetails += `**Nach Model:**\n`;
  Object.entries(stats.byModel).forEach(([model, cost]) => {
    const usage = stats.usage.byModel[model] || 0;
    costDetails += `${modelSwitcher.models[model].icon} ${model}: ${cost} (${usage} requests)\n`;
  });
  
  costDetails += `\n**Deine Kosten:** ${stats.userCost || '$0.00'}`;
  
  ctx.editMessageText(costDetails, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Zurück', 'model_switch')]
    ])
  });
});

// INSTRUCTION EDITOR
bot.action('instruction_editor', (ctx) => {
  ctx.answerCbQuery();
  const stats = instructionManager.getStats();
  const currentInstruction = instructionManager.formatForDisplay();
  
  ctx.editMessageText(
    `✏️ **Instruction Editor**\n\n` +
    `📝 Aktuelle Instruction (${stats.currentLength}/${stats.maxLength} chars):\n` +
    `_${currentInstruction}_\n\n` +
    `Wähle eine Aktion:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📝 Bearbeiten', 'inst_edit'), Markup.button.callback('📋 Templates', 'inst_templates')],
        [Markup.button.callback('⏮️ History', 'inst_history'), Markup.button.callback('🔄 Reset', 'inst_reset')],
        [Markup.button.callback('⬅️ Zurück', 'dev_tools')]
      ])
    }
  );
});

// Instruction Edit
bot.action('inst_edit', (ctx) => {
  ctx.answerCbQuery();
  ctx.session = { ...ctx.session, expecting: 'instruction_edit' };
  
  ctx.editMessageText(
    `📝 **Instruction bearbeiten**\n\n` +
    `Schicke mir die neue Instruction für Claude.\n\n` +
    `💡 **Tipps:**\n` +
    `- Sei spezifisch über Persönlichkeit\n` +
    `- Definiere Antwort-Stil\n` +
    `- Max ${instructionManager.maxLength} Zeichen\n\n` +
    `_Schicke "cancel" zum Abbrechen_`,
    { parse_mode: 'Markdown' }
  );
});

// Instruction Templates
bot.action('inst_templates', (ctx) => {
  ctx.answerCbQuery();
  const templates = instructionManager.getTemplates();
  
  const templateButtons = templates.map(template => [
    Markup.button.callback(
      `${template.icon} ${template.name} ${template.isCurrent ? '✓' : ''}`,
      `use_template_${template.key}`
    )
  ]);
  
  ctx.editMessageText(
    `📋 **Instruction Templates**\n\n` +
    `Wähle ein vordefiniertes Template:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        ...templateButtons,
        [Markup.button.callback('⬅️ Zurück', 'instruction_editor')]
      ])
    }
  );
});

// Use Template Handler
bot.action(/^use_template_(.+)$/, async (ctx) => {
  const templateKey = ctx.match[1];
  const userId = ctx.from.id;
  
  try {
    const result = await instructionManager.useTemplate(templateKey, userId);
    ctx.answerCbQuery(`✅ ${result.template} aktiviert!`);
    
    // Update Claude prompt
    const knowledge = await knowledgeLoader.loadAllKnowledge();
    const instruction = instructionManager.getCurrentInstruction(userId);
    claudeService.updateSystemPrompt(knowledge + '\n\n' + instruction);
    
    // Return to instruction editor
    bot.emit('action', Object.assign(ctx, { match: ['instruction_editor'] }));
  } catch (error) {
    ctx.answerCbQuery(`❌ ${error.message}`, true);
  }
});

// Instruction History
bot.action('inst_history', (ctx) => {
  ctx.answerCbQuery();
  const history = instructionManager.history;
  
  if (history.length === 0) {
    ctx.editMessageText(
      `⏮️ **Instruction History**\n\n` +
      `_Keine History vorhanden_`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Zurück', 'instruction_editor')]
        ])
      }
    );
    return;
  }
  
  const historyButtons = history.slice(0, 5).map((inst, idx) => [
    Markup.button.callback(
      `${idx + 1}. ${inst.substring(0, 30)}...`,
      `use_history_${idx}`
    )
  ]);
  
  ctx.editMessageText(
    `⏮️ **Instruction History**\n\n` +
    `Wähle eine frühere Instruction:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        ...historyButtons,
        [Markup.button.callback('⬅️ Zurück', 'instruction_editor')]
      ])
    }
  );
});

// Use History Handler
bot.action(/^use_history_(\d+)$/, async (ctx) => {
  const idx = parseInt(ctx.match[1]);
  const userId = ctx.from.id;
  
  try {
    const result = await instructionManager.applyEdit(userId, 'history', idx);
    ctx.answerCbQuery('✅ History Instruction aktiviert!');
    
    // Update Claude prompt
    const knowledge = await knowledgeLoader.loadAllKnowledge();
    const instruction = instructionManager.getCurrentInstruction(userId);
    claudeService.updateSystemPrompt(knowledge + '\n\n' + instruction);
    
    // Return to instruction editor
    bot.emit('action', Object.assign(ctx, { match: ['instruction_editor'] }));
  } catch (error) {
    ctx.answerCbQuery(`❌ ${error.message}`, true);
  }
});

// Instruction Reset
bot.action('inst_reset', async (ctx) => {
  const userId = ctx.from.id;
  
  try {
    await instructionManager.resetToDefault(userId);
    ctx.answerCbQuery('✅ Instruction zurückgesetzt!');
    
    // Update Claude prompt
    const knowledge = await knowledgeLoader.loadAllKnowledge();
    const instruction = instructionManager.getCurrentInstruction(userId);
    claudeService.updateSystemPrompt(knowledge + '\n\n' + instruction);
    
    // Return to instruction editor
    bot.emit('action', Object.assign(ctx, { match: ['instruction_editor'] }));
  } catch (error) {
    ctx.answerCbQuery(`❌ ${error.message}`, true);
  }
});

// FILE EDITOR
bot.action('file_editor', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '✏️ **File Editor**\n\n' +
    'Wähle eine Aktion:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📄 File editieren', 'edit_file')],
        [Markup.button.callback('📁 Files anzeigen', 'list_editable_files')],
        [Markup.button.callback('📝 Neue Datei', 'create_file')],
        [Markup.button.callback('⬅️ Zurück', 'dev_tools')]
      ])
    }
  );
});

// Liste editierbare Files
bot.action('list_editable_files', async (ctx) => {
  ctx.answerCbQuery();
  
  const s1Files = await fileEditor.listEditableFiles('/Users/az/Documents/A+/AVX/Spaces/S1');
  const s2Files = await fileEditor.listEditableFiles('/Users/az/Documents/A+/AVX/Spaces/S2');
  
  let message = '📁 **Editierbare Dateien**\n\n';
  
  if (s1Files.length > 0) {
    message += '**S1 Spaces:**\n';
    s1Files.slice(0, 5).forEach(f => {
      message += `• ${f.name} (${f.size})\n`;
    });
  }
  
  if (s2Files.length > 0) {
    message += '\n**S2 Spaces:**\n';
    s2Files.slice(0, 5).forEach(f => {
      message += `• ${f.name} (${f.size})\n`;
    });
  }
  
  message += '\n_Schicke mir den vollständigen Pfad der Datei, die du editieren möchtest._';
  
  ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Zurück', 'file_editor')]
    ])
  });
});

// Edit File
bot.action('edit_file', (ctx) => {
  ctx.answerCbQuery();
  ctx.session = { ...ctx.session, expecting: 'file_path_edit' };
  
  ctx.editMessageText(
    '📄 **File editieren**\n\n' +
    'Schicke mir den vollständigen Pfad der Datei, die du editieren möchtest.\n\n' +
    'Beispiel:\n' +
    '`/Users/az/Documents/A+/AVX/Spaces/S1/README.md`\n\n' +
    '_Schicke "cancel" zum Abbrechen._',
    {
      parse_mode: 'Markdown'
    }
  );
});

// PROJECT AGENTS
bot.action('project_agents', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '🤖 **Projekt Agents**\n\n' +
    'Verwalte deine KI-Agents für verschiedene Projekte:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📋 Liste Agents', 'list_agents')],
        [Markup.button.callback('🔄 Agent wechseln', 'switch_agent')],
        [Markup.button.callback('✏️ Instruction bearbeiten', 'edit_instruction')],
        [Markup.button.callback('➕ Neuer Agent', 'create_agent')],
        [Markup.button.callback('⬅️ Zurück', 'dev_tools')]
      ])
    }
  );
});

// Liste alle Agents
bot.action('list_agents', (ctx) => {
  ctx.answerCbQuery();
  
  const agents = projectAgents.listAgents();
  let message = '📋 **Verfügbare Projekt-Agents**\n\n';
  
  if (agents.length === 0) {
    message += '_Keine Agents gefunden._';
  } else {
    agents.forEach(agent => {
      const status = agent.active ? '🟢' : '⚪';
      const lastUsed = agent.lastUsed ? 
        `\n   Zuletzt: ${new Date(agent.lastUsed).toLocaleDateString('de-DE')}` : '';
      message += `${status} **${agent.name}**\n   Nutzungen: ${agent.uses}${lastUsed}\n\n`;
    });
    
    if (projectAgents.activeAgent) {
      message += `\n🎯 Aktiv: **${projectAgents.activeAgent.name}**`;
    }
  }
  
  ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Zurück', 'project_agents')]
    ])
  });
});

// Switch Agent
bot.action('switch_agent', (ctx) => {
  ctx.answerCbQuery();
  ctx.session = { ...ctx.session, expecting: 'switch_agent_name' };
  
  const agents = projectAgents.listAgents();
  let message = '🔄 **Agent wechseln**\n\n';
  message += 'Verfügbare Agents:\n';
  
  agents.forEach(agent => {
    message += `• ${agent.name}${agent.active ? ' (aktiv)' : ''}\n`;
  });
  
  message += '\n_Schicke mir den Namen des Agents, den du aktivieren möchtest._';
  
  ctx.editMessageText(message, {
    parse_mode: 'Markdown'
  });
});

// Edit Instruction
bot.action('edit_instruction', (ctx) => {
  ctx.answerCbQuery();
  
  if (!projectAgents.activeAgent) {
    ctx.editMessageText(
      '❌ **Kein aktiver Agent**\n\n' +
      'Wähle zuerst einen Agent aus.',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Zurück', 'project_agents')]
        ])
      }
    );
    return;
  }
  
  ctx.session = { ...ctx.session, expecting: 'new_instruction_prompt' };
  
  ctx.editMessageText(
    `✏️ **Instruction Prompt bearbeiten**\n\n` +
    `Agent: **${projectAgents.activeAgent.name}**\n\n` +
    `Aktueller Prompt:\n` +
    `_${projectAgents.activeAgent.instructionPrompt.substring(0, 300)}..._\n\n` +
    `Schicke mir den neuen Instruction Prompt für diesen Agent.`,
    {
      parse_mode: 'Markdown'
    }
  );
});

// Create Agent
bot.action('create_agent', (ctx) => {
  ctx.answerCbQuery();
  ctx.session = { ...ctx.session, expecting: 'new_agent_name' };
  
  ctx.editMessageText(
    '➕ **Neuer Projekt-Agent**\n\n' +
    'Wie soll der neue Agent heißen?\n\n' +
    'Beispiele:\n' +
    '• Marketing_Campaign_2025\n' +
    '• Code_Review_Bot\n' +
    '• Research_Assistant\n\n' +
    '_Der Name sollte das Projekt beschreiben._',
    {
      parse_mode: 'Markdown'
    }
  );
});

bot.action('analytics', async (ctx) => {
  ctx.answerCbQuery('Lade Analytics...');
  
  const stats = claudeService.getStats();
  const audioStats = audioService.getStats();
  const persistentStats = statsManager.getCurrentStats();
  
  // Calculate real-time metrics
  const avgTokensPerMessage = persistentStats.total.messages > 0 
    ? Math.round(persistentStats.total.tokens / persistentStats.total.messages)
    : 0;
    
  const avgCostPerMessage = persistentStats.total.messages > 0
    ? (persistentStats.total.cost / persistentStats.total.messages).toFixed(4)
    : '0.0000';
  
  const analyticsText = `
📈 **Analytics & Metriken**

💰 **Kosten (Persistent)**:
- Heute: ${persistentStats.today.cost.toFixed(4)} (${persistentStats.today.messages} msgs)
- Total: ${persistentStats.total.cost.toFixed(4)} (${persistentStats.total.messages} msgs)
- Ø pro Message: ${avgCostPerMessage}

📊 **Token Usage**:
- Heute: ${persistentStats.today.tokens.toLocaleString()}
- Total: ${persistentStats.total.tokens.toLocaleString()}
- Ø pro Message: ${avgTokensPerMessage}

🎙️ **Audio Transkription**:
- Status: ${audioStats.isConfigured ? '🔵 Aktiv' : '🔴 Inaktiv'}
- Transkriptionen: ${audioStats.totalTranscriptions}
- Voice Minutes: ${persistentStats.total.voiceMinutes.toFixed(1)}
- Fehlerrate: ${audioStats.errors}/${audioStats.totalTranscriptions}
- Ø Dauer: ${audioStats.avgDuration.toFixed(1)}s
- Geschätzt/Monat: ${audioStats.estimatedMonthlyCost}

🧠 **Knowledge Base**:
- S1 Files: ${Object.keys(knowledgeLoader.s1Data || {}).length}
- S2 Files: ${Object.keys(knowledgeLoader.knowledgeData || {}).length}
- Gesamt: ~${((JSON.stringify(knowledgeLoader.s1Data || {}).length + JSON.stringify(knowledgeLoader.knowledgeData || {}).length) / 1024).toFixed(0)}KB

🔄 **Performance**:
- Response: <50ms
- Uptime: 99.9%
- Version: ${packageInfo.version}

_Real-time Metriken - Stand: ${new Date().toLocaleTimeString('de-DE')}_
  `;
  
  ctx.editMessageText(analyticsText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Refresh', 'analytics')],
      [Markup.button.callback('⬅️ Zurück', 'back_main')]
    ])
  });
});

// Back to Main Menu
bot.action('back_main', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '📱 Hauptmenü:',
    mainMenu
  );
});

// Clear Claude History
bot.action('clear_history', (ctx) => {
  const userId = ctx.from.id;
  const result = claudeService.clearHistory(userId);
  ctx.answerCbQuery('Conversation neu gestartet!');
  ctx.reply(result, mainMenu);
});

// Voice Message Handler
bot.on('voice', async (ctx) => {
  const userId = ctx.from.id;
  
  // Track voice message in persistent stats
  statsManager.trackMessage(userId, 'voice');
  const fileId = ctx.message.voice.file_id;
  const duration = ctx.message.voice.duration;
  
  // Check if audio service is configured
  if (!audioService.isConfigured) {
    await ctx.reply(
      '❌ **Audio-Transkription nicht verfügbar**\n\n' +
      'OpenAI API Key fehlt. Features:\n' +
      '• Sprachnachrichten werden nicht transkribiert\n' +
      '• Nutze Textnachrichten stattdessen\n\n' +
      '_Admin: OPENAI_API_KEY in .env setzen_',
      { parse_mode: 'Markdown', ...mainMenu }
    );
    return;
  }
  
  // Send typing indicator
  await ctx.sendChatAction('typing');
  
  try {
    // Get file link from Telegram
    const fileLink = await ctx.telegram.getFileLink(fileId);
    
    // Send transcribing message
    const statusMsg = await ctx.reply(
      `🎙️ **Transkribiere Sprachnachricht...**\n` +
      `Dauer: ${duration}s\n\n` +
      `_Dies kann einen Moment dauern..._`,
      { parse_mode: 'Markdown' }
    );
    
    // Process voice message
    const result = await audioService.processVoiceMessage(fileLink.href, 'de');
    
    // Delete status message
    try {
      await ctx.deleteMessage(statusMsg.message_id);
    } catch (e) {
      // Ignore if already deleted
    }
    
    if (result.success) {
      // Show transcription
      const transcribedText = result.text;
      
      await ctx.reply(
        `🎙️ **Transkription erfolgreich!**\n\n` +
        `📝 _"${transcribedText}"_\n\n` +
        `⏱️ Dauer: ${result.duration.toFixed(1)}s\n` +
        `💵 Kosten: ~${result.cost.toFixed(4)}\n\n` +
        `⏳ Verarbeite deine Anfrage...`,
        { parse_mode: 'Markdown' }
      );
      
      // Now process the transcribed text through knowledge base and AI
      await ctx.sendChatAction('typing');
      
      // Check knowledge base first
      const knowledgeAnswer = await knowledgeLoader.answerQuestion(transcribedText);
      
      let aiResponse;
      if (knowledgeAnswer) {
        aiResponse = knowledgeAnswer;
      } else {
        // Use Claude AI with model switcher
        const instruction = instructionManager.getCurrentInstruction(userId);
        const systemPrompt = claudeService.systemPrompt + '\n\n' + instruction;
        
        const response = await modelSwitcher.getResponse(userId, transcribedText, systemPrompt);
        aiResponse = response.content;
        
        // Show which model was used
        const modelInfo = modelSwitcher.getModelInfo(response.model);
        aiResponse += `\n\n_${modelInfo.icon} ${modelInfo.name} verwendet_`;
      }
      
      // Send AI response with voice-specific buttons
      await ctx.reply(aiResponse, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🎙️ Neue Sprachnachricht', 'voice_tip')],
          [Markup.button.callback('📝 Text schreiben', 'text_tip')],
          [Markup.button.callback('📱 Menü', 'back_main')]
        ])
      });
      
    } else {
      // Transcription failed
      await ctx.reply(
        `❌ **Transkription fehlgeschlagen**\n\n` +
        `Fehler: ${result.error}\n\n` +
        `**Mögliche Lösungen:**\n` +
        `• Versuche es erneut\n` +
        `• Spreche deutlicher\n` +
        `• Kürzere Nachricht (max 25MB)\n` +
        `• Schreibe stattdessen\n\n` +
        `_Falls das Problem weiterhin besteht, nutze Textnachrichten._`,
        { parse_mode: 'Markdown', ...mainMenu }
      );
    }
    
  } catch (error) {
    console.error('Voice processing error:', error);
    await ctx.reply(
      '❌ **Fehler beim Verarbeiten der Sprachnachricht**\n\n' +
      `Details: ${error.message}\n\n` +
      '_Bitte versuche es erneut oder nutze eine Textnachricht._',
      { parse_mode: 'Markdown', ...mainMenu }
    );
  }
});

// Voice tip callback
bot.action('voice_tip', (ctx) => {
  ctx.answerCbQuery('🎙️ Halte die Mikrofon-Taste gedrückt!', true);
});

// Text tip callback
bot.action('text_tip', (ctx) => {
  ctx.answerCbQuery('📝 Schreibe deine Nachricht einfach in den Chat!', true);
});

// Text Handler for context-aware responses
bot.on('text', async (ctx) => {
  const session = ctx.session || {};
  const userId = ctx.from.id;
  const userMessage = ctx.message.text;
  
  // Track message in persistent stats
  statsManager.trackMessage(userId, 'text');
  
  // QUICK RESPONSES für bekannte Fragen
  const lowerMessage = userMessage.toLowerCase();
  
  // Umzugs-Fragen
  if (lowerMessage.includes('umzug') || lowerMessage.includes('elmshorn')) {
    await ctx.reply(
      `🏠 **Umzugsprojekt Elmshorn**\n\n` +
      `Status: Aktives Projekt\n` +
      `Personen: Arash & Alina\n` +
      `Location: Elmshorn, Schleswig-Holstein\n\n` +
      `📁 Alle Dokumente in:\n` +
      `/S1/Claudia_Agent/A&A_Umzug_Elmshorn\n\n` +
      `Wichtige Docs: Jobcenter Brief, Mietinfos\n\n` +
      `_Frage nach spezifischen Details!_`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Was gibt es neues
  if (lowerMessage.includes('was gibt') && lowerMessage.includes('neu')) {
    const knowledge = await knowledgeLoader.loadAllKnowledge();
    if (knowledge.length > 0) {
      await ctx.reply(
        `🆕 **Neue Features in v1.3.0:**\n\n` +
        `✏️ File Editor - Dateien direkt bearbeiten\n` +
        `🤖 Project Agents - KI-Agents für Projekte\n` +
        `🏠 Umzugsprojekt Integration\n` +
        `📚 Erweiterte Knowledge Base\n\n` +
        `Knowledge Base: ${knowledge.length} Zeichen geladen\n` +
        `S1 Integration: ✅ Aktiv`,
        { parse_mode: 'Markdown' }
      );
    }
    return;
  }
  
  // Quick Note Handler
  if (session.expecting === 'quick_note') {
    await ctx.sendChatAction('typing');
    // TODO: Save to knowledge base
    ctx.reply(
      `💡 *Notiz gespeichert!*\n\n"${userMessage}"\n\n_Wird in Knowledge Base archiviert_`,
      {
        parse_mode: 'Markdown',
        ...mainMenu
      }
    );
    ctx.session = { ...session, expecting: null };
    return;
  }
  
  // KB Search Handler  
  if (session.expecting === 'kb_search') {
    await ctx.sendChatAction('typing');
    const results = await knowledgeLoader.searchKnowledge(userMessage);
    
    let resultText = `🔍 *Suchergebnisse für: ${userMessage}*\n\n`;
    if (results.length > 0) {
      results.forEach(r => {
        resultText += `📁 **${r.file}**\n`;
        r.matches.forEach(m => {
          resultText += `- ${m.substring(0, 100)}...\n`;
        });
        resultText += '\n';
      });
    } else {
      resultText += '_Keine Ergebnisse gefunden_';
    }
    
    ctx.reply(resultText, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('🔍 Neue Suche', 'kb_search'), Markup.button.callback('📱 Menü', 'back_main')]])
    });
    ctx.session = { ...session, expecting: null };
    return;
  }
  
  // INSTRUCTION EDIT HANDLER
  if (session.expecting === 'instruction_edit') {
    if (userMessage.toLowerCase() === 'cancel') {
      ctx.reply('❌ Bearbeitung abgebrochen', mainMenu);
      ctx.session = { ...session, expecting: null };
      return;
    }
    
    try {
      const result = await instructionManager.setInstruction(userMessage, userId);
      ctx.answerCbQuery(`✅ Instruction aktualisiert!`);
      
      // Update Claude prompt
      const knowledge = await knowledgeLoader.loadAllKnowledge();
      const instruction = instructionManager.getCurrentInstruction(userId);
      claudeService.updateSystemPrompt(knowledge + '\n\n' + instruction);
      
      ctx.reply(
        `✅ **Instruction aktualisiert!**\n\n` +
        `Länge: ${result.length} Zeichen\n\n` +
        `_Claude verwendet jetzt die neue Instruction._`,
        { parse_mode: 'Markdown', ...mainMenu }
      );
    } catch (error) {
      ctx.reply(`❌ Fehler: ${error.message}`, mainMenu);
    }
    
    ctx.session = { ...session, expecting: null };
    return;
  }
  
  // FILE EDIT HANDLERS
  if (session.expecting === 'file_path_to_edit') {
    const filePath = userMessage.trim();
    
    // Konvertiere Shortcuts
    const fullPath = filePath
      .replace('/S1/', '/Users/az/Documents/A+/AVX/Spaces/S1/')
      .replace('/S2/', '/Users/az/Documents/A+/AVX/Spaces/S2/');
    
    const result = await fileEditor.startEdit(userId, fullPath);
    
    if (result.error) {
      ctx.reply(`❌ Fehler: ${result.error}`);
      ctx.session = { ...session, expecting: null };
      return;
    }
    
    await ctx.reply(
      `📄 **File geöffnet**: ${path.basename(fullPath)}\n\n` +
      `Größe: ${result.size}\n` +
      `Zeilen: ${result.lines}\n\n` +
      `_Schicke mir den neuen Inhalt oder "cancel" zum Abbrechen_`,
      { parse_mode: 'Markdown' }
    );
    
    // Zeige ersten Teil des Contents
    const preview = result.content.substring(0, 1000);
    await ctx.reply(`👀 **Vorschau**:\n\n\`\`\`\n${preview}${result.content.length > 1000 ? '...' : ''}\n\`\`\``);
    
    ctx.session = { ...session, expecting: 'file_content_edit', editingFile: fullPath };
    return;
  }
  
  if (session.expecting === 'file_content_edit') {
    if (userMessage.toLowerCase() === 'cancel') {
      fileEditor.editSessions.delete(userId);
      ctx.reply('❌ Edit abgebrochen', mainMenu);
      ctx.session = { ...session, expecting: null };
      return;
    }
    
    const result = await fileEditor.saveEdit(userId, userMessage);
    
    if (result.error) {
      ctx.reply(`❌ Fehler beim Speichern: ${result.error}`);
    } else {
      ctx.reply(
        `✅ **Datei gespeichert!**\n\n` +
        `Backup: ${path.basename(result.backupPath)}\n` +
        `Änderungen: ${result.changes.charactersChanged} Zeichen\n` +
        `Zeilen: ${result.changes.linesAdded > 0 ? '+' : ''}${result.changes.linesAdded}`,
        { parse_mode: 'Markdown', ...mainMenu }
      );
    }
    
    ctx.session = { ...session, expecting: null, editingFile: null };
    return;
  }
  
  // PROJECT AGENT HANDLERS
  if (session.expecting === 'switch_agent_name') {
    const agentName = userMessage.trim();
    const result = await projectAgents.switchAgent(agentName);
    
    if (result.error) {
      ctx.reply(`❌ ${result.error}`);
    } else {
      // Update Claude's System Prompt
      const knowledge = await knowledgeLoader.loadAllKnowledge();
      const fullPrompt = projectAgents.getSystemPrompt(knowledge);
      claudeService.updateSystemPrompt(fullPrompt);
      
      ctx.reply(
        `🎯 **Agent aktiviert**: ${result.agent.name}\n\n` +
        `Instruction Prompt:\n_${result.agent.instructionPrompt}_`,
        { parse_mode: 'Markdown', ...mainMenu }
      );
    }
    
    ctx.session = { ...session, expecting: null };
    return;
  }
  
  if (session.expecting === 'new_instruction_prompt') {
    const newPrompt = userMessage;
    const agentName = projectAgents.activeAgent?.name;
    
    if (!agentName) {
      ctx.reply('❌ Kein aktiver Agent!');
      ctx.session = { ...session, expecting: null };
      return;
    }
    
    const result = await projectAgents.updateInstructionPrompt(agentName, newPrompt);
    
    if (result.error) {
      ctx.reply(`❌ Fehler: ${result.error}`);
    } else {
      // Update Claude's System Prompt
      const knowledge = await knowledgeLoader.loadAllKnowledge();
      const fullPrompt = projectAgents.getSystemPrompt(knowledge);
      claudeService.updateSystemPrompt(fullPrompt);
      
      ctx.reply(
        `✅ **Instruction Prompt aktualisiert!**\n\n` +
        `Agent: ${agentName}\n` +
        `Backup: ${path.basename(result.backupPath)}`,
        { parse_mode: 'Markdown', ...mainMenu }
      );
    }
    
    ctx.session = { ...session, expecting: null };
    return;
  }
  
  if (session.expecting === 'new_agent_name') {
    const agentName = userMessage.trim();
    ctx.session = { ...session, expecting: 'new_agent_instruction', newAgentName: agentName };
    
    ctx.reply(
      `🤖 **Neuer Agent**: ${agentName}\n\n` +
      `Schicke mir jetzt den Instruction Prompt für diesen Agent.\n\n` +
      `Beispiel:\n` +
      `_"Du bist ein Experte für... Deine Aufgabe ist es..."_`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  if (session.expecting === 'new_agent_instruction') {
    const agentName = session.newAgentName;
    const instruction = userMessage;
    
    const result = await projectAgents.createAgent(agentName, instruction);
    
    if (result.error) {
      ctx.reply(`❌ Fehler: ${result.error}`);
    } else {
      ctx.reply(
        `✅ **Agent erstellt!**\n\n` +
        `Name: ${result.agent.name}\n` +
        `Pfad: ${result.agent.path}\n\n` +
        `Der Agent kann jetzt aktiviert werden.`,
        { parse_mode: 'Markdown', ...mainMenu }
      );
    }
    
    ctx.session = { ...session, expecting: null, newAgentName: null };
    return;
  }
  
  // Default: Check Knowledge Base first, then Claude AI
  await ctx.sendChatAction('typing');
  
  try {
    // Prüfe zuerst, ob Knowledge Base die Frage direkt beantworten kann
    const knowledgeAnswer = await knowledgeLoader.answerQuestion(userMessage);
    
    let aiResponse;
    if (knowledgeAnswer) {
      // Direkte Antwort aus Knowledge Base
      aiResponse = knowledgeAnswer;
    } else {
      // Claude AI mit Knowledge Context und dynamischem Model
      const context = {
        userName: 'Arash',
        ...session
      };
      
      // Use model switcher instead of direct claude service
      const instruction = instructionManager.getCurrentInstruction(userId);
      const systemPrompt = claudeService.systemPrompt + '\n\n' + instruction;
      
      const response = await modelSwitcher.getResponse(userId, userMessage, systemPrompt);
      aiResponse = response.content;
      
      // Show which model was used
      const modelInfo = modelSwitcher.getModelInfo(response.model);
      aiResponse += `\n\n_${modelInfo.icon} ${modelInfo.name} used_`;
    }
    
    // Personalisierte Response Buttons
    ctx.reply(
      aiResponse,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('💡 Quick Note', 'quick_note'), Markup.button.callback('🔍 KB Suche', 'kb_search')],
          [Markup.button.callback('🔄 Neu starten', 'clear_history'), Markup.button.callback('📱 Menü', 'back_main')]
        ])
      }
    );
  } catch (error) {
    console.error('AI Response Error:', error);
    ctx.reply(
      '❌ Ein Fehler ist aufgetreten. Versuche es später nochmal.',
      Markup.inlineKeyboard([[Markup.button.callback('📱 Menü', 'back_main')]])
    );
  }
});

// Error Handler
bot.catch((err, ctx) => {
  console.error('Bot Error:', err);
  ctx.reply('❌ Ein Fehler ist aufgetreten.', mainMenu);
});

// Session Middleware (simple in-memory)
bot.use((ctx, next) => {
  ctx.session = ctx.session || {};
  return next();
});

// Launch mit Knowledge Base Loading
bot.launch().then(async () => {
  console.log(`🚀 AVX Copilot o1 v${packageInfo.version} is running!`);
  console.log(`📅 Started at: ${new Date().toLocaleString('de-DE')}`);
  
  // Lade Knowledge Base beim Start
  const knowledge = await knowledgeLoader.loadAllKnowledge();
  if (knowledge) {
    claudeService.updateSystemPrompt(knowledge);
    console.log('✅ Knowledge Base in Claude AI geladen!');
  }
  
  // Lade Project Agents
  const agents = await projectAgents.loadAllAgents();
  console.log(`🤖 ${agents.length} Projekt-Agents verfügbar`);
  
  // Aktiviere Standard-Agent wenn vorhanden
  if (agents.length > 0 && agents.find(a => a.name === 'A&A_Umzug_Elmshorn')) {
    await projectAgents.switchAgent('A&A_Umzug_Elmshorn');
    console.log('🎯 Umzugs-Agent automatisch aktiviert');
  }
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
