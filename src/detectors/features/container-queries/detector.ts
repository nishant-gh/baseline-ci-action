import type {
  FeatureDetector,
  CSSDetectionContext,
  DetectedFeature,
} from '../../base';
import { isCSSContext } from '../../base';

export const containerQueriesDetector: FeatureDetector = {
  id: 'container-queries',
  type: 'css',
  name: 'CSS Container Queries',
  webFeaturesId: 'container-queries',

  detect(context): DetectedFeature[] {
    if (!isCSSContext(context)) {
      return [];
    }

    const features: DetectedFeature[] = [];

    // Check for @container at-rule
    context.root.walkAtRules('container', (atRule) => {
      features.push({
        name: 'css-container-queries',
        type: 'css',
        file: context.filename,
        line: atRule.source?.start?.line,
      });
    });

    // Check for container-type and container-name properties
    context.root.walkDecls((decl) => {
      if (
        decl.prop === 'container-type' ||
        decl.prop === 'container-name' ||
        decl.prop === 'container'
      ) {
        features.push({
          name: 'css-container-queries',
          type: 'css',
          file: context.filename,
          line: decl.source?.start?.line,
        });
      }
    });

    return features;
  },
};
