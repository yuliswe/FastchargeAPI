import { writeFile } from "fs/promises";

async function main(args: string[]) {
  const [file] = args;
  const content = JSON.stringify(
    {
      GatewayFunction: process.env,
    },
    null,
    2
  );
  if (file) {
    await writeFile(file, content, "utf-8");
  } else {
    console.log(content);
  }
}

main(process.argv.slice(2)).catch((e) => {
  console.error(e);
  process.exit(1);
});
