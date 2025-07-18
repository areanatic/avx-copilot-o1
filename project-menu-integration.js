// project-menu-integration.js - Integration ins Hauptmenü

const { Markup } = require('telegraf');
const { projectStructure, ProjectManagerV2 } = require('./project-structure-v2');

// Erweiterte Main Menu Struktur
const getMainMenuV2 = (userId) => {
  const isArash = userId === YOUR_USER_ID; // Deine Telegram ID
  
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🏢 DHL/Work', 'category_work'),
      Markup.button.callback('💰 Finance', 'category_finance')
    ],
    [
      Markup.button.callback('🧠 Personal', 'category_personal'),
      Markup.button.callback('🚀 Innovation', 'category_innovation')
    ],
    [
      Markup.button.callback('💡 Quick Note', 'smart_note'), // Erweitert!
      Markup.button.callback('📊 Dashboard', 'dashboard')
    ],
    [
      Markup.button.callback('🔧 Dev Tools', 'dev_tools'),
      Markup.button.callback('🏠 Umzug', 'umzug') // Bleibt als Quick Access
    ]
  ]);
};

// Kategorie-Menü
const getCategoryMenu = (categoryId) => {
  const category = projectStructure.categories[categoryId];
  const buttons = [];
  
  // Header
  buttons.push([
    Markup.button.callback(`${category.icon} ${category.name}`, 'noop')
  ]);
  
  // Projekte der Kategorie
  category.projects.forEach(projectId => {
    const project = projectStructure.projects[projectId];
    buttons.push([
      Markup.button.callback(
        `${project.icon} ${project.name}`,
        `project_${projectId}`
      )
    ]);
  });
  
  // Navigation
  buttons.push([
    Markup.button.callback('⬅️ Zurück', 'back_main')
  ]);
  
  return Markup.inlineKeyboard(buttons);
};

// Smart Note mit Auto-Kategorisierung
const handleSmartNote = async (ctx) => {
  await ctx.editMessageText(
    '💡 **Smart Note**\n\n' +
    '📝 Schreibe deine Notiz und ich ordne sie automatisch dem richtigen Projekt zu!\n\n' +
    '**Tipp:** Du kannst auch direkt angeben:\n' +
    '• `Projekt: dhl` für DHL-Notizen\n' +
    '• `#tag` für Tags\n' +
    '• `@person` für Personen-Bezug\n\n' +
    '_Voice Messages werden auch unterstützt!_',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('📂 Projekt wählen', 'note_select_project'),
          Markup.button.callback('🔍 Letzte Notizen', 'show_categorized_notes')
        ],
        [Markup.button.callback('⬅️ Zurück', 'back_main')]
      ])
    }
  );
  ctx.session = { ...ctx.session, expecting: 'smart_note' };
};

// Handler für Smart Notes im Text-Handler
const handleSmartNoteText = async (ctx, userMessage, userId) => {
  const projectManager = new ProjectManagerV2();
  const userNotesManager = require('./user-notes-manager');
  
  // Auto-Kategorisierung
  const categorization = projectManager.categorizeNote(userMessage);
  
  // Speichere mit Projekt-Zuordnung
  const metadata = {
    projects: categorization.projects,
    tags: categorization.tags,
    confidence: categorization.confidence,
    autoCategorized: true
  };
  
  const savedNote = await userNotesManager.saveNote(userId, userMessage, metadata);
  
  // Response mit Kategorisierung
  let response = `✅ **Notiz gespeichert!**\n\n`;
  response += `📝 "${userMessage}"\n\n`;
  
  if (categorization.projects.length > 0) {
    response += `📂 **Auto-zugeordnet zu:**\n`;
    categorization.projects.forEach(projectId => {
      const project = projectStructure.projects[projectId];
      response += `• ${project.icon} ${project.name}\n`;
    });
    response += '\n';
  }
  
  if (categorization.tags.length > 0) {
    response += `🏷️ **Tags:** ${categorization.tags.map(t => `#${t}`).join(' ')}\n\n`;
  }
  
  response += `🎯 **Konfidenz:** ${Math.round(categorization.confidence * 100)}%\n`;
  response += `_Gespeichert am ${new Date(savedNote.timestamp).toLocaleString('de-DE')}_`;
  
  await ctx.reply(response, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('✏️ Projekt ändern', `note_change_project_${savedNote.id}`),
        Markup.button.callback('🏷️ Tags bearbeiten', `note_edit_tags_${savedNote.id}`)
      ],
      [
        Markup.button.callback('💡 Weitere Notiz', 'smart_note'),
        Markup.button.callback('📱 Hauptmenü', 'back_main')
      ]
    ])
  });
};

// Projekt-Dashboard
const getProjectDashboard = async (projectId, userId) => {
  const project = projectStructure.projects[projectId];
  const projectManager = new ProjectManagerV2();
  const userNotesManager = require('./user-notes-manager');
  
  // Lade projekt-spezifische Daten
  const notes = await userNotesManager.getAllNotes(userId);
  const projectNotes = notes.filter(n => 
    n.metadata?.projects?.includes(projectId) && !n.archived
  );
  
  let dashboard = `${project.icon} **${project.name}**\n\n`;
  
  // Security Level
  const category = projectStructure.categories[project.category];
  const security = projectStructure.securityLevels[category.security];
  dashboard += `🔒 Sicherheit: ${security.name}\n`;
  
  // Stats
  dashboard += `\n📊 **Statistiken:**\n`;
  dashboard += `• ${projectNotes.length} Notizen\n`;
  dashboard += `• ${project.features?.length || 0} Features\n`;
  
  if (project.status) {
    dashboard += `• Status: ${project.status}\n`;
  }
  
  // Recent Activity
  if (projectNotes.length > 0) {
    dashboard += `\n📝 **Letzte Aktivität:**\n`;
    projectNotes.slice(-3).reverse().forEach(note => {
      const preview = note.text.substring(0, 50) + (note.text.length > 50 ? '...' : '');
      dashboard += `• ${preview}\n`;
    });
  }
  
  return {
    text: dashboard,
    buttons: projectManager.getProjectButtons(projectId)
  };
};

// Integration in Bot-Handler
const projectHandlers = {
  // Kategorie-Handler
  'category_work': async (ctx) => {
    ctx.answerCbQuery();
    ctx.editMessageText(
      '🏢 **DHL/Work Projekte**\n\n' +
      'Wähle ein Projekt:',
      {
        parse_mode: 'Markdown',
        ...getCategoryMenu('work')
      }
    );
  },
  
  'category_finance': async (ctx) => {
    ctx.answerCbQuery();
    // Security Check für Finance
    const userId = ctx.from.id;
    if (userId !== YOUR_USER_ID) {
      ctx.answerCbQuery('🔒 Zugriff verweigert', true);
      return;
    }
    
    ctx.editMessageText(
      '💰 **Finance Projekte**\n\n' +
      '🔐 Dev Secure Mode aktiv',
      {
        parse_mode: 'Markdown',
        ...getCategoryMenu('finance')
      }
    );
  },
  
  'category_personal': async (ctx) => {
    ctx.answerCbQuery();
    // Highest Security
    const userId = ctx.from.id;
    if (userId !== YOUR_USER_ID) {
      ctx.answerCbQuery('🔒 Zugriff verweigert', true);
      return;
    }
    
    ctx.editMessageText(
      '🧠 **Persönliche Projekte**\n\n' +
      '🔐 Höchste Sicherheitsstufe',
      {
        parse_mode: 'Markdown',
        ...getCategoryMenu('personal')
      }
    );
  },
  
  'smart_note': handleSmartNote,
  
  // Dynamische Projekt-Handler
  handleProjectAction: async (ctx, action) => {
    const match = action.match(/^project_(.+)$/);
    if (match) {
      const projectId = match[1];
      const dashboard = await getProjectDashboard(projectId, ctx.from.id);
      
      ctx.answerCbQuery();
      ctx.editMessageText(dashboard.text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(dashboard.buttons)
      });
    }
  }
};

module.exports = {
  getMainMenuV2,
  projectHandlers,
  handleSmartNoteText
};
