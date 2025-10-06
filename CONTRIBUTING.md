# Contributing to Baseline CI Action

## Adding a New Feature Detector

This project uses a modular plugin architecture for feature detection. Each web feature has its own detector module with co-located tests.

### Structure

```
src/detectors/features/
├── your-feature/
│   ├── detector.ts       # Detection logic
│   ├── detector.test.ts  # Tests
│   └── index.ts          # Export
```

### Step-by-Step Guide

#### 1. Create the Feature Directory

```bash
mkdir -p src/detectors/features/your-feature
```

#### 2. Create the Detector

Create `src/detectors/features/your-feature/detector.ts`:

```typescript
import type {
  FeatureDetector,
  JSDetectionContext,
  DetectedFeature,
} from '../../base';
import { isJSContext } from '../../base';
// For CSS detectors, import isCSSContext instead

export const yourFeatureDetector: FeatureDetector = {
  id: 'your-feature', // Unique ID (preferably matches web-features ID)
  type: 'js', // 'js' or 'css'
  name: 'Your Feature Name', // Human-readable name
  webFeaturesId: 'your-feature', // ID from web-features package

  detect(context): DetectedFeature[] {
    if (!isJSContext(context)) {
      // Or isCSSContext for CSS
      return [];
    }

    const features: DetectedFeature[] = [];

    // Add your detection logic here
    // For JS: use context.ast with @babel/traverse
    // For CSS: use context.root with postcss

    return features;
  },
};
```

**JavaScript Detection Example:**

```typescript
import traverse from '@babel/traverse';

// Inside detect() function:
traverse(context.ast, {
  MemberExpression(path) {
    const obj = path.node.object;
    const prop = path.node.property;

    if (
      obj.type === 'Identifier' &&
      obj.name === 'YourAPI' &&
      prop.type === 'Identifier' &&
      prop.name === 'method'
    ) {
      features.push({
        name: 'YourAPI.method',
        type: 'js',
        file: context.filename,
        line: path.node.loc?.start.line,
      });
    }
  },
});
```

**CSS Detection Example:**

```typescript
// Inside detect() function:
context.root.walkDecls((decl) => {
  if (decl.prop === 'your-property') {
    features.push({
      name: 'css-your-property',
      type: 'css',
      file: context.filename,
      line: decl.source?.start?.line,
    });
  }
});

context.root.walkAtRules('your-rule', (atRule) => {
  features.push({
    name: 'css-your-rule',
    type: 'css',
    file: context.filename,
    line: atRule.source?.start?.line,
  });
});
```

#### 3. Create the Index File

Create `src/detectors/features/your-feature/index.ts`:

```typescript
export { yourFeatureDetector as default } from './detector';
```

#### 4. Write Tests

Create `src/detectors/features/your-feature/detector.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import * as parser from '@babel/parser'; // For JS tests
import postcss from 'postcss'; // For CSS tests
import { yourFeatureDetector } from './detector';
import type { JSDetectionContext } from '../../base';

describe('yourFeatureDetector', () => {
  it('should detect your feature', () => {
    const code = `
      // Your test code here
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

    const features = yourFeatureDetector.detect(context);

    expect(features).toHaveLength(1);
    expect(features[0]).toMatchObject({
      name: 'expected-name',
      type: 'js',
      file: 'test.ts',
    });
  });

  // Add more test cases:
  // - Multiple occurrences
  // - Edge cases
  // - Should NOT detect similar but different patterns
  // - TypeScript/JSX syntax support
  // - Wrong context type (should return empty array)
});
```

#### 5. Register the Detector

Add your detector to `src/detectors/loader.ts`:

```typescript
import yourFeatureDetector from './features/your-feature';

export function loadDetectors(): void {
  registry.registerAll([
    // ... existing detectors
    yourFeatureDetector,
  ]);
}
```

#### 6. Run Tests

```bash
pnpm test
```

#### 7. Build and Verify

```bash
pnpm build
```

### Testing Tips

- **Test positive cases**: Verify your detector finds the feature
- **Test negative cases**: Verify it doesn't false-positive on similar patterns
- **Test edge cases**: Multiple occurrences, nested structures, etc.
- **Test syntax variations**: TypeScript, JSX, SCSS, etc.
- **Test wrong context**: JS detector should return `[]` for CSS context and vice versa

### Finding the web-features ID

1. Browse [web-features repository](https://github.com/web-platform-dx/web-features)
2. Check the `features/` directory
3. Use the feature ID from the YAML filename (without `.yml` extension)

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run tests with UI
pnpm test:ui

# Run specific test file
pnpm test src/detectors/features/your-feature/detector.test.ts
```

### Questions?

Check existing detectors for examples:

- `src/detectors/features/promise-try/` - JavaScript API detection
- `src/detectors/features/array-at/` - Method detection
- `src/detectors/features/container-queries/` - CSS at-rule and property
- `src/detectors/features/css-has-pseudo/` - CSS pseudo-class
