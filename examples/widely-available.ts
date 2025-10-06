// This file uses features that are "widely" available in Baseline

// Array.prototype.at - Baseline: widely available since 2022
const arr = [1, 2, 3, 4, 5];
const lastItem = arr.at(-1);
const firstItem = arr.at(0);

// String.prototype.at - Baseline: widely available since 2022
const str = 'hello';
const lastChar = str.at(-1);

export { lastItem, firstItem, lastChar };
