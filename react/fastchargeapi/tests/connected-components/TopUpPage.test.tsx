import { render, waitFor } from "@testing-library/react";
import { App } from "src/App";
import { RouteURL } from "src/routes";
import { loginAsNewAnonymousUser, loginAsNewTestUser } from "tests/auth";
import { getRouterSpy } from "tests/route";

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

    render(<App />);

    await waitFor(() => {
      expect(router.navigate.mock.calls).not.toEqual([]);
    });

    expect(router.navigate.mock.calls).toMatchSnapshot();
  });

  it("redirects to stripe if user is logged in", async () => {
    await loginAsNewTestUser();

    const router = getRouterSpy({
      fullpath: RouteURL.topUpPage({
        query: {
          amount: "100",
        },
      }),
    });

    render(<App />);

    await waitFor(
      () => {
        expect(router.navigateExternal.mock.calls).not.toEqual([]);
      },
      {
        timeout: 100_000,
      }
    );

    expect(router.navigateExternal.mock.calls[0][0]).toContain("https://checkout.stripe.com/c/pay/cs_test_");
  });
});
