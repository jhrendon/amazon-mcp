#!/usr/bin/env node

/**
 * Script para versionar paquetes
 * Uso: node scripts/version.js <version> [--dry-run]
 * Ejemplo: node scripts/version.js 0.2.0
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const version = args.find(arg => !arg.startsWith('--'));

if (!version) {
  console.error('❌ Error: Version is required');
  console.error('Usage: node scripts/version.js <version> [--dry-run]');
  console.error('Example: node scripts/version.js 0.2.0');
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('❌ Error: Version must be in format X.Y.Z (e.g., 0.2.0)');
  process.exit(1);
}

function updatePackageVersion(packagePath, packageName) {
  console.log(`\n📝 Updating ${packageName} to version ${version}...`);
  
  const packageJsonPath = join(packagePath, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  
  packageJson.version = version;
  
  // Update workspace dependency version
  if (packageJson.dependencies && packageJson.dependencies['amazon-mcp-common']) {
    packageJson.dependencies['amazon-mcp-common'] = `workspace:*`;
  }
  
  if (isDryRun) {
    console.log(`   [DRY RUN] Would update ${packageName} to ${version}`);
    return;
  }
  
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✅ Updated ${packageName} to ${version}`);
}

console.log('🏷️  Starting version update process...\n');
console.log(`Target version: ${version}`);

if (isDryRun) {
  console.log('\n⚠️  DRY RUN MODE - No files will be modified\n');
}

// Update versions
updatePackageVersion('packages/amazon-mcp-common', 'amazon-mcp-common');
updatePackageVersion('packages/amazon-ads-mcp', 'amazon-ads-mcp');

if (!isDryRun) {
  console.log('\n📦 Committing changes...');
  try {
    execSync('git add packages/*/package.json', { stdio: 'inherit' });
    execSync(`git commit -m "chore: bump version to ${version}"`, { stdio: 'inherit' });
    execSync(`git tag v${version}`, { stdio: 'inherit' });
    console.log(`\n✅ Created tag v${version}`);
    console.log('\n📤 To publish, run:');
    console.log(`   git push origin main --tags`);
    console.log('\n   Or use: node scripts/publish.js');
  } catch (error) {
    console.error('❌ Failed to commit changes:', error.message);
    process.exit(1);
  }
}

console.log('\n✨ Version update complete!');
