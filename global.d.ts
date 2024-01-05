declare module "*.graphql" {
  const content: string;
  export default content;
}

declare interface ObjectConstructor {
  keys<T>(o: T): (keyof T)[];
}
