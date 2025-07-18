// 📚 Knowledge Base Loader für AVX Copilot
const fs = require('fs').promises;
const path = require('path');

class KnowledgeLoader {
  constructor() {
    // Multiple Knowledge Sources
    this.knowledgePaths = {
      local: path.join(__dirname, 'knowledge'),
      claudiaAgent: '/Users/az/Documents/A+/AVX/Spaces/S1/Claudia_Agent_Development',
      umzugProjekt: '/Users/az/Documents/A+/AVX/Spaces/S1/Claudia_Agent_Development/02_Active_Agents/Active_Projects/A&A_Umzug_Elmshorn'
    };
    this.knowledgeData = {};
    this.s1Data = {};
  }

  // Lädt alle Knowledge Files beim Start
  async loadAllKnowledge() {
    console.log('📚 Lade Knowledge Base...');
    
    try {
      // 1. Lade lokale Knowledge Files
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
          const content = await fs.readFile(filePath, 'utf8');
          this.knowledgeData[file] = content;
          console.log(`✅ Geladen: ${file} (${content.length} Zeichen)`);
        } catch (error) {
          console.log(`⚠️  Konnte ${file} nicht laden:`, error.message);
        }
      }

      // 2. Lade S1 Claudia Agent Daten
      await this.loadS1Data();

      // 3. Lade Umzugsprojekt
      await this.loadUmzugsProjekt();

      // Erstelle Combined Knowledge
      const combinedKnowledge = this.createCombinedKnowledge();
      console.log(`📚 Knowledge Base geladen: ${combinedKnowledge.length} Zeichen total`);
      
      return combinedKnowledge;
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der Knowledge Base:', error);
      return '';
    }
  }

  // Lade S1 Claudia Agent Daten - JETZT VOLLSTÄNDIG
  async loadS1Data() {
    console.log('🗺️  Lade ALLE S1 Claudia Agent Daten...');
    
    try {
      // START_HERE Files
      const startHereFiles = [
        'SUPERBRAIN_ARCHITECTURE_DECISIONS.md',
        'SUPERBRAIN_TASK.md',
        'active_silos_index.md',
        'README.md'
      ];
      
      for (const file of startHereFiles) {
        try {
          const filePath = path.join(this.knowledgePaths.claudiaAgent, '00_START_HERE', file);
          const content = await fs.readFile(filePath, 'utf8');
          this.s1Data[`START_HERE_${file}`] = content;
          console.log(`✅ S1 geladen: ${file}`);
        } catch (error) {
          console.log(`⚠️  S1 ${file} nicht gefunden`);
        }
      }

      // ALLE Agent Context Files (nicht mehr begrenzt)
      const contextPath = path.join(this.knowledgePaths.claudiaAgent, '03_Databases_Knowledge/Agent_Context_Files');
      try {
        const files = await fs.readdir(contextPath);
        for (const file of files) {
          if (file.endsWith('.md')) {
            try {
              const content = await fs.readFile(path.join(contextPath, file), 'utf8');
              this.s1Data[`CONTEXT_${file}`] = content;
              console.log(`✅ Context geladen: ${file}`);
            } catch (e) {
              console.log(`⚠️  Fehler bei ${file}`);
            }
          }
        }
      } catch (error) {
        console.log('⚠️  Keine Agent Context Files gefunden');
      }

      // Lade ALLE Active Projects
      const projectsPath = path.join(this.knowledgePaths.claudiaAgent, '02_Active_Agents/Active_Projects');
      try {
        const projects = await fs.readdir(projectsPath);
        for (const project of projects) {
          const projectPath = path.join(projectsPath, project);
          const stats = await fs.stat(projectPath);
          
          if (stats.isDirectory()) {
            console.log(`📁 Lade Projekt: ${project}`);
            await this.loadProjectData(project, projectPath);
          }
        }
      } catch (error) {
        console.log('⚠️  Fehler beim Laden der Projekte:', error.message);
      }

      // Lade Master Templates
      const templatesPath = path.join(this.knowledgePaths.claudiaAgent, '01_Master_Templates');
      try {
        const templates = await fs.readdir(templatesPath);
        for (const template of templates.slice(0, 10)) { // Erste 10 Templates
          if (template.endsWith('.md')) {
            const content = await fs.readFile(path.join(templatesPath, template), 'utf8');
            this.s1Data[`TEMPLATE_${template}`] = content;
            console.log(`✅ Template geladen: ${template}`);
          }
        }
      } catch (error) {
        console.log('⚠️  Keine Templates gefunden');
      }

      console.log(`✅ S1 Daten vollständig geladen: ${Object.keys(this.s1Data).length} Files`);
      
    } catch (error) {
      console.error('⚠️  Fehler beim Laden der S1 Daten:', error.message);
    }
  }

  // Lädt komplettes Projekt
  async loadProjectData(projectName, projectPath) {
    try {
      // Lade README wenn vorhanden
      try {
        const readme = await fs.readFile(path.join(projectPath, 'README.md'), 'utf8');
        this.s1Data[`PROJECT_${projectName}_README`] = readme;
      } catch (e) {}

      // Lade AGENT_INSTRUCTION wenn vorhanden
      try {
        const instruction = await fs.readFile(path.join(projectPath, 'AGENT_INSTRUCTION.md'), 'utf8');
        this.s1Data[`PROJECT_${projectName}_INSTRUCTION`] = instruction;
      } catch (e) {}

      // Lade erste Ebene von Dokumenten
      const items = await fs.readdir(projectPath);
      for (const item of items) {
        if (item.endsWith('.md') && item !== 'README.md' && item !== 'AGENT_INSTRUCTION.md') {
          try {
            const content = await fs.readFile(path.join(projectPath, item), 'utf8');
            this.s1Data[`PROJECT_${projectName}_${item}`] = content;
          } catch (e) {}
        }
      }
    } catch (error) {
      console.log(`⚠️  Fehler beim Laden von Projekt ${projectName}`);
    }
  }

  // Lade Umzugsprojekt
  async loadUmzugsProjekt() {
    console.log('🏠 Lade Umzugsprojekt Elmshorn...');
    
    try {
      const umzugFiles = [
        '01_Projektdaten/Projekt_Status.md',
        '01_Projektdaten/Timeline_Meilensteine.md',
        'README.md'
      ];
      
      for (const file of umzugFiles) {
        try {
          const filePath = path.join(this.knowledgePaths.umzugProjekt, file);
          const content = await fs.readFile(filePath, 'utf8');
          this.s1Data[`UMZUG_${file.replace(/\//g, '_')}`] = content;
          console.log(`✅ Umzug geladen: ${file}`);
        } catch (error) {
          // Versuche ohne Unterordner
          try {
            const altPath = path.join(this.knowledgePaths.umzugProjekt, path.basename(file));
            const content = await fs.readFile(altPath, 'utf8');
            this.s1Data[`UMZUG_${path.basename(file)}`] = content;
            console.log(`✅ Umzug geladen: ${path.basename(file)}`);
          } catch (e) {
            console.log(`⚠️  Umzug ${file} nicht gefunden`);
          }
        }
      }
    } catch (error) {
      console.error('⚠️  Fehler beim Laden des Umzugsprojekts:', error.message);
    }
  }

  // Kombiniert alle Knowledge Files in einen Context
  createCombinedKnowledge() {
    let combined = `### 🧠 AVX COPILOT KNOWLEDGE BASE ###\n\n`;
    
    // WICHTIG: UMZUGSPROJEKT ELMSHORN
    combined += `## 🏠 UMZUGSPROJEKT ELMSHORN:\n`;
    if (this.s1Data['UMZUG_README.md'] || this.s1Data['UMZUG_Projekt_Status.md']) {
      combined += `- **Status**: Aktives Projekt - Umzug nach Elmshorn\n`;
      combined += `- **Personen**: Arash & Alina\n`;
      combined += `- **Location**: /S1/Claudia_Agent_Development/02_Active_Agents/Active_Projects/A&A_Umzug_Elmshorn\n`;
      combined += `- **Wichtige Dokumente**: Jobcenter Brief, Miete Infos, etc.\n\n`;
    } else {
      combined += `- **Info**: Umzugsprojekt-Daten in S1 vorhanden\n\n`;
    }
    
    // S1 CLAUDIA AGENT INFO
    if (Object.keys(this.s1Data).length > 0) {
      combined += `## 🤖 CLAUDIA AGENT (S1 - Herzstück):\n`;
      combined += `- **Superbrain Architektur**: Aktiv\n`;
      combined += `- **Knowledge Base**: Vollständig in S1\n`;
      combined += `- **Active Projects**: Mehrere inkl. Umzug\n`;
      combined += `- **Agent Context Files**: ${Object.keys(this.s1Data).filter(k => k.startsWith('CONTEXT_')).length} geladen\n\n`;
    }
    
    // Projekt Info aus PROJECT_PROTOCOL
    if (this.knowledgeData['PROJECT_PROTOCOL.md']) {
      const protocol = this.knowledgeData['PROJECT_PROTOCOL.md'];
      
      combined += `## AKTUELLE PROJEKTE:\n`;
      combined += `- **AVX Copilot Pro**: Telegram Bot (LIVE)\n`;
      combined += `- **Claudia Agent**: S1 Knowledge Base (Herzstück)\n`;
      combined += `- **Umzug Elmshorn**: Aktives Projekt\n`;
      combined += `- **GitHub**: https://github.com/areanatic/avx-copilot-o1\n`;
      combined += `- **Tech Stack**: Node.js, Telegraf, Claude AI\n\n`;
      
      // Letzte Updates
      const lastUpdates = protocol.match(/### \[2025.*?\].*?(?=###|\n\n|$)/gs);
      if (lastUpdates && lastUpdates.length > 0) {
        combined += `## LETZTE UPDATES:\n`;
        combined += lastUpdates.slice(-3).join('\n') + '\n\n';
      }
    }

    // Strategische Entscheidungen
    if (this.knowledgeData['STRATEGIC_DECISIONS.md']) {
      combined += `## STRATEGISCHE ENTSCHEIDUNGEN:\n`;
      const strategic = this.knowledgeData['STRATEGIC_DECISIONS.md'];
      
      if (strategic.includes('3-Tier Token System')) {
        combined += `- **Kostenoptimierung**: 3-Tier Token System (80% Ersparnis)\n`;
        combined += `- **Multi-Agent Architektur**: Geplant für v2\n`;
      }
      if (strategic.includes('Online-First')) {
        combined += `- **Storage**: Online-First mit Supabase\n`;
      }
      combined += `\n`;
    }

    // User-spezifische Infos ERWEITERT
    combined += `## USER CONTEXT:\n`;
    combined += `- **Name**: Arash Zamani\n`;
    combined += `- **Projekte**: AVX Copilot, Claudia Agent, Umzug Elmshorn\n`;
    combined += `- **Fokus**: Bot-Entwicklung, Knowledge Management, AI Integration, Umzugsplanung\n`;
    combined += `- **Tools**: VS Code mit MCP, Claude Desktop, Railway\n`;
    combined += `- **Location**: Aktuell unbekannt, Umzug nach Elmshorn geplant\n\n`;

    // Capabilities
    if (this.knowledgeData['CLAUDE_CAPABILITIES.md']) {
      combined += `## CAPABILITIES:\n`;
      combined += `- Git Push via Terminal (Desktop)\n`;
      combined += `- File System Access (S1 & S2)\n`;
      combined += `- Knowledge Base Management\n`;
      combined += `- Multi-Source Data Integration\n`;
      combined += `- Project-übergreifende Suche\n\n`;
    }

    return combined;
  }

  // Sucht nach spezifischen Infos
  async searchKnowledge(query) {
    const lowerQuery = query.toLowerCase();
    let results = [];

    for (const [file, content] of Object.entries(this.knowledgeData)) {
      if (content.toLowerCase().includes(lowerQuery)) {
        // Finde relevante Zeilen
        const lines = content.split('\n');
        const relevantLines = lines.filter(line => 
          line.toLowerCase().includes(lowerQuery)
        );
        
        results.push({
          file,
          matches: relevantLines.slice(0, 5) // Max 5 Matches pro File
        });
      }
    }

    return results;
  }

  // Beantwortet spezifische Fragen
  async answerQuestion(question) {
    const lowerQ = question.toLowerCase();
    
    // UMZUG FRAGEN
    if (lowerQ.includes('umzug') || lowerQ.includes('elmshorn') || lowerQ.includes('umziehen')) {
      return `🏠 **Umzugsprojekt Elmshorn:**
✅ Aktives Projekt: Umzug nach Elmshorn (Arash & Alina)
📁 Alle Dokumente in: S1/Claudia_Agent/A&A_Umzug_Elmshorn
📄 Wichtige Docs: Jobcenter Brief, Miete Infos
🗺️ Location: Elmshorn, Schleswig-Holstein
🔄 Status: In Planung/Durchführung

💡 Für Details: Frage nach spezifischen Dokumenten oder Timeline!`;
    }
    
    // Projekt-bezogene Fragen
    if (lowerQ.includes('projekt') || lowerQ.includes('arbeite') || lowerQ.includes('was mach')) {
      return `Du arbeitest aktuell an:

🚀 **AVX Copilot Pro** - Telegram Bot (LIVE)
- Status: Läuft auf Railway
- Features: Knowledge Base, AI Integration
- GitHub: github.com/areanatic/avx-copilot-o1

🤖 **Claudia Agent** - S1 Knowledge Base
- Das Herzstück deiner Wissensdatenbank
- Superbrain Architektur
- Alle historischen Daten

🏠 **Umzug Elmshorn** - Aktives Projekt
- Umzugsplanung für dich & Alina
- Dokumente, Behörden, Timeline
- Location: Elmshorn, Schleswig-Holstein`;
    }
    
    // Status Fragen
    if (lowerQ.includes('status')) {
      return `📊 **Aktueller Status:**

✅ **Bot**: Läuft stabil als @avx_copilot_pro_bot
✅ **Knowledge**: S1 & S2 Daten integriert
✅ **Version**: 1.1.0 mit Dashboard
🏠 **Umzug**: Aktiv in Planung
🔄 **In Arbeit**: Neues Menü, bessere Integration`;
    }
    
    // Features Fragen
    if (lowerQ.includes('feature') || lowerQ.includes('kann')) {
      return `Der Bot kann jetzt:
🏠 Umzugsprojekt-Infos abrufen
🤖 S1 Claudia Agent Daten nutzen
📚 Projektübergreifende Knowledge Base
🤖 Mit Claude AI kommunizieren
📋 Aufgaben & Projekte verwalten
🔍 Multi-Source Suche
💡 Personalisierte Antworten`;
    }
    
    // Wer bin ich / Name
    if (lowerQ.includes('wer bin ich') || lowerQ.includes('mein name')) {
      return `Du bist **Arash Zamani**
💼 Projektleiter für AVX Copilot & Claudia Agent
🏠 Planst Umzug nach Elmshorn mit Alina
💻 Nutzt VS Code mit MCP, Claude Desktop
🚀 Fokus: AI Integration, Knowledge Management`;
    }

    return null; // Keine spezifische Antwort gefunden
  }
}

module.exports = new KnowledgeLoader();