import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DetectorRegistry } from './registry';
import type { FeatureDetector } from './base';

describe('DetectorRegistry', () => {
  let registry: DetectorRegistry;

  beforeEach(() => {
    registry = new DetectorRegistry();
  });

  const mockJSDetector: FeatureDetector = {
    id: 'test-js-feature',
    type: 'js',
    name: 'Test JS Feature',
    detect: () => [],
  };

  const mockCSSDetector: FeatureDetector = {
    id: 'test-css-feature',
    type: 'css',
    name: 'Test CSS Feature',
    detect: () => [],
  };

  describe('register', () => {
    it('should register a detector', () => {
      registry.register(mockJSDetector);

      expect(registry.has('test-js-feature')).toBe(true);
      expect(registry.get('test-js-feature')).toBe(mockJSDetector);
    });

    it('should warn when overwriting existing detector', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      registry.register(mockJSDetector);
      registry.register(mockJSDetector);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already registered'),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('registerAll', () => {
    it('should register multiple detectors', () => {
      registry.registerAll([mockJSDetector, mockCSSDetector]);

      expect(registry.size).toBe(2);
      expect(registry.has('test-js-feature')).toBe(true);
      expect(registry.has('test-css-feature')).toBe(true);
    });
  });

  describe('get', () => {
    it('should retrieve a registered detector', () => {
      registry.register(mockJSDetector);

      const detector = registry.get('test-js-feature');

      expect(detector).toBe(mockJSDetector);
    });

    it('should return undefined for non-existent detector', () => {
      const detector = registry.get('non-existent');

      expect(detector).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all registered detectors', () => {
      registry.registerAll([mockJSDetector, mockCSSDetector]);

      const allDetectors = registry.getAll();

      expect(allDetectors).toHaveLength(2);
      expect(allDetectors).toContain(mockJSDetector);
      expect(allDetectors).toContain(mockCSSDetector);
    });

    it('should return empty array when no detectors registered', () => {
      const allDetectors = registry.getAll();

      expect(allDetectors).toHaveLength(0);
    });
  });

  describe('getByType', () => {
    beforeEach(() => {
      registry.registerAll([mockJSDetector, mockCSSDetector]);
    });

    it('should return only JS detectors', () => {
      const jsDetectors = registry.getByType('js');

      expect(jsDetectors).toHaveLength(1);
      expect(jsDetectors[0]).toBe(mockJSDetector);
    });

    it('should return only CSS detectors', () => {
      const cssDetectors = registry.getByType('css');

      expect(cssDetectors).toHaveLength(1);
      expect(cssDetectors[0]).toBe(mockCSSDetector);
    });
  });

  describe('has', () => {
    it('should return true for registered detector', () => {
      registry.register(mockJSDetector);

      expect(registry.has('test-js-feature')).toBe(true);
    });

    it('should return false for non-registered detector', () => {
      expect(registry.has('non-existent')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should remove a detector', () => {
      registry.register(mockJSDetector);

      const result = registry.unregister('test-js-feature');

      expect(result).toBe(true);
      expect(registry.has('test-js-feature')).toBe(false);
    });

    it('should return false when removing non-existent detector', () => {
      const result = registry.unregister('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all detectors', () => {
      registry.registerAll([mockJSDetector, mockCSSDetector]);

      registry.clear();

      expect(registry.size).toBe(0);
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe('size', () => {
    it('should return the number of registered detectors', () => {
      expect(registry.size).toBe(0);

      registry.register(mockJSDetector);
      expect(registry.size).toBe(1);

      registry.register(mockCSSDetector);
      expect(registry.size).toBe(2);
    });
  });
});
