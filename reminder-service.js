// Reminder Service - Zeitbasierte Erinnerungen für AVX Copilot
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const { Telegraf } = require('telegraf');

class ReminderService {
  constructor(bot) {
    this.bot = bot;
    this.dataDir = path.join(__dirname, 'data', 'reminders');
    this.reminders = new Map(); // userId -> reminders[]
    this.scheduledJobs = new Map(); // reminderId -> cronJob
    this.init();
  }

  async init() {
    // Erstelle Reminder Directory
    await fs.mkdir(this.dataDir, { recursive: true });
    
    // Lade alle existierenden Reminders
    await this.loadAllReminders();
    
    // Starte Scheduler
    this.startScheduler();
    
    console.log('⏰ Reminder Service gestartet');
  }

  // Neuen Reminder erstellen
  async createReminder(userId, data) {
    const reminder = {
      id: Date.now().toString(),
      userId,
      text: data.text,
      type: data.type || 'ONCE',
      time: data.time, // ISO String oder Cron Pattern
      projectId: data.projectId || null,
      taskId: data.taskId || null,
      created: new Date().toISOString(),
      active: true,
      lastTriggered: null,
      repeatCount: 0
    };

    // Speichere Reminder
    const userReminders = await this.getUserReminders(userId);
    userReminders.push(reminder);
    await this.saveUserReminders(userId, userReminders);

    // Schedule den Reminder
    this.scheduleReminder(reminder);

    return reminder;
  }

  // Reminder planen
  scheduleReminder(reminder) {
    if (!reminder.active) return;

    let cronPattern;
    
    switch (reminder.type) {
      case 'ONCE':
        // Einmalig - berechne Cron aus Datum
        const date = new Date(reminder.time);
        cronPattern = `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
        break;
        
      case 'DAILY':
        // Täglich zur gleichen Zeit
        const dailyTime = new Date(reminder.time);
        cronPattern = `${dailyTime.getMinutes()} ${dailyTime.getHours()} * * *`;
        break;
        
      case 'WEEKLY':
        // Wöchentlich
        const weeklyTime = new Date(reminder.time);
        cronPattern = `${weeklyTime.getMinutes()} ${weeklyTime.getHours()} * * ${weeklyTime.getDay()}`;
        break;
        
      case 'MONTHLY':
        // Monatlich
        const monthlyTime = new Date(reminder.time);
        cronPattern = `${monthlyTime.getMinutes()} ${monthlyTime.getHours()} ${monthlyTime.getDate()} * *`;
        break;
        
      case 'CUSTOM':
        // Custom Cron Pattern
        cronPattern = reminder.time;
        break;
    }

    // Schedule mit node-cron
    const job = cron.schedule(cronPattern, async () => {
      await this.triggerReminder(reminder);
    }, {
      scheduled: true,
      timezone: "Europe/Berlin"
    });

    this.scheduledJobs.set(reminder.id, job);
    console.log(`⏰ Reminder ${reminder.id} scheduled: ${cronPattern}`);
  }

  // Reminder auslösen
  async triggerReminder(reminder) {
    try {
      // Formatiere Nachricht
      let message = `⏰ **ERINNERUNG**\n\n${reminder.text}`;
      
      if (reminder.projectId) {
        message += `\n\n📁 Projekt: ${reminder.projectId}`;
      }
      
      // Quick Actions
      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Erledigt', callback_data: `reminder_done_${reminder.id}` },
            { text: '⏱️ Snooze 10min', callback_data: `reminder_snooze_${reminder.id}_10` }
          ],
          [
            { text: '📝 Als Task', callback_data: `reminder_task_${reminder.id}` },
            { text: '🗑️ Löschen', callback_data: `reminder_delete_${reminder.id}` }
          ]
        ]
      };

      // Sende Nachricht
      await this.bot.telegram.sendMessage(reminder.userId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

      // Update Reminder
      reminder.lastTriggered = new Date().toISOString();
      reminder.repeatCount++;

      // Bei einmaligen Reminders deaktivieren
      if (reminder.type === 'ONCE') {
        reminder.active = false;
        this.scheduledJobs.get(reminder.id)?.stop();
        this.scheduledJobs.delete(reminder.id);
      }

      // Speichern
      await this.updateReminder(reminder);
      
      console.log(`✅ Reminder ${reminder.id} triggered for user ${reminder.userId}`);
      
    } catch (error) {
      console.error(`❌ Error triggering reminder ${reminder.id}:`, error);
    }
  }

  // Reminder snoozen
  async snoozeReminder(reminderId, minutes) {
    const reminder = await this.getReminder(reminderId);
    if (!reminder) return { error: 'Reminder nicht gefunden' };

    // Stoppe aktuellen Job
    this.scheduledJobs.get(reminderId)?.stop();

    // Neuer Zeitpunkt
    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000);
    
    // Erstelle temporären Snooze Reminder
    const snoozeReminder = {
      ...reminder,
      id: `${reminder.id}_snooze_${Date.now()}`,
      type: 'ONCE',
      time: snoozeTime.toISOString(),
      text: `[SNOOZE] ${reminder.text}`
    };

    await this.createReminder(reminder.userId, snoozeReminder);
    
    return { success: true, newTime: snoozeTime };
  }

  // Parser für natürliche Sprache
  parseNaturalTime(text) {
    const now = new Date();
    const patterns = {
      // "in X Minuten/Stunden"
      inMinutes: /in (\d+) minuten?/i,
      inHours: /in (\d+) stunden?/i,
      
      // "morgen um X"
      tomorrow: /morgen um (\d{1,2}):?(\d{2})?/i,
      
      // "jeden Tag um X"
      daily: /jeden tag um (\d{1,2}):?(\d{2})?/i,
      
      // "jeden Montag"
      weekly: /jeden (montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)/i,
      
      // "am 15."
      monthly: /am (\d{1,2})\./i
    };

    // In X Minuten
    let match = text.match(patterns.inMinutes);
    if (match) {
      const minutes = parseInt(match[1]);
      return {
        type: 'ONCE',
        time: new Date(now.getTime() + minutes * 60000).toISOString()
      };
    }

    // In X Stunden
    match = text.match(patterns.inHours);
    if (match) {
      const hours = parseInt(match[1]);
      return {
        type: 'ONCE',
        time: new Date(now.getTime() + hours * 3600000).toISOString()
      };
    }

    // Morgen um X
    match = text.match(patterns.tomorrow);
    if (match) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(parseInt(match[1]));
      tomorrow.setMinutes(parseInt(match[2] || 0));
      return {
        type: 'ONCE',
        time: tomorrow.toISOString()
      };
    }

    // Jeden Tag um X
    match = text.match(patterns.daily);
    if (match) {
      const dailyTime = new Date(now);
      dailyTime.setHours(parseInt(match[1]));
      dailyTime.setMinutes(parseInt(match[2] || 0));
      return {
        type: 'DAILY',
        time: dailyTime.toISOString()
      };
    }

    // Standard: In 1 Stunde
    return {
      type: 'ONCE',
      time: new Date(now.getTime() + 3600000).toISOString()
    };
  }

  // Hilfsmethoden
  async getUserReminders(userId, activeOnly = false) {
    try {
      const filePath = path.join(this.dataDir, `${userId}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      const reminders = JSON.parse(data);
      
      if (activeOnly) {
        return reminders.filter(r => r.active);
      }
      
      return reminders;
    } catch (error) {
      return [];
    }
  }

  async saveUserReminders(userId, reminders) {
    const filePath = path.join(this.dataDir, `${userId}.json`);
    await fs.writeFile(filePath, JSON.stringify(reminders, null, 2));
  }

  async getReminder(reminderId) {
    // Durchsuche alle User-Dateien
    const files = await fs.readdir(this.dataDir);
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const reminders = JSON.parse(await fs.readFile(path.join(this.dataDir, file), 'utf8'));
      const reminder = reminders.find(r => r.id === reminderId);
      
      if (reminder) return reminder;
    }
    
    return null;
  }

  async updateReminder(reminder) {
    const userReminders = await this.getUserReminders(reminder.userId);
    const index = userReminders.findIndex(r => r.id === reminder.id);
    
    if (index !== -1) {
      userReminders[index] = reminder;
      await this.saveUserReminders(reminder.userId, userReminders);
    }
  }

  async deleteReminder(reminderId) {
    const reminder = await this.getReminder(reminderId);
    if (!reminder) return { error: 'Reminder nicht gefunden' };

    // Stoppe Cron Job
    this.scheduledJobs.get(reminderId)?.stop();
    this.scheduledJobs.delete(reminderId);

    // Lösche aus Datei
    const userReminders = await this.getUserReminders(reminder.userId);
    const filtered = userReminders.filter(r => r.id !== reminderId);
    await this.saveUserReminders(reminder.userId, filtered);

    return { success: true };
  }

  // Lade alle Reminders beim Start
  async loadAllReminders() {
    try {
      const files = await fs.readdir(this.dataDir);
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const userId = file.replace('.json', '');
        const reminders = await this.getUserReminders(userId);
        
        // Schedule aktive Reminders
        for (const reminder of reminders) {
          if (reminder.active) {
            this.scheduleReminder(reminder);
          }
        }
        
        this.reminders.set(userId, reminders);
      }
      
      console.log(`📋 ${this.reminders.size} User mit Reminders geladen`);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  }

  // Haupt-Scheduler (prüft alle Minute)
  startScheduler() {
    // Cleanup alter einmaliger Reminders
    cron.schedule('0 0 * * *', async () => {
      console.log('🧹 Cleaning up old reminders...');
      
      for (const [userId, reminders] of this.reminders) {
        const filtered = reminders.filter(r => {
          if (r.type === 'ONCE' && !r.active) {
            const age = Date.now() - new Date(r.lastTriggered || r.created).getTime();
            return age < 7 * 24 * 60 * 60 * 1000; // 7 Tage
          }
          return true;
        });
        
        if (filtered.length < reminders.length) {
          await this.saveUserReminders(userId, filtered);
          this.reminders.set(userId, filtered);
        }
      }
    });
  }

  // Stats
  async getStats(userId = null) {
    if (userId) {
      const reminders = await this.getUserReminders(userId);
      return {
        total: reminders.length,
        active: reminders.filter(r => r.active).length,
        completed: reminders.filter(r => !r.active && r.type === 'ONCE').length
      };
    }
    
    // Global stats
    let total = 0, active = 0;
    for (const reminders of this.reminders.values()) {
      total += reminders.length;
      active += reminders.filter(r => r.active).length;
    }
    
    return { total, active, users: this.reminders.size };
  }
}

module.exports = ReminderService;
