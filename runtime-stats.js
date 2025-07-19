// Runtime Stats Manager - Echte Daten!
const fs = require('fs').promises;
const path = require('path');
const versionManager = require('./version-manager');

class RuntimeStats {
  constructor() {
    this.dataFile = path.join(__dirname, 'data', 'runtime.json');
    this.deployFile = path.join(__dirname, 'data', 'deploy.json');
    this.data = {
      deployTime: Date.now(),
      deployVersion: require('./package.json').version,
      lastGitCommit: 'unknown',
      stats: {
        totalMessages: 0,
        totalTokens: 0,
        totalCost: 0,
        todayMessages: 0,
        todayTokens: 0,
        todayCost: 0
      }
    };
    this.loadData();
  }

  async loadData() {
    try {
      // Version Info aus Version Manager
      const version = versionManager.getVersion();
      this.data.deployVersion = version.full;
      this.data.lastGitCommit = `${version.commit} - ${version.commitMessage}`;
      this.data.deployTime = version.deployTime;

      // Stats aus File
      const savedStats = await fs.readFile(this.dataFile, 'utf8').catch(() => '{}');
      const parsed = JSON.parse(savedStats);
      if (parsed.stats) {
        this.data.stats = parsed.stats;
      }

      // Deploy Zeit
      const deployInfo = await fs.readFile(this.deployFile, 'utf8').catch(() => '{}');
      const deploy = JSON.parse(deployInfo);
      if (deploy.time) {
        this.data.deployTime = deploy.time;
      } else {
        // Neues Deployment
        await this.saveDeployTime();
      }
    } catch (e) {
      console.error('Error loading runtime stats:', e);
    }
  }

  async saveDeployTime() {
    try {
      await fs.mkdir(path.dirname(this.deployFile), { recursive: true });
      await fs.writeFile(this.deployFile, JSON.stringify({
        time: Date.now(),
        version: this.data.deployVersion,
        commit: this.data.lastGitCommit
      }, null, 2));
    } catch (e) {
      console.error('Error saving deploy time:', e);
    }
  }

  async saveStats() {
    try {
      await fs.mkdir(path.dirname(this.dataFile), { recursive: true });
      await fs.writeFile(this.dataFile, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('Error saving stats:', e);
    }
  }

  // Uptime seit letztem Deploy
  getUptime() {
    const now = Date.now();
    const uptime = now - this.data.deployTime;
    
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  // Version Info
  getVersionInfo() {
    return {
      version: this.data.deployVersion || require('./package.json').version,
      commit: this.data.lastGitCommit || 'unknown',
      deployTime: this.data.deployTime  // Return raw timestamp
    };
  }

  // Stats update
  async updateStats(type, amount = 1) {
    this.data.stats[`total${type}`] += amount;
    this.data.stats[`today${type}`] += amount;
    await this.saveStats();
  }

  getDashboardData() {
    const versionInfo = this.getVersionInfo();
    return {
      uptime: this.getUptime(),
      version: versionInfo.version,
      commit: versionInfo.commit,
      deployTime: versionInfo.deployTime,  // Raw timestamp
      stats: this.data.stats,
      realTime: Date.now()  // Raw timestamp
    };
  }

  // Reset daily stats (call at midnight)
  async resetDailyStats() {
    this.data.stats.todayMessages = 0;
    this.data.stats.todayTokens = 0;
    this.data.stats.todayCost = 0;
    await this.saveStats();
  }
}

module.exports = new RuntimeStats();
