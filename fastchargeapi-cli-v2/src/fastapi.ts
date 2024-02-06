import { createFastapiProgram } from "src/fastapi/program";

const program = createFastapiProgram();
program.parse(process.argv);
