import esbuild from "esbuild";

await esbuild.build({
    entryPoints: [
        "./handlers/AcceptStripePayment.ts",
        "./handlers/CreateStripeTransfer.ts",
        "./handlers/GetStripeCheckoutLink.ts",
        "./handlers/SendStripeDashboardLink.ts",
        "./handlers/CorsHandler.ts",
        "./handlers/FinishStripeOnboard.ts",
        "./handlers/GetStripeOnBoardLink.ts",
    ],
    bundle: true,
    outdir: "./dist",
    platform: "node",
    target: "node18",
    loader: {
        ".graphql": "text",
        ".hbs": "text",
    },
});
