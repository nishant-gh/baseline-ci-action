// This file uses features that are "newly" available in Baseline

// Promise.withResolvers - Baseline: newly available (low baseline)
const { promise, resolve, reject } = Promise.withResolvers();

setTimeout(() => {
  resolve('Done!');
}, 1000);

export { promise };
