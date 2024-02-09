import { tiChecker } from "src/tiChecker";

const baseDomain = process.env.DEV_DOMAIN === "1" ? "devfastchargeapi.com" : "fastchargeapi.com";
const awsAccountId = process.env.DEV_DOMAIN === "1" ? "209991057786" : "887279901853";
let graphqlHost = `https://api.graphql.${baseDomain}`;
let paymentServiceHost = `https://api.v2.payment.${baseDomain}`;
let authServiceHost = `https://api.v2.auth.${baseDomain}`;
let reactHost = `https://${baseDomain}`;

if (process.env.TEST === "1") {
  graphqlHost = "http://localhost:4001";
  paymentServiceHost = "http://localhost:3001";
  reactHost = "http://localhost:8001";
}

if (process.env.LOCAL_GRAPHQL === "1") {
  graphqlHost = "http://localhost:4000";
  console.log("Using local graphql");
}

if (process.env.LOCAL_PAYMENT === "1") {
  console.log("Using local Payment");
  paymentServiceHost = "http://localhost:3000";
}

if (process.env.LOCAL_REACT === "1") {
  console.log("Using local React");
  reactHost = "http://localhost:8000";
}

if (process.env.LOCAL_AUTH === "1") {
  console.log("Using local Auth");
  authServiceHost = "http://localhost:7000";
}

const _envVars = tiChecker.EnvVars.from(process.env);
const envVars = {
  DEV_DOMAIN: _envVars.DEV_DOMAIN === "1",
  TEST: _envVars.TEST === "1",
  LOCAL_GRAPHQL: _envVars.LOCAL_GRAPHQL === "1",
  LOCAL_PAYMENT: _envVars.LOCAL_PAYMENT === "1",
  LOCAL_REACT: _envVars.LOCAL_REACT === "1",
  LOCAL_AUTH: _envVars.LOCAL_AUTH === "1",
  SHOW_AUTH: _envVars.SHOW_AUTH === "1",
  LOG_REQUESTS: _envVars.LOG_REQUESTS === "1",
};

export { authServiceHost, awsAccountId, baseDomain, envVars, graphqlHost, paymentServiceHost, reactHost };
