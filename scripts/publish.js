#!/usr/bin/env node

/**
 * Script para publicar paquetes en npm
 * Uso: node scripts/publish.js [--dry-run]
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const isDryRun = process.argv.includes('--dry-run');

function getPackageVersion(packagePath) {
  const packageJson = JSON.parse(readFileSync(join(packagePath, 'package.json'), 'utf-8'));
  return packageJson.version;
}

function publishPackage(packagePath, packageName) {
  console.log(`\n📦 Publishing ${packageName}...`);
  
  const version = getPackageVersion(packagePath);
  console.log(`   Version: ${version}`);
  
  if (isDryRun) {
    console.log(`   [DRY RUN] Would publish ${packageName}@${version}`);
    return;
  }
  
  try {
    execSync(`cd ${packagePath} && pnpm publish --access public`, {
      stdio: 'inherit',
    });
    console.log(`✅ Successfully published ${packageName}@${version}`);
  } catch (error) {
    console.error(`❌ Failed to publish ${packageName}:`, error.message);
    process.exit(1);
  }
}

console.log('🚀 Starting npm publish process...\n');

if (isDryRun) {
  console.log('⚠️  DRY RUN MODE - No packages will be published\n');
}

// Publish in order (common first, then ads)
publishPackage('packages/amazon-mcp-common', 'amazon-mcp-common');
publishPackage('packages/amazon-ads-mcp', 'amazon-ads-mcp');

console.log('\n✨ All packages published successfully!');
