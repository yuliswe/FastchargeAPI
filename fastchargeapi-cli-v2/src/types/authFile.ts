export type AuthFileContent = {
  idToken: string;
  refreshToken: string;
  userPK: string;
  email: string;
  issuer: "firebase" | "fastchargeapi" | string;
};

export type RefreshIdTokenResult = {
  idToken: string;
  refreshToken: string;
};

export type VerifyIdTokenResult = {
  email: string;
};
