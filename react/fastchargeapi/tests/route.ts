import { createMemoryRouter } from "react-router-dom";
import * as RoutesModule from "src/routes";
import { routes } from "src/routes";

export function getRouterSpy(args: { fullpath: string }) {
  const memRouter = createMemoryRouter(routes, {
    initialEntries: [args.fullpath],
    initialIndex: 0,
  });
  jest.spyOn(RoutesModule, "createRouter").mockReturnValue(memRouter);
  const navigateExternalSpy = jest.spyOn(RoutesModule, "navigateExternal");
  navigateExternalSpy.mockImplementation((href: string) => {
    console.log("navigateExternal", href);
  });
  return {
    ...memRouter,
    navigate: jest.spyOn(memRouter, "navigate"),
    navigateExternal: navigateExternalSpy,
  };
}