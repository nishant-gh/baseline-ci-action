import type { FeatureAnalysis } from './baseline';
import webFeaturesData from 'web-features/data.json';

const { features } = webFeaturesData as any;

export interface CommentOptions {
  targetBaseline: 'widely' | 'newly' | 'all';
  issues: FeatureAnalysis[];
}

/**
 * Format the PR comment with analysis results
 */
export function formatComment(options: CommentOptions): string {
  const { targetBaseline, issues } = options;

  // Add comment identifier for deduplication
  let comment = `<!-- baseline-ci-report -->\n`;

  if (issues.length === 0) {
    comment += `## ✅ Baseline CI - All Clear!

No non-baseline features detected in this PR. All features used are ${
      targetBaseline === 'widely' ? 'widely available' : 'baseline-approved'
    } across modern browsers.

---
*Powered by [Baseline](https://web.dev/baseline) and [web-features](https://github.com/web-platform-dx/web-features)*`;
    return comment;
  }

  // Group by baseline status
  const byStatus = {
    limited: issues.filter((i) => i.baselineStatus.status === 'limited'),
    newly: issues.filter((i) => i.baselineStatus.status === 'newly'),
    unknown: issues.filter((i) => i.baselineStatus.status === 'unknown'),
    widely: issues.filter((i) => i.baselineStatus.status === 'widely'),
  };

  comment += `## ⚠️ Baseline CI - Features Detected\n\n`;
  const targetLabel =
    targetBaseline === 'widely'
      ? 'Widely Available'
      : targetBaseline === 'newly'
        ? 'Newly Available'
        : 'All Features';
  comment += `**Target:** Baseline ${targetLabel}\n`;
  comment += `**Total Issues:** ${issues.length}\n\n`;

  // Summary table
  comment += `| Status | Count | Description |\n`;
  comment += `|--------|-------|-------------|\n`;
  if (byStatus.limited.length > 0) {
    comment += `| 🔴 Limited | ${byStatus.limited.length} | Not yet baseline, limited browser support |\n`;
  }
  if (
    byStatus.newly.length > 0 &&
    (targetBaseline === 'widely' || targetBaseline === 'all')
  ) {
    comment += `| 🟡 Newly | ${byStatus.newly.length} | Baseline but < 30 months across browsers |\n`;
  }
  if (byStatus.widely.length > 0 && targetBaseline === 'all') {
    comment += `| ✅ Widely | ${byStatus.widely.length} | Widely available (30+ months) |\n`;
  }
  if (byStatus.unknown.length > 0) {
    comment += `| ⚪ Unknown | ${byStatus.unknown.length} | Could not map to Baseline data |\n`;
  }
  comment += `\n`;

  // Limited availability features
  if (byStatus.limited.length > 0) {
    const useCollapsible = byStatus.limited.length > 5;
    if (useCollapsible) {
      comment += `<details>\n<summary><strong>🔴 Limited Availability (${byStatus.limited.length})</strong></summary>\n\n`;
    } else {
      comment += `### 🔴 Limited Availability (${byStatus.limited.length})\n\n`;
    }
    comment += `These features are **not yet baseline** and have limited browser support:\n\n`;
    comment += formatFeatureTable(byStatus.limited);
    if (useCollapsible) {
      comment += `\n</details>\n\n`;
    } else {
      comment += `\n`;
    }
  }

  // Newly available features
  if (
    byStatus.newly.length > 0 &&
    (targetBaseline === 'widely' || targetBaseline === 'all')
  ) {
    const useCollapsible = byStatus.newly.length > 5;
    if (useCollapsible) {
      comment += `<details>\n<summary><strong>🟡 Newly Available (${byStatus.newly.length})</strong></summary>\n\n`;
    } else {
      comment += `### 🟡 Newly Available (${byStatus.newly.length})\n\n`;
    }
    comment += `These features are baseline but not yet widely available (< 30 months across browsers):\n\n`;
    comment += formatFeatureTable(byStatus.newly);
    if (useCollapsible) {
      comment += `\n</details>\n\n`;
    } else {
      comment += `\n`;
    }
  }

  // Widely available features (only shown if target is 'all')
  if (byStatus.widely.length > 0 && targetBaseline === 'all') {
    const useCollapsible = byStatus.widely.length > 5;
    if (useCollapsible) {
      comment += `<details>\n<summary><strong>✅ Widely Available (${byStatus.widely.length})</strong></summary>\n\n`;
    } else {
      comment += `### ✅ Widely Available (${byStatus.widely.length})\n\n`;
    }
    comment += `These features are widely available across modern browsers (30+ months):\n\n`;
    comment += formatFeatureTable(byStatus.widely);
    if (useCollapsible) {
      comment += `\n</details>\n\n`;
    } else {
      comment += `\n`;
    }
  }

  // Unknown features
  if (byStatus.unknown.length > 0) {
    const useCollapsible = byStatus.unknown.length > 5;
    if (useCollapsible) {
      comment += `<details>\n<summary><strong>⚪ Unknown (${byStatus.unknown.length})</strong></summary>\n\n`;
    } else {
      comment += `### ⚪ Unknown (${byStatus.unknown.length})\n\n`;
    }
    comment += `These features could not be mapped to Baseline data:\n\n`;
    comment += formatFeatureTable(byStatus.unknown);
    if (useCollapsible) {
      comment += `\n</details>\n\n`;
    } else {
      comment += `\n`;
    }
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
 * Get documentation URL for a feature
 */
function getFeatureUrl(
  featureId: string | undefined,
  featureName: string,
): string | null {
  if (!featureId) return null;

  const featureData = features[featureId];
  if (!featureData) return null;

  // Try to get caniuse URL first
  if (featureData.caniuse) {
    const caniuseId = Array.isArray(featureData.caniuse)
      ? featureData.caniuse[0]
      : featureData.caniuse;
    return `https://caniuse.com/${caniuseId}`;
  }

  // Try to get spec URL as fallback
  if (featureData.spec) {
    const specUrl = Array.isArray(featureData.spec)
      ? featureData.spec[0]
      : featureData.spec;
    return specUrl;
  }

  // Default to MDN search
  return `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(featureName)}`;
}

/**
 * Get browser support summary for a feature
 */
function getBrowserSupport(featureAnalysis: FeatureAnalysis): string {
  const { baselineStatus, featureId } = featureAnalysis;

  if (baselineStatus.status === 'widely' && baselineStatus.highDate) {
    return `Widely since ${baselineStatus.highDate.substring(0, 7)}`;
  } else if (baselineStatus.status === 'newly' && baselineStatus.lowDate) {
    return `Baseline ${baselineStatus.lowDate.substring(0, 7)}`;
  } else if (baselineStatus.status === 'limited') {
    // Try to get more specific info from feature data
    if (featureId && features[featureId]) {
      const featureData = features[featureId];
      if (featureData.status?.support) {
        const browsers = [];
        if (featureData.status.support.chrome)
          browsers.push(`Chrome ${featureData.status.support.chrome}`);
        if (featureData.status.support.firefox)
          browsers.push(`Firefox ${featureData.status.support.firefox}`);
        if (featureData.status.support.safari)
          browsers.push(`Safari ${featureData.status.support.safari}`);
        if (browsers.length > 0) {
          return browsers.slice(0, 2).join(', ');
        }
      }
    }
    return 'Limited support';
  }

  return 'Unknown';
}

/**
 * Format features as a markdown table
 */
function formatFeatureTable(features: FeatureAnalysis[]): string {
  let table = `| Feature | Location | Browser Support | Links |\n`;
  table += `|---------|----------|-----------------|-------|\n`;

  for (const analysis of features) {
    const { feature, baselineStatus, featureId } = analysis;

    const statusEmoji = {
      widely: '✅',
      newly: '🟡',
      limited: '🔴',
      unknown: '⚪',
    }[baselineStatus.status];

    // Show full file path
    const location = feature.line
      ? `\`${feature.file}:${feature.line}\``
      : `\`${feature.file}\``;

    // Get browser support info
    const browserSupport = getBrowserSupport(analysis);

    // Build links
    const links = [];
    const featureUrl = getFeatureUrl(featureId, feature.name);

    if (featureUrl) {
      if (featureUrl.includes('caniuse.com')) {
        links.push(`[Can I Use](${featureUrl})`);
      } else if (featureUrl.includes('spec')) {
        links.push(`[Spec](${featureUrl})`);
      } else {
        links.push(`[MDN](${featureUrl})`);
      }
    }

    // Add web.dev baseline link if available
    if (featureId && baselineStatus.status !== 'unknown') {
      links.push(`[Baseline](https://web.dev/baseline/features/${featureId})`);
    }

    const linksText = links.length > 0 ? links.join(' · ') : '-';

    table += `| ${statusEmoji} \`${feature.name}\` | ${location} | ${browserSupport} | ${linksText} |\n`;
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
