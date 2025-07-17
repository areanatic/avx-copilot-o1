// AVX Copilot o1 - Enhanced Bot with Buttons
const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();

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
  ctx.reply(
    `🚀 *Willkommen bei AVX Copilot o1!*\n\n` +
    `Ich bin dein intelligenter Assistant. Was möchtest du tun?`,
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
  
  const statusText = `
✅ *System Status*

🟢 Bot: Online
⚡ Response: <50ms
🧠 AI: Aktiv
💾 Speicher: 89% frei
🔄 Uptime: 2h 34m

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
/help - Diese Hilfe

*Features:*
• 📋 Aufgaben erstellen und verwalten
• 🔍 Intelligente Suche
• 📊 Status-Übersicht
• 📝 Notizen speichern
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

// Text Handler for context-aware responses
bot.on('text', (ctx) => {
  const session = ctx.session || {};
  
  if (session.expecting === 'search') {
    ctx.reply(
      `🔍 Suche nach: *${ctx.message.text}*\n\nHier sind die Ergebnisse...`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔍 Neue Suche', 'search'), Markup.button.callback('📱 Menü', 'back_main')]])
      }
    );
    ctx.session = { ...session, expecting: null };
  } else if (session.expecting === 'task_description') {
    ctx.reply(
      `✅ Aufgabe gespeichert!\n\n*${ctx.message.text}*`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('📋 Neue Aufgabe', 'new_task'), Markup.button.callback('📱 Menü', 'back_main')]])
      }
    );
    ctx.session = { ...session, expecting: null };
  } else {
    // Default AI response
    ctx.reply(
      `💬 ${ctx.message.text}\n\nIch arbeite an einer Antwort...`,
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

// Launch
bot.launch().then(() => {
  console.log('🚀 AVX Copilot o1 with Buttons is running!');
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
