// quick-note-fix.js - Integration für enhanced-bot-buttons.js
const userNotesManager = require('./user-notes-manager');

// 1. ADD THIS: Quick Note Button Handler
bot.action('quick_note', async (ctx) => {
  const userId = ctx.from.id;
  
  // Show recent notes first
  const recentNotes = await userNotesManager.getRecentNotes(userId, 3);
  
  let messageText = '💡 **Quick Note**\n\n';
  
  if (recentNotes.length > 0) {
    messageText += '📝 _Deine letzten Notizen:_\n';
    recentNotes.forEach((note, index) => {
      const timestamp = new Date(note.timestamp).toLocaleString('de-DE');
      const preview = note.text.substring(0, 50) + (note.text.length > 50 ? '...' : '');
      messageText += `${index + 1}. ${preview} (${timestamp})\n`;
    });
    messageText += '\n';
  }
  
  messageText += 'Schicke mir deine neue Notiz:';
  
  await ctx.editMessageText(messageText, { parse_mode: 'Markdown' });
  ctx.session = { ...ctx.session, expecting: 'quick_note' };
});

// 2. REPLACE the existing quick_note handler (around line 150) with:
if (session.expecting === 'quick_note') {
  await ctx.sendChatAction('typing');
  
  // ACTUALLY SAVE THE NOTE!
  const savedNote = await userNotesManager.saveNote(userId, userMessage, {
    source: 'telegram',
    type: 'quick_note'
  });
  
  const stats = await userNotesManager.getStats(userId);
  
  ctx.reply(
    `✅ **Notiz gespeichert!**\n\n` +
    `📝 _"${userMessage}"_\n\n` +
    `📊 **Deine Statistik:**\n` +
    `• Notizen gesamt: ${stats.total}\n` +
    `• Aktive Notizen: ${stats.active}\n` +
    `• Wörter gesamt: ${stats.totalWords}\n\n` +
    `ID: #${savedNote.id}`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📝 Weitere Notiz', 'quick_note')],
        [Markup.button.callback('🔍 Notizen durchsuchen', 'search_notes')],
        [Markup.button.callback('📱 Hauptmenü', 'back_main')]
      ])
    }
  );
  ctx.session = { ...session, expecting: null };
  return;
}

// 3. ADD: "Was waren meine letzten Notizen?" Handler
bot.action('show_recent_notes', async (ctx) => {
  const userId = ctx.from.id;
  const notes = await userNotesManager.getRecentNotes(userId, 10);
  
  if (notes.length === 0) {
    await ctx.editMessageText(
      '📭 **Keine Notizen gefunden**\n\n' +
      'Du hast noch keine Notizen gespeichert.',
      Markup.inlineKeyboard([
        [Markup.button.callback('💡 Erste Notiz erstellen', 'quick_note')],
        [Markup.button.callback('📱 Zurück', 'back_main')]
      ])
    );
    return;
  }
  
  let message = '📝 **Deine letzten Notizen:**\n\n';
  notes.forEach((note, index) => {
    const date = new Date(note.timestamp).toLocaleString('de-DE');
    message += `**${index + 1}.** ${note.text}\n`;
    message += `_${date} • ${note.metadata.wordCount} Wörter_\n\n`;
  });
  
  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('💡 Neue Notiz', 'quick_note')],
      [Markup.button.callback('🔍 Suchen', 'search_notes')],
      [Markup.button.callback('📱 Zurück', 'back_main')]
    ])
  });
});

// 4. ADD: Search handler
bot.action('search_notes', async (ctx) => {
  await ctx.editMessageText(
    '🔍 **Notizen durchsuchen**\n\n' +
    'Schicke mir einen Suchbegriff:',
    { parse_mode: 'Markdown' }
  );
  ctx.session = { ...ctx.session, expecting: 'search_notes' };
});

// 5. ADD: Search processor
if (session.expecting === 'search_notes') {
  const results = await userNotesManager.searchNotes(userId, userMessage);
  
  if (results.length === 0) {
    ctx.reply('Keine Notizen mit diesem Begriff gefunden.', mainMenu);
  } else {
    let message = `🔍 **${results.length} Treffer für "${userMessage}":**\n\n`;
    results.forEach((note, index) => {
      const date = new Date(note.timestamp).toLocaleString('de-DE');
      message += `**${index + 1}.** ${note.text}\n_${date}_\n\n`;
    });
    
    ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔍 Neue Suche', 'search_notes')],
        [Markup.button.callback('📱 Hauptmenü', 'back_main')]
      ])
    });
  }
  
  ctx.session = { ...session, expecting: null };
  return;
}

// 6. Git Push mit Details
bot.action('git_push', async (ctx) => {
  await ctx.editMessageText('📊 Analysiere Git Status...');
  
  try {
    const status = await require('child_process').execSync(
      'cd /Users/az/Documents/A+/AVX/Spaces/S2/avx-copilot-o1 && git status --porcelain',
      { encoding: 'utf8' }
    );
    
    const diff = await require('child_process').execSync(
      'cd /Users/az/Documents/A+/AVX/Spaces/S2/avx-copilot-o1 && git diff --stat',
      { encoding: 'utf8' }
    );
    
    const lines = status.split('\n').filter(Boolean);
    const modified = lines.filter(l => l.startsWith(' M')).map(l => l.substring(3));
    const added = lines.filter(l => l.startsWith('??')).map(l => l.substring(3));
    
    let message = '📊 **Git Status:**\n\n';
    
    if (modified.length > 0) {
      message += '**📝 Geänderte Dateien:**\n';
      modified.forEach(f => message += `• ${f}\n`);
      message += '\n';
    }
    
    if (added.length > 0) {
      message += '**➕ Neue Dateien:**\n';
      added.forEach(f => message += `• ${f}\n`);
      message += '\n';
    }
    
    if (diff) {
      message += '**📈 Statistik:**\n```\n' + diff + '```\n\n';
    }
    
    message += 'Commit Message eingeben oder "auto" für automatische Message:';
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🚀 Auto-Commit', 'git_auto_commit')],
        [Markup.button.callback('✏️ Custom Message', 'git_custom_commit')],
        [Markup.button.callback('❌ Abbrechen', 'dev_tools')]
      ])
    });
    
  } catch (error) {
    await ctx.editMessageText(
      `❌ Git Status Fehler:\n${error.message}`,
      Markup.inlineKeyboard([[Markup.button.callback('🔧 Zurück', 'dev_tools')]])
    );
  }
});

// 7. Dev Mode Toggle mit visueller Anzeige
bot.action('toggle_dev_mode', async (ctx) => {
  const currentMode = modeManager.getCurrentMode();
  const newMode = currentMode === 'dev' ? 'user' : 'dev';
  modeManager.setMode(newMode);
  
  const icon = newMode === 'dev' ? '🟢' : '🔴';
  
  await ctx.answerCbQuery(`Dev Mode: ${icon} ${newMode.toUpperCase()}`);
  
  // Update the menu to show new state
  const devToolsMenuWithState = Markup.inlineKeyboard([
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
      Markup.button.callback(`🔧 Mode: ${icon} ${newMode.toUpperCase()}`, 'toggle_dev_mode'),
      Markup.button.callback(`⚡ Model: ${modelSwitcher.getCurrentModel()}`, 'toggle_model')
    ],
    [
      Markup.button.callback('✏️ Instruction Editor', 'instruction_editor')
    ],
    [Markup.button.callback('🔙 Zurück', 'back_main')]
  ]);
  
  await ctx.editMessageText(
    `🔧 **Developer Tools** ${icon}\n\n` +
    `Dev Mode: ${newMode.toUpperCase()}\n` +
    'Deine Entwickler-Werkzeuge:',
    devToolsMenuWithState
  );
});
