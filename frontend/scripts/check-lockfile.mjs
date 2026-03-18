#!/usr/bin/env node
/**
 * Script to check if pnpm-lock.yaml has been modified without corresponding package.json changes
 * This helps detect unintended lockfile format changes that can occur from version mismatches
 */

import { execSync } from 'child_process';

try {
  // Check if we're in a git repository
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch {
    console.log('⚠️  Not in a git repository, skipping lockfile check');
    process.exit(0);
  }

  // Get list of staged files
  let stagedFiles;
  try {
    stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' }).trim();
  } catch {
    // No staged files
    console.log('✅ No staged files to check');
    process.exit(0);
  }

  if (!stagedFiles) {
    console.log('✅ No staged files to check');
    process.exit(0);
  }

  const stagedFileList = stagedFiles.split('\n').filter(Boolean);
  const hasLockfileChange = stagedFileList.includes('pnpm-lock.yaml');
  const hasPackageJsonChange = stagedFileList.includes('package.json');

  if (hasLockfileChange && !hasPackageJsonChange) {
    console.warn('⚠️  Warning: pnpm-lock.yaml is being committed without package.json changes');
    console.warn('');
    console.warn('This might indicate:');
    console.warn('1. A pnpm version mismatch causing lockfile format changes');
    console.warn('2. An unintended dependency resolution change');
    console.warn('');
    console.warn('Please verify:');
    console.warn('- Run: node scripts/check-pnpm-version.mjs');
    console.warn('- Ensure you are using the correct pnpm version specified in package.json');
    console.warn('- Review the lockfile changes carefully');
    console.warn('');
    console.warn('If this is intentional (e.g., fixing a corrupted lockfile), you can proceed.');
    console.warn('');
    // Don't exit with error, just warn
  } else if (hasLockfileChange && hasPackageJsonChange) {
    console.log('✅ Both package.json and pnpm-lock.yaml are being updated together');
  } else {
    console.log('✅ Lockfile check passed');
  }

  process.exit(0);

} catch (error) {
  // All errors are treated as non-fatal warnings
  console.log('⚠️  Could not check lockfile:', error.message);
  process.exit(0);
}
