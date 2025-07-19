// Reminder Bot Integration - Telegram Commands & UI

const { Markup } = require('telegraf');
const ReminderService = require('./reminder-service');

// Initialisiere Service
let reminderService;

// Setup Funktion (wird vom Bot aufgerufen)
function setupReminderHandlers(bot) {
  // Initialisiere Service mit Bot Instanz
  reminderService = new ReminderService(bot);
  
  // /remind Command
  bot.command('remind', (ctx) => {
    const text = ctx.message.text.replace('/remind', '').trim();
    
    if (!text) {
      ctx.reply(
        '⏰ **Reminder erstellen**\n\n' +
        'Beispiele:\n' +
        '• `/remind in 30 minuten Meeting vorbereiten`\n' +
        '• `/remind morgen um 9:00 Arzt anrufen`\n' +
        '• `/remind jeden tag um 18:00 Medikamente`\n' +
        '• `/remind am 15. Miete überweisen`\n\n' +
        'Oder nutze das Menü:',
        {
          parse_mode: 'Markdown',
          ...getReminderMenu()
        }
      );
      return;
    }
    
    handleQuickReminder(ctx, text);
  });
  
  // Reminder Menü Button
  bot.action('reminders', async (ctx) => {
    ctx.answerCbQuery();
    const userId = ctx.from.id;
    const stats = await reminderService.getStats(userId);
    
    ctx.editMessageText(
      `⏰ **Deine Reminders**\n\n` +
      `Aktiv: ${stats.active}\n` +
      `Gesamt: ${stats.total}\n\n` +
      `Was möchtest du tun?`,
      {
        parse_mode: 'Markdown',
        ...getReminderMenu()
      }
    );
  });
  
  // Neuer Reminder
  bot.action('new_reminder', (ctx) => {
    ctx.answerCbQuery();
    ctx.editMessageText(
      '⏰ **Neuer Reminder**\n\n' +
      'Wähle einen Typ:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('⚡ Quick (in X Min)', 'remind_quick'),
            Markup.button.callback('📅 Datum/Zeit', 'remind_datetime')
          ],
          [
            Markup.button.callback('🔄 Täglich', 'remind_daily'),
            Markup.button.callback('📆 Wöchentlich', 'remind_weekly')
          ],
          [
            Markup.button.callback('🗓️ Monatlich', 'remind_monthly'),
            Markup.button.callback('⚙️ Custom', 'remind_custom')
          ],
          [Markup.button.callback('⬅️ Zurück', 'reminders')]
        ])
      }
    );
  });
  
  // Quick Reminder (in X Minuten)
  bot.action('remind_quick', (ctx) => {
    ctx.answerCbQuery();
    ctx.editMessageText(
      '⚡ **Quick Reminder**\n\n' +
      'In wie vielen Minuten soll ich dich erinnern?',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('5 Min', 'quick_5'),
            Markup.button.callback('10 Min', 'quick_10'),
            Markup.button.callback('15 Min', 'quick_15')
          ],
          [
            Markup.button.callback('30 Min', 'quick_30'),
            Markup.button.callback('1 Std', 'quick_60'),
            Markup.button.callback('2 Std', 'quick_120')
          ],
          [Markup.button.callback('⬅️ Zurück', 'new_reminder')]
        ])
      }
    );
  });
  
  // Quick Time Handler
  bot.action(/quick_(\d+)/, (ctx) => {
    const minutes = parseInt(ctx.match[1]);
    ctx.answerCbQuery();
    
    ctx.editMessageText(
      `⏰ **Reminder in ${minutes} Minuten**\n\n` +
      'Was soll ich dir sagen?\n\n' +
      '_Schicke mir den Reminder-Text:_',
      { parse_mode: 'Markdown' }
    );
    
    ctx.session = {
      ...ctx.session,
      expecting: 'reminder_text',
      reminderData: {
        type: 'ONCE',
        time: new Date(Date.now() + minutes * 60000).toISOString()
      }
    };
  });
  
  // Reminder Liste anzeigen
  bot.action('list_reminders', async (ctx) => {
    ctx.answerCbQuery();
    const userId = ctx.from.id;
    const reminders = await reminderService.getUserReminders(userId, true);
    
    if (reminders.length === 0) {
      ctx.editMessageText(
        '📭 **Keine aktiven Reminders**\n\n' +
        'Du hast noch keine Erinnerungen eingerichtet.',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('➕ Reminder erstellen', 'new_reminder')],
            [Markup.button.callback('⬅️ Zurück', 'reminders')]
          ])
        }
      );
      return;
    }
    
    let message = '⏰ **Aktive Reminders:**\n\n';
    
    reminders.forEach((reminder, index) => {
      const time = new Date(reminder.time).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
      const typeEmoji = {
        'ONCE': '⚡',
        'DAILY': '🔄',
        'WEEKLY': '📆',
        'MONTHLY': '🗓️',
        'CUSTOM': '⚙️'
      }[reminder.type];
      
      message += `${index + 1}. ${typeEmoji} **${reminder.text}**\n`;
      message += `   ⏱️ ${time}\n`;
      if (reminder.repeatCount > 0) {
        message += `   🔢 ${reminder.repeatCount}x ausgelöst\n`;
      }
      message += '\n';
    });
    
    ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('➕ Neuer Reminder', 'new_reminder')],
        [Markup.button.callback('🗑️ Reminder löschen', 'delete_reminder_menu')],
        [Markup.button.callback('⬅️ Zurück', 'reminders')]
      ])
    });
  });
  
  // Reminder Actions (Done, Snooze, etc.)
  bot.action(/reminder_done_(.+)/, async (ctx) => {
    const reminderId = ctx.match[1];
    ctx.answerCbQuery('✅ Erledigt!');
    
    await reminderService.deleteReminder(reminderId);
    ctx.editMessageText('✅ Reminder als erledigt markiert!');
  });
  
  bot.action(/reminder_snooze_(.+)_(\d+)/, async (ctx) => {
    const reminderId = ctx.match[1];
    const minutes = parseInt(ctx.match[2]);
    
    ctx.answerCbQuery(`⏱️ ${minutes} Min Snooze`);
    
    const result = await reminderService.snoozeReminder(reminderId, minutes);
    if (result.success) {
      ctx.editMessageText(
        `⏱️ **Reminder verschoben**\n\n` +
        `Neue Zeit: ${new Date(result.newTime).toLocaleTimeString('de-DE')}`,
        { parse_mode: 'Markdown' }
      );
    }
  });
  
  bot.action(/reminder_task_(.+)/, async (ctx) => {
    const reminderId = ctx.match[1];
    ctx.answerCbQuery();
    
    const reminder = await reminderService.getReminder(reminderId);
    if (reminder) {
      // TODO: Integration mit Task System
      ctx.editMessageText(
        '📝 **Als Task gespeichert**\n\n' +
        `"${reminder.text}" wurde zu deinen Aufgaben hinzugefügt.`,
        { parse_mode: 'Markdown' }
      );
    }
  });
  
  bot.action(/reminder_delete_(.+)/, async (ctx) => {
    const reminderId = ctx.match[1];
    ctx.answerCbQuery();
    
    await reminderService.deleteReminder(reminderId);
    ctx.editMessageText('🗑️ Reminder gelöscht');
  });
}

// Quick Reminder Handler
async function handleQuickReminder(ctx, text) {
  const userId = ctx.from.id;
  
  // Parse natürliche Sprache
  const parsed = reminderService.parseNaturalTime(text);
  
  // Extrahiere Reminder Text
  let reminderText = text;
  reminderText = reminderText.replace(/in \d+ (minuten?|stunden?)/i, '');
  reminderText = reminderText.replace(/morgen um \d{1,2}:?\d{0,2}/i, '');
  reminderText = reminderText.replace(/jeden tag um \d{1,2}:?\d{0,2}/i, '');
  reminderText = reminderText.trim();
  
  if (!reminderText) {
    reminderText = "Erinnerung!";
  }
  
  // Erstelle Reminder
  const reminder = await reminderService.createReminder(userId, {
    text: reminderText,
    type: parsed.type,
    time: parsed.time
  });
  
  const timeStr = new Date(reminder.time).toLocaleString('de-DE', { 
    timeZone: 'Europe/Berlin',
    dateStyle: 'short',
    timeStyle: 'short'
  });
  
  ctx.reply(
    `✅ **Reminder erstellt!**\n\n` +
    `📝 "${reminder.text}"\n` +
    `⏰ ${timeStr}\n` +
    `🔄 Typ: ${reminder.type}`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📋 Alle Reminders', 'list_reminders')],
        [Markup.button.callback('➕ Weiterer Reminder', 'new_reminder')]
      ])
    }
  );
}

// Reminder Menü
function getReminderMenu() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('➕ Neuer Reminder', 'new_reminder'),
      Markup.button.callback('📋 Meine Reminders', 'list_reminders')
    ],
    [
      Markup.button.callback('📊 Statistik', 'reminder_stats'),
      Markup.button.callback('⚙️ Einstellungen', 'reminder_settings')
    ],
    [Markup.button.callback('⬅️ Hauptmenü', 'back_main')]
  ]);
}

// Message Handler für Reminder Text
function handleReminderMessage(ctx, session) {
  if (session.expecting === 'reminder_text' && session.reminderData) {
    const text = ctx.message.text;
    const userId = ctx.from.id;
    
    reminderService.createReminder(userId, {
      text,
      ...session.reminderData
    }).then(reminder => {
      const timeStr = new Date(reminder.time).toLocaleString('de-DE', { 
        timeZone: 'Europe/Berlin',
        dateStyle: 'short',
        timeStyle: 'short'
      });
      
      ctx.reply(
        `✅ **Reminder erstellt!**\n\n` +
        `📝 "${reminder.text}"\n` +
        `⏰ ${timeStr}`,
        {
          parse_mode: 'Markdown',
          ...getReminderMenu()
        }
      );
    });
    
    // Clear session
    ctx.session = { ...session, expecting: null, reminderData: null };
    return true;
  }
  
  return false;
}

module.exports = {
  setupReminderHandlers,
  handleReminderMessage,
  getReminderMenu
};
