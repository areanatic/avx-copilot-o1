// protocol-manager.js - Unified Protocol System
const fs = require('fs').promises;
const path = require('path');

class ProtocolManager {
  constructor() {
    this.protocolDir = './protocols';
    this.initDirectories();
  }

  async initDirectories() {
    const dirs = [
      this.protocolDir,
      path.join(this.protocolDir, 'features'),
      path.join(this.protocolDir, 'users'),
      path.join(this.protocolDir, 'errors'),
      path.join(this.protocolDir, 'decisions')
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  // FEATURE PROTOCOL with User Feedback
  async addFeatureEntry(featureId, entry) {
    const protocolFile = path.join(this.protocolDir, 'features', `${featureId}.json`);
    
    let protocol = {
      featureId,
      created: new Date().toISOString(),
      entries: [],
      feedback: [],
      decisions: [],
      metrics: {
        feedbackCount: 0,
        errorCount: 0,
        avgResolutionTime: 0
      }
    };
    
    try {
      const existing = await fs.readFile(protocolFile, 'utf8');
      protocol = JSON.parse(existing);
    } catch (e) {
      // New protocol
    }
    
    protocol.entries.push({
      timestamp: new Date().toISOString(),
      ...entry
    });
    
    await fs.writeFile(protocolFile, JSON.stringify(protocol, null, 2));
    return protocol;
  }

  // Link User Feedback to Feature
  async linkFeedback(userId, message, context = {}) {
    // Detect which feature this relates to
    const detectedFeature = this.detectFeatureFromMessage(message);
    
    const feedback = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      userId,
      userName: context.userName || 'Unknown',
      message,
      sentiment: this.analyzeSentiment(message),
      keywords: this.extractKeywords(message),
      detectedFeature,
      resolved: false,
      resolution: null
    };
    
    // Add to feature protocol
    if (detectedFeature) {
      await this.addToFeatureProtocol(detectedFeature, 'feedback', feedback);
    }
    
    // Add to user protocol
    await this.addToUserProtocol(userId, 'feedback', feedback);
    
    return feedback;
  }

  // Sentiment Analysis (simple)
  analyzeSentiment(message) {
    const negative = ['nicht', 'problem', 'fehlt', 'kaputt', 'fehler', 'warum'];
    const positive = ['gut', 'super', 'danke', 'perfekt', 'klappt'];
    
    const msg = message.toLowerCase();
    const negCount = negative.filter(word => msg.includes(word)).length;
    const posCount = positive.filter(word => msg.includes(word)).length;
    
    if (negCount > posCount) return 'negative';
    if (posCount > negCount) return 'positive';
    return 'neutral';
  }

  // Feature Detection from Message
  detectFeatureFromMessage(message) {
    const featureKeywords = {
      'quick_notes': ['notiz', 'note', 'speicher', 'quick note'],
      'dev_mode': ['dev mode', 'entwickler', 'modus'],
      'git_integration': ['git', 'push', 'commit', 'deploy'],
      'project_agents': ['agent', 'projekt agent'],
      'voice_transcription': ['audio', 'sprach', 'voice', 'transkript']
    };
    
    const msg = message.toLowerCase();
    
    for (const [feature, keywords] of Object.entries(featureKeywords)) {
      if (keywords.some(keyword => msg.includes(keyword))) {
        return feature;
      }
    }
    
    return null;
  }

  // Extract Keywords
  extractKeywords(message) {
    const importantWords = message
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['aber', 'auch', 'noch', 'doch', 'dass'].includes(word));
    
    return [...new Set(importantWords)];
  }

  // USER PROTOCOL - Personal Journey
  async addToUserProtocol(userId, type, data) {
    const protocolFile = path.join(this.protocolDir, 'users', `${userId}.json`);
    
    let protocol = {
      userId,
      created: new Date().toISOString(),
      preferences: {},
      patterns: [],
      feedback: [],
      sessions: [],
      metrics: {
        totalInteractions: 0,
        averageSessionLength: 0,
        commonIssues: []
      }
    };
    
    try {
      const existing = await fs.readFile(protocolFile, 'utf8');
      protocol = JSON.parse(existing);
    } catch (e) {
      // New user protocol
    }
    
    switch (type) {
      case 'feedback':
        protocol.feedback.push(data);
        break;
      case 'session':
        protocol.sessions.push(data);
        break;
      case 'preference':
        Object.assign(protocol.preferences, data);
        break;
      case 'pattern':
        protocol.patterns.push(data);
        break;
    }
    
    protocol.metrics.totalInteractions++;
    
    await fs.writeFile(protocolFile, JSON.stringify(protocol, null, 2));
    return protocol;
  }

  // ERROR PROTOCOL - Learn from Mistakes
  async logError(error, context = {}) {
    const errorEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      context: {
        feature: context.feature,
        user: context.userId,
        action: context.action,
        ...context
      },
      resolved: false,
      solution: null,
      preventionMeasures: []
    };
    
    const errorFile = path.join(this.protocolDir, 'errors', `${errorEntry.id}.json`);
    await fs.writeFile(errorFile, JSON.stringify(errorEntry, null, 2));
    
    // Link to feature if detected
    if (context.feature) {
      await this.addToFeatureProtocol(context.feature, 'error', errorEntry);
    }
    
    return errorEntry;
  }

  // DECISION PROTOCOL - Document Choices
  async logDecision(decision) {
    const decisionEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      title: decision.title,
      context: decision.context,
      options: decision.options,
      chosen: decision.chosen,
      reasoning: decision.reasoning,
      expectedOutcome: decision.expectedOutcome,
      reviewDate: decision.reviewDate || null,
      actualOutcome: null,
      relatedFeatures: decision.relatedFeatures || []
    };
    
    const decisionFile = path.join(this.protocolDir, 'decisions', `${decisionEntry.id}.json`);
    await fs.writeFile(decisionFile, JSON.stringify(decisionEntry, null, 2));
    
    return decisionEntry;
  }

  // Helper to add to feature protocol
  async addToFeatureProtocol(featureId, type, data) {
    const entry = {
      type,
      data,
      impact: this.assessImpact(type, data)
    };
    
    await this.addFeatureEntry(featureId, entry);
  }

  // Assess impact of entry
  assessImpact(type, data) {
    if (type === 'error') return 'high';
    if (type === 'feedback' && data.sentiment === 'negative') return 'medium';
    if (type === 'progress' && data.change > 50) return 'high';
    return 'low';
  }

  // REPORTING & INSIGHTS
  async generateFeatureReport(featureId) {
    const protocolFile = path.join(this.protocolDir, 'features', `${featureId}.json`);
    
    try {
      const protocol = JSON.parse(await fs.readFile(protocolFile, 'utf8'));
      
      const report = {
        featureId,
        summary: {
          totalEntries: protocol.entries.length,
          feedbackCount: protocol.feedback.length,
          unresolvedFeedback: protocol.feedback.filter(f => !f.resolved).length,
          errorCount: protocol.entries.filter(e => e.type === 'error').length,
          lastUpdate: protocol.entries[protocol.entries.length - 1]?.timestamp
        },
        timeline: this.createTimeline(protocol.entries),
        feedbackAnalysis: this.analyzeFeedback(protocol.feedback),
        recommendations: this.generateRecommendations(protocol)
      };
      
      return report;
    } catch (e) {
      return null;
    }
  }

  createTimeline(entries) {
    return entries.map(entry => ({
      time: new Date(entry.timestamp).toLocaleString('de-DE'),
      type: entry.type,
      summary: this.summarizeEntry(entry)
    }));
  }

  summarizeEntry(entry) {
    switch (entry.type) {
      case 'progress':
        return `Status: ${entry.data.from}% → ${entry.data.to}%`;
      case 'feedback':
        return `User: "${entry.data.message.substring(0, 50)}..."`;
      case 'error':
        return `Error: ${entry.data.error.message}`;
      default:
        return entry.type;
    }
  }

  analyzeFeedback(feedback) {
    const sentiments = feedback.reduce((acc, f) => {
      acc[f.sentiment] = (acc[f.sentiment] || 0) + 1;
      return acc;
    }, {});
    
    const commonKeywords = {};
    feedback.forEach(f => {
      f.keywords.forEach(keyword => {
        commonKeywords[keyword] = (commonKeywords[keyword] || 0) + 1;
      });
    });
    
    return {
      sentiments,
      commonKeywords: Object.entries(commonKeywords)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word, count]) => ({ word, count })),
      averageResolutionTime: this.calculateAvgResolutionTime(feedback)
    };
  }

  calculateAvgResolutionTime(feedback) {
    const resolved = feedback.filter(f => f.resolved && f.resolution);
    if (resolved.length === 0) return null;
    
    const times = resolved.map(f => {
      const start = new Date(f.timestamp);
      const end = new Date(f.resolution.timestamp);
      return end - start;
    });
    
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  generateRecommendations(protocol) {
    const recommendations = [];
    
    // High error rate
    const errorRate = protocol.entries.filter(e => e.type === 'error').length / protocol.entries.length;
    if (errorRate > 0.2) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Focus on stability',
        reason: `Error rate is ${(errorRate * 100).toFixed(0)}%`
      });
    }
    
    // Negative feedback
    const negativeFeedback = protocol.feedback.filter(f => f.sentiment === 'negative');
    if (negativeFeedback.length > protocol.feedback.length * 0.5) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Address user concerns',
        reason: 'Majority of feedback is negative'
      });
    }
    
    // Stalled progress
    const lastProgress = protocol.entries
      .filter(e => e.type === 'progress')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    
    if (lastProgress) {
      const daysSinceUpdate = (Date.now() - new Date(lastProgress.timestamp)) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 7) {
        recommendations.push({
          priority: 'MEDIUM',
          action: 'Resume development',
          reason: `No progress for ${Math.floor(daysSinceUpdate)} days`
        });
      }
    }
    
    return recommendations;
  }

  // Telegram Integration
  async handleUserMessage(ctx) {
    const userId = ctx.from.id;
    const message = ctx.message.text;
    
    // Log feedback if it seems relevant
    const sentiment = this.analyzeSentiment(message);
    if (sentiment === 'negative' || message.includes('?')) {
      await this.linkFeedback(userId, message, {
        userName: ctx.from.first_name,
        chatId: ctx.chat.id
      });
    }
    
    // Detect patterns
    await this.detectUserPattern(userId, message);
  }

  async detectUserPattern(userId, message) {
    // Simple pattern detection
    const patterns = {
      'asks_for_status': /status|stand|wie weit/i,
      'needs_help': /hilfe|help|verstehe nicht/i,
      'gives_feedback': /sollte|könnte|wäre besser/i,
      'technical_user': /git|deploy|api|code/i
    };
    
    for (const [pattern, regex] of Object.entries(patterns)) {
      if (regex.test(message)) {
        await this.addToUserProtocol(userId, 'pattern', {
          pattern,
          example: message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
}

module.exports = new ProtocolManager();
