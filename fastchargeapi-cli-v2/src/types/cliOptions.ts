export type CliGlobalOptions = {
  profile?: string;
};

export type CliCommonLoginCommandOptions = {
  profile?: string;
};

export type CliCommonLogoutCommandOptions = {
  profile?: string;
};

export type CliFastchargeAppListCommandOptions = {};

export enum AppVisibility {
  Private = "private",
  Public = "public",
}

export type CliFastchargeAppCreateCommandOptions = {
  name: string;
  title?: string;
  description?: string;
  repository?: string;
  homepage?: string;
  visibility?: AppVisibility;
  logo?: string;
};

export type CliFastchargeAppUpdateCommandOptions = {
  title?: string;
  description?: string;
  repository?: string;
  homepage?: string;
  visibility?: AppVisibility;
  logo?: string;
  readme?: string;
};

export type CliFastchargeAppDeleteCommandOptions = {};

export type CliCommonAddMoneyCommandOptions = {
  amount: number;
};

export type CliCommonWithdrawMoneyCommandOptions = {
  amount: number;
  yes?: boolean;
};

export type CliFastchargeApiAddCommandOptions = {
  app: string;
  method: HttpMethod;
  path: string;
  destination: string;
  description?: string;
};

export enum HttpMethod {
  Delete = "DELETE",
  Get = "GET",
  Head = "HEAD",
  Options = "OPTIONS",
  Patch = "PATCH",
  Post = "POST",
  Put = "PUT",
}

export type CliFastchargeApiUpdateCommandOptions = {
  method: HttpMethod;
  path: string;
  destination: string;
  description?: string;
};
