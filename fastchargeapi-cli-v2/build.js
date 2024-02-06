import esbuild from "esbuild";
import path from "path";

async function build(sourceFile) {
  const outPath = path.join("./dist", sourceFile.replace(".ts", ".cjs").replace("src/", ""));

  console.log(`Building ${sourceFile} ~> ${outPath}`);

  await esbuild.build({
    entryPoints: [sourceFile],
    bundle: true,
    outfile: outPath,
    // format: "esm",
    minify: false,
    platform: "node",
    sourcemap: true,
    plugins: [],
  });
}

for (const file of ["./src/fastapi.ts", "./src/fastcharge.ts"]) {
  await build(file);
}
