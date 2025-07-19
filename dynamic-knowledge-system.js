// dynamic-knowledge-system.js - Real Second Brain für AVX Copilot

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process').promises;

class DynamicKnowledgeSystem {
  constructor() {
    this.knowledgePaths = [
      '/Users/az/Documents/A+/AVX/Spaces/S2/avx-copilot-o1',
      '/Users/az/Documents/A+/AVX/Spaces/S2/avx-copilot-v2',
      '/Users/az/Documents/A+/AVX/Spaces/S1/Claudia_Agent',
      // Weitere Pfade hinzufügen!
    ];
    
    this.fileCache = new Map();
    this.searchIndex = new Map();
    this.lastUpdate = new Date();
  }

  // 1. ECHTZEIT DATEI-ZUGRIFF
  async readFileRealtime(query) {
    const results = [];
    
    // Durchsuche alle Knowledge Paths
    for (const basePath of this.knowledgePaths) {
      try {
        const files = await this.searchFiles(basePath, query);
        for (const file of files) {
          const content = await fs.readFile(file, 'utf8');
          results.push({
            path: file,
            content: content.substring(0, 1000), // Preview
            fullContent: content,
            modified: (await fs.stat(file)).mtime
          });
        }
      } catch (error) {
        console.error(`Error reading ${basePath}:`, error);
      }
    }
    
    return results;
  }

  // 2. GIT INTEGRATION - Aktuelle Änderungen
  async getRecentChanges() {
    const changes = [];
    
    for (const repoPath of this.knowledgePaths) {
      try {
        const { stdout } = await exec(
          `cd ${repoPath} && git log --oneline -10 --pretty=format:"%h %s" --since="1 week ago"`,
          { encoding: 'utf8' }
        );
        
        if (stdout) {
          changes.push({
            repo: path.basename(repoPath),
            commits: stdout.split('\n')
          });
        }
      } catch (error) {
        // Kein Git Repo oder Fehler
      }
    }
    
    return changes;
  }

  // 3. INTELLIGENT SEARCH - Über alle Projekte
  async searchAcrossProjects(query) {
    const results = {
      exact: [],
      fuzzy: [],
      semantic: []
    };
    
    // Suche in allen Paths
    for (const basePath of this.knowledgePaths) {
      try {
        // Exact match
        const exactFiles = await exec(
          `grep -r "${query}" ${basePath} --include="*.md" --include="*.js" -l | head -20`,
          { encoding: 'utf8' }
        );
        
        if (exactFiles.stdout) {
          const files = exactFiles.stdout.split('\n').filter(f => f);
          for (const file of files) {
            const content = await fs.readFile(file, 'utf8');
            const lines = content.split('\n');
            const matchingLines = lines.filter(l => 
              l.toLowerCase().includes(query.toLowerCase())
            );
            
            results.exact.push({
              file: file.replace(basePath, ''),
              matches: matchingLines.slice(0, 3),
              project: path.basename(basePath)
            });
          }
        }
      } catch (error) {
        // Ignore grep errors
      }
    }
    
    // Semantic search (simple keyword matching)
    const keywords = query.toLowerCase().split(' ');
    for (const [file, content] of this.fileCache) {
      const lowerContent = content.toLowerCase();
      const score = keywords.filter(k => lowerContent.includes(k)).length;
      
      if (score > 0) {
        results.semantic.push({
          file,
          score,
          preview: this.extractRelevantSection(content, keywords[0])
        });
      }
    }
    
    results.semantic.sort((a, b) => b.score - a.score);
    
    return results;
  }

  // 4. CONTEXT BUILDER - Baut relevanten Context
  async buildContextForQuery(query, userId) {
    const context = {
      timestamp: new Date(),
      query,
      relevantFiles: [],
      recentChanges: [],
      projectStatus: {},
      userNotes: []
    };
    
    // 1. Suche relevante Dateien
    const searchResults = await this.searchAcrossProjects(query);
    context.relevantFiles = searchResults.exact.slice(0, 5);
    
    // 2. Hole Recent Changes
    context.recentChanges = await this.getRecentChanges();
    
    // 3. Projekt-spezifischer Context
    if (query.toLowerCase().includes('its gilde')) {
      const gildeFiles = await this.readFileRealtime('gilde');
      context.projectStatus.itsGilde = {
        files: gildeFiles.length,
        lastUpdate: gildeFiles[0]?.modified
      };
    }
    
    // 4. User Notes
    try {
      const userNotesManager = require('./user-notes-manager');
      const notes = await userNotesManager.searchNotes(userId, query);
      context.userNotes = notes.slice(0, 5);
    } catch (error) {
      // Notes not available
    }
    
    return context;
  }

  // 5. SMART PROMPT BUILDER
  async buildSmartPrompt(basePrompt, query, userId) {
    const context = await this.buildContextForQuery(query, userId);
    
    let smartPrompt = basePrompt + '\n\n## 🧠 DYNAMIC CONTEXT\n';
    
    // Relevante Dateien
    if (context.relevantFiles.length > 0) {
      smartPrompt += '\n### 📁 Relevante Dateien:\n';
      context.relevantFiles.forEach(f => {
        smartPrompt += `- ${f.project}${f.file}\n`;
        f.matches.forEach(m => {
          smartPrompt += `  > ${m.trim()}\n`;
        });
      });
    }
    
    // Recent Changes
    if (context.recentChanges.length > 0) {
      smartPrompt += '\n### 🔄 Aktuelle Änderungen:\n';
      context.recentChanges.forEach(repo => {
        smartPrompt += `**${repo.repo}:**\n`;
        repo.commits.slice(0, 3).forEach(c => {
          smartPrompt += `- ${c}\n`;
        });
      });
    }
    
    // User Notes
    if (context.userNotes.length > 0) {
      smartPrompt += '\n### 📝 Relevante Notizen:\n';
      context.userNotes.forEach(note => {
        smartPrompt += `- ${note.text.substring(0, 100)}...\n`;
      });
    }
    
    return smartPrompt;
  }

  // 6. LIVE FILE WATCHER
  async watchForChanges() {
    const chokidar = require('chokidar');
    
    this.knowledgePaths.forEach(watchPath => {
      const watcher = chokidar.watch(watchPath, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true
      });
      
      watcher
        .on('add', path => this.handleFileChange('added', path))
        .on('change', path => this.handleFileChange('changed', path))
        .on('unlink', path => this.handleFileChange('removed', path));
    });
  }
  
  async handleFileChange(event, filePath) {
    console.log(`File ${event}: ${filePath}`);
    
    // Update cache
    if (event !== 'removed') {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        this.fileCache.set(filePath, content);
      } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
      }
    } else {
      this.fileCache.delete(filePath);
    }
    
    this.lastUpdate = new Date();
  }
  
  // Helper Functions
  async searchFiles(dir, pattern) {
    const results = [];
    
    async function walk(currentDir) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await walk(fullPath);
        } else if (entry.isFile() && entry.name.toLowerCase().includes(pattern.toLowerCase())) {
          results.push(fullPath);
        }
      }
    }
    
    await walk(dir);
    return results;
  }
  
  extractRelevantSection(content, keyword) {
    const lines = content.split('\n');
    const keywordLine = lines.findIndex(l => 
      l.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (keywordLine === -1) return '';
    
    const start = Math.max(0, keywordLine - 2);
    const end = Math.min(lines.length, keywordLine + 3);
    
    return lines.slice(start, end).join('\n');
  }
}

// Integration in Claude Service
class EnhancedClaudeService {
  constructor() {
    this.knowledgeSystem = new DynamicKnowledgeSystem();
    this.knowledgeSystem.watchForChanges(); // Start watching
  }
  
  async getSmartResponse(userId, message, context = {}) {
    // 1. Build dynamic prompt with real-time context
    const smartPrompt = await this.knowledgeSystem.buildSmartPrompt(
      this.baseSystemPrompt,
      message,
      userId
    );
    
    // 2. Search for relevant information
    const searchResults = await this.knowledgeSystem.searchAcrossProjects(message);
    
    // 3. Add search results to prompt
    if (searchResults.exact.length > 0) {
      smartPrompt += '\n\n## 🔍 GEFUNDENE INFORMATIONEN:\n';
      searchResults.exact.slice(0, 3).forEach(r => {
        smartPrompt += `\nAus ${r.project}/${r.file}:\n`;
        r.matches.forEach(m => smartPrompt += `> ${m}\n`);
      });
    }
    
    // 4. Make API call with enhanced prompt
    const response = await this.client.messages.create({
      model: this.currentModel,
      max_tokens: 2000,
      system: smartPrompt,
      messages: this.conversations.get(userId) || []
    });
    
    return response.content[0].text;
  }
}

module.exports = { 
  DynamicKnowledgeSystem,
  EnhancedClaudeService 
};
