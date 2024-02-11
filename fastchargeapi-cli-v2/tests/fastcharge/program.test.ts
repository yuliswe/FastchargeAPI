import { fastcharge } from "tests/utils";

describe("fastcharge --help", () => {
  test("prints help message", async () => {
    const { stdout, exitCode } = await fastcharge(["--help"]);
    expect(exitCode).toBe(0);
    expect(stdout.getOutput()).toMatchSnapshot();
  });
});
