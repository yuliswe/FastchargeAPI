import { AuthFileContent } from "src/types/authFile";

export function getExampleAuthFileContent(): AuthFileContent {
  return {
    idToken: "exampleIdToken",
    refreshToken: "exampleRefreshToken",
    userPK: "exampleUserPK",
    email: "exampleEmail",
    issuer: "fastchargeapi",
  };
}
