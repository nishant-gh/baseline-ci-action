import { describe, it, expect } from 'vitest';
import postcss from 'postcss';
import { containerQueriesDetector } from './detector';
import type { CSSDetectionContext } from '../../base';

describe('containerQueriesDetector', () => {
  it('should detect @container at-rule', () => {
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

    const root = postcss.parse(code);

    const context: CSSDetectionContext = {
      code,
      filename: 'test.css',
      root,
    };

    const features = containerQueriesDetector.detect(context);

    expect(features.length).toBeGreaterThan(0);
    expect(features.some((f) => f.name === 'css-container-queries')).toBe(true);
  });

  it('should detect container-type property', () => {
    const code = `
      .sidebar {
        container-type: inline-size;
      }
    `;

    const root = postcss.parse(code);

    const context: CSSDetectionContext = {
      code,
      filename: 'test.css',
      root,
    };

    const features = containerQueriesDetector.detect(context);

    expect(features).toHaveLength(1);
    expect(features[0]).toMatchObject({
      name: 'css-container-queries',
      type: 'css',
      file: 'test.css',
    });
    expect(features[0].line).toBeDefined();
  });

  it('should detect container-name property', () => {
    const code = `
      .card {
        container-name: card-container;
        container-type: inline-size;
      }
    `;

    const root = postcss.parse(code);

    const context: CSSDetectionContext = {
      code,
      filename: 'test.css',
      root,
    };

    const features = containerQueriesDetector.detect(context);

    expect(features).toHaveLength(2);
  });

  it('should detect container shorthand property', () => {
    const code = `
      .element {
        container: my-container / inline-size;
      }
    `;

    const root = postcss.parse(code);

    const context: CSSDetectionContext = {
      code,
      filename: 'test.css',
      root,
    };

    const features = containerQueriesDetector.detect(context);

    expect(features).toHaveLength(1);
    expect(features[0].name).toBe('css-container-queries');
  });

  it('should detect multiple container queries', () => {
    const code = `
      .sidebar {
        container-type: inline-size;
      }

      @container (min-width: 300px) {
        .item { font-size: 1rem; }
      }

      @container (min-width: 600px) {
        .item { font-size: 1.5rem; }
      }
    `;

    const root = postcss.parse(code);

    const context: CSSDetectionContext = {
      code,
      filename: 'test.css',
      root,
    };

    const features = containerQueriesDetector.detect(context);

    expect(features.length).toBeGreaterThanOrEqual(3);
  });

  it('should not detect regular CSS', () => {
    const code = `
      .element {
        display: flex;
        color: blue;
      }
    `;

    const root = postcss.parse(code);

    const context: CSSDetectionContext = {
      code,
      filename: 'test.css',
      root,
    };

    const features = containerQueriesDetector.detect(context);

    expect(features).toHaveLength(0);
  });

  it('should not detect other @rules', () => {
    const code = `
      @media (min-width: 600px) {
        .element {
          display: grid;
        }
      }

      @supports (display: grid) {
        .element {
          display: grid;
        }
      }
    `;

    const root = postcss.parse(code);

    const context: CSSDetectionContext = {
      code,
      filename: 'test.css',
      root,
    };

    const features = containerQueriesDetector.detect(context);

    expect(features).toHaveLength(0);
  });

  it('should return empty array for JS context', () => {
    const jsContext = {
      code: 'const x = 1;',
      filename: 'test.js',
      ast: {} as any,
    };

    const features = containerQueriesDetector.detect(jsContext);

    expect(features).toHaveLength(0);
  });
});
