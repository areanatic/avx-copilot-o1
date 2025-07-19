// Version Manager - Echte Versionierung basierend auf Git!
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class VersionManager {
  constructor() {
    this.versionFile = path.join(__dirname, 'version.json');
    this.version = this.loadVersion();
  }

  loadVersion() {
    try {
      // 1. Versuche Git Info zu bekommen
      const gitInfo = this.getGitInfo();
      
      // 2. Lade gespeicherte Version
      let savedVersion = {};
      try {
        savedVersion = JSON.parse(fs.readFileSync(this.versionFile, 'utf8'));
      } catch (e) {
        // Keine gespeicherte Version
      }
      
      // 3. Build Version String
      const baseVersion = require('./package.json').version;
      const buildNumber = this.getBuildNumber();
      const commitHash = gitInfo.hash;
      
      const version = {
        full: `${baseVersion}.${buildNumber}-${commitHash}`,
        base: baseVersion,
        build: buildNumber,
        commit: commitHash,
        commitMessage: gitInfo.message,
        timestamp: Date.now(),
        deployTime: savedVersion.deployTime || Date.now()
      };
      
      // 4. Speichere Version
      this.saveVersion(version);
      
      return version;
    } catch (error) {
      console.error('Version Manager Error:', error);
      return {
        full: '2.3.0-unknown',
        base: '2.3.0',
        build: 0,
        commit: 'unknown',
        commitMessage: 'No Git info',
        timestamp: Date.now(),
        deployTime: Date.now()
      };
    }
  }

  getGitInfo() {
    try {
      const hash = execSync('git rev-parse --short HEAD').toString().trim();
      const message = execSync('git log -1 --pretty=%B').toString().trim().split('\n')[0];
      const commitCount = execSync('git rev-list --count HEAD').toString().trim();
      
      return {
        hash,
        message,
        count: parseInt(commitCount)
      };
    } catch (e) {
      // Railway Environment Variables
      return {
        hash: process.env.RAILWAY_GIT_COMMIT_SHA?.substring(0, 7) || 'railway',
        message: process.env.RAILWAY_GIT_COMMIT_MESSAGE || 'Railway Deploy',
        count: 0
      };
    }
  }

  getBuildNumber() {
    try {
      // Build Number = Anzahl der Commits
      return parseInt(execSync('git rev-list --count HEAD').toString().trim());
    } catch (e) {
      // Fallback: Nutze gespeicherte Build Number + 1
      try {
        const saved = JSON.parse(fs.readFileSync(this.versionFile, 'utf8'));
        return (saved.build || 0) + 1;
      } catch (e2) {
        return 1;
      }
    }
  }

  saveVersion(version) {
    try {
      fs.mkdirSync(path.dirname(this.versionFile), { recursive: true });
      fs.writeFileSync(this.versionFile, JSON.stringify(version, null, 2));
    } catch (e) {
      console.error('Could not save version:', e);
    }
  }

  getVersion() {
    return this.version;
  }

  getVersionString() {
    return this.version.full;
  }

  getCommitInfo() {
    return {
      hash: this.version.commit,
      message: this.version.commitMessage
    };
  }

  updateDeployTime() {
    this.version.deployTime = Date.now();
    this.saveVersion(this.version);
  }
}

module.exports = new VersionManager();
