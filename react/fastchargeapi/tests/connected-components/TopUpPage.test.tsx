import renderer, { act } from "react-test-renderer";
import { App } from "src/App";
import { RouteURL } from "src/routes";
import { loginAsNewAnonymousUser } from "tests/auth";
import { getRouterSpy } from "tests/route";
import { waitForPromises } from "tests/utils";

describe("TopUpPage", () => {
  it("redirects to login page if user is not logged in", async () => {
    loginAsNewAnonymousUser();

    const router = getRouterSpy({
      fullpath: RouteURL.topUpPage({
        query: {
          amount: "100",
        },
      }),
    });

    renderer.create(<App />);

    await act(async () => {
      await waitForPromises(10);
    });

    expect(router.navigate.mock.calls).toMatchSnapshot();
  });
});
