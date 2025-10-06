import traverse from '@babel/traverse';
import type {
  FeatureDetector,
  JSDetectionContext,
  DetectedFeature,
} from '../../base';
import { isJSContext } from '../../base';

export const promiseWithResolversDetector: FeatureDetector = {
  id: 'promise-withresolvers',
  type: 'js',
  name: 'Promise.withResolvers',
  webFeaturesId: 'promise-withresolvers',

  detect(context): DetectedFeature[] {
    if (!isJSContext(context)) {
      return [];
    }

    const features: DetectedFeature[] = [];

    traverse(context.ast, {
      MemberExpression(path) {
        const obj = path.node.object;
        const prop = path.node.property;

        // Check for Promise.withResolvers
        if (
          obj.type === 'Identifier' &&
          obj.name === 'Promise' &&
          prop.type === 'Identifier' &&
          prop.name === 'withResolvers'
        ) {
          features.push({
            name: 'Promise.withResolvers',
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
