import { describe, it, expect } from 'vitest';
import postcss from 'postcss';
import { cssHasPseudoDetector } from './detector';
import type { CSSDetectionContext } from '../../base';

describe('cssHasPseudoDetector', () => {
  it('should detect :has() pseudo-class in selector', () => {
    const code = `
      .parent:has(.child) {
        background: blue;
      }
    `;

    const root = postcss.parse(code);

    const context: CSSDetectionContext = {
      code,
      filename: 'test.css',
      root,
    };

    const features = cssHasPseudoDetector.detect(context);

    expect(features).toHaveLength(1);
    expect(features[0]).toMatchObject({
      name: 'css-has-pseudo',
      type: 'css',
      file: 'test.css',
    });
    expect(features[0].line).toBeDefined();
  });

  it('should detect :has() with complex selectors', () => {
    const code = `
      .container:has(> .item:hover) {
        border: 1px solid red;
      }
    `;

    const root = postcss.parse(code);

    const context: CSSDetectionContext = {
      code,
      filename: 'test.css',
      root,
    };

    const features = cssHasPseudoDetector.detect(context);

    expect(features).toHaveLength(1);
  });

  it('should detect multiple :has() usages', () => {
    const code = `
      .parent:has(.child) {
        color: blue;
      }

      .form:has(input:invalid) {
        border: 2px solid red;
      }

      .list:has(li:last-child) {
        margin-bottom: 0;
      }
    `;

    const root = postcss.parse(code);

    const context: CSSDetectionContext = {
      code,
      filename: 'test.css',
      root,
    };

    const features = cssHasPseudoDetector.detect(context);

    expect(features).toHaveLength(3);
  });

  it('should detect :has() in combined selectors', () => {
    const code = `
      .container:has(.warning):not(.disabled) {
        background: yellow;
      }
    `;

    const root = postcss.parse(code);

    const context: CSSDetectionContext = {
      code,
      filename: 'test.css',
      root,
    };

    const features = cssHasPseudoDetector.detect(context);

    expect(features).toHaveLength(1);
  });

  it('should detect :has() with descendant combinator', () => {
    const code = `
      article:has(h2 + p) {
        padding-top: 2rem;
      }
    `;

    const root = postcss.parse(code);

    const context: CSSDetectionContext = {
      code,
      filename: 'test.css',
      root,
    };

    const features = cssHasPseudoDetector.detect(context);

    expect(features).toHaveLength(1);
  });

  it('should not detect other pseudo-classes', () => {
    const code = `
      .element:hover {
        color: blue;
      }

      .item:not(.disabled) {
        opacity: 1;
      }

      .link:is(a, button) {
        cursor: pointer;
      }
    `;

    const root = postcss.parse(code);

    const context: CSSDetectionContext = {
      code,
      filename: 'test.css',
      root,
    };

    const features = cssHasPseudoDetector.detect(context);

    expect(features).toHaveLength(0);
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

    const features = cssHasPseudoDetector.detect(context);

    expect(features).toHaveLength(0);
  });

  it('should handle nested :has() selectors', () => {
    const code = `
      .outer:has(.middle:has(.inner)) {
        border: 1px solid black;
      }
    `;

    const root = postcss.parse(code);

    const context: CSSDetectionContext = {
      code,
      filename: 'test.css',
      root,
    };

    const features = cssHasPseudoDetector.detect(context);

    // Should detect at least once (the outer selector contains :has())
    expect(features.length).toBeGreaterThan(0);
  });

  it('should return empty array for JS context', () => {
    const jsContext = {
      code: 'const x = 1;',
      filename: 'test.js',
      ast: {} as any,
    };

    const features = cssHasPseudoDetector.detect(jsContext);

    expect(features).toHaveLength(0);
  });
});
