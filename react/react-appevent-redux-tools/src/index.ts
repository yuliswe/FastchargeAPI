import { program } from "commander";
import fs from "fs";
import { exit } from "process";
import readline from "readline";

let Rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
program
    .argument("<component name>", "Name of the component to create")
    .action((ComponentName: string) => {
        ComponentName = ComponentName[0].toUpperCase() + ComponentName.slice(1);

        let outDirs = ["./src", "./src/connected-components", "./src/states"];

        for (let d of outDirs) {
            if (!fs.existsSync(d)) {
                console.error(`Directory ${d} does not exist`);
                exit(1);
            }
        }

        let outfileList = [
            `${outDirs[1]}/${ComponentName}Page.tsx`,
            `${outDirs[2]}/${ComponentName}AppState.ts`,
        ];

        for (let f of outfileList) {
            if (fs.existsSync(f)) {
                console.error(`File ${f} already exists`);
                exit(1);
            }
        }

        for (let f of outfileList) {
            console.log(`Creating ${f}`);
            // console.log();
            // Rl.question("Continue? (y/n)", (ans) => {
            //     if (ans.trim().toLowerCase() !== "y") {
            //         console.log("Aborted.");
            //         exit(0);
            //     }
            // });
        }

        fs.writeFileSync(
            outfileList[0],
            createConnectedComponent(ComponentName)
        );

        fs.writeFileSync(outfileList[1], createAppState(ComponentName));
    });

program.parse();

function createConnectedComponent(ComponentName: string) {
    let componentName = ComponentName[0].toLowerCase() + ComponentName.slice(1);
    return `
import React from "react";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";

type _State = {};

type _Props = {
    appState: ${ComponentName}AppState;
};

class _${ComponentName}Page extends React.Component<_Props, _State> {
    constructor(props: _Props) {
        super(props);
        this.state = {};
    }
}

export const ${ComponentName}Page = connect<_Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        appState: rootAppState.${componentName},
    })
)(_${ComponentName}Page);
`;
}

function createAppState(ComponentName: string) {
    return `
import { AppState, PartialProps } from "react-appevent-redux";

export class ${ComponentName}AppState extends AppState {
    constructor(props: PartialProps<${ComponentName}AppState>) {
        super();
        this.assignProps(props);
    }
}
`;
}
