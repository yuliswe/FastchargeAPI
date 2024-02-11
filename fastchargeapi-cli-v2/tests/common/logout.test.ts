import { fastapi, fastcharge } from "tests/utils";

describe("fastcharge logout --help", () => {
  it("prints help message", async () => {
    const { stdout, exitCode } = await fastcharge(["logout", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout.getOutput()).toMatchSnapshot();
  });
});

describe("fastapi logout --help", () => {
  it("prints help message", async () => {
    const { stdout, exitCode } = await fastapi(["logout", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout.getOutput()).toMatchSnapshot();
  });
});

it("fastcharge logout", async () => {
  const { stdout, exitCode } = await fastcharge(["logout"]);
  expect(exitCode).toBe(0);
  expect(stdout.getOutput()).toMatchSnapshot();
});

it("fastapi logout", async () => {
  const { stdout, exitCode } = await fastapi(["logout"]);
  expect(exitCode).toBe(0);
  expect(stdout.getOutput()).toMatchSnapshot();
});
