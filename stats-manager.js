// 📊 Persistent Stats Manager für AVX Copilot
const fs = require('fs');
const path = require('path');

class StatsManager {
  constructor() {
    this.statsFile = path.join(__dirname, 'bot-stats.json');
    this.stats = this.loadStats();
    
    // Auto-save alle 30 Sekunden
    setInterval(() => this.saveStats(), 30000);
  }

  loadStats() {
    try {
      if (fs.existsSync(this.statsFile)) {
        const data = fs.readFileSync(this.statsFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
    
    // Default stats
    return {
      totalTokens: 0,
      totalCost: 0,
      messagesProcessed: 0,
      voiceMinutesTranscribed: 0,
      lastReset: new Date().toISOString(),
      dailyStats: {},
      hourlyStats: {},
      userStats: {}
    };
  }

  saveStats() {
    try {
      fs.writeFileSync(this.statsFile, JSON.stringify(this.stats, null, 2));
    } catch (error) {
      console.error('❌ Error saving stats:', error);
    }
  }

  // Token & Cost tracking
  trackTokens(inputTokens, outputTokens, model = 'claude-3-opus') {
    this.stats.totalTokens += inputTokens + outputTokens;
    
    // Calculate cost based on model
    let inputCost = 0;
    let outputCost = 0;
    
    switch(model) {
      case 'claude-3-opus':
        inputCost = (inputTokens / 1000000) * 15;
        outputCost = (outputTokens / 1000000) * 75;
        break;
      case 'claude-3-sonnet':
        inputCost = (inputTokens / 1000000) * 3;
        outputCost = (outputTokens / 1000000) * 15;
        break;
      case 'claude-3-haiku':
        inputCost = (inputTokens / 1000000) * 0.25;
        outputCost = (outputTokens / 1000000) * 1.25;
        break;
    }
    
    this.stats.totalCost += inputCost + outputCost;
    
    // Track daily stats
    const today = new Date().toISOString().split('T')[0];
    if (!this.stats.dailyStats[today]) {
      this.stats.dailyStats[today] = {
        tokens: 0,
        cost: 0,
        messages: 0
      };
    }
    this.stats.dailyStats[today].tokens += inputTokens + outputTokens;
    this.stats.dailyStats[today].cost += inputCost + outputCost;
    
    // Track hourly stats
    const hour = new Date().getHours();
    if (!this.stats.hourlyStats[hour]) {
      this.stats.hourlyStats[hour] = {
        tokens: 0,
        messages: 0
      };
    }
    this.stats.hourlyStats[hour].tokens += inputTokens + outputTokens;
    
    this.saveStats();
  }

  // Message tracking
  trackMessage(userId, messageType = 'text') {
    this.stats.messagesProcessed++;
    
    // Track daily
    const today = new Date().toISOString().split('T')[0];
    if (!this.stats.dailyStats[today]) {
      this.stats.dailyStats[today] = {
        tokens: 0,
        cost: 0,
        messages: 0
      };
    }
    this.stats.dailyStats[today].messages++;
    
    // Track hourly
    const hour = new Date().getHours();
    if (!this.stats.hourlyStats[hour]) {
      this.stats.hourlyStats[hour] = {
        tokens: 0,
        messages: 0
      };
    }
    this.stats.hourlyStats[hour].messages++;
    
    // Track per user
    if (!this.stats.userStats[userId]) {
      this.stats.userStats[userId] = {
        messages: 0,
        tokens: 0,
        firstSeen: new Date().toISOString()
      };
    }
    this.stats.userStats[userId].messages++;
    
    this.saveStats();
  }

  // Voice tracking
  trackVoiceMinutes(minutes) {
    this.stats.voiceMinutesTranscribed += minutes;
    this.saveStats();
  }

  // Get current stats
  getCurrentStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayStats = this.stats.dailyStats[today] || {
      tokens: 0,
      cost: 0,
      messages: 0
    };
    
    return {
      total: {
        tokens: this.stats.totalTokens,
        cost: this.stats.totalCost,
        messages: this.stats.messagesProcessed,
        voiceMinutes: this.stats.voiceMinutesTranscribed
      },
      today: todayStats,
      timestamp: new Date().toISOString()
    };
  }

  // Reset daily stats (can be called via cron)
  resetDailyStats() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    
    // Keep only last 30 days
    const keys = Object.keys(this.stats.dailyStats);
    if (keys.length > 30) {
      const oldestKey = keys.sort()[0];
      delete this.stats.dailyStats[oldestKey];
    }
    
    this.saveStats();
  }
}

module.exports = new StatsManager();
