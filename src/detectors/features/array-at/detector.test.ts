import { describe, it, expect } from 'vitest';
import * as parser from '@babel/parser';
import { arrayAtDetector } from './detector';
import type { JSDetectionContext } from '../../base';

describe('arrayAtDetector', () => {
  it('should detect array.at() usage', () => {
    const code = `
      const arr = [1, 2, 3, 4, 5];
      const lastItem = arr.at(-1);
    `;

    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    });

    const context: JSDetectionContext = {
      code,
      filename: 'test.ts',
      ast,
    };

    const features = arrayAtDetector.detect(context);

    expect(features).toHaveLength(1);
    expect(features[0]).toMatchObject({
      name: 'Array.prototype.at',
      type: 'js',
      file: 'test.ts',
    });
    expect(features[0].line).toBeDefined();
  });

  it('should detect multiple .at() usages', () => {
    const code = `
      const arr = [1, 2, 3];
      const first = arr.at(0);
      const last = arr.at(-1);
      const second = [10, 20, 30].at(1);
    `;

    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    });

    const context: JSDetectionContext = {
      code,
      filename: 'test.ts',
      ast,
    };

    const features = arrayAtDetector.detect(context);

    expect(features).toHaveLength(3);
  });

  it('should detect .at() on string (String.prototype.at)', () => {
    const code = `
      const str = "hello";
      const char = str.at(-1);
    `;

    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    });

    const context: JSDetectionContext = {
      code,
      filename: 'test.ts',
      ast,
    };

    const features = arrayAtDetector.detect(context);

    // Note: This detector catches both Array.at and String.at
    // In a more sophisticated implementation, you might distinguish them
    expect(features).toHaveLength(1);
  });

  it('should not detect other array methods', () => {
    const code = `
      const arr = [1, 2, 3];
      arr.push(4);
      arr.pop();
      arr.map(x => x * 2);
    `;

    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    });

    const context: JSDetectionContext = {
      code,
      filename: 'test.ts',
      ast,
    };

    const features = arrayAtDetector.detect(context);

    expect(features).toHaveLength(0);
  });

  it('should handle TypeScript syntax', () => {
    const code = `
      const arr: number[] = [1, 2, 3];
      const item: number | undefined = arr.at(0);
    `;

    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    });

    const context: JSDetectionContext = {
      code,
      filename: 'test.ts',
      ast,
    };

    const features = arrayAtDetector.detect(context);

    expect(features).toHaveLength(1);
  });

  it('should detect .at() in chained calls', () => {
    const code = `
      const result = [1, 2, 3].filter(x => x > 1).at(0);
    `;

    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    });

    const context: JSDetectionContext = {
      code,
      filename: 'test.ts',
      ast,
    };

    const features = arrayAtDetector.detect(context);

    expect(features).toHaveLength(1);
  });

  it('should return empty array for CSS context', () => {
    const cssContext = {
      code: '.class { color: red; }',
      filename: 'test.css',
      root: {} as any,
    };

    const features = arrayAtDetector.detect(cssContext);

    expect(features).toHaveLength(0);
  });
});
