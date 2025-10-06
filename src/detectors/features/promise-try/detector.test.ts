import { describe, it, expect } from 'vitest';
import * as parser from '@babel/parser';
import { promiseTryDetector } from './detector';
import type { JSDetectionContext } from '../../base';

describe('promiseTryDetector', () => {
  it('should detect Promise.try usage', () => {
    const code = `
      const result = Promise.try(() => {
        return someOperation();
      });
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

    const features = promiseTryDetector.detect(context);

    expect(features).toHaveLength(1);
    expect(features[0]).toMatchObject({
      name: 'Promise.try',
      type: 'js',
      file: 'test.ts',
    });
    expect(features[0].line).toBeDefined();
  });

  it('should detect multiple Promise.try usages', () => {
    const code = `
      const result1 = Promise.try(() => operation1());
      const result2 = Promise.try(() => operation2());
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

    const features = promiseTryDetector.detect(context);

    expect(features).toHaveLength(2);
  });

  it('should not detect Promise.then or other Promise methods', () => {
    const code = `
      Promise.resolve(42).then(x => x * 2);
      Promise.all([promise1, promise2]);
      Promise.race([promise1, promise2]);
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

    const features = promiseTryDetector.detect(context);

    expect(features).toHaveLength(0);
  });

  it('should not detect custom objects with try method', () => {
    const code = `
      const myPromise = {
        try: () => {}
      };
      myPromise.try();
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

    const features = promiseTryDetector.detect(context);

    expect(features).toHaveLength(0);
  });

  it('should handle TypeScript syntax', () => {
    const code = `
      const result: Promise<number> = Promise.try<number>(() => {
        return 42;
      });
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

    const features = promiseTryDetector.detect(context);

    expect(features).toHaveLength(1);
  });

  it('should return empty array for CSS context', () => {
    const cssContext = {
      code: '.class { color: red; }',
      filename: 'test.css',
      root: {} as any,
    };

    const features = promiseTryDetector.detect(cssContext);

    expect(features).toHaveLength(0);
  });
});
