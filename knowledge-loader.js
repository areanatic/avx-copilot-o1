// 📚 Knowledge Base Loader für AVX Copilot
const fs = require('fs').promises;
const path = require('path');

class KnowledgeLoader {
  constructor() {
    this.knowledgePath = path.join(__dirname, 'knowledge');
    this.knowledgeData = {};
  }

  // Lädt alle Knowledge Files beim Start
  async loadAllKnowledge() {
    console.log('📚 Lade Knowledge Base...');
    
    try {
      // Definiere wichtige Knowledge Files
      const knowledgeFiles = [
        'PROJECT_PROTOCOL.md',
        'STRATEGIC_DECISIONS.md',
        'CLAUDE_CAPABILITIES.md',
        'VERSIONING_SYSTEM.md',
        'MIGRATION_PROTOCOL.md'
      ];

      // Lade jede Datei
      for (const file of knowledgeFiles) {
        try {
          const filePath = path.join(this.knowledgePath, file);
          const content = await fs.readFile(filePath, 'utf8');
          this.knowledgeData[file] = content;
          console.log(`✅ Geladen: ${file} (${content.length} Zeichen)`);
        } catch (error) {
          console.log(`⚠️  Konnte ${file} nicht laden:`, error.message);
        }
      }

      // Erstelle Combined Knowledge
      const combinedKnowledge = this.createCombinedKnowledge();
      console.log(`📚 Knowledge Base geladen: ${combinedKnowledge.length} Zeichen total`);
      
      return combinedKnowledge;
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der Knowledge Base:', error);
      return '';
    }
  }

  // Kombiniert alle Knowledge Files in einen Context
  createCombinedKnowledge() {
    let combined = `### 🧠 AVX COPILOT KNOWLEDGE BASE ###\n\n`;
    
    // Projekt Info aus PROJECT_PROTOCOL
    if (this.knowledgeData['PROJECT_PROTOCOL.md']) {
      const protocol = this.knowledgeData['PROJECT_PROTOCOL.md'];
      
      // Extrahiere wichtige Infos
      combined += `## AKTUELLE PROJEKTE:\n`;
      combined += `- **Hauptprojekt**: AVX Copilot Pro (Telegram Bot)\n`;
      combined += `- **GitHub**: https://github.com/areanatic/avx-copilot-o1\n`;
      combined += `- **Status**: LIVE auf Railway\n`;
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
      
      // Extrahiere Key Points
      if (strategic.includes('3-Tier Token System')) {
        combined += `- **Kostenoptimierung**: 3-Tier Token System (80% Ersparnis)\n`;
        combined += `- **Multi-Agent Architektur**: Geplant für v2\n`;
      }
      if (strategic.includes('Online-First')) {
        combined += `- **Storage**: Online-First mit Supabase\n`;
      }
      combined += `\n`;
    }

    // User-spezifische Infos
    combined += `## USER CONTEXT:\n`;
    combined += `- **Name**: Arash (Projektleiter)\n`;
    combined += `- **Arbeitet an**: AVX Copilot Pro - AI Assistant für Telegram\n`;
    combined += `- **Fokus**: Bot-Entwicklung, Knowledge Management, AI Integration\n`;
    combined += `- **Tools**: VS Code mit MCP, Claude Desktop, Railway für Deployment\n\n`;

    // Capabilities
    if (this.knowledgeData['CLAUDE_CAPABILITIES.md']) {
      combined += `## CAPABILITIES:\n`;
      combined += `- Git Push via Terminal (Desktop)\n`;
      combined += `- File System Access\n`;
      combined += `- Knowledge Base Management\n`;
      combined += `- Multi-Agent Architektur (geplant)\n\n`;
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
    
    // Projekt-bezogene Fragen
    if (lowerQ.includes('projekt') || lowerQ.includes('arbeite')) {
      return `Du arbeitest aktuell an:
🚀 **AVX Copilot Pro** - Ein intelligenter AI Assistant für Telegram
- Status: LIVE und deployed auf Railway
- Features: Multi-Button Interface, Claude AI Integration, Knowledge Management
- GitHub: https://github.com/areanatic/avx-copilot-o1
- Nächste Schritte: Multi-Agent System, Supabase Integration`;
    }
    
    // Status Fragen
    if (lowerQ.includes('status')) {
      return `📊 **Aktueller Status:**
✅ Bot läuft stabil als @avx_copilot_pro_bot
✅ Alle Features funktionieren
✅ Letzte Updates: Knowledge Base Integration, Button Interface
🔄 In Arbeit: Automatisches Knowledge Loading`;
    }
    
    // Features Fragen
    if (lowerQ.includes('feature') || lowerQ.includes('kann')) {
      return `Der Bot kann:
📋 Aufgaben verwalten
🤖 Mit Claude AI kommunizieren
📚 Knowledge Base durchsuchen
📝 Notizen speichern
🔍 Informationen suchen
⚙️ Einstellungen anpassen`;
    }

    return null; // Keine spezifische Antwort gefunden
  }
}

module.exports = new KnowledgeLoader();