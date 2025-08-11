#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const MemberstackIndexer = require('../src/indexer');

async function buildIndex() {
  console.log('Building Memberstack documentation index...');
  
  const indexer = new MemberstackIndexer();
  const docPath = path.join(__dirname, '..', 'docs', 'memberstack-complete.md');
  const indexPath = path.join(__dirname, '..', 'docs', 'memberstack-index.json');
  
  try {
    const index = await indexer.buildFromFile(docPath);
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    console.log(`✓ Index generated with ${index.totalMethods} methods`);
    console.log(`✓ Saved to ${indexPath}`);
  } catch (error) {
    console.error('Error building index:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  buildIndex();
}

module.exports = buildIndex;