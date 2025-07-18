// Quick Notes Integration Fix - Ready to merge into enhanced-bot-buttons.js

// ==============================================================
// 1. REPLACE THE QUICK NOTE HANDLER IN TEXT HANDLER (around line 1256)
// ==============================================================
// FIND THIS:
/*
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
*/

// REPLACE WITH:
  if (session.expecting === 'quick_note') {
    await ctx.sendChatAction('typing');
    
    // Feature Check
    const featureTracker = require('./feature-tracker');
    if (!featureTracker.checkFeatureBeforeUse('quick_notes', ctx)) {
      ctx.session = { ...session, expecting: null };
      return;
    }
    
    // WIRKLICH speichern mit user-notes-manager!
    const userNotesManager = require('./user-notes-manager');
    try {
      const savedNote = await userNotesManager.saveNote(userId, userMessage);
      const stats = await userNotesManager.getStats(userId);
      
      ctx.reply(
        `✅ *Notiz gespeichert!*\n\n` +
        `📝 "${userMessage}"\n\n` +
        `📊 *Statistik:*\n` +
        `• Notiz #${stats.total}\n` +
        `• ${stats.totalWords} Wörter gesamt\n` +
        `• ${stats.active} aktive Notizen\n\n` +
        `_Gespeichert am ${new Date(savedNote.timestamp).toLocaleString('de-DE')}_`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback('💡 Weitere Notiz', 'quick_note'),
              Markup.button.callback('🔍 Suchen', 'search_notes')
            ],
            [Markup.button.callback('📱 Hauptmenü', 'back_main')]
          ])
        }
      );
    } catch (error) {
      console.error('Error saving note:', error);
      ctx.reply(
        `❌ *Fehler beim Speichern!*\n\n` +
        `${error.message}\n\n` +
        `_Bitte versuche es erneut._`,
        {
          parse_mode: 'Markdown',
          ...mainMenu
        }
      );
    }
    
    ctx.session = { ...session, expecting: null };
    return;
  }

// ==============================================================
// 2. ADD AFTER KB SEARCH HANDLER (after line ~1335)
// ==============================================================
  // Notes Search Handler
  if (session.expecting === 'search_notes') {
    await ctx.sendChatAction('typing');
    const userNotesManager = require('./user-notes-manager');
    
    try {
      const results = await userNotesManager.searchNotes(userId, userMessage);
      
      if (results.length === 0) {
        ctx.reply(
          `🔍 **Keine Treffer für "${userMessage}"**\n\n` +
          'Versuche einen anderen Suchbegriff.',
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('🔍 Neue Suche', 'search_notes')],
              [Markup.button.callback('📱 Hauptmenü', 'back_main')]
            ])
          }
        );
      } else {
        let message = `🔍 **${results.length} Treffer für "${userMessage}":**\n\n`;
        results.slice(0, 10).forEach((note, index) => {
          const date = new Date(note.timestamp).toLocaleString('de-DE');
          message += `**${index + 1}.** ${note.text}\n_${date}_\n\n`;
        });
        
        if (results.length > 10) {
          message += `_... und ${results.length - 10} weitere Treffer_\n\n`;
        }
        
        ctx.reply(message, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔍 Neue Suche', 'search_notes')],
            [Markup.button.callback('📱 Hauptmenü', 'back_main')]
          ])
        });
      }
    } catch (error) {
      console.error('Error searching notes:', error);
      ctx.reply('❌ Fehler bei der Suche.');
    }
    
    ctx.session = { ...session, expecting: null };
    return;
  }

// ==============================================================
// 3. ADD BEFORE "// Graceful stop" (around line 1600)
// ==============================================================
// Search Notes Handler
bot.action('search_notes', async (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '🔍 **Notizen durchsuchen**\n\n' +
    'Schicke mir einen Suchbegriff:',
    { parse_mode: 'Markdown' }
  );
  ctx.session = { ...ctx.session, expecting: 'search_notes' };
});

// Show All Notes Handler
bot.action('show_all_notes', async (ctx) => {
  ctx.answerCbQuery();
  const userId = ctx.from.id;
  const userNotesManager = require('./user-notes-manager');
  
  try {
    const notes = await userNotesManager.getAllNotes(userId);
    const activeNotes = notes.filter(n => !n.archived);
    
    if (activeNotes.length === 0) {
      ctx.editMessageText(
        '📝 **Keine Notizen vorhanden**\n\n' +
        'Du hast noch keine Notizen gespeichert.',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('💡 Erste Notiz erstellen', 'quick_note')],
            [Markup.button.callback('⬅️ Zurück', 'back_main')]
          ])
        }
      );
      return;
    }
    
    let message = `📝 **Alle deine Notizen (${activeNotes.length}):**\n\n`;
    activeNotes.slice(-10).reverse().forEach((note, index) => {
      const date = new Date(note.timestamp).toLocaleString('de-DE');
      message += `**${index + 1}.** ${note.text}\n_${date}_\n\n`;
    });
    
    if (activeNotes.length > 10) {
      message += `_... und ${activeNotes.length - 10} weitere Notizen_\n\n`;
    }
    
    ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('💡 Neue Notiz', 'quick_note')],
        [Markup.button.callback('🔍 Suchen', 'search_notes')],
        [Markup.button.callback('⬅️ Zurück', 'back_main')]
      ])
    });
  } catch (error) {
    console.error('Error loading notes:', error);
    ctx.reply('❌ Fehler beim Laden der Notizen.');
  }
});

// ==============================================================
// 4. UPDATE THE QUICK NOTE BUTTON HANDLER (around line 416)
// ==============================================================
// FIND THIS:
/*
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
*/

// REPLACE WITH:
bot.action('quick_note', async (ctx) => {
  ctx.answerCbQuery();
  const userId = ctx.from.id;
  const userNotesManager = require('./user-notes-manager');
  
  try {
    // Show recent notes
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
    
    await ctx.editMessageText(messageText, { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔍 Notizen suchen', 'search_notes')],
        [Markup.button.callback('📋 Alle Notizen', 'show_all_notes')],
        [Markup.button.callback('⬅️ Zurück', 'back_main')]
      ])
    });
    ctx.session = { ...ctx.session, expecting: 'quick_note' };
  } catch (error) {
    console.error('Error in quick_note handler:', error);
    ctx.editMessageText(
      '💡 **Quick Note**\n\n' +
      'Schreib mir deine Idee, Notiz oder Gedanken.\n' +
      'Ich speichere sie in deiner Knowledge Base.\n\n' +
      '_Tipp: Voice Messages werden auch unterstützt!_',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔍 Notizen suchen', 'search_notes')],
          [Markup.button.callback('⬅️ Zurück', 'back_main')]
        ])
      }
    );
    ctx.session = { ...ctx.session, expecting: 'quick_note' };
  }
});

// ==============================================================
// 5. FEATURE STATUS UPDATE IN feature-tracker.js
// ==============================================================
// Update quick_notes from 10 to 100:
/*
quick_notes: {
  status: 100,  // Changed from 10
  description: 'Quick Notes mit File Storage',
  missing: [],  // Changed from ['Storage Backend', 'Search Function']
  effort: '0h',  // Changed from '2h'
  priority: 'HIGH'
},
*/

// ==============================================================
// DEPLOYMENT STEPS:
// ==============================================================
// 1. Manually apply these changes to enhanced-bot-buttons.js
// 2. Update feature-tracker.js (quick_notes: 100%)
// 3. Test locally: node enhanced-bot-buttons.js
// 4. Git commit: git add . && git commit -m "Fix: Quick Notes fully implemented (10% → 100%)"
// 5. Git push: git push origin main
// 6. Railway will auto-deploy
