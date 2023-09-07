process.env.SILENCE_ERRORS = ["BAD_USER_INPUT", "IMMUTABLE_RESOURCE", "TOO_MANY_RESOURCES"].join(",");
process.env.DISABLE_WARNINGS = "1";
process.env.LOCAL_SQS = "1";
process.env.NODE_OPTIONS = "--experimental-specifier-resolution=node";
