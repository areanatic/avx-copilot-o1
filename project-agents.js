// 🤖 Project Agents Manager - Custom Instruction Prompts
const fs = require('fs').promises;
const path = require('path');

class ProjectAgentsManager {
  constructor() {
    this.agents = new Map();
    this.activeAgent = null;
    this.agentsPath = '/Users/az/Documents/A+/AVX/Spaces/S1/Claudia_Agent_Development/02_Active_Agents/Active_Projects';
    this.defaultPrompt = `Du bist ein hilfreicher AI Assistant. Beantworte Fragen präzise und freundlich.`;
  }

  // Lädt alle Projekt-Agents beim Start
  async loadAllAgents() {
    console.log('🤖 Lade Projekt-Agents...');
    
    try {
      const projects = await fs.readdir(this.agentsPath);
      
      for (const project of projects) {
        const projectPath = path.join(this.agentsPath, project);
        const stats = await fs.stat(projectPath);
        
        if (stats.isDirectory()) {
          // Suche nach AGENT_INSTRUCTION.md
          const instructionPath = path.join(projectPath, 'AGENT_INSTRUCTION.md');
          let instructionPrompt = this.defaultPrompt;
          
          try {
            instructionPrompt = await fs.readFile(instructionPath, 'utf8');
            console.log(`✅ Agent geladen: ${project}`);
          } catch (e) {
            console.log(`⚠️  Kein Instruction Prompt für ${project}, nutze Default`);
          }
          
          // Erstelle Agent
          this.agents.set(project, {
            name: project,
            path: projectPath,
            instructionPath,
            instructionPrompt,
            created: stats.birthtime,
            lastModified: stats.mtime,
            stats: { uses: 0, lastUsed: null }
          });
        }
      }
      
      console.log(`🤖 ${this.agents.size} Projekt-Agents geladen`);
      return Array.from(this.agents.values());
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der Agents:', error);
      return [];
    }
  }

  // Erstellt neuen Agent
  async createAgent(name, instructionPrompt) {
    const agentPath = path.join(this.agentsPath, name);
    const instructionPath = path.join(agentPath, 'AGENT_INSTRUCTION.md');
    
    try {
      // Erstelle Verzeichnis
      await fs.mkdir(agentPath, { recursive: true });
      
      // Speichere Instruction Prompt
      await fs.writeFile(instructionPath, instructionPrompt, 'utf8');
      
      // Erstelle Standard-Struktur
      await fs.mkdir(path.join(agentPath, 'Dokumente'), { recursive: true });
      await fs.mkdir(path.join(agentPath, 'Notizen'), { recursive: true });
      
      // Erstelle README
      const readme = `# ${name} - Projekt Agent

## Beschreibung
Dieser Agent wurde am ${new Date().toLocaleDateString('de-DE')} erstellt.

## Instruction Prompt
Der Agent folgt den Anweisungen in AGENT_INSTRUCTION.md

## Struktur
- /Dokumente - Projektdokumente
- /Notizen - Projektnotizen
- AGENT_INSTRUCTION.md - Agent Verhalten
`;
      
      await fs.writeFile(path.join(agentPath, 'README.md'), readme, 'utf8');
      
      // Registriere Agent
      const agent = {
        name,
        path: agentPath,
        instructionPath,
        instructionPrompt,
        created: new Date(),
        lastModified: new Date(),
        stats: { uses: 0, lastUsed: null }
      };
      
      this.agents.set(name, agent);
      
      return { success: true, agent };
      
    } catch (error) {
      return { error: error.message };
    }
  }

  // Wechselt aktiven Agent
  async switchAgent(name) {
    const agent = this.agents.get(name);
    if (!agent) {
      return { error: 'Agent nicht gefunden!' };
    }
    
    this.activeAgent = agent;
    agent.stats.uses++;
    agent.stats.lastUsed = new Date();
    
    return { 
      success: true, 
      agent: {
        name: agent.name,
        instructionPrompt: agent.instructionPrompt.substring(0, 200) + '...'
      }
    };
  }

  // Aktualisiert Instruction Prompt
  async updateInstructionPrompt(agentName, newPrompt) {
    const agent = this.agents.get(agentName);
    if (!agent) {
      return { error: 'Agent nicht gefunden!' };
    }
    
    try {
      // Backup
      const backupPath = agent.instructionPath + '.backup_' + Date.now();
      await fs.writeFile(backupPath, agent.instructionPrompt, 'utf8');
      
      // Update
      await fs.writeFile(agent.instructionPath, newPrompt, 'utf8');
      agent.instructionPrompt = newPrompt;
      agent.lastModified = new Date();
      
      return { success: true, backupPath };
      
    } catch (error) {
      return { error: error.message };
    }
  }

  // Holt aktuellen System Prompt für Claude
  getSystemPrompt(baseKnowledge) {
    if (!this.activeAgent) {
      return baseKnowledge + '\n\n' + this.defaultPrompt;
    }
    
    return baseKnowledge + '\n\n## AGENT INSTRUCTION:\n' + this.activeAgent.instructionPrompt;
  }

  // Liste alle Agents
  listAgents() {
    return Array.from(this.agents.values()).map(agent => ({
      name: agent.name,
      active: this.activeAgent?.name === agent.name,
      uses: agent.stats.uses,
      lastUsed: agent.stats.lastUsed,
      created: agent.created
    }));
  }

  // Holt Agent Details
  getAgentDetails(name) {
    return this.agents.get(name);
  }
}

module.exports = new ProjectAgentsManager();