import React, { useContext, useRef } from "react";
import { LinkProps as RouterLinkProps, matchPath } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { ReactAppContextType } from "./AppContext";
import { routeDataFetchers } from "./routes";

export const LinkBehavior = React.forwardRef<
  HTMLAnchorElement,
  Omit<RouterLinkProps, "to"> & {
    href: RouterLinkProps["to"];
    isHash: boolean;
  }
>(({ href, ...other }, ref) => {
  const originalLinkRef = useRef<HTMLAnchorElement>(null);
  // This is the hidden link that used to obtain the original behavior of HashLink.
  const originalLink = <HashLink ref={originalLinkRef} to={href} {...other} style={{ display: "none" }} />;
  // This is the link that's actually displayed and being clicked on. This
  // is modified so that we can add our own behavior.
  const context = useContext(ReactAppContextType);
  const displayLink = (
    <HashLink
      ref={ref}
      to={href}
      {...other}
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onClick={async (event) => {
        // If the user has their own onClick handler, call it.
        if (other.onClick) {
          other.onClick(event);
          return;
        }
        // In this Link we inject our own logic so that before a
        // route change, the next page's data is fetched before the
        // route is changed.
        event.preventDefault();
        const url = new URL(href.toString(), window.location.origin);
        let found = false;
        // Look in the routeDataFetchers to find the matching data
        // fetching function.
        for (const { path, fetchData } of routeDataFetchers) {
          const match = matchPath(path, url.pathname);
          if (match) {
            const queryParams = url.searchParams;
            context.loading.setIsLoading(true); // Show loading progress bar.
            await fetchData(context, match.params, queryParams.entries());
            context.loading.setIsLoading(false); // Hide loading progress bar.
            originalLinkRef.current?.click(); // Click the orignal link.
            found = true;
            break;
          }
        }
        if (!found) {
          // If no data fetching function is found, just click the
          // original link.
          originalLinkRef.current?.click();
        }
      }}
    />
  );
  return (
    <React.Fragment>
      {originalLink}
      {displayLink}
    </React.Fragment>
  );
});
