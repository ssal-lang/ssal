import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const projectRoot = path.join(__dirname, '..');
const binDir = path.join(projectRoot, 'bin');
const cliFile = path.join(binDir, 'ssal.js');
const packageJson = path.join(projectRoot, 'package.json');
const packageJsonDest = path.join(binDir, 'package.json');

// Ensure bin directory exists
console.log('Ensuring bin directory exists...');
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
  console.log('Created bin directory');
}

// Check if CLI file exists (should be created by the TypeScript compiler)
if (!fs.existsSync(cliFile)) {
  console.log('Warning: CLI file not found at:', cliFile);
  console.log('Make sure your TypeScript configuration is correctly set up to output to the bin directory');
} else {
  console.log('CLI file found, preparing for execution...');
  
  // Read the file content
  let content = fs.readFileSync(cliFile, 'utf8');
  
  // Add shebang if not already present
  if (!content.startsWith('#!/usr/bin/env node')) {
    content = '#!/usr/bin/env node\n' + content;
    fs.writeFileSync(cliFile, content);
    console.log('Added shebang to CLI file');
  }
  
  // Make the file executable on Unix-like systems
  try {
    if (process.platform !== 'win32') {
      fs.chmodSync(cliFile, '755');
      console.log('Made CLI file executable');
    }
  } catch (error) {
    console.log('Note: Could not change file permissions. This is normal on Windows systems.');
  }
}

// Copy package.json to bin directory for version information
console.log('Copying package.json for version information...');
try {
  // Read package.json and create a minimal version with just name, version, and description
  const packageData = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  const minimalPackage = {
    name: packageData.name,
    version: packageData.version,
    description: packageData.description
  };
  
  fs.writeFileSync(packageJsonDest, JSON.stringify(minimalPackage, null, 2));
  console.log('Copied minimal package.json to bin directory');
} catch (error) {
  console.error('Failed to copy package.json:', error);
}

console.log('CLI preparation complete!');