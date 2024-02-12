import { baseRequestContext as context } from "@/tests/test-utils/test-utils";
import { createSecret, getRemoteSecret, setRemoteSecret, waitForSecretContent } from "src/utils/remoteSecret";
import * as uuid from "uuid";

describe("setRemoteSecret", () => {
  it("sets the remote secret", async () => {
    const secretValue = { foo: "bar" };
    const key = uuid.v4();
    const result = setRemoteSecret({
      key,
      value: secretValue,
      jweSecret: createSecret(),
      jwtSecret: createSecret(),
    });
    await expect(result).resolves.toBeDefined();
    const dbSecret = await context.batched.Secret.getOrNull({ key });
    expect(dbSecret).toMatchObject({
      value: expect.any(String),
    });
  });
});

describe("getRemoteSecret", () => {
  it("gets the remote secret", async () => {
    const key = uuid.v4();
    const secretValue = { foo: "bar" };
    const jweSecret = createSecret();
    const jwtSecret = createSecret();
    await setRemoteSecret({
      key,
      value: secretValue,
      jweSecret,
      jwtSecret,
    });
    const secret = getRemoteSecret({
      key,
      jweSecret,
      jwtSecret,
    });
    await expect(secret).resolves.toEqual(secretValue);
  });
});

describe("waitForSecretContent", () => {
  it("waits for the secret content", async () => {
    const secretValue = { foo: "bar" };
    const result = waitForSecretContent({
      sendSecrets: async (args) => {
        const { key, jweSecret, jwtSecret } = args;
        await setRemoteSecret({
          key,
          value: secretValue,
          jweSecret,
          jwtSecret,
        });
      },
      timeoutSeconds: 10,
    });
    await expect(result).resolves.toEqual(secretValue);
  });
});
