import { fastcharge } from "tests/utils";

describe("fastcharge", () => {
  test("fastcharge --help", async () => {
    const { console, exitCode } = await fastcharge(["--help"]);
    expect(exitCode).toBe(0);
    expect(console.getOutput()).toMatchSnapshot();
  });
});
