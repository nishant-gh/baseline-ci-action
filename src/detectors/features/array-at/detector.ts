import traverse from '@babel/traverse';
import type {
  FeatureDetector,
  JSDetectionContext,
  DetectedFeature,
} from '../../base';
import { isJSContext } from '../../base';

export const arrayAtDetector: FeatureDetector = {
  id: 'array-at',
  type: 'js',
  name: 'Array.prototype.at',
  webFeaturesId: 'array-at',

  detect(context): DetectedFeature[] {
    if (!isJSContext(context)) {
      return [];
    }

    const features: DetectedFeature[] = [];

    traverse(context.ast, {
      MemberExpression(path) {
        const prop = path.node.property;

        // Check for .at() method call
        if (prop.type === 'Identifier' && prop.name === 'at') {
          // We detect .at() on any expression, as it could be an array
          // In a real implementation, you might want to add type checking
          features.push({
            name: 'Array.prototype.at',
            type: 'js',
            file: context.filename,
            line: path.node.loc?.start.line,
          });
        }
      },
    });

    return features;
  },
};
