// Test Script für neue Features
const fileEditor = require('./telegram-file-editor');
const projectAgents = require('./project-agents');

async function testFeatures() {
  console.log('🧪 Testing File Editor...');
  
  // Test File Editor
  const files = await fileEditor.listEditableFiles('/Users/az/Documents/A+/AVX/Spaces/S2');
  console.log(`✅ Found ${files.length} editable files`);
  
  // Test Project Agents
  console.log('\n🧪 Testing Project Agents...');
  const agents = await projectAgents.loadAllAgents();
  console.log(`✅ Loaded ${agents.length} agents`);
  
  agents.forEach(agent => {
    console.log(`  - ${agent.name} (${agent.stats.uses} uses)`);
  });
  
  console.log('\n✅ All tests passed!');
}

testFeatures().catch(console.error);
