import * as core from '@actions/core';
import * as github from '@actions/github';
import { detectFeatures } from './detector';
import { analyzeFeatures, filterByBaselineStatus } from './baseline';
import { formatComment, formatSummary } from './formatter';
import * as path from 'path';

async function run(): Promise<void> {
  try {
    // Get inputs
    const token = core.getInput('github-token', { required: true });
    const severity = core.getInput('severity') as 'fail' | 'warn';
    const targetBaseline = core.getInput('target-baseline') as
      | 'widely'
      | 'newly'
      | 'all';
    const filePatterns = core
      .getInput('file-patterns')
      .split(',')
      .map((p) => p.trim());

    core.info(`🔍 Baseline CI starting...`);
    core.info(`   Target: ${targetBaseline}`);
    core.info(`   Severity: ${severity}`);

    const octokit = github.getOctokit(token);
    const context = github.context;

    // Only run on pull requests
    if (!context.payload.pull_request) {
      core.warning('Not a pull request event, skipping analysis');
      return;
    }

    const pr = context.payload.pull_request;
    const prNumber = pr.number;

    core.info(`📋 Analyzing PR #${prNumber}`);

    // Get changed files
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: prNumber,
    });

    core.info(`📁 Found ${files.length} changed files`);

    // Filter files based on patterns
    const relevantFiles = files.filter((file) => {
      const ext = path.extname(file.filename);
      return filePatterns.some((pattern) => {
        const patternExt = pattern.split('.').pop();
        return ext === `.${patternExt}`;
      });
    });

    core.info(`✅ ${relevantFiles.length} files match patterns`);

    // Detect features in each file
    let allDetectedFeatures: any[] = [];

    for (const file of relevantFiles) {
      if (file.status === 'removed') {
        continue;
      }

      try {
        // Fetch file content
        const { data } = await octokit.rest.repos.getContent({
          owner: context.repo.owner,
          repo: context.repo.repo,
          path: file.filename,
          ref: pr.head.sha,
        });

        if ('content' in data && data.content) {
          const content = Buffer.from(data.content, 'base64').toString('utf-8');
          const detected = detectFeatures(content, file.filename);
          allDetectedFeatures = allDetectedFeatures.concat(detected);

          if (detected.length > 0) {
            core.info(
              `   ${file.filename}: ${detected.length} features detected`,
            );
          }
        }
      } catch (error) {
        core.warning(`Failed to analyze ${file.filename}: ${error}`);
      }
    }

    core.info(`🔎 Total features detected: ${allDetectedFeatures.length}`);

    // Analyze features against Baseline
    const analyses = analyzeFeatures(allDetectedFeatures);
    const issues = filterByBaselineStatus(analyses, targetBaseline);

    core.info(`⚠️  Issues found: ${issues.length}`);

    // Generate comment
    const comment = formatComment({
      targetBaseline,
      issues,
    });

    // Find and update existing comment or create new one
    try {
      // Get existing comments
      const { data: comments } = await octokit.rest.issues.listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: prNumber,
      });

      // Find existing Baseline CI comment
      // Only check for the HTML comment marker, not the user type
      // This ensures we can update our own comments regardless of auth method
      const existingComment = comments.find((comment) =>
        comment.body?.includes('<!-- baseline-ci-report -->'),
      );

      if (existingComment) {
        // Update existing comment
        await octokit.rest.issues.updateComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          comment_id: existingComment.id,
          body: comment,
        });
        core.info('💬 Updated existing Baseline CI comment');
      } else {
        // Create new comment
        await octokit.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: prNumber,
          body: comment,
        });
        core.info('💬 Created new Baseline CI comment');
      }
    } catch (error) {
      core.warning(`Failed to post/update comment: ${error}`);
    }

    // Set outputs
    core.setOutput('features-detected', JSON.stringify(allDetectedFeatures));
    core.setOutput('non-baseline-count', issues.length.toString());

    const status = issues.length > 0 && severity === 'fail' ? 'fail' : 'pass';
    core.setOutput('status', status);

    // Summary
    const summary = formatSummary(issues);
    core.info(`📊 Summary: ${summary}`);

    if (status === 'fail') {
      core.setFailed(
        `Found ${issues.length} non-baseline features (severity: ${severity})`,
      );
    } else if (issues.length > 0) {
      core.warning(
        `Found ${issues.length} non-baseline features (severity: warn only)`,
      );
    } else {
      core.info('✅ All features are baseline-compliant!');
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('Unknown error occurred');
    }
  }
}

run();
