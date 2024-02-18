import { AppContext } from "./AppContext";

export async function fetchWithAuth(context: AppContext, url: RequestInfo, options?: RequestInit) {
  const user = await context.firebase.userPromise;
  if (!options) {
    options = {};
  }
  if (!options.headers) {
    options.headers = {};
  }
  options.mode = "cors";
  (options.headers as { [key: string]: string })["Authorization"] = await user.getIdToken();
  return fetch(url, options);
}
