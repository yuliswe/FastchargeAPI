export type SimplifiedGQLErrorExtensions = {};

export type AlreadyExistsSimpleGQLErrorExtensions = SimplifiedGQLErrorExtensions & {
  resource: string;
  query: object;
};

export type BadUserInputSimpleGQLErrorExtensions = SimplifiedGQLErrorExtensions & {
  field: string;
};

export type ImmutableResourceSimpleGQLErrorExtensions = SimplifiedGQLErrorExtensions & {
  resource: string;
};

export type NotFoundSimpleGQLErrorExtensions = SimplifiedGQLErrorExtensions & {
  resource: string;
  query: object;
};

export type PermissionDeniedSimpleGQLErrorExtensions = SimplifiedGQLErrorExtensions & {};

export type TooManyResourcesSimpleGQLErrorExtensions = SimplifiedGQLErrorExtensions & {};

export type ResourceDeletedSimpleGQLErrorExtensions = SimplifiedGQLErrorExtensions & {
  resource: string;
  query: object;
};
