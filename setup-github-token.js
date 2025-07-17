#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔐 GitHub Token Setup für AVX Copilot\n');

rl.question('Füge deinen GitHub Token ein (ghp_...): ', (token) => {
    if (!token || !token.startsWith('ghp_')) {
        console.log('❌ Ungültiger Token! GitHub Tokens starten mit "ghp_"');
        rl.close();
        return;
    }

    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Ersetze den Platzhalter
    envContent = envContent.replace('your_github_token_here', token);
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ GitHub Token wurde erfolgreich gespeichert!');
    console.log('📝 Token wurde in .env gespeichert');
    console.log('🔒 Die .env Datei ist bereits in .gitignore');
    
    rl.close();
});
