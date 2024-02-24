import { getGraphQLAst } from "@/src/getGraphQLAst";
import { readFileSync, writeFileSync } from "fs";
import { print as printGraphQLAST } from "graphql/language/printer";

const sourceDSLPath = "./src/schema/Public.graphql";
const finalDSLPath = "./src/__generated__/Public.final.graphql";

writeFileSync(finalDSLPath, printGraphQLAST(getGraphQLAst(readFileSync(sourceDSLPath, "utf-8"))));
