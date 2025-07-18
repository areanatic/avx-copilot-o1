// project-structure-v2.js - Multi-Project Architecture für AVX Copilot

const projectStructure = {
  // Projekt-Kategorien mit Sicherheitsstufen
  categories: {
    work: {
      name: 'DHL/Arbeit',
      security: 'secure',
      icon: '🏢',
      projects: ['dhl_main', 'poststation', 'ppi', 'its_mobile', 'its_gilde']
    },
    finance: {
      name: 'Privat-Finance',
      security: 'dev_secure',
      icon: '💰',
      projects: ['steuern', 'finanzen', 'kontoverwaltung']
    },
    personal: {
      name: 'Persönlich',
      security: 'highest',
      icon: '🧠',
      projects: ['mindset', 'philosophie', 'therapie', 'ai_knowledge']
    },
    innovation: {
      name: 'Innovation Hub',
      security: 'normal',
      icon: '🚀',
      projects: ['cv_creator', 'white_label', 'idea_collector']
    }
  },

  // Projekt-Definitionen
  projects: {
    // DHL/Work Projekte
    dhl_main: {
      name: 'DHL Hauptprojekt',
      category: 'work',
      agent: 'DHL_Agent',
      features: ['conversations', 'protocols', 'secure_mode'],
      knowledge_base: './agents/dhl/knowledge/',
      icon: '📦'
    },
    poststation: {
      name: 'Projekt Poststation',
      category: 'work',
      agent: 'Poststation_Agent',
      parent: 'dhl_main',
      icon: '📮'
    },
    ppi: {
      name: 'PPI - Infostation Indoor',
      category: 'work',
      agent: 'PPI_Agent',
      description: 'Automat/Kiosk Self-Service',
      parent: 'dhl_main',
      icon: '🖥️'
    },
    its_mobile: {
      name: 'ITS Mobile Solutions',
      category: 'work',
      agent: 'ITS_Mobile_Agent',
      parent: 'dhl_main',
      icon: '📱'
    },
    its_gilde: {
      name: 'ITS Gilde',
      category: 'work',
      agent: 'Gilde_Master_Agent',
      features: ['gilde_app', 'knowledge_base', 'workflow_optimization'],
      role: 'Gilden Master',
      icon: '⚔️'
    },

    // Finance Projekte
    steuern: {
      name: 'Steuern 2024',
      category: 'finance',
      agent: 'Steuer_Agent',
      features: ['briefe', 'rechnungen', 'finanzstatus', 'steuerberater_docs'],
      icon: '📊'
    },
    finanzen: {
      name: 'Finanzübersicht',
      category: 'finance',
      agent: 'Finance_Agent',
      features: ['kontostände', 'budgets', 'analysen'],
      icon: '💳'
    },

    // Personal Projekte
    mindset: {
      name: 'Mindset & Philosophie',
      category: 'personal',
      agent: 'Personal_Coach_Agent',
      features: ['daily_reflections', 'philosophie', 'ziele'],
      icon: '🎯'
    },
    therapie: {
      name: 'Therapie & Gedanken',
      category: 'personal',
      agent: 'Therapy_Support_Agent',
      private: true,
      icon: '🌱'
    },
    ai_knowledge: {
      name: 'AI Wissensbank',
      category: 'personal',
      agent: 'AI_Knowledge_Agent',
      icon: '🤖'
    },

    // Innovation Projekte
    cv_creator: {
      name: 'CV Creator Service',
      category: 'innovation',
      agent: 'CV_Creator_Agent',
      type: 'telegram_service',
      features: ['wizard', 'templates', 'personality_profile'],
      status: 'development',
      icon: '📄'
    },
    white_label: {
      name: 'White Label Bot Framework',
      category: 'innovation',
      agent: 'Framework_Agent',
      features: ['onboarding', 'auto_setup', 'migration'],
      type: 'product',
      icon: '🏷️'
    },
    idea_collector: {
      name: 'Idea Collector',
      category: 'innovation',
      agent: 'Brainstorm_Agent',
      features: ['auto_categorize', 'idea_linking', 'concept_development'],
      description: 'Leere Silos für Ideen & Innovationen',
      icon: '💡'
    }
  },

  // Sicherheitsstufen
  securityLevels: {
    normal: {
      name: 'Normal',
      encryption: false,
      backup: 'daily'
    },
    secure: {
      name: 'Secure (Work)',
      encryption: true,
      backup: 'realtime',
      auth: 'pin'
    },
    dev_secure: {
      name: 'Dev Secure (Finance)',
      encryption: true,
      backup: 'realtime',
      auth: 'biometric',
      audit_log: true
    },
    highest: {
      name: 'Highest (Personal)',
      encryption: 'e2e',
      backup: 'realtime',
      auth: 'multi_factor',
      audit_log: true,
      auto_lock: true
    }
  },

  // Auto-Kategorisierung für Notizen
  autoCategorize: {
    keywords: {
      dhl: ['dhl', 'post', 'paket', 'brief', 'zustellung'],
      poststation: ['poststation', 'ps-'],
      ppi: ['ppi', 'infostation', 'kiosk', 'automat'],
      its_gilde: ['gilde', 'its gilde', 'gilden'],
      steuern: ['steuer', 'finanzamt', 'rechnung', 'beleg'],
      finanzen: ['konto', 'überweisung', 'geld', 'budget'],
      mindset: ['gedanke', 'idee', 'philosophie', 'ziel'],
      cv: ['cv', 'lebenslauf', 'bewerbung']
    },
    rules: [
      {
        pattern: /projekt:\s*(\w+)/i,
        action: 'assign_to_project'
      },
      {
        pattern: /#(\w+)/g,
        action: 'add_tags'
      }
    ]
  },

  // UI Verbesserungen
  ui: {
    preferButtons: true,
    quickActions: {
      note: ['save_to_project', 'add_reminder', 'create_task'],
      project: ['switch', 'view_tasks', 'add_note', 'view_stats']
    },
    navigation: {
      type: 'hierarchical',
      showBreadcrumbs: true,
      quickJump: true
    }
  }
};

// Projekt-Manager Klasse
class ProjectManagerV2 {
  constructor() {
    this.currentProject = null;
    this.projectHistory = [];
    this.activeAgents = new Map();
  }

  // Projekt wechseln mit Context-Preservation
  async switchProject(projectId, userId) {
    const project = projectStructure.projects[projectId];
    if (!project) throw new Error(`Project ${projectId} not found`);

    // Security Check
    const category = projectStructure.categories[project.category];
    const securityLevel = projectStructure.securityLevels[category.security];
    
    if (securityLevel.auth) {
      // TODO: Implement auth check
    }

    // Save current context
    if (this.currentProject) {
      await this.saveProjectContext(this.currentProject);
    }

    // Switch to new project
    this.currentProject = projectId;
    this.projectHistory.push(projectId);

    // Load project agent
    if (project.agent) {
      await this.loadProjectAgent(project.agent);
    }

    return project;
  }

  // Auto-Kategorisierung für Notizen
  categorizeNote(noteText) {
    const results = {
      projects: [],
      tags: [],
      confidence: 0
    };

    // Keyword matching
    for (const [projectId, keywords] of Object.entries(projectStructure.autoCategorize.keywords)) {
      for (const keyword of keywords) {
        if (noteText.toLowerCase().includes(keyword)) {
          results.projects.push(projectId);
          results.confidence += 0.3;
        }
      }
    }

    // Pattern matching
    for (const rule of projectStructure.autoCategorize.rules) {
      const matches = noteText.match(rule.pattern);
      if (matches) {
        if (rule.action === 'add_tags') {
          results.tags.push(...matches.slice(1));
        }
        results.confidence += 0.2;
      }
    }

    return results;
  }

  // Projekt-basierte Buttons generieren
  getProjectButtons(projectId) {
    const project = projectStructure.projects[projectId];
    const buttons = [];

    // Standard-Aktionen
    buttons.push([
      { text: '📝 Notiz', callback: `project_note_${projectId}` },
      { text: '📋 Tasks', callback: `project_tasks_${projectId}` }
    ]);

    // Feature-spezifische Buttons
    if (project.features) {
      const featureButtons = project.features.slice(0, 4).map(feature => ({
        text: this.getFeatureIcon(feature) + ' ' + this.getFeatureName(feature),
        callback: `project_feature_${projectId}_${feature}`
      }));
      
      // Gruppiere in Zweierpaare
      for (let i = 0; i < featureButtons.length; i += 2) {
        buttons.push(featureButtons.slice(i, i + 2));
      }
    }

    // Navigation
    buttons.push([
      { text: '🔄 Projekt wechseln', callback: 'project_switch' },
      { text: '🏠 Hauptmenü', callback: 'back_main' }
    ]);

    return buttons;
  }

  getFeatureIcon(feature) {
    const icons = {
      conversations: '💬',
      protocols: '📋',
      secure_mode: '🔒',
      gilde_app: '📱',
      knowledge_base: '📚',
      workflow_optimization: '⚡',
      briefe: '✉️',
      rechnungen: '🧾',
      wizard: '🎯',
      templates: '📄'
    };
    return icons[feature] || '📌';
  }

  getFeatureName(feature) {
    return feature.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
}

module.exports = {
  projectStructure,
  ProjectManagerV2
};
