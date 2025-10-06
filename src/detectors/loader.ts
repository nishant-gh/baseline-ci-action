import { registry } from './registry';

// Import feature detectors
import promiseTryDetector from './features/promise-try';
import promiseWithResolversDetector from './features/promise-withresolvers';
import arrayAtDetector from './features/array-at';
import containerQueriesDetector from './features/container-queries';
import cssHasPseudoDetector from './features/css-has-pseudo';

/**
 * Load all feature detectors into the registry
 */
export function loadDetectors(): void {
  registry.registerAll([
    promiseTryDetector,
    promiseWithResolversDetector,
    arrayAtDetector,
    containerQueriesDetector,
    cssHasPseudoDetector,
  ]);
}

/**
 * Initialize the detector system
 */
export function initialize(): void {
  loadDetectors();
}
