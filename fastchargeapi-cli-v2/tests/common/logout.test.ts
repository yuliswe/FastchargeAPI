import { fastcharge } from "tests/utils";

describe("logoutCommand", () => {
  it("fastcharge logout", async () => {
    const { console, exitCode } = await fastcharge(["logout"]);
    expect(exitCode).toBe(0);
    expect(console.getOutput()).toMatchSnapshot();
  });

  it("fastapi logout", async () => {
    const { console, exitCode } = await fastcharge(["logout"]);
    expect(exitCode).toBe(0);
    expect(console.getOutput()).toMatchSnapshot();
  });
});
