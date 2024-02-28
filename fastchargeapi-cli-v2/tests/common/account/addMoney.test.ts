import { fastcharge } from "tests/utils";

describe("fastcharge account addmoney --help", () => {
  it("prints help", async () => {
    const { stdout, exitCode } = await fastcharge(["account", "addmoney", "--help"]);
    expect(stdout.getOutput()).toMatchSnapshot();
    expect(exitCode).toBe(0);
  });
});
