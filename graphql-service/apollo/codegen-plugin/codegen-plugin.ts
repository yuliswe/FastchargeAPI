import { GraphQLSchema } from "graphql";

export function plugin(schema: GraphQLSchema, documents, config) {
    let lines = [];
    // for (let typeName in schema.getTypeMap()) {
    //     let type = schema.getType(typeName);
    //     lines.push("const a = " + JSON.stringify(type) + ";")
    // }
    let type = schema.getType("App");
    let fields = Object.values(type['_fields'])
    // console.log(fields['endpoints'])
    // console.log(fields)
    for (let field of fields) {
        let fieldName = field['name']
        let fieldType = field['type']
        console.log(field)
    }
    return lines.join("\n\n");
}
