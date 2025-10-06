import traverse from '@babel/traverse';
import type {
  FeatureDetector,
  JSDetectionContext,
  DetectedFeature,
} from '../../base';
import { isJSContext } from '../../base';

export const promiseTryDetector: FeatureDetector = {
  id: 'promise-try',
  type: 'js',
  name: 'Promise.try',
  webFeaturesId: 'promise-try',

  detect(context): DetectedFeature[] {
    if (!isJSContext(context)) {
      return [];
    }

    const features: DetectedFeature[] = [];

    traverse(context.ast, {
      MemberExpression(path) {
        const obj = path.node.object;
        const prop = path.node.property;

        // Check for Promise.try
        if (
          obj.type === 'Identifier' &&
          obj.name === 'Promise' &&
          prop.type === 'Identifier' &&
          prop.name === 'try'
        ) {
          features.push({
            name: 'Promise.try',
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
