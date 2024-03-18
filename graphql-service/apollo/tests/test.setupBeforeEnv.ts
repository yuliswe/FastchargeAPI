process.env = {
  ...process.env,
  NODE_OPTIONS: "--experimental-specifier-resolution=node",
  SILENCE_ERRORS: ["BAD_USER_INPUT", "IMMUTABLE_RESOURCE", "TOO_MANY_RESOURCES"].join(","),
  TRUST_X_IS_SERVICE_REQUEST_HEADER: "1",
  TRUST_X_USER_PK_HEADER: "1",
  TRUST_X_USER_EMAIL_HEADER: "1",
};
