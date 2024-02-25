export async function waitForPromises(cycleCount = 1) {
  for (let i = 0; i < cycleCount; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

export async function waitUntil(predicate: () => boolean | Promise<boolean>) {
  while (!(await predicate())) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
