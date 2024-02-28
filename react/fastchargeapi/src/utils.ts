import { reduxStore } from "src/store-config";

export function resolveWhenFinishLoading(predicate: () => boolean, resolve: () => void) {
  const unsub = reduxStore.subscribe(() => {
    if (!predicate()) {
      resolve();
      unsub();
    }
  });
}
