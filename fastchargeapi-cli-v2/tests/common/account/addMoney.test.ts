import { fastcharge } from "tests/utils";

describe("fastcharge account pay --help", () => {
  it("prints help", async () => {
    const { stdout, exitCode } = await fastcharge(["account", "pay", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout.getOutput()).toMatchSnapshot();
  });
});
