// 🔐 Mode Manager - Controls access levels and visibility
class ModeManager {
  constructor() {
    // Default to safe mode
    this.currentMode = 'SHOWCASE';
    
    // Mode configurations
    this.modes = {
      FULL_POWER: {
        name: 'Full Power Mode',
        icon: '🔓',
        access: 'UNLIMITED',
        depth: Infinity,
        showPrivate: true,
        showRestricted: true,
        maxFileSize: 30 * 1024 * 1024, // 30MB
        blacklist: [],
        description: 'Voller Zugriff auf alle Daten - nur für Arash'
      },
      SHOWCASE: {
        name: 'Showcase Mode',
        icon: '🔒',
        access: 'PUBLIC_ONLY',
        depth: 3,
        showPrivate: false,
        showRestricted: false,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        blacklist: ['DHL', 'private', 'restricted', 'vertraulich', 'confidential'],
        description: 'Sicherer Modus für Präsentationen'
      }
    };
    
    // Project metadata cache
    this.projectMetadata = new Map();
    
    // Blacklist cache for performance
    this.blacklistCache = new Set();
    this.updateBlacklistCache();
  }
  
  // Switch mode
  setMode(mode) {
    if (!this.modes[mode]) {
      throw new Error(`Unknown mode: ${mode}`);
    }
    
    this.currentMode = mode;
    this.updateBlacklistCache();
    
    console.log(`🔐 Mode switched to: ${this.modes[mode].name}`);
    return this.getCurrentMode();
  }
  
  // Get current mode config
  getCurrentMode() {
    return {
      mode: this.currentMode,
      ...this.modes[this.currentMode]
    };
  }
  
  // Check if path/content is allowed in current mode
  isAllowed(path, metadata = {}) {
    const mode = this.getCurrentMode();
    
    // In FULL_POWER mode, everything is allowed
    if (this.currentMode === 'FULL_POWER') {
      return true;
    }
    
    // Check blacklist
    const pathLower = path.toLowerCase();
    for (const blacklisted of this.blacklistCache) {
      if (pathLower.includes(blacklisted.toLowerCase())) {
        return false;
      }
    }
    
    // Check metadata visibility
    if (metadata.visibility === 'private' && !mode.showPrivate) {
      return false;
    }
    
    if (metadata.visibility === 'restricted' && !mode.showRestricted) {
      return false;
    }
    
    return true;
  }
  
  // Update blacklist cache
  updateBlacklistCache() {
    const mode = this.getCurrentMode();
    this.blacklistCache = new Set(mode.blacklist);
  }
  
  // Load project metadata
  async loadProjectMetadata(projectPath) {
    try {
      const metadataPath = path.join(projectPath, '.project.json');
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
      this.projectMetadata.set(projectPath, metadata);
      return metadata;
    } catch (error) {
      // Default metadata if .project.json doesn't exist
      return {
        name: path.basename(projectPath),
        visibility: 'public',
        tags: []
      };
    }
  }
  
  // Filter content based on mode
  filterContent(content) {
    if (this.currentMode === 'FULL_POWER') {
      return content;
    }
    
    // Remove blacklisted terms from content
    let filtered = content;
    for (const blacklisted of this.blacklistCache) {
      const regex = new RegExp(blacklisted, 'gi');
      filtered = filtered.replace(regex, '[REDACTED]');
    }
    
    return filtered;
  }
  
  // Get mode display for UI
  getModeDisplay() {
    const mode = this.getCurrentMode();
    return `${mode.icon} ${mode.name}`;
  }
  
  // Check if user can switch modes
  canSwitchMode(userId) {
    // Only Arash can switch to FULL_POWER
    // You can add more logic here based on user permissions
    return userId === process.env.ADMIN_USER_ID || userId === '123456789'; // Replace with actual ID
  }
}

// Singleton export
module.exports = new ModeManager();
