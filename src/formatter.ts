import type { FeatureAnalysis } from './baseline';

export interface CommentOptions {
  targetBaseline: 'widely' | 'newly' | 'all';
  issues: FeatureAnalysis[];
}

/**
 * Format the PR comment with analysis results
 */
export function formatComment(options: CommentOptions): string {
  const { targetBaseline, issues } = options;

  if (issues.length === 0) {
    return `## ✅ Baseline CI - All Clear!

No non-baseline features detected in this PR. All features used are ${
      targetBaseline === 'widely' ? 'widely available' : 'baseline-approved'
    } across modern browsers.

---
*Powered by [Baseline](https://web.dev/baseline) and [web-features](https://github.com/web-platform-dx/web-features)*`;
  }

  // Group by baseline status
  const byStatus = {
    limited: issues.filter((i) => i.baselineStatus.status === 'limited'),
    newly: issues.filter((i) => i.baselineStatus.status === 'newly'),
    unknown: issues.filter((i) => i.baselineStatus.status === 'unknown'),
    widely: issues.filter((i) => i.baselineStatus.status === 'widely'),
  };

  let comment = `## ⚠️ Baseline CI - Features Detected\n\n`;
  const targetLabel =
    targetBaseline === 'widely'
      ? 'Widely Available'
      : targetBaseline === 'newly'
        ? 'Newly Available'
        : 'All Features';
  comment += `**Target:** Baseline ${targetLabel}\n`;
  comment += `**Total Issues:** ${issues.length}\n\n`;

  // Limited availability features
  if (byStatus.limited.length > 0) {
    comment += `### 🔴 Limited Availability (${byStatus.limited.length})\n\n`;
    comment += `These features are **not yet baseline** and have limited browser support:\n\n`;
    comment += formatFeatureTable(byStatus.limited);
    comment += `\n`;
  }

  // Newly available features
  if (
    byStatus.newly.length > 0 &&
    (targetBaseline === 'widely' || targetBaseline === 'all')
  ) {
    comment += `### 🟡 Newly Available (${byStatus.newly.length})\n\n`;
    comment += `These features are baseline but not yet widely available (< 30 months across browsers):\n\n`;
    comment += formatFeatureTable(byStatus.newly);
    comment += `\n`;
  }

  // Widely available features (only shown if target is 'all')
  if (byStatus.widely.length > 0 && targetBaseline === 'all') {
    comment += `### ✅ Widely Available (${byStatus.widely.length})\n\n`;
    comment += `These features are widely available across modern browsers (30+ months):\n\n`;
    comment += formatFeatureTable(byStatus.widely);
    comment += `\n`;
  }

  // Unknown features
  if (byStatus.unknown.length > 0) {
    comment += `### ⚪ Unknown (${byStatus.unknown.length})\n\n`;
    comment += `These features could not be mapped to Baseline data:\n\n`;
    comment += formatFeatureTable(byStatus.unknown);
    comment += `\n`;
  }

  // Recommendations
  comment += `### 💡 Recommendations\n\n`;

  if (byStatus.limited.length > 0) {
    comment += `- Consider using polyfills or feature detection for limited availability features\n`;
    comment += `- Check [Can I Use](https://caniuse.com) for detailed browser support\n`;
  }

  if (byStatus.newly.length > 0 && targetBaseline === 'widely') {
    comment += `- Newly available features are safe for modern browsers but may need fallbacks for older ones\n`;
  }

  comment += `\n---\n*Powered by [Baseline](https://web.dev/baseline) and [web-features](https://github.com/web-platform-dx/web-features)*`;

  return comment;
}

/**
 * Format features as a markdown table
 */
function formatFeatureTable(features: FeatureAnalysis[]): string {
  let table = `| Feature | File | Line | Status |\n`;
  table += `|---------|------|------|--------|\n`;

  for (const { feature, baselineStatus, featureId } of features) {
    const statusEmoji = {
      widely: '✅',
      newly: '🟡',
      limited: '🔴',
      unknown: '⚪',
    }[baselineStatus.status];

    const fileName = feature.file.split('/').pop() || feature.file;
    const line = feature.line ? `${feature.line}` : '-';
    const statusText =
      baselineStatus.status.charAt(0).toUpperCase() +
      baselineStatus.status.slice(1);

    let featureLink = feature.name;
    if (featureId) {
      featureLink = `[\`${
        feature.name
      }\`](https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(
        feature.name,
      )})`;
    } else {
      featureLink = `\`${feature.name}\``;
    }

    table += `| ${featureLink} | \`${fileName}\` | ${line} | ${statusEmoji} ${statusText} |\n`;
  }

  return table;
}

/**
 * Format as a simple summary for action output
 */
export function formatSummary(issues: FeatureAnalysis[]): string {
  const byStatus = {
    limited: issues.filter((i) => i.baselineStatus.status === 'limited'),
    newly: issues.filter((i) => i.baselineStatus.status === 'newly'),
    unknown: issues.filter((i) => i.baselineStatus.status === 'unknown'),
  };

  return `Limited: ${byStatus.limited.length}, Newly: ${byStatus.newly.length}, Unknown: ${byStatus.unknown.length}`;
}
