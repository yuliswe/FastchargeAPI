import { createCommonLoginCommand } from "src/common/login";
import { createCommonLogoutCommand } from "src/common/logout";
import { createCommand } from "src/utils/command";

export const createFastapiProgram = () => {
  const program = createCommand({ name: "fastapi", summary: "fastapi cli", description: "fastapi cli" });
  return program
    .version("0.0.1")
    .usage("[global-options] command")
    .option("--profile <name>", "Run command as a specific user")
    .addCommand(createCommonLoginCommand(program))
    .addCommand(createCommonLogoutCommand(program));
};
