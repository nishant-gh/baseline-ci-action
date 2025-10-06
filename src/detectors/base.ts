import type { Node } from '@babel/traverse';
import type { Root } from 'postcss';

/**
 * Detected feature result
 */
export interface DetectedFeature {
  name: string;
  type: 'js' | 'css';
  file: string;
  line?: number;
}

/**
 * Context provided to JavaScript detectors
 */
export interface JSDetectionContext {
  code: string;
  filename: string;
  ast: Node;
}

/**
 * Context provided to CSS detectors
 */
export interface CSSDetectionContext {
  code: string;
  filename: string;
  root: Root;
}

/**
 * Base interface for all feature detectors
 */
export interface FeatureDetector {
  /**
   * Unique identifier for this feature (should match web-features ID)
   */
  id: string;

  /**
   * Type of code this detector analyzes
   */
  type: 'js' | 'css';

  /**
   * Human-readable name for this feature
   */
  name: string;

  /**
   * Optional: web-features package ID for baseline lookup
   */
  webFeaturesId?: string;

  /**
   * Detect the feature in the provided context
   */
  detect(context: JSDetectionContext | CSSDetectionContext): DetectedFeature[];
}

/**
 * Type guard for JS detection context
 */
export function isJSContext(
  context: JSDetectionContext | CSSDetectionContext
): context is JSDetectionContext {
  return 'ast' in context;
}

/**
 * Type guard for CSS detection context
 */
export function isCSSContext(
  context: JSDetectionContext | CSSDetectionContext
): context is CSSDetectionContext {
  return 'root' in context;
}
