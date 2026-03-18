#!/usr/bin/env node
/**
 * Script to check if the installed pnpm version matches the version specified in package.json
 * This helps ensure consistency in pnpm-lock.yaml formatting across different environments
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

try {
  // Read package.json
  const packageJsonPath = join(rootDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  
  // Get expected pnpm version from packageManager field
  const packageManager = packageJson.packageManager;
  if (!packageManager) {
    console.error('❌ Error: No packageManager field found in package.json');
    process.exit(1);
  }
  
  if (!packageManager.startsWith('pnpm@')) {
    console.error(`❌ Error: packageManager is not pnpm: ${packageManager}`);
    process.exit(1);
  }
  
  // Extract version: "pnpm@10.20.0" -> "10.20.0"
  // The packageManager field format is strictly "package@version"
  // Additional @ symbols are not part of the standard spec
  const parts = packageManager.split('@');
  if (parts.length !== 2) {
    console.error('❌ Error: Invalid packageManager format');
    console.error(`   Expected format: pnpm@x.y.z (e.g., pnpm@10.20.0)`);
    console.error(`   Actual value: ${packageManager}`);
    console.error(`   Note: The packageManager field should contain exactly one @ separator`);
    process.exit(1);
  }
  
  const expectedVersion = parts[1].trim();
  
  if (!expectedVersion) {
    console.error('❌ Error: Could not parse pnpm version from packageManager field');
    console.error(`   packageManager value: ${packageManager}`);
    process.exit(1);
  }
  
  // Get actual pnpm version
  let actualVersion;
  try {
    actualVersion = execSync('pnpm --version', { encoding: 'utf-8' }).trim();
  } catch {
    console.error('❌ Error: pnpm is not installed or not found in PATH');
    console.error('\nTo fix this issue:');
    console.error('1. Enable corepack: corepack enable');
    console.error('2. Or install pnpm globally: npm install -g pnpm@' + expectedVersion);
    process.exit(1);
  }
  
  // Compare versions
  if (actualVersion !== expectedVersion) {
    console.error(`❌ pnpm version mismatch!`);
    console.error(`   Expected: ${expectedVersion} (from package.json packageManager field)`);
    console.error(`   Actual:   ${actualVersion}`);
    console.error('');
    console.error('This mismatch can cause pnpm-lock.yaml format inconsistencies.');
    console.error('');
    console.error('To fix this issue:');
    console.error('');
    console.error('Option 1 - Use corepack (recommended):');
    console.error('  corepack enable');
    console.error('  corepack prepare pnpm@' + expectedVersion + ' --activate');
    console.error('');
    console.error('Option 2 - Install the correct pnpm version globally:');
    console.error('  npm install -g pnpm@' + expectedVersion);
    console.error('');
    process.exit(1);
  }
  
  console.log(`✅ pnpm version check passed: ${actualVersion}`);
  process.exit(0);
  
} catch (error) {
  console.error('❌ Error checking pnpm version:', error.message);
  process.exit(1);
}
