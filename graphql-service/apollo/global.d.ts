/// <reference types="jest-extended" />

declare module "*.graphql" {
    const content: string;
    export default content;
}
