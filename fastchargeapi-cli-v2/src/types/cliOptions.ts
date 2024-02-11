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
};
