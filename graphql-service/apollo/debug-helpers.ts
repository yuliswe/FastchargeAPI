export function getTrace() {
    Error.stackTraceLimit = Infinity;
    const originalStackTrace = new Error().stack;
    const lines = originalStackTrace?.split("\n");
    const trace = lines?.slice(2).join("\n");
    return trace;
}
