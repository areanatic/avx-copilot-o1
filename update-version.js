#!/usr/bin/env node
// Setzt die Version basierend auf Git Tags oder Commits

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Versuche Git Version zu bekommen
  let version;
  try {
    // Zuerst Tags versuchen
    version = execSync('git describe --tags --always').toString().trim();
  } catch (e) {
    // Fallback zu Commit Hash
    version = execSync('git rev-parse --short HEAD').toString().trim();
  }
  
  // Update package.json
  const packagePath = path.join(__dirname, 'package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Behalte Major.Minor.Patch, füge Git Info hinzu
  const baseVersion = packageData.version.split('-')[0];
  packageData.version = `${baseVersion}-${version}`;
  
  fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
  console.log(`✅ Version updated to: ${packageData.version}`);
  
} catch (error) {
  console.error('❌ Error updating version:', error.message);
  process.exit(1);
}
