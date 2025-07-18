// 📚 Knowledge Base Loader v2 - Mode-aware with recursive loading
const fs = require('fs').promises;
const path = require('path');
const modeManager = require('./mode-manager');

class KnowledgeLoaderV2 {
  constructor() {
    // Multiple Knowledge Sources
    this.knowledgePaths = {
      local: path.join(__dirname, 'knowledge'),
      claudiaAgent: '/Users/az/Documents/A+/AVX/Spaces/S1/Claudia_Agent_Development',
      umzugProjekt: '/Users/az/Documents/A+/AVX/Spaces/S1/Claudia_Agent_Development/02_Active_Agents/Active_Projects/A&A_Umzug_Elmshorn'
    };
    
    this.knowledgeData = {};
    this.s1Data = {};
    this.assetAnalyses = {};
    
    // File type handlers
    this.supportedTypes = {
      text: ['.md', '.txt', '.json', '.yaml', '.yml'],
      asset: ['.pdf', '.docx', '.xlsx'],
      code: ['.js', '.py', '.ts']
    };
    
    // Performance settings
    this.maxFileSize = 30 * 1024 * 1024; // 30MB default
    this.loadedFiles = 0;
    this.totalSize = 0;
  }

  // Main loading function - mode aware
  async loadAllKnowledge() {
    console.log('📚 Lade Knowledge Base v2...');
    const startTime = Date.now();
    
    const mode = modeManager.getCurrentMode();
    console.log(`🔐 Loading in ${mode.name}`);
    
    try {
      // Reset counters
      this.loadedFiles = 0;
      this.totalSize = 0;
      
      // 1. Load local knowledge files
      await this.loadLocalKnowledge();
      
      // 2. Load S1 Claudia Agent data recursively
      await this.loadS1DataRecursive();
      
      // 3. Load specific projects
      await this.loadProjectsRecursive();
      
      // Create combined knowledge
      const combinedKnowledge = this.createCombinedKnowledge();
      
      const loadTime = Date.now() - startTime;
      console.log(`📚 Knowledge Base loaded: ${this.loadedFiles} files, ${(this.totalSize / 1024 / 1024).toFixed(2)}MB in ${loadTime}ms`);
      
      return combinedKnowledge;
      
    } catch (error) {
      console.error('❌ Error loading Knowledge Base:', error);
      return this.getFallbackKnowledge();
    }
  }

  // Load local knowledge files
  async loadLocalKnowledge() {
    const knowledgeFiles = [
      'PROJECT_PROTOCOL.md',
      'STRATEGIC_DECISIONS.md',
      'CLAUDE_CAPABILITIES.md',
      'VERSIONING_SYSTEM.md',
      'MIGRATION_PROTOCOL.md'
    ];

    for (const file of knowledgeFiles) {
      try {
        const filePath = path.join(this.knowledgePaths.local, file);
        await this.loadFile(filePath, 'LOCAL', file);
      } catch (error) {
        console.log(`⚠️  Could not load ${file}:`, error.message);
      }
    }
  }

  // Recursive S1 data loading
  async loadS1DataRecursive() {
    console.log('🗺️  Loading S1 Claudia Agent data recursively...');
    
    const s1Paths = [
      '00_START_HERE',
      '01_Master_Templates',
      '02_Active_Agents/Active_Projects',
      '03_Databases_Knowledge'
    ];
    
    for (const subPath of s1Paths) {
      const fullPath = path.join(this.knowledgePaths.claudiaAgent, subPath);
      await this.loadDirectoryRecursive(fullPath, 'S1', 0, 3);
    }
  }

  // Load specific projects
  async loadProjectsRecursive() {
    console.log('🏠 Loading project data...');
    
    // Specifically load Umzugsprojekt
    await this.loadDirectoryRecursive(
      this.knowledgePaths.umzugProjekt,
      'UMZUG',
      0,
      5 // Deeper for project files
    );
  }

  // Recursive directory loader
  async loadDirectoryRecursive(dirPath, prefix, currentDepth = 0, maxDepth = 3) {
    // Check mode restrictions
    const mode = modeManager.getCurrentMode();
    if (currentDepth >= mode.depth) {
      return;
    }
    
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        
        // Check if allowed by mode
        if (!modeManager.isAllowed(itemPath)) {
          console.log(`🔒 Skipped (mode restriction): ${item}`);
          continue;
        }
        
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          // Load project metadata if available
          const metadata = await modeManager.loadProjectMetadata(itemPath);
          
          // Check project visibility
          if (!modeManager.isAllowed(itemPath, metadata)) {
            console.log(`🔒 Skipped project (visibility): ${item}`);
            continue;
          }
          
          // Recurse into subdirectory
          await this.loadDirectoryRecursive(itemPath, `${prefix}_${item}`, currentDepth + 1, maxDepth);
          
        } else if (stats.isFile()) {
          // Check file type
          const ext = path.extname(item).toLowerCase();
          if (this.isSupported(ext)) {
            await this.loadFile(itemPath, prefix, item);
          } else if (this.isAsset(ext)) {
            await this.checkAssetAnalysis(itemPath, prefix, item);
          }
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not read directory ${dirPath}:`, error.message);
    }
  }

  // Load individual file with mode filtering
  async loadFile(filePath, prefix, fileName) {
    try {
      const stats = await fs.stat(filePath);
      
      // Check file size limit based on mode
      const mode = modeManager.getCurrentMode();
      if (stats.size > mode.maxFileSize) {
        console.log(`⚠️  File too large for current mode: ${fileName} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
        return;
      }
      
      const content = await fs.readFile(filePath, 'utf8');
      
      // Filter content based on mode
      const filteredContent = modeManager.filterContent(content);
      
      const key = `${prefix}_${fileName}`;
      this.s1Data[key] = filteredContent;
      
      this.loadedFiles++;
      this.totalSize += stats.size;
      
      console.log(`✅ Loaded: ${fileName} (${(stats.size / 1024).toFixed(1)}KB)`);
      
    } catch (error) {
      console.log(`⚠️  Could not load ${fileName}:`, error.message);
    }
  }

  // Check for asset analysis files
  async checkAssetAnalysis(assetPath, prefix, fileName) {
    const analysisPath = assetPath + '.analysis.md';
    
    try {
      await fs.access(analysisPath);
      // Analysis exists, load it
      await this.loadFile(analysisPath, prefix, fileName + '.analysis');
      
      // Store reference to original asset
      this.assetAnalyses[assetPath] = analysisPath;
      console.log(`📎 Asset analysis found for: ${fileName}`);
      
    } catch (error) {
      // No analysis exists yet
      console.log(`📎 Asset without analysis: ${fileName} (create with /analyze)`);
    }
  }

  // Check if file type is supported
  isSupported(ext) {
    return this.supportedTypes.text.includes(ext) || 
           this.supportedTypes.code.includes(ext);
  }

  // Check if file is an asset
  isAsset(ext) {
    return this.supportedTypes.asset.includes(ext);
  }

  // Create combined knowledge with mode awareness
  createCombinedKnowledge() {
    const mode = modeManager.getCurrentMode();
    let combined = `### 🧠 AVX COPILOT KNOWLEDGE BASE v2 ###\n`;
    combined += `### ${mode.icon} ${mode.name} ###\n\n`;
    
    // Add mode-specific warnings
    if (mode.mode === 'SHOWCASE') {
      combined += `⚠️ SHOWCASE MODE: Sensitive data is hidden\n\n`;
    }
    
    // Add loaded content summary
    combined += `## 📊 Loaded Data:\n`;
    combined += `- Files: ${this.loadedFiles}\n`;
    combined += `- Total Size: ${(this.totalSize / 1024 / 1024).toFixed(2)}MB\n`;
    combined += `- Mode: ${mode.name}\n\n`;
    
    // Add knowledge content
    if (Object.keys(this.s1Data).length > 0) {
      // Group by prefix for better organization
      const grouped = this.groupByPrefix(this.s1Data);
      
      for (const [prefix, files] of Object.entries(grouped)) {
        combined += `## 📁 ${prefix}:\n`;
        combined += `- ${files.length} files loaded\n\n`;
      }
    }
    
    // Add project information
    combined += this.getProjectSummary();
    
    // Add user context
    combined += this.getUserContext();
    
    return combined;
  }

  // Group files by prefix
  groupByPrefix(data) {
    const grouped = {};
    
    for (const key of Object.keys(data)) {
      const prefix = key.split('_')[0];
      if (!grouped[prefix]) {
        grouped[prefix] = [];
      }
      grouped[prefix].push(key);
    }
    
    return grouped;
  }

  // Get project summary
  getProjectSummary() {
    let summary = `\n## 🚀 Active Projects:\n\n`;
    
    // Check for Umzug project
    const umzugFiles = Object.keys(this.s1Data).filter(k => k.includes('UMZUG'));
    if (umzugFiles.length > 0) {
      summary += `### 🏠 Umzugsprojekt Elmshorn\n`;
      summary += `- Status: Active\n`;
      summary += `- Files: ${umzugFiles.length} documents\n`;
      summary += `- Key docs: Jobcenter Brief, Vermieter Kommunikation\n\n`;
    }
    
    // Add other projects based on loaded data
    const projectPrefixes = ['S1', 'LOCAL'];
    for (const prefix of projectPrefixes) {
      const files = Object.keys(this.s1Data).filter(k => k.startsWith(prefix));
      if (files.length > 0) {
        summary += `### 📁 ${prefix} Data\n`;
        summary += `- Files: ${files.length}\n\n`;
      }
    }
    
    return summary;
  }

  // Get user context
  getUserContext() {
    const mode = modeManager.getCurrentMode();
    
    let context = `\n## 👤 User Context:\n`;
    
    if (mode.mode === 'FULL_POWER') {
      context += `- Name: Arash Zamani\n`;
      context += `- Projects: AVX Copilot, Claudia Agent, Umzug Elmshorn\n`;
      context += `- Partner: Alina\n`;
      context += `- Location: Planning move to Elmshorn\n`;
    } else {
      context += `- User: [REDACTED]\n`;
      context += `- Projects: AI Development, Bot Systems\n`;
    }
    
    return context;
  }

  // Fallback knowledge if loading fails
  getFallbackKnowledge() {
    return `### 🧠 AVX COPILOT KNOWLEDGE BASE ###\n\n⚠️ Could not load full knowledge base. Basic mode active.\n`;
  }

  // Search with mode filtering
  async searchKnowledge(query) {
    const lowerQuery = query.toLowerCase();
    let results = [];
    
    for (const [file, content] of Object.entries(this.s1Data)) {
      // Skip if content is filtered in current mode
      if (content.includes('[REDACTED]') && content.toLowerCase().includes(lowerQuery)) {
        results.push({
          file,
          matches: ['Content redacted in current mode']
        });
        continue;
      }
      
      if (content.toLowerCase().includes(lowerQuery)) {
        const lines = content.split('\n');
        const relevantLines = lines.filter(line => 
          line.toLowerCase().includes(lowerQuery)
        );
        
        results.push({
          file,
          matches: relevantLines.slice(0, 5)
        });
      }
    }
    
    return results;
  }

  // Direct question answering with mode awareness
  async answerQuestion(question) {
    const mode = modeManager.getCurrentMode();
    const lowerQ = question.toLowerCase();
    
    // Mode check for sensitive queries
    if (mode.mode === 'SHOWCASE') {
      if (lowerQ.includes('dhl') || lowerQ.includes('vertraulich')) {
        return '🔒 This information is not available in Showcase Mode.';
      }
    }
    
    // Continue with existing logic...
    if (lowerQ.includes('umzug') || lowerQ.includes('elmshorn')) {
      return this.getUmzugInfo();
    }
    
    return null;
  }

  // Get Umzug info with mode filtering
  getUmzugInfo() {
    const mode = modeManager.getCurrentMode();
    
    if (mode.mode === 'FULL_POWER') {
      return `🏠 **Umzugsprojekt Elmshorn:**
✅ Aktives Projekt: Umzug nach Elmshorn (Arash & Alina)
📁 Alle Dokumente verfügbar
📄 Wichtige Docs: Jobcenter Brief, Vermieter Kommunikation
🗺️ Location: Elmshorn, Schleswig-Holstein`;
    } else {
      return `🏠 **Relocation Project:**
✅ Active project for relocation planning
📁 Project documentation available
📄 Key documents in system`;
    }
  }
}

// Singleton Export
module.exports = new KnowledgeLoaderV2();
