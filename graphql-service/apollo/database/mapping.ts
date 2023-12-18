declare module "dynamoose/dist/Model" {
  interface Model<T> {
    easy: {
      easySetMethod<R>(name: string, handle: (...args: unknown[]) => R | Promise<R>): void;
      easySetItemMethod<R>(name: string, handle: (item: T, ...args: unknown[]) => R | Promise<R>): void;
    };
  }
}

// declare global {
//     interface Array<T> {
//         mapToGQL<GQLType>(): Promise<Array<GQLType>>
//     }
// }

// export function addItemMethods() {
//     Array.prototype["mapToGQL"] = async function () {
//         return Promise.all(this.map(x => x.toGQL()));
//     }
// }

// export function toResolver<R>(toGQL: typeof App.prototype.toGQL): R {
//     return new Proxy({}, {
//         get(target, prop) {
//             return async function (parent, args, context, info) {
//                 return await toGQL(parent, args, context, info)[prop];
//             }
//         }
//     }) as any
// }
