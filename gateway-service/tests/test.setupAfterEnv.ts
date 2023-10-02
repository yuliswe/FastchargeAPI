import { mockSQS } from "@/tests/MockSQS";
import { afterEach, jest } from "@jest/globals";

if ((process.env.LOG || "0") !== "1") {
    jest.spyOn(global.console, "log").mockImplementation(() => jest.fn());
    jest.spyOn(global.console, "warn").mockImplementation(() => jest.fn());
    jest.spyOn(global.console, "error").mockImplementation(() => jest.fn());
}

if (process.env.LOCAL_SQS === "1") {
    afterEach(async () => {
        // Helps us catch all remaining errors in the sqs opeartions.
        await mockSQS.waitForQueuesToEmpty();
        mockSQS.reset();
    });
}
