// 🤖 Model Switcher - Dynamic AI model selection with cost tracking
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

class ModelSwitcher {
  constructor() {
    // Initialize Claude client
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
    
    // Model configurations
    this.models = {
      haiku: {
        id: 'claude-3-haiku-20240307',
        name: 'Claude Haiku',
        icon: '💨',
        description: 'Schnell & günstig für einfache Aufgaben',
        costPer1M: {
          input: 0.25,
          output: 1.25
        },
        maxTokens: 4096,
        speed: 'fast',
        quality: 'basic',
        useCases: ['Kurze Antworten', 'Listen', 'Einfache Fragen']
      },
      sonnet: {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude Sonnet',
        icon: '🎭',
        description: 'Ausgewogen für die meisten Aufgaben',
        costPer1M: {
          input: 3,
          output: 15
        },
        maxTokens: 4096,
        speed: 'balanced',
        quality: 'good',
        useCases: ['Analyse', 'Coding', 'Detaillierte Antworten']
      },
      opus: {
        id: 'claude-3-opus-20240229',
        name: 'Claude Opus',
        icon: '🎨',
        description: 'Maximum Power für komplexe Aufgaben',
        costPer1M: {
          input: 15,
          output: 75
        },
        maxTokens: 4096,
        speed: 'slow',
        quality: 'excellent',
        useCases: ['Komplexe Analyse', 'Kreatives Schreiben', 'Forschung']
      }
    };
    
    // Default model
    this.currentModel = 'haiku';
    
    // User preferences (persisted per user)
    this.userPreferences = new Map();
    
    // Cost tracking
    this.costTracking = {
      total: 0,
      byModel: {
        haiku: 0,
        sonnet: 0,
        opus: 0
      },
      byUser: new Map()
    };
    
    // Usage statistics
    this.usage = {
      total: 0,
      byModel: {
        haiku: 0,
        sonnet: 0,
        opus: 0
      }
    };
  }
  
  // Set active model
  setModel(modelKey, userId = null) {
    if (!this.models[modelKey]) {
      throw new Error(`Unknown model: ${modelKey}`);
    }
    
    this.currentModel = modelKey;
    
    // Save user preference
    if (userId) {
      this.userPreferences.set(userId, modelKey);
    }
    
    console.log(`🤖 Model switched to: ${this.models[modelKey].name}`);
    return this.getModelInfo(modelKey);
  }
  
  // Get model for user (checks preferences)
  getModelForUser(userId) {
    if (this.userPreferences.has(userId)) {
      return this.userPreferences.get(userId);
    }
    return this.currentModel;
  }
  
  // Get model info
  getModelInfo(modelKey = null) {
    const key = modelKey || this.currentModel;
    const model = this.models[key];
    
    return {
      key,
      ...model,
      estimatedCost: this.estimateCost(1000, key) // Cost for 1000 tokens
    };
  }
  
  // Get all models with info
  getAllModels() {
    return Object.entries(this.models).map(([key, model]) => ({
      key,
      ...model,
      isCurrent: key === this.currentModel,
      estimatedCost: this.estimateCost(1000, key)
    }));
  }
  
  // Estimate cost for tokens
  estimateCost(tokens, modelKey = null) {
    const key = modelKey || this.currentModel;
    const model = this.models[key];
    
    const inputCost = (tokens / 1000000) * model.costPer1M.input;
    const outputCost = (tokens / 1000000) * model.costPer1M.output;
    
    return {
      input: `$${inputCost.toFixed(6)}`,
      output: `$${outputCost.toFixed(6)}`,
      total: `$${(inputCost + outputCost).toFixed(6)}`
    };
  }
  
  // Get response with selected model
  async getResponse(userId, message, systemPrompt, modelOverride = null) {
    const modelKey = modelOverride || this.getModelForUser(userId) || this.currentModel;
    const model = this.models[modelKey];
    
    try {
      console.log(`🤖 Using ${model.name} for user ${userId}`);
      
      const response = await this.client.messages.create({
        model: model.id,
        max_tokens: model.maxTokens,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }]
      });
      
      // Track usage
      this.trackUsage(modelKey, response.usage, userId);
      
      return {
        content: response.content[0].text,
        model: modelKey,
        usage: response.usage
      };
      
    } catch (error) {
      console.error(`❌ Error with ${model.name}:`, error);
      
      // Fallback to cheaper model on error
      if (modelKey === 'opus' && error.status === 429) {
        console.log('📉 Falling back to Sonnet due to rate limit...');
        return this.getResponse(userId, message, systemPrompt, 'sonnet');
      }
      
      throw error;
    }
  }
  
  // Track usage and costs
  trackUsage(modelKey, usage, userId) {
    if (!usage) return;
    
    const model = this.models[modelKey];
    const inputCost = (usage.input_tokens / 1000000) * model.costPer1M.input;
    const outputCost = (usage.output_tokens / 1000000) * model.costPer1M.output;
    const totalCost = inputCost + outputCost;
    
    // Update total costs
    this.costTracking.total += totalCost;
    this.costTracking.byModel[modelKey] += totalCost;
    
    // Update user costs
    const userCosts = this.costTracking.byUser.get(userId) || 0;
    this.costTracking.byUser.set(userId, userCosts + totalCost);
    
    // Update usage counts
    this.usage.total++;
    this.usage.byModel[modelKey]++;
    
    console.log(`💰 Cost: $${totalCost.toFixed(6)} (${usage.input_tokens}+${usage.output_tokens} tokens)`);
  }
  
  // Get cost statistics
  getCostStats(userId = null) {
    const stats = {
      totalCost: `$${this.costTracking.total.toFixed(4)}`,
      byModel: {},
      usage: this.usage
    };
    
    // Add model costs
    for (const [key, cost] of Object.entries(this.costTracking.byModel)) {
      stats.byModel[key] = `$${cost.toFixed(4)}`;
    }
    
    // Add user-specific stats if requested
    if (userId && this.costTracking.byUser.has(userId)) {
      stats.userCost = `$${this.costTracking.byUser.get(userId).toFixed(4)}`;
    }
    
    return stats;
  }
  
  // Auto-select model based on query complexity
  autoSelectModel(message) {
    const messageLength = message.length;
    const hasCode = /```[\s\S]*```/.test(message);
    const isQuestion = message.includes('?');
    const isComplex = messageLength > 500 || hasCode;
    
    if (isComplex) {
      return 'sonnet'; // Complex queries need better model
    } else if (isQuestion && messageLength < 100) {
      return 'haiku'; // Simple questions can use fast model
    } else {
      return 'haiku'; // Default to cheap for most cases
    }
  }
  
  // Get model recommendation
  getRecommendation(taskType) {
    const recommendations = {
      'simple_qa': 'haiku',
      'code_generation': 'sonnet',
      'complex_analysis': 'opus',
      'creative_writing': 'opus',
      'data_extraction': 'haiku',
      'summarization': 'sonnet',
      'translation': 'haiku'
    };
    
    return recommendations[taskType] || 'sonnet';
  }
  
  // Format model menu for Telegram
  getModelMenu() {
    const models = this.getAllModels();
    const buttons = models.map(model => ({
      text: `${model.icon} ${model.name} ${model.isCurrent ? '✓' : ''}`,
      callback_data: `model_${model.key}`
    }));
    
    return {
      inline_keyboard: [
        buttons,
        [{ text: '💰 Kosten-Statistik', callback_data: 'model_stats' }],
        [{ text: '🔙 Zurück', callback_data: 'back_main' }]
      ]
    };
  }
  
  // Reset cost tracking (admin only)
  resetCosts() {
    this.costTracking = {
      total: 0,
      byModel: {
        haiku: 0,
        sonnet: 0,
        opus: 0
      },
      byUser: new Map()
    };
    console.log('💰 Cost tracking reset');
  }
}

// Singleton export
module.exports = new ModelSwitcher();
