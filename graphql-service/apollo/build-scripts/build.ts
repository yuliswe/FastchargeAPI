import * as esbuild from "esbuild";

esbuild.buildSync({
    entryPoints: ["./lambdaHandler.ts", "./sqsHandler.ts", "devserver.ts"],
    bundle: true,
    outdir: "./dist",
    platform: "node",
    target: "node18",
    format: "cjs",
    sourcemap: true,
    loader: {
        ".graphql": "text",
        ".hbs": "text",
    },
    outExtension: {
        ".js": ".cjs",
    },
});
