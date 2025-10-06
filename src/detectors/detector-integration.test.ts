import { describe, it, expect } from 'vitest';
import {
  detectFeatures,
  detectJSFeatures,
  detectCSSFeatures,
} from '../detector';

describe('Detector Integration', () => {
  describe('detectJSFeatures', () => {
    it('should detect Promise.try using plugin detector', () => {
      const code = `
        const result = Promise.try(() => doSomething());
      `;

      const features = detectJSFeatures(code, 'test.ts');

      const promiseTryFeature = features.find((f) => f.name === 'Promise.try');
      expect(promiseTryFeature).toBeDefined();
      expect(promiseTryFeature?.type).toBe('js');
    });

    it('should detect Array.at using plugin detector', () => {
      const code = `
        const arr = [1, 2, 3];
        const last = arr.at(-1);
      `;

      const features = detectJSFeatures(code, 'test.ts');

      const arrayAtFeature = features.find(
        (f) => f.name === 'Array.prototype.at'
      );
      expect(arrayAtFeature).toBeDefined();
      expect(arrayAtFeature?.type).toBe('js');
    });

    it('should detect legacy features', () => {
      const code = `
        const resolved = Promise.withResolvers();
        const grouped = Object.groupBy(items, item => item.category);
      `;

      const features = detectJSFeatures(code, 'test.ts');

      expect(features.length).toBeGreaterThan(0);
      expect(features.some((f) => f.name.includes('withResolvers'))).toBe(true);
      expect(features.some((f) => f.name.includes('groupBy'))).toBe(true);
    });

    it('should detect both plugin and legacy features together', () => {
      const code = `
        const result = Promise.try(() => getValue());
        const resolved = Promise.withResolvers();
        const arr = [1, 2, 3].at(-1);
      `;

      const features = detectJSFeatures(code, 'test.ts');

      expect(features.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle TypeScript syntax', () => {
      const code = `
        const arr: number[] = [1, 2, 3];
        const last: number | undefined = arr.at(-1);
        const promise: Promise<number> = Promise.try<number>(() => 42);
      `;

      const features = detectJSFeatures(code, 'test.tsx');

      expect(features.length).toBeGreaterThan(0);
    });

    it('should handle JSX syntax', () => {
      const code = `
        const Component = () => {
          const items = [1, 2, 3];
          const last = items.at(-1);
          return <div>{last}</div>;
        };
      `;

      const features = detectJSFeatures(code, 'test.jsx');

      expect(features.some((f) => f.name === 'Array.prototype.at')).toBe(true);
    });
  });

  describe('detectCSSFeatures', () => {
    it('should detect container queries using plugin detector', () => {
      const code = `
        .card {
          container-type: inline-size;
        }

        @container (min-width: 400px) {
          .card-content {
            display: grid;
          }
        }
      `;

      const features = detectCSSFeatures(code, 'test.css');

      const containerFeature = features.find(
        (f) => f.name === 'css-container-queries'
      );
      expect(containerFeature).toBeDefined();
      expect(containerFeature?.type).toBe('css');
    });

    it('should detect :has() pseudo-class using plugin detector', () => {
      const code = `
        .parent:has(.child) {
          background: blue;
        }
      `;

      const features = detectCSSFeatures(code, 'test.css');

      const hasFeature = features.find((f) => f.name === 'css-has-pseudo');
      expect(hasFeature).toBeDefined();
      expect(hasFeature?.type).toBe('css');
    });

    it('should detect legacy CSS features', () => {
      const code = `
        .element {
          aspect-ratio: 16/9;
          gap: 1rem;
          accent-color: blue;
        }
      `;

      const features = detectCSSFeatures(code, 'test.css');

      expect(features.length).toBeGreaterThan(0);
      expect(features.some((f) => f.name === 'css-aspect-ratio')).toBe(true);
      expect(features.some((f) => f.name === 'css-gap')).toBe(true);
    });

    it('should detect both plugin and legacy features together', () => {
      const code = `
        .card {
          container-type: inline-size;
          aspect-ratio: 16/9;
        }

        .parent:has(.child) {
          gap: 1rem;
        }

        @container (min-width: 400px) {
          .content {
            display: grid;
          }
        }
      `;

      const features = detectCSSFeatures(code, 'test.css');

      expect(features.length).toBeGreaterThan(0);
      expect(features.some((f) => f.name === 'css-container-queries')).toBe(
        true
      );
      expect(features.some((f) => f.name === 'css-has-pseudo')).toBe(true);
      expect(features.some((f) => f.name === 'css-aspect-ratio')).toBe(true);
    });
  });

  describe('detectFeatures', () => {
    it('should route JS files to JS detector', () => {
      const code = 'const x = Promise.try(() => 1);';

      const features = detectFeatures(code, 'test.js');

      expect(features.length).toBeGreaterThan(0);
      expect(features[0].type).toBe('js');
    });

    it('should route TS files to JS detector', () => {
      const code = 'const x: number = 1;';

      const features = detectFeatures(code, 'test.ts');

      expect(features).toEqual(expect.any(Array));
    });

    it('should route CSS files to CSS detector', () => {
      const code = '.class:has(.child) { color: red; }';

      const features = detectFeatures(code, 'test.css');

      expect(features.length).toBeGreaterThan(0);
      expect(features[0].type).toBe('css');
    });

    it('should route SCSS files to CSS detector', () => {
      const code = '.class { .nested { color: red; } }';

      const features = detectFeatures(code, 'test.scss');

      expect(features).toEqual(expect.any(Array));
    });

    it('should return empty array for unsupported file types', () => {
      const code = 'some content';

      const features = detectFeatures(code, 'test.txt');

      expect(features).toHaveLength(0);
    });

    it('should detect features from both JS and CSS in appropriate files', () => {
      const jsCode = 'const x = arr.at(-1);';
      const cssCode = '.class:has(.child) { color: red; }';

      const jsFeatures = detectFeatures(jsCode, 'app.js');
      const cssFeatures = detectFeatures(cssCode, 'style.css');

      expect(jsFeatures.some((f) => f.type === 'js')).toBe(true);
      expect(cssFeatures.some((f) => f.type === 'css')).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JavaScript gracefully', () => {
      const code = 'const x = {{{';

      const features = detectJSFeatures(code, 'test.js');

      // Should not throw, just return empty array or partial results
      expect(features).toEqual(expect.any(Array));
    });

    it('should handle malformed CSS gracefully', () => {
      const code = '.class { color: }}}';

      const features = detectCSSFeatures(code, 'test.css');

      // Should not throw, just return empty array or partial results
      expect(features).toEqual(expect.any(Array));
    });
  });
});
