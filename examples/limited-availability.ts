// This file uses features with limited availability

// Promise.try - Not yet in Baseline (limited availability)
async function processData(data: unknown) {
  return Promise.try(() => {
    // Process data synchronously or asynchronously
    return JSON.parse(data as string);
  });
}

export { processData };
