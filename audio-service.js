// AVX Copilot - Audio Transcription Service
// Handles voice messages with OpenAI Whisper API

const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const statsManager = require('./stats-manager');

class AudioService {
  constructor() {
    // Initialize OpenAI client if API key exists
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.isConfigured = true;
    } else {
      console.warn('⚠️ OPENAI_API_KEY not configured - Audio transcription disabled');
      this.isConfigured = false;
    }
    
    this.tempDir = path.join(__dirname, 'temp', 'audio');
    this.stats = {
      totalTranscriptions: 0,
      totalCost: 0,
      errors: 0,
      avgDuration: 0
    };
    
    this.init();
  }

  async init() {
    // Create temp directory if not exists
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      console.log('✅ Audio temp directory ready');
    } catch (err) {
      console.error('Failed to create audio temp dir:', err);
    }
  }

  // Download file from Telegram
  async downloadTelegramFile(fileLink) {
    const fileName = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.oga`;
    const filePath = path.join(this.tempDir, fileName);
    
    try {
      const response = await axios({
        method: 'GET',
        url: fileLink,
        responseType: 'stream',
        timeout: 30000 // 30 second timeout
      });

      const writer = require('fs').createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`✅ Audio downloaded: ${fileName}`);
          resolve(filePath);
        });
        writer.on('error', (err) => {
          console.error('Download error:', err);
          reject(err);
        });
      });
    } catch (error) {
      console.error('Failed to download audio:', error);
      throw error;
    }
  }

  // Transcribe audio using Whisper API
  async transcribeAudio(filePath, language = 'de') {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    const startTime = Date.now();
    
    try {
      // Get file stats for cost calculation
      const stats = await fs.stat(filePath);
      const fileSizeKB = stats.size / 1024;
      
      console.log(`🎙️ Transcribing audio: ${fileSizeKB.toFixed(2)}KB`);
      
      // Create read stream for file
      const audioFile = require('fs').createReadStream(filePath);
      
      // Call Whisper API
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: language, // 'de' for German, 'en' for English
        response_format: "json"
      });

      const duration = (Date.now() - startTime) / 1000;
      
      // Update stats
      this.stats.totalTranscriptions++;
      this.stats.totalCost += this.calculateCost(fileSizeKB);
      this.stats.avgDuration = 
        (this.stats.avgDuration * (this.stats.totalTranscriptions - 1) + duration) / 
        this.stats.totalTranscriptions;
      
      // Track in persistent stats
      const durationInMinutes = duration / 60;
      statsManager.trackVoiceMinutes(durationInMinutes);

      // Clean up temp file
      await this.cleanupFile(filePath);
      
      console.log(`✅ Transcription complete in ${duration.toFixed(2)}s`);
      
      return {
        success: true,
        text: transcription.text,
        duration: duration,
        cost: this.calculateCost(fileSizeKB)
      };
      
    } catch (error) {
      console.error('Transcription error:', error);
      this.stats.errors++;
      
      // Clean up on error too
      await this.cleanupFile(filePath);
      
      // Provide helpful error messages
      let errorMessage = error.message;
      if (error.response?.status === 401) {
        errorMessage = 'Invalid OpenAI API key';
      } else if (error.response?.status === 429) {
        errorMessage = 'OpenAI rate limit exceeded';
      } else if (error.response?.status === 413) {
        errorMessage = 'Audio file too large (max 25MB)';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Calculate cost based on file size (approximate)
  calculateCost(fileSizeKB) {
    // Whisper costs $0.006 per minute
    // Rough estimate: 1MB ≈ 1 minute of audio
    const estimatedMinutes = fileSizeKB / 1024;
    return estimatedMinutes * 0.006;
  }

  // Clean up temporary file
  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
      console.log('🧹 Temp file cleaned up');
    } catch (err) {
      console.warn('Failed to cleanup temp file:', err);
    }
  }

  // Main entry point for voice message processing
  async processVoiceMessage(fileLink, language = 'de') {
    try {
      // Download the file
      const filePath = await this.downloadTelegramFile(fileLink);
      
      // Transcribe it
      const result = await this.transcribeAudio(filePath, language);
      
      return result;
    } catch (error) {
      console.error('Voice processing error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error processing voice message'
      };
    }
  }

  // Get service stats
  getStats() {
    return {
      ...this.stats,
      isConfigured: this.isConfigured,
      estimatedMonthlyCost: (this.stats.totalCost * 30).toFixed(2)
    };
  }

  // Clean up old temp files (maintenance)
  async cleanupOldFiles() {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      let cleaned = 0;
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        // Remove files older than 1 hour
        if (now - stats.mtimeMs > 3600000) {
          await fs.unlink(filePath);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} old audio files`);
      }
    } catch (err) {
      console.warn('Cleanup error:', err);
    }
  }
}

// Export singleton instance
module.exports = new AudioService();
