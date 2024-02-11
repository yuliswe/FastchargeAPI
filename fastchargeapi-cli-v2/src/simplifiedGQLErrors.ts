import { ApolloError } from "@apollo/client";
import {
  AlreadyExistsSimpleGQLErrorExtensions,
  BadUserInputSimpleGQLErrorExtensions,
  ImmutableResourceSimpleGQLErrorExtensions,
  NotFoundSimpleGQLErrorExtensions,
  PermissionDeniedSimpleGQLErrorExtensions,
  ResourceDeletedSimpleGQLErrorExtensions,
  SimplifiedGQLErrorExtensions,
  TooManyResourcesSimpleGQLErrorExtensions,
} from "src/types/simplfiedGQLErrors";

type BaseSimplifiedGQLErrorProps<T extends SimplifiedGQLErrorExtensions> = {
  originalApolloError: ApolloError;
  extensions: T;
};

type SimplifiedGQLErrorProps = BaseSimplifiedGQLErrorProps<SimplifiedGQLErrorExtensions>;
export class SimplifiedGQLError extends Error implements SimplifiedGQLErrorExtensions {
  originalApolloError: ApolloError;

  constructor(props: SimplifiedGQLErrorProps) {
    const { extensions, originalApolloError } = props;
    super(originalApolloError.message);
    this.originalApolloError = originalApolloError;
    Object.assign(this, extensions);
  }
}

type AlreadyExistsSimpleGQLErrorProps = BaseSimplifiedGQLErrorProps<AlreadyExistsSimpleGQLErrorExtensions>;
export class AlreadyExistsSimpleGQLError extends SimplifiedGQLError implements AlreadyExistsSimpleGQLErrorExtensions {
  query: object;
  resource: string;
  constructor(props: AlreadyExistsSimpleGQLErrorProps) {
    super(props);
    Object.assign(this, props.extensions);
  }
}

type NotFoundSimpleGQLErrorProps = BaseSimplifiedGQLErrorProps<NotFoundSimpleGQLErrorExtensions>;
export class NotFoundSimpleGQLError extends SimplifiedGQLError implements NotFoundSimpleGQLErrorExtensions {
  resource: string;
  query: Record<string, unknown>;

  constructor(props: NotFoundSimpleGQLErrorProps) {
    super(props);
    Object.assign(this, props.extensions);
  }
}

type TooManyResourcesSimpleGQLErrorProps = BaseSimplifiedGQLErrorProps<TooManyResourcesSimpleGQLErrorExtensions>;
export class TooManyResourcesSimpleGQLError
  extends SimplifiedGQLError
  implements TooManyResourcesSimpleGQLErrorExtensions
{
  constructor(props: TooManyResourcesSimpleGQLErrorProps) {
    super(props);
    Object.assign(this, props.extensions);
  }
}

type PermissionDeniedSimpleGQLErrorProps = BaseSimplifiedGQLErrorProps<PermissionDeniedSimpleGQLErrorExtensions>;
export class PermissionDeniedSimpleGQLError
  extends SimplifiedGQLError
  implements PermissionDeniedSimpleGQLErrorExtensions
{
  constructor(props: PermissionDeniedSimpleGQLErrorProps) {
    super(props);
    Object.assign(this, props.extensions);
  }
}

type ImmutableResourceSimpleGQLErrorProps = BaseSimplifiedGQLErrorProps<ImmutableResourceSimpleGQLErrorExtensions>;
export class ImmutableResourceSimpleGQLError
  extends SimplifiedGQLError
  implements ImmutableResourceSimpleGQLErrorExtensions
{
  resource: string;
  constructor(props: ImmutableResourceSimpleGQLErrorProps) {
    super(props);
    Object.assign(this, props.extensions);
  }
}

type BadUserInputSimpleGQLErrorProps = BaseSimplifiedGQLErrorProps<BadUserInputSimpleGQLErrorExtensions>;
export class BadUserInputSimpleGQLError extends SimplifiedGQLError implements BadUserInputSimpleGQLErrorExtensions {
  field: string;
  constructor(props: BadUserInputSimpleGQLErrorProps) {
    super(props);
    Object.assign(this, props.extensions);
  }
}

type ResourceDeletedSimpleGQLErrorProps = BaseSimplifiedGQLErrorProps<ResourceDeletedSimpleGQLErrorExtensions>;
export class ResourceDeletedSimpleGQLError
  extends SimplifiedGQLError
  implements ResourceDeletedSimpleGQLErrorExtensions
{
  resource: string;
  query: object;
  constructor(props: ResourceDeletedSimpleGQLErrorProps) {
    super(props);
    Object.assign(this, props.extensions);
  }
}
