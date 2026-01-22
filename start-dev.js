#!/usr/bin/env node
// Start dev server - bypass PowerShell execution policy
const { execSync } = require('child_process');

try {
  execSync('npm run dev', { 
    cwd: process.cwd(),
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Dev server error:', error.message);
  process.exit(1);
}
