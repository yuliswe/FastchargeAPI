export async function waitForPromises(cycleCount = 1) {
  for (let i = 0; i < cycleCount; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
