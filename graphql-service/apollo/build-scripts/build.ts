import type { BuildOptions } from "esbuild";
import * as esbuild from "esbuild";

const buildOptions: BuildOptions = {
  bundle: true,
  outdir: "./dist",
  platform: "node",
  target: "node18",
  format: "cjs",
  sourcemap: true,
  minify: true,
  loader: {
    ".graphql": "text",
    ".hbs": "text",
  },
  outExtension: {
    ".js": ".cjs",
  },
};

esbuild.buildSync({
  entryPoints: ["devserver.ts"],
  ...buildOptions,
});

esbuild.buildSync({
  entryPoints: ["./src/lambdaHandler.ts", "./src/sqsHandler.ts"],
  outbase: "./src",
  ...buildOptions,
});
