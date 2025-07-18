// AVX Copilot - Audio Cleanup Script
// Runs periodically to clean up old temporary audio files

const audioService = require('./audio-service');

// Run cleanup every hour
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

console.log('🧹 Audio Cleanup Service started');
console.log(`Cleaning up old files every ${CLEANUP_INTERVAL / 1000 / 60} minutes`);

// Initial cleanup
audioService.cleanupOldFiles().then(() => {
  console.log('✅ Initial cleanup complete');
});

// Schedule periodic cleanup
setInterval(async () => {
  console.log(`🧹 Running scheduled cleanup at ${new Date().toISOString()}`);
  await audioService.cleanupOldFiles();
}, CLEANUP_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Cleanup service stopping...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cleanup service stopping...');
  process.exit(0);
});
