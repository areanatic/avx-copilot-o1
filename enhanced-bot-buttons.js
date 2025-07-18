// AVX Copilot o1 - Enhanced Bot with Buttons & Claude AI
const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();
const claudeService = require('./claude-service');
const knowledgeLoader = require('./knowledge-loader');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Main Menu Keyboard
const mainMenu = Markup.inlineKeyboard([
  [
    Markup.button.callback('📋 Neue Aufgabe', 'new_task'),
    Markup.button.callback('📊 Status', 'status')
  ],
  [
    Markup.button.callback('🔍 Suche', 'search'),
    Markup.button.callback('📝 Notiz', 'note')
  ],
  [
    Markup.button.callback('⚙️ Einstellungen', 'settings'),
    Markup.button.callback('❓ Hilfe', 'help')
  ]
]);

// Task Type Selection
const taskTypes = Markup.inlineKeyboard([
  [
    Markup.button.callback('💻 Entwicklung', 'task_dev'),
    Markup.button.callback('📄 Dokumentation', 'task_doc')
  ],
  [
    Markup.button.callback('🔧 Bug Fix', 'task_bug'),
    Markup.button.callback('✨ Feature', 'task_feature')
  ],
  [Markup.button.callback('⬅️ Zurück', 'back_main')]
]);

// Settings Menu
const settingsMenu = Markup.inlineKeyboard([
  [
    Markup.button.callback('🔔 Benachrichtigungen', 'notif_toggle'),
    Markup.button.callback('🌐 Sprache', 'lang_select')
  ],
  [
    Markup.button.callback('🎨 Theme', 'theme_select'),
    Markup.button.callback('🔐 Privatsphäre', 'privacy')
  ],
  [Markup.button.callback('⬅️ Zurück', 'back_main')]
]);

// Start Command
bot.command('start', (ctx) => {
  const stats = claudeService.getStats();
  const aiStatus = stats.isConfigured ? '🟢 Claude AI aktiv' : '🔴 Claude AI nicht konfiguriert';
  
  ctx.reply(
    `🚀 *Willkommen bei AVX Copilot o1!*\n\n` +
    `Ich bin dein intelligenter AI Assistant powered by Claude.\n` +
    `${aiStatus}\n\n` +
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

// Button Handlers
bot.action('new_task', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '📋 *Neue Aufgabe erstellen*\n\nWähle den Aufgabentyp:',
    {
      parse_mode: 'Markdown',
      ...taskTypes
    }
  );
});

bot.action('status', async (ctx) => {
  ctx.answerCbQuery('Lade Status...');
  
  const stats = claudeService.getStats();
  const aiEmoji = stats.isConfigured ? '🟢' : '🔴';
  
  const statusText = `
✅ *System Status*

🟢 Bot: Online
⚡ Response: <50ms
${aiEmoji} Claude AI: ${stats.isConfigured ? 'Aktiv' : 'Nicht konfiguriert'}
💰 AI Kosten: ${stats.estimatedCost}
📈 Tokens genutzt: ${stats.totalTokens.toLocaleString()}
🔄 Aktive Chats: ${stats.activeConversations}

_Letztes Update: ${new Date().toLocaleString('de-DE')}_
  `;
  
  const statusButtons = Markup.inlineKeyboard([
    [
      Markup.button.callback('🔄 Aktualisieren', 'refresh_status'),
      Markup.button.callback('📊 Details', 'status_details')
    ],
    [Markup.button.callback('⬅️ Zurück', 'back_main')]
  ]);
  
  ctx.editMessageText(statusText, {
    parse_mode: 'Markdown',
    ...statusButtons
  });
});

bot.action('search', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '🔍 *Suche*\n\nSchreibe mir, wonach du suchst:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Zurück', 'back_main')]])
    }
  );
  
  // Set user state to expect search query
  ctx.session = { ...ctx.session, expecting: 'search' };
});

bot.action('settings', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '⚙️ *Einstellungen*\n\nWähle eine Option:',
    {
      parse_mode: 'Markdown',
      ...settingsMenu
    }
  );
});

bot.action('help', (ctx) => {
  ctx.answerCbQuery();
  const helpText = `
❓ *Hilfe & Befehle*

*Verfügbare Befehle:*
/start - Bot starten
/menu - Hauptmenü anzeigen
/ai [text] - Direkt mit Claude sprechen
/help - Diese Hilfe

*Features:*
• 🤖 Claude AI Integration - Intelligente Antworten
• 📋 Aufgaben erstellen und AI-analysieren lassen
• 🔍 AI-powered Suche
• 📊 Status mit AI-Metriken
• 📝 Conversation Memory
• 💰 Kostentracking in Echtzeit
• ⚙️ Anpassbare Einstellungen

*Tipps:*
- Nutze die Buttons für schnelle Navigation
- Schreibe mir direkt für AI-Unterstützung
- Verwende /menu für das Hauptmenü
  `;
  
  ctx.editMessageText(helpText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Zurück', 'back_main')]])
  });
});

// Task Type Handlers
bot.action(/task_(.+)/, (ctx) => {
  const taskType = ctx.match[1];
  const typeNames = {
    'dev': '💻 Entwicklung',
    'doc': '📄 Dokumentation', 
    'bug': '🔧 Bug Fix',
    'feature': '✨ Feature'
  };
  
  ctx.answerCbQuery(`${typeNames[taskType]} gewählt`);
  
  const priorityButtons = Markup.inlineKeyboard([
    [
      Markup.button.callback('🔴 Hoch', `priority_high_${taskType}`),
      Markup.button.callback('🟡 Mittel', `priority_medium_${taskType}`),
      Markup.button.callback('🟢 Niedrig', `priority_low_${taskType}`)
    ],
    [Markup.button.callback('⬅️ Zurück', 'new_task')]
  ]);
  
  ctx.editMessageText(
    `${typeNames[taskType]} *Aufgabe*\n\nWähle die Priorität:`,
    {
      parse_mode: 'Markdown',
      ...priorityButtons
    }
  );
});

// Priority Handlers
bot.action(/priority_(.+)_(.+)/, (ctx) => {
  const [priority, taskType] = ctx.match.slice(1);
  ctx.answerCbQuery('Aufgabe wird erstellt...');
  
  ctx.editMessageText(
    `✅ *Aufgabe erstellt!*\n\n` +
    `Typ: ${taskType}\n` +
    `Priorität: ${priority}\n\n` +
    `Beschreibe jetzt deine Aufgabe:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Abbrechen', 'back_main')]])
    }
  );
  
  ctx.session = { ...ctx.session, expecting: 'task_description', taskType, priority };
});

// Back to Main Menu
bot.action('back_main', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '📱 Hauptmenü:',
    mainMenu
  );
});

// Refresh Status
bot.action('refresh_status', (ctx) => {
  ctx.answerCbQuery('Aktualisiert!');
  // Trigger status update
  bot.telegram.sendChatAction(ctx.chat.id, 'typing');
  setTimeout(() => {
    ctx.scene.enter('status');
  }, 500);
});

// Toggle Notifications
bot.action('notif_toggle', (ctx) => {
  ctx.answerCbQuery('Benachrichtigungen umgeschaltet!');
  // Toggle logic here
});

// Clear Claude History
bot.action('clear_history', (ctx) => {
  const userId = ctx.from.id;
  const result = claudeService.clearHistory(userId);
  ctx.answerCbQuery('Conversation neu gestartet!');
  ctx.reply(result, mainMenu);
});

// Text Handler for context-aware responses
bot.on('text', async (ctx) => {
  const session = ctx.session || {};
  const userId = ctx.from.id;
  const userMessage = ctx.message.text;
  
  if (session.expecting === 'search') {
    // AI-powered search
    await ctx.sendChatAction('typing');
    const searchPrompt = `Der User sucht nach: "${userMessage}". Gib hilfreiche Informationen oder Vorschläge.`;
    const aiResponse = await claudeService.getResponse(userId, searchPrompt, { expecting: 'search' });
    
    ctx.reply(
      `🔍 *Suchergebnisse für: ${userMessage}*\n\n${aiResponse}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔍 Neue Suche', 'search'), Markup.button.callback('📱 Menü', 'back_main')]])
      }
    );
    ctx.session = { ...session, expecting: null };
  } else if (session.expecting === 'task_description') {
    // AI Task Analysis
    await ctx.sendChatAction('typing');
    const analysis = await claudeService.analyzeTask(userMessage);
    
    ctx.reply(
      `✅ *Aufgabe analysiert!*\n\n${analysis}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('📋 Neue Aufgabe', 'new_task'), Markup.button.callback('📱 Menü', 'back_main')]])
      }
    );
    ctx.session = { ...session, expecting: null, lastTask: userMessage };
  } else {
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
        // Claude AI mit Knowledge Context
        const context = {
          userName: ctx.from.first_name || 'User',
          ...session
        };
        
        aiResponse = await claudeService.getResponse(userId, userMessage, context);
      }
      
      ctx.reply(
        aiResponse,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📋 Neue Aufgabe', 'new_task'), Markup.button.callback('🔍 Suche', 'search')],
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
  console.log('🚀 AVX Copilot o1 with Buttons is running!');
  
  // Lade Knowledge Base beim Start
  const knowledge = await knowledgeLoader.loadAllKnowledge();
  if (knowledge) {
    claudeService.updateSystemPrompt(knowledge);
    console.log('✅ Knowledge Base in Claude AI geladen!');
  }
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
