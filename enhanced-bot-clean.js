// AVX Copilot o1 - Clean Version with Knowledge Base
const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();
const claudeService = require('./claude-service');
const fs = require('fs').promises;
const path = require('path');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Clean Main Menu - Only working features
const mainMenu = Markup.inlineKeyboard([
  [
    Markup.button.callback('🚀 C-Start', 'c_start'),
    Markup.button.callback('📊 Status', 'status')
  ],
  [
    Markup.button.callback('📝 Context', 'context'),
    Markup.button.callback('❓ Hilfe', 'help')
  ]
]);

// Start Command - Auto-loads Knowledge Base
bot.command('start', async (ctx) => {
  const stats = claudeService.getStats();
  const aiStatus = stats.isConfigured ? '🟢 Claude AI aktiv' : '🔴 Claude AI nicht konfiguriert';
  
  // Show loading message
  const loadingMsg = await ctx.reply('🚀 *AVX Copilot startet...*\n\n📚 Lade aktuelle Knowledge Base...', {
    parse_mode: 'Markdown'
  });
  
  try {
    // Auto-load knowledge base on start
    const knowledgeFiles = [
      'STARTER_PROMPT_UPDATED.md',
      'knowledge/PROJECT_PROTOCOL.md',
      'knowledge/STRATEGIC_DECISIONS.md',
      'knowledge/CLAUDE_CAPABILITIES.md'
    ];
    
    let combinedKnowledge = '';
    let successCount = 0;
    
    for (const file of knowledgeFiles) {
      try {
        const content = await fs.readFile(path.join(__dirname, file), 'utf8');
        combinedKnowledge += `\n\n### ${file}\n${content}`;
        successCount++;
      } catch (error) {
        console.log(`⚠️ Could not load ${file}`);
      }
    }
    
    if (successCount > 0) {
      claudeService.updateSystemPrompt(combinedKnowledge);
      console.log(`✅ Loaded ${successCount}/${knowledgeFiles.length} knowledge files`);
    }
    
    // Delete loading message
    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);
    
    // Show welcome with updated status
    ctx.reply(
      `🚀 *AVX Copilot o1 - Dev Assistant*\n\n` +
      `Ich bin dein AI Assistant mit vollem Projekt-Kontext.\n` +
      `${aiStatus}\n` +
      `📚 Knowledge Base: ${successCount} Dateien geladen\n\n` +
      `Schreibe einfach drauf los oder nutze die Commands:`,
      {
        parse_mode: 'Markdown',
        ...mainMenu
      }
    );
  } catch (error) {
    console.error('Start command error:', error);
    // Delete loading message if still exists
    try {
      await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);
    } catch {}
    
    // Show welcome anyway
    ctx.reply(
      `🚀 *AVX Copilot o1 - Dev Assistant*\n\n` +
      `Ich bin dein AI Assistant.\n` +
      `${aiStatus}\n\n` +
      `Schreibe einfach drauf los oder nutze die Commands:`,
      {
        parse_mode: 'Markdown',
        ...mainMenu
      }
    );
  }
});

// Menu Command
bot.command('menu', (ctx) => {
  ctx.reply('📱 Hauptmenü:', mainMenu);
});

// Status Command & Button
bot.command('status', async (ctx) => handleStatus(ctx));
bot.action('status', async (ctx) => {
  ctx.answerCbQuery('Lade Status...');
  await handleStatus(ctx);
});

async function handleStatus(ctx) {
  const stats = claudeService.getStats();
  const aiEmoji = stats.isConfigured ? '🟢' : '🔴';
  
  const statusText = `
📊 *System Status*

${aiEmoji} Claude AI: ${stats.isConfigured ? 'Aktiv' : 'Nicht konfiguriert'}
💰 AI Kosten: ${stats.estimatedCost}
📈 Tokens genutzt: ${stats.totalTokens.toLocaleString()}
🔄 Aktive Chats: ${stats.activeConversations}
⏰ Bot gestartet: ${new Date(Date.now() - process.uptime() * 1000).toLocaleString('de-DE')}

_Railway Deployment: production_
  `;
  
  const message = {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[
      Markup.button.callback('🔄 Aktualisieren', 'status'),
      Markup.button.callback('📱 Menü', 'back_main')
    ]])
  };
  
  if (ctx.callbackQuery) {
    ctx.editMessageText(statusText, message);
  } else {
    ctx.reply(statusText, message);
  }
}

// Context Command & Button
bot.command('context', async (ctx) => handleContext(ctx));
bot.action('context', async (ctx) => {
  ctx.answerCbQuery('Lade Projekt-Kontext...');
  await handleContext(ctx);
});

async function handleContext(ctx) {
  const contextText = `
📚 *AVX Copilot Projekt-Kontext*

*Version:* o1 (Live auf Railway)
*GitHub:* github.com/areanatic/avx-copilot-o1
*Telegram:* @avx_copilot_o1_bot

*Features:*
• Claude Opus AI Integration ✅
• Multi-Agent System (v2 geplant)
• Token Router (3-Tier System)
• Second Brain Prinzipien

*Knowledge Base:*
• STARTER_PROMPT ✅
• PROJECT_PROTOCOL ✅ 
• STRATEGIC_DECISIONS ✅
• CLAUDE_CAPABILITIES ✅

*Aktuelle Session:*
Gestartet: 18.07.2025, 00:13 Uhr
  `;
  
  const message = {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[
      Markup.button.callback('🔄 CP Update', 'cp_update'),
      Markup.button.callback('📱 Menü', 'back_main')
    ]])
  };
  
  if (ctx.callbackQuery) {
    ctx.editMessageText(contextText, message);
  } else {
    ctx.reply(contextText, message);
  }
}

// C-Start - Fresh Co-Pilot Start
bot.action('c_start', async (ctx) => {
  ctx.answerCbQuery('Co-Pilot wird neu gestartet...');
  
  try {
    await ctx.sendChatAction('typing');
    
    // Clear conversation history
    const userId = ctx.from.id;
    claudeService.clearHistory(userId);
    
    // Load fresh knowledge base
    const knowledgeFiles = [
      'STARTER_PROMPT_UPDATED.md',
      'knowledge/PROJECT_PROTOCOL.md',
      'knowledge/STRATEGIC_DECISIONS.md',
      'knowledge/CLAUDE_CAPABILITIES.md'
    ];
    
    let combinedKnowledge = '';
    let loadedFiles = [];
    
    for (const file of knowledgeFiles) {
      try {
        const content = await fs.readFile(path.join(__dirname, file), 'utf8');
        combinedKnowledge += `\n\n### ${file}\n${content}`;
        loadedFiles.push(`✅ ${file}`);
      } catch (error) {
        loadedFiles.push(`❌ ${file} (nicht gefunden)`);
      }
    }
    
    // Update Claude with fresh knowledge
    claudeService.updateSystemPrompt(combinedKnowledge);
    
    const responseText = `
🚀 *Co-Pilot Neustart erfolgreich!*

*Geladene Knowledge Base:*
${loadedFiles.join('\n')}

✅ Conversation History gelöscht
✅ Aktuellste Projekt-Infos geladen
✅ Bereit für neue Session!

Ich bin jetzt dein AVX Copilot mit vollem Projekt-Kontext.
Wie in unserem Desktop-Chat, nur mobil!

Wie kann ich dir helfen?
    `;
    
    ctx.editMessageText(responseText, {
      parse_mode: 'Markdown',
      ...mainMenu
    });
  } catch (error) {
    console.error('C-Start Error:', error);
    ctx.reply('❌ Fehler beim Neustart. Bitte erneut versuchen.');
  }
});

// Help Command & Button
bot.command('help', async (ctx) => handleHelp(ctx));
bot.action('help', async (ctx) => {
  ctx.answerCbQuery();
  await handleHelp(ctx);
});

async function handleHelp(ctx) {
  const helpText = `
❓ *Hilfe & Commands*

*Verfügbare Commands:*
/start - Bot starten (lädt Knowledge automatisch)
/menu - Hauptmenü anzeigen
/status - System Status
/context - Projekt-Kontext
/help - Diese Hilfe

*Menü-Buttons:*
🚀 C-Start - Co-Pilot Neustart mit frischer Knowledge Base
📊 Status - Zeigt AI-Metriken und Kosten
📝 Context - Zeigt Projekt-Übersicht
❓ Hilfe - Diese Hilfe

*Free Chat:*
Schreibe einfach drauf los! Ich habe vollen Zugriff auf:
• Projekt-Historie
• Strategische Entscheidungen
• Technische Details
• Aktuelle TODOs

*Tipps:*
• Knowledge Base wird beim Start automatisch geladen
• Nutze "C-Start" für einen Fresh-Restart
• Ich bin wie dein Desktop-Claude, nur mobil!
  `;
  
  const message = {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('📱 Menü', 'back_main')]])
  };
  
  if (ctx.callbackQuery) {
    ctx.editMessageText(helpText, message);
  } else {
    ctx.reply(helpText, message);
  }
}

// Back to Main Menu
bot.action('back_main', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '📱 Hauptmenü:\n\nWähle eine Option oder schreibe einfach drauf los!',
    {
      parse_mode: 'Markdown',
      ...mainMenu
    }
  );
});

// Clear History Button
bot.action('clear_history', (ctx) => {
  const userId = ctx.from.id;
  const result = claudeService.clearHistory(userId);
  ctx.answerCbQuery('Conversation neu gestartet!');
  ctx.reply(result, mainMenu);
});

// Text Handler - Free Chat with Claude
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userMessage = ctx.message.text;
  
  // Skip if it's a command
  if (userMessage.startsWith('/')) return;
  
  await ctx.sendChatAction('typing');
  
  try {
    const context = {
      userName: ctx.from.first_name || 'User',
      isAdmin: ctx.from.username === 'areanatic', // Admin detection
      timestamp: new Date().toISOString()
    };
    
    const aiResponse = await claudeService.getResponse(userId, userMessage, context);
    
    // Smart reply with context-aware buttons
    const replyButtons = [[
      Markup.button.callback('📊 Status', 'status'),
      Markup.button.callback('🔄 Neu starten', 'clear_history')
    ]];
    
    // Add CP Update button if discussing project updates
    if (userMessage.toLowerCase().includes('update') || 
        userMessage.toLowerCase().includes('änderung') ||
        userMessage.toLowerCase().includes('neu')) {
      replyButtons.push([Markup.button.callback('🚀 C-Start', 'c_start')]);
    }
    
    replyButtons.push([Markup.button.callback('📱 Menü', 'back_main')]);
    
    ctx.reply(aiResponse, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(replyButtons)
    });
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

// Launch with initial knowledge load
bot.launch().then(async () => {
  console.log('🚀 AVX Copilot o1 (Clean Version) is running!');
  console.log('📚 Loading initial knowledge base...');
  
  // Auto-load knowledge on startup
  try {
    const knowledgeFiles = [
      'STARTER_PROMPT_UPDATED.md',
      'knowledge/PROJECT_PROTOCOL.md',
      'knowledge/STRATEGIC_DECISIONS.md', 
      'knowledge/CLAUDE_CAPABILITIES.md'
    ];
    
    let combinedKnowledge = '';
    
    for (const file of knowledgeFiles) {
      try {
        const content = await fs.readFile(path.join(__dirname, file), 'utf8');
        combinedKnowledge += `\n\n### ${file}\n${content}`;
        console.log(`✅ Loaded: ${file}`);
      } catch (error) {
        console.log(`❌ Failed to load: ${file}`);
      }
    }
    
    claudeService.updateSystemPrompt(combinedKnowledge);
    console.log('✅ Knowledge base loaded successfully!');
  } catch (error) {
    console.error('❌ Knowledge base loading failed:', error);
  }
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
