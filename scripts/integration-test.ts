#!/usr/bin/env node
/**
 * Integration test script
 * Runs the baseline checker against example files locally
 */

import { detectFeatures } from '../src/detector';
import { analyzeFeatures, filterByBaselineStatus } from '../src/baseline';
import { formatComment } from '../src/formatter';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

async function runIntegrationTest() {
  console.log('🔍 Running Baseline CI Integration Test...\n');

  const examplesDir = path.join(process.cwd(), 'examples');
  const filePatterns = ['**/*.ts', '**/*.js', '**/*.css', '**/*.scss'];

  // Find all example files
  const files: string[] = [];
  for (const pattern of filePatterns) {
    const matches = await glob(pattern, { cwd: examplesDir });
    files.push(...matches.map((f) => path.join(examplesDir, f)));
  }

  console.log(`📁 Found ${files.length} files in examples/\n`);

  let allDetectedFeatures: any[] = [];

  // Detect features in each file
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);
      const detected = detectFeatures(content, relativePath);

      if (detected.length > 0) {
        console.log(`   ${relativePath}: ${detected.length} features detected`);
        detected.forEach((feat) => {
          console.log(`      - ${feat.name} (line ${feat.line})`);
        });
      }

      allDetectedFeatures = allDetectedFeatures.concat(detected);
    } catch (error) {
      console.error(`   ❌ Failed to analyze ${filePath}: ${error}`);
    }
  }

  console.log(`\n🔎 Total features detected: ${allDetectedFeatures.length}\n`);

  // Test with different baseline targets
  const targets: Array<'widely' | 'newly' | 'all'> = ['widely', 'newly', 'all'];

  for (const targetBaseline of targets) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Target: ${targetBaseline.toUpperCase()}`);
    console.log('='.repeat(60));

    const analyses = analyzeFeatures(allDetectedFeatures);
    const issues = filterByBaselineStatus(analyses, targetBaseline);

    console.log(`⚠️  Issues found: ${issues.length}`);

    const comment = formatComment({
      targetBaseline,
      issues,
    });

    console.log('\nGenerated Comment:');
    console.log('-'.repeat(60));
    console.log(comment);
    console.log('-'.repeat(60));
  }

  console.log('\n✅ Integration test complete!');
}

runIntegrationTest().catch((error) => {
  console.error('Integration test failed:', error);
  process.exit(1);
});
