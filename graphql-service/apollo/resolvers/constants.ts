/**
 * This file contains all the constants used in the resolvers
 */

// Parameter names stored in Systems Manager Parameter Store.
export const PRIVATE_KEY_PARAM_NAME = "fastcharge.user.token.secret.key";
export const PUBLIC_KEY_PARAM_NAME = "fastcharge.user.token.public.key";
export const USER_APP_TOKEN_EXPIRATION = "999999d";
export const USER_APP_TOKEN_HASH_ALGORITHM = "ES256";
export const USER_APP_TOKEN_ISSUER = "fastcharge";