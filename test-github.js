#!/usr/bin/env node

require('dotenv').config();
const { Octokit } = require('@octokit/rest');

async function testGitHubConnection() {
    console.log('🔍 Teste GitHub Verbindung...\n');
    
    try {
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        // Teste die Verbindung
        const { data: user } = await octokit.users.getAuthenticated();
        console.log('✅ Verbindung erfolgreich!');
        console.log(`👤 Eingeloggt als: ${user.login}`);
        console.log(`📧 Email: ${user.email || 'Nicht öffentlich'}`);
        
        // Hole Repository Info
        const { data: repo } = await octokit.repos.get({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO
        });
        
        console.log(`\n📦 Repository: ${repo.full_name}`);
        console.log(`🌟 Stars: ${repo.stargazers_count}`);
        console.log(`🔀 Default Branch: ${repo.default_branch}`);
        console.log(`🔗 URL: ${repo.html_url}`);
        
    } catch (error) {
        console.error('❌ Fehler:', error.message);
        if (error.status === 401) {
            console.log('Token ist ungültig oder abgelaufen!');
        }
    }
}

testGitHubConnection();
