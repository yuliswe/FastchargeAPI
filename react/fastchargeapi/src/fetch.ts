import { AppContext } from "./AppContext";

export async function fetchWithAuth(context: AppContext, url: RequestInfo, options?: RequestInit) {
  const u = await context.firebase.userPromise;
  if (!u) {
    throw new Error("fetchWithAuth: Not logged in");
  }
  if (!options) {
    options = {};
  }
  if (!options.headers) {
    options.headers = {};
  }
  options.mode = "cors";
  (options.headers as { [key: string]: string })["Authorization"] = await u.getIdToken();
  return fetch(url, options);
}
