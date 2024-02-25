import { tiChecker } from "src/tiChecker";

const _envs = tiChecker.EnvVars.from(
  Object.fromEntries(Object.entries(process.env).map(([k, v]) => [k.replace("REACT_APP_", ""), v || undefined]))
);
export const envVars = {
  ..._envs,
  DEV_DOMAIN: _envs.DEV_DOMAIN === "1",
  LOCAL_GRAPHQL: _envs.LOCAL_GRAPHQL === "1",
  LOCAL_DOC: _envs.LOCAL_DOC === "1",
};

export const baseDomain = envVars.DEV_DOMAIN ? "devfastchargeapi.com" : "fastchargeapi.com";
export const graphqlURL = envVars.LOCAL_GRAPHQL ? "http://localhost:4000" : `https://api.graphql.${baseDomain}`;
export const paymentServiceBaseURL = `https://api.v2.payment.${baseDomain}`;
