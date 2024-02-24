import { DocumentNode, ObjectTypeDefinitionNode, parse } from "graphql";

export function getGraphQLAst(schemaContent: string) {
  // Perform a hacking here by ading all root queries into the root mutation.
  const publicSchema = parse(schemaContent);
  const mutationDefs = publicSchema.definitions.find(
    (def) => def.kind === "ObjectTypeDefinition" && def.name.value === "Mutation"
  ) as ObjectTypeDefinitionNode;
  const queryDefs = publicSchema.definitions.find(
    (def) => def.kind === "ObjectTypeDefinition" && def.name.value === "Query"
  ) as ObjectTypeDefinitionNode;
  const otherTypeDefs = publicSchema.definitions.filter(
    (def) => !(def.kind === "ObjectTypeDefinition" && (def.name.value == "Mutation" || def.name.value === "Query"))
  );
  const newMutationDefs = { ...mutationDefs, fields: [...(mutationDefs.fields ?? []), ...(queryDefs.fields ?? [])] };
  const newPublicSchmema: DocumentNode = {
    ...publicSchema,
    definitions: [newMutationDefs, queryDefs, ...otherTypeDefs],
  };
  return newPublicSchmema;
}
