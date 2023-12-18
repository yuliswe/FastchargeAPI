/**
 * Set up console so that it prints a line stating where the console.log is used.
 * Note that this is pretty slow and shouldn't be used in production.
 */
export function setUpTraceConsole() {
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  console.log = (...params) => {
    const stacktrace = new Error().stack?.split("\n") ?? [];
    originalConsoleLog(...params);
    originalConsoleLog(stacktrace.at(2));
  };

  console.warn = (...params) => {
    const stacktrace = new Error().stack?.split("\n") ?? [];
    originalConsoleWarn(...params);
    originalConsoleWarn(stacktrace.at(2));
  };

  console.error = (...params) => {
    const stacktrace = new Error().stack?.split("\n") ?? [];
    originalConsoleError(...params);
    originalConsoleError(stacktrace.at(2));
  };
}
