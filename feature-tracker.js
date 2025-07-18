// feature-tracker.js - Zentrale Feature Status Verwaltung
const fs = require('fs').promises;
const path = require('path');

class FeatureTracker {
  constructor() {
    this.featuresFile = './data/feature-status.json';
    this.changeLogFile = './data/feature-changes.log';
    this.features = new Map();
    this.loadFeatures();
  }

  async loadFeatures() {
    try {
      const data = await fs.readFile(this.featuresFile, 'utf8');
      const features = JSON.parse(data);
      this.features = new Map(Object.entries(features));
    } catch (error) {
      // Initialize with current feature status
      this.initializeFeatures();
    }
  }

  initializeFeatures() {
    this.features = new Map([
      ['quick_notes', {
        name: 'Quick Notes',
        status: 100,
        category: 'core',
        missing: [],
        dependencies: [],
        effort: '0h',
        priority: 'DONE',
        lastUpdate: new Date().toISOString()
      }],
      ['kb_search', {
        name: 'Knowledge Base Suche',
        status: 5,
        category: 'core',
        missing: ['Search Implementation', 'Index', 'UI Polish'],
        dependencies: [],
        effort: '3h',
        priority: 'HOCH',
        lastUpdate: new Date().toISOString()
      }],
      ['dev_mode', {
        name: 'Developer Mode',
        status: 50,
        category: 'dev',
        missing: ['Visual Indicator', 'Persistent State'],
        dependencies: [],
        effort: '30min',
        priority: 'MITTEL',
        lastUpdate: new Date().toISOString()
      }],
      ['project_agents', {
        name: 'Projekt Agents',
        status: 20,
        category: 'ai',
        missing: ['Agent Creation', 'Switching Logic', 'Persistence'],
        dependencies: [],
        effort: '4h',
        priority: 'MITTEL',
        lastUpdate: new Date().toISOString()
      }],
      ['deploy_status', {
        name: 'Deployment Status',
        status: 0,
        category: 'dev',
        missing: ['Railway API Integration', 'Status Parser', 'UI'],
        dependencies: ['Railway API Key'],
        effort: '2h',
        priority: 'NIEDRIG',
        lastUpdate: new Date().toISOString()
      }],
      ['voice_transcription', {
        name: 'Audio Transkription',
        status: 90,
        category: 'core',
        missing: ['API Key in Production'],
        dependencies: ['OpenAI API Key'],
        effort: '10min',
        priority: 'HOCH',
        lastUpdate: new Date().toISOString()
      }],
      ['git_integration', {
        name: 'Git Integration',
        status: 75,
        category: 'dev',
        missing: ['Detailed Status Display', 'Commit Templates'],
        dependencies: [],
        effort: '1h',
        priority: 'HOCH',
        lastUpdate: new Date().toISOString()
      }],
      ['file_editor', {
        name: 'File Editor',
        status: 60,
        category: 'dev',
        missing: ['Edit Functionality', 'Syntax Highlighting'],
        dependencies: [],
        effort: '2h',
        priority: 'MITTEL',
        lastUpdate: new Date().toISOString()
      }],
      ['analytics', {
        name: 'Analytics Dashboard',
        status: 30,
        category: 'monitoring',
        missing: ['Data Collection', 'Visualization', 'Export'],
        dependencies: [],
        effort: '4h',
        priority: 'NIEDRIG',
        lastUpdate: new Date().toISOString()
      }],
      ['umzug_elmshorn', {
        name: 'Umzug Elmshorn',
        status: 0,
        category: 'personal',
        missing: ['Complete Implementation'],
        dependencies: [],
        effort: '3h',
        priority: 'MITTEL',
        lastUpdate: new Date().toISOString()
      }]
    ]);
    
    this.saveFeatures();
  }

  async saveFeatures() {
    const data = Object.fromEntries(this.features);
    await fs.mkdir('./data', { recursive: true });
    await fs.writeFile(this.featuresFile, JSON.stringify(data, null, 2));
  }

  getFeature(featureId) {
    return this.features.get(featureId);
  }

  getAllFeatures() {
    return Array.from(this.features.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  }

  getFeaturesByCategory(category) {
    return this.getAllFeatures().filter(f => f.category === category);
  }

  getFeaturesByStatus(minStatus, maxStatus = 100) {
    return this.getAllFeatures().filter(f => 
      f.status >= minStatus && f.status <= maxStatus
    );
  }

  async updateStatus(featureId, newStatus, whatChanged, updatedBy = 'system') {
    const feature = this.features.get(featureId);
    if (!feature) return { error: 'Feature not found' };

    const oldStatus = feature.status;
    
    // Update feature
    feature.status = newStatus;
    feature.lastUpdate = new Date().toISOString();
    
    // Log change
    const logEntry = {
      timestamp: new Date().toISOString(),
      featureId,
      featureName: feature.name,
      oldStatus,
      newStatus,
      whatChanged,
      updatedBy
    };
    
    // Append to log
    await fs.appendFile(
      this.changeLogFile,
      JSON.stringify(logEntry) + '\n'
    );
    
    // Save features
    await this.saveFeatures();
    
    return {
      success: true,
      feature,
      change: {
        from: oldStatus,
        to: newStatus,
        difference: newStatus - oldStatus
      }
    };
  }

  async updateFeatureDetails(featureId, updates) {
    const feature = this.features.get(featureId);
    if (!feature) return { error: 'Feature not found' };
    
    Object.assign(feature, updates, {
      lastUpdate: new Date().toISOString()
    });
    
    await this.saveFeatures();
    return { success: true, feature };
  }

  getStatusEmoji(status) {
    if (status === 0) return '❌';
    if (status < 25) return '🟡';
    if (status < 50) return '🟠';
    if (status < 75) return '🟢';
    if (status < 100) return '🔵';
    return '✅';
  }

  getProgressBar(status, width = 10) {
    const filled = Math.floor(status / 10);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  formatFeatureStatus(featureId) {
    const feature = this.features.get(featureId);
    if (!feature) return 'Feature nicht gefunden';
    
    return `${this.getStatusEmoji(feature.status)} **${feature.name}** - ${feature.status}%\n` +
           `${this.getProgressBar(feature.status)}\n` +
           `Fehlt: ${feature.missing.join(', ')}\n` +
           `Aufwand: ${feature.effort} | Priorität: ${feature.priority}`;
  }

  generateReport(options = {}) {
    const features = this.getAllFeatures();
    
    let report = '📊 **Feature Status Report**\n';
    report += `_Stand: ${new Date().toLocaleString('de-DE')}_\n\n`;
    
    // Summary
    const complete = features.filter(f => f.status === 100).length;
    const inProgress = features.filter(f => f.status > 0 && f.status < 100).length;
    const notStarted = features.filter(f => f.status === 0).length;
    
    report += `**Zusammenfassung:**\n`;
    report += `✅ Fertig: ${complete}\n`;
    report += `🚧 In Arbeit: ${inProgress}\n`;
    report += `❌ Nicht begonnen: ${notStarted}\n\n`;
    
    // By Category
    const categories = [...new Set(features.map(f => f.category))];
    
    categories.forEach(cat => {
      report += `\n**${cat.toUpperCase()}:**\n`;
      const catFeatures = features.filter(f => f.category === cat);
      
      catFeatures.sort((a, b) => b.status - a.status).forEach(f => {
        report += `${this.getStatusEmoji(f.status)} ${f.name} - ${f.status}%\n`;
      });
    });
    
    // Critical Missing
    report += `\n**🚨 Kritische Features (<50%):**\n`;
    features
      .filter(f => f.priority === 'KRITISCH' && f.status < 50)
      .forEach(f => {
        report += `• ${f.name}: ${f.missing.join(', ')}\n`;
      });
    
    return report;
  }

  async getRecentChanges(limit = 10) {
    try {
      const log = await fs.readFile(this.changeLogFile, 'utf8');
      const entries = log.split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line))
        .slice(-limit)
        .reverse();
      
      return entries;
    } catch {
      return [];
    }
  }

  // Telegram Bot Integration
  getFeatureButton(featureId) {
    const feature = this.features.get(featureId);
    if (!feature) return null;
    
    const emoji = this.getStatusEmoji(feature.status);
    const label = feature.status < 100 
      ? `${emoji} ${feature.name} (${feature.status}%)`
      : `✅ ${feature.name}`;
    
    return {
      text: label,
      callback_data: feature.status < 100 ? `feature_info:${featureId}` : featureId
    };
  }

  checkFeatureBeforeUse(featureId, ctx) {
    const feature = this.features.get(featureId);
    if (!feature) return true; // Unknown feature, let it through
    
    if (feature.status < 100) {
      ctx.reply(
        `⚠️ **Feature noch nicht fertig**\n\n` +
        this.formatFeatureStatus(featureId) + '\n\n' +
        `_Dieses Feature wird priorisiert entwickelt._`,
        { parse_mode: 'Markdown' }
      );
      return false;
    }
    
    return true;
  }
}

module.exports = new FeatureTracker();
