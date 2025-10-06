import type { FeatureDetector } from './base';

/**
 * Feature detector registry
 * Manages registration and retrieval of feature detectors
 */
export class DetectorRegistry {
  private detectors: Map<string, FeatureDetector> = new Map();

  /**
   * Register a feature detector
   */
  register(detector: FeatureDetector): void {
    if (this.detectors.has(detector.id)) {
      console.warn(
        `Detector with id "${detector.id}" is already registered. Overwriting.`,
      );
    }
    this.detectors.set(detector.id, detector);
  }

  /**
   * Register multiple detectors at once
   */
  registerAll(detectors: FeatureDetector[]): void {
    detectors.forEach((detector) => this.register(detector));
  }

  /**
   * Get a specific detector by ID
   */
  get(id: string): FeatureDetector | undefined {
    return this.detectors.get(id);
  }

  /**
   * Get all registered detectors
   */
  getAll(): FeatureDetector[] {
    return Array.from(this.detectors.values());
  }

  /**
   * Get all detectors of a specific type
   */
  getByType(type: 'js' | 'css'): FeatureDetector[] {
    return this.getAll().filter((detector) => detector.type === type);
  }

  /**
   * Check if a detector is registered
   */
  has(id: string): boolean {
    return this.detectors.has(id);
  }

  /**
   * Unregister a detector
   */
  unregister(id: string): boolean {
    return this.detectors.delete(id);
  }

  /**
   * Clear all registered detectors
   */
  clear(): void {
    this.detectors.clear();
  }

  /**
   * Get the number of registered detectors
   */
  get size(): number {
    return this.detectors.size;
  }
}

/**
 * Global detector registry instance
 */
export const registry = new DetectorRegistry();
