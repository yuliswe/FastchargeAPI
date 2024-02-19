import { program } from "commander";
import fs from "fs";
import { exit } from "process";

program.argument("<component name>", "Name of the component to create").action((ComponentName: string) => {
  ComponentName = ComponentName[0].toUpperCase() + ComponentName.slice(1);

  let outDirs = ["./src", "./src/connected-components", "./src/states", "./src/events"];

  for (let d of outDirs) {
    if (!fs.existsSync(d)) {
      console.error(`Directory ${d} does not exist`);
      exit(1);
    }
  }

  let outfileList = [
    `${outDirs[1]}/${ComponentName}Page.tsx`,
    `${outDirs[2]}/${ComponentName}AppState.ts`,
    `${outDirs[3]}/${ComponentName}Event.ts`,
  ];

  for (let f of outfileList) {
    if (fs.existsSync(f)) {
      console.error(`File ${f} already exists`);
      exit(1);
    }
  }

  for (let f of outfileList) {
    console.log(`Creating ${f}`);
  }

  fs.writeFileSync(outfileList[0], createConnectedComponent(ComponentName));

  fs.writeFileSync(outfileList[1], createAppState(ComponentName));
  fs.writeFileSync(outfileList[2], createAppEvent(ComponentName));
  process.exit(0);
});

program.parse();

function getAppStateName(baseName: string) {
  return `${baseName}AppState`;
}

function getComponentName(baseName: string) {
  return `${baseName}Page`;
}

function getRootAppStatePropName(baseName: string) {
  return baseName[0].toLowerCase() + baseName.slice(1);
}

function getEventName(baseName: string) {
  return `${baseName}Event`;
}

function createConnectedComponent(baseName: string) {
  const componentName = getComponentName(baseName);
  const appStateName = getAppStateName(baseName);
  const rootAppStatePropName = getRootAppStatePropName(baseName);

  return `
import React from "react";
import { connect } from "react-redux";
import { ReactAppContextType, type AppContext } from "src/AppContext";
import { SiteLayout } from "src/SiteLayout";
import type { ${appStateName} } from "src/states/${appStateName}";
import { RootAppState } from "src/states/RootAppState";
import { reduxStore } from "src/store-config";

type _State = {};

type _Props = {
  appState: ${appStateName};
};

class _${componentName} extends React.PureComponent<_Props, _State> {
  static contextType = ReactAppContextType;
  get _context() {
    return this.context as AppContext;
  }

  constructor(props: _Props) {
    super(props);
    this.state = {};
  }

  static isLoading(): boolean {
    return false;
  }

  static async fetchData(context: AppContext, params: {}, query: {}): Promise<void> {
    return new Promise<void>((resolve) => {
      const unsub = reduxStore.subscribe(() => {
        if (!_${componentName}.isLoading()) {
          resolve();
          unsub();
          context.loading.setIsLoading(false);
        }
      });
    });
  }

  async componentDidMount(): Promise<void> {
    await _${componentName}.fetchData(this._context, {}, {});
  }

  render(): React.ReactNode {
    return <SiteLayout>
      // TODO: Implement render
    </SiteLayout>;
  }
}

export const ${componentName} = connect<_Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
  appState: rootAppState.${rootAppStatePropName},
}))(_${componentName});
`;
}

function createAppState(baseName: string) {
  const appStateName = getAppStateName(baseName);
  return `
import { AppState, PartialProps } from "react-appevent-redux";

export class ${appStateName} extends AppState {
    constructor(props: PartialProps<${appStateName}>) {
        super();
        this.assignProps(props);
    }
}
`;
}

function createAppEvent(ComponentName: string) {
  return `
import { AppState, PartialProps } from "react-appevent-redux";

class Example${ComponentName}Event extends AppEvent<RootAppState> {
    constructor(public context: AppContext, public options: {}) {
        super();
    }
    reducer(state: RootAppState): RootAppState {
        throw new Error("Method not implemented.");
    }
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        // TODO: Implement reducer
    }
    reducerAfter(state: RootAppState): RootAppState {
        return state;
    }
}

export const ${ComponentName}Event = {
    Example${ComponentName}Event,
}
`;
}
