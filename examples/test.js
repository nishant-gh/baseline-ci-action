// Example file showing various web features for testing Baseline CI
// This file demonstrates features across different Baseline status categories

// Widely available features (safe to use)
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map((n) => n * 2);
console.log(doubled);

// Modern array methods (check baseline status)
const lastItem = numbers.at(-1);
const lastEven = numbers.findLast((n) => n % 2 === 0);

// Promise features (may have limited availability)
async function example() {
  try {
    const result = await Promise.try(() => {
      return fetchData();
    });
    return result;
  } catch (error) {
    console.error(error);
  }
}

// Promise.withResolvers (newer feature)
function createDeferredPromise() {
  const { promise, resolve, reject } = Promise.withResolvers();
  return { promise, resolve, reject };
}

// Object.groupBy (newer feature - limited availability)
const people = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: 'Charlie', age: 30 },
];
const grouped = Object.groupBy(people, (person) => person.age);

// Crypto API (widely available)
const uuid = crypto.randomUUID();

// Helper function
function fetchData() {
  return fetch('https://api.example.com/data').then((res) => res.json());
}

export { example, createDeferredPromise, grouped, uuid, fetchData };
