import { logoutCommand } from "src/common/logout";
import { createConsoleLogSpy } from "tests/utils";

describe("logoutCommand", () => {
  it("logs out", async () => {
    const consoleLogSpy = createConsoleLogSpy();
    await logoutCommand();
    expect(consoleLogSpy.getOutput()).toMatchSnapshot("console output");
  });
});
