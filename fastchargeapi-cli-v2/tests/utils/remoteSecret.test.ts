import { baseRequestContext as context } from "@/tests/test-utils/test-utils";
import { createSecret, getRemoteSecret, setRemoteSecret } from "src/utils/remoteSecret";
import * as uuid from "uuid";

describe("setRemoteSecret", () => {
  it("sets the remote secret", async () => {
    const key = uuid.v4();
    const result = setRemoteSecret({
      key,
      value: { value: "value" },
      jweSecret: createSecret(),
      jwtSecret: createSecret(),
    });
    await expect(result).resolves.toBeDefined();
    const dbSecret = context.batched.Secret.getOrNull({ key });
    await expect(dbSecret).resolves.not.toBeNull();
  });
});

describe("getRemoteSecret", () => {
  it("gets the remote secret", async () => {
    const key = uuid.v4();
    const value = { value: "value" };
    const jweSecret = createSecret();
    const jwtSecret = createSecret();
    await setRemoteSecret({
      key,
      value,
      jweSecret,
      jwtSecret,
    });
    const secret = getRemoteSecret({
      key,
      jweSecret,
      jwtSecret,
    });
    await expect(secret).resolves.toMatchObject(value);
  });
});
