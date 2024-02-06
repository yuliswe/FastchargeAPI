import { promises as fs } from "fs";
import { glob } from "glob";
import { decodeProtectedHeader, importX509, errors as joseErrors, jwtVerify } from "jose";
import fetch from "node-fetch";
import os from "os";
import path from "path";
import { graphql } from "src/__generated__/gql";
import { authServiceHost } from "src/env";
import { getGQLClient } from "src/graphqlClient";
import { tiChecker } from "src/tiChecker";
import { AuthFileContent, RefreshIdTokenResult, VerifyIdTokenResult } from "src/types/authFile";

export async function getGoogleCert(): Promise<{ [hash: string]: string }> {
  const response = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
  );
  return (await response.json()) as { [hash: string]: string };
}

export function getAuthFilePath(profile?: string): string {
  const home = os.homedir();
  if (profile) {
    return path.join(home, ".fastcharge", `auth.${profile}.json`);
  }
  return path.join(home, ".fastcharge", "auth.json");
}

export async function listAuthFiles(): Promise<string[]> {
  const home = os.homedir();
  return await glob([path.join(home, ".fastcharge", "auth.*.json"), path.join(home, ".fastcharge", "auth.json")]);
}

export async function deleteAuthFile(profile?: string) {
  const authFilePath = getAuthFilePath(profile);
  await fs.access(authFilePath);
  await fs.unlink(authFilePath);
}

export async function readAuthFile(profile?: string): Promise<AuthFileContent> {
  const authFilePath = getAuthFilePath(profile);
  const authFileContent = await fs.readFile(authFilePath, "utf-8");
  const auth = tiChecker.AuthFileContent.from(JSON.parse(authFileContent));
  auth.issuer = auth.issuer || "firebase";
  return auth;
}

/**
 * Partially update the auth file context, or create a new auth file with the
 * specified content.
 */
export async function writeToAuthFile(
  profile: string | undefined,
  content: Partial<AuthFileContent>
): Promise<AuthFileContent> {
  const authFilePath = getAuthFilePath(profile);
  await fs.mkdir(path.dirname(authFilePath), { recursive: true });
  let currentAuthFile;
  try {
    currentAuthFile = await readAuthFile(profile);
  } catch {
    currentAuthFile = null;
  }
  // default issuer to firebase
  const newAuthFile = { issuer: "firebase", ...currentAuthFile, ...content };
  await fs.writeFile(authFilePath, JSON.stringify(newAuthFile, null, 2));
  await fs.chmod(authFilePath, 0o600);
  return tiChecker.AuthFileContent.from(newAuthFile);
}

export type VerifyOrRefreshIdTokenResult = {
  refreshed: boolean;
  idToken: string;
  refreshToken: string;
  email: string;
};

export async function refreshIdToken(refreshToken: string): Promise<RefreshIdTokenResult> {
  const resp = await fetch(`${authServiceHost}/refresh-idtoken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken: refreshToken }),
  });

  if (!resp.ok) {
    throw new Error("Unable to refresh id token. " + (await resp.text()));
  }

  return tiChecker.RefreshIdTokenResult.from(await resp.json());
}

export async function verifyIdToken(idToken: string): Promise<VerifyIdTokenResult> {
  const { kid, alg } = decodeProtectedHeader(idToken);

  if (!kid) {
    throw new Error("No kid found in id token.");
  }

  if (!alg) {
    throw new Error("No alg found in id token.");
  }

  const certs = await getGoogleCert();
  const cert = certs[kid];
  if (!cert) {
    throw new Error("No cert found for kid. Google may have rotated the cert and your id token is expired.");
  }

  const key = await importX509(cert, alg);

  try {
    const { payload } = await jwtVerify(idToken, key);
    return tiChecker.VerifyIdTokenResult.from(payload);
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) {
      throw new Error("Id token expired.");
    }
    throw new Error("Invalid id token. ");
  }
}

export async function verifyOrRefreshIdToken(args: {
  idToken: string;
  refreshToken: string;
  forceRefresh?: boolean;
}): Promise<VerifyOrRefreshIdTokenResult> {
  const { idToken, refreshToken, forceRefresh } = args;
  if (forceRefresh) {
    const newToken = await refreshIdToken(refreshToken);
    const { email } = await verifyIdToken(newToken.idToken);
    return {
      email,
      idToken: newToken.idToken,
      refreshToken: newToken.refreshToken,
      refreshed: true,
    };
  } else {
    try {
      const { email } = await verifyIdToken(idToken);
      return {
        email,
        idToken,
        refreshToken,
        refreshed: false,
      };
    } catch (e) {
      const newToken = await refreshIdToken(refreshToken);
      const { email } = await verifyIdToken(newToken.idToken);
      return {
        email: email,
        idToken: newToken.idToken,
        refreshToken: newToken.refreshToken,
        refreshed: true,
      };
    }
  }
}

/**
 * Gets the id token from the auth file. If the file doesn't exist, returns
 * None. If the id token is issued by Firebase, verifies the token. If the id
 * token is invalid, refreshes it and returns the new id token. If unable to
 * refresh, return None. If the id token is not issued by FastchargeAPI, skips
 * the verification. The new id token and refresh token are written to the auth
 * file.
 */
export async function readOrRefreshAuthFile(args: {
  profile?: string;
  forceRefresh?: boolean;
}): Promise<AuthFileContent | null> {
  const { profile, forceRefresh } = args;
  const auth = await readAuthFile(profile);
  if (auth) {
    if (auth.issuer === "firebase") {
      const user = await verifyOrRefreshIdToken({ ...auth, forceRefresh });
      if (user && user.refreshed) {
        const resp = await getGQLClient(user).query({
          query: graphql(`
            query GetUserPKByEmail($email: Email!) {
              getUserByEmail(email: $email) {
                pk
              }
            }
          `),
          variables: { email: user.email },
        });
        const userPK = resp.data.getUserByEmail.pk;
        return await writeToAuthFile(profile, {
          idToken: user.idToken,
          refreshToken: user.refreshToken,
          email: user.email,
          userPK,
        });
      } else {
        return auth;
      }
    } else if (auth.issuer === "fastchargeapi") {
      return auth;
    } else {
      throw new Error(`Unknown issuer: ${auth.issuer}`);
    }
  }
  return null;
}
