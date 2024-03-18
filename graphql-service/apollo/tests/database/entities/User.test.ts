import { User } from "@/src/database/entities/User";
import { getEntityManager } from "@typedorm/core";
import * as uuid from "uuid";

const entityManager = getEntityManager();

describe("User", () => {
  it("creates a user", async () => {
    const user = new User({
      uid: `uid-${uuid.v4()}`,
      email: `email-${uuid.v4()}`,
    });
    const response = await entityManager.create(user);
    expect(response).toEqual(user);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it("gets a user", async () => {
    const user = new User({
      uid: `uid-${uuid.v4()}`,
      email: `email-${uuid.v4()}`,
    });
    await entityManager.create(user);
    const response = await entityManager.findOne(User, { uid: user.uid });
    expect(response).toEqual(user);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });
});
