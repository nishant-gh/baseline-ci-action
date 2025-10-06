import type {
  FeatureDetector,
  CSSDetectionContext,
  DetectedFeature,
} from '../../base';
import { isCSSContext } from '../../base';

export const cssHasPseudoDetector: FeatureDetector = {
  id: 'css-has-pseudo',
  type: 'css',
  name: 'CSS :has() pseudo-class',
  webFeaturesId: 'has',

  detect(context): DetectedFeature[] {
    if (!isCSSContext(context)) {
      return [];
    }

    const features: DetectedFeature[] = [];

    // Walk through all rules and check selectors for :has()
    context.root.walkRules((rule) => {
      if (rule.selector.includes(':has(')) {
        features.push({
          name: 'css-has-pseudo',
          type: 'css',
          file: context.filename,
          line: rule.source?.start?.line,
        });
      }
    });

    // Also check in declaration values (for cases like content, etc.)
    context.root.walkDecls((decl) => {
      if (decl.value.includes(':has(')) {
        features.push({
          name: 'css-has-pseudo',
          type: 'css',
          file: context.filename,
          line: decl.source?.start?.line,
        });
      }
    });

    return features;
  },
};
