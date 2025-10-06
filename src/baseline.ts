import { features } from 'web-features';
import type { DetectedFeature } from './detector';

export interface BaselineStatus {
  status: 'widely' | 'newly' | 'limited' | 'unknown';
  lowDate?: string;
  highDate?: string;
}

export interface FeatureAnalysis {
  feature: DetectedFeature;
  baselineStatus: BaselineStatus;
  featureId?: string;
  description?: string;
}

/**
 * Map detected feature names to web-features IDs
 * This is a simplified mapping - in production would be more comprehensive
 */
const FEATURE_MAPPING: Record<string, string> = {
  'Promise.try': 'promise-try',
  'Promise.withResolvers': 'promise-withresolvers',
  'Array.fromAsync': 'array-fromasync',
  'Object.groupBy': 'object-groupby',
  'Array.prototype.at': 'array-at',
  'Array.prototype.findLast': 'array-findlast',
  'Array.prototype.findLastIndex': 'array-findlastindex',
  'Array.prototype.toSorted': 'array-tosorted',
  'Array.prototype.toReversed': 'array-toreversed',
  'Array.prototype.toSpliced': 'array-tospliced',
  'String.prototype.at': 'string-at',
  'crypto.randomUUID': 'randomuuid',
  'top-level-await': 'top-level-await',
  'class-private-fields': 'class-fields-private',
  'css-container-queries': 'container-queries',
  'css-cascade-layers': 'cascade-layers',
  'css-has-pseudo': 'has',
  'css-is-where-pseudo': 'is-where-selectors',
  'css-math-functions': 'css-math-functions',
  'css-container-type': 'container-queries',
  'css-aspect-ratio': 'aspect-ratio',
  'css-gap': 'gap',
  'css-place-items': 'place-items',
  'css-inset': 'inset',
  'css-scroll-snap-type': 'scroll-snap',
  'css-accent-color': 'accent-color',
  'css-color-scheme': 'color-scheme',
};

/**
 * Get baseline status for a feature
 */
export function getBaselineStatus(featureId: string): BaselineStatus {
  const feature = features[featureId];

  if (!feature || !('status' in feature)) {
    return { status: 'unknown' };
  }

  const baseline = feature.status?.baseline;

  if (baseline === 'high') {
    return {
      status: 'widely',
      lowDate: feature.status?.baseline_low_date,
      highDate: feature.status?.baseline_high_date,
    };
  } else if (baseline === 'low') {
    return {
      status: 'newly',
      lowDate: feature.status?.baseline_low_date,
    };
  } else {
    return { status: 'limited' };
  }
}

/**
 * Analyze detected features against Baseline data
 */
export function analyzeFeatures(
  detectedFeatures: DetectedFeature[]
): FeatureAnalysis[] {
  const analyses: FeatureAnalysis[] = [];

  // Remove duplicates
  const uniqueFeatures = detectedFeatures.filter(
    (feature, index, self) =>
      index ===
      self.findIndex((f) => f.name === feature.name && f.file === feature.file)
  );

  for (const feature of uniqueFeatures) {
    const featureId = FEATURE_MAPPING[feature.name];
    let baselineStatus: BaselineStatus;
    let description: string | undefined;

    if (featureId) {
      baselineStatus = getBaselineStatus(featureId);
      const featureData = features[featureId];
      if (featureData && 'name' in featureData) {
        description =
          featureData.name ||
          ('description_html' in featureData
            ? featureData.description_html
            : undefined);
      }
    } else {
      // Try to find by partial match
      const possibleMatches = Object.keys(features).filter(
        (id) =>
          feature.name.toLowerCase().includes(id) ||
          id.includes(feature.name.toLowerCase())
      );

      if (possibleMatches.length > 0) {
        baselineStatus = getBaselineStatus(possibleMatches[0]);
        const featureData = features[possibleMatches[0]];
        if (featureData && 'name' in featureData) {
          description =
            featureData.name ||
            ('description_html' in featureData
              ? featureData.description_html
              : undefined);
        }
      } else {
        baselineStatus = { status: 'unknown' };
      }
    }

    analyses.push({
      feature,
      baselineStatus,
      featureId,
      description,
    });
  }

  return analyses;
}

/**
 * Filter features by baseline status
 */
export function filterByBaselineStatus(
  analyses: FeatureAnalysis[],
  targetStatus: 'widely' | 'newly' | 'all'
): FeatureAnalysis[] {
  if (targetStatus === 'all') {
    return analyses;
  }

  return analyses.filter((analysis) => {
    if (targetStatus === 'widely') {
      return analysis.baselineStatus.status !== 'widely';
    } else if (targetStatus === 'newly') {
      return (
        analysis.baselineStatus.status === 'limited' ||
        analysis.baselineStatus.status === 'unknown'
      );
    }
    return false;
  });
}
