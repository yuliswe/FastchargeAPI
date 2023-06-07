export const ENV_LOCAL_GRAPHQL = process.env.REACT_APP_LOCAL_GRAPHQL === "1";
export const ENV_DEV_DOMAIN = process.env.REACT_APP_DEV_DOMAIN === "1";
export const baseDomain = ENV_DEV_DOMAIN ? "devfastchargeapi.com" : "fastchargeapi.com";
export const graphqlURL = ENV_LOCAL_GRAPHQL ? "http://localhost:4000" : `https://api.graphql.${baseDomain}`;
export const paymentServiceBaseURL = `https://api.v2.payment.${baseDomain}`;
