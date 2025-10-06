import * as parser from '@babel/parser';
import postcss from 'postcss';
import { registry } from './detectors/registry';
import { initialize } from './detectors/loader';
import type { DetectedFeature } from './detectors/base';

// Initialize the detector system on module load
initialize();

export type { DetectedFeature } from './detectors/base';

/**
 * Detects JavaScript/TypeScript features in code using registered detectors
 */
export function detectJSFeatures(
  code: string,
  filename: string,
): DetectedFeature[] {
  const features: DetectedFeature[] = [];

  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    const context = { code, filename, ast };

    // Run all registered JS detectors
    const jsDetectors = registry.getByType('js');
    for (const detector of jsDetectors) {
      const detected = detector.detect(context);
      features.push(...detected);
    }

    // Legacy detection for features not yet migrated to plugin system
    // This can be gradually removed as more detectors are added
    features.push(...detectLegacyJSFeatures(code, filename, ast));
  } catch (error) {
    console.warn(`Failed to parse ${filename}:`, error);
  }

  return features;
}

/**
 * Detects CSS features in stylesheets using registered detectors
 */
export function detectCSSFeatures(
  code: string,
  filename: string,
): DetectedFeature[] {
  const features: DetectedFeature[] = [];

  try {
    const root = postcss.parse(code);
    const context = { code, filename, root };

    // Run all registered CSS detectors
    const cssDetectors = registry.getByType('css');
    for (const detector of cssDetectors) {
      const detected = detector.detect(context);
      features.push(...detected);
    }

    // Legacy detection for features not yet migrated to plugin system
    features.push(...detectLegacyCSSFeatures(code, filename, root));
  } catch (error) {
    console.warn(`Failed to parse CSS in ${filename}:`, error);
  }

  return features;
}

/**
 * Main detection function that routes to appropriate detector
 */
export function detectFeatures(
  code: string,
  filename: string,
): DetectedFeature[] {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (['js', 'jsx', 'ts', 'tsx'].includes(ext || '')) {
    return detectJSFeatures(code, filename);
  } else if (['css', 'scss'].includes(ext || '')) {
    return detectCSSFeatures(code, filename);
  }

  return [];
}

/**
 * Legacy JS feature detection for features not yet migrated to plugin system
 * TODO: Gradually migrate these to individual feature plugins
 */
function detectLegacyJSFeatures(
  code: string,
  filename: string,
  ast: any,
): DetectedFeature[] {
  const features: DetectedFeature[] = [];
  const traverse = require('@babel/traverse').default;

  traverse(ast, {
    MemberExpression(path: any) {
      const obj = path.node.object;
      const prop = path.node.property;

      if (obj.type === 'Identifier' && prop.type === 'Identifier') {
        const apiCall = `${obj.name}.${prop.name}`;

        // Legacy Web APIs still using old detection
        const legacyAPIs = [
          'Promise.withResolvers',
          'Array.fromAsync',
          'Object.groupBy',
          'Array.prototype.findLast',
          'Array.prototype.findLastIndex',
          'Array.prototype.toSorted',
          'Array.prototype.toReversed',
          'Array.prototype.toSpliced',
          'String.prototype.at',
          'navigator.userAgentData',
          'crypto.randomUUID',
        ];

        if (
          legacyAPIs.some((api) =>
            apiCall.includes(api.split('.').slice(0, 2).join('.')),
          )
        ) {
          features.push({
            name: apiCall,
            type: 'js',
            file: filename,
            line: path.node.loc?.start.line,
          });
        }
      }
    },

    ClassProperty(path: any) {
      if (
        'type' in path.node.key &&
        (path.node.key as any).type === 'PrivateName'
      ) {
        features.push({
          name: 'class-private-fields',
          type: 'js',
          file: filename,
          line: path.node.loc?.start.line,
        });
      }
    },

    AwaitExpression(path: any) {
      if (path.scope.path.type === 'Program') {
        features.push({
          name: 'top-level-await',
          type: 'js',
          file: filename,
          line: path.node.loc?.start.line,
        });
      }
    },
  });

  return features;
}

/**
 * Legacy CSS feature detection for features not yet migrated to plugin system
 * TODO: Gradually migrate these to individual feature plugins
 */
function detectLegacyCSSFeatures(
  code: string,
  filename: string,
  root: any,
): DetectedFeature[] {
  const features: DetectedFeature[] = [];

  root.walkDecls((decl: any) => {
    const prop = decl.prop;
    const value = decl.value;

    // Legacy CSS properties
    const legacyProperties = [
      'aspect-ratio',
      'gap',
      'row-gap',
      'column-gap',
      'place-items',
      'place-content',
      'inset',
      'inset-block',
      'inset-inline',
      'scroll-snap-type',
      'scroll-snap-align',
      'overscroll-behavior',
      'accent-color',
      'color-scheme',
    ];

    if (legacyProperties.includes(prop)) {
      features.push({
        name: `css-${prop}`,
        type: 'css',
        file: filename,
        line: decl.source?.start?.line,
      });
    }

    // Legacy value checks
    if (
      value.includes('clamp(') ||
      value.includes('min(') ||
      value.includes('max(')
    ) {
      features.push({
        name: 'css-math-functions',
        type: 'css',
        file: filename,
        line: decl.source?.start?.line,
      });
    }

    if (value.includes('is(') || value.includes('where(')) {
      features.push({
        name: 'css-is-where-pseudo',
        type: 'css',
        file: filename,
        line: decl.source?.start?.line,
      });
    }
  });

  root.walkAtRules((atRule: any) => {
    if (atRule.name === 'layer') {
      features.push({
        name: 'css-cascade-layers',
        type: 'css',
        file: filename,
        line: atRule.source?.start?.line,
      });
    }
  });

  return features;
}
