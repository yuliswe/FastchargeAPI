import { readFileSync, writeFileSync } from "fs";
import { print as printGraphQLAST } from "graphql/language/printer";
import { getGraphQLAst } from "../getGraphQLAst";

const sourceDSLPath = "./schema/Public.graphql";
const finalDSLPath = "./__generated__/Public.final.graphql";

writeFileSync(finalDSLPath, printGraphQLAST(getGraphQLAst(readFileSync(sourceDSLPath, "utf-8"))));
