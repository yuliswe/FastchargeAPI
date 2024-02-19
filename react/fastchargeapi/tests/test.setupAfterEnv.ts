import * as AppModule from "src/App";
import * as firebaseModule from "src/firebase";

beforeEach(() => {
  jest.spyOn(firebaseModule, "initializeFirebase").mockImplementation();
  jest.spyOn(AppModule, "sendPing").mockImplementation(async () => {
    console.log("mock sendPing");
    await Promise.resolve();
  });
});
