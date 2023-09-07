import esbuild from "esbuild";

await esbuild.build({
    entryPoints: ["./lambdaHandler.ts", "./sqsHandler.ts", "./cron-jobs/settleAccountActivities.ts", "devserver.ts"],
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
